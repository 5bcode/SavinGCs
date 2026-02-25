import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { signSession } from '@/lib/session';

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

        // 🛡️ SENTINEL: Timing Attack Protection
        // Always perform a bcrypt comparison to prevent username enumeration via timing attacks.
        // If the user is not found, we compare against a dummy hash so the response time is consistent.
        const DUMMY_HASH = '$2b$10$j3elaMrnGMnLzShCTd1H7u8i.O4lpWC7avkHMVR0ZPBaGWq91ZucS';

        const targetHash = user ? (user.password_hash as string) : DUMMY_HASH;
        const isValid = bcrypt.compareSync(password, targetHash);

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
