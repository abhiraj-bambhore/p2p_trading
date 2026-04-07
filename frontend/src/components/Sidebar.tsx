'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Zap, LayoutDashboard, Map, MessageSquare,
    WifiOff, Activity, Cpu, Database, Settings, ShieldCheck
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import ClientOnly from './ClientOnly';

interface SidebarProps {
    connected: boolean;
    tick: number;
    cloud?: any;
}

const NAV_ITEMS = [
    { href: '/', label: 'DASHBOARD', icon: LayoutDashboard, desc: 'Main Operations' },
    { href: '/grid', label: 'GRID MAP', icon: Map, desc: 'Network Topology' },
    { href: '/conversations', label: 'AGENT INTEL', icon: MessageSquare, desc: 'AI Conversations' },
    { href: '/safety', label: 'SAFETY', icon: ShieldCheck, desc: 'Trading Limits' },
];

export default function Sidebar({ connected, tick, cloud }: SidebarProps) {
    const pathname = usePathname();

    return (
        <nav className="app-sidebar" style={{
            width: 200,
            background: 'rgba(4,8,16,0.97)',
            borderRight: '1px solid rgba(0,255,136,0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
        }}>
            {/* Logo */}
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(0,255,136,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 18px rgba(0,255,136,0.4)',
                        }}
                    >
                        <Zap size={16} color="#000" strokeWidth={3} />
                    </motion.div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#e2f0ff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                            FLUX<span style={{ color: '#00ff88', textShadow: '0 0 8px rgba(0,255,136,0.5)' }}>CORE</span>
                        </div>
                        <div style={{ fontSize: 7, color: 'rgba(200,230,255,0.55)', letterSpacing: '0.12em', marginTop: 1, fontWeight: 700, textTransform: 'uppercase' }}>
                            Energy Orchestrator
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,255,0.04)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(0,229,255,0.1)' }}>
                    <Map size={10} color="#00e5ff" />
                    <span style={{ fontSize: 8, color: '#00e5ff', fontWeight: 900, fontFamily: 'monospace' }}>BENGALURU CORRIDOR [IN]</span>
                </div>
            </div>

            {/* Connection status */}
            <ClientOnly>
                <div style={{
                    padding: '8px 14px',
                    background: connected ? 'rgba(0,255,136,0.04)' : 'rgba(255,51,102,0.04)',
                    borderBottom: '1px solid rgba(0,255,136,0.04)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <div className={`pulse-dot ${connected ? 'green' : ''}`}
                        style={{ background: connected ? undefined : '#ff3366', boxShadow: connected ? undefined : '0 0 6px #ff3366' }} />
                    <span style={{
                        fontSize: 8.5, fontWeight: 900, letterSpacing: '0.08em',
                        color: connected ? '#00ff88' : '#ff3366', fontFamily: 'monospace'
                    }}>
                        {connected ? 'SATELLITE SYNC ACTIVE' : 'ORCHESTRATOR OFFLINE'}
                    </span>
                </div>
            </ClientOnly>

            {/* Weather & Cloud Movements (New) */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,255,136,0.06)', background: 'rgba(4,12,24,0.3)' }}>
                <div style={{ fontSize: 7.5, color: 'rgba(200,230,255,0.45)', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Atmospheric Intel
                </div>
                {cloud ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Activity size={10} color="#00e5ff" />
                                <span style={{ fontSize: 9, color: '#e2f0ff', fontWeight: 800 }}>ESA COPERNICUS</span>
                            </div>
                            <span style={{ fontSize: 8.5, color: '#00ff88', fontWeight: 900, fontFamily: 'monospace' }}>L2A_S2</span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: '7px 10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 7, color: 'rgba(125,165,200,0.6)', fontWeight: 800 }}>CLOUD COVERAGE</span>
                                <span style={{ fontSize: 8.5, color: '#00ff88', fontWeight: 900 }}>{cloud.cloud_coverage_pct?.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cloud.cloud_coverage_pct}%` }}
                                    style={{ height: '100%', background: '#00ff88' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '5px 8px', borderRadius: 4 }}>
                                <div style={{ fontSize: 7, color: 'rgba(125,165,200,0.5)', fontWeight: 700 }}>ETA</div>
                                <div style={{ fontSize: 10, color: '#00e5ff', fontWeight: 900 }}>{cloud.eta_minutes < 999 ? `${cloud.eta_minutes.toFixed(0)}m` : 'CLR'}</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '5px 8px', borderRadius: 4 }}>
                                <div style={{ fontSize: 7, color: 'rgba(125,165,200,0.5)', fontWeight: 700 }}>VELOCITY</div>
                                <div style={{ fontSize: 10, color: '#ffd700', fontWeight: 900 }}>{cloud.velocity_kmh?.toFixed(0)} km/h</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: 8, color: 'rgba(125,165,200,0.3)', fontFamily: 'monospace', textAlign: 'center', padding: '10px 0' }}>
                        WAITING FOR SATELLITE...
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div style={{ padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 7, color: 'rgba(200,230,255,0.45)', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 6 }}>
                    Navigation
                </div>
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            style={{ padding: '9px 10px', fontSize: 10 }}
                        >
                            <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: '#ffffff' }}>{item.label}</div>
                                <div style={{ fontSize: 8, color: 'rgba(200,225,255,0.55)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'none', marginTop: 1 }}>
                                    {item.desc}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Optimization Engine Status (New) */}
            <div style={{ margin: '0 8px 12px', borderRadius: 6, background: 'rgba(0,229,255,0.02)', border: '1px solid rgba(0,229,255,0.1)', padding: '10px' }}>
                <div style={{ fontSize: 7.5, color: 'rgba(200,225,255,0.45)', fontWeight: 900, letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>
                    Optimization Engine
                </div>
                {[
                    { label: 'CURTAILMENT', value: '0.04%', color: '#00ff88' },
                    { label: 'DEMAND SHIFT', value: 'ACTIVE', color: '#00e5ff' },
                    { label: 'BATTERY_SOC', value: 'NORMAL', color: '#ffd700' },
                ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 8, color: 'rgba(125,165,200,0.6)', fontWeight: 700 }}>{item.label}</span>
                        <span style={{ fontSize: 8.5, color: item.color, fontWeight: 900, fontFamily: 'monospace' }}>{item.value}</span>
                    </div>
                ))}
            </div>

            {/* System Status (Condensed) */}
            <div style={{ margin: '0 8px', borderRadius: 6, background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px' }}>
                {[
                    { icon: Cpu, label: 'SYNC TICK', value: `#${tick}`, color: '#93b8d8' },
                    { icon: Activity, label: 'AGENTS', value: 'ONLINE', color: '#00ff88' },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(147,184,216,0.5)', fontSize: 8, fontWeight: 700 }}>
                                <Icon size={9} />
                                <span>{item.label}</span>
                            </div>
                            <span style={{ fontSize: 8.5, color: item.color, fontWeight: 900, fontFamily: 'monospace' }}>
                                {item.value}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Wallet */}
            <div style={{ padding: '0 8px 8px' }}>
                <ClientOnly>
                    <WalletConnect />
                </ClientOnly>
            </div>

            {/* Footer */}
            <div style={{
                padding: '8px 14px', borderTop: '1px solid rgba(0,255,136,0.06)',
                display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: 0.35, transition: 'opacity 0.2s'
            }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
            >
                <Settings size={11} color="rgba(125,165,200,0.6)" />
                <span style={{ fontSize: 8.5, color: 'rgba(125,165,200,0.6)', fontWeight: 700, letterSpacing: '0.08em' }}>SYSTEM CONFIG</span>
            </div>
        </nav>
    );
}
