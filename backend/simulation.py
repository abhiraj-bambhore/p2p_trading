"""
Simulation Engine — generates realistic, time-varying solar & load curves.
Uses DEMO TIME (locked to peak-solar window) so trades always fire.
"""
from __future__ import annotations
import math, random, time
from typing import List
from models import GridNode, NodeType, AgentRole, CloudForecast
from config import BASE_ENERGY_PRICE, MIN_BID_PRICE, MAX_BID_PRICE

# ── DEMO TIME: Lock to peak solar hour (10-14h) so trades always happen ───────
# Advances faster than wall-clock so users see the full day cycle quickly.
_demo_start_epoch = time.time()
_demo_start_hour  = 12.0   # start at 12 PM (peak solar)
DEMO_SPEED        = 4.0    # 1 real second = 4 sim minutes (360x realtime)

def _demo_hour() -> float:
    """Returns simulated hour of day (0-24) cycling every 6 real minutes."""
    elapsed_real_seconds = time.time() - _demo_start_epoch
    elapsed_sim_hours    = (elapsed_real_seconds * DEMO_SPEED) / 3600.0
    return (_demo_start_hour + elapsed_sim_hours) % 24.0


# ─── Preset node topology (Indian residential street, New Delhi) ──────────────
PRESET_NODES: List[dict] = [
    {"label": "House A (Solar)",    "node_type": NodeType.SOLAR,   "battery_max_kwh": 10, "owner_name": "Ravi Kumar",   "x_pos": 100, "y_pos": 150, "latitude": 12.9720, "longitude": 77.5940},
    {"label": "House B (Hybrid)",   "node_type": NodeType.HYBRID,  "battery_max_kwh": 15, "owner_name": "Priya Sharma", "x_pos": 350, "y_pos": 80,  "latitude": 12.9725, "longitude": 77.5945},
    {"label": "EV Station",         "node_type": NodeType.EV,      "battery_max_kwh": 40, "owner_name": "EV Hub",       "x_pos": 600, "y_pos": 150, "latitude": 12.9715, "longitude": 77.5950},
    {"label": "House C (Load)",     "node_type": NodeType.LOAD,    "battery_max_kwh": 5,  "owner_name": "Amit Patel",   "x_pos": 350, "y_pos": 320, "latitude": 12.9710, "longitude": 77.5935},
    {"label": "House D (Battery)",  "node_type": NodeType.BATTERY, "battery_max_kwh": 20, "owner_name": "Sunita Devi",  "x_pos": 100, "y_pos": 380, "latitude": 12.9712, "longitude": 77.5930},
    {"label": "Community Grid",     "node_type": NodeType.HYBRID,  "battery_max_kwh": 50, "owner_name": "Society CBO", "x_pos": 600, "y_pos": 340, "latitude": 12.9722, "longitude": 77.5955},
]

# Installed capacity per node type (kWp)
# Based on Indian MNRE CAPEX benchmark 2024: 3–8 kWp residential, 10–20 kWp community
INSTALLED_KWP = {
    NodeType.SOLAR:   8.0,   # 8 kWp rooftop (MNRE subsidy bracket)
    NodeType.HYBRID:  6.0,   # 6 kWp rooftop + battery
    NodeType.BATTERY: 0.0,
    NodeType.EV:      0.0,
    NodeType.LOAD:    0.0,
}

# Override per-node capacity where specified
NODE_KWP_OVERRIDE: dict = {
    "Community Grid": 20.0,  # 20 kWp community solar (REC scheme compliant)
}


def _solar_curve(hour: float, cloud_factor: float = 1.0) -> float:
    """Realistic solar generation curve (fraction of installed kWp)."""
    if hour < 6.0 or hour > 19.0:
        return 0.0
    # Sine arch peaks at solar noon (~13h for India)
    peak = math.sin(math.pi * (hour - 6.0) / 13.0)
    jitter = random.gauss(0, 0.03)
    return max(0.0, peak * cloud_factor + jitter)


def _load_curve(hour: float, node_type: NodeType) -> float:
    """Typical household / EV load profile (kW)."""
    base         = 0.4
    morning_peak = 0.6 * math.exp(-0.5 * ((hour - 7.5) / 1.5) ** 2)
    evening_peak = 1.0 * math.exp(-0.5 * ((hour - 19.0) / 2.0) ** 2)
    ev_charge    = 2.2 * math.exp(-0.5 * ((hour - 22.0) / 2.0) ** 2) if node_type == NodeType.EV else 0.0
    jitter       = random.gauss(0, 0.06)
    return max(0.05, base + morning_peak + evening_peak + ev_charge + jitter)


def initialize_nodes() -> List[GridNode]:
    """Create the starting set of grid nodes."""
    nodes = []
    for preset in PRESET_NODES:
        node = GridNode(
            label           = preset["label"],
            node_type       = preset["node_type"],
            battery_max_kwh = preset["battery_max_kwh"],
            battery_kwh     = preset["battery_max_kwh"] * random.uniform(0.4, 0.75),
            owner_name      = preset["owner_name"],
            x_pos           = preset["x_pos"],
            y_pos           = preset["y_pos"],
            latitude        = preset["latitude"],
            longitude       = preset["longitude"],
            bid_price       = round(random.uniform(MIN_BID_PRICE + 0.5, 7.0), 2),
            ask_price       = round(random.uniform(5.5, 8.5), 2),
        )
        nodes.append(node)
    return nodes


def tick_nodes(nodes: List[GridNode], cloud_forecast: CloudForecast) -> List[GridNode]:
    """Advance simulation by one tick using demo-time clock."""
    hour = _demo_hour()

    for node in nodes:
        # Cloud dimming
        cf = 1.0
        if node.node_id in cloud_forecast.affected_nodes:
            eta = cloud_forecast.eta_minutes
            if eta <= 0:
                cf = max(0.1, 1.0 - cloud_forecast.cloud_coverage_pct / 100.0)
            elif eta < 10:
                cf = max(0.1, 1.0 - (cloud_forecast.cloud_coverage_pct / 100.0) * (1 - eta / 10.0))

        # Solar generation (kW) — use per-node override if available
        installed = NODE_KWP_OVERRIDE.get(node.label, INSTALLED_KWP.get(node.node_type, 0.0))
        node.solar_kw = round(installed * _solar_curve(hour, cf), 2) if installed > 0 else 0.0

        # Load (kW)
        node.load_kw = round(_load_curve(hour, node.node_type), 2)

        # Net power (positive = surplus/supply, negative = deficit/demand)
        node.excess_kw = round(node.solar_kw - node.load_kw, 2)

        # Role assignment
        if node.excess_kw > 0.05:
            node.role = AgentRole.SUPPLY
        elif node.excess_kw < -0.05:
            node.role = AgentRole.DEMAND
        else:
            node.role = AgentRole.NEUTRAL

        # Self-charge battery from own solar surplus
        if node.excess_kw > 0 and node.battery_kwh < node.battery_max_kwh:
            charge = min(node.excess_kw * (WS_TICK / 3600), node.battery_max_kwh - node.battery_kwh)
            node.battery_kwh = round(node.battery_kwh + charge, 3)

    return nodes


def generate_forecast_24h(current_hour: float, cloud_forecast: CloudForecast) -> List[dict]:
    """Generates a 24-point forecast array based on present nodes and solar/load curves."""
    forecast = []
    # Project 24 hours from current
    for i in range(25):
        h = (current_hour + i) % 24
        cf = 1.0
        # Simple cloud model: shadow hits ETA, lasts ~45 mins
        eta_h = cloud_forecast.eta_minutes / 60.0
        if eta_h > 0 and eta_h < i + 1:
            dist = abs(i - eta_h)
            if dist < 0.75:
                cf = max(0.15, 1.0 - cloud_forecast.cloud_coverage_pct / 100.0)

        total_solar = 0.0
        total_load  = 0.0
        for preset in PRESET_NODES:
            nt = preset["node_type"]
            label = preset["label"]
            installed = NODE_KWP_OVERRIDE.get(label, INSTALLED_KWP.get(nt, 0.0))
            # No jitter for forecast
            solar_frac = 0.0
            if 6.0 <= h <= 19.0:
                solar_frac = max(0.0, math.sin(math.pi * (h - 6.0) / 13.0) * cf)
            
            total_solar += installed * solar_frac
            
            # Load curve components
            base = 0.4
            morning_peak = 0.6 * math.exp(-0.5 * ((h - 7.5) / 1.5) ** 2)
            evening_peak = 1.0 * math.exp(-0.5 * ((h - 19.0) / 2.0) ** 2)
            ev_charge    = 2.2 * math.exp(-0.5 * ((h - 22.0) / 2.0) ** 2) if nt == NodeType.EV else 0.0
            total_load += (base + morning_peak + evening_peak + ev_charge)
        
        forecast.append({
            "hour": f"{int(h):02d}:00",
            "solar": round(total_solar, 1),
            "load":  round(total_load, 1),
            "power_saving": round(total_solar * random.uniform(0.88, 0.98), 1),
            "profit_making": round(total_solar * random.uniform(0.70, 0.85), 1),
            "baseline":     round(total_solar * 0.62, 1)
        })
    return forecast


def generate_forecast_5d(weather_data: List[dict] = None) -> List[dict]:
    """Generates a 5-day predictive optimization model from real weather data."""
    forecast = []
    
    # Use real weather data if provided, else fall back to seasonal normals for Bengaluru
    base_forecast = weather_data if weather_data else [
        {"day": f"Day {i+1}", "solar_kwh_m2": 5.2 + random.uniform(-0.5, 0.5)} 
        for i in range(5)
    ]
    
    for entry in base_forecast:
        day_label = entry["day"]
        # Convert radiation (kWh/m2) to yield factor
        # Typical residential 5kW system yields ~4.2 kWh per kWh/m2 (85% PR)
        yield_factor = entry.get("solar_kwh_m2", 5.0)
        base_gen     = yield_factor * 25.0 # Total fleet capacity estimate
        
        # Power Saving: High SOC retention (95% efficiency)
        power_saving = base_gen * 0.94
        # Profit Making: Max trade volume + peak arbitrage (115% revenue equivalent)
        profit_making = base_gen * 1.15
        # Baseline: Unoptimized grid (65% efficiency)
        baseline = base_gen * 0.65
        
        forecast.append({
            "day": day_label,
            "power_saving": round(power_saving, 1),
            "profit_making": round(profit_making, 1),
            "baseline": round(baseline, 1),
            "savings": round(power_saving - baseline, 2),
            "profit": round(profit_making - baseline, 2)
        })
    return forecast


# Expose tick interval
WS_TICK = 1.0  # seconds per simulation tick
