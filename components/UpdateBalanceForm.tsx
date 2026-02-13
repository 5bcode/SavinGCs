'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Account {
    id: number;
    pot_id: number;
    account_name: string;
    account_type: string;
    owner: string;
    current_balance: number;
    pot_name: string;
    pot_color: string;
}

interface UpdateBalanceFormProps {
    onSuccess: () => void;
    currentUser: { id: number; username: string; displayName: string };
}

export default function UpdateBalanceForm({ onSuccess, currentUser }: UpdateBalanceFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [balances, setBalances] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<Set<number>>(new Set());
    const { addToast } = useToast();

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            const accs = data.accounts || [];
            setAccounts(accs);
            // Pre-fill with current balances
            const initial: Record<number, string> = {};
            accs.forEach((a: Account) => { initial[a.id] = a.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 }); });
            setBalances(initial);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSingle = async (account: Account) => {
        const rawValue = (balances[account.id] || '0').replace(/,/g, '');
        const newBalance = parseFloat(rawValue);
        if (isNaN(newBalance)) return;

        setSaving(true);
        try {
            // Update the account balance directly
            const res = await fetch(`/api/accounts/${account.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountName: account.account_name,
                    accountType: account.account_type,
                })
            });
            if (!res.ok) throw new Error('Failed to update');

            // Log the change as a transaction for history
            const diff = newBalance - account.current_balance;
            if (diff !== 0) {
                await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: account.id,
                        userId: currentUser.id,
                        amount: diff,
                        description: `Balance update: £${account.current_balance.toFixed(2)} → £${newBalance.toFixed(2)}`,
                        transactionDate: new Date().toISOString().split('T')[0],
                    })
                });
            }

            setSaved((prev) => new Set(prev).add(account.id));
            addToast('Balance updated', 'success');
            setTimeout(() => setSaved((prev) => { const next = new Set(prev); next.delete(account.id); return next; }), 2000);
        } catch (error) {
            console.error('Error updating balance:', error);
            addToast('Failed to update balance', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        for (const account of accounts) {
            const rawValue = (balances[account.id] || '0').replace(/,/g, '');
            const newBalance = parseFloat(rawValue);
            if (isNaN(newBalance) || newBalance === account.current_balance) continue;
            await handleUpdateSingle(account);
        }
        setSaving(false);
        addToast('All balances saved', 'success');
        onSuccess();
    };

    if (loading) return <div className="skeleton" style={{ height: '200px' }} />;

    // Group accounts by pot
    const groupedByPot: Record<string, Account[]> = {};
    accounts.forEach((acc) => {
        if (!groupedByPot[acc.pot_name]) groupedByPot[acc.pot_name] = [];
        groupedByPot[acc.pot_name].push(acc);
    });

    return (
        <div>
            <h2 style={{ marginBottom: 'var(--sp-xs)' }}>Update Balances</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-lg)' }}>
                Enter the current balance for each account. Changes are logged automatically.
            </p>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <div className="empty-state-text">No accounts yet. Add some in Settings first!</div>
                </div>
            ) : (
                <>
                    {Object.entries(groupedByPot).map(([potName, potAccounts]) => (
                        <div key={potName} style={{ marginBottom: 'var(--sp-lg)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-sm)', padding: '0 2px' }}>
                                {potName}
                            </div>
                            <div className="stack" style={{ gap: 'var(--sp-sm)' }}>
                                {potAccounts.map((account) => (
                                    <div key={account.id} className="card" style={{ padding: 'var(--sp-md)' }}>
                                        <div className="flex justify-between items-center mb-sm">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{account.account_name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                                    Current: £{account.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })} · {account.account_type} ·
                                                    <span style={{
                                                        color: account.owner === 'Gary' ? '#3b82f6' : account.owner === 'Catherine' ? '#ec4899' : 'inherit',
                                                        fontWeight: 600,
                                                        marginLeft: '4px'
                                                    }}>
                                                        {account.owner || 'Joint'}
                                                    </span>
                                                </div>
                                            </div>
                                            {saved.has(account.id) && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Saved
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-sm items-center">
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '1rem' }}>£</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    autoComplete="off"
                                                    aria-label={`Update balance for ${account.account_name}`}
                                                    className="form-input"
                                                    value={balances[account.id] || ''}
                                                    onChange={(e) => setBalances({ ...balances, [account.id]: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleUpdateSingle(account);
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        const val = e.target.value.replace(/,/g, '');
                                                        setBalances({ ...balances, [account.id]: val });
                                                    }}
                                                    onBlur={(e) => {
                                                        const raw = e.target.value.replace(/,/g, '');
                                                        const val = parseFloat(raw);
                                                        if (!isNaN(val)) {
                                                            setBalances({ ...balances, [account.id]: val.toLocaleString('en-GB', { minimumFractionDigits: 2 }) });
                                                        }
                                                    }}
                                                    style={{ paddingLeft: '28px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-teal"
                                                style={{ padding: '12px 16px', minHeight: 'auto', fontSize: '0.8rem' }}
                                                onClick={() => handleUpdateSingle(account)}
                                                disabled={saving || parseFloat((balances[account.id] || '0').replace(/,/g, '')) === account.current_balance}
                                                aria-label={`Save balance for ${account.account_name}`}
                                                title={`Save balance for ${account.account_name}`}
                                            >
                                                Save
                                            </button>
                                        </div>
                                        {/* Show diff if changed */}
                                        {(() => {
                                            const currentVal = parseFloat((balances[account.id] || '0').replace(/,/g, ''));
                                            return currentVal !== account.current_balance && (
                                                <div style={{
                                                    fontSize: '0.75rem', marginTop: '6px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                                                    color: currentVal > account.current_balance ? 'var(--success)' : 'var(--error)'
                                                }}>
                                                    {currentVal > account.current_balance ? '+' : ''}
                                                    £{(currentVal - account.current_balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })} change
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-md)' }} onClick={handleSaveAll} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </>
            )}
        </div>
    );
}
