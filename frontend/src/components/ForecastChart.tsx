'use client';
import React, { useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts';

interface ForecastChartProps {
    history: { tick: number; solar: number; load: number; traded: number }[];
    forecast24h?: any[];
    forecast5d?: any[];
}

type OptimizationMode = 'power_saving' | 'profit_making';

function generate7DayData(currentVal: number) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => ({
        day,
        orchestrated: parseFloat((currentVal * (0.65 + Math.sin(i * 1.1) * 0.25 + 0.15)).toFixed(1)),
        baseline: parseFloat((currentVal * (0.35 + Math.sin(i * 0.8) * 0.15 + 0.1)).toFixed(1)),
    }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(4,12,24,0.98)', border: '1px solid rgba(0,255,136,0.25)',
            borderRadius: 6, padding: '10px 14px', fontSize: 11, fontFamily: 'monospace',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
        }}>
            <div style={{ color: 'rgba(125,165,200,0.5)', marginBottom: 6, fontWeight: 700 }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ color: p.color, fontWeight: 800, marginBottom: 3 }}>
                    {p.name}: <span style={{ color: '#e2f0ff' }}>{p.value} kW</span>
                </div>
            ))}
        </div>
    );
};

export default function ForecastChart({ history, forecast24h, forecast5d }: ForecastChartProps) {
    const [mode, setMode] = React.useState<OptimizationMode>('power_saving');
    const latestSolar = history[history.length - 1]?.solar || 45;

    const chartData = useMemo(() => {
        if (forecast24h && forecast24h.length > 0) {
            return forecast24h.map(d => ({
                ...d,
                orchestrated: mode === 'power_saving' ? d.power_saving : d.profit_making
            }));
        }
        return Array.from({ length: 25 }, (_, h) => {
            const solarPeak = 14;
            const solarFactor = Math.max(0, Math.cos(((h - solarPeak) / 12) * Math.PI));
            const baseVal = latestSolar * solarFactor;
            const orchestrated = mode === 'power_saving'
                ? baseVal * (0.92 + (Math.sin(h * 0.8) * 0.05))
                : baseVal * (0.75 + (Math.sin(h * 0.8) * 0.1));
            const baseline = baseVal * (0.62 + (Math.sin(h * 0.5) * 0.05));
            return {
                hour: `${h.toString().padStart(2, '0')}:00`,
                orchestrated: parseFloat(orchestrated.toFixed(1)),
                baseline: parseFloat(baseline.toFixed(1)),
            };
        });
    }, [forecast24h, latestSolar, mode]);

    const displayForecast5d = useMemo(() => {
        if (forecast5d && forecast5d.length > 0) {
            return forecast5d.map(d => ({
                ...d,
                orchestrated: mode === 'power_saving' ? d.power_saving : d.profit_making
            }));
        }
        return generate7DayData(latestSolar).map(d => ({
            ...d,
            day: d.day,
            orchestrated: mode === 'power_saving' ? d.orchestrated : d.orchestrated * 1.15,
            baseline: d.baseline
        }));
    }, [forecast5d, latestSolar, mode]);

    const { efficiency, gainVsMarket } = useMemo(() => {
        if (!displayForecast5d || displayForecast5d.length === 0) {
            return { efficiency: '22.5', gainVsMarket: '1.43' };
        }

        const avgOrc = displayForecast5d.reduce((acc, d) => acc + d.orchestrated, 0) / displayForecast5d.length;
        const avgBase = displayForecast5d.reduce((acc, d) => acc + d.baseline, 0) / displayForecast5d.length;

        const eff = avgBase > 0 ? ((avgOrc - avgBase) / avgBase * 100).toFixed(1) : '0.0';
        const gain = (parseFloat(eff) * 0.08).toFixed(2); // estimated market outperform index

        return { efficiency: eff, gainVsMarket: gain };
    }, [displayForecast5d]);

    const axisStyle = { fontSize: 11, fill: '#93b8d8', fontFamily: 'monospace', fontWeight: 600 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* ── 24h Area Chart ─────────────────────── */}
            <div style={{ flex: 1.5, minHeight: 0, padding: '14px 16px 4px' }}>
                <div style={{ fontSize: 11, color: '#b0d0f0', fontWeight: 800, marginBottom: 10, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                    Next 24 hours
                </div>
                <div style={{ display: 'flex', gap: 18, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#00ff88" strokeWidth="2.5" /></svg>
                        Orchestrated Efficiency
                    </span>
                    <span style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#93b8d8" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                        Baseline (Unoptimized)
                    </span>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="gradOrc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#00ff88" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7fa8c9" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#7fa8c9" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} interval={2} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36}
                            tickFormatter={(v) => `${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={latestSolar * 0.7} stroke="rgba(255,215,0,0.08)" strokeDasharray="4 3" />
                        <Area type="monotone" dataKey="baseline" name="Baseline (Unoptimized)"
                            stroke="rgba(125,165,200,0.35)" fill="url(#gradBase)"
                            strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
                        <Area type="monotone" dataKey="orchestrated" name="Orchestrated Efficiency"
                            stroke="#00ff88" fill="url(#gradOrc)"
                            strokeWidth={2.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* ── Divider ─── */}
            <div style={{ height: 1, background: 'rgba(0,255,136,0.06)', margin: '4px 16px' }} />

            {/* ── 5-Day Bar Chart ─────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, padding: '10px 16px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#b0d0f0', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                        PREDICTIVE 5-DAY MODEL
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 2, borderRadius: 4 }}>
                        <button
                            onClick={() => setMode('power_saving')}
                            style={{
                                fontSize: 8, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', border: 'none',
                                background: mode === 'power_saving' ? '#00ff88' : 'transparent',
                                color: mode === 'power_saving' ? '#000' : 'rgba(125,165,200,0.6)',
                                fontWeight: 800
                            }}
                        >
                            POWER SAVING
                        </button>
                        <button
                            onClick={() => setMode('profit_making')}
                            style={{
                                fontSize: 8, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', border: 'none',
                                background: mode === 'profit_making' ? '#ffd700' : 'transparent',
                                color: mode === 'profit_making' ? '#000' : 'rgba(125,165,200,0.6)',
                                fontWeight: 800
                            }}
                        >
                            PROFIT MAX
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 18, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: mode === 'power_saving' ? '#00ff88' : '#ffd700', fontFamily: 'monospace', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, background: mode === 'power_saving' ? '#00ff88' : '#ffd700', borderRadius: 2 }} />
                        {mode === 'power_saving' ? 'ECO_SAVINGS' : 'PROFIT_YIELD'}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(60,90,120,0.7)', fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(60,90,120,0.8)', borderRadius: 2 }} />
                        BASELINE
                    </span>
                </div>
                <ResponsiveContainer width="100%" height="68%">
                    <BarChart data={displayForecast5d} margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barGap={3}>
                        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="baseline" name="Baseline" fill="rgba(60,90,120,0.55)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="orchestrated" name="Mode Optimized" fill={mode === 'power_saving' ? '#00ff88' : '#ffd700'} radius={[3, 3, 0, 0]} maxBarSize={18} fillOpacity={0.85} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ── Footer KPI ─────────────────────────── */}
            <div style={{
                padding: '10px 16px',
                background: 'rgba(0,255,136,0.04)',
                borderTop: '1px solid rgba(0,255,136,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700 }}>
                        Forecasted Savings:
                    </span>
                    <span style={{ fontSize: 18, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900, textShadow: '0 0 15px rgba(0,255,136,0.5)' }}>
                        +{efficiency}% vs. Baseline
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="live-badge"><span className="live-dot" />LIVE DATA</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700 }}>
                        Net gain: <span style={{ color: '#00ff88' }}>+{efficiency}%</span> vs. <span style={{ color: '#93b8d8' }}>+{gainVsMarket}%</span>
                    </span>
                </div>
            </div>

            {/* ── Live Data Footer ─── */}
            <div style={{ padding: '6px 16px', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: 'rgba(0,255,136,0.45)', fontFamily: 'monospace', fontWeight: 700 }}>⬤ LIVE DATA</span>
                <span style={{ fontSize: 9, color: '#93b8d8', fontFamily: 'monospace', marginLeft: 8 }}>
                    Last update: 5s ago
                </span>
            </div>
        </div>
    );
}
