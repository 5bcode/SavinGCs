'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
    onNavigate?: (view: string) => void;
}

export default function NotificationsPanel({ onNavigate }: NotificationsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                className="icon-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
                style={{ position: 'relative' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--error, #ef4444)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '340px',
                    maxHeight: '400px',
                    background: 'var(--bg-card, white)',
                    borderRadius: 'var(--r-lg, 12px)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border, #e5e7eb)',
                    overflow: 'hidden',
                    zIndex: 1000
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--r-sm)'
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {isLoading ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                    No notifications yet
                                </div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>
                                    We'll let you know when you hit savings milestones!
                                </div>
                            </div>
                        ) : (
                            notifications.map((notification: Notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={() => markAsRead(notification.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotificationItem({ notification, onMarkRead }: {
    notification: Notification;
    onMarkRead: () => void;
}) {

    const getIcon = () => {
        switch (notification.milestone_type) {
            case 'GOAL_REACHED':
                return '🎉';
            case '100%':
                return '🎯';
            case '75%':
                return '🔥';
            case '50%':
                return '📈';
            case '25%':
                return '✨';
            default:
                return '💰';
        }
    };

    return (
        <div
            onClick={onMarkRead}
            style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: notification.is_read ? 'transparent' : 'rgba(5, 150, 105, 0.05)',
                transition: 'background 0.2s'
            }}
        >
            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                }}>
                    {getIcon()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '2px'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{notification.title}</span>
                        {!notification.is_read && (
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--primary)'
                            }} />
                        )}
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        marginBottom: '4px'
                    }}>
                        {notification.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {formatTime(notification.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
}

const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};
