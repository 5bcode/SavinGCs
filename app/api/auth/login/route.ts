import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { signSession } from '@/lib/auth';

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

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const passwordHash = user.password_hash as string;
        const isValid = bcrypt.compareSync(password, passwordHash);

        if (!isValid) {
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
        const sessionToken = signSession({
            id: user.id,
            username: user.username,
            displayName: user.display_name
        });

        response.cookies.set('user_session', sessionToken, {
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
