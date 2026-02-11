import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // In Next.js 13+ app dir, params is a Promise
) {
    // Await params first
    const { id } = await context.params;

    try {
        const accountRes = await dbClient.execute({
            sql: `SELECT a.*, sp.name as pot_name, sp.color as pot_color
                  FROM accounts a
                  JOIN savings_pots sp ON sp.id = a.pot_id
                  WHERE a.id = ?`,
            args: [id]
        });

        const account = accountRes.rows[0];

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Get balance history for this account
        const historyRes = await dbClient.execute({
            sql: `SELECT balance, recorded_date, created_at
                  FROM balance_history
                  WHERE account_id = ?
                  ORDER BY recorded_date DESC, created_at DESC
                  LIMIT 50`,
            args: [id]
        });

        // Get transaction count for integrity warning
        const txCountRes = await dbClient.execute({
            sql: 'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
            args: [id]
        });
        const txCount = Number(txCountRes.rows[0].count);

        return NextResponse.json({ account, history: historyRes.rows, transactionCount: txCount });
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const { accountName, accountType, owner, currentBalance } = await request.json();

        // Get existing account for comparison
        const existingRes = await dbClient.execute({
            sql: 'SELECT * FROM accounts WHERE id = ?',
            args: [id]
        });
        const existing = existingRes.rows[0];

        if (!existing) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Handle potentially missing values by retaining existing
        // Note: In SQL args, undefined becomes null usually, so we default manually.
        const newName = accountName ?? existing.account_name;
        const newType = accountType ?? existing.account_type;
        const newOwner = owner ?? existing.owner;
        const newBalance = currentBalance ?? existing.current_balance;

        // Perform updates sequentially
        await dbClient.execute({
            sql: `UPDATE accounts 
                  SET account_name = ?, account_type = ?, owner = ?, current_balance = ?, last_updated = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [newName, newType, newOwner, newBalance, id]
        });

        // If balance changed, log to balance_history
        // Check inequality. existing.current_balance might be number or string depending on driver.
        if (currentBalance !== undefined && Number(currentBalance) !== Number(existing.current_balance)) {
            const today = new Date().toISOString().split('T')[0];
            await dbClient.execute({
                sql: `INSERT INTO balance_history (account_id, balance, recorded_date)
                      VALUES (?, ?, ?)`,
                args: [id, newBalance, today]
            });
        }

        return NextResponse.json({
            success: true,
            balanceChanged: currentBalance !== undefined && Number(currentBalance) !== Number(existing.current_balance),
            previousBalance: existing.current_balance,
            newBalance: newBalance
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        // CASCADE will handle deleting related transactions and balance_history if DB supports/configured it.
        // Turso supports foreign key constraints if enabled using PRAGMA foreign_keys = ON;
        // This is enabled in init, but for good measure we might want to manually delete related items if paranoid,
        // but let's trust FK cascade for now.

        await dbClient.execute({
            sql: 'DELETE FROM accounts WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
