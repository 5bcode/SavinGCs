import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const notifications = await getNotifications(user.id, unreadOnly);
        const unreadCount = await getUnreadCount(user.id);

        return NextResponse.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { action, notificationId } = body;

        if (action === 'markRead' && notificationId) {
            await markNotificationAsRead(notificationId, user.id);
            return NextResponse.json({ success: true });
        }

        if (action === 'markAllRead') {
            await markAllNotificationsAsRead(user.id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
