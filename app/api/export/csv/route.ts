import { NextResponse } from 'next/server';
import { dbClient } from '@/lib/db_turso';
import Papa from 'papaparse';

export async function GET() {
    try {
        // Get all pots with their accounts and transactions
        const result = await dbClient.execute(`
            SELECT 
                sp.name as pot_name,
                sp.goal_amount,
                a.*,
                t.transaction_date,
                t.amount as transaction_amount,
                t.description,
                u.display_name as user_name
            FROM savings_pots sp
            LEFT JOIN accounts a ON a.pot_id = sp.id
            LEFT JOIN transactions t ON t.account_id = a.id
            LEFT JOIN users u ON u.id = t.user_id
            ORDER BY sp.priority DESC, a.account_name ASC, t.transaction_date DESC
        `);

        const data = result.rows;

        const csv = Papa.unparse(data, {
            header: true,
            columns: [
                'pot_name',
                'goal_amount',
                'account_name',
                'account_type',
                'current_balance',
                'transaction_date',
                'transaction_amount',
                'description',
                'user_name'
            ]
        });

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="savings-tracker-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
