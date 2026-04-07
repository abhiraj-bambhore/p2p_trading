// Shared type definitions for Project Flux-Agent frontend

export type NodeType = 'solar' | 'battery' | 'ev' | 'load' | 'hybrid';
export type AgentRole = 'supply' | 'demand' | 'neutral';

export interface GridNode {
    node_id: string;
    label: string;
    node_type: NodeType;
    latitude: number;
    longitude: number;
    solar_kw: number;
    battery_kwh: number;
    battery_max_kwh: number;
    load_kw: number;
    excess_kw: number;
    role: AgentRole;
    bid_price: number;
    ask_price: number;
    owner_name: string;
    x_pos: number;
    y_pos: number;
    is_active: boolean;
}

export interface TradeRecord {
    trade_id: string;
    seller_id: string;
    buyer_id: string;
    energy_kwh: number;
    price_kwh: number;
    total_cost: number;
    explanation: string;
    negotiation_chat: Array<{ role: string; content: string }>;
    timestamp: number;
    validated: boolean;
    sentinel_verified: boolean;
    signature: string;
}

export interface CloudForecast {
    cloud_coverage_pct: number;
    eta_minutes: number;
    velocity_kmh: number;
    direction_deg: number;
    affected_nodes: string[];
    confidence: number;
    centroid_x?: number;
}

export interface GridMetrics {
    total_solar_kw: number;
    total_load_kw: number;
    total_traded_kwh: number;
    total_expenditure: number;
    safety_limit_inr: number;
    safety_alert_sent: boolean;
    co2_saved_kg: number;
    money_saved: number;
    tick: number;
}

export interface GridUpdate {
    type: 'grid_update' | 'reset';
    nodes: GridNode[];
    trades: TradeRecord[];
    cloud: CloudForecast;
    metrics: GridMetrics;
    forecast_24h?: any[];
    forecast_5d?: any[];
    message?: string;
}
