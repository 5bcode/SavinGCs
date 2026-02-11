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
const dbPath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'savings-tracker.db');
const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$better$2d$sqlite3$29$__["default"](dbPath);
// Enable foreign keys
db.pragma('foreign_keys = ON');
function initializeDatabase() {
    const schema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["readFileSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'lib', 'schema.sql'), 'utf-8');
    db.exec(schema);
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
"[project]/Desktop/SavinGCs/app/api/transactions/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const potId = searchParams.get('potId');
        const accountId = searchParams.get('accountId');
        let query = `
      SELECT 
        t.*,
        a.account_name,
        sp.name as pot_name,
        u.display_name as user_name
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      JOIN savings_pots sp ON sp.id = a.pot_id
      JOIN users u ON u.id = t.user_id
      WHERE 1=1
    `;
        const params = [];
        if (potId) {
            query += ` AND a.pot_id = ?`;
            params.push(potId);
        }
        if (accountId) {
            query += ` AND t.account_id = ?`;
            params.push(accountId);
        }
        query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;
        const transactions = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(query).all(...params);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch transactions'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const { accountId, userId, amount, description, transactionDate } = await request.json();
        // Start transaction
        const insertTransaction = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
      INSERT INTO transactions (account_id, user_id, amount, description, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `);
        const updateAccountBalance = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
      UPDATE accounts 
      SET current_balance = current_balance + ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        const result = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].transaction(()=>{
            const txResult = insertTransaction.run(accountId, userId, amount, description || '', transactionDate);
            updateAccountBalance.run(amount, accountId);
            return txResult;
        })();
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$SavinGCs$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create transaction'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0f1fa424._.js.map