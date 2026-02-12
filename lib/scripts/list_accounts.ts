
import { dbClient } from '../db_turso';

async function main() {
    const res = await dbClient.execute('SELECT a.id, a.account_name, a.owner, a.current_balance, p.name as pot_name FROM accounts a JOIN savings_pots p ON a.pot_id = p.id ORDER BY a.owner, a.account_name');
    console.table(res.rows);
}

main().catch(console.error);
