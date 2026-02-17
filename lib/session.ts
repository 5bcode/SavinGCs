import { createHmac, timingSafeEqual } from 'crypto';

// Use a default for development but warn if it's used in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-me';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn('WARNING: Running in production without SESSION_SECRET');
}

/**
 * Creates a signed session string from a payload object.
 */
export function signSession(payload: object): string {
    const data = JSON.stringify(payload);
    const signature = createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
    return `${data}.${signature}`;
}

/**
 * Verifies a signed session string and returns the payload.
 */
export function verifySession(token: string): any | null {
    const lastDotIndex = token.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const data = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    if (!data || !signature) return null;

    const expectedSignature = createHmac('sha256', SESSION_SECRET).update(data).digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}
