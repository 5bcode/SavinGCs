import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const potId = searchParams.get('potId');
        const accountId = searchParams.get('accountId');

        // Note: Turso driver uses ? for args.
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
            // If accountId is provided, fix potId filter if needed or just append
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
    try {
        const { accountId, userId, amount, description, transactionDate } = await request.json();

        // 1. Insert Transaction
        const txResult = await dbClient.execute({
            sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                  VALUES (?, ?, ?, ?, ?) RETURNING id`,
            args: [accountId, userId, amount, description || '', transactionDate]
        });

        // 2. Update Account Balance
        await dbClient.execute({
            sql: `UPDATE accounts 
                  SET current_balance = current_balance + ?, last_updated = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [amount, accountId]
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
