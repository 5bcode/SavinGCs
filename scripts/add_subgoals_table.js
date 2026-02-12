const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let val = parts.slice(1).join('=').trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                env[key] = val;
            }
        });
        return env;
    } catch (e) {
        console.warn('Could not load .env.local', e);
        return {};
    }
}

const env = getEnv();
const url = env.DATABASE_URL;
const authToken = env.DATABASE_AUTH_TOKEN;

if (!url) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function migrate() {
    try {
        console.log('Creating sub_goals table...');

        await client.execute(`
            CREATE TABLE IF NOT EXISTS sub_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pot_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                target_amount REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pot_id) REFERENCES savings_pots(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created sub_goals table.');

    } catch (error) {
        console.error('❌ Migration error:', error);
    }
}

migrate();
