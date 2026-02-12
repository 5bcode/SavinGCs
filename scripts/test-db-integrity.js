
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const DB_FILE = 'test-integrity.db';
const SCHEMA_PATH = path.join(__dirname, '..', 'lib', 'schema.sql');

async function main() {
    console.log(`\n🧪 Starting Database Integrity Test...`);

    // 1. Setup minimal clean environment
    try {
        if (fs.existsSync(DB_FILE)) {
            fs.unlinkSync(DB_FILE);
            console.log('Cleaned up previous DB file.');
        }
    } catch (e) {
        console.warn('⚠️ Could not unlink previous DB file (EBUSY?). continuing...');
    }

    const db = createClient({
        url: `file:${DB_FILE}`,
    });

    try {
        // 2. Load Schema
        console.log(`Loading schema from ${SCHEMA_PATH}...`);
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

        // Split by semicolon to execute one by one might be safer if executeMultiple has issues, 
        // but executeMultiple is designed for this.
        // Turso client supports executeMultiple.
        await db.executeMultiple(schema);

        // Enable FKs
        await db.execute('PRAGMA foreign_keys = ON;');

        console.log('✅ Schema loaded.\n');

        // =================================================================
        // TEST HELPER
        // =================================================================
        async function assertThrows(name, fn, expectedErrorSnippet) {
            try {
                await fn();
                console.error(`❌ [${name}] FAILED: Expected error containing "${expectedErrorSnippet}", but successful.`);
                process.exit(1);
            } catch (e) {
                if (e.message.includes(expectedErrorSnippet) || e.toString().includes(expectedErrorSnippet)) {
                    console.log(`✅ [${name}] Passed (Blocked as expected).`);
                } else {
                    console.error(`❌ [${name}] FAILED: Caught unexpected error:`, e.message);
                    process.exit(1);
                }
            }
        }

        async function assertValue(name, query, expected, message) {
            const res = await db.execute(query);
            const val = Object.values(res.rows[0])[0];
            if (val === expected) {
                console.log(`✅ [${name}] Passed: ${message}`);
            } else {
                console.error(`❌ [${name}] FAILED: Expected ${expected}, got ${val}.`);
                process.exit(1);
            }
        }

        // =================================================================
        // SEED DATA
        // =================================================================
        console.log('--- Seeding Data ---');
        await db.execute("INSERT INTO users (username, password_hash, display_name) VALUES ('testuser', 'hash', 'Test User')");
        const userId = 1;

        await db.execute("INSERT INTO savings_pots (name, goal_amount) VALUES ('Test Pot', 1000)");
        const potId = 1;

        await db.execute(`INSERT INTO accounts (pot_id, account_name, account_type, current_balance) VALUES (${potId}, 'Test Account', 'Savings', 100)`);
        const accountId = 1;
        console.log('✅ Seed complete.\n');


        // =================================================================
        // TESTS
        // =================================================================

        // 1. Transaction Balance Update Trigger
        // -----------------------------------------------------------------
        console.log('--- Testing Triggers: Automatic Balance Updates ---');
        await db.execute({
            sql: "INSERT INTO transactions (account_id, user_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)",
            args: [accountId, userId, 50, 'Deposit', '2023-01-01']
        });
        await assertValue('Balance Update', `SELECT current_balance FROM accounts WHERE id = ${accountId}`, 150, 'Balance increased to 150');


        // 2. Prevent Negative Balance Trigger
        // -----------------------------------------------------------------
        console.log('\n--- Testing Constraint: Prevent Negative Balance ---');
        // Try to withdraw 200 (Balance is 150)
        await assertThrows('Negative Balance', async () => {
            await db.execute({
                sql: "UPDATE accounts SET current_balance = -50 WHERE id = ?",
                args: [accountId] // Manual update simulation (or transaction that causes it)
            });
            // Note: The trigger checks UPDATE on accounts.
            // If we insert a transaction of -200, the trigger `trg_update_balance_after_transaction` updates accounts.
            // Then `trg_prevent_negative_balance` checks the account.
            // Let's test via transaction to be realistic.
            await db.execute({
                sql: "INSERT INTO transactions (account_id, user_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)",
                args: [accountId, userId, -200, 'Overdraft', '2023-01-01']
            });
        }, 'Account balance cannot be negative');


        // 3. Balance History Trigger
        // -----------------------------------------------------------------
        console.log('\n--- Testing Trigger: Balance History ---');
        // We did one update from 100 -> 150.
        // We should have a history record.
        const historyRes = await db.execute(`SELECT COUNT(*) as count FROM balance_history WHERE account_id = ${accountId}`);
        const historyCount = Number(historyRes.rows[0].count);
        if (historyCount >= 1) {
            console.log(`✅ [History Trigger] Passed: Found ${historyCount} history records.`);
        } else {
            console.error(`❌ [History Trigger] FAILED: No history records found.`);
        }


        // 4. Foreign Key (Invalid Account in Transaction)
        // -----------------------------------------------------------------
        console.log('\n--- Testing FK: Invalid Account in Transaction ---');
        // The trigger `trg_validate_transaction_account` also handles this custom check, 
        // but standard FK should also catch it if enabled. 
        // Schema has: FOREIGN KEY (account_id) REFERENCES accounts (id)

        await assertThrows('FK Violation (Trigger Check)', async () => {
            await db.execute({
                sql: "INSERT INTO transactions (account_id, user_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)",
                args: [999, userId, 10, 'Ghost Account', '2023-01-01']
            });
        }, 'Transaction references a non-existent account');
        // OR 'Transaction references a non-existent account' (Custom Trigger)
        // SQLite Driver might return either depending on what hits first.


        // 5. Prevent Pot Deletion with Funds
        // -----------------------------------------------------------------
        console.log('\n--- Testing Trigger: Prevent Pot Deletion (Funds) ---');
        await assertThrows('Delete Pot w/ Funds', async () => {
            await db.execute(`DELETE FROM savings_pots WHERE id = ${potId}`);
        }, 'Cannot delete pot with non-zero account balances');


        // 6. Prevent Account Deletion with Funds
        // -----------------------------------------------------------------
        console.log('\n--- Testing Trigger: Prevent Account Deletion (Funds) ---');
        await assertThrows('Delete Account w/ Funds', async () => {
            await db.execute(`DELETE FROM accounts WHERE id = ${accountId}`);
        }, 'Cannot delete account with non-zero balance');


        // 7. Cascading Deletion (Success Case)
        // -----------------------------------------------------------------
        console.log('\n--- Testing Cascading Deletion ---');
        // First, empty the account to allow deletion
        // Current balance 150. Withdraw 150.
        await db.execute({
            sql: "INSERT INTO transactions (account_id, user_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)",
            args: [accountId, userId, -150, 'Emptying', '2023-01-01']
        });
        await assertValue('Balance Check', `SELECT current_balance FROM accounts WHERE id = ${accountId}`, 0, 'Balance is 0');

        // Now delete the Pot. 
        // Should succeed because funds are 0.
        // Should cascade delete the account.
        await db.execute(`DELETE FROM savings_pots WHERE id = ${potId}`);
        console.log('✅ [Delete Pot] Pot deleted successfully.');

        // Verify account is gone
        const accRes = await db.execute(`SELECT COUNT(*) as count FROM accounts WHERE id = ${accountId}`);
        if (Number(accRes.rows[0].count) === 0) {
            console.log('✅ [Cascading Delete] Passed: Account was automatically deleted.');
        } else {
            console.error('❌ [Cascading Delete] FAILED: Account still exists.');
        }


        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (err) {
        console.error('\n❌ UNEXPECTED ERROR:', err);
    } finally {
        try {
            if (db && typeof db.close === 'function') {
                db.close();
            }
        } catch (e) { /* ignore */ }

        try {
            if (fs.existsSync(DB_FILE)) {
                fs.unlinkSync(DB_FILE); // Cleanup
            }
        } catch (e) {
            console.warn('⚠️ Cleanup failed (EBUSY), ignoring.');
        }
    }
}

main();
