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
        // Verify transaction exists before deleting
        const txRes = await dbClient.execute({
            sql: 'SELECT id FROM transactions WHERE id = ?',
            args: [id]
        });

        if (!txRes.rows[0]) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Balance reversal is handled automatically by trg_reverse_balance_on_delete trigger
        await dbClient.execute({
            sql: 'DELETE FROM transactions WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}
