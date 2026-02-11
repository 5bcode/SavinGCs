'use client';

import { useState, useEffect } from 'react';

interface SavingsPot {
    id: number;
    name: string;
    goal_amount: number | null;
    color: string;
    icon: string;
}

interface ManagePotsProps {
    onUpdate: () => void;
}

export default function ManagePots({ onUpdate }: ManagePotsProps) {
    const [pots, setPots] = useState<SavingsPot[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', goalAmount: '', color: '#7B2FE0', icon: 'piggy-bank' });

    useEffect(() => { fetchPots(); }, []);

    const fetchPots = async () => {
        try {
            const res = await fetch('/api/pots');
            const data = await res.json();
            setPots(data.pots || []);
        } catch (error) { console.error('Error fetching pots:', error); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/pots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    goalAmount: formData.goalAmount ? parseFloat(formData.goalAmount.replace(/,/g, '')) : null,
                    color: formData.color,
                    icon: formData.icon,
                    priority: 0
                })
            });
            if (!res.ok) throw new Error('Failed to create pot');
            setFormData({ name: '', goalAmount: '', color: '#7B2FE0', icon: 'piggy-bank' });
            setShowForm(false);
            fetchPots();
            onUpdate();
        } catch (error) {
            console.error('Error creating pot:', error);
            alert('Failed to create savings pot');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this pot and all its accounts/transactions?')) return;
        try {
            const res = await fetch(`/api/pots/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete pot');
            fetchPots();
            onUpdate();
        } catch (error) { console.error('Error deleting pot:', error); alert('Failed to delete pot'); }
    };

    const iconPairs: [string, string][] = [
        ['house', '🏡'],
        ['piggy-bank', '🐷'],
        ['car', '🚗'],
        ['vacation', '🏖️'],
        ['emergency', '🚨'],
        ['wedding', '💍'],
        ['education', '🎓'],
        ['savings', '💰'],
        ['tent', '⛺'],
    ];

    return (
        <div>
            <div className="section-header">
                <div className="section-title">Savings Pots</div>
                <button className="btn btn-primary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Pot'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card mb-lg">
                    <div className="form-group">
                        <label className="form-label">Pot Name</label>
                        <input type="text" className="form-input" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., House Deposit" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Goal Amount (£)</label>
                        <input type="text" className="form-input" value={formData.goalAmount}
                            onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setFormData({ ...formData, goalAmount: val });
                            }}
                            onBlur={(e) => {
                                const raw = e.target.value.replace(/,/g, '');
                                if (raw) {
                                    const val = parseFloat(raw);
                                    if (!isNaN(val)) {
                                        setFormData({ ...formData, goalAmount: val.toLocaleString('en-GB', { maximumFractionDigits: 2 }) });
                                    }
                                }
                            }}
                            placeholder="Optional - e.g., 50,000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Icon</label>
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            {iconPairs.map(([key, emoji]) => (
                                <button key={key} type="button"
                                    onClick={() => setFormData({ ...formData, icon: key })}
                                    style={{
                                        width: '44px', height: '44px', borderRadius: 'var(--r-md)',
                                        background: formData.icon === key ? 'var(--purple-start)' : 'var(--bg-secondary)',
                                        border: formData.icon === key ? '2px solid var(--purple-mid)' : '1px solid var(--border)',
                                        fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all var(--t-fast)'
                                    }}>{emoji}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="flex gap-sm">
                            {['#7B2FE0', '#059669', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'].map((c) => (
                                <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: 'var(--r-full)', background: c,
                                        border: formData.color === c ? '3px solid white' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all var(--t-fast)'
                                    }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-teal" style={{ width: '100%' }}>Create Pot</button>
                </form>
            )}

            <div className="stack" style={{ gap: 'var(--sp-sm)' }}>
                {pots.map((pot) => {
                    const isUnallocated = pot.name === 'Unallocated';
                    return (
                        <div key={pot.id} className="pot-item">
                            <div className="pot-icon" style={{ background: `${pot.color}30`, fontSize: '1.3rem' }}>
                                {iconPairs.find(([k]) => k === pot.icon)?.[1] || '💰'}
                            </div>
                            <div className="pot-info">
                                <div className="pot-name">{pot.name}</div>
                                {isUnallocated ? (
                                    <div className="pot-meta">Default · Cannot be deleted</div>
                                ) : pot.goal_amount ? (
                                    <div className="pot-meta">Goal: £{pot.goal_amount.toLocaleString('en-GB')}</div>
                                ) : null}
                            </div>
                            {!isUnallocated && (
                                <button onClick={() => handleDelete(pot.id)} className="icon-btn" style={{ color: 'var(--error)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
