
import { NextRequest, NextResponse } from 'next/server';
import { dbClient as db, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_run_date ASC',
            args: [user.id]
        });
        return NextResponse.json({ recurring: result.rows });
    } catch (error) {
        console.error('Failed to fetch recurring transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = getSessionUser(req);
    if (!user) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { accountId, amount, description, frequency, startDate } = body;

        // Verify account ownership
        const accountResult = await db.execute({
            sql: 'SELECT owner FROM accounts WHERE id = ?',
            args: [accountId]
        });
        const account = accountResult.rows[0];

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        if (account.owner !== 'Joint' && account.owner !== user.displayName) {
            return NextResponse.json({ error: 'Unauthorized account access' }, { status: 403 });
        }

        // Validation could go here (Zod)

        await db.execute({
            sql: `INSERT INTO recurring_transactions (account_id, user_id, amount, description, frequency, next_run_date) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [accountId, user.id, amount, description, frequency, startDate]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to create recurring transaction:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const user = getSessionUser(req);
    if (!user) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute({
            sql: 'DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?',
            args: [id, user.id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
