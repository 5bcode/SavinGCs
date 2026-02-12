-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Savings pots (categories for saving goals)
CREATE TABLE IF NOT EXISTS savings_pots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  goal_amount REAL,
  color TEXT DEFAULT '#059669',
  icon TEXT DEFAULT 'piggy-bank',
  priority INTEGER DEFAULT 0,
  goal_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual accounts within pots
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pot_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'Joint',
  current_balance REAL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pot_id) REFERENCES savings_pots(id) ON DELETE CASCADE
);

-- Transaction ledger
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Balance history snapshots (for tracking changes over time / graphs)
CREATE TABLE IF NOT EXISTS balance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  balance REAL NOT NULL,
  recorded_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_pot ON accounts(pot_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_balance_history_account ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_date ON balance_history(recorded_date DESC);

