import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const result = await dbClient.execute(`
            SELECT a.*, sp.name as pot_name, sp.color as pot_color
            FROM accounts a
            JOIN savings_pots sp ON sp.id = a.pot_id
            ORDER BY sp.priority DESC, a.account_name ASC
        `);

        return NextResponse.json({ accounts: result.rows });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { potId, accountName, accountType, owner, currentBalance, startingBalanceDate, provider } = await request.json();

        const result = await dbClient.execute({
            sql: `INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, provider)
                  VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [potId, accountName, accountType, owner || 'Joint', currentBalance || 0, provider || '']
        });

        let newId = Number(result.lastInsertRowid);
        if (!newId && result.rows.length > 0) {
            newId = Number(result.rows[0].id);
        }

        // Record starting balance in history
        if (currentBalance && startingBalanceDate) {
            await dbClient.execute({
                sql: `INSERT INTO balance_history (account_id, balance, recorded_date)
                      VALUES (?, ?, ?)`,
                args: [newId, currentBalance, startingBalanceDate]
            });
        }

        return NextResponse.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
