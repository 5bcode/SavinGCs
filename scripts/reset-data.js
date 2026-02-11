const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'savings-tracker.db');
const db = new Database(dbPath);

// Enable foreign keys to ensure cascading works if configured, or manually delete in order
db.pragma('foreign_keys = ON');

console.log('Starting data reset...');

try {
    const deleteTransactions = db.prepare('DELETE FROM transactions');
    const deleteHistory = db.prepare('DELETE FROM balance_history');
    const deleteAccounts = db.prepare('DELETE FROM accounts');
    const deletePots = db.prepare("DELETE FROM savings_pots WHERE name != 'Unallocated'");

    // Execute deletions in correct order
    console.log('Deleting transactions...');
    deleteTransactions.run();

    console.log('Deleting balance history...');
    deleteHistory.run();

    console.log('Deleting accounts...');
    deleteAccounts.run();

    console.log("Deleting savings pots (except 'Unallocated')...");
    deletePots.run();

    // Reset auto-increment counters for cleanliness (optional but nice)
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'balance_history', 'accounts', 'savings_pots')").run();

    console.log('✅ Data reset complete. All accounts and custom pots removed.');
} catch (error) {
    console.error('❌ Error resetting data:', error);
    process.exit(1);
}
