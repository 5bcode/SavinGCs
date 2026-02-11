import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const { name, goalAmount, color, icon, priority } = await request.json();

        // Check if pot exists first? Not strictly necessary for update but good practice.
        // Turso UPDATE returns rowsAffected.

        await dbClient.execute({
            sql: `UPDATE savings_pots 
                  SET name = ?, goal_amount = ?, color = ?, icon = ?, priority = ?
                  WHERE id = ?`,
            args: [name, goalAmount, color, icon, priority, id]
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
    const { id } = await context.params;

    try {
        // Prevent deleting the Unallocated pot
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
