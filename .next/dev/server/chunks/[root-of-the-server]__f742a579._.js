module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/Desktop/SavinGCs/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "initializeDatabase",
    ()=>initializeDatabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$better$2d$sqlite3$29$__ = __turbopack_context__.i("[externals]/better-sqlite3 [external] (better-sqlite3, cjs, [project]/Desktop/SavinGCs/node_modules/better-sqlite3)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/SavinGCs/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
;
;
const dbPath = process.env.DATABASE_URL || (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'savings-tracker.db');
const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$better$2d$sqlite3$29$__["default"](dbPath);
// Enable foreign keys
db.pragma('foreign_keys = ON');
function initializeDatabase() {
    // In specific deployment environments (like Docker standalone), 'lib/schema.sql' might not be at process.cwd()/lib
    // We should try to find it relative to __dirname or fallback. 
    // For standard nextjs standalone, it's often better to inline the schema or ensure execution directory is correct.
    // We'll trust process.cwd() for now but log it.
    const schemaPath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'lib', 'schema.sql');
    // For production read-only filesystem where we might deploy with a pre-created DB, we might want to skip schema init if file exists?
    // But better-sqlite3 handles 'IF NOT EXISTS' in SQL fine.
    try {
        const schema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["readFileSync"])(schemaPath, 'utf-8');
        db.exec(schema);
    } catch (err) {
        console.error(`Failed to read schema from ${schemaPath}`, err);
    // If schema file is missing in production build, this might be fatal unless DB is pre-seeded.
    }
    // Migration: add owner column if it doesn't exist
    const cols = db.prepare("PRAGMA table_info(accounts)").all();
    if (!cols.some((c)=>c.name === 'owner')) {
        db.exec("ALTER TABLE accounts ADD COLUMN owner TEXT NOT NULL DEFAULT 'Joint'");
        console.log('Migration: added owner column to accounts');
    }
    // Create default users if they don't exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const salt = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSaltSync(10);
        const defaultPassword = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hashSync('loveyou', salt);
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
    const unallocated = db.prepare("SELECT id FROM savings_pots WHERE name = 'Unallocated'").get();
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
const __TURBOPACK__default__export__ = db;
}),
"[project]/Desktop/SavinGCs/app/api/accounts/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/SavinGCs/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/SavinGCs/lib/db.ts [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        const accounts = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
      SELECT 
        a.*,
        sp.name as pot_name,
        sp.color as pot_color
      FROM accounts a
      JOIN savings_pots sp ON sp.id = a.pot_id
      ORDER BY sp.priority DESC, a.account_name ASC
    `).all();
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            accounts
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch accounts'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const { potId, accountName, accountType, currentBalance, owner, startingBalanceDate } = await request.json();
        const balance = parseFloat(currentBalance) || 0;
        const ownerName = owner || 'Joint';
        // Start a transaction
        const createAccountTransaction = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].transaction(()=>{
            // 1. Get User ID based on owner name
            // If Joint, we default to the first user (usually Gary id=1) or handle it.
            // For now, let's try to find a user with display_name matching owner.
            let userId = 1; // Default fallback
            const user = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare('SELECT id FROM users WHERE display_name = ?').get(ownerName);
            if (user) {
                userId = user.id;
            } else {
                // For 'Joint' or unknown owners, we assign to the primary user (id 1) 
                // effectively treating them as the "recorder" of the transaction.
                console.log(`Owner '${ownerName}' not found in users table, defaulting transaction to user id 1`);
            }
            // 2. Insert Account
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
              INSERT INTO accounts (pot_id, account_name, account_type, owner, current_balance, last_updated)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(potId, accountName, accountType, ownerName, balance);
            const newAccountId = result.lastInsertRowid;
            // 3. Insert Opening Balance Transaction if balance is non-zero
            // Even if 0, maybe we should record it? User asked to "record as opening balance".
            // Let's record it even if 0 so there is a history start point, or maybe only if != 0?
            // Usually opening balance of 0 is implicit. But let's follow the "record as opening balance" instruction strictly.
            // If they input a date, they expect a record.
            if (balance !== 0 || startingBalanceDate) {
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
                    INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
                    VALUES (?, ?, ?, 'Opening Balance', ?)
                 `).run(newAccountId, userId, balance, startingBalanceDate || new Date().toISOString().split('T')[0]);
            }
            return newAccountId;
        });
        const newAccountId = createAccountTransaction();
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            id: Number(newAccountId)
        });
    } catch (error) {
        console.error('Error creating account:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create account'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f742a579._.js.map