import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    await ensureInitialized();

    try {
        const { name, goalAmount, color, icon, priority, goalDate } = await request.json();

        await dbClient.execute({
            sql: `UPDATE savings_pots 
                  SET name = ?, goal_amount = ?, color = ?, icon = ?, priority = ?, goal_date = ?
                  WHERE id = ?`,
            args: [name, goalAmount, color, icon, priority, goalDate || null, id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating pot:', error);
        return NextResponse.json({ error: 'Failed to update pot' }, { status: 500 });
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
        const potRes = await dbClient.execute({
            sql: 'SELECT name FROM savings_pots WHERE id = ?',
            args: [id]
        });
        const pot = potRes.rows[0];

        if (pot?.name === 'Unallocated') {
            return NextResponse.json({ error: 'Cannot delete the Unallocated pot' }, { status: 400 });
        }

        await dbClient.execute({
            sql: 'DELETE FROM savings_pots WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting pot:', error);
        return NextResponse.json({ error: 'Failed to delete pot' }, { status: 500 });
    }
}
