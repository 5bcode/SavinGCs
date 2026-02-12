import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the user session from cookies.
 * Returns the parsed user object if valid, or null if not.
 */
export function getSessionUser(request: NextRequest): { id: number; username: string; displayName: string } | null {
    const session = request.cookies.get('user_session');
    if (!session) return null;

    try {
        const user = JSON.parse(session.value);
        if (user && user.id && user.username) return user;
        return null;
    } catch {
        return null;
    }
}

/**
 * Returns a 401 JSON response.
 */
export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
