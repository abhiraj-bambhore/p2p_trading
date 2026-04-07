'use client';
import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import type { GridNode as FluxNode, TradeRecord, CloudForecast } from '@/types';

const NODE_COLOR: Record<string, string> = {
    solar: '#ffd700',
    battery: '#00ff88',
    ev: '#00e5ff',
    load: '#b44aff',
    hybrid: '#00ff88',
};

interface GridMapProps {
    nodes: FluxNode[];
    trades: TradeRecord[];
    affectedNodes: string[];
    cloud?: CloudForecast;
}

export default function GridMap({ nodes, trades, affectedNodes, cloud }: GridMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [W, setW] = useState(800);
    const [H, setH] = useState(480);
    const [tick, setTick] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [selected, setSelected] = useState<string | null>(null);
    const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number, y: number }>>({});
    const [isGrabbing, setIsGrabbing] = useState(false);
    const draggingCanvas = useRef(false);
    const draggingNode = useRef<string | null>(null);
    const lastMouse = useRef({ x: 0, y: 0 });
    const fitted = useRef(false);

    useEffect(() => {
        const id = setInterval(() => setTick(t => (t + 1) % 2000), 30);
        return () => clearInterval(id);
    }, []);

    useLayoutEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const r = containerRef.current.getBoundingClientRect();
                if (r.width > 0) setW(r.width);
                if (r.height > 0) setH(r.height);
            }
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const fit = useCallback(() => {
        if (nodes.length === 0 || W === 0) return;
        const xs = nodes.map(n => n.x_pos), ys = nodes.map(n => n.y_pos);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const padPx = 140;
        const scaleX = (W - padPx * 2) / (maxX - minX || 1);
        const scaleY = (H - padPx * 2) / (maxY - minY || 1);
        const s = Math.min(scaleX, scaleY, 1.2);
        setPan({
            x: (W - (maxX + minX) * s) / 2,
            y: (H - (maxY + minY) * s) / 2,
        });
        setScale(s);
        setNodeOffsets({}); // Reset manual moves on fit
    }, [nodes, W, H]);

    useEffect(() => {
        if (nodes.length > 0 && W > 0 && !fitted.current) { fit(); fitted.current = true; }
    }, [nodes.length, W, fit]);

    const onPointerDown = (e: React.PointerEvent, nodeId: string | null = null) => {
        if (e.button !== 0) return;
        setIsGrabbing(true);
        if (nodeId) {
            draggingNode.current = nodeId;
            setSelected(nodeId);
        } else {
            draggingCanvas.current = true;
        }
        lastMouse.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const dx = (e.clientX - lastMouse.current.x);
        const dy = (e.clientY - lastMouse.current.y);
        lastMouse.current = { x: e.clientX, y: e.clientY };

        if (draggingNode.current) {
            const id = draggingNode.current;
            setNodeOffsets(prev => ({
                ...prev,
                [id]: {
                    x: (prev[id]?.x || 0) + dx / scale,
                    y: (prev[id]?.y || 0) + dy / scale
                }
            }));
        } else if (draggingCanvas.current) {
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        }
    };

    const onPointerUp = () => {
        setIsGrabbing(false);
        draggingCanvas.current = false;
        draggingNode.current = null;
    };
    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.9;
        const rect = containerRef.current!.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setScale(s => {
            const ns = Math.max(0.2, Math.min(4, s * factor));
            setPan(p => ({
                x: cx - (cx - p.x) * (ns / s),
                y: cy - (cy - p.y) * (ns / s),
            }));
            return ns;
        });
    };

    const pos: Record<string, { sx: number; sy: number, x: number, y: number }> = {};
    nodes.forEach(n => {
        const off = nodeOffsets[n.node_id] || { x: 0, y: 0 };
        const realX = n.x_pos + off.x;
        const realY = n.y_pos + off.y;
        pos[n.node_id] = {
            sx: realX * scale + pan.x,
            sy: realY * scale + pan.y,
            x: realX,
            y: realY
        };
    });
    const nodeMap = Object.fromEntries(nodes.map(n => [n.node_id, n]));

    const activeEdges = trades.filter(t => {
        if (!pos[t.seller_id] || !pos[t.buyer_id]) return false;
        if (selected) return t.seller_id === selected || t.buyer_id === selected;
        return true;
    }).slice(0, 25);

    const R = Math.max(28, 36 * scale);

    return (
        <div ref={containerRef}
            style={{
                width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
                background: 'radial-gradient(ellipse at 30% 40%, rgba(0,30,60,0.5) 0%, #04080f 70%)',
                cursor: isGrabbing ? 'grabbing' : 'crosshair', userSelect: 'none',
            }}
            onPointerDown={(e) => onPointerDown(e)} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}
        >
            {/* Overlay Controls */}
            <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, display: 'flex', gap: 8 }}>
                <div style={{
                    padding: '6px 14px', borderRadius: 4, background: 'rgba(4,12,24,0.92)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    fontSize: 10, color: '#00e5ff', fontFamily: 'monospace', fontWeight: 900,
                }}>
                    {selected ? '● FOCUSED NODE' : '◆ GLOBAL ENERGY FLOW'}
                </div>
                <div style={{
                    padding: '6px 14px', borderRadius: 4, background: 'rgba(4,12,24,0.92)',
                    border: '1px solid rgba(0,255,136,0.2)',
                    fontSize: 10, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900,
                }}>
                    {activeEdges.length} FLOWS ACTIVE
                </div>
            </div>

            <button onPointerDown={e => e.stopPropagation()}
                onClick={() => { fitted.current = false; fit(); }}
                style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 20,
                    padding: '6px 14px', borderRadius: 4,
                    background: 'rgba(4,12,24,0.92)', border: '1px solid rgba(0,255,136,0.2)',
                    color: '#00ff88', cursor: 'pointer', fontSize: 10, fontWeight: 900,
                    fontFamily: 'monospace', letterSpacing: '0.08em'
                }}>
                ◎ RECENTER
            </button>

            <svg width={W} height={H} style={{ position: 'absolute', inset: 0, display: 'block' }}>
                <defs>
                    <marker id="arrN" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <path d="M0,0 L8,4 L0,8 Z" fill="#00ff88" />
                    </marker>
                    <filter id="gGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="gGlowSel" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Grid dots */}
                {Array.from({ length: Math.ceil(W / 50) + 1 }, (_, xi) =>
                    Array.from({ length: Math.ceil(H / 50) + 1 }, (_, yi) => (
                        <circle key={`${xi}${yi}`} cx={xi * 50} cy={yi * 50} r={1.2} fill="rgba(0,255,136,0.04)" />
                    ))
                )}

                {/* ─── BACKBONE CONNECTIONS (always visible) ─── */}
                {nodes.map((node, i) =>
                    nodes.slice(i + 1).filter(target => {
                        const a = pos[node.node_id], b = pos[target.node_id];
                        if (!a || !b) return false;
                        // Use original coordinates for connectivity logic but pos for visual
                        return Math.hypot(node.x_pos - target.x_pos, node.y_pos - target.y_pos) < 280;
                    }).map(target => {
                        const a = pos[node.node_id], b = pos[target.node_id];
                        return (
                            <line key={`bb-${node.node_id}-${target.node_id}`}
                                x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                                stroke="rgba(0,229,255,0.12)" strokeWidth={1.5}
                                strokeDasharray="8 5" />
                        );
                    })
                )}

                {/* ─── ACTIVE FLOWS ─── */}
                {activeEdges.map((trade, idx) => {
                    const s = pos[trade.seller_id], d = pos[trade.buyer_id];
                    const mx = (s.sx + d.sx) / 2, my = (s.sy + d.sy) / 2 - 30 * scale;
                    const offset = -((tick * 2.5 + idx * 10) % 28);
                    const isRel = selected === trade.seller_id || selected === trade.buyer_id;
                    const opacity = selected ? (isRel ? 1 : 0.1) : 0.8;
                    return (
                        <g key={trade.trade_id} opacity={opacity} style={{ transition: 'opacity 0.3s' }}>
                            <path d={`M${s.sx},${s.sy} Q${mx},${my} ${d.sx},${d.sy}`}
                                fill="none" stroke="rgba(0,255,136,0.18)" strokeWidth={Math.max(5, 8 * scale)} />
                            <path d={`M${s.sx},${s.sy} Q${mx},${my} ${d.sx},${d.sy}`}
                                fill="none" stroke="#00ff88" strokeWidth={Math.max(1.8, 2.5 * scale)}
                                strokeDasharray="8 5" strokeDashoffset={offset} markerEnd="url(#arrN)" />
                            {isRel && scale > 0.3 && (
                                <g transform={`translate(${mx},${my})`}>
                                    <rect x={-34} y={-13} width={68} height={22} rx={5}
                                        fill="rgba(4,12,24,0.96)" stroke="rgba(0,255,136,0.45)" strokeWidth={1} />
                                    <text textAnchor="middle" y={4} fontSize={11} fontWeight="900"
                                        fill="#00ff88" fontFamily="monospace">
                                        {trade.energy_kwh.toFixed(2)} kWh
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* ─── NODES ─── */}
                {nodes.map(node => {
                    const { sx, sy } = pos[node.node_id] ?? { sx: 0, sy: 0 };
                    const col = NODE_COLOR[node.node_type] || '#7fa8c9';
                    const isSel = selected === node.node_id;
                    const isCloud = affectedNodes.includes(node.node_id);
                    const isSolar = node.node_type === 'solar' || node.node_type === 'hybrid';
                    const isBattery = node.node_type === 'battery';
                    const roleColor = node.role === 'supply' ? '#00ff88' : node.role === 'demand' ? '#ff3366' : '#7fa8c9';

                    return (
                        <g key={node.node_id} transform={`translate(${sx},${sy})`}
                            style={{ cursor: draggingNode.current === node.node_id ? 'grabbing' : 'pointer' }}
                            onPointerDown={e => {
                                e.stopPropagation();
                                onPointerDown(e, node.node_id);
                            }}
                            onClick={() => setSelected(isSel ? null : node.node_id)}
                        >
                            {isSel && (
                                <circle r={R + 18} fill="none" stroke={col}
                                    strokeWidth={2} strokeDasharray="6 4" opacity={0.5} />
                            )}
                            <circle r={R + 5} fill={col} opacity={isSel ? 0.14 : 0.07}
                                filter={`url(#${isSel ? 'gGlowSel' : 'gGlow'})`} />
                            <circle r={R} fill="rgba(4,12,24,0.95)"
                                stroke={col} strokeWidth={isSel ? 2.5 : 2}
                                filter="url(#gGlow)" />

                            {/* Icon */}
                            {isSolar ? (
                                <g fill="none" stroke={col} strokeWidth={2} strokeLinecap="round">
                                    <circle r={R * 0.3} fill={col} fillOpacity={0.25} />
                                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                                        const rad = (angle * Math.PI) / 180;
                                        return (
                                            <line key={i}
                                                x1={Math.cos(rad) * R * 0.42} y1={Math.sin(rad) * R * 0.42}
                                                x2={Math.cos(rad) * R * 0.60} y2={Math.sin(rad) * R * 0.60} />
                                        );
                                    })}
                                </g>
                            ) : isBattery ? (
                                <g fill="none" stroke={col} strokeWidth={2}>
                                    <rect x={-R * 0.35} y={-R * 0.25} width={R * 0.7} height={R * 0.5} rx={R * 0.06}
                                        fill={col} fillOpacity={0.15} />
                                    <rect x={-R * 0.2} y={-R * 0.12} width={R * 0.3} height={R * 0.24} rx={2} fill={col} fillOpacity={0.5} />
                                </g>
                            ) : (
                                <g fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round">
                                    <polygon points={`0,${-R * 0.55} ${-R * 0.45},${-R * 0.1} ${R * 0.45},${-R * 0.1}`}
                                        fill={col} fillOpacity={0.3} />
                                    <rect x={-R * 0.35} y={-R * 0.1} width={R * 0.7} height={R * 0.4} rx={1}
                                        fill={col} fillOpacity={0.12} />
                                    <rect x={-R * 0.12} y={R * 0.12} width={R * 0.24} height={R * 0.28} rx={1}
                                        fill={col} fillOpacity={0.55} />
                                </g>
                            )}

                            {/* Role dot */}
                            <circle cx={R * 0.72} cy={-R * 0.72} r={6} fill={roleColor} opacity={0.9} />

                            {/* Label */}
                            {scale > 0.3 && (
                                <g>
                                    <text y={R + 18} textAnchor="middle"
                                        fontSize={Math.max(12, 13 * scale)} fontWeight="800"
                                        fill="#ffffff" fontFamily="monospace" opacity={0.95}>
                                        {node.label || node.owner_name?.split(' ')[0]}
                                    </text>
                                    <text y={R + 32} textAnchor="middle"
                                        fontSize={Math.max(10, 11 * scale)} fontWeight="600"
                                        fill="rgba(200,230,255,0.6)" fontFamily="monospace">
                                        {node.solar_kw > 0 ? `${node.solar_kw.toFixed(1)}kW` : 'LOAD'}
                                    </text>
                                </g>
                            )}

                            {isCloud && (
                                <g transform={`translate(${R * 0.55},${-R - 10})`}>
                                    <circle r={8} fill="#ffd700" opacity={0.92} />
                                    <text textAnchor="middle" y={4.5} fontSize={10} fontWeight="900" fill="#000">!</text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Node detail panel */}
            {selected && nodeMap[selected] && (() => {
                const n = nodeMap[selected];
                const col = NODE_COLOR[n.node_type] || '#7fa8c9';
                const battPct = n.battery_max_kwh > 0 ? (n.battery_kwh / n.battery_max_kwh * 100).toFixed(0) : 'N/A';
                return (
                    <div style={{
                        position: 'absolute', bottom: 16, left: 16, width: 260,
                        background: 'rgba(4,12,24,0.97)', border: `1px solid ${col}40`,
                        borderRadius: 8, padding: 16, zIndex: 100,
                        boxShadow: `0 0 30px ${col}20, 0 10px 30px rgba(0,0,0,0.5)`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
                                    {n.label || n.owner_name}
                                </div>
                                <div style={{ fontSize: 10, color: col, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                                    {n.node_type} Node
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)}
                                style={{ background: 'none', border: 'none', color: 'rgba(200,225,255,0.6)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {[
                                { label: 'GEN', value: `${n.solar_kw.toFixed(1)}kW`, col: '#ffd700' },
                                { label: 'LOAD', value: `${n.load_kw.toFixed(1)}kW`, col: '#b44aff' },
                                { label: 'NET', value: `${n.excess_kw > 0 ? '+' : ''}${n.excess_kw.toFixed(1)}kW`, col: n.excess_kw >= 0 ? '#00ff88' : '#ff3366' },
                            ].map(s => (
                                <div key={s.label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 5 }}>
                                    <div style={{ fontSize: 8, color: 'rgba(200,225,255,0.55)', fontFamily: 'monospace', fontWeight: 700 }}>{s.label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: s.col, fontFamily: 'monospace', marginTop: 2, textShadow: `0 0 10px ${s.col}` }}>
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {n.battery_max_kwh > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 8.5, color: 'rgba(200,225,255,0.5)', fontFamily: 'monospace', fontWeight: 700 }}>BATTERY</span>
                                    <span style={{ fontSize: 10, color: col, fontFamily: 'monospace', fontWeight: 900 }}>{battPct}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${(n.battery_kwh / n.battery_max_kwh) * 100}%`, background: col, boxShadow: `0 0 8px ${col}60` }} />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
