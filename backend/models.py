"""
Grid Node Models — Pydantic schemas shared across the backend.
Each 'node' represents a home/EV/battery in the P2P microgrid.
"""
from __future__ import annotations
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
import time


class NodeType(str, Enum):
    SOLAR   = "solar"
    BATTERY = "battery"
    EV      = "ev"
    LOAD    = "load"
    HYBRID  = "hybrid"   # solar + battery


class AgentRole(str, Enum):
    SUPPLY  = "supply"
    DEMAND  = "demand"
    NEUTRAL = "neutral"


class GridNode(BaseModel):
    node_id:    str       = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    label:      str       = "Node"
    node_type:  NodeType  = NodeType.SOLAR
    latitude:   float     = 28.6139   # Default: New Delhi
    longitude:  float     = 77.2090
    # Energy state
    solar_kw:   float     = 0.0   # current solar generation
    battery_kwh: float    = 5.0   # battery state of charge
    battery_max_kwh: float = 10.0
    load_kw:    float     = 0.0   # current consumption
    excess_kw:  float     = 0.0   # solar_kw - load_kw (positive = supply)
    # Trading state
    role:       AgentRole = AgentRole.NEUTRAL
    bid_price:  float     = 6.00  # ₹/kWh
    ask_price:  float     = 7.50  # ₹/kWh
    # Metadata
    owner_name: str       = "Neighbor"
    x_pos:      float     = 0.0   # canvas position for React Flow
    y_pos:      float     = 0.0
    is_active:  bool      = True


class EnergyBid(BaseModel):
    bid_id:      str   = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    from_node:   str   = ""
    to_node:     str   = ""
    energy_kwh:  float = 0.0
    price_per_kwh: float = 6.00  # ₹/kWh
    timestamp:   float = Field(default_factory=time.time)
    accepted:    bool  = False
    explanation: str   = ""


class TradeRecord(BaseModel):
    trade_id:         str   = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    seller_id:        str   = ""
    buyer_id:         str   = ""
    energy_kwh:       float = 0.0
    price_kwh:        float = 6.00  # ₹/kWh
    total_cost:       float = 0.0
    explanation:      str   = ""
    negotiation_chat: List[dict] = []   # full AutoGen message history: [{role, content}]
    timestamp:        float = Field(default_factory=time.time)
    validated:        bool  = False
    sentinel_verified: bool = False
    signature:        str   = ""


class CloudForecast(BaseModel):
    cloud_coverage_pct: float = 0.0   # 0–100
    eta_minutes:        float = 999.0 # time until cloud shadow arrives
    velocity_kmh:       float = 45.0
    direction_deg:      float = 270.0
    affected_nodes:     List[str] = []
    confidence:         float = 0.85
    centroid_x:         float = 0.5   # 0=west, 1=east of ROI


class SafetySettings(BaseModel):
    daily_limit_inr: float = 500.0
    alert_email:     str   = ""
    enabled:         bool  = True


class GridState(BaseModel):
    nodes:          List[GridNode]   = []
    trades:         List[TradeRecord] = []
    cloud_forecast: CloudForecast    = CloudForecast()
    total_solar_kw: float            = 0.0
    total_load_kw:  float            = 0.0
    total_traded_kwh: float          = 0.0
    total_expenditure: float         = 0.0
    safety_alert_sent: bool          = False
    co2_saved_kg:   float            = 0.0
    money_saved:    float            = 0.0
    tick:           int              = 0
    forecast_24h:   List[dict]       = []   # 24h detailed forecast
    forecast_5d:    List[dict]       = []   # 5-day daily aggregate forecast
    timestamp:      float            = Field(default_factory=time.time)
