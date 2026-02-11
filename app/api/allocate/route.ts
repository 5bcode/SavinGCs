import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function POST(request: NextRequest) {
    try {
        const { sourceAccountId, targetPotId, amount } = await request.json();

        if (!sourceAccountId || !targetPotId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 1. Get Source Account
        const sourceRes = await dbClient.execute({
            sql: 'SELECT * FROM accounts WHERE id = ?',
            args: [sourceAccountId]
        });

        const source = sourceRes.rows[0];
        if (!source) throw new Error('Source account not found');

        const currentBalance = Number(source.current_balance);
        if (currentBalance < amount) throw new Error('Insufficient funds in source account');

        // 2. Find or Create Target Account
        const targetAccountRes = await dbClient.execute({
            sql: `SELECT * FROM accounts 
                  WHERE pot_id = ? 
                  AND account_name = ? 
                  AND account_type = ? 
                  AND owner = ?`,
            args: [targetPotId, source.account_name, source.account_type, source.owner]
        });

        const targetAccount = targetAccountRes.rows[0];
        let targetAccountId: number | string;

        // Perform updates. Ideally this should be a transaction.
        // With Turso HTTP, we can use dbClient.batch() for some atomicity if available, 
        // but dependent queries (needing targetAccountId) make batching hard without interactive tx.

        if (targetAccount) {
            targetAccountId = String(targetAccount.id);
            await dbClient.execute({
                sql: `UPDATE accounts 
                      SET current_balance = current_balance + ?, last_updated = CURRENT_TIMESTAMP 
                      WHERE id = ?`,
                args: [amount, targetAccountId]
            });
        } else {
            const insertRes = await dbClient.execute({
                sql: `INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, last_updated)
                      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id`,
                args: [targetPotId, source.account_name, source.account_type, source.owner, amount]
            });

            targetAccountId = String(insertRes.lastInsertRowid || (insertRes.rows[0]?.id));
        }

        // 3. Update Source Account
        await dbClient.execute({
            sql: `UPDATE accounts 
                  SET current_balance = current_balance - ?, last_updated = CURRENT_TIMESTAMP 
                  WHERE id = ?`,
            args: [amount, sourceAccountId]
        });

        return NextResponse.json({ success: true, result: { sourceId: sourceAccountId, targetId: targetAccountId } });
    } catch (error: any) {
        console.error('Allocation error:', error);
        return NextResponse.json({ error: error.message || 'Allocation failed' }, { status: 500 });
    }
}
