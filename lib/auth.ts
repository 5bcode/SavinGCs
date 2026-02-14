import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Use a consistent secret for development, but require one in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-prod';

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
}

/**
 * Signs the session payload with HMAC-SHA256.
 * Format: base64(payload).base64(signature)
 */
export function signSession(payload: any): string {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json).toString('base64');
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64')
        .replace(/=+$/, ''); // Remove padding

    return `${data}.${signature}`;
}

/**
 * Verifies the session token and returns the payload if valid.
 */
export function verifySession(token: string): any | null {
    if (!token || !token.includes('.')) return null;

    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64')
        .replace(/=+$/, '');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const json = Buffer.from(data, 'base64').toString('utf-8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Validates the user session from cookies.
 * Returns the parsed user object if valid, or null if not.
 */
export function getSessionUser(request: NextRequest): { id: number; username: string; displayName: string } | null {
    const session = request.cookies.get('user_session');
    if (!session) return null;

    const user = verifySession(session.value);
    if (user && user.id && user.username) return user;

    return null;
}

/**
 * Returns a 401 JSON response.
 */
export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
