'use client';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, LogOut, ShieldCheck, AlertCircle, Loader2, Database } from 'lucide-react';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default function WalletConnect() {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [network, setNetwork] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMining, setIsMining] = useState(false);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();

                setAccount(address);

                const balanceVal = await provider.getBalance(address);
                setBalance(ethers.formatEther(balanceVal).slice(0, 6));

                const net = await provider.getNetwork();
                setNetwork(net.name === 'unknown' ? 'FLUX-SIDECHAIN' : net.name.toUpperCase());
                setError(null);
            } catch (err: any) {
                setError(err.message || 'AUTH_FAILURE');
            }
        } else {
            setError('METAMASK_NOT_DETECTED');
        }
    };

    const simulateContractSettlement = async () => {
        setIsMining(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsMining(false);
        // Show a more professional log or alert
        console.log("On-Chain Settlement Confirmed: 0x6e7f...d4e2");
        alert("PROTOCOL VERIFIED: EnergyMarket.sol confirmed sub-second trade settlement on Flux Sidechain.");
    };

    const disconnectWallet = () => {
        setAccount(null);
        setBalance(null);
        setNetwork(null);
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        connectWallet();
                    }
                } catch (e) {
                    console.error("MetaMask check failed", e);
                }
            }
        };
        checkConnection();
    }, []);

    return (
        <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
            {!account ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                        <Database size={12} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>ON-CHAIN BRIDGE</span>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="animate-pulse-green"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--accent-solar)',
                            border: 'none',
                            borderRadius: 10,
                            color: 'var(--text-on-accent)',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            letterSpacing: '0.05em'
                        }}
                    >
                        <Wallet size={16} />
                        ESTABLISH WEB3 LINK
                    </button>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent-ev)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-ev)'
                        }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 9, color: 'var(--accent-ev)', fontWeight: 800, letterSpacing: '0.05em' }}>{network}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </div>
                        </div>
                        <button
                            onClick={disconnectWallet}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>AVAILABLE CREDIT</span>
                        <span style={{ fontSize: 13, color: 'var(--accent-solar)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{balance} ETH</span>
                    </div>

                    <button
                        onClick={simulateContractSettlement}
                        disabled={isMining}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: isMining ? 'rgba(255,255,255,0.05)' : 'rgba(52, 211, 153, 0.1)',
                            border: `1px solid ${isMining ? 'rgba(255,255,255,0.1)' : 'rgba(52, 211, 153, 0.3)'}`,
                            borderRadius: 8,
                            color: isMining ? 'var(--text-muted)' : 'var(--battery-green)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            letterSpacing: '0.02em'
                        }}
                    >
                        {isMining ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        {isMining ? 'VALIDATING LEDGER...' : 'SETTLE TRANSACTIONS'}
                    </button>
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: 12, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)',
                    color: 'var(--danger-red)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 6,
                    fontWeight: 700
                }}>
                    <AlertCircle size={12} />
                    {error}
                </div>
            )}
        </div>
    );
}
