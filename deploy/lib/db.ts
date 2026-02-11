// This file is deprecated in favor of db_turso for cloud support.
// Keeping it for potential local scripts or legacy reference.
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_URL || join(process.cwd(), 'savings-tracker.db');
// ... existing content ...
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
export function initializeDatabase() {
  // In specific deployment environments (like Docker standalone), 'lib/schema.sql' might not be at process.cwd()/lib
  // We should try to find it relative to __dirname or fallback. 
  // For standard nextjs standalone, it's often better to inline the schema or ensure execution directory is correct.
  // We'll trust process.cwd() for now but log it.
  const schemaPath = join(process.cwd(), 'lib', 'schema.sql');
  // For production read-only filesystem where we might deploy with a pre-created DB, we might want to skip schema init if file exists?
  // But better-sqlite3 handles 'IF NOT EXISTS' in SQL fine.

  try {
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  } catch (err) {
    console.error(`Failed to read schema from ${schemaPath}`, err);
    // If schema file is missing in production build, this might be fatal unless DB is pre-seeded.
  }

  // Migration: add owner column if it doesn't exist
  const cols = db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[];
  if (!cols.some(c => c.name === 'owner')) {
    db.exec("ALTER TABLE accounts ADD COLUMN owner TEXT NOT NULL DEFAULT 'Joint'");
    console.log('Migration: added owner column to accounts');
  }

  // Create default users if they don't exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const defaultPassword = bcrypt.hashSync('loveyou', salt);

    db.prepare(`
      INSERT INTO users (username, password_hash, display_name)
      VALUES (?, ?, ?)
    `).run('gary', defaultPassword, 'Gary');

    db.prepare(`
      INSERT INTO users (username, password_hash, display_name)
      VALUES (?, ?, ?)
    `).run('catherine', defaultPassword, 'Catherine');

    console.log('Created default users: gary and catherine');
  }

  // Ensure 'Unallocated' pot always exists (highest priority so it sorts first)
  const unallocated = db.prepare("SELECT id FROM savings_pots WHERE name = 'Unallocated'").get() as any;
  if (!unallocated) {
    db.prepare(`
      INSERT INTO savings_pots (name, goal_amount, color, icon, priority)
      VALUES ('Unallocated', NULL, '#64748B', 'savings', 9999)
    `).run();
    console.log('Created default pot: Unallocated');
  }

  console.log('Database initialized successfully');
}

// Initialize on import
initializeDatabase();

export default db;
