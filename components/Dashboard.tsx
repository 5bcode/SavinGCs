'use client';

import { useSavingsData } from '@/hooks/useSavingsData';
import AllocateFunds from './AllocateFunds';

interface Account {
    id: number;
    pot_id: number;
    account_name: string;
    account_type: string;
    owner: string;
    current_balance: number;
    pot_name: string;
    pot_color: string;
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
}

interface DashboardProps {
    onUpdateBalance: () => void;
    onAccountClick: (accountId: number) => void;
}

export default function Dashboard({ onUpdateBalance, onAccountClick }: DashboardProps) {
    const { pots, accounts, isLoading, refresh } = useSavingsData();

    // Calculate totals directly from data
    const totalSavings = pots.reduce((sum: number, pot: any) => sum + (pot.total_balance || 0), 0);

    // For progress, exclude 'Unallocated' pot
    const progressPots = pots.filter((p: any) => p.name !== 'Unallocated');
    const savingsForProgress = progressPots.reduce((sum: number, pot: any) => sum + (pot.total_balance || 0), 0);
    const totalGoal = progressPots.reduce((sum: number, pot: any) => sum + (pot.goal_amount || 0), 0);

    // Net worth uses totalSavings. Progress uses filtered values.
    const overallProgress = totalGoal > 0 ? (savingsForProgress / totalGoal) * 100 : 0;

    if (isLoading) {
        return (
            <div className="stack">
                <div className="skeleton" style={{ height: '220px' }} />
                <div className="skeleton" style={{ height: '100px' }} />
                <div className="skeleton" style={{ height: '80px' }} />
            </div>
        );
    }

    return (
        <div>
            {/* ─── Net Worth Hero ─── */}
            <div style={{ textAlign: 'center', padding: 'var(--sp-lg) 0 var(--sp-md)' }}>
                <div className="balance-label">Total Net Worth</div>
                <div className="balance-amount">
                    £{totalSavings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {totalGoal > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        {Math.min(overallProgress, 100).toFixed(1)}% of £{totalGoal.toLocaleString('en-GB')} goal
                    </div>
                )}
            </div>

            {/* ─── Overall Progress Ring Card ─── */}
            {totalGoal > 0 && (
                <div className="credit-card mb-lg" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xl)', position: 'relative', zIndex: 1 }}>
                        <ProgressRing percentage={Math.min(overallProgress, 100)} size={96} strokeWidth={7}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                                    {Math.min(overallProgress, 100).toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                                    saved
                                </div>
                            </div>
                        </ProgressRing>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Savings Progress
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>
                                £{savingsForProgress.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                                £{(totalGoal - savingsForProgress > 0 ? totalGoal - savingsForProgress : 0).toLocaleString('en-GB')} remaining
                            </div>
                        </div>
                    </div>
                    {/* Wave decoration */}
                    <div className="wave-decoration">
                        <svg viewBox="0 0 400 80" fill="none" preserveAspectRatio="none">
                            <path d="M0 40 Q50 10 100 35 T200 30 T300 40 T400 25 L400 80 L0 80Z" fill="rgba(13,148,136,0.3)" />
                            <path d="M0 50 Q60 25 120 45 T240 35 T360 50 T400 40 L400 80 L0 80Z" fill="rgba(13,148,136,0.15)" />
                        </svg>
                    </div>
                </div>
            )}

            {/* ─── Actions Row ─── */}
            <div className="flex gap-md mb-lg">
                <button className="btn btn-primary flex-1" onClick={onUpdateBalance}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 7c0-5.333-8-5.333-8 0" /><path d="M10 7v14" /><path d="M6 21h12" /><path d="M6 13h10" />
                    </svg>
                    Update Balances
                </button>
                <div style={{ flex: 1 }}>
                    <AllocateFunds
                        pots={pots}
                        accounts={accounts}
                        onUpdate={refresh}
                    />
                </div>
            </div>

            {/* ─── Savings Pots Breakdown ─── */}
            <div className="section-header">
                <div className="section-title">Savings Pots</div>
                <div className="section-link">{pots.length} pot{pots.length !== 1 ? 's' : ''}</div>
            </div>

            {pots.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏡</div>
                    <div className="empty-state-text">
                        No savings pots yet.<br />
                        Go to Settings to create your first one!
                    </div>
                </div>
            ) : (
                <div className="stack mb-xl">
                    {pots.map((pot) => {
                        const potAccounts = accounts.filter((a) => a.pot_id === pot.id);
                        return <PotBreakdownCard key={pot.id} pot={pot} accounts={potAccounts} onAccountClick={onAccountClick} />;
                    })}
                </div>
            )}

            {/* ─── All Accounts Overview ─── */}
            {accounts.length > 0 && (
                <>
                    <div className="section-header">
                        <div className="section-title">All Accounts</div>
                        <div className="section-link">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
                    </div>

                    {Object.entries(
                        accounts
                            .filter(a => a.current_balance !== 0)
                            .reduce((acc, account) => {
                                const owner = account.owner || 'Unassigned';
                                if (!acc[owner]) acc[owner] = [];
                                acc[owner].push(account);
                                return acc;
                            }, {} as Record<string, Account[]>)
                    ).sort(([a], [b]) => a.localeCompare(b)).map(([owner, ownerAccounts]: [string, Account[]]) => (
                        <div key={owner} style={{ marginBottom: 'var(--sp-lg)' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0 4px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: owner === 'Gary' ? '#3b82f6' : owner === 'Catherine' ? '#ec4899' : 'var(--text-secondary)'
                                }}>
                                    {owner}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    £{ownerAccounts.reduce((sum, acc) => sum + acc.current_balance, 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="stack" style={{ gap: 'var(--sp-sm)' }}>
                                {ownerAccounts.map((account) => (
                                    <AccountBalanceRow key={account.id} account={account} onClick={() => onAccountClick(account.id)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

/* ─── Pot Breakdown Card ─── */
function PotBreakdownCard({ pot, accounts, onAccountClick }: { pot: SavingsPot; accounts: Account[]; onAccountClick: (id: number) => void }) {
    const progress = pot.goal_amount ? (pot.total_balance / pot.goal_amount) * 100 : 0;
    const clampedProgress = Math.min(progress, 100);
    const isGoalMet = pot.goal_amount && pot.total_balance >= pot.goal_amount;

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
        if (monthsRemaining > 0 && remaining > 0) {
            monthlySavingsTarget = remaining / monthsRemaining;
        }
    }

    return (
        <div className="card" style={{ padding: 'var(--sp-lg)' }}>
            <div className="flex items-center justify-between mb-md">
                <div className="flex items-center gap-md">
                    <div className="pot-icon" style={{ background: `${pot.color}25` }}>
                        {getIcon(pot.icon)}
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

/* ─── Account Balance Row ─── */
function AccountBalanceRow({ account, onClick }: { account: Account; onClick: () => void }) {
    return (
        <div className="pot-item" onClick={onClick}>
            <div className="pot-icon" style={{
                background: `linear-gradient(135deg, ${account.pot_color || 'var(--purple-start)'}30, ${account.pot_color || 'var(--purple-start)'}10)`,
                fontSize: '1rem',
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={account.pot_color || 'var(--purple-mid)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            </div>
            <div className="pot-info">
                <div className="pot-name">
                    {account.provider ? (
                        <span style={{ fontWeight: 600 }}>
                            <span style={{ fontWeight: 400, opacity: 0.8 }}>{account.provider} – </span>
                            {account.account_name}
                        </span>
                    ) : (
                        account.account_name
                    )}
                </div>
                <div className="pot-meta">
                    {account.pot_name} · {account.account_type} ·
                    <span style={{
                        color: account.owner === 'Gary' ? '#3b82f6' : account.owner === 'Catherine' ? '#ec4899' : 'inherit',
                        fontWeight: 600,
                        marginLeft: '4px'
                    }}>
                        {account.owner || 'Joint'}
                    </span>
                </div>
            </div>
            <div className="pot-amount">
                £{account.current_balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
        </div>
    );
}

/* ─── Circular Progress Ring ─── */
function ProgressRing({ percentage, size = 96, strokeWidth = 7, children }: {
    percentage: number; size?: number; strokeWidth?: number; children?: React.ReactNode;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="ring-bg" cx={size / 2} cy={size / 2} r={radius} />
                <circle className="ring-fill" cx={size / 2} cy={size / 2} r={radius}
                    stroke="url(#ringGrad)" strokeDasharray={circumference} strokeDashoffset={offset} />
                <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-start)" />
                        <stop offset="100%" stopColor="var(--teal-end)" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="ring-text">{children}</div>
        </div>
    );
}

function getIcon(icon: string) {
    const icons: Record<string, string> = {
        'piggy-bank': '🐷', 'house': '🏡', 'car': '🚗', 'vacation': '🏖️',
        'emergency': '🚨', 'wedding': '💍', 'education': '🎓', 'savings': '💰',
        'tent': '⛺'
    };
    return icons[icon] || '💰';
}
