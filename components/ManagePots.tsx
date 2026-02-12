'use client';

import { useState } from 'react';
import { useSavingsData } from '@/hooks/useSavingsData';

interface SubGoal {
    id: number;
    pot_id: number;
    name: string;
    target_amount: number;
}

interface SavingsPot {
    id: number;
    name: string;
    goal_amount: number | null;
    goal_date: string | null;
    color: string;
    icon: string;
    priority: number;
    sub_goals: SubGoal[];
}

interface ManagePotsProps {
    onUpdate: () => void;
}

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

const colorOptions = ['#7B2FE0', '#059669', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function ManagePots({ onUpdate }: ManagePotsProps) {
    const { pots, refresh } = useSavingsData();
    const [showForm, setShowForm] = useState(false);
    const [editingPotId, setEditingPotId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', goalAmount: '', goalDate: '', color: '#7B2FE0', icon: 'piggy-bank' });
    const [editData, setEditData] = useState<{
        name: string;
        goalAmount: string;
        goalDate: string;
        color: string;
        icon: string;
        subGoals: { id?: number; name: string; targetAmount: string }[];
    }>({ name: '', goalAmount: '', goalDate: '', color: '#7B2FE0', icon: 'piggy-bank', subGoals: [] });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/pots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    goalAmount: formData.goalAmount ? parseFloat(formData.goalAmount.replace(/,/g, '')) : null,
                    goalDate: formData.goalDate || null,
                    color: formData.color,
                    icon: formData.icon,
                    priority: 0
                })
            });
            if (!res.ok) throw new Error('Failed to create pot');
            setFormData({ name: '', goalAmount: '', goalDate: '', color: '#7B2FE0', icon: 'piggy-bank' });
            setShowForm(false);
            refresh();
            onUpdate();
        } catch (error) {
            console.error('Error creating pot:', error);
            alert('Failed to create savings pot');
        }
    };

    const startEditing = (pot: SavingsPot) => {
        setEditingPotId(pot.id);
        const potSubGoals = pot.sub_goals || [];
        setEditData({
            name: pot.name,
            goalAmount: pot.goal_amount ? pot.goal_amount.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : '',
            goalDate: pot.goal_date || '',
            color: pot.color,
            icon: pot.icon,
            subGoals: potSubGoals.map(sg => ({
                id: sg.id,
                name: sg.name,
                targetAmount: sg.target_amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })
            }))
        });
    };

    const cancelEditing = () => {
        setEditingPotId(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPotId === null) return;
        setSaving(true);

        try {
            const pot = pots.find(p => p.id === editingPotId);

            // 1. Update Pot Details
            const res = await fetch(`/api/pots/${editingPotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editData.name,
                    goalAmount: editData.goalAmount ? parseFloat(editData.goalAmount.replace(/,/g, '')) : null,
                    goalDate: editData.goalDate || null,
                    color: editData.color,
                    icon: editData.icon,
                    priority: pot?.priority ?? 0,
                })
            });
            if (!res.ok) throw new Error('Failed to update pot');

            // 2. Handle Sub-goals
            const originalSubGoals = pot?.sub_goals || [];
            const newSubGoals = editData.subGoals;

            // Identify deletions
            const toDelete = originalSubGoals.filter(osg => !newSubGoals.find(nsg => nsg.id === osg.id));
            for (const sg of toDelete) {
                await fetch(`/api/subgoals?id=${sg.id}`, { method: 'DELETE' });
            }

            // Identify additions
            const toAdd = newSubGoals.filter(nsg => !nsg.id);
            for (const sg of toAdd) {
                await fetch('/api/subgoals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        potId: editingPotId,
                        name: sg.name,
                        targetAmount: parseFloat(sg.targetAmount.replace(/,/g, ''))
                    })
                });
            }

            // Note: Updates to existing sub-goals are effectively deletes/adds if we don't have PUT. 
            // But here we didn't implement PUT sub-goals. So modifying an existing sub-goal in the UI needs to be handled.
            // For now, let's assume users delete and re-add if they want to change amount, or we handle simple text updates?
            // Actually, if we just want to support "Add Sub-goals", maybe we don't support editing them yet?
            // User requested "implement sub-goals", implies creating them.
            // I'll stick to Add/Delete for simplicity in this iteration.

            setEditingPotId(null);
            refresh();
            onUpdate();
        } catch (error) {
            // ...
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this pot and all its accounts/transactions?')) return;
        try {
            const res = await fetch(`/api/pots/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete pot');
            refresh();
            onUpdate();
        } catch (error) { console.error('Error deleting pot:', error); alert('Failed to delete pot'); }
    };

    const formatAmountOnBlur = (value: string, setter: (val: string) => void) => {
        const raw = value.replace(/,/g, '');
        if (raw) {
            const val = parseFloat(raw);
            if (!isNaN(val)) {
                setter(val.toLocaleString('en-GB', { maximumFractionDigits: 2 }));
            }
        }
    };

    const stripCommasOnFocus = (value: string, setter: (val: string) => void) => {
        setter(value.replace(/,/g, ''));
    };

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
                            onFocus={() => stripCommasOnFocus(formData.goalAmount, (v) => setFormData({ ...formData, goalAmount: v }))}
                            onBlur={() => formatAmountOnBlur(formData.goalAmount, (v) => setFormData({ ...formData, goalAmount: v }))}
                            placeholder="Optional - e.g., 50,000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Goal Date</label>
                        <input type="date" className="form-input" value={formData.goalDate}
                            onChange={(e) => setFormData({ ...formData, goalDate: e.target.value })}
                            style={{ colorScheme: 'dark' }} />
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
                            {colorOptions.map((c) => (
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
                    const isEditing = editingPotId === pot.id;

                    return (
                        <div key={pot.id}>
                            <div className="pot-item" style={isEditing ? { borderColor: 'var(--purple-start)', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}}>
                                <div className="pot-icon" style={{ background: `${pot.color}30`, fontSize: '1.3rem' }}>
                                    {iconPairs.find(([k]) => k === pot.icon)?.[1] || '💰'}
                                </div>
                                <div className="pot-info">
                                    <div className="pot-name">{pot.name}</div>
                                    {isUnallocated ? (
                                        <div className="pot-meta">Default · Cannot be deleted</div>
                                    ) : (
                                        <div className="pot-meta">
                                            {pot.goal_amount ? `Goal: £${pot.goal_amount.toLocaleString('en-GB')}` : 'No goal set'}
                                            {pot.goal_date ? ` · by ${new Date(pot.goal_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}
                                        </div>
                                    )}
                                </div>
                                {!isUnallocated && (
                                    <div style={{ display: 'flex', gap: 'var(--sp-xs)' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); isEditing ? cancelEditing() : startEditing(pot); }}
                                            className="icon-btn"
                                            style={{ color: isEditing ? 'var(--purple-mid)' : 'var(--text-secondary)' }}
                                            title="Edit pot"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(pot.id); }} className="icon-btn" style={{ color: 'var(--error)' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Inline Edit Form */}
                            {isEditing && (
                                <form
                                    onSubmit={handleEditSubmit}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--purple-start)',
                                        borderTop: 'none',
                                        borderBottomLeftRadius: 'var(--r-lg)',
                                        borderBottomRightRadius: 'var(--r-lg)',
                                        padding: 'var(--sp-lg)',
                                        animation: 'fadeIn 0.2s var(--ease)',
                                    }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">Pot Name</label>
                                        <input type="text" className="form-input" value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            required />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                                        <div className="form-group">
                                            <label className="form-label">Goal Amount (£)</label>
                                            <input type="text" className="form-input" value={editData.goalAmount}
                                                onChange={(e) => setEditData({ ...editData, goalAmount: e.target.value })}
                                                onFocus={() => stripCommasOnFocus(editData.goalAmount, (v) => setEditData({ ...editData, goalAmount: v }))}
                                                onBlur={() => formatAmountOnBlur(editData.goalAmount, (v) => setEditData({ ...editData, goalAmount: v }))}
                                                placeholder="e.g., 50,000" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Goal Date</label>
                                            <input type="date" className="form-input" value={editData.goalDate}
                                                onChange={(e) => setEditData({ ...editData, goalDate: e.target.value })}
                                                style={{ colorScheme: 'dark' }} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Sub-goals (Breakdown)</label>
                                        <div className="stack gap-sm mb-sm">
                                            {editData.subGoals.map((sg, idx) => (
                                                <div key={idx} className="flex gap-sm items-center">
                                                    <input type="text" className="form-input" value={sg.name} disabled style={{ flex: 2, fontSize: '0.85rem' }} />
                                                    <input type="text" className="form-input" value={`£${sg.targetAmount}`} disabled style={{ flex: 1, fontSize: '0.85rem' }} />
                                                    <button type="button" className="icon-btn" onClick={() => {
                                                        const newSubGoals = [...editData.subGoals];
                                                        newSubGoals.splice(idx, 1);
                                                        setEditData({ ...editData, subGoals: newSubGoals });
                                                    }} style={{ color: 'var(--error)' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-sm items-center">
                                            <input type="text" className="form-input" placeholder="Name (e.g. Deposit)"
                                                id={`new-sg-name-${editingPotId}`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        document.getElementById(`new-sg-amt-${editingPotId}`)?.focus();
                                                    }
                                                }}
                                            />
                                            <input type="text" className="form-input" placeholder="Amount"
                                                id={`new-sg-amt-${editingPotId}`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const nameInput = document.getElementById(`new-sg-name-${editingPotId}`) as HTMLInputElement;
                                                        const amtInput = document.getElementById(`new-sg-amt-${editingPotId}`) as HTMLInputElement;
                                                        if (nameInput.value && amtInput.value) {
                                                            const amt = parseFloat(amtInput.value.replace(/,/g, ''));
                                                            if (!isNaN(amt)) {
                                                                setEditData({
                                                                    ...editData,
                                                                    subGoals: [...editData.subGoals, {
                                                                        name: nameInput.value,
                                                                        targetAmount: amt.toLocaleString('en-GB', { maximumFractionDigits: 2 })
                                                                    }]
                                                                });
                                                                nameInput.value = '';
                                                                amtInput.value = '';
                                                                nameInput.focus();
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                            <button type="button" className="btn btn-secondary" style={{ minHeight: '38px' }} onClick={() => {
                                                const nameInput = document.getElementById(`new-sg-name-${editingPotId}`) as HTMLInputElement;
                                                const amtInput = document.getElementById(`new-sg-amt-${editingPotId}`) as HTMLInputElement;
                                                if (nameInput.value && amtInput.value) {
                                                    const amt = parseFloat(amtInput.value.replace(/,/g, ''));
                                                    if (!isNaN(amt)) {
                                                        setEditData({
                                                            ...editData,
                                                            subGoals: [...editData.subGoals, {
                                                                name: nameInput.value,
                                                                targetAmount: amt.toLocaleString('en-GB', { maximumFractionDigits: 2 })
                                                            }]
                                                        });
                                                        nameInput.value = '';
                                                        amtInput.value = '';
                                                        nameInput.focus();
                                                    } else {
                                                        alert('Invalid amount');
                                                    }
                                                }
                                            }}>+</button>
                                        </div>
                                        {editData.subGoals.length > 0 && (
                                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                Total sub-goals: £{editData.subGoals.reduce((sum, sg) => sum + parseFloat(sg.targetAmount.replace(/,/g, '')), 0).toLocaleString('en-GB')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Icon</label>
                                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                            {iconPairs.map(([key, emoji]) => (
                                                <button key={key} type="button"
                                                    onClick={() => setEditData({ ...editData, icon: key })}
                                                    style={{
                                                        width: '40px', height: '40px', borderRadius: 'var(--r-md)',
                                                        background: editData.icon === key ? 'var(--purple-start)' : 'var(--bg-secondary)',
                                                        border: editData.icon === key ? '2px solid var(--purple-mid)' : '1px solid var(--border)',
                                                        fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all var(--t-fast)'
                                                    }}>{emoji}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Color</label>
                                        <div className="flex gap-sm">
                                            {colorOptions.map((c) => (
                                                <button key={c} type="button" onClick={() => setEditData({ ...editData, color: c })}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: 'var(--r-full)', background: c,
                                                        border: editData.color === c ? '3px solid white' : '2px solid transparent',
                                                        cursor: 'pointer', transition: 'all var(--t-fast)'
                                                    }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                                        <button type="submit" className="btn btn-teal" disabled={saving}
                                            style={{ flex: 1, padding: '10px 16px', minHeight: 'auto', fontSize: '0.85rem' }}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={cancelEditing}
                                            style={{ padding: '10px 16px', minHeight: 'auto', fontSize: '0.85rem' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
