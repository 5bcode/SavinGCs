import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { signSession } from '@/lib/session';

// Pre-calculate a dummy hash for constant-time comparison when user is not found
// This prevents username enumeration via timing attacks
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-protection', 10);

export async function POST(request: NextRequest) {
    await ensureInitialized();

    try {
        const { username, password, rememberMe } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const result = await dbClient.execute({
            sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
            args: [username]
        });

        const user = result.rows[0];

        // Always verify password to prevent timing attacks (user enumeration)
        // If user is not found, we compare against a dummy hash so the response time is consistent
        const passwordHash = (user ? user.password_hash : DUMMY_HASH) as string;
        const isValid = bcrypt.compareSync(password, passwordHash);

        if (!user || !isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name
            }
        });

        // Set cookie — 30 days if remember me, otherwise session only
        const sessionPayload = {
            id: user.id,
            username: user.username,
            displayName: user.display_name
        };

        response.cookies.set('user_session', signSession(sessionPayload), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {})
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
