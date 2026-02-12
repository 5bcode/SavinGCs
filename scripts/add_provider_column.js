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
                // Remove quotes
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
        console.log('Checking for provider column...');

        // This is a bit specific to SQLite/LibSQL
        const result = await client.execute("PRAGMA table_info(accounts)");
        const hasProvider = result.rows.some(row => row.name === 'provider');

        if (!hasProvider) {
            console.log('Adding provider column...');
            await client.execute("ALTER TABLE accounts ADD COLUMN provider TEXT");
            console.log('✅ Added provider column to accounts table.');
        } else {
            console.log('ℹ️ Provider column already exists.');
        }

    } catch (error) {
        console.error('❌ Migration error:', error);
    }
}

migrate();
