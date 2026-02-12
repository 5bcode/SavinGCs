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

            // No direct update needed, using transactions now
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
                // No direct update needed
            } else {
                const insertRes = await dbClient.execute({
                    sql: `INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, last_updated)
                          VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP) RETURNING id`,
                    args: [targetPotId, valName, valType, valOwner]
                });
                finalTargetId = String(insertRes.lastInsertRowid || insertRes.rows[0]?.id);
            }
        }

        // Fetch final Target Account Name for description
        const finalTargetRes = await dbClient.execute({
            sql: 'SELECT account_name FROM accounts WHERE id = ?',
            args: [finalTargetId]
        });
        const targetAccount = finalTargetRes.rows[0];

        // 3. Create Transactions (Triggers will handle balance updates)
        const today = new Date().toISOString().split('T')[0];

        // Transaction A: Debit Source
        await dbClient.execute({
            sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                sourceAccountId,
                user.id,
                -amount,
                `Transfer to ${targetAccount?.account_name || 'Target Account'} (ID: ${finalTargetId})`,
                today
            ]
        });

        // Transaction B: Credit Target
        await dbClient.execute({
            sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                finalTargetId,
                user.id,
                amount,
                `Transfer from ${source.account_name} (ID: ${sourceAccountId})`,
                today
            ]
        });

        // Trigger milestone check for Target Account (since it received funds)
        // We can do this by calling the internal logic or just rely on the user navigating/refreshing.
        // For robustness, could call checkAndCreateMilestones here, but let's stick to the transaction trigger pattern for now.
        // Actually, api/transactions POST does checking. We are bypassing that endpoint but inserting directly.
        // Ideally we should check milestones here too or the user won't get the notification immediately.
        // Let's add basic milestone check for the target pot.

        const updatedPotResult = await dbClient.execute({
            sql: `SELECT SUM(current_balance) as total FROM accounts WHERE pot_id = ?`,
            args: [targetPotId]
        });
        // Note: The trigger might not have fired yet if we are in same transaction? 
        // LibSQL/SQLite triggers fire immediately per statement. So balance IS updated.
        const updatedPotBalance = Number(updatedPotResult.rows[0]?.total || 0);

        // Fetch pot goal
        const potRes = await dbClient.execute({
            sql: 'SELECT goal_amount FROM savings_pots WHERE id = ?',
            args: [targetPotId]
        });
        const goalAmount = potRes.rows[0]?.goal_amount;

        const { checkAndCreateMilestones } = await import('@/lib/notifications');
        await checkAndCreateMilestones(
            Number(targetPotId),
            updatedPotBalance,
            goalAmount ? Number(goalAmount) : null,
            user.id
        );

        return NextResponse.json({ success: true, result: { sourceId: sourceAccountId, targetId: finalTargetId } });
    } catch (error: any) {
        console.error('Allocation error:', error);
        return NextResponse.json({ error: error.message || 'Allocation failed' }, { status: 500 });
    }
}
