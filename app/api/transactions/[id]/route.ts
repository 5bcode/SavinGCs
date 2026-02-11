import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        // Get transaction details before deleting to reverse balance
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

        // Manually perform transaction logic: Delete then Update
        // Or Update then Delete. If one fails, we have inconsistency. Turso HTTP doesn't allow easy rollback without interactive tx.
        // We proceed with best effort sequential.

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
