const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'savings-tracker.db');
const url = process.env.TURSO_DATABASE_URL || `file:${dbPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function migrate() {
    console.log('Starting migration...');

    const sql = `
  -- Recurring Transactions Table
  CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
      next_run_date DATE NOT NULL,
      active BOOLEAN DEFAULT 1,
      last_run_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Index for performance
  CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_transactions (next_run_date, active);
  `;

    try {
        await client.executeMultiple(sql);
        console.log('Migration successful: recurring_transactions table created.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.close();
    }
}

migrate();
