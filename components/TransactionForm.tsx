'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Account {
    id: number;
    pot_id: number;
    account_name: string;
    account_type: string;
    current_balance: number;
}

interface SavingsPot {
    id: number;
    name: string;
}

interface TransactionFormProps {
    onSuccess: () => void;
    currentUser: { id: number; username: string; displayName: string };
}

export default function TransactionForm({ onSuccess, currentUser }: TransactionFormProps) {
    const { addToast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [pots, setPots] = useState<SavingsPot[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDeposit, setIsDeposit] = useState(true);
    const [loading, setLoading] = useState(false);

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [accountsRes, potsRes] = await Promise.all([fetch('/api/accounts'), fetch('/api/pots')]);
            const accountsData = await accountsRes.json();
            const potsData = await potsRes.json();
            setAccounts(accountsData.accounts || []);
            setPots(potsData.pots || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Failed to load accounts', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const finalAmount = isDeposit ? parseFloat(amount) : -parseFloat(amount);

            if (isRecurring) {
                const res = await fetch('/api/recurring', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: parseInt(selectedAccountId),
                        userId: currentUser.id,
                        amount: finalAmount,
                        description,
                        frequency,
                        startDate: transactionDate
                    })
                });
                if (!res.ok) throw new Error('Failed to create recurring transaction');
                addToast('Recurring transaction created!', 'success');
            } else {
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: parseInt(selectedAccountId),
                        userId: currentUser.id,
                        amount: finalAmount,
                        description,
                        transactionDate
                    })
                });
                if (!res.ok) throw new Error('Failed to create transaction');
                addToast('Transaction added successfully', 'success');
            }

            setAmount('');
            setDescription('');
            setTransactionDate(new Date().toISOString().split('T')[0]);
            setIsRecurring(false);
            onSuccess();
        } catch (error) {
            console.error('Error creating transaction:', error);
            addToast('Failed to save transaction', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: 'var(--sp-lg)' }}>
                {isRecurring ? 'New Recurring Rule' : 'New Transaction'}
            </h2>

            <div className="form-group">
                <label className="form-label">Type</label>
                <div className="toggle-group">
                    <button type="button" className={`toggle-option${isDeposit ? ' active' : ''}`} onClick={() => setIsDeposit(true)}>
                        💰 Deposit
                    </button>
                    <button type="button" className={`toggle-option${!isDeposit ? ' active' : ''}`} onClick={() => setIsDeposit(false)}>
                        💸 Withdrawal
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="tx-account">Account</label>
                <select
                    id="tx-account"
                    className="form-select"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                >
                    <option value="">Select an account</option>
                    {pots.map((pot) => {
                        const potAccounts = accounts.filter((a) => a.pot_id === pot.id);
                        return potAccounts.length > 0 ? (
                            <optgroup key={pot.id} label={pot.name}>
                                {potAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.account_name} (£{account.current_balance.toLocaleString('en-GB')})
                                    </option>
                                ))}
                            </optgroup>
                        ) : null;
                    })}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="tx-amount">Amount (£)</label>
                <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="tx-date">
                    {isRecurring ? 'Start Date' : 'Date'}
                </label>
                <input
                    id="tx-date"
                    type="date"
                    className="form-input"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--sp-md)' }}>
                <input
                    type="checkbox"
                    id="is-recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="is-recurring" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>Make this recurring?</label>
            </div>

            {isRecurring && (
                <div className="form-group animate-slide-in">
                    <label className="form-label">Frequency</label>
                    <div className="toggle-group">
                        {['weekly', 'monthly', 'yearly'].map((freq) => (
                            <button
                                key={freq}
                                type="button"
                                className={`toggle-option${frequency === freq ? ' active' : ''}`}
                                onClick={() => setFrequency(freq)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {freq}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-group">
                <label className="form-label" htmlFor="tx-description">Description</label>
                <input
                    id="tx-description"
                    type="text"
                    className="form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Monthly savings"
                />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : (isRecurring ? 'Set Recurring Rule' : `Add ${isDeposit ? 'Deposit' : 'Withdrawal'}`)}
            </button>
        </form>
    );
}
