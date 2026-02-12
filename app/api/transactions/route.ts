import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { checkAndCreateMilestones } from '@/lib/notifications';

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

        // Get current account and pot info BEFORE transaction
        const accountResult = await dbClient.execute({
            sql: `SELECT a.*, sp.goal_amount, sp.name as pot_name 
                  FROM accounts a 
                  JOIN savings_pots sp ON sp.id = a.pot_id 
                  WHERE a.id = ?`,
            args: [accountId]
        });
        const account = accountResult.rows[0];

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

        // Check for milestones (only for positive amounts/deposits)
        if (amount > 0) {
            // Get updated balance after transaction
            const updatedAccountResult = await dbClient.execute({
                sql: `SELECT current_balance FROM accounts WHERE id = ?`,
                args: [accountId]
            });
            const updatedBalance = Number(updatedAccountResult.rows[0]?.current_balance || 0);

            // Check and create milestones
            const notifications = await checkAndCreateMilestones(
                Number(account.pot_id),
                updatedBalance,
                account.goal_amount ? Number(account.goal_amount) : null,
                userId
            );

            return NextResponse.json({
                success: true,
                id: newTxId,
                notifications: notifications
            });
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
