"""
XAI Layer — Explainable AI using local Ollama (Llama 3.1 / Phi-3).
Falls back to rule-based explanations when Ollama is offline.
"""
from __future__ import annotations
import asyncio, logging
from typing import Optional
from models import TradeRecord, GridNode, CloudForecast
from agents import build_explanation_prompt, fallback_explanation
from config import OLLAMA_BASE_URL, OLLAMA_MODEL

log = logging.getLogger("xai")


async def generate_explanation(
    trade: TradeRecord,
    seller: GridNode,
    buyer: GridNode,
    cloud_forecast: CloudForecast,
) -> str:
    """
    Calls local Ollama to generate a human-readable trade explanation.
    Automatically falls back to rule-based description if Ollama is unavailable.
    """
    prompt = build_explanation_prompt(trade, seller, buyer, cloud_forecast.eta_minutes)

    try:
        import httpx
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model":  OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.5, "max_tokens": 120},
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                explanation = data.get("response", "").strip()
                if explanation:
                    log.info(f"🧠 Ollama: {explanation}")
                    return explanation
    except Exception as e:
        log.warning(f"Ollama unreachable: {type(e).__name__} - {str(e)} — using fallback explanation.")

    return fallback_explanation(trade, seller, buyer, cloud_forecast.eta_minutes)


async def enrich_trades_with_explanations(
    trades: list[TradeRecord],
    nodes: list[GridNode],
    cloud_forecast: CloudForecast,
) -> list[TradeRecord]:
    """Enriches all validated trades with XAI explanations concurrently."""
    node_map = {n.node_id: n for n in nodes}

    async def _explain(trade: TradeRecord) -> TradeRecord:
        seller = node_map.get(trade.seller_id)
        buyer  = node_map.get(trade.buyer_id)
        if seller and buyer:
            trade.explanation = await generate_explanation(trade, seller, buyer, cloud_forecast)
        return trade

    enriched = await asyncio.gather(*[_explain(t) for t in trades])
    return list(enriched)
