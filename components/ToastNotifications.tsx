'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ToastNotification {
    id: number;
    title: string;
    message: string;
    milestone_type?: string;
}

export default function ToastNotifications() {
    const { data, mutate } = useSWR<{ notifications: ToastNotification[] }>('/api/notifications?unread=true', fetcher, {
        refreshInterval: 30000, // Poll every 30 seconds
    });

    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const [shownIds, setShownIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (data?.notifications) {
            const newToasts = data.notifications.filter(n => !shownIds.has(n.id));
            if (newToasts.length > 0) {
                setToasts(prev => [...prev, ...newToasts]);
                setShownIds(prev => new Set([...prev, ...newToasts.map(n => n.id)]));

                // Auto-remove after 5 seconds
                newToasts.forEach(toast => {
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }, 5000);
                });
            }
        }
    }, [data, shownIds]);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'GOAL_REACHED': return '🎉';
            case '100%': return '🎯';
            case '75%': return '🔥';
            case '50%': return '📈';
            case '25%': return '✨';
            default: return '💰';
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none'
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--r-lg)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        padding: '16px',
                        width: '300px',
                        maxWidth: 'calc(100vw - 40px)',
                        border: '1px solid var(--border)',
                        pointerEvents: 'auto',
                        animation: 'slideIn 0.3s ease-out',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(5, 150, 105, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        flexShrink: 0
                    }}>
                        {getIcon(toast.milestone_type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                            {toast.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {toast.message}
                        </div>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '4px',
                            margin: '-4px',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
