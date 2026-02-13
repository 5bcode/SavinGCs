import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Use a fallback secret if none is provided, but warn about it.
// In a real production app, this should be a mandatory environment variable.
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-prod';

/**
 * Signs a payload object to create a tamper-proof session token.
 * Format: base64(payload).base64(signature)
 */
export function signSession(payload: any): string {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json).toString('base64url');
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64url');
    return `${data}.${signature}`;
}

/**
 * Verifies a session token and returns the payload if valid.
 * Returns null if the token is invalid or has been tampered with.
 */
export function verifySession(token: string): any | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64url');

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length) return null;

    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

    try {
        return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
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

    // Verify the signed session token
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
