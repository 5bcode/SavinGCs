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

-- Sub-goals for breaking down large pot goals
CREATE TABLE IF NOT EXISTS sub_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pot_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE
);

-- Individual accounts within pots
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pot_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT 'Joint',
    provider TEXT,
    current_balance REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE
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
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Balance history snapshots (for tracking changes over time / graphs)
CREATE TABLE IF NOT EXISTS balance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    balance REAL NOT NULL,
    recorded_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

-- Recurring Transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    next_run_date DATE NOT NULL,
    last_run_date DATE,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_pot ON accounts (pot_id);

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions (account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_balance_history_account ON balance_history (account_id);

CREATE INDEX IF NOT EXISTS idx_balance_history_date ON balance_history (recorded_date DESC);

-- ============================================================
-- MILESTONES & NOTIFICATIONS
-- ============================================================

-- Milestones achieved for savings pots
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pot_id INTEGER NOT NULL,
    milestone_type TEXT NOT NULL, -- '25%', '50%', '75%', '100%', 'GOAL_REACHED'
    milestone_value REAL NOT NULL,
    achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE,
    UNIQUE (pot_id, milestone_type)
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'milestone', 'system', 'alert'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    pot_id INTEGER,
    milestone_type TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE
);

-- Web Push API subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_milestones_pot ON milestones (pot_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);

-- ============================================================
-- TRIGGERS — Data Integrity & Automation
-- ============================================================

-- 1. Auto-update account balance when a transaction is inserted
--    (removes the need for manual UPDATE in API routes)
CREATE TRIGGER IF NOT EXISTS trg_update_balance_after_transaction
AFTER INSERT ON transactions
FOR EACH ROW BEGIN
    UPDATE accounts
    SET current_balance = current_balance + NEW.amount,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;
END;

-- 2. Reverse balance change when a transaction is deleted
CREATE TRIGGER IF NOT EXISTS trg_reverse_balance_on_delete
AFTER DELETE ON transactions
FOR EACH ROW BEGIN
    UPDATE accounts
    SET current_balance = current_balance - OLD.amount,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = OLD.account_id;
END;

-- 3. Prevent negative account balances
CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_balance
BEFORE UPDATE ON accounts
FOR EACH ROW
WHEN NEW.current_balance < 0
BEGIN
    SELECT RAISE(ABORT, 'Account balance cannot be negative');
END;

-- 4. Auto-record balance history snapshots when balance changes
CREATE TRIGGER IF NOT EXISTS trg_record_balance_history
AFTER UPDATE OF current_balance ON accounts
FOR EACH ROW
WHEN OLD.current_balance != NEW.current_balance
BEGIN
    INSERT INTO balance_history (account_id, balance, recorded_date)
    VALUES (NEW.id, NEW.current_balance, DATE('now'));
END;

-- 5. Auto-set last_updated timestamp on meaningful account changes
CREATE TRIGGER IF NOT EXISTS trg_auto_update_timestamp
AFTER UPDATE ON accounts
FOR EACH ROW
WHEN (OLD.account_name != NEW.account_name
   OR OLD.account_type != NEW.account_type
   OR OLD.owner != NEW.owner)
  AND OLD.current_balance = NEW.current_balance
BEGIN
    UPDATE accounts
    SET last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 6. Prevent deleting a pot that still has funded accounts
CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_pot_with_funds
BEFORE DELETE ON savings_pots
FOR EACH ROW
WHEN (SELECT COALESCE(SUM(current_balance), 0) FROM accounts WHERE pot_id = OLD.id) > 0
BEGIN
    SELECT RAISE(ABORT, 'Cannot delete pot with non-zero account balances. Move funds first.');
END;

-- 7. Prevent deleting an account with a non-zero balance
CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_account_with_funds
BEFORE DELETE ON accounts
FOR EACH ROW
WHEN OLD.current_balance != 0
BEGIN
    SELECT RAISE(ABORT, 'Cannot delete account with non-zero balance. Withdraw or transfer funds first.');
END;

-- 8. Validate that a transaction references an existing account
CREATE TRIGGER IF NOT EXISTS trg_validate_transaction_account
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN (SELECT COUNT(*) FROM accounts WHERE id = NEW.account_id) = 0
BEGIN
    SELECT RAISE(ABORT, 'Transaction references a non-existent account');
END;