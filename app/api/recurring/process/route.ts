
import { NextRequest, NextResponse } from 'next/server';
import { processRecurringTransactions } from '@/lib/recurring';

export async function POST(req: NextRequest) {
    try {
        const result = await processRecurringTransactions();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Recurring process error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
