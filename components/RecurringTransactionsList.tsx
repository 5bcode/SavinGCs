'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface RecurringTransaction {
    id: number;
    amount: number;
    description: string;
    frequency: string;
    next_run_date: string;
    active: boolean;
}

export default function RecurringTransactionsList() {
    const { addToast } = useToast();
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecurring();
    }, []);

    const fetchRecurring = async () => {
        try {
            const res = await fetch('/api/recurring');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRecurring(data.recurring || []);
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
            addToast('Failed to load recurring transactions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this recurring rule?')) return;
        try {
            const res = await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setRecurring(prev => prev.filter(r => r.id !== id));
            addToast('Recurring rule deleted', 'success');
        } catch (error) {
            console.error('Error deleting:', error);
            addToast('Failed to delete rule', 'error');
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '100px' }} />;
    if (recurring.length === 0) return null;

    return (
        <div style={{ marginTop: 'var(--sp-xl)' }}>
            <div className="section-header">
                <div className="section-title">Recurring Rules</div>
            </div>
            <div className="stack">
                {recurring.map((rt) => (
                    <div key={rt.id} className="card flex justify-between items-center" style={{ padding: 'var(--sp-md)' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{rt.description || 'Recurring Transaction'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                {rt.frequency} · next: {new Date(rt.next_run_date).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-md">
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: rt.amount >= 0 ? 'var(--success)' : 'var(--error)'
                            }}>
                                {rt.amount >= 0 ? '+' : ''}£{Math.abs(rt.amount).toLocaleString('en-GB')}
                            </div>
                            <button onClick={() => handleDelete(rt.id)} className="btn-ghost" style={{ padding: '8px', color: 'var(--error)' }}>
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
