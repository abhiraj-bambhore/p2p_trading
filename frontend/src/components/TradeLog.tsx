'use client';
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradeRecord, GridNode } from '@/types';
import { CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck, BrainCircuit, Activity } from 'lucide-react';
import ClientOnly from './ClientOnly';

interface TradeLogProps {
    trades: TradeRecord[];
    nodes: GridNode[];
}

function timeAgo(timestamp: number): string {
    const diff = Math.max(0, Date.now() / 1000 - timestamp);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

export default function TradeLog({ trades, nodes }: TradeLogProps) {
    const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.node_id, n])), [nodes]);

    return (
        <ClientOnly>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Activity size={16} className="color-battery-green" />
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                            Settlement Ledger
                        </h2>
                    </div>
                </div>

                {/* Trade entries */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {trades.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.3 }}>
                            <Clock size={40} color="var(--text-muted)" />
                            <p style={{ fontSize: 13, textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)' }}>
                                AWAITING MARKET LIQUIDITY
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {trades.map((trade) => {
                                const seller = nodeMap[trade.seller_id];
                                const buyer = nodeMap[trade.buyer_id];
                                const savings = ((8.50 - trade.price_kwh) * trade.energy_kwh).toFixed(2);

                                return (
                                    <motion.div
                                        key={trade.trade_id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="trade-entry"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--solar-gold)' }}>
                                                    {seller?.owner_name.split(' ')[0] || trade.seller_id.slice(0, 6)}
                                                </span>
                                                <ArrowRight size={10} color="var(--text-muted)" />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--energy-blue)' }}>
                                                    {buyer?.owner_name.split(' ')[0] || trade.buyer_id.slice(0, 6)}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                {timeAgo(trade.timestamp)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>
                                                {trade.energy_kwh.toFixed(3)} kWh
                                            </span>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>AT</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--battery-green)', fontWeight: 800 }}>
                                                ₹{trade.price_kwh.toFixed(2)}
                                            </span>
                                            {trade.validated && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                                                    {trade.sentinel_verified && (
                                                        <span style={{ fontSize: 7, fontWeight: 900, color: '#00e5ff', background: 'rgba(0, 229, 255, 0.1)', padding: '1px 4px', borderRadius: 2 }}>
                                                            SATELLITE VERIFIED
                                                        </span>
                                                    )}
                                                    <ShieldCheck size={14} color="var(--battery-green)" />
                                                </div>
                                            )}
                                        </div>

                                        {trade.explanation && (
                                            <div style={{
                                                padding: '8px 10px', borderRadius: 8,
                                                background: 'var(--bg-app)',
                                                border: '1px solid var(--border-subtle)',
                                                fontSize: 10.5, color: 'var(--text-secondary)',
                                                lineHeight: 1.4, display: 'flex', gap: 8
                                            }}>
                                                <Activity size={12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--energy-blue)' }} />
                                                <span>{trade.explanation}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase' }}>
                                                TX: {trade.trade_id.slice(0, 8)}
                                            </span>
                                            <div style={{
                                                fontSize: 9, color: 'var(--solar-gold)', fontWeight: 800,
                                                background: 'rgba(245, 158, 11, 0.08)', padding: '2px 6px', borderRadius: 4
                                            }}>
                                                SAVED ₹{savings}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </ClientOnly>
    );
}
