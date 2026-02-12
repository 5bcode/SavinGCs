import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    await ensureInitialized();

    try {
        const txRes = await dbClient.execute({
            sql: 'SELECT account_id, amount FROM transactions WHERE id = ?',
            args: [id]
        });
        const transaction = txRes.rows[0];

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const accountId = transaction.account_id as number;
        const amount = transaction.amount as number;

        await dbClient.execute({
            sql: 'DELETE FROM transactions WHERE id = ?',
            args: [id]
        });

        await dbClient.execute({
            sql: `UPDATE accounts 
                  SET current_balance = current_balance - ?, last_updated = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [amount, accountId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}
