const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=["']?(.+?)["']?\s*$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
});

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

console.log('Connecting to:', url);

const client = createClient({ url, authToken });

async function init() {
    // 1. Run schema
    const schema = fs.readFileSync(path.join(__dirname, '..', 'lib', 'schema.sql'), 'utf-8');
    console.log('\n1. Running schema...');
    await client.executeMultiple(schema);
    console.log('   ✅ Tables created!');

    // Migration: add goal_date column if missing
    try {
        const potCols = await client.execute('PRAGMA table_info(savings_pots)');
        const hasGoalDate = potCols.rows.some(r => r.name === 'goal_date');
        if (!hasGoalDate) {
            await client.execute('ALTER TABLE savings_pots ADD COLUMN goal_date DATE');
            console.log('   ✅ Migration: added goal_date column');
        }
    } catch (e) {
        console.error('   ⚠️  goal_date migration failed:', e.message);
    }

    // 2. Seed users
    console.log('\n2. Seeding users...');
    const userCount = await client.execute('SELECT COUNT(*) as count FROM users');
    if (Number(userCount.rows[0].count) === 0) {
        const salt = bcrypt.genSaltSync(10);
        const pw = bcrypt.hashSync('loveyou', salt);
        await client.execute({ sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)', args: ['gary', pw, 'Gary'] });
        await client.execute({ sql: 'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)', args: ['catherine', pw, 'Catherine'] });
        console.log('   ✅ Users seeded (gary, catherine)');
    } else {
        console.log('   ⏭️  Users already exist, skipping');
    }

    // 3. Create Unallocated pot
    console.log('\n3. Creating Unallocated pot...');
    const unalloc = await client.execute("SELECT id FROM savings_pots WHERE name = 'Unallocated'");
    if (unalloc.rows.length === 0) {
        await client.execute({
            sql: "INSERT INTO savings_pots (name, goal_amount, color, icon, priority) VALUES (?, NULL, ?, ?, ?)",
            args: ['Unallocated', '#64748B', 'savings', 9999]
        });
        console.log('   ✅ Unallocated pot created');
    } else {
        console.log('   ⏭️  Unallocated pot already exists');
    }

    // 4. Verify
    console.log('\n--- Verification ---');
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('Tables:', tables.rows.map(r => r.name).join(', '));

    const users = await client.execute('SELECT id, username, display_name FROM users');
    console.log('Users:', users.rows.map(r => `${r.username} (${r.display_name})`).join(', '));

    const pots = await client.execute('SELECT id, name, goal_amount FROM savings_pots');
    console.log('Pots:', pots.rows.map(r => `${r.name} (goal: ${r.goal_amount || 'none'})`).join(', '));

    const accounts = await client.execute('SELECT id, account_name, current_balance FROM accounts');
    console.log('Accounts:', accounts.rows.length > 0 ? accounts.rows.map(r => `${r.account_name}: £${r.current_balance}`).join(', ') : '(none yet)');

    const txns = await client.execute('SELECT COUNT(*) as count FROM transactions');
    console.log('Transactions:', txns.rows[0].count);

    console.log('\n✅ Turso database is ready!');
}

init().catch(e => {
    console.error('❌ FAILED:', e.message);
    process.exit(1);
});
