'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ShieldCheck, IndianRupee, AlertTriangle, Save, Bell } from 'lucide-react';
import { useFluxAgent } from '@/hooks/useFluxAgent';

export default function SafetyPage() {
    const { state } = useFluxAgent();
    const [limit, setLimit] = useState<number>(500);
    const [email, setEmail] = useState<string>('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const storedLimit = localStorage.getItem('p2p_daily_limit');
        const storedEmail = localStorage.getItem('p2p_alert_email');
        if (storedLimit) setLimit(Number(storedLimit));
        if (storedEmail) setEmail(storedEmail);
    }, []);

    const handleSave = async () => {
        localStorage.setItem('p2p_daily_limit', limit.toString());
        localStorage.setItem('p2p_alert_email', email);

        // Sync with backend
        try {
            await fetch('http://localhost:8000/api/safety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_limit: limit, email: email })
            });
        } catch (e) {
            console.error("Failed to sync safety settings with backend", e);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const expenditure = state.metrics?.total_expenditure || 0;
    const progress = Math.min(100, (expenditure / limit) * 100);

    return (
        <div className="app-shell grid-bg">
            <Sidebar connected={state.connected} tick={state.tick} cloud={state.cloud} />

            <main className="app-content" style={{ padding: '40px', background: 'transparent' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ShieldCheck size={24} color="#00ff88" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: 0 }}>Safety & Trading Limits</h1>
                            <p style={{ fontSize: 13, color: 'rgba(147,184,216,0.6)', margin: '4px 0 0' }}>
                                Configure automated stops and real-time Gmail alerts.
                            </p>
                        </div>
                    </div>

                    {/* Expenditure Progress */}
                    <div className="glass-card" style={{ marginBottom: 24, padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(147,184,216,0.6)', letterSpacing: '0.05em' }}>CURRENT DAILY CONSUMPTION</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: progress > 80 ? '#ff3366' : '#00ff88' }}>
                                ₹{expenditure.toFixed(2)} / ₹{limit}
                            </span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: progress > 80 ? 'linear-gradient(90deg, #ff3366, #ff00ff)' : 'linear-gradient(90deg, #00ff88, #00e5ff)',
                                transition: 'width 1s ease-out'
                            }} />
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <IndianRupee size={16} color="#ffd700" />
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#e2f0ff', letterSpacing: '0.05em' }}>DAILY TRADING CAP</span>
                                </div>
                                <p style={{ fontSize: 11, color: 'rgba(147,184,216,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                                    Maximum amount (in ₹) the P2P orchestrator is allowed to spend per day.
                                </p>

                                <div style={{ position: 'relative', width: 'fit-content' }}>
                                    <input
                                        type="number"
                                        value={limit}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                        style={{
                                            background: 'rgba(0,0,0,0.4)',
                                            border: '1px solid rgba(0,229,255,0.2)',
                                            borderRadius: 8,
                                            padding: '12px 16px 12px 40px',
                                            fontSize: 18,
                                            color: '#00ff88',
                                            fontFamily: 'monospace',
                                            fontWeight: 900,
                                            width: '200px',
                                            outline: 'none',
                                        }}
                                    />
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,255,136,0.5)', fontWeight: 800 }}>₹</span>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Bell size={16} color="#00e5ff" />
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#e2f0ff', letterSpacing: '0.05em' }}>GMAIL ALERT SYSTEM</span>
                                </div>
                                <p style={{ fontSize: 11, color: 'rgba(147,184,216,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                                    Receive a real-time notification when your spending crosses 80%.
                                </p>

                                <input
                                    type="email"
                                    placeholder="your-email@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid rgba(0,229,255,0.2)',
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        fontSize: 14,
                                        color: '#00e5ff',
                                        width: '100%',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('http://localhost:8000/api/safety/test', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.status === 'ok') alert('✅ Test email sent!');
                                        else alert('❌ Failed to send: ' + data.message);
                                    } catch (e) {
                                        alert('❌ Backend unreachable');
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '12px 24px',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#e2f0ff',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Bell size={18} />
                                SEND TEST EMAIL
                            </button>

                            <button
                                onClick={handleSave}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '12px 24px',
                                    borderRadius: 8,
                                    background: saved ? '#00ff88' : 'linear-gradient(135deg, #00e5ff, #00ff88)',
                                    color: '#001a1a',
                                    fontWeight: 900,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: saved ? '0 0 20px rgba(0,255,136,0.4)' : '0 4px 15px rgba(0,229,255,0.3)'
                                }}
                            >
                                {saved ? <ShieldCheck size={18} /> : <Save size={18} />}
                                {saved ? 'SETTINGS SECURED' : 'ACTIVATE GMAIL ALERTS'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
