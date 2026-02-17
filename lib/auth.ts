import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './session';

export { signSession, verifySession } from './session';

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
