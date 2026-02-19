import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'development-secret-do-not-use-in-prod';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET is not set in production environment! Using insecure default.');
}

/**
 * Signs a session object, returning a token string.
 * Format: base64(json).signature
 */
export function signSession(data: any): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = createHmac('sha256', SECRET).update(payload).digest('base64');
  // Use URL-safe replacement if needed, but standard base64 is usually fine in cookies if encoded or handled by framework
  // We'll stick to standard base64 for now as cookies handle it fine usually
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token and returns the session object.
 * Returns null if invalid or tampered with.
 */
export function verifySession(token: string): any | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expectedSignature = createHmac('sha256', SECRET).update(payload).digest('base64');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  try {
      if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
          return null;
      }
      return JSON.parse(Buffer.from(payload, 'base64').toString());
  } catch (error) {
      // In case of Buffer creation errors or JSON parse errors
      return null;
  }
}
