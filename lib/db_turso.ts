import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

export const dbClient = createClient({
    url: process.env.DATABASE_URL || 'file:savings-tracker.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Track initialization state
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Ensure the database is initialized (tables, migrations, default data).
 * Safe to call multiple times — will only run once.
 */
export async function ensureInitialized() {
    if (initialized) return;
    if (initPromise) return initPromise;
    initPromise = initializeDatabase();
    await initPromise;
    initialized = true;
}

async function initializeDatabase() {
    try {
        // Enable foreign keys for cascade deletes
        await dbClient.execute('PRAGMA foreign_keys = ON;');
    } catch (e) {
        // Some remote drivers don't support PRAGMA — that's okay
        console.warn('Could not set PRAGMA foreign_keys:', e);
    }

    const schemaPath = join(process.cwd(), 'lib', 'schema.sql');
    let schema = '';

    try {
        schema = readFileSync(schemaPath, 'utf-8');
    } catch (err) {
        console.error('Could not read schema file', err);
        return;
    }

    await dbClient.executeMultiple(schema);

    // Migration: add owner column if missing
    try {
        const result = await dbClient.execute("PRAGMA table_info(accounts)");
        const cols = result.rows;
        const hasOwner = cols.some(c => c.name === 'owner');

        if (!hasOwner) {
            await dbClient.execute("ALTER TABLE accounts ADD COLUMN owner TEXT NOT NULL DEFAULT 'Joint'");
            console.log('Migration: added owner column');
        }

        const hasProvider = cols.some(c => c.name === 'provider');
        if (!hasProvider) {
            await dbClient.execute("ALTER TABLE accounts ADD COLUMN provider TEXT");
            console.log('Migration: added provider column');
        }
    } catch (e) {
        console.error('Migration check failed', e);
    }

    // Default users
    const userCountRes = await dbClient.execute('SELECT COUNT(*) as count FROM users');
    const userCount = Number(userCountRes.rows[0].count);

    if (userCount === 0) {
        const defaultPw = process.env.DEFAULT_PASSWORD || 'changeme';
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(defaultPw, salt);

        await dbClient.execute({
            sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
            args: ['gary', hash, 'Gary']
        });

        await dbClient.execute({
            sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
            args: ['catherine', hash, 'Catherine']
        });
        console.log('Created default users (password from DEFAULT_PASSWORD env var or "changeme")');
    }

    // Default Pot
    const unallocatedRes = await dbClient.execute("SELECT id FROM savings_pots WHERE name = 'Unallocated'");
    if (unallocatedRes.rows.length === 0) {
        await dbClient.execute({
            sql: "INSERT INTO savings_pots (name, goal_amount, color, icon, priority) VALUES ('Unallocated', NULL, '#64748B', 'savings', 9999)",
            args: []
        });
    }

    console.log('Database initialized successfully');
}
