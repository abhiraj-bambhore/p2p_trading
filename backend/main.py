"""
Project Flux-Agent — FastAPI Backend
✅ WebSocket real-time grid simulation
✅ REST API for manual commands
✅ Full agentic pipeline: Real Sentinel-2 → AutoGen → PyPSA → Llama 3.1 XAI
✅ Indian energy market: ₹/kWh, CEA CO2 factor, UP-Delhi microgrid
"""
from __future__ import annotations
import asyncio, json, logging, time
from typing import List, Set
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import HOST, PORT, WS_HEARTBEAT_INTERVAL, BASE_ENERGY_PRICE, CO2_KG_PER_KWH
from models import GridNode, TradeRecord, GridState, CloudForecast
from simulation import initialize_nodes, tick_nodes, WS_TICK, _demo_hour, generate_forecast_24h, generate_forecast_5d
from agents import run_auction
from governance import validate_and_sign_trades, detect_byzantine_nodes
from vision import get_cloud_forecast, trigger_manual_cloud_event, get_5day_weather_forecast
from xai import enrich_trades_with_explanations
from federated import run_federated_round
from blockchain import ledger as blockchain_ledger

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-12s | %(levelname)s | %(message)s",
)
log = logging.getLogger("main")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Project Flux-Agent — India AI Summit 2026 Demo",
    description=(
        "Autonomous P2P Solar Energy Orchestration. "
        "Real AutoGen agents + Sentinel-2 satellite data + PyPSA grid physics. "
        "Indian energy market: ₹/kWh, UP-Delhi microgrid, CEA CO2 baseline."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global State ─────────────────────────────────────────────────────────────
nodes: List[GridNode]          = initialize_nodes()
trade_log: List[TradeRecord]   = []
cloud_forecast: CloudForecast  = CloudForecast()
fl_models: dict                = {}
tick_count: int                = 0
cumulative_traded_kwh: float   = 0.0 # Running session total
cumulative_expenditure_inr: float = 0.0
has_sent_80_alert: bool        = False
connected_ws: Set[WebSocket]   = set()
_simulation_task               = None

# Dynamic safety settings (can be updated via API)
from config import DEFAULT_DAILY_EXPENDITURE_LIMIT
safety_limit_inr: float = DEFAULT_DAILY_EXPENDITURE_LIMIT

# 5-day weather cache
_weather_5d_cache: List[dict]  = []
_last_weather_fetch: float     = 0.0

# ─── Grid Metrics Helper ──────────────────────────────────────────────────────
def compute_grid_metrics() -> dict:
    from simulation import _demo_hour
    global cumulative_traded_kwh, cumulative_expenditure_inr, has_sent_80_alert, safety_limit_inr
    total_solar   = sum(n.solar_kw for n in nodes)
    total_load    = sum(n.load_kw  for n in nodes)
    co2_saved     = cumulative_traded_kwh * CO2_KG_PER_KWH
    # Money saved vs grid rate (₹/kWh)
    money_saved   = sum(
        (BASE_ENERGY_PRICE - t.price_kwh) * t.energy_kwh
        for t in trade_log[-200:]
    )
    return {
        "total_solar_kw":      round(total_solar, 2),
        "total_load_kw":       round(total_load, 2),
        "total_traded_kwh":    round(cumulative_traded_kwh, 3),
        "total_expenditure":   round(cumulative_expenditure_inr, 2),
        "safety_limit_inr":    safety_limit_inr,
        "safety_alert_sent":   has_sent_80_alert,
        "co2_saved_kg":        round(co2_saved, 2),
        "money_saved":         round(max(0, money_saved), 2),
        "tick":                tick_count,
        "demo_hour":           round(_demo_hour(), 2),
        "currency":            "INR",
        "grid_rate_per_kwh":   BASE_ENERGY_PRICE,
    }

@app.post("/api/safety")
async def update_safety(settings: dict):
    global safety_limit_inr
    from config import ALERT_EMAIL, SMTP_USER, SMTP_PASS
    
    if "daily_limit" in settings:
        safety_limit_inr = float(settings["daily_limit"])
    
    # Optionally update email if provided (though usually stored in .env)
    # This is for the demo to work without restarting backend
    if "email" in settings and settings["email"]:
        import config
        config.ALERT_EMAIL = settings["email"]
        
    log.info(f"🛡️ Safety settings updated: Limit=₹{safety_limit_inr}, Email={ALERT_EMAIL}")
    
    # Reset alert if new limit is higher than current spend
    global has_sent_80_alert, cumulative_expenditure_inr
    from config import ALERT_THRESHOLD_PCT
    if cumulative_expenditure_inr < (safety_limit_inr * ALERT_THRESHOLD_PCT):
        has_sent_80_alert = False
        
    return {"status": "ok", "limit": safety_limit_inr, "email": ALERT_EMAIL}

@app.post("/api/safety/test")
async def test_email():
    """Manually trigger a test email."""
    from dotenv import load_dotenv
    import config
    load_dotenv(override=True)
    # Re-sync config with environment
    import os
    config.SMTP_USER = os.getenv("SMTP_USER", config.SMTP_USER)
    config.SMTP_PASS = os.getenv("SMTP_PASS", config.SMTP_PASS)
    config.ALERT_EMAIL = os.getenv("ALERT_EMAIL", config.ALERT_EMAIL)

    from notifier import send_safety_alert
    global cumulative_expenditure_inr, safety_limit_inr
    success = await send_safety_alert(cumulative_expenditure_inr, safety_limit_inr)
    if success:
        return {"status": "ok", "message": "Test email sent!"}
    else:
        return {"status": "error", "message": "Failed to send email. Check logs/credentials."}



# ─── WebSocket Broadcast ──────────────────────────────────────────────────────
async def broadcast(payload: dict):
    dead = set()
    for ws in list(connected_ws):
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.add(ws)
    connected_ws.difference_update(dead)

# ─── Simulation Loop ──────────────────────────────────────────────────────────
async def simulation_loop():
    global nodes, cloud_forecast, fl_models, tick_count, trade_log, cumulative_traded_kwh, cumulative_expenditure_inr, has_sent_80_alert, _last_weather_fetch, _weather_5d_cache

    log.info("🚀 Simulation loop started.")
    fl_tick = 0

    while True:
        try:
            tick_count += 1
            fl_tick    += 1

            # 1️⃣  Vision: real Sentinel-2 cloud forecast (+ advection model)
            cloud_forecast = await get_cloud_forecast(nodes, tick_count)

            # 2️⃣  Simulation: tick physical state
            nodes = tick_nodes(nodes, cloud_forecast)

            # 3️⃣  Identify supply / demand
            suppliers = [n for n in nodes if n.role == "supply" and n.is_active]
            demanders = [n for n in nodes if n.role == "demand" and n.is_active]

            new_trades: List[TradeRecord] = []
            if suppliers and demanders:
                # 4️⃣  Agentic negotiation (real AutoGen or deterministic fallback)
                raw_trades = await run_auction(suppliers, demanders)

                log.info(f"DEBUG: raw_trades={len(raw_trades)}")
                # 5️⃣  Governance: PyPSA AC load-flow + cryptographic signing
                validated  = validate_and_sign_trades(raw_trades, nodes, cloud_forecast)
                log.info(f"DEBUG: validated={len(validated)}")

                # 6️⃣  XAI: Llama 3.1 explanations (Ollama) or rule-based fallback
                explained  = await enrich_trades_with_explanations(
                    validated, nodes, cloud_forecast
                )
                log.info(f"DEBUG: explained={(len(explained) if explained else 0)}")
                new_trades = explained
                trade_log.extend(new_trades)
                trade_log  = trade_log[-200:]

                # 6b️⃣  Blockchain: settle each trade on Hardhat (or in-memory fallback)
                for t in new_trades:
                    xai_note = getattr(t, "explanation", "") or ""
                    tx = blockchain_ledger.record_trade(t, xai_note)
                    if tx:
                        log.debug(f"⛓️  On-chain tx: {tx[:18]}...")
                
                # Update energy and monetary totals
                new_energy = sum(t.energy_kwh for t in new_trades)
                new_cost   = sum(t.price_kwh * t.energy_kwh for t in new_trades)
                
                cumulative_traded_kwh      += new_energy
                cumulative_expenditure_inr += new_cost
                
                log.info(f"✅ TICK {tick_count}: Committed {len(new_trades)} trades. Total Spend: ₹{cumulative_expenditure_inr:.2f}")

                # Check 80% threshold for Gmail alert
                from config import ALERT_THRESHOLD_PCT
                from notifier import send_safety_alert
                
                if not has_sent_80_alert and cumulative_expenditure_inr >= (safety_limit_inr * ALERT_THRESHOLD_PCT):
                    log.info(f"🚨 Safety Alert: Expenditure at {ALERT_THRESHOLD_PCT*100}% of ₹{safety_limit_inr}. Sending email...")
                    asyncio.create_task(send_safety_alert(cumulative_expenditure_inr, safety_limit_inr))
                    has_sent_80_alert = True

            # 7️⃣  Federated learning (every 30 ticks)
            if fl_tick >= 30:
                fl_models = run_federated_round(nodes, fl_models)
                fl_tick   = 0

            # 8️⃣  Broadcast to all WebSocket clients (with real weather analysis)
            metrics  = compute_grid_metrics()
            forecast_24h = generate_forecast_24h(_demo_hour(), cloud_forecast)
            
            # Periodically refresh 5-day meteorological forecast
            if time.time() - _last_weather_fetch > 1800: # every 30 mins
                from config import SENTINEL_LAT, SENTINEL_LON
                _weather_5d_cache = await get_5day_weather_forecast(SENTINEL_LAT, SENTINEL_LON)
                _last_weather_fetch = time.time()

            forecast_5d = generate_forecast_5d(_weather_5d_cache)
            
            payload = {
                "type":    "grid_update",
                "nodes":   [n.model_dump() for n in nodes],
                "trades":  [t.model_dump() for t in new_trades],
                "cloud":   cloud_forecast.model_dump(),
                "metrics": metrics,
                "forecast_24h": forecast_24h,
                "forecast_5d":  forecast_5d
            }
            await broadcast(payload)

        except Exception as e:
            log.error(f"Simulation error: {e}", exc_info=True)

        await asyncio.sleep(WS_TICK)


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    global nodes, _simulation_task
    nodes = initialize_nodes()
    log.info(f"✅ Grid initialized with {len(nodes)} nodes.")
    _simulation_task = asyncio.create_task(simulation_loop())


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_ws.add(ws)
    log.info(f"🔌 WebSocket client connected. Total: {len(connected_ws)}")
    try:
        # Send initial full state immediately
        metrics = compute_grid_metrics()
        await ws.send_text(json.dumps({
            "type":    "grid_update",
            "nodes":   [n.model_dump() for n in nodes],
            "trades":  [t.model_dump() for t in trade_log[-10:]],
            "cloud":   cloud_forecast.model_dump(),
            "metrics": metrics,
        }))
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        connected_ws.discard(ws)
        log.info(f"🔌 Client disconnected. Remaining: {len(connected_ws)}")


# ─── REST Endpoints ───────────────────────────────────────────────────────────
@app.get("/api/state")
async def get_state():
    return {
        "nodes":   [n.model_dump() for n in nodes],
        "trades":  [t.model_dump() for t in trade_log[-20:]],
        "cloud":   cloud_forecast.model_dump(),
        "metrics": compute_grid_metrics(),
    }

@app.get("/api/nodes")
async def get_nodes():
    return [n.model_dump() for n in nodes]

@app.get("/api/trades")
async def get_trades():
    return [t.model_dump() for t in trade_log[-50:]]

@app.get("/api/cloud")
async def get_cloud():
    return cloud_forecast.model_dump()

@app.get("/api/blockchain")
async def get_blockchain():
    """Returns on-chain transaction history and node connection status."""
    from blockchain import HardhatLedger
    history = blockchain_ledger.get_history()
    on_chain_count = 0
    connected = False
    if isinstance(blockchain_ledger, HardhatLedger):
        on_chain_count = blockchain_ledger.get_on_chain_count()
        connected      = blockchain_ledger.is_connected()
    return {
        "mode":           "hardhat" if connected else "in-memory",
        "connected":      connected,
        "on_chain_count": on_chain_count,
        "history":        history,
    }

@app.post("/api/reset")
async def reset_grid():
    global nodes, trade_log, fl_models, cumulative_traded_kwh, cumulative_expenditure_inr, has_sent_80_alert
    nodes     = initialize_nodes()
    trade_log = []
    fl_models = {}
    cumulative_traded_kwh = 0.0
    cumulative_expenditure_inr = 0.0
    has_sent_80_alert = False
    await broadcast({"type": "reset", "message": "Grid reset to initial state."})
    return {"status": "ok", "message": "Grid reset."}

@app.post("/api/trigger_cloud")
async def trigger_cloud():
    """Manually trigger a cloud event for demo purposes."""
    trigger_manual_cloud_event(coverage_pct=65.0)
    return {"status": "ok", "message": "Cloud event triggered!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "tick": tick_count, "nodes": len(nodes)}


# ─── Entrypoint ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False, log_level="info")
