'use client';
import React from 'react';
import { motion } from 'framer-motion';
import type { GridMetrics, CloudForecast } from '@/types';
import { Sun, Zap, Leaf, IndianRupee, Cloud, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import ClientOnly from './ClientOnly';

interface MetricsPanelProps {
    metrics: GridMetrics;
    cloud: CloudForecast;
}

interface MetricCardProps {
    label: string;
    value: string;
    sub?: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    delay?: number;
}

function MetricCard({ label, value, sub, color, bgColor, icon, delay = 0 }: MetricCardProps) {
    return (
        <motion.div
            className="glass-card metric-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            style={{ flex: 1, minWidth: 160 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="metric-label">{label}</span>
                <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
            </div>
            <div className="metric-value" style={{ color }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
        </motion.div>
    );
}

export default function MetricsPanel({ metrics, cloud }: MetricsPanelProps) {
    const curtailmentPct = metrics.total_solar_kw > 0
        ? Math.max(0, ((metrics.total_solar_kw - metrics.total_load_kw) / metrics.total_solar_kw * 100)).toFixed(0)
        : '0';

    const cloudAlert = cloud.cloud_coverage_pct > 20 && cloud.eta_minutes < 30;

    return (
        <ClientOnly>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <MetricCard
                    label="Live Generation"
                    value={`${metrics.total_solar_kw.toFixed(1)} kW`}
                    sub={`${curtailmentPct}% Efficient`}
                    color="var(--solar-gold)"
                    bgColor="var(--bg-accent)"
                    icon={<Sun size={20} color="var(--solar-gold)" />}
                    delay={0}
                />
                <MetricCard
                    label="Real-time Load"
                    value={`${metrics.total_load_kw.toFixed(1)} kW`}
                    sub="Consumption Rate"
                    color="var(--load-purple)"
                    bgColor="var(--bg-accent)"
                    icon={<TrendingUp size={20} color="var(--load-purple)" />}
                    delay={0.05}
                />
                <MetricCard
                    label="P2P Settlement"
                    value={`${metrics.total_traded_kwh.toFixed(2)} kWh`}
                    sub="Active Trades"
                    color="var(--energy-blue)"
                    bgColor="var(--bg-accent)"
                    icon={<Zap size={20} color="var(--energy-blue)" />}
                    delay={0.1}
                />
                <MetricCard
                    label="ESG Impact"
                    value={`${metrics.co2_saved_kg.toFixed(1)} kg`}
                    sub="CO₂ Offset (CEA)"
                    color="var(--battery-green)"
                    bgColor="var(--bg-accent)"
                    icon={<Leaf size={20} color="var(--battery-green)" />}
                    delay={0.15}
                />
                <MetricCard
                    label="Market Savings"
                    value={`₹${metrics.money_saved.toFixed(2)}`}
                    sub="vs Utility Pool"
                    color="var(--solar-gold)"
                    bgColor="var(--bg-accent)"
                    icon={<IndianRupee size={20} color="var(--solar-gold)" />}
                    delay={0.2}
                />

                {/* Operations Intel Card */}
                <motion.div
                    className="glass-card metric-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    style={{
                        flex: 1, minWidth: 200,
                        borderColor: cloudAlert ? 'var(--danger-red)' : 'var(--bg-accent)',
                        background: cloudAlert ? 'rgba(239, 68, 68, 0.05)' : '#fff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span className="metric-label">Atmospheric Intel</span>
                        <div style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: cloudAlert ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {cloudAlert ? <AlertTriangle size={20} color="var(--danger-red)" /> : <Cloud size={20} color="var(--energy-blue)" />}
                        </div>
                    </div>
                    <div className="metric-value" style={{
                        color: cloudAlert ? 'var(--danger-red)' : 'var(--text-primary)', fontSize: 24
                    }}>
                        {cloud.cloud_coverage_pct.toFixed(0)}% <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>Coverage</span>
                    </div>
                    <div style={{ fontSize: 11, color: cloudAlert ? 'var(--danger-red)' : 'var(--text-muted)', marginTop: 4, fontWeight: 700 }}>
                        {cloudAlert
                            ? `ALERT: INTERFERENCE IN ${cloud.eta_minutes.toFixed(0)} MIN`
                            : cloud.eta_minutes < 999 ? `EXPECTED SHIFT: ${cloud.eta_minutes.toFixed(0)} MIN` : 'STABLE FORECAST'
                        }
                    </div>
                    <div className="progress-bar" style={{ marginTop: 12 }}>
                        <div className="progress-fill" style={{
                            width: `${cloud.cloud_coverage_pct}%`,
                            background: cloudAlert
                                ? 'var(--danger-red)'
                                : 'var(--energy-blue)',
                        }} />
                    </div>
                </motion.div>
            </div>
        </ClientOnly>
    );
}
