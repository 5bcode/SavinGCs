import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-prod';

export function signSession(data: any): string {
    const json = JSON.stringify(data);
    const signature = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
    return `${Buffer.from(json).toString('base64')}.${signature}`;
}

export function verifySession(token: string): any | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const json = Buffer.from(encoded, 'base64').toString();
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(json).digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length) return null;

    if (crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }
    return null;
}
