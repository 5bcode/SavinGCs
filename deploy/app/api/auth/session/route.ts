import { NextRequest, NextResponse } from 'next/server';

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

    try {
        const user = JSON.parse(session.value);
        return NextResponse.json({ authenticated: true, user });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
