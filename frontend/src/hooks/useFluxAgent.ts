'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { GridUpdate, GridNode, TradeRecord, CloudForecast, GridMetrics } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FluxState {
    nodes: GridNode[];
    trades: TradeRecord[];
    cloud: CloudForecast;
    metrics: GridMetrics;
    forecast24h: any[];
    forecast5d: any[];
    connected: boolean;
    tick: number;
}

export interface BlockchainData {
    mode: 'hardhat' | 'in-memory';
    connected: boolean;
    on_chain_count: number;
    history: any[];
}

const DEFAULT_STATE: FluxState = {
    nodes: [],
    trades: [],
    cloud: {
        cloud_coverage_pct: 0,
        eta_minutes: 999,
        velocity_kmh: 45,
        direction_deg: 270,
        affected_nodes: [],
        confidence: 0.85,
    },
    metrics: {
        total_solar_kw: 0,
        total_load_kw: 0,
        total_traded_kwh: 0,
        total_expenditure: 0,
        safety_limit_inr: 0,
        safety_alert_sent: false,
        co2_saved_kg: 0,
        money_saved: 0,
        tick: 0,
    },
    forecast24h: [],
    forecast5d: [],
    connected: false,
    tick: 0,
};

// Merge two trade arrays — dedup by trade_id, newest first, cap at 200
function mergeTrades(incoming: TradeRecord[], existing: TradeRecord[]): TradeRecord[] {
    const combined = [...incoming, ...existing];
    const unique = Array.from(new Map(combined.map(t => [t.trade_id, t])).values());
    return unique.slice(0, 200);
}

export function useFluxAgent() {
    const [state, setState] = useState<FluxState>(DEFAULT_STATE);
    const [tradeLog, setTradeLog] = useState<TradeRecord[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const tradeLogRef = useRef<TradeRecord[]>([]); // stable ref for polling

    // Keep ref in sync
    useEffect(() => { tradeLogRef.current = tradeLog; }, [tradeLog]);

    // ── Poll REST /api/trades every 3s as a reliable fallback ──────────────────
    const pollTrades = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/trades`);
            if (!res.ok) return;
            const data: TradeRecord[] = await res.json();
            if (data.length > 0) {
                setTradeLog(prev => mergeTrades(data, prev));
            }
        } catch { /* backend not ready yet */ }
    }, []);

    // ── Poll REST /api/state every 2s for metrics & nodes fallback ─────────────
    const pollState = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/state`);
            if (!res.ok) return;
            const data = await res.json();
            setState(prev => ({
                ...prev,
                nodes: data.nodes || prev.nodes,
                cloud: data.cloud || prev.cloud,
                metrics: data.metrics || prev.metrics,
                forecast24h: data.forecast_24h || prev.forecast24h,
                forecast5d: data.forecast_5d || prev.forecast5d,
                tick: data.metrics?.tick || prev.tick,
            }));
            if (data.trades?.length > 0) {
                setTradeLog(prev => mergeTrades(data.trades, prev));
            }
        } catch { /* backend not ready yet */ }
    }, []);

    // ── WebSocket for real-time push ────────────────────────────────────────────
    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mountedRef.current) return;
                setState(prev => ({ ...prev, connected: true }));
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const data: GridUpdate = JSON.parse(event.data);
                    if (data.type === 'grid_update') {
                        setState(prev => ({
                            ...prev,
                            nodes: data.nodes || prev.nodes,
                            cloud: data.cloud || prev.cloud,
                            metrics: data.metrics || prev.metrics,
                            forecast24h: data.forecast_24h || prev.forecast24h,
                            forecast5d: data.forecast_5d || prev.forecast5d,
                            tick: data.metrics?.tick || prev.tick,
                        }));
                        // Add any new trades from WS push
                        if (data.trades && data.trades.length > 0) {
                            setTradeLog(prev => mergeTrades(data.trades, prev));
                        }
                    }
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };

            ws.onerror = () => { ws.close(); };
            ws.onclose = () => {
                if (!mountedRef.current) return;
                setState(prev => ({ ...prev, connected: false }));
                reconnectTimer.current = setTimeout(connect, 3000);
            };
        } catch (e) {
            reconnectTimer.current = setTimeout(connect, 3000);
        }
    }, []);

    // ── Startup ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;
        connect();

        // Initial fetch to populate immediately
        pollTrades();
        pollState();

        // Regular polling intervals (REST fallback)
        const tradePoller = setInterval(pollTrades, 3000);  // trades every 3s
        const statePoller = setInterval(pollState, 4000);   // state every 4s

        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
            clearInterval(tradePoller);
            clearInterval(statePoller);
        };
    }, [connect, pollTrades, pollState]);

    const triggerCloud = useCallback(async () => {
        await fetch(`${API_URL}/api/trigger_cloud`, { method: 'POST' });
    }, []);

    const resetGrid = useCallback(async () => {
        await fetch(`${API_URL}/api/reset`, { method: 'POST' });
        setTradeLog([]);
    }, []);

    const [blockchain, setBlockchain] = useState<BlockchainData>({
        mode: 'in-memory',
        connected: false,
        on_chain_count: 0,
        history: [],
    });

    const fetchBlockchain = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/blockchain`);
            const data = await res.json();
            setBlockchain(data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchBlockchain();
        const interval = setInterval(fetchBlockchain, 5000);
        return () => clearInterval(interval);
    }, [fetchBlockchain]);

    return { state, tradeLog, blockchain, triggerCloud, resetGrid };
}
