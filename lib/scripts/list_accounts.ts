
import { dbClient } from '../db_turso';

async function main() {
    const res = await dbClient.execute('SELECT * FROM accounts');
    console.log(`Total accounts: ${res.rows.length}`);
    console.log(JSON.stringify(res.rows, null, 2));
}

main().catch(console.error);
