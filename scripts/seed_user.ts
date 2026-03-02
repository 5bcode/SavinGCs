import { dbClient } from '../lib/db_turso.ts';
import bcrypt from 'bcryptjs';

const hash = bcrypt.hashSync('changeme', 10);
dbClient.execute({
    sql: "INSERT INTO users (username, display_name, password_hash) VALUES ('gary', 'Gary', ?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash;",
    args: [hash]
});
console.log('User gary seeded with password changeme');