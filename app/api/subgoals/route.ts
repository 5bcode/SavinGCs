import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { potId, name, targetAmount } = await request.json();

        // Validate
        if (!potId || !name || !targetAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await dbClient.execute({
            sql: `INSERT INTO sub_goals (pot_id, name, target_amount) VALUES (?, ?, ?) RETURNING id`,
            args: [potId, name, parseFloat(targetAmount)]
        });

        const newId = Number(result.lastInsertRowid) || Number(result.rows[0].id);

        return NextResponse.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error creating sub-goal:', error);
        return NextResponse.json({ error: 'Failed to create sub-goal' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await dbClient.execute({
            sql: `DELETE FROM sub_goals WHERE id = ?`,
            args: [id]
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting sub-goal:', error);
        return NextResponse.json({ error: 'Failed to delete sub-goal' }, { status: 500 });
    }
}
