// This file is deprecated. Please use @/lib/db_turso instead.
// better-sqlite3 has been removed to support edge/cloud deployments.

const db = {
  prepare: () => { throw new Error("Legacy db.ts is deprecated. Use db_turso.ts"); },
  exec: () => { throw new Error("Legacy db.ts is deprecated. Use db_turso.ts"); },
  pragma: () => { throw new Error("Legacy db.ts is deprecated. Use db_turso.ts"); },
  transaction: () => { throw new Error("Legacy db.ts is deprecated. Use db_turso.ts"); }
};

export function initializeDatabase() {
  console.warn("Legacy initializeDatabase called. Ignoring as we are on Turso/Cloud.");
}

export default db;
