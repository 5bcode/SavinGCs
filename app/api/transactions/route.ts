import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { searchParams } = new URL(request.url);
        const potId = searchParams.get('potId');
        const accountId = searchParams.get('accountId');

        let query = `
            SELECT 
                t.*,
                a.account_name,
                sp.name as pot_name,
                u.display_name as user_name
            FROM transactions t
            LEFT JOIN accounts a ON a.id = t.account_id
            LEFT JOIN savings_pots sp ON sp.id = a.pot_id
            LEFT JOIN users u ON u.id = t.user_id
            WHERE 1=1
        `;

        const args: any[] = [];

        if (potId) {
            query += ` AND a.pot_id = ?`;
            args.push(potId);
        }

        if (accountId) {
            query += ` AND t.account_id = ?`;
            args.push(accountId);
        }

        query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

        const result = await dbClient.execute({ sql: query, args });

        return NextResponse.json({ transactions: result.rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { accountId, userId, amount, description, transactionDate } = await request.json();

        // Balance update is handled automatically by trg_update_balance_after_transaction trigger
        const txResult = await dbClient.execute({
            sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                  VALUES (?, ?, ?, ?, ?) RETURNING id`,
            args: [accountId, userId, amount, description || '', transactionDate]
        });

        let newTxId = Number(txResult.lastInsertRowid);
        if (!newTxId && txResult.rows.length > 0) {
            newTxId = Number(txResult.rows[0].id);
        }

        return NextResponse.json({
            success: true,
            id: newTxId
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
