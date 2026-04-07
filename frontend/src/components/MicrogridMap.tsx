'use client';
import React, { useEffect, useState } from 'react';
import type { GridNode, TradeRecord } from '@/types';

interface MicrogridMapProps {
    nodes: GridNode[];
    trades: TradeRecord[];
    affectedNodes: string[];
    onNodeClick?: (nodeId: string | null) => void;
    selectedNode?: string | null;
}

const NODE_COLOR: Record<string, string> = {
    solar: '#ffd700',
    battery: '#00ff88',
    ev: '#00e5ff',
    load: '#b44aff',
    hybrid: '#00ff88',
};

// Well-spaced positions in a 600×440 viewBox
const FIXED_POSITIONS = [
    { x: 100, y: 200 }, { x: 200, y: 120 }, { x: 300, y: 80 },
    { x: 400, y: 120 }, { x: 500, y: 200 }, { x: 150, y: 310 },
    { x: 260, y: 260 }, { x: 350, y: 220 }, { x: 450, y: 290 },
    { x: 540, y: 160 }, { x: 120, y: 380 }, { x: 230, y: 360 },
    { x: 330, y: 340 }, { x: 430, y: 360 }, { x: 520, y: 340 },
];

function SunIcon({ R, color }: { R: number; color: string }) {
    return (
        <g fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <circle r={R * 0.3} fill={color} fillOpacity={0.25} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return (
                    <line key={i}
                        x1={Math.cos(rad) * R * 0.42} y1={Math.sin(rad) * R * 0.42}
                        x2={Math.cos(rad) * R * 0.60} y2={Math.sin(rad) * R * 0.60}
                    />
                );
            })}
        </g>
    );
}

function HouseIcon({ R, color }: { R: number; color: string }) {
    return (
        <g fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
            <polygon points={`0,${-R * 0.55} ${-R * 0.45},${-R * 0.1} ${R * 0.45},${-R * 0.1}`}
                fill={color} fillOpacity={0.3} />
            <rect x={-R * 0.35} y={-R * 0.1} width={R * 0.7} height={R * 0.4} rx={1}
                fill={color} fillOpacity={0.12} />
            <rect x={-R * 0.12} y={R * 0.12} width={R * 0.24} height={R * 0.28} rx={1}
                fill={color} fillOpacity={0.55} />
        </g>
    );
}

function BatteryIcon({ R, color }: { R: number; color: string }) {
    return (
        <g fill="none" stroke={color} strokeWidth={2}>
            <rect x={-R * 0.35} y={-R * 0.25} width={R * 0.7} height={R * 0.5} rx={R * 0.06}
                fill={color} fillOpacity={0.15} />
            <line x1={R * 0.35} y1={-R * 0.1} x2={R * 0.48} y2={-R * 0.1} />
            <line x1={R * 0.35} y1={R * 0.1} x2={R * 0.48} y2={R * 0.1} />
            <rect x={-R * 0.2} y={-R * 0.12} width={R * 0.3} height={R * 0.24} rx={2} fill={color} fillOpacity={0.5} />
        </g>
    );
}

export default function MicrogridMap({
    nodes, trades, affectedNodes, onNodeClick, selectedNode
}: MicrogridMapProps) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick(t => (t + 1) % 300), 35);
        return () => clearInterval(id);
    }, []);

    const displayNodes = nodes.slice(0, 15);
    const pos: Record<string, { x: number; y: number }> = {};
    displayNodes.forEach((n, i) => {
        pos[n.node_id] = FIXED_POSITIONS[i] || { x: 300, y: 220 };
    });

    const activeEdges = trades
        .filter(t => pos[t.seller_id] && pos[t.buyer_id])
        .slice(0, 14);

    const R = 36; // BIG nodes

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 440" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
                <defs>
                    <marker id="mgArr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <path d="M0,0 L8,4 L0,8 Z" fill="#00ff88" />
                    </marker>
                    <radialGradient id="mgBg" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="rgba(0,40,80,0.35)" />
                        <stop offset="100%" stopColor="rgba(4,8,16,0)" />
                    </radialGradient>
                    <filter id="nGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="nGlowSel" x="-70%" y="-70%" width="240%" height="240%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                <rect x={0} y={0} width={600} height={440} fill="url(#mgBg)" />

                {/* Subtle grid dots */}
                {Array.from({ length: 16 }, (_, xi) =>
                    Array.from({ length: 12 }, (_, yi) => (
                        <circle key={`d${xi}${yi}`} cx={xi * 40} cy={yi * 40} r={1} fill="rgba(0,255,136,0.04)" />
                    ))
                )}

                {/* ─── BACKBONE CONNECTIONS (always visible) ─── */}
                {displayNodes.map((node, i) => {
                    // Connect to all nearby nodes
                    return displayNodes.slice(i + 1).filter((_, j) => {
                        const a = pos[node.node_id];
                        const b = pos[displayNodes[i + 1 + j]?.node_id];
                        if (!a || !b) return false;
                        const dist = Math.hypot(a.x - b.x, a.y - b.y);
                        return dist < 220; // connect nodes within 220px
                    }).map((target) => {
                        const a = pos[node.node_id];
                        const b = pos[target.node_id];
                        if (!a || !b) return null;
                        return (
                            <line key={`bb-${node.node_id}-${target.node_id}`}
                                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                stroke="rgba(0,229,255,0.12)" strokeWidth={1.5}
                                strokeDasharray="6 4"
                            />
                        );
                    });
                })}

                {/* ─── ACTIVE TRADE FLOWS (bright green) ─── */}
                {activeEdges.map((trade, idx) => {
                    const s = pos[trade.seller_id];
                    const d = pos[trade.buyer_id];
                    if (!s || !d) return null;
                    const mx = (s.x + d.x) / 2;
                    const my = (s.y + d.y) / 2 - 28;
                    const offset = -((tick * 2.5 + idx * 10) % 30);
                    const isRel = selectedNode === trade.seller_id || selectedNode === trade.buyer_id;
                    const opacity = selectedNode ? (isRel ? 1 : 0.12) : 0.85;

                    return (
                        <g key={trade.trade_id} opacity={opacity} style={{ transition: 'opacity 0.3s' }}>
                            {/* Thick glow */}
                            <path d={`M${s.x},${s.y} Q${mx},${my} ${d.x},${d.y}`}
                                fill="none" stroke="rgba(0,255,136,0.2)" strokeWidth={8} />
                            {/* Animated dash */}
                            <path d={`M${s.x},${s.y} Q${mx},${my} ${d.x},${d.y}`}
                                fill="none" stroke="#00ff88" strokeWidth={2.5}
                                strokeDasharray="8 5" strokeDashoffset={offset}
                                markerEnd="url(#mgArr)" />
                            {/* kWh label on selected */}
                            {isRel && (
                                <g transform={`translate(${mx},${my})`}>
                                    <rect x={-34} y={-13} width={68} height={22} rx={5}
                                        fill="rgba(4,12,24,0.96)" stroke="rgba(0,255,136,0.5)" strokeWidth={1} />
                                    <text textAnchor="middle" y={4} fontSize={11} fontWeight="900"
                                        fill="#00ff88" fontFamily="monospace">
                                        {trade.energy_kwh.toFixed(2)} kWh
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* ─── NODES (large, clear icons) ─── */}
                {displayNodes.map((node, i) => {
                    const p = pos[node.node_id];
                    if (!p) return null;
                    const color = NODE_COLOR[node.node_type] || '#7fa8c9';
                    const isSel = selectedNode === node.node_id;
                    const isCloud = affectedNodes.includes(node.node_id);
                    const label = node.label || `H${i + 1}`;
                    const kw = node.solar_kw > 0 ? `${node.solar_kw.toFixed(1)} kW` : `${node.load_kw.toFixed(1)} kW`;
                    const roleColor = node.role === 'supply' ? '#00ff88' : node.role === 'demand' ? '#ff3366' : '#7fa8c9';

                    const NodeIcon = node.node_type === 'solar' || node.node_type === 'hybrid'
                        ? <SunIcon R={R} color={color} />
                        : node.node_type === 'battery'
                            ? <BatteryIcon R={R} color={color} />
                            : <HouseIcon R={R} color={color} />;

                    return (
                        <g key={node.node_id} transform={`translate(${p.x},${p.y})`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onNodeClick?.(isSel ? null : node.node_id)}
                        >
                            {/* Selection ring */}
                            {isSel && (
                                <circle r={R + 18} fill="none" stroke={color}
                                    strokeWidth={2} strokeDasharray="6 4" opacity={0.5} />
                            )}
                            {/* Outer glow */}
                            <circle r={R + 6} fill={color} opacity={isSel ? 0.14 : 0.07}
                                filter={`url(#${isSel ? 'nGlowSel' : 'nGlow'})`} />
                            {/* Main circle */}
                            <circle r={R} fill="rgba(4,12,24,0.95)"
                                stroke={color} strokeWidth={isSel ? 2.5 : 2}
                                filter="url(#nGlow)" />
                            {/* Icon */}
                            {NodeIcon}
                            {/* Role indicator */}
                            <circle cx={R * 0.72} cy={-R * 0.72} r={6} fill={roleColor}
                                opacity={0.9} filter="url(#nGlow)" />
                            {/* Node label */}
                            <text y={R + 18} textAnchor="middle"
                                fontSize={13} fontWeight="800" fill="#ffffff"
                                fontFamily="monospace" opacity={0.95}>
                                {label}
                            </text>
                            <text y={R + 32} textAnchor="middle"
                                fontSize={11} fontWeight="600" fill="rgba(200,230,255,0.65)"
                                fontFamily="monospace">
                                {kw}
                            </text>
                            {/* Cloud alert */}
                            {isCloud && (
                                <g transform={`translate(${R * 0.55},${-R - 10})`}>
                                    <circle r={8} fill="#ffd700" opacity={0.92} />
                                    <text textAnchor="middle" y={4.5} fontSize={10} fontWeight="900" fill="#000">!</text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Legend */}
                <g transform="translate(16, 420)">
                    {[
                        { color: '#ffd700', label: 'Generation' },
                        { color: '#b44aff', label: 'Load' },
                        { color: '#00e5ff', label: 'EV / Status' },
                        { color: '#00ff88', label: 'Battery' },
                    ].map((item, i) => (
                        <g key={i} transform={`translate(${i * 140}, 0)`}>
                            <rect width={12} height={12} rx={3} fill={item.color} opacity={0.85} y={-8} />
                            <text x={16} fontSize={10} fontWeight="700" fill="rgba(200,230,255,0.7)" fontFamily="monospace">
                                {item.label}
                            </text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
}
