import { createHmac, timingSafeEqual } from 'node:crypto';

// In production, this should always be set. In development, we use a fallback.
const SECRET_KEY = process.env.SESSION_SECRET || 'default-secret-key-change-me';

export function signSession(payload: any): string {
    const json = JSON.stringify(payload);
    // Base64 encode the JSON to ensure it's safe for cookie value
    const encodedJson = Buffer.from(json).toString('base64');
    const signature = createHmac('sha256', SECRET_KEY).update(encodedJson).digest('hex');
    return `${encodedJson}.${signature}`;
}

export function verifySession(sessionStr: string): any | null {
    const parts = sessionStr.split('.');
    if (parts.length !== 2) return null;

    const [encodedJson, signature] = parts;
    if (!encodedJson || !signature) return null;

    const expectedSignature = createHmac('sha256', SECRET_KEY).update(encodedJson).digest('hex');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
        return null;
    }

    try {
        const json = Buffer.from(encodedJson, 'base64').toString();
        return JSON.parse(json);
    } catch {
        return null;
    }
}
