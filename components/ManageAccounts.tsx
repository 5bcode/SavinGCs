'use client';

import { useState, useEffect } from 'react';
import { useSavingsData } from '@/hooks/useSavingsData';

interface Account {
    id: number;
    pot_id: number;
    pot_name: string;
    pot_color: string;
    account_name: string;
    account_type: string;
    owner: string;
    current_balance: number;
    provider?: string;
}

interface SavingsPot {
    id: number;
    name: string;
    color: string;
}

interface ManageAccountsProps {
    onUpdate: () => void;
    onAccountClick: (accountId: number) => void;
    currentUser: any;
}

export default function ManageAccounts({ onUpdate, onAccountClick, currentUser }: ManageAccountsProps) {
    const { accounts, pots, refresh } = useSavingsData();
    const [showForm, setShowForm] = useState(false);

    // Determine default owner from current user, fallback to Joint
    const defaultOwner = currentUser?.displayName || currentUser?.username || 'Joint';

    const [formData, setFormData] = useState({
        potId: '',
        provider: '',
        accountName: '',
        accountType: 'savings',
        owner: defaultOwner,
        currentBalance: '',
        startingBalanceDate: new Date().toISOString().split('T')[0]
    });

    // Default pot selection logic when form opens or pots load
    useEffect(() => {
        if (!formData.potId && pots && pots.length > 0) {
            const unallocated = pots.find((p: any) => p.name === 'Unallocated');
            if (unallocated) setFormData(prev => ({ ...prev, potId: String(unallocated.id) }));
            else if (pots[0]) setFormData(prev => ({ ...prev, potId: String(pots[0].id) }));
        }
    }, [pots, formData.potId]);


    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic duplicate check
        const isDuplicate = accounts.some(acc =>
            acc.account_name.toLowerCase() === formData.accountName.toLowerCase() &&
            acc.owner === formData.owner &&
            acc.pot_id === parseInt(formData.potId) &&
            (acc.provider || '').toLowerCase() === (formData.provider || '').toLowerCase()
        );

        if (isDuplicate) {
            if (!confirm(`An account named "${formData.accountName}" for ${formData.owner} already exists in this pot. Are you sure you want to add another one?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    potId: parseInt(formData.potId),
                    provider: formData.provider,
                    accountName: formData.accountName,
                    accountType: formData.accountType,
                    owner: formData.owner,
                    currentBalance: parseFloat(formData.currentBalance.replace(/,/g, '')) || 0,
                    startingBalanceDate: formData.startingBalanceDate
                })
            });
            if (!res.ok) throw new Error('Failed to create account');
            setFormData({
                potId: formData.potId, // Keep pot selected
                provider: '',
                accountName: '',
                accountType: 'savings',
                owner: defaultOwner,
                currentBalance: '',
                startingBalanceDate: new Date().toISOString().split('T')[0]
            });
            setShowForm(false);
            refresh();
            onUpdate();
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Failed to create account');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this account and all its transactions?')) return;
        try {
            const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete account');
            }
            refresh();
            onUpdate();
        } catch (error: any) {
            console.error('Error deleting account:', error);
            alert(error.message);
        }
    };

    const typeLabels: Record<string, string> = {
        savings: 'Savings', isa: 'ISA', current: 'Current', investment: 'Investment', other: 'Other'
    };

    // Group by pot - Show ALL accounts (even zero balance) so user can manage them
    const grouped: Record<string, { color: string; accounts: Account[] }> = {};
    accounts.forEach((acc) => {
        if (!grouped[acc.pot_name]) grouped[acc.pot_name] = { color: acc.pot_color, accounts: [] };
        grouped[acc.pot_name].accounts.push(acc);
    });

    // Get unique existing providers for dropdown
    const existingProviders = Array.from(new Set(accounts
        .map(a => a.provider)
        .filter((p): p is string => !!p && p.trim() !== '')
    )).sort();

    return (
        <div>
            <div className="section-header">
                <div className="section-title">Your Accounts</div>
                <button className="btn btn-primary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Account'}
                </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-lg)' }}>
                All your savings accounts, grouped by pot.
            </p>

            {showForm && (
                <form onSubmit={handleSubmit} className="card mb-lg">
                    <div className="form-group">
                        <label className="form-label">Savings Pot</label>
                        <select className="form-select" value={formData.potId}
                            onChange={(e) => setFormData({ ...formData, potId: e.target.value })} required>
                            {pots.map((pot) => (
                                <option key={pot.id} value={pot.id}>{pot.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bank / Provider</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            placeholder="e.g., Monzo, HSBC"
                            list="providers-list"
                        />
                        <datalist id="providers-list">
                            {existingProviders.map((provider: string) => (
                                <option key={provider} value={provider} />
                            ))}
                        </datalist>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Account Name</label>
                        <input type="text" className="form-input" value={formData.accountName}
                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                            placeholder="e.g., Lifetime ISA" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Account Type</label>
                        <select className="form-select" value={formData.accountType}
                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}>
                            <option value="savings">Savings Account</option>
                            <option value="isa">ISA</option>
                            <option value="current">Current Account</option>
                            <option value="investment">Investment Account</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Owner</label>
                        <select className="form-select" value={formData.owner}
                            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}>
                            <option value="Gary">Gary</option>
                            <option value="Catherine">Catherine</option>
                            <option value="Joint">Joint</option>
                            {currentUser?.displayName && !['Gary', 'Catherine', 'Joint'].includes(currentUser.displayName) && (
                                <option value={currentUser.displayName}>{currentUser.displayName}</option>
                            )}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Starting Balance (£)</label>
                        <input type="text" className="form-input" value={formData.currentBalance}
                            onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setFormData({ ...formData, currentBalance: val });
                            }}
                            onBlur={(e) => {
                                const raw = e.target.value.replace(/,/g, '');
                                if (raw) {
                                    const val = parseFloat(raw);
                                    if (!isNaN(val)) {
                                        setFormData({ ...formData, currentBalance: val.toLocaleString('en-GB', { minimumFractionDigits: 2 }) });
                                    }
                                }
                            }}
                            placeholder="0.00" style={{ fontFamily: 'var(--font-mono)' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Starting Balance Date</label>
                        <input type="date" className="form-input" value={formData.startingBalanceDate}
                            onChange={(e) => setFormData({ ...formData, startingBalanceDate: e.target.value })}
                            required />
                    </div>
                    <button type="submit" className="btn btn-teal" style={{ width: '100%' }} disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Account'}
                    </button>
                </form>
            )}

            {Object.keys(grouped).length === 0 && !showForm && (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <div className="empty-state-text">No accounts yet.<br />Add your first bank account above!</div>
                </div>
            )}

            {Object.entries(grouped).map(([potName, group]) => {
                const potTotal = group.accounts.reduce((sum, a) => sum + a.current_balance, 0);
                return (
                    <div key={potName} style={{ marginBottom: 'var(--sp-xl)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-sm)', padding: '0 2px' }}>
                            <div className="flex items-center gap-sm">
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {potName}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                £{potTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="stack" style={{ gap: 'var(--sp-xs)' }}>
                            {group.accounts.map((account) => (
                                <div key={account.id} className="pot-item" onClick={() => onAccountClick(account.id)}>
                                    <div className="pot-icon" style={{
                                        background: `linear-gradient(135deg, ${account.pot_color}30, ${account.pot_color}10)`,
                                        fontSize: '1rem',
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={account.pot_color || 'var(--purple-mid)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                            <line x1="1" y1="10" x2="23" y2="10" />
                                        </svg>
                                    </div>
                                    <div className="pot-info">
                                        <div className="pot-name">
                                            {account.provider ? (
                                                <>
                                                    <span style={{ fontWeight: 'normal', opacity: 0.8 }}>{account.provider} – </span>
                                                    {account.account_name}
                                                </>
                                            ) : (
                                                account.account_name
                                            )}
                                        </div>
                                        <div className="pot-meta">
                                            {typeLabels[account.account_type] || account.account_type} ·
                                            <span style={{
                                                color: account.owner === 'Gary' ? '#3b82f6' : account.owner === 'Catherine' ? '#ec4899' : 'inherit',
                                                fontWeight: 600,
                                                marginLeft: '4px'
                                            }}>
                                                {account.owner || 'Joint'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <div className="pot-amount">
                                            £{account.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }} className="icon-btn" style={{ color: 'var(--error)', width: '32px', height: '32px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
