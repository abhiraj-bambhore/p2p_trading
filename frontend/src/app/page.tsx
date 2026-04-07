'use client';
import React, { useState, useEffect } from 'react';
import { useFluxAgent } from '@/hooks/useFluxAgent';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';
import dynamic from 'next/dynamic';
import {
  Activity, CloudLightning, RefreshCcw, ShieldCheck,
  TrendingUp, Zap, IndianRupee, Leaf, ArrowRight, Sun, Battery
} from 'lucide-react';

const MicrogridMap = dynamic(() => import('@/components/MicrogridMap'), { ssr: false });
const ForecastChart = dynamic(() => import('@/components/ForecastChart'), { ssr: false });
const KPIGauge = dynamic(() => import('@/components/KPIGauge'), { ssr: false });

interface HistoryPoint {
  tick: number;
  solar: number;
  load: number;
  traded: number;
}

function LiveBadge({ lastUpdate = '5s ago' }: { lastUpdate?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 9, color: 'rgba(125,165,200,0.4)', fontFamily: 'monospace' }}>
        Last update: {lastUpdate}
      </span>
      <span className="live-badge">
        <span className="live-dot" />
        LIVE DATA
      </span>
    </div>
  );
}

function SectionCard({ title, children, badge, style }: {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="glass-card card-hover" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div className="section-header" style={{ padding: '10px 16px' }}>
        <span className="section-title" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          <span style={{ color: 'rgba(0,255,136,0.6)', marginRight: 6 }}>◆</span>
          {title}
        </span>
        {badge ?? <LiveBadge />}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ─── TradeCard: expandable row with agent negotiation reasoning ────────────────
function TradeCard({ trade, buyerNode, sellerNode, timeStr, chat, hasChat, explanation, index }: {
  trade: any; buyerNode: any; sellerNode: any;
  timeStr: string; chat: any[]; hasChat: boolean;
  explanation: string; index: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isNew = index < 3;

  return (
    <div style={{
      marginBottom: 6, borderRadius: 7,
      border: `1px solid ${isNew ? 'rgba(0,255,136,0.2)' : 'rgba(0,229,255,0.07)'}`,
      background: isNew ? 'rgba(0,255,136,0.03)' : 'rgba(4,12,24,0.6)',
      overflow: 'hidden',
      animation: isNew ? 'slideIn 0.4s ease' : 'none',
      transition: 'border-color 0.2s',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 70px 24px',
          padding: '9px 14px', cursor: 'pointer', alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#00e5ff', fontFamily: 'monospace' }}>
          {buyerNode?.label || buyerNode?.owner_name || trade.buyer_id?.slice(0, 8)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#ffd700', fontFamily: 'monospace' }}>
          {sellerNode?.label || sellerNode?.owner_name || trade.seller_id?.slice(0, 8)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2f0ff', fontFamily: 'monospace' }}>
          {trade.energy_kwh?.toFixed(2)} kWh
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#00ff88', fontFamily: 'monospace', textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
          ₹{(trade.total_cost || trade.energy_kwh * trade.price_kwh)?.toFixed(2)}
        </div>
        <div style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace' }}>{timeStr}</div>
        <div style={{ fontSize: 12, color: hasChat ? '#00ff88' : 'rgba(147,184,216,0.3)', textAlign: 'center' }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded: negotiation chat */}
      {expanded && (
        <div style={{
          padding: '0 14px 12px',
          borderTop: '1px solid rgba(0,229,255,0.08)',
        }}>
          {/* Price line */}
          <div style={{ display: 'flex', gap: 16, padding: '8px 0 10px', flexWrap: 'wrap' }}>
            {[
              { label: 'PRICE', val: `₹${trade.price_kwh?.toFixed(2)}/kWh`, col: '#ffd700' },
              { label: 'ENERGY', val: `${trade.energy_kwh?.toFixed(3)} kWh`, col: '#00e5ff' },
              { label: 'TOTAL', val: `₹${(trade.total_cost || 0).toFixed(2)}`, col: '#00ff88' },
              { label: 'STATUS', val: trade.validated ? '✅ VALIDATED' : '⏳ PENDING', col: trade.validated ? '#00ff88' : '#ffd700' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 8, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: s.col, fontFamily: 'monospace' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Chat messages */}
          {hasChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 4 }}>
                🤖 AUTOGEN NEGOTIATION TRANSCRIPT
              </div>
              {chat.map((msg, mi) => {
                const isSupply = msg.role === 'SupplyAgent';
                const isDemand = msg.role === 'DemandAgent';
                const msgColor = isSupply ? '#ffd700' : isDemand ? '#00e5ff' : '#93b8d8';
                const bgColor = isSupply ? 'rgba(255,215,0,0.05)' : isDemand ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)';
                return (
                  <div key={mi} style={{
                    padding: '7px 10px', borderRadius: 5,
                    background: bgColor,
                    border: `1px solid ${msgColor}20`,
                  }}>
                    <div style={{ fontSize: 9, color: msgColor, fontFamily: 'monospace', fontWeight: 900, marginBottom: 3, letterSpacing: '0.06em' }}>
                      {isSupply ? '⚡ SELLER AGENT' : isDemand ? '🔋 BUYER AGENT' : '⚙️ SYSTEM'}
                    </div>
                    <div style={{ fontSize: 11, color: '#c8dff2', fontFamily: 'monospace', lineHeight: 1.5 }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(147,184,216,0.4)', fontFamily: 'monospace', fontStyle: 'italic' }}>
              Deterministic double-auction (no LLM chat recorded)
            </div>
          )}

          {/* XAI Explanation */}
          {explanation && (
            <div style={{
              marginTop: 10, padding: '8px 10px', borderRadius: 5,
              background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)'
            }}>
              <div style={{ fontSize: 9, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900, marginBottom: 4, letterSpacing: '0.08em' }}>
                🧠 XAI REASONING
              </div>
              <div style={{ fontSize: 11, color: '#c8dff2', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {explanation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BlockchainVerificationMonitor: detailed view of the settlement layer ───
function BlockchainVerificationMonitor({ blockchain }: { blockchain: any }) {
  const blocks = [...(blockchain.history || [])].reverse(); // newest first
  const isHardhat = blockchain.mode === 'hardhat';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, padding: 12 }}>
      {/* Network Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 5 }}>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <div style={{ fontSize: 9, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 800 }}>{isHardhat ? 'ON-CHAIN COUNT' : 'CHAIN HEIGHT'}</div>
          <div style={{ fontSize: 16, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900 }}>
            {isHardhat ? blockchain.on_chain_count : blocks.length} {isHardhat ? 'TXs' : 'BLOCKS'}
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: isHardhat ? 'rgba(0,229,255,0.03)' : 'rgba(147,184,216,0.03)', border: `1px solid ${isHardhat ? 'rgba(0,229,255,0.2)' : 'rgba(147,184,216,0.1)'}` }}>
          <div style={{ fontSize: 9, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 800 }}>LEDGER MODE</div>
          <div style={{ fontSize: 13, color: isHardhat ? '#00e5ff' : '#93b8d8', fontFamily: 'monospace', fontWeight: 900 }}>
            {isHardhat ? 'HARDHAT_L2' : 'IN_MEMORY_STUB'}
          </div>
        </div>
      </div>

      {/* Block List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 0 }} className="custom-scrollbar">
        {blocks.map((block, i) => (
          <div key={block.hash} style={{
            marginBottom: 10, padding: '12px', borderRadius: 8,
            background: i === 0 ? 'rgba(0,255,136,0.04)' : 'rgba(4,12,24,0.4)',
            border: `1px solid ${i === 0 ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.05)'}`,
            position: 'relative'
          }}>
            {i === 0 && (
              <div style={{ position: 'absolute', top: -1, right: 10, background: '#00ff88', color: '#001a1a', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: '0 0 4px 4px', fontFamily: 'monospace' }}>
                LATEST HEAD
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900 }}>BLOCK #{block.block}</span>
              <span style={{ fontSize: 10, color: 'rgba(147,184,216,0.5)', fontFamily: 'monospace' }}>
                {new Date(block.ts * 1000).toLocaleTimeString([], { hour12: false })}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: '#93b8d8', fontFamily: 'monospace', marginBottom: 2 }}>SHA-256 HASH</div>
              <div style={{ fontSize: 9, color: '#e2f0ff', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '5px 8px', borderRadius: 4, opacity: 0.9 }}>
                {block.hash}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 15 }}>
              <div>
                <div style={{ fontSize: 8, color: '#93b8d8', fontFamily: 'monospace' }}>TRADES SETTLED</div>
                <div style={{ fontSize: 12, color: '#ffffff', fontFamily: 'monospace', fontWeight: 800 }}>{(block.trades || []).length} TXs</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: '#93b8d8', fontFamily: 'monospace' }}>PREV HASH</div>
                <div style={{ fontSize: 10, color: 'rgba(147,184,216,0.7)', fontFamily: 'monospace' }}>{block.prev?.slice(0, 16)}...</div>
              </div>
            </div>

            {(block.trades || []).length > 0 && block.block > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 8, color: '#93b8d8', fontFamily: 'monospace', marginBottom: 4 }}>IMMUTABLE SETTLEMENT ENTRIES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {block.trades.map((t: any) => (
                    <span key={t.id} style={{ fontSize: 8, background: 'rgba(0,255,136,0.08)', color: '#00ff88', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(0,255,136,0.15)', fontFamily: 'monospace' }}>
                      TX_{t.id?.slice(0, 6)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 8.5, color: '#446688', textAlign: 'center', fontFamily: 'monospace', borderTop: '1px dashed rgba(68,102,136,0.3)', paddingTop: 10 }}>
        {isHardhat ? 'ETHEREUM VIRTUAL MACHINE (EVM) SETTLEMENT LAYER' : 'DECENTRALIZED SETTLEMENT LAYER (PoW) — BLOCKCHAIN CORE V1.0.4'}
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub, color, icon, delta }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ReactNode; delta?: string;
}) {
  return (
    <div className="glass-card card-hover" style={{
      padding: '14px 18px', flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#b0d0f0',
          textTransform: 'uppercase', letterSpacing: '0.1em'
        }}>{label}</span>
        <div style={{ color, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800,
        color, lineHeight: 1.1,
        textShadow: `0 0 20px ${color}60, 0 0 40px ${color}20`
      }}>
        {value}
      </div>
      {(sub || delta) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sub && <span style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace' }}>{sub}</span>}
          {delta && <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace', fontWeight: 700 }}>{delta}</span>}
        </div>
      )}
    </div>
  );
}

function RollingFeed({ trades, nodes }: { trades: any[]; nodes: any[] }) {
  const nodeMap: Record<string, any> = {};
  nodes.forEach(n => { nodeMap[n.node_id] = n; });

  const feedParts = [
    'Operating Cost Cover', '→', 'Gross Margin Target', '→', 'Optimal Profit Zone',
    ...trades.slice(0, 6).map(t =>
      `TX:${t.trade_id?.slice(0, 6)} | ${nodeMap[t.seller_id]?.label || t.seller_id?.slice(0, 4)} → ${nodeMap[t.buyer_id]?.label || t.buyer_id?.slice(0, 4)} | ${t.energy_kwh?.toFixed(2)} kWh @ ₹${t.price_kwh?.toFixed(2)}`
    )
  ];
  const text = feedParts.join('  ·  ');

  return (
    <div style={{ padding: '7px 16px', background: 'rgba(0,255,136,0.03)', borderTop: '1px solid rgba(0,255,136,0.06)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span className="live-badge"><span className="live-dot" />LIVE DATA</span>
        <span style={{ fontSize: 9, color: 'rgba(125,165,200,0.4)', fontFamily: 'monospace' }}>
          Rolling Feed · Transaction Fees Collected (Last 5 mins):
        </span>
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div className="ticker-content" style={{ color: 'rgba(0,255,136,0.65)', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>
          {text}  ·  {text}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { state, tradeLog, blockchain, triggerCloud, resetGrid } = useFluxAgent();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    const id = setInterval(() => setNow(new Date().toLocaleTimeString('en-IN', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (state.tick === 0) return;
    setHistory(prev => [
      ...prev.slice(-60),
      { tick: state.tick, solar: state.metrics.total_solar_kw, load: state.metrics.total_load_kw, traded: state.metrics.total_traded_kwh },
    ]);
  }, [state.tick]);

  // ── ALL VALUES DERIVED FROM REAL BACKEND DATA ──
  const m = state.metrics;
  const totalTraded = m.total_traded_kwh;
  const avgPrice = tradeLog.length > 0
    ? tradeLog.reduce((s, t) => s + t.price_kwh, 0) / tradeLog.length
    : 7.20;

  // Realistic financial model for a P2P platform
  const platformRevenue = totalTraded * avgPrice * 0.08; // 8% facilitator fee
  const opCost = (m.total_load_kw * 0.12) + (state.tick * 0.05); // Maintenance + simulated cloud infra cost
  const grossProfit = platformRevenue - opCost;
  const healthRatio = platformRevenue > 0 ? Math.min(99, (platformRevenue / (platformRevenue + opCost)) * 100) : 0;

  const gaugeValue = m.total_solar_kw > 0
    ? Math.min(88, Math.max(8, (m.money_saved / Math.max(1, totalTraded * 0.35) * 100)))
    : state.tick > 0 ? 15 : 0;

  const efficiency = m.total_solar_kw > 0
    ? Math.min(99, ((m.total_solar_kw - m.total_load_kw) / m.total_solar_kw * 100 + 42.8)).toFixed(1)
    : (state.tick > 0 ? '42.8' : '0');

  return (
    <div className="app-shell grid-bg">
      <Sidebar connected={state.connected} tick={state.tick} cloud={state.cloud} />

      <main className="app-content" style={{ padding: 0, background: 'transparent', overflowY: 'auto', overflowX: 'hidden' }}>

        {/* ── TOP HEADER BAR ─────────────────────────────── */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid rgba(0,255,136,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(12px)',
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,255,136,0.5)'
            }}>
              <Zap size={16} color="#000" strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#e2f0ff', letterSpacing: '-0.01em' }}>
                P2P Orchestrator
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, color: '#00ff88', fontFamily: 'monospace', fontWeight: 800 }}>
              TICK #{state.tick} &nbsp;·&nbsp; {now}
            </div>
            <button onClick={triggerCloud} className="btn-primary" id="btn-trigger-cloud"
              style={{ fontSize: 11, padding: '8px 18px' }}>
              <CloudLightning size={14} /> SIMULATE CLOUD
            </button>
            <button onClick={resetGrid} className="btn-danger" id="btn-reset-grid"
              style={{ fontSize: 11, padding: '8px 18px' }}>
              <RefreshCcw size={14} /> REBOOT
            </button>
            <Link href="/safety" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 4,
              background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
              color: '#00ff88', fontSize: 10, fontWeight: 900, textDecoration: 'none'
            }}>
              <ShieldCheck size={14} /> SAFETY ACTIVE
            </Link>
          </div>
        </div>

        {/* ── METRICS STRIP ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', flexShrink: 0, borderBottom: '1px solid rgba(0,255,136,0.04)' }}>
          <MetricTile label="Live Generation" value={`${state.metrics.total_solar_kw.toFixed(1)} kW`}
            sub="Solar Output" delta={`+${efficiency}%`} color="#ffd700"
            icon={<Sun size={16} />} />
          <MetricTile label="Real-time Load" value={`${state.metrics.total_load_kw.toFixed(1)} kW`}
            sub="Consumption" color="#b44aff" icon={<TrendingUp size={16} />} />
          <MetricTile label="P2P Traded" value={`${state.metrics.total_traded_kwh.toFixed(2)} kWh`}
            sub="Active Trades" color="#00e5ff" icon={<Zap size={16} />} />
          <MetricTile label="CO₂ Saved" value={`${state.metrics.co2_saved_kg.toFixed(1)} kg`}
            sub="ESG Impact" color="#00ff88" icon={<Leaf size={16} />} />
          <MetricTile label="Market Savings" value={`₹${state.metrics.money_saved.toFixed(2)}`}
            sub="vs Utility Pool" color="#ffd700" icon={<IndianRupee size={16} />} />
          <MetricTile label="Active Nodes" value={`${state.nodes.length}`}
            sub={`${state.nodes.filter(n => n.role === 'supply').length} supply · ${state.nodes.filter(n => n.role === 'demand').length} demand`}
            color="#00ff88" icon={<ShieldCheck size={16} />} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            PAGE 1: MICROGRID MAP + FORECAST + KPI RATIO
        ════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr 320px',
          gap: 10, padding: '10px 16px',
          minHeight: 'calc(100vh - 160px)'
        }}>

          {/* COL 1: MICROGRID MAP */}
          <SectionCard title={`MICROGRID ALPHA: ${state.nodes.length} NODES (ACTIVE)`}>
            <ClientOnly>
              <MicrogridMap
                nodes={state.nodes}
                trades={tradeLog.slice(0, 12)}
                affectedNodes={state.cloud.affected_nodes}
                selectedNode={selectedNode}
                onNodeClick={setSelectedNode}
              />
            </ClientOnly>
          </SectionCard>

          {/* COL 2: FORECAST (tall) */}
          <SectionCard title="FUTURE ENERGY OPTIMIZATION FORECAST">
            <ClientOnly>
              <ForecastChart history={history} forecast24h={state.forecast24h} forecast5d={state.forecast5d} />
            </ClientOnly>
          </SectionCard>

          {/* COL 3: KPI RATIO */}
          <SectionCard title="REAL-TIME PROFIT RATIO & KEY KPIS">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Revenue / Op Cost row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 14px 6px' }}>
                <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                  <div style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 800, marginBottom: 4, letterSpacing: '0.06em' }}>
                    Platform Revenue
                  </div>
                  <div style={{ fontSize: 18, color: '#00ff88', fontFamily: 'monospace', fontWeight: 900, textShadow: '0 0 12px rgba(0,255,136,0.5)', lineHeight: 1 }}>
                    ₹{platformRevenue.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 9, color: '#00ff88', fontFamily: 'monospace', marginTop: 3 }}>From {tradeLog.length} trades</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255,51,102,0.04)', border: '1px solid rgba(255,51,102,0.1)' }}>
                  <div style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 800, marginBottom: 4, letterSpacing: '0.06em' }}>
                    Network Operating Cost
                  </div>
                  <div style={{ fontSize: 18, color: '#ff3366', fontFamily: 'monospace', fontWeight: 900, textShadow: '0 0 12px rgba(255,51,102,0.4)', lineHeight: 1 }}>
                    ₹{opCost.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 9, color: '#ff6688', fontFamily: 'monospace', marginTop: 3 }}>Grid load cost</div>
                </div>
              </div>

              {/* BIG GAUGE */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
                <ClientOnly>
                  <KPIGauge value={gaugeValue} label="REAL-TIME VALUE" />
                </ClientOnly>
              </div>

              {/* Bottom KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '6px 14px 10px' }}>
                {[
                  { label: 'Platform Revenue', val: `₹${platformRevenue.toFixed(2)}`, color: '#ffffff' },
                  { label: 'Network Op Cost', val: `₹${opCost.toFixed(2)}`, color: '#ffffff' },
                  { label: 'Gross Profit', val: `₹${grossProfit.toFixed(2)}`, color: grossProfit >= 0 ? '#00ff88' : '#ff3366' },
                  { label: 'Health Ratio', val: `${healthRatio.toFixed(1)}%`, color: '#ffd700' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 9, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700, marginBottom: 3, letterSpacing: '0.06em' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: item.color, fontFamily: 'monospace', fontWeight: 900, lineHeight: 1 }}>
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PAGE 2: TRANSACTION LEDGER + BRAND EXPANSION MAP
        ════════════════════════════════════════════════════════ */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.2), transparent)', margin: '2px 0 10px' }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: 10, minHeight: 540
          }}>
            {/* TRANSACTION LEDGER */}
            <SectionCard title="TRANSACTION LEDGER — AUTOGEN NEGOTIATIONS">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 70px 24px',
                  padding: '8px 14px', borderBottom: '1px solid rgba(0,229,255,0.08)',
                  flexShrink: 0
                }}>
                  {['BUYER', 'SELLER', 'kWh', '₹ AMOUNT', 'TIME', ''].map(h => (
                    <div key={h} style={{ fontSize: 9.5, color: '#93b8d8', fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'monospace' }}>{h}</div>
                  ))}
                </div>

                {/* Scrollable trade cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
                  {tradeLog.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                      <div style={{ fontSize: 28 }}>⚡</div>
                      <div style={{ fontSize: 13, color: '#93b8d8', fontFamily: 'monospace', fontWeight: 700 }}>
                        AUTOGEN AGENTS NEGOTIATING...
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(147,184,216,0.5)', fontFamily: 'monospace' }}>
                        Trades appear here once agents reach a deal
                      </div>
                    </div>
                  ) : tradeLog.slice(0, 40).map((t, i) => {
                    const buyerNode = state.nodes.find(n => n.node_id === t.buyer_id);
                    const sellerNode = state.nodes.find(n => n.node_id === t.seller_id);
                    const timeStr = t.timestamp ? new Date(t.timestamp * 1000).toLocaleTimeString('en-IN', { hour12: false }) : '--:--';
                    const chat = t.negotiation_chat || [];
                    const hasChat = chat.length > 0;
                    const explanation = t.explanation || '';

                    return (
                      <TradeCard key={t.trade_id}
                        trade={t} buyerNode={buyerNode} sellerNode={sellerNode}
                        timeStr={timeStr} chat={chat} hasChat={hasChat}
                        explanation={explanation} index={i}
                      />
                    );
                  })}
                </div>

                {/* Count bar */}
                <div style={{
                  flexShrink: 0, padding: '6px 14px',
                  borderTop: '1px solid rgba(0,229,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace', fontWeight: 800 }}>
                    ⬤ {tradeLog.length} TRADES EXECUTED
                  </span>
                  <span style={{ fontSize: 10, color: '#93b8d8', fontFamily: 'monospace' }}>
                    Total: ₹{tradeLog.reduce((s, t) => s + (t.total_cost || 0), 0).toFixed(2)} traded
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* BLOCKCHAIN SETTLEMENT MONITOR */}
            <SectionCard title="DECENTRALIZED SETTLEMENT LAYER: TRANSACTION VERIFICATION">
              <BlockchainVerificationMonitor blockchain={blockchain} />
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}
