'use client';
import React, { useEffect, useRef } from 'react';

interface KPIGaugeProps {
    value: number;       // 0-100
    label?: string;
    segments?: { start: number; end: number; color: string; label: string }[];
}

export default function KPIGauge({ value, label = 'REAL-TIME VALUE', segments }: KPIGaugeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const defaultSegments = segments || [
        { start: 0, end: 35, color: 'rgba(255,80,120,0.75)', label: 'Operating\nCost Cover' },
        { start: 35, end: 60, color: 'rgba(255,215,0,0.55)', label: 'Gross\nMargin Target' },
        { start: 60, end: 85, color: 'rgba(0,255,136,0.5)', label: 'Optimal\nProfit Zone' },
        { start: 85, end: 100, color: 'rgba(0,229,255,0.35)', label: '' },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H * 0.68;
        const R = Math.min(W * 0.42, H * 0.58);
        const startAngle = Math.PI * 0.75;  // 135°
        const endAngle = Math.PI * 2.25;  // 405° = 45°
        const totalAngle = endAngle - startAngle;

        ctx.clearRect(0, 0, W, H);

        // ── Background track ─────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, R, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.stroke();

        // ── Depth rings ──────────────────────────────
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, R - i * 7, startAngle, endAngle);
            ctx.strokeStyle = `rgba(0,229,255,${0.012 * i})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // ── Colored segments ─────────────────────────
        defaultSegments.forEach(seg => {
            const a1 = startAngle + (seg.start / 100) * totalAngle;
            const a2 = startAngle + (seg.end / 100) * totalAngle;
            ctx.beginPath();
            ctx.arc(cx, cy, R, a1, a2);
            ctx.strokeStyle = seg.color;
            ctx.lineWidth = 26;
            ctx.lineCap = 'butt';
            ctx.stroke();
        });

        // ── Bright edge on active segment ────────────
        const valueAngle = startAngle + (value / 100) * totalAngle;
        ctx.beginPath();
        ctx.arc(cx, cy, R, startAngle, valueAngle);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 26;
        ctx.stroke();

        // ── Tick marks ───────────────────────────────
        for (let i = 0; i <= 100; i += 5) {
            const angle = startAngle + (i / 100) * totalAngle;
            const isMain = i % 25 === 0;
            const r1 = R + (isMain ? 32 : 22);
            const r2 = R + 18;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
            ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
            ctx.strokeStyle = isMain ? 'rgba(0,229,255,0.55)' : 'rgba(0,229,255,0.18)';
            ctx.lineWidth = isMain ? 2 : 1;
            ctx.stroke();

            if (isMain) {
                const lx = cx + Math.cos(angle) * (R + 50);
                const ly = cy + Math.sin(angle) * (R + 50);
                ctx.font = '700 11px monospace';
                ctx.fillStyle = 'rgba(125,165,200,0.6)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${i}%`, lx, ly);
            }
        }

        // ── Segment Arc Labels ────────────────────────
        defaultSegments.forEach(seg => {
            if (!seg.label) return;
            const midAngle = startAngle + ((seg.start + seg.end) / 2 / 100) * totalAngle;
            const lx = cx + Math.cos(midAngle) * (R + 70);
            const ly = cy + Math.sin(midAngle) * (R + 70);

            if (lx < 5 || lx > W - 5 || ly < 5 || ly > H - 5) return;

            ctx.font = '700 9px monospace';
            ctx.fillStyle = seg.color.replace(/[\d.]+\)$/, '0.8)');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = seg.label.split('\n');
            lines.forEach((line, li) => {
                ctx.fillText(line, lx, ly + (li - (lines.length - 1) / 2) * 11);
            });
        });

        // ── Needle ───────────────────────────────────
        const needleLen = R - 8;
        const nubLen = 14;
        const nx = cx + Math.cos(valueAngle) * needleLen;
        const ny = cy + Math.sin(valueAngle) * needleLen;
        const bx = cx + Math.cos(valueAngle + Math.PI) * nubLen;
        const by = cy + Math.sin(valueAngle + Math.PI) * nubLen;

        // Needle glow
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Needle hub
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#060c18';
        ctx.fill();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Center Value ─────────────────────────────
        ctx.shadowColor = 'rgba(0,255,136,0.5)';
        ctx.shadowBlur = 20;
        ctx.font = '900 36px monospace';
        ctx.fillStyle = '#e2f0ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value.toFixed(1)}%`, cx, cy + 40);
        ctx.shadowBlur = 0;

        ctx.font = '800 11px monospace';
        ctx.fillStyle = 'rgba(0,255,136,0.6)';
        ctx.fillText(label.toUpperCase(), cx, cy + 64);

    }, [value]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas
                ref={canvasRef}
                width={320}
                height={260}
                style={{ width: '100%', height: '100%', maxHeight: 260 }}
            />
        </div>
    );
}
