'use client';

import { useMemo, useState } from 'react';

interface Transaction {
    id: number;
    amount: number;
    transaction_date: string;
}

interface NetWorthChartProps {
    transactions: Transaction[];
    currentTotal: number; // To work backwards from, or we calculate forward if we have initial balances
}

export default function NetWorthChart({ transactions }: { transactions: Transaction[] }) {
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

    const dataPoints = useMemo(() => {
        if (!transactions.length) return [];

        // 1. Sort transactions by date
        const sorted = [...transactions].sort((a, b) =>
            new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        );

        // 2. Group by date and calculate daily cumulative balance
        const dailyBalances = new Map<string, number>();
        let runningTotal = 0;

        // We need a starting point. 
        // Ideally, we'd have an "opening balance" transaction type or account initial states.
        // For now, let's assume the running total starts at 0 and adds up. 
        // If the current total is known, we could work backwards, but forward is standard.
        // Let's assume accounts started at 0 for this visualization or that "Initial Balance" is a transaction.

        sorted.forEach(tx => {
            runningTotal += tx.amount;
            dailyBalances.set(tx.transaction_date, runningTotal);
        });

        const points = Array.from(dailyBalances.entries()).map(([date, value]) => ({
            date,
            value,
            timestamp: new Date(date).getTime()
        }));

        return points;
    }, [transactions]);

    if (dataPoints.length < 2) return null;

    // Dimensions
    const width = 800;
    const height = 300;
    const padding = 40;

    // Scales
    const minTime = Math.min(...dataPoints.map(d => d.timestamp));
    const maxTime = Math.max(...dataPoints.map(d => d.timestamp));
    const timeRange = maxTime - minTime || 1;

    const minValue = Math.min(0, ...dataPoints.map(d => d.value)); // Ensure 0 is included if values are positive
    const maxValue = Math.max(...dataPoints.map(d => d.value)) * 1.05; // 5% buffer
    const valueRange = maxValue - minValue || 1;

    const getX = (timestamp: number) => padding + ((timestamp - minTime) / timeRange) * (width - padding * 2);
    const getY = (value: number) => height - padding - ((value - minValue) / valueRange) * (height - padding * 2);

    // Generate Path
    const pathD = dataPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(p.timestamp)} ${getY(p.value)}`
    ).join(' ');

    // Fill Area (Area Chart effect for premium feel)
    const fillD = `${pathD} L ${getX(dataPoints[dataPoints.length - 1].timestamp)} ${height - padding} L ${getX(dataPoints[0].timestamp)} ${height - padding} Z`;

    return (
        <div className="card mb-xl overflow-hidden" style={{ padding: '0' }}>
            <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Net Worth Over Time</div>
            </div>

            <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--purple-mid)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--purple-mid)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines (simplified) */}
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                        const y = height - padding - (tick * (height - padding * 2));
                        return (
                            <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                        );
                    })}

                    {/* Area Fill */}
                    <path d={fillD} fill="url(#chartFill)" />

                    {/* Line Path */}
                    <path d={pathD} fill="none" stroke="var(--purple-mid)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Interactive Points (invisible normally, but useful for hover detection logic if we implemented simpler per-node hover) */}
                    {dataPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={getX(p.timestamp)}
                            cy={getY(p.value)}
                            r="6"
                            fill="transparent"
                            onMouseEnter={() => setHoveredPoint({ x: getX(p.timestamp), y: getY(p.value), date: p.date, value: p.value })}
                            onMouseLeave={() => setHoveredPoint(null)}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}

                    {/* Hover Indicator */}
                    {hoveredPoint && (
                        <>
                            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="var(--bg-card)" stroke="var(--purple-mid)" strokeWidth="2" />
                            <line x1={hoveredPoint.x} y1={hoveredPoint.y} x2={hoveredPoint.x} y2={height - padding} stroke="var(--text-tertiary)" strokeDasharray="2 2" />
                        </>
                    )}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPoint && (
                    <div style={{
                        position: 'absolute',
                        left: hoveredPoint.x,
                        top: hoveredPoint.y - 10,
                        transform: 'translate(-50%, -100%)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        padding: '8px 12px',
                        borderRadius: 'var(--r-md)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        zIndex: 10
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {new Date(hoveredPoint.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            £{hoveredPoint.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
