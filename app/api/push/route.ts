import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { savePushSubscription, deletePushSubscription, getPushSubscriptions } from '@/lib/notifications';

// VAPID keys - In production, these should be stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

export async function GET(request: NextRequest) {
    // Return the VAPID public key for the client to use
    return NextResponse.json({
        publicKey: VAPID_PUBLIC_KEY
    });
}

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { action, subscription } = body;

        if (action === 'subscribe' && subscription) {
            // Save the push subscription
            await savePushSubscription(user.id, subscription);
            return NextResponse.json({ success: true });
        }

        if (action === 'unsubscribe' && subscription?.endpoint) {
            // Delete the push subscription
            await deletePushSubscription(subscription.endpoint);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error managing push subscription:', error);
        return NextResponse.json({ error: 'Failed to manage push subscription' }, { status: 500 });
    }
}
