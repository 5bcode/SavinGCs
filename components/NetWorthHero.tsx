'use client';

interface NetWorthHeroProps {
    totalSavings: number;
    totalGoal: number;
    overallProgress: number;
}

export default function NetWorthHero({ totalSavings, totalGoal, overallProgress }: NetWorthHeroProps) {
    return (
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
    );
}
