'use client';

import { useState, useEffect } from 'react';

interface BalanceHistoryEntry {
    balance: number;
    recorded_date: string;
    created_at: string;
}

interface AccountDetailProps {
    accountId: number;
    currentUser: { id: number; username: string; displayName: string };
    onClose: () => void;
    onUpdate: () => void;
}

export default function AccountDetail({ accountId, currentUser, onClose, onUpdate }: AccountDetailProps) {
    const [account, setAccount] = useState<any>(null);
    const [history, setHistory] = useState<BalanceHistoryEntry[]>([]);
    const [txCount, setTxCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<any>(null);

    // Editable fields
    const [balance, setBalance] = useState('');
    const [accountType, setAccountType] = useState('');
    const [owner, setOwner] = useState('');

    useEffect(() => { fetchAccount(); }, [accountId]);

    const fetchAccount = async () => {
        try {
            const res = await fetch(`/api/accounts/${accountId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAccount(data.account);
            setHistory(data.history || []);
            setTxCount(data.transactionCount || 0);
            setBalance(data.account.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 }));
            setAccountType(data.account.account_type);
            setOwner(data.account.owner || 'Joint');
        } catch (error) {
            console.error('Error fetching account:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasMetadataChanges = () => {
        if (!account) return false;
        return accountType !== account.account_type || owner !== (account.owner || 'Joint');
    };

    const hasBalanceChange = () => {
        if (!account) return false;
        return parseFloat(balance.replace(/,/g, '')) !== account.current_balance;
    };

    const handleSave = async () => {
        if (!account) return;

        // If metadata changes exist and there's transaction history, show warning
        if (hasMetadataChanges() && txCount > 0 && !showWarning) {
            setPendingChanges({
                accountName: account.account_name,
                accountType,
                owner,
                currentBalance: parseFloat(balance.replace(/,/g, '')),
            });
            setShowWarning(true);
            return;
        }

        await performSave();
    };

    const performSave = async () => {
        setSaving(true);
        setShowWarning(false);

        try {
            const newBalance = parseFloat(balance.replace(/,/g, ''));
            const res = await fetch(`/api/accounts/${accountId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountName: account.account_name,
                    accountType,
                    owner,
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            // Log transaction for the balance change
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

            setSaved(true);
            setTimeout(() => { setSaved(false); onUpdate(); onClose(); }, 1200);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const balanceDiff = account ? parseFloat(balance.replace(/,/g, '')) - account.current_balance : 0;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <div>
                <div className="skeleton" style={{ height: '40px', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '200px' }} />
            </div>
        );
    }

    if (!account) {
        return <div className="empty-state"><div className="empty-state-text">Account not found</div></div>;
    }

    const typeLabels: Record<string, string> = {
        savings: 'Savings', isa: 'ISA', current: 'Current', investment: 'Investment', other: 'Other'
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 'var(--sp-lg)' }}>
                <h2 style={{ marginBottom: '4px' }}>{account.account_name}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {account.pot_name} · {typeLabels[account.account_type] || account.account_type} · {account.owner || 'Joint'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Recording as at {today}
                </div>
            </div>

            {/* Current Balance Display */}
            <div className="card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Current Balance
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    £{account.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Update Balance */}
            <div className="form-group">
                <label className="form-label">New Balance (£)</label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '1.1rem' }}>£</span>
                    <input
                        type="text"
                        className="form-input"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        onFocus={(e) => {
                            const val = e.target.value.replace(/,/g, '');
                            setBalance(val);
                        }}
                        onBlur={(e) => {
                            const raw = e.target.value.replace(/,/g, '');
                            if (raw) {
                                const val = parseFloat(raw);
                                if (!isNaN(val)) {
                                    setBalance(val.toLocaleString('en-GB', { minimumFractionDigits: 2 }));
                                }
                            }
                        }}
                        style={{ paddingLeft: '30px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem' }}
                    />
                </div>
                {balanceDiff !== 0 && !isNaN(balanceDiff) && (
                    <div style={{
                        fontSize: '0.8rem', marginTop: '6px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: balanceDiff > 0 ? 'var(--success)' : 'var(--error)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                        {balanceDiff > 0 ? '↑' : '↓'} {balanceDiff > 0 ? '+' : ''}£{balanceDiff.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </div>
                )}
            </div>

            {/* Account Type */}
            <div className="form-group">
                <label className="form-label">Account Type</label>
                <select className="form-select" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    <option value="savings">Savings Account</option>
                    <option value="isa">ISA</option>
                    <option value="current">Current Account</option>
                    <option value="investment">Investment Account</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Owner */}
            <div className="form-group">
                <label className="form-label">Owner</label>
                <select className="form-select" value={owner} onChange={(e) => setOwner(e.target.value)}>
                    <option value="Gary">Gary</option>
                    <option value="Catherine">Catherine</option>
                    <option value="Joint">Joint</option>
                </select>
            </div>

            {/* Warning for metadata changes with existing history */}
            {showWarning && (
                <div style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 'var(--r-lg)',
                    padding: 'var(--sp-md)',
                    marginBottom: 'var(--sp-md)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-sm)' }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '4px' }}>
                                Changing account details
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                This account has <strong>{txCount} balance change{txCount !== 1 ? 's' : ''}</strong> in its history.
                                Changing the type or owner won't affect historical records, but could make past entries misleading.
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.5 }}>
                                💡 <strong>Recommendation:</strong> If this is a fundamentally different account, consider deleting this one and creating a new account instead to keep your history clean.
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-md)' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', minHeight: 'auto', fontSize: '0.8rem' }} onClick={() => setShowWarning(false)}>
                                    Cancel
                                </button>
                                <button className="btn" style={{
                                    flex: 1, padding: '10px', minHeight: 'auto', fontSize: '0.8rem',
                                    background: 'var(--warning)', color: '#000', fontWeight: 700,
                                }} onClick={performSave}>
                                    Save Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save button */}
            {!showWarning && (
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 'var(--sp-lg)' }}
                    onClick={handleSave}
                    disabled={saving || saved || (!hasBalanceChange() && !hasMetadataChanges())}
                >
                    {saved ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Saved
                        </span>
                    ) : saving ? 'Saving...' : 'Save Changes'}
                </button>
            )}

            {/* Balance History */}
            {history.length > 0 && (
                <div>
                    <div className="section-header" style={{ marginTop: 'var(--sp-md)' }}>
                        <div className="section-title" style={{ fontSize: '0.95rem' }}>Balance History</div>
                        <div className="section-link">{history.length} record{history.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="stack" style={{ gap: 'var(--sp-xs)' }}>
                        {history.map((entry, i) => {
                            const prevBalance = i < history.length - 1 ? history[i + 1].balance : null;
                            const diff = prevBalance !== null ? entry.balance - prevBalance : null;
                            return (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: 'var(--sp-sm) var(--sp-md)',
                                    background: 'var(--bg-card)', borderRadius: 'var(--r-md)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {new Date(entry.recorded_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        {diff !== null && (
                                            <div style={{
                                                fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '2px',
                                                color: diff >= 0 ? 'var(--success)' : 'var(--error)',
                                            }}>
                                                {diff >= 0 ? '+' : ''}£{diff.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        £{entry.balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
