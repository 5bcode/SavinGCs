import { NextRequest, NextResponse } from 'next/server';
import { dbClient, ensureInitialized } from '@/lib/db_turso';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = getSessionUser(request);
    if (!user) return unauthorizedResponse();

    await ensureInitialized();

    try {
        const { sourceAccountId, targetPotId, targetAccountId, amount } = await request.json();

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
        let finalTargetId: number | string;

        if (targetAccountId) {
            // Verify target account exists and matches targetPotId
            const targetAccountRes = await dbClient.execute({
                sql: 'SELECT * FROM accounts WHERE id = ? AND pot_id = ?',
                args: [targetAccountId, targetPotId]
            });
            const targetAccount = targetAccountRes.rows[0];
            if (!targetAccount) throw new Error('Target account invalid for this pot');

            finalTargetId = targetAccountId;

            await dbClient.execute({
                sql: `UPDATE accounts 
                      SET current_balance = current_balance + ?, last_updated = CURRENT_TIMESTAMP 
                      WHERE id = ?`,
                args: [amount, finalTargetId]
            });
        } else {
            // Fallback: Find by matching details or Create New
            const valName = source.account_name;
            const valType = source.account_type;
            const valOwner = source.owner;

            const existingTargetRes = await dbClient.execute({
                sql: `SELECT * FROM accounts 
                      WHERE pot_id = ? 
                      AND account_name = ? 
                      AND account_type = ? 
                      AND owner = ?`,
                args: [targetPotId, valName, valType, valOwner]
            });

            const existingTarget = existingTargetRes.rows[0];

            if (existingTarget) {
                finalTargetId = String(existingTarget.id);
                await dbClient.execute({
                    sql: `UPDATE accounts 
                          SET current_balance = current_balance + ?, last_updated = CURRENT_TIMESTAMP 
                          WHERE id = ?`,
                    args: [amount, finalTargetId]
                });
            } else {
                const insertRes = await dbClient.execute({
                    sql: `INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, last_updated)
                          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id`,
                    args: [targetPotId, valName, valType, valOwner, amount]
                });
                finalTargetId = String(insertRes.lastInsertRowid || insertRes.rows[0]?.id);
            }
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
