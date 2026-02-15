import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod';

function sign(value: string): string {
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(value)
        .digest('base64')
        .replace(/=+$/, '');
    return value + '.' + signature;
}

function verify(value: string): string | null {
    const parts = value.split('.');
    if (parts.length < 2) return null;

    const signature = parts.pop();
    const originalValue = parts.join('.');

    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(originalValue)
        .digest('base64')
        .replace(/=+$/, '');

    const signatureBuffer = Buffer.from(signature!);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
        return null;
    }

    if (crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return originalValue;
    }
    return null;
}

export function signSession(user: any): string {
    return sign(JSON.stringify(user));
}

export function verifySession(sessionValue: string): any | null {
    const json = verify(sessionValue);
    if (!json) return null;
    try {
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

    return verifySession(session.value);
}

/**
 * Returns a 401 JSON response.
 */
export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
