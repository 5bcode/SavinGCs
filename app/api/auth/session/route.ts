import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('user_session');
    return response;
}

export async function GET(request: NextRequest) {
    const session = request.cookies.get('user_session');

    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = verifySession(session.value);

    if (user) {
        return NextResponse.json({ authenticated: true, user });
    } else {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
