'use client';
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFluxAgent } from '@/hooks/useFluxAgent';
import Sidebar from '@/components/Sidebar';
import {
    CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck,
    Brain, MessageSquare, Sun, Home, Zap, IndianRupee, Cpu, Lock
} from 'lucide-react';
import type { TradeRecord, GridNode } from '@/types';
import ClientOnly from '@/components/ClientOnly';

function TimeAgo({ ts }: { ts: number }) {
    const diff = Date.now() / 1000 - ts;
    let text = 'SEC_0';
    if (diff >= 60) text = `MIN_${Math.floor(diff / 60)}`;
    else if (diff >= 5) text = `SEC_${Math.floor(diff)}`;
    return <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>[{text}]</span>;
}

function TradeConversation({ trade, seller, buyer }: {
    trade: TradeRecord;
    seller?: GridNode;
    buyer?: GridNode;
}) {
    const savings = ((8.50 - trade.price_kwh) * trade.energy_kwh).toFixed(2);
    const savingPct = ((8.50 - trade.price_kwh) / 8.50 * 100).toFixed(0);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card"
            style={{ padding: 0, overflow: 'hidden', marginBottom: 20, background: 'rgba(255,255,255,0.01)' }}
        >
            {/* Intel Header */}
            <div style={{
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--accent-solar)', fontFamily: 'var(--font-mono)' }}>
                            {seller?.owner_name || trade.seller_id}
                        </span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--accent-load)', fontFamily: 'var(--font-mono)' }}>
                            {buyer?.owner_name || trade.buyer_id}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {trade.validated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--battery-green)', fontSize: 10, fontWeight: 800 }}>
                            <ShieldCheck size={14} /> VERIFIED
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-red)', fontSize: 10, fontWeight: 800 }}>
                            <XCircle size={14} /> BLOCKED
                        </div>
                    )}
                    <TimeAgo ts={trade.timestamp} />
                </div>
            </div>

            {/* Negotiation Cycle */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Supply Agent Output */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 800, color: 'var(--accent-solar)' }}>
                        <Sun size={12} /> SUPPLY_ORCHESTRATOR • {seller?.label || 'Node'}
                    </div>
                    <div className="chat-bubble" style={{ background: 'rgba(251, 191, 36, 0.05)', borderLeft: '3px solid var(--accent-solar)', padding: '16px', borderRadius: '0 12px 12px 12px' }}>
                        <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
                            Surplus detected: <strong style={{ color: '#fff' }}>{trade.energy_kwh.toFixed(3)} kWh</strong>.
                            Unit rate optimized to <strong style={{ color: 'var(--accent-solar)' }}>₹{trade.price_kwh.toFixed(2)}</strong>.
                            Efficiency gain: <span style={{ color: 'var(--battery-green)', fontWeight: 800 }}>+{savingPct}%</span> vs Grid Base.
                        </p>
                    </div>
                </div>

                {/* Demand Agent Response */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 800, color: 'var(--accent-load)' }}>
                        DEMAND_OPTIMIZER • {buyer?.label || 'Node'} <Home size={12} />
                    </div>
                    <div className="chat-bubble" style={{ background: 'rgba(139, 92, 246, 0.05)', borderRight: '3px solid var(--accent-load)', padding: '16px', borderRadius: '12px 0 12px 12px', textAlign: 'right' }}>
                        <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
                            Terms validated. Executing settlement at <strong style={{ color: 'var(--accent-load)' }}>₹{trade.price_kwh.toFixed(2)}/kWh</strong>.
                            Projected fiscal relief: <strong style={{ color: 'var(--battery-green)' }}>₹{savings}</strong>.
                        </p>
                    </div>
                </div>

                {/* Logic Reasoning */}
                {trade.explanation && (
                    <div style={{
                        padding: '16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 13, color: 'var(--text-muted)',
                        display: 'flex', gap: 12
                    }}>
                        <Brain size={18} color="var(--accent-solar)" style={{ flexShrink: 0 }} />
                        <div style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                            {trade.explanation}
                        </div>
                    </div>
                )}
            </div>

            {/* Signature Footer */}
            <div style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <Lock size={10} />
                    <span>AUTH_SIG: {trade.signature || 'SIM_SIG_0x' + trade.trade_id.slice(0, 10)}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--battery-green)', fontWeight: 800 }}>
                    <ShieldCheck size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    ENCRYPTED
                </div>
            </div>
        </motion.div>
    );
}

export default function ConversationsPage() {
    const { state, tradeLog } = useFluxAgent();
    const nodeMap = useMemo(
        () => Object.fromEntries(state.nodes.map(n => [n.node_id, n])),
        [state.nodes]
    );

    const validatedCount = tradeLog.filter(t => t.validated).length;
    const totalEnergy = tradeLog.reduce((s, t) => s + t.energy_kwh, 0);
    const totalSaved = tradeLog.reduce((s, t) => s + (8.50 - t.price_kwh) * t.energy_kwh, 0);

    return (
        <div className="app-shell">
            <Sidebar connected={state.connected} tick={state.tick} cloud={state.cloud} />

            <main className="app-content">
                <ClientOnly>
                    {/* Operations Header */}
                    <div style={{ padding: '32px 32px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <MessageSquare size={20} color="var(--accent-solar)" />
                                    <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>
                                        AGENT INTEL & NEGOTIATIONS
                                    </h1>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <ShieldCheck size={14} color="var(--battery-green)" />
                                    Autonomous Multi-Agent Decision Logs • Llama 3.1 Reasoning
                                </p>
                            </div>

                            <div style={{
                                display: 'flex', gap: 24, padding: '12px 24px',
                                borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--battery-green)' }}>
                                    <CheckCircle size={14} /> {validatedCount} TRADES
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ev-cyan)' }}>
                                    <Zap size={14} /> {totalEnergy.toFixed(1)} kWh
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-solar)' }}>
                                    <IndianRupee size={14} /> ₹{Math.max(0, totalSaved).toFixed(0)} SAVED
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
                        {tradeLog.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', height: 400, gap: 20,
                            }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    style={{ color: 'var(--text-muted)', opacity: 0.2 }}
                                >
                                    <Cpu size={64} />
                                </motion.div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 18, color: '#fff', fontWeight: 800, marginBottom: 8 }}>
                                        SCANNING FOR NEGOTIATIONS...
                                    </p>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        Agents are currently monitoring grid stability. No surplus detected for trade.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <AnimatePresence mode="popLayout">
                                    {tradeLog.map(trade => (
                                        <TradeConversation
                                            key={trade.trade_id}
                                            trade={trade}
                                            seller={nodeMap[trade.seller_id]}
                                            buyer={nodeMap[trade.buyer_id]}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </ClientOnly>
            </main>
        </div>
    );
}
