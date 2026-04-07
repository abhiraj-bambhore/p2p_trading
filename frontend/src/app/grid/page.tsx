'use client';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { useFluxAgent } from '@/hooks/useFluxAgent';
import Sidebar from '@/components/Sidebar';
import BlockchainLedger from '@/components/BlockchainLedger';
import ClientOnly from '@/components/ClientOnly';
import {
    Map, Sun, Home, Zap, CloudLightning, ShieldCheck,
    Terminal, Activity, TrendingUp, IndianRupee
} from 'lucide-react';

const GridMap = dynamic(() => import('@/components/GridMap'), { ssr: false });

function LiveBadge() {
    return (
        <span className="live-badge">
            <span className="live-dot" />
            LIVE DATA
        </span>
    );
}

export default function GridPage() {
    const { state, tradeLog, blockchain, triggerCloud } = useFluxAgent();
    const [filterType, setFilterType] = useState<string | null>(null);

    const filteredNodes = filterType === 'co2'
        ? state.nodes.filter(n => ['solar', 'battery', 'hybrid'].includes(n.node_type))
        : filterType
            ? state.nodes.filter(n => n.node_type === filterType)
            : state.nodes;

    const supplierCount = state.nodes.filter(n => n.role === 'supply').length;
    const demandCount = state.nodes.filter(n => n.role === 'demand').length;

    return (
        <div className="app-shell grid-bg">
            <Sidebar connected={state.connected} tick={state.tick} cloud={state.cloud} />

            <main className="app-content" style={{ padding: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(0,255,136,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(4,8,16,0.85)',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: 'linear-gradient(135deg, #00e5ff, #b44aff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0,229,255,0.35)',
                        }}>
                            <Map size={14} color="#000" strokeWidth={3} />
                        </div>
                        <div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#e2f0ff' }}>
                                GRID TOPOLOGY <span style={{ color: '#00e5ff' }}>& FLOW</span>
                            </span>
                            <div style={{ fontSize: 9, color: 'rgba(125,165,200,0.4)', marginTop: 1, fontFamily: 'monospace' }}>
                                <span style={{ color: 'rgba(0,255,136,0.5)' }}>●</span> Live Spatial Visualization · P2P Energy Transfer Matrix
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {/* Live KPI strip */}
                        <div style={{
                            display: 'flex', gap: 16, padding: '7px 14px',
                            borderRadius: 5, background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,229,255,0.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ffd700', fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>
                                <Sun size={12} />
                                {state.metrics.total_solar_kw.toFixed(1)} kW GEN
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b44aff', fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>
                                <Home size={12} />
                                {state.metrics.total_load_kw.toFixed(1)} kW LOAD
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00ff88', fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>
                                <Zap size={12} />
                                {state.metrics.total_traded_kwh.toFixed(2)} kWh TRADED
                            </div>
                        </div>

                        <button onClick={triggerCloud} className="btn-primary" id="btn-atmo">
                            <CloudLightning size={12} />
                            ATMOSPHERIC IMPACT
                        </button>
                    </div>
                </div>

                {/* Node type filter bar */}
                <div style={{
                    padding: '7px 14px',
                    borderBottom: '1px solid rgba(0,255,136,0.04)',
                    display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0,
                    background: 'rgba(4,8,16,0.5)'
                }}>
                    <span style={{ fontSize: 7.5, color: 'rgba(125,165,200,0.3)', fontFamily: 'monospace', fontWeight: 700, marginRight: 4 }}>
                        FILTER:
                    </span>
                    {[null, 'solar', 'battery', 'co2', 'ev', 'load', 'hybrid'].map(type => (
                        <button
                            key={type ?? 'all'}
                            onClick={() => setFilterType(type)}
                            style={{
                                padding: '3px 10px', borderRadius: 3, fontSize: 8, fontWeight: 900,
                                fontFamily: 'monospace', letterSpacing: '0.06em', cursor: 'pointer',
                                background: filterType === type ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.02)',
                                border: filterType === type ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                color: filterType === type ? '#00ff88' : 'rgba(125,165,200,0.5)',
                                transition: 'all 0.15s'
                            }}
                        >
                            {(type ?? 'ALL').toUpperCase()}
                        </button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 8, fontFamily: 'monospace', fontWeight: 700 }}>
                        <span style={{ color: '#00ff88' }}>◆ {supplierCount} SUPPLIERS</span>
                        <span style={{ color: '#ff3366' }}>◆ {demandCount} CONSUMERS</span>
                        <span style={{ color: 'rgba(125,165,200,0.4)' }}>◆ {state.nodes.length - supplierCount - demandCount} NEUTRAL</span>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{
                    flex: 1, display: 'grid',
                    gridTemplateColumns: '1fr 240px',
                    gap: 8, padding: '8px 12px 12px',
                    minHeight: 0, overflow: 'hidden'
                }}>
                    {/* Grid Map Canvas */}
                    <div className="glass-card" style={{
                        height: '100%', width: '100%', overflow: 'hidden',
                        position: 'relative', minHeight: 0
                    }}>
                        <div className="section-header">
                            <span className="section-title">
                                <span style={{ color: 'rgba(0,229,255,0.6)' }}>◆</span>
                                NETWORK TOPOLOGY MAP
                            </span>
                            <LiveBadge />
                        </div>
                        <div style={{ height: 'calc(100% - 40px)' }}>
                            <GridMap
                                nodes={filteredNodes}
                                trades={tradeLog.slice(0, 20)}
                                affectedNodes={state.cloud.affected_nodes}
                                cloud={state.cloud}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                        {/* Blockchain Ledger */}
                        <div className="glass-card" style={{ flex: 1.2, minHeight: 0, overflow: 'hidden' }}>
                            <div className="section-header">
                                <span className="section-title">
                                    <span style={{ color: 'rgba(0,255,136,0.5)' }}>◆</span>
                                    BLOCKCHAIN LEDGER
                                </span>
                                <LiveBadge />
                            </div>
                            <div style={{ height: 'calc(100% - 40px)', overflow: 'hidden' }}>
                                <BlockchainLedger blockchain={blockchain} />
                            </div>
                        </div>

                        {/* Validation log */}
                        <div className="glass-card" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <div className="section-header">
                                <span className="section-title">
                                    <span style={{ color: 'rgba(0,229,255,0.5)' }}>◆</span>
                                    VALIDATION LOG
                                </span>
                                <span style={{ fontSize: 7, color: 'rgba(0,255,136,0.4)', fontFamily: 'monospace', fontWeight: 700 }}>
                                    {tradeLog.length} TX
                                </span>
                            </div>
                            <div style={{
                                height: 'calc(100% - 40px)', overflowY: 'auto',
                                padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5
                            }}>
                                {tradeLog.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(125,165,200,0.2)', fontSize: 9, fontFamily: 'monospace' }}>
                                        AWAITING TRANSACTIONS...
                                    </div>
                                ) : (
                                    tradeLog.slice(0, 40).map((t, i) => {
                                        const buyer = state.nodes.find(n => n.node_id === t.buyer_id);
                                        const seller = state.nodes.find(n => n.node_id === t.seller_id);
                                        return (
                                            <div key={t.trade_id} className="trade-row" style={{
                                                borderLeftColor: t.validated ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.3)',
                                                animation: i === 0 ? 'slideIn 0.3s ease' : 'none'
                                            }}>
                                                <div style={{ color: '#00e5ff', fontWeight: 900, fontSize: 8, marginBottom: 2 }}>
                                                    TX_{t.trade_id?.slice(0, 8).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontSize: 8, color: 'rgba(125,165,200,0.6)' }}>
                                                        <span style={{ color: '#ffd700' }}>{seller?.label || t.seller_id?.slice(0, 4)}</span>
                                                        {' → '}
                                                        <span style={{ color: '#00e5ff' }}>{buyer?.label || t.buyer_id?.slice(0, 4)}</span>
                                                    </div>
                                                    <div style={{ fontSize: 8, color: '#00ff88', fontWeight: 900 }}>
                                                        {t.energy_kwh.toFixed(3)} kWh
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                                    <span style={{ fontSize: 7, color: t.validated ? 'rgba(0,255,136,0.5)' : 'rgba(255,51,102,0.5)', fontWeight: 700 }}>
                                                        {t.validated ? '✓ VERIFIED' : '⊙ PENDING'}
                                                    </span>
                                                    <span style={{ fontSize: 7, color: 'rgba(125,165,200,0.3)', fontFamily: 'monospace' }}>
                                                        ₹{t.price_kwh.toFixed(2)}/kWh
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
