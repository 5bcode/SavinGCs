import { db } from './lib/db_turso.js';
import bcrypt from 'bcryptjs';

const hash = bcrypt.hashSync('changeme', 10);
db.execute("INSERT OR IGNORE INTO users (username, display_name, password_hash) VALUES ('gary', 'Gary', ?) ;", [hash]);
