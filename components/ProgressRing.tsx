'use client';

interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export default function ProgressRing({ percentage, size = 96, strokeWidth = 7, children }: ProgressRingProps) {
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
