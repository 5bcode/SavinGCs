'use client';

import { useState } from 'react';

interface Account {
    id: number;
    pot_id: number;
    account_name: string;
    account_type: string;
    owner: string;
    current_balance: number;
    pot_name?: string;
}

interface SavingsPot {
    id: number;
    name: string;
    // other fields not strictly needed here
}

interface AllocateFundsProps {
    pots: SavingsPot[];
    accounts: Account[];
    onUpdate: () => void;
}

export default function AllocateFunds({ pots, accounts, onUpdate }: AllocateFundsProps) {
    const [showModal, setShowModal] = useState(false);
    const [sourcePotId, setSourcePotId] = useState<string>('');
    const [sourceAccountId, setSourceAccountId] = useState<string>('');
    const [targetPotId, setTargetPotId] = useState<string>('');
    const [targetAccountId, setTargetAccountId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initialize sourcePotId to Unallocated if available, but allow changing it
    const unallocatedPot = pots.find(p => p.name === 'Unallocated');

    // Filter source accounts based on selected source pot
    const filteredSourceAccounts = sourcePotId
        ? accounts.filter(a => a.pot_id === parseInt(sourcePotId) && a.current_balance > 0)
        : [];

    // Filter target pots (exclude selected source pot)
    const availableTargetPots = pots.filter(p => String(p.id) !== sourcePotId);

    // Filter target accounts based on selected target pot
    const filteredTargetAccounts = targetPotId
        ? accounts.filter(a => a.pot_id === parseInt(targetPotId))
        : [];

    const handleAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const numAmount = parseFloat(amount.replace(/,/g, ''));
            if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount');

            if (!targetAccountId) throw new Error('Please select a target account');

            let finalTargetPotId = targetPotId;
            let finalTargetAccountId: number | null = parseInt(targetAccountId);

            if (targetAccountId.startsWith('new_')) {
                finalTargetPotId = targetAccountId.split('_')[1];
                finalTargetAccountId = null; // API expects null/new for creation
            } else {
                // Ensure pot ID is correct for the selected account
                const acc = accounts.find(a => a.id === parseInt(targetAccountId));
                if (acc) finalTargetPotId = String(acc.pot_id);
            }

            const res = await fetch('/api/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountId: parseInt(sourceAccountId),
                    targetPotId: parseInt(finalTargetPotId),
                    targetAccountId: finalTargetAccountId,
                    amount: numAmount
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Allocation failed');
            }

            setAmount('');
            setShowModal(false);
            setTargetPotId('');
            setTargetAccountId('');
            onUpdate();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const maxAmount = sourceAccountId
        ? accounts.find(a => a.id === parseInt(sourceAccountId))?.current_balance || 0
        : 0;

    return (
        <>
            <button
                className="btn btn-secondary" style={{ width: '100%' }}
                onClick={() => {
                    setShowModal(true);
                    if (!sourcePotId && unallocatedPot) setSourcePotId(String(unallocatedPot.id));
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Transfer / Allocate
            </button>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal card">
                        <div className="modal-header flex justify-between items-center mb-md">
                            <h3 className="text-xl font-bold">Allocate Funds</h3>
                            <button onClick={() => setShowModal(false)} className="icon-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAllocate} className="stack gap-md">
                            {error && (
                                <div style={{
                                    padding: 'var(--sp-sm)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--r-md)',
                                    color: 'var(--error)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">From Account</label>
                                <select
                                    className="form-select"
                                    value={sourceAccountId}
                                    onChange={e => {
                                        const accId = e.target.value;
                                        setSourceAccountId(accId);
                                        // Auto-set pot ID based on selected account
                                        const acc = accounts.find(a => a.id === parseInt(accId));
                                        if (acc) setSourcePotId(String(acc.pot_id));
                                        else setSourcePotId('');
                                    }}
                                    required
                                >
                                    <option value="">Select source account...</option>
                                    {pots.map(pot => {
                                        const potAccounts = accounts.filter(a => a.pot_id === pot.id && a.current_balance > 0);
                                        if (potAccounts.length === 0) return null;

                                        return (
                                            <optgroup key={pot.id} label={pot.name}>
                                                {potAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id} style={{
                                                        color: acc.owner === 'Gary' ? '#3b82f6' : acc.owner === 'Catherine' ? '#ec4899' : 'inherit',
                                                    }}>
                                                        {acc.account_name} ({acc.owner}) — £{acc.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">To Account</label>
                                <select
                                    className="form-select"
                                    value={targetAccountId}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setTargetAccountId(val);

                                        if (val && val !== 'new') {
                                            const acc = accounts.find(a => a.id === parseInt(val));
                                            if (acc) setTargetPotId(String(acc.pot_id));
                                        } else if (val === 'new') {
                                            // Ensure we have a target pot selected... wait, if 'new', we need to know WHICH pot.
                                            // The previous UI let you select Pot then 'Create New'.
                                            // If we remove Pot selector, 'Create New' becomes ambiguous: "Create New in WHICH POT?"
                                            // Solution: Helper generic 'Create New' is tricky without Pot selector.
                                            // Alternative: Add "Create New in [Pot Name]" options for each pot? 
                                            // Or: Keep "Target Pot" selector ONLY if "Create New" is picked?
                                            // Let's try adding "Create New" as the first option inside EACH optgroup?
                                            // Yes! <option value="new_POTID">+ New in {PotName}</option>

                                            // Actually, let's just default to 'Unallocated' or ask properly? 
                                            // "Create New" inside optgroups is best UX.
                                        }
                                    }}
                                    required
                                >
                                    <option value="">Select target account...</option>
                                    {pots.map(pot => {
                                        const potAccounts = accounts.filter(a => a.pot_id === pot.id);
                                        return (
                                            <optgroup key={pot.id} label={pot.name}>
                                                <option value={`new_${pot.id}`} style={{ fontStyle: 'italic', color: 'var(--teal-mid)' }}>
                                                    + Create new in {pot.name}...
                                                </option>
                                                {potAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.account_name} ({acc.owner}) — £{acc.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Amount (£)</label>
                                <div className="relative" style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        onFocus={e => {
                                            const val = e.target.value.replace(/,/g, '');
                                            setAmount(val);
                                        }}
                                        onBlur={e => {
                                            const raw = e.target.value.replace(/,/g, '');
                                            if (raw) {
                                                const val = parseFloat(raw);
                                                if (!isNaN(val)) {
                                                    setAmount(val.toLocaleString('en-GB', { minimumFractionDigits: 2 }));
                                                }
                                            }
                                        }}
                                        placeholder="0.00"
                                        required
                                        style={{ paddingRight: '60px' }}
                                    />
                                    {maxAmount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setAmount(maxAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 }))}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--teal-mid)',
                                                background: 'rgba(20, 184, 166, 0.1)',
                                                border: 'none',
                                                padding: '4px 8px',
                                                borderRadius: 'var(--r-sm)',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                zIndex: 5
                                            }}
                                        >
                                            MAX
                                        </button>
                                    )}
                                </div>
                                {maxAmount > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', textAlign: 'right' }}>
                                        Max: £{maxAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-sm mt-md">
                                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                                    {loading ? 'Allocating...' : 'Confirm Allocation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal {
                    width: 100%;
                    max-width: 400px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
            `}</style>
        </>
    );
}
