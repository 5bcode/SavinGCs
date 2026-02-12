import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const potsResult = await dbClient.execute(`
            SELECT 
                sp.*,
                COALESCE(SUM(a.current_balance), 0) as total_balance
            FROM savings_pots sp
            LEFT JOIN accounts a ON a.pot_id = sp.id
            GROUP BY sp.id
            ORDER BY sp.priority DESC, sp.created_at ASC
        `);

        // Fetch sub-goals
        const subGoalsResult = await dbClient.execute(`SELECT * FROM sub_goals ORDER BY id ASC`);
        const subGoals = subGoalsResult.rows;

        const pots = potsResult.rows.map(pot => ({
            ...pot,
            sub_goals: subGoals.filter(sg => sg.pot_id === pot.id)
        }));

        return NextResponse.json({ pots });
    } catch (error) {
        console.error('Error fetching pots:', error);
        return NextResponse.json({ error: 'Failed to fetch pots' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { name, goalAmount, color, icon, priority, goalDate } = await request.json();

        const result = await dbClient.execute({
            sql: `INSERT INTO savings_pots (name, goal_amount, color, icon, priority, goal_date)
                  VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [name, goalAmount || null, color || '#059669', icon || 'piggy-bank', priority || 0, goalDate || null]
        });

        let newPotId = Number(result.lastInsertRowid);
        if (!newPotId && result.rows.length > 0) {
            newPotId = Number(result.rows[0].id);
        }

        return NextResponse.json({
            success: true,
            id: newPotId
        });
    } catch (error) {
        console.error('Error creating pot:', error);
        return NextResponse.json({ error: 'Failed to create pot' }, { status: 500 });
    }
}
