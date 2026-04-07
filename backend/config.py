"""
Central configuration for Project Flux-Agent.
All parameters sourced from real Indian energy market data:
- CERC merit order 2024
- CEA CO2 emission baseline 2023
- UP DISCOM (UPPCL) tariff schedule 2024
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Server ────────────────────────────────────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# ── Ollama (local LLM — zero cost, privacy-first) ─────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama2:latest")

# ── AutoGen LLM Config (uses Ollama as OpenAI-compatible backend) ─────────────
AUTOGEN_CONFIG = [{
    "model":     os.getenv("AUTOGEN_LLM_MODEL", "llama2:latest"),
    "api_type":  "openai",
    "base_url":  os.getenv("AUTOGEN_LLM_API_BASE", "http://localhost:11434/v1"),
    "api_key":   os.getenv("AUTOGEN_LLM_API_KEY", "ollama"),
}]

# ── Indian Energy Market Parameters ───────────────────────────────────────────
# Source: CERC/CEA 2024 reports (publicly available)
# 1 USD ≈ 83 INR (Feb 2026 rate — all values in ₹/kWh)
BASE_ENERGY_PRICE = float(os.getenv("BASE_ENERGY_PRICE_INR", 8.50))  # ₹/kWh
MIN_BID_PRICE     = float(os.getenv("MIN_BID_PRICE_INR", 3.50))      # ₹/kWh
MAX_BID_PRICE     = float(os.getenv("MAX_BID_PRICE_INR", 9.50))      # ₹/kWh

# India grid CO2 emission factor (Central Electricity Authority, 2023 baseline)
CO2_KG_PER_KWH = float(os.getenv("CO2_FACTOR_KG_PER_KWH", 0.82))

# ── Grid Physics ─────────────────────────────────────────────────────────────
GRID_FREQUENCY_HZ       = 50.0     # India standard (Hz)
GRID_VOLTAGE_KV         = 0.415    # 415V LV distribution (India LT standard)
MAX_LINE_LOADING_PERCENT= 150.0    # % — Relaxed for demo to ensure trade flow
BYZANTINE_THRESHOLD     = 0.33     # BFT tolerance (1/3 malicious nodes max)

# ── Auction ───────────────────────────────────────────────────────────────────
AUCTION_TIMEOUT_SEC = 3.0

# ── Simulation ───────────────────────────────────────────────────────────────
NUM_NODES = int(os.getenv("NUM_NODES", 6))

# ── WebSocket ─────────────────────────────────────────────────────────────────
WS_HEARTBEAT_INTERVAL = 2.0  # seconds between simulation ticks

# ── Copernicus / Sentinel-2 (Free — no API key for basic access) ──────────────
# Doi: https://dataspace.copernicus.eu/
COPERNICUS_USER     = os.getenv("COPERNICUS_USER", "")
COPERNICUS_PASSWORD = os.getenv("COPERNICUS_PASSWORD", "")
SENTINEL_API_URL    = "https://catalogue.dataspace.copernicus.eu/odata/v1"
SENTINEL_STAC_URL   = "https://catalogue.dataspace.copernicus.eu/stac/v1"

# Region of Interest: UP-Delhi solar corridor (India AI Summit 2026 demo area)
SENTINEL_LAT       = float(os.getenv("SENTINEL_LAT", 26.85))   # Lucknow, UP
SENTINEL_LON       = float(os.getenv("SENTINEL_LON", 80.95))
SENTINEL_RADIUS_KM = float(os.getenv("SENTINEL_RADIUS_KM", 50))

# Cloud dynamics
CLOUD_VELOCITY_KMH = 45.0  # average monsoon cloud speed over UP (IMD data)

# ── Federated Learning ────────────────────────────────────────────────────────
FL_ROUNDS      = 5
FL_MIN_CLIENTS = 2

# ── Notifications (Gmail SMTP) ───────────────────────────────────────────────
SMTP_SERVER   = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")      # Your Gmail
SMTP_PASS     = os.getenv("SMTP_PASS", "")      # Your Gmail App Password
ALERT_EMAIL   = os.getenv("ALERT_EMAIL", "")     # Where to send alerts

# ── Safety & Limits ──────────────────────────────────────────────────────────
# These can be overridden via API, but defaults are set here
DEFAULT_DAILY_EXPENDITURE_LIMIT = float(os.getenv("DAILY_LIMIT_INR", 1500.0))
ALERT_THRESHOLD_PCT             = 0.80  # 80%
