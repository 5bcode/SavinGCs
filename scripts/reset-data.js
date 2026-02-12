const { createClient } = require('@libsql/client');
const path = require('path');

const dbPath = path.join(process.cwd(), 'savings-tracker.db');
const client = createClient({
    url: process.env.DATABASE_URL || `file:${dbPath}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function reset() {
    console.log('Starting data reset...');

    try {
        // Enable foreign keys
        await client.execute('PRAGMA foreign_keys = ON');

        console.log('Deleting transactions...');
        await client.execute('DELETE FROM transactions');

        console.log('Deleting balance history...');
        await client.execute('DELETE FROM balance_history');

        console.log('Deleting accounts...');
        await client.execute('DELETE FROM accounts');

        console.log("Deleting savings pots (except 'Unallocated')...");
        await client.execute("DELETE FROM savings_pots WHERE name != 'Unallocated'");

        // Reset auto-increment counters
        await client.execute("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'balance_history', 'accounts', 'savings_pots')");

        console.log('✅ Data reset complete. All accounts and custom pots removed.');
    } catch (error) {
        console.error('❌ Error resetting data:', error);
        process.exit(1);
    }
}

reset();
