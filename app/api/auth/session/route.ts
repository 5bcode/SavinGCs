import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('user_session');
    return response;
}

export async function GET(request: NextRequest) {
    const user = getSessionUser(request);

    if (!user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
}
