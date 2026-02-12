import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    await ensureInitialized();

    try {
        const accountRes = await dbClient.execute({
            sql: `SELECT a.*, sp.name as pot_name, sp.color as pot_color
                  FROM accounts a
                  JOIN savings_pots sp ON sp.id = a.pot_id
                  WHERE a.id = ?`,
            args: [id]
        });

        const account = accountRes.rows[0];

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const historyRes = await dbClient.execute({
            sql: `SELECT balance, recorded_date, created_at
                  FROM balance_history
                  WHERE account_id = ?
                  ORDER BY recorded_date DESC, created_at DESC
                  LIMIT 50`,
            args: [id]
        });

        const txCountRes = await dbClient.execute({
            sql: 'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
            args: [id]
        });
        const txCount = Number(txCountRes.rows[0].count);

        return NextResponse.json({ account, history: historyRes.rows, transactionCount: txCount });
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    await ensureInitialized();

    try {
        const { accountName, accountType, owner, provider } = await request.json();

        const existingRes = await dbClient.execute({
            sql: 'SELECT * FROM accounts WHERE id = ?',
            args: [id]
        });
        const existing = existingRes.rows[0];

        if (!existing) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const newName = accountName ?? existing.account_name;
        const newType = accountType ?? existing.account_type;
        const newOwner = owner ?? existing.owner;
        const newProvider = provider ?? existing.provider;

        await dbClient.execute({
            sql: `UPDATE accounts 
                  SET account_name = ?, account_type = ?, owner = ?, provider = ?, last_updated = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [newName, newType, newOwner, newProvider, id]
        });

        return NextResponse.json({
            success: true,
            previousBalance: existing.current_balance,
            newBalance: existing.current_balance
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    await ensureInitialized();

    try {
        await dbClient.execute({
            sql: 'DELETE FROM accounts WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting account:', error);
        // Pass through trigger/constraint errors
        if (error.message && (error.message.includes('ABORT') || error.message.includes('constraint'))) {
            // Clean up the message if possible, or just send it
            // libSQL might wrap it in 'LibsqlError: ...'
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
