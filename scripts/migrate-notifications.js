// Migration script for adding notifications tables
// Run with: node scripts/migrate-notifications.js

const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'file:savings-tracker.db'
});

async function migrate() {
    console.log('🚀 Running notification migration...');

    try {
        // Create milestones table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS milestones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pot_id INTEGER NOT NULL,
                milestone_type TEXT NOT NULL,
                milestone_value REAL NOT NULL,
                achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE,
                UNIQUE(pot_id, milestone_type)
            )
        `);
        console.log('✅ Created milestones table');

        // Create notifications table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                pot_id INTEGER,
                milestone_type TEXT,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (pot_id) REFERENCES savings_pots (id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created notifications table');

        // Create push_subscriptions table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                endpoint TEXT NOT NULL UNIQUE,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created push_subscriptions table');

        // Create indexes
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_milestones_pot ON milestones (pot_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id)`);
        console.log('✅ Created indexes');

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
