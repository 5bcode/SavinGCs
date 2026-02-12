'use client';

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

interface AccountListProps {
    accounts: Account[];
    onAccountClick: (id: number) => void;
}

export default function AccountList({ accounts, onAccountClick }: AccountListProps) {
    if (accounts.length === 0) return null;

    const accountsByOwner = accounts
        .filter(a => a.current_balance !== 0)
        .reduce((acc, account) => {
            const owner = account.owner || 'Unassigned';
            if (!acc[owner]) acc[owner] = [];
            acc[owner].push(account);
            return acc;
        }, {} as Record<string, Account[]>);

    return (
        <>
            <div className="section-header">
                <div className="section-title">All Accounts</div>
                <div className="section-link">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
            </div>

            {Object.entries(accountsByOwner).sort(([a], [b]) => a.localeCompare(b)).map(([owner, ownerAccounts]) => (
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
    );
}

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
