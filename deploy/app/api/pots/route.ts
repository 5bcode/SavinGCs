import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function GET() {
    try {
        const result = await dbClient.execute(`
            SELECT 
                sp.*,
                COALESCE(SUM(a.current_balance), 0) as total_balance
            FROM savings_pots sp
            LEFT JOIN accounts a ON a.pot_id = sp.id
            GROUP BY sp.id
            ORDER BY sp.priority DESC, sp.created_at ASC
        `);

        return NextResponse.json({ pots: result.rows });
    } catch (error) {
        console.error('Error fetching pots:', error);
        return NextResponse.json({ error: 'Failed to fetch pots' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, goalAmount, color, icon, priority } = await request.json();

        const result = await dbClient.execute({
            sql: `INSERT INTO savings_pots (name, goal_amount, color, icon, priority)
                  VALUES (?, ?, ?, ?, ?) RETURNING id`,
            args: [name, goalAmount || null, color || '#059669', icon || 'piggy-bank', priority || 0]
        });

        // Some drivers return lastInsertRowid, others return rows with RETURNING.
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
