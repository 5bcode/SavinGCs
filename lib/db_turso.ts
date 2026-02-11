import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

// Determine if we are using a remote Turso/LibSQL database or a local SQLite file
const isRemote = process.env.DATABASE_URL?.includes('libsql') || process.env.DATABASE_URL?.includes('turso');

// We need an abstraction layer because better-sqlite3 and @libsql/client have different APIs
// Ideally we would use an ORM like Drizzle or Prisma, but to keep changes minimal we will wrap the client.
// However, rewriting the entire app to use a new driver wrapper is risky.
// A better approach for this migration without ORM:
// maintain the better-sqlite3 instance for local dev if desired, but if remote, we need a compatible interface.

// Since the app uses synchronous calls (.prepare().run(), .get(), .all()), and @libsql/client is async,
// we have a significant refactoring challenge if we switch to the remote client directly.
// options:
// 1. Refactor all DB calls to be async (Best for long term, but touches many files)
// 2. Use 'better-sqlite3' for everything if possible? (No, better-sqlite3 doesn't support http/ws remote protocols of Turso)
// 3. Setup a local replica using embedded sync? (Turso supports embedded replicas in Node)

// Strategy:
// To support Turso effectively in a serverless/edge environment, we should use the http client.
// But that requires async/await.
// ALL our API routes currently use synchronous db calls.
// We MUST refactor the DB layer to be async to support Turso / Neon (via serverless drivers).

// Let's create a Database Adapter interface.

// ... actually, for a "quick" migration to cloud run with a persistent disk, we could stick to better-sqlite3.
// But the user specifically asked for "Turso/Neon".

// Let's implement a singleton client that exposes the necessary methods.
// We will have to update the API routes to await the results.

export const dbClient = createClient({
    url: process.env.DATABASE_URL || 'file:savings-tracker.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Helper to run migrations / init
export async function initializeDatabase() {
    // For remote DBs, we might not want to run this on every cold start if it's slow, 
    // but for safety we'll ensure tables exist.

    // We can iterate split statements or just run the raw SQL if the driver supports multiple statements.
    // @libsql/client executeMultiple is useful here.

    const schemaPath = join(process.cwd(), 'lib', 'schema.sql');
    let schema = '';

    try {
        schema = readFileSync(schemaPath, 'utf-8');
    } catch (err) {
        console.error('Could not read schema file', err);
        return;
    }

    // Split schema by semi-colon to run individually if needed, or try batch
    await dbClient.executeMultiple(schema);

    // Migration: add owner column
    // We need to check columns.
    try {
        const result = await dbClient.execute("PRAGMA table_info(accounts)");
        const cols = result.rows;
        const hasOwner = cols.some(c => c.name === 'owner');

        if (!hasOwner) {
            await dbClient.execute("ALTER TABLE accounts ADD COLUMN owner TEXT NOT NULL DEFAULT 'Joint'");
            console.log('Migration: added owner column');
        }
    } catch (e) {
        console.error('Migration check failed', e);
    }

    // Default users
    const userCountRes = await dbClient.execute('SELECT COUNT(*) as count FROM users');
    const userCount = Number(userCountRes.rows[0].count);

    if (userCount === 0) {
        const salt = bcrypt.genSaltSync(10);
        const defaultPassword = bcrypt.hashSync('loveyou', salt);

        await dbClient.execute({
            sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
            args: ['gary', defaultPassword, 'Gary']
        });

        await dbClient.execute({
            sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
            args: ['catherine', defaultPassword, 'Catherine']
        });
        console.log('Created default users');
    }

    // Default Pot
    const unallocatedRes = await dbClient.execute("SELECT id FROM savings_pots WHERE name = 'Unallocated'");
    if (unallocatedRes.rows.length === 0) {
        await dbClient.execute({
            sql: "INSERT INTO savings_pots (name, goal_amount, color, icon, priority) VALUES ('Unallocated', NULL, '#64748B', 'savings', 9999)",
            args: []
        });
    }
}

// Wrapper for backward compatibility (simulating synchronous better-sqlite3 API via async methods)
// API routes will need update to await db.prepare()...
class DBWrapper {
    prepare(sql: string) {
        return {
            get: async (...args: any[]) => {
                const res = await dbClient.execute({ sql, args });
                return res.rows[0];
            },
            all: async (...args: any[]) => {
                const res = await dbClient.execute({ sql, args });
                return res.rows;
            },
            run: async (...args: any[]) => {
                const res = await dbClient.execute({ sql, args });
                return { lastInsertRowid: res.lastInsertRowid, changes: res.rowsAffected };
            }
        };
    }

    // Transaction support is tricky with HTTP. libSQL supports batching but true interactive transactions might be different.
    // For now, we will execute the callback? No, valid transactions in serverless are complex.
    // We will assume 'transaction' takes a function and we just execute it. 
    // REALITY CHECK: The current codebase uses synchronous transactions: db.transaction(() => { ... })()
    // We CANNOT easily polyfill that to be async without changing the calling code structure significantly.

    // We will rely on simple batching or we have to rewrite the transact logic in route handlers.
    transaction(fn: (args: any) => any) {
        return async (...args: any[]) => {
            // This acts as a pass-through shim. 
            // The logic inside fn() will fail because it expects synchronous results from db.prepare
            // WE MUST REWRITE THE CALL SITES.
            console.warn("Transactions are not fully supported in async wrapper yet.");
            // We can't really wrap this efficiently without changing the consumer to be async aware.
            return fn(args);
        };
    }

    pragma(sql: string) {
        // defined for compatibility but might need to be async or ignored
        // dbClient.execute(sql); // fire and forget/await?
    }

    exec(sql: string) {
        return dbClient.executeMultiple(sql);
    }
}

// Default export acting as the DB instance
const db = new DBWrapper();
export default db;
