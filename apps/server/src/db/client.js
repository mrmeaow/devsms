import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const dbPath = path.join(rootDir, 'devsms.db');
const migrationsDir = path.join(rootDir, 'migrations');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');
    db.exec(sql);
  }
}

runMigrations();
