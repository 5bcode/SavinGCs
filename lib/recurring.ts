import { dbClient as db } from '@/lib/db_turso';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export async function processRecurringTransactions() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
        // 1. Fetch active recurring transactions that are due
        const dueTransactions = await db.execute({
            sql: `SELECT * FROM recurring_transactions WHERE active = 1 AND next_run_date <= ?`,
            args: [todayStr]
        });

        if (dueTransactions.rows.length === 0) {
            return { processed: 0, message: 'No recurring transactions due.' };
        }

        // 2. Process each transaction
        let processedCount = 0;
        for (const rt of dueTransactions.rows) {
            // Use a transaction for safety if possible, or just sequential execute
            // Create the actual transaction
            await db.execute({
                sql: `INSERT INTO transactions (account_id, user_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)`,
                args: [rt.account_id, rt.user_id, rt.amount, rt.description, todayStr]
            });

            // Calculate next run date
            const nextDate = calculateNextRunDate(new Date(rt.next_run_date as string), rt.frequency as Frequency);

            // Update the recurring transaction
            await db.execute({
                sql: `UPDATE recurring_transactions SET last_run_date = ?, next_run_date = ? WHERE id = ?`,
                args: [todayStr, nextDate.toISOString().split('T')[0], rt.id]
            });

            processedCount++;
        }

        return { processed: processedCount, message: `Successfully processed ${processedCount} recurring transactions.` };

    } catch (error) {
        console.error('Error processing recurring transactions:', error);
        return { processed: 0, error: 'Failed to process transactions.' };
    }
}

function calculateNextRunDate(currentDate: Date, frequency: Frequency): Date {
    const nextDate = new Date(currentDate);
    switch (frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    return nextDate;
}
