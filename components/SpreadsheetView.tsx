'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/useSavingsData';

import NetWorthChart from './NetWorthChart';

interface Transaction {
    id: number;
    account_name: string;
    pot_name: string;
    user_name: string;
    amount: number;
    description: string;
    transaction_date: string;
}

export default function SpreadsheetView() {
    const { transactions, isLoading: loading } = useTransactions();

    const handleExport = async () => {
        try {
            const res = await fetch('/api/export/csv');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `savings-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '300px' }} />;

    // Group transactions by date
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
        const dateKey = new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(tx);
    });

    return (
        <div>
            {transactions.length > 0 && <NetWorthChart transactions={transactions} />}

            <div className="section-header">
                <div className="section-title">Balance History</div>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', minHeight: 'auto', fontSize: '0.75rem' }} onClick={handleExport}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export
                </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-lg)' }}>
                A log of all balance changes across your accounts.
            </p>

            {transactions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">No history yet.<br />Balance changes will appear here.</div>
                </div>
            ) : (
                Object.entries(grouped).map(([dateLabel, dateTxs]) => (
                    <div key={dateLabel} style={{ marginBottom: 'var(--sp-xl)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-sm)', padding: '0 2px' }}>
                            {dateLabel}
                        </div>
                        <div className="stack" style={{ gap: 'var(--sp-xs)' }}>
                            {dateTxs.map((tx) => (
                                <div key={tx.id} className="pot-item" style={{ cursor: 'default', padding: 'var(--sp-sm) var(--sp-md)' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: 'var(--r-md)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem',
                                        background: tx.amount >= 0
                                            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05))'
                                            : 'linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05))',
                                    }}>
                                        {tx.amount >= 0 ? '↗' : '↙'}
                                    </div>
                                    <div className="pot-info">
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.account_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                            {tx.description || tx.pot_name} • {tx.user_name}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                                        color: tx.amount >= 0 ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {tx.amount >= 0 ? '+' : ''}£{Math.abs(tx.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
