import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function GET() {
    try {
        const result = await dbClient.execute(`
            SELECT 
                a.*,
                sp.name as pot_name,
                sp.color as pot_color
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
    try {
        const body = await request.json();
        // Handle both potential JSON structures if body is wrapped or flat
        const { pot_id, account_name, account_type, current_balance, owner, starting_balance_date } = body;

        // Map camelCase if coming from frontend with inconsistent naming, or snake_case
        // The frontend currently sends: potId, accountName, accountType, currentBalance, owner, startingBalanceDate
        // Let's support both just in case.
        const potId = pot_id || body.potId;
        const accountName = account_name || body.accountName;
        const accountType = account_type || body.accountType;
        const currentBalance = current_balance || body.currentBalance || 0;
        const ownerName = owner || body.owner || 'Joint';
        const startingDate = starting_balance_date || body.startingBalanceDate || new Date().toISOString().split('T')[0];

        const balance = parseFloat(currentBalance);

        // 1. Get User ID based on owner name (Manual lookup)
        let userId = 1;
        const userRes = await dbClient.execute({
            sql: 'SELECT id FROM users WHERE display_name = ?',
            args: [ownerName]
        });

        if (userRes.rows.length > 0) {
            userId = Number(userRes.rows[0].id);
        }

        // 2. Insert Account
        const insertAccountRes = await dbClient.execute({
            sql: `INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, last_updated)
                  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id`,
            args: [potId, accountName, accountType, ownerName, balance]
        });

        // Some drivers return lastInsertRowid, others return rows with RETURNING.
        // Turso/LibSQL via http often supports RETURNING id.
        let newAccountId = Number(insertAccountRes.lastInsertRowid);
        if (!newAccountId && insertAccountRes.rows.length > 0) {
            newAccountId = Number(insertAccountRes.rows[0].id);
        }

        // 3. Insert Transaction
        if (balance !== 0 || body.startingBalanceDate) {
            await dbClient.execute({
                sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                      VALUES (?, ?, ?, 'Opening Balance', ?)`,
                args: [newAccountId, userId, balance, startingDate]
            });
        }

        return NextResponse.json({
            success: true,
            id: newAccountId
        });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
