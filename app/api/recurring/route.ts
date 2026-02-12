
import { NextRequest, NextResponse } from 'next/server';
import { dbClient as db } from '@/lib/db_turso';

export async function GET(req: NextRequest) {
    try {
        const result = await db.execute('SELECT * FROM recurring_transactions ORDER BY next_run_date ASC');
        return NextResponse.json({ recurring: result.rows });
    } catch (error) {
        console.error('Failed to fetch recurring transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accountId, userId, amount, description, frequency, startDate } = body;

        // Validation could go here (Zod)

        await db.execute({
            sql: `INSERT INTO recurring_transactions (account_id, user_id, amount, description, frequency, next_run_date) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [accountId, userId, amount, description, frequency, startDate]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to create recurring transaction:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute({
            sql: 'DELETE FROM recurring_transactions WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
