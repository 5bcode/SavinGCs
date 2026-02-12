'use client';

import { getIcon } from '@/lib/utils'; // We'll need to move getIcon util or redefine it

interface SubGoal {
    id: number;
    pot_id: number;
    name: string;
    target_amount: number;
}

interface Account {
    id: number;
    pot_id: number;
    account_name: string;
    account_type: string;
    owner: string;
    current_balance: number;
    provider?: string;
}

interface SavingsPot {
    id: number;
    name: string;
    goal_amount: number | null;
    goal_date: string | null;
    color: string;
    icon: string;
    total_balance: number;
    sub_goals?: SubGoal[];
}

interface PotCardProps {
    pot: SavingsPot;
    accounts: Account[];
    onAccountClick: (id: number) => void;
}

export default function PotCard({ pot, accounts, onAccountClick }: PotCardProps) {
    const progress = pot.goal_amount ? (pot.total_balance / pot.goal_amount) * 100 : 0;
    const clampedProgress = Math.min(progress, 100);
    const isGoalMet = pot.goal_amount && pot.total_balance >= pot.goal_amount;

    // Calculate sub-goal progress (Waterfall)
    let remainingForSubGoals = pot.total_balance;
    const subGoalsWithProgress = (pot.sub_goals || []).map(sg => {
        let funded = 0;
        let percent = 0;

        if (remainingForSubGoals > 0) {
            funded = Math.min(remainingForSubGoals, sg.target_amount);
            remainingForSubGoals -= funded;
            percent = (funded / sg.target_amount) * 100;
        }

        return { ...sg, funded, percent };
    });

    // Calculate monthly savings target
    let monthlySavingsTarget: number | null = null;
    let monthsRemaining: number | null = null;
    if (pot.goal_amount && pot.goal_date && !isGoalMet) {
        const now = new Date();
        const goalDate = new Date(pot.goal_date);
        const diffMs = goalDate.getTime() - now.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // average month
        monthsRemaining = Math.max(Math.ceil(diffMonths), 0);
        const remaining = pot.goal_amount - pot.total_balance;

        // Fix: Only calculate positive remaining amounts
        if (monthsRemaining > 0 && remaining > 0) {
            monthlySavingsTarget = remaining / monthsRemaining;
        }
    }

    // Helper for icons (temporary inline till we move utils)
    const iconChar = getIcon(pot.icon);

    return (
        <div className="card" style={{
            padding: 'var(--sp-lg)',
            ...(pot.name === 'Unallocated' ? {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
            } : {})
        }}>
            <div className="flex items-center justify-between mb-md">
                <div className="flex items-center gap-md">
                    <div className="pot-icon" style={{ background: `${pot.color}25` }}>
                        {iconChar}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{pot.name}</div>
                        {pot.goal_amount && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                Goal: £{pot.goal_amount.toLocaleString('en-GB')}
                                {pot.goal_date && (
                                    <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                                        by {new Date(pot.goal_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        £{pot.total_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </div>
                    {isGoalMet && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, marginTop: '2px' }}>✓ Goal reached</div>
                    )}
                </div>
            </div>

            {/* Monthly savings target pill */}
            {monthlySavingsTarget !== null && monthsRemaining !== null && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    marginBottom: 'var(--sp-md)',
                    fontSize: '0.78rem',
                }}>
                    <span style={{ fontSize: '1rem' }}>📅</span>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                            £{monthlySavingsTarget.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                            needed · {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''} left
                        </span>
                    </div>
                </div>
            )}

            {pot.goal_amount && pot.goal_date && isGoalMet && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    marginBottom: 'var(--sp-md)',
                    fontSize: '0.78rem',
                    color: 'var(--success)',
                    fontWeight: 600,
                }}>
                    <span style={{ fontSize: '1rem' }}>🎉</span>
                    Goal reached ahead of schedule!
                </div>
            )}

            {pot.goal_amount && (
                <div>
                    <div className="progress-track" style={{ height: '8px', marginTop: 0, marginBottom: '6px' }}>
                        <div
                            className={`progress-fill${isGoalMet ? '' : ' purple'}`}
                            style={{ width: `${clampedProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        <span>{clampedProgress.toFixed(1)}% complete</span>
                        <span>£{Math.max(0, (pot.goal_amount || 0) - pot.total_balance).toLocaleString('en-GB')} to go</span>
                    </div>
                </div>
            )}

            {/* Sub-goals Breakdown */}
            {subGoalsWithProgress.length > 0 && (
                <div style={{ marginTop: 'var(--sp-md)', marginBottom: 'var(--sp-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Milestones
                    </div>
                    <div className="stack" style={{ gap: '12px' }}>
                        {subGoalsWithProgress.map((sg) => (
                            <div key={sg.id} style={{ fontSize: '0.8rem' }}>
                                <div className="flex justify-between mb-xs">
                                    <span>{sg.name}</span>
                                    <span style={{ color: sg.percent >= 100 ? 'var(--success)' : 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                        {sg.percent >= 100 ? '✓ ' : ''}£{sg.funded.toLocaleString('en-GB', { maximumFractionDigits: 0 })} <span style={{ opacity: 0.5 }}>/ £{sg.target_amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span>
                                    </span>
                                </div>
                                <div className="progress-track" style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginTop: '4px' }}>
                                    <div className="progress-fill" style={{
                                        width: `${Math.min(sg.percent, 100)}%`,
                                        background: sg.percent >= 100 ? 'var(--success)' : pot.color,
                                        borderRadius: '3px',
                                        transition: 'width 0.5s ease-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inline account breakdown */}
            {accounts.filter(a => a.current_balance !== 0).length > 0 && (
                <div style={{ marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)', borderTop: '1px solid var(--border)' }}>
                    {accounts.filter(a => a.current_balance !== 0).map((acc) => (
                        <div key={acc.id} className="flex justify-between items-center" style={{ padding: '6px 0', cursor: 'pointer' }} onClick={() => onAccountClick(acc.id)}>
                            <div className="flex items-center gap-sm">
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pot.color, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {acc.provider ? (
                                        <>
                                            <span style={{ opacity: 0.7 }}>{acc.provider} – </span>
                                            {acc.account_name}
                                        </>
                                    ) : (
                                        acc.account_name
                                    )}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', padding: '1px 6px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)' }}>
                                    {acc.account_type.toUpperCase()} ·
                                    <span style={{
                                        color: acc.owner === 'Gary' ? '#3b82f6' : acc.owner === 'Catherine' ? '#ec4899' : 'inherit',
                                        fontWeight: 600,
                                        marginLeft: '4px'
                                    }}>
                                        {acc.owner || 'Joint'}
                                    </span>
                                </span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                £{acc.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
