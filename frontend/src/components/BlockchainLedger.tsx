'use client';
import React from 'react';
import { Database, Link as LinkIcon, Clock, Hash } from 'lucide-react';
import ClientOnly from './ClientOnly';

interface BlockchainLedgerProps {
    blockchain: any;
}

export default function BlockchainLedger({ blockchain }: BlockchainLedgerProps) {
    if (!blockchain) return null;
    const blocks = Array.isArray(blockchain) ? blockchain : (blockchain.history || []);
    const isHardhat = blockchain.mode === 'hardhat';

    return (
        <ClientOnly>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: '4px 8px', margin: '0 4px 8px', borderRadius: 4, background: isHardhat ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: 'rgba(125,165,200,0.5)', fontFamily: 'monospace' }}>MODE:</span>
                        <span style={{ fontSize: 8, color: isHardhat ? '#00e5ff' : '#7fa8c9', fontFamily: 'monospace', fontWeight: 900 }}>{isHardhat ? 'HARDHAT_L2' : 'STUB_MEM'}</span>
                    </div>

                    {blocks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(125,165,200,0.2)', fontSize: 10, fontFamily: 'monospace' }}>
                            <Clock size={20} style={{ opacity: 0.15, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                            SYNCHRONIZING WITH CHAIN...
                        </div>
                    )}

                    {[...blocks].reverse().map((block, i) => (
                        <div key={block.hash} style={{
                            padding: '10px 12px',
                            borderRadius: 5,
                            background: i === 0 ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${i === 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.04)'}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Hash size={10} color={i === 0 ? '#00ff88' : '#7fa8c9'} />
                                    <span style={{
                                        fontWeight: 900, color: i === 0 ? '#00ff88' : '#7fa8c9',
                                        fontSize: 9, fontFamily: 'monospace',
                                        textShadow: i === 0 ? '0 0 8px rgba(0,255,136,0.5)' : 'none'
                                    }}>
                                        BLOCK #{block.block}
                                    </span>
                                    {i === 0 && (
                                        <span style={{
                                            fontSize: 7, color: '#00ff88', background: 'rgba(0,255,136,0.1)',
                                            padding: '1px 5px', borderRadius: 2, fontFamily: 'monospace', fontWeight: 900
                                        }}>
                                            LATEST
                                        </span>
                                    )}
                                </div>
                                <span style={{ color: 'rgba(125,165,200,0.35)', fontSize: 8, fontWeight: 700, fontFamily: 'monospace' }}>
                                    {new Date(block.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>

                            <div style={{
                                fontFamily: 'monospace', fontSize: 7.5, color: 'rgba(125,165,200,0.3)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 3, marginBottom: 7,
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                {block.hash?.slice(0, 28)}...
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {block.trades?.map((t: any, idx: number) => (
                                    <div key={idx} style={{
                                        paddingTop: idx > 0 ? 5 : 0,
                                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: 8, color: 'rgba(125,165,200,0.5)', fontFamily: 'monospace' }}>
                                            <span style={{ color: '#ffd700', fontWeight: 800 }}>{t.seller?.slice(0, 6)}</span>
                                            <LinkIcon size={7} style={{ margin: '0 4px', verticalAlign: 'middle', opacity: 0.3 }} />
                                            <span style={{ color: '#00e5ff', fontWeight: 800 }}>{t.buyer?.slice(0, 6)}</span>
                                        </span>
                                        <span style={{ fontSize: 9, fontFamily: 'monospace' }}>
                                            {isHardhat ? (
                                                <span style={{ color: '#00ff88', fontWeight: 900 }}>TX_{t.id?.slice(0, 6)}</span>
                                            ) : (
                                                <span style={{ color: '#00ff88', fontWeight: 900 }}>+{t.kwh?.toFixed(2)} kWh</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ClientOnly>
    );
}
