import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const pool = new Pool({ connectionString: url });
const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

console.log('[migrate] Running schema...');
try {
  await pool.query(sql);
  console.log('[migrate] Schema applied.');
} catch (err) {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
