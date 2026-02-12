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
        await dbClient.execute({
            sql: 'DELETE FROM transactions WHERE id = ?',
            args: [id]
        });

        // Trigger (trg_reverse_balance_on_delete) handles balance update automatically

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
