'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sun, Battery, Zap, Home, Activity, Layers, Cpu } from 'lucide-react';
import type { GridNode } from '@/types';
import ClientOnly from './ClientOnly';

interface NodePanelProps {
    nodes: GridNode[];
    history: { tick: number; solar: number; load: number; traded: number }[];
}

const NODE_ICON: Record<string, React.ReactNode> = {
    solar: <Sun size={16} />,
    battery: <Battery size={16} />,
    ev: <Zap size={16} />,
    load: <Home size={16} />,
    hybrid: <Layers size={16} />
};

const NODE_COLOR: Record<string, string> = {
    solar: 'var(--solar-gold)',
    battery: 'var(--battery-green)',
    ev: 'var(--ev-cyan)',
    load: 'var(--load-purple)',
    hybrid: 'var(--battery-green)',
};

function NodeCard({ node }: { node: GridNode }) {
    const battPct = node.battery_max_kwh > 0 ? (node.battery_kwh / node.battery_max_kwh) * 100 : 0;
    const color = NODE_COLOR[node.node_type] || '#94a3b8';
    const icon = NODE_ICON[node.node_type] || <Home size={16} />;

    return (
        <div className="node-pill" style={{
            flexDirection: 'column', gap: 12, padding: '16px',
            background: '#ffffff', border: '1px solid #f1f5f9',
            borderRadius: 10, display: 'flex'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.owner_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {node.node_type}
                    </div>
                </div>
                <div style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                    background: node.role === 'supply' ? 'rgba(16, 185, 129, 0.1)' : node.role === 'demand' ? 'rgba(239, 68, 68, 0.1)' : '#f8fafc',
                    color: node.role === 'supply' ? 'var(--battery-green)' : node.role === 'demand' ? 'var(--danger-red)' : 'var(--text-muted)',
                    border: '1px solid currentColor',
                }}>
                    {node.role === 'supply' ? '↑ SUPPLY' : node.role === 'demand' ? '↓ DEMAND' : '○ STABLE'}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 12px', width: '100%' }}>
                {[
                    { label: 'GEN', value: `${node.solar_kw.toFixed(1)}kW`, col: 'var(--solar-gold)' },
                    { label: 'LOAD', value: `${node.load_kw.toFixed(1)}kW`, col: 'var(--load-purple)' },
                    { label: 'NET', value: `${node.excess_kw > 0 ? '+' : ''}${node.excess_kw.toFixed(1)}kW`, col: node.excess_kw >= 0 ? 'var(--battery-green)' : 'var(--danger-red)' },
                ].map(s => (
                    <div key={s.label}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: s.col, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Battery bar */}
            {node.battery_max_kwh > 0 && (
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>ENERGY RESERVES</span>
                        <span style={{ fontSize: 11, color: color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{battPct.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{
                            width: `${battPct}%`,
                            background: color,
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}

function PowerChart({ history }: { history: NodePanelProps['history'] }) {
    const data = history.slice(-30);
    return (
        <div className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Activity size={16} color="var(--energy-blue)" />
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Grid Oscilloscope
                </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <defs>
                        <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--solar-gold)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--solar-gold)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--load-purple)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--load-purple)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTraded" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--energy-blue)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--energy-blue)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="tick" hide />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="solar" stroke="var(--solar-gold)" fill="url(#gradSolar)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="load" stroke="var(--load-purple)" fill="url(#gradLoad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="traded" stroke="var(--energy-blue)" fill="url(#gradTraded)" strokeWidth={2} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function NodePanel({ nodes, history }: NodePanelProps) {
    return (
        <ClientOnly>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <PowerChart history={history} />
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Cpu size={16} color="var(--text-muted)" />
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Distributed Agents ({nodes.length})
                        </h3>
                    </div>
                    <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480 }}>
                        {nodes.map(n => <NodeCard key={n.node_id} node={n} />)}
                    </div>
                </div>
            </div>
        </ClientOnly>
    );
}
