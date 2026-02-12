import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Notification {
    id: number;
    user_id: number;
    type: 'milestone' | 'system' | 'alert';
    title: string;
    message: string;
    pot_id?: number;
    milestone_type?: string;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { data, error, isLoading, mutate: refreshNotifications } = useSWR('/api/notifications', fetcher);

    return {
        notifications: (data?.notifications || []) as Notification[],
        unreadCount: data?.unreadCount || 0,
        isLoading,
        isError: error,
        refresh: () => {
            mutate('/api/notifications');
            mutate('/api/pots');
        },
        markAsRead: async (notificationId: number) => {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead', notificationId })
            });
            refreshNotifications();
        },
        markAllAsRead: async () => {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllRead' })
            });
            refreshNotifications();
        }
    };
}
