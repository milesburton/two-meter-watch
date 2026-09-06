import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(process.cwd(), 'data', 'two-meter-watch.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

let dbInstance: Database.Database | null = null;

/**
 * Opens (or creates) the SQLite database and applies schema.sql
 * idempotently via CREATE TABLE IF NOT EXISTS statements.
 */
export function openDb(path: string = DEFAULT_DB_PATH): Database.Database {
  if (dbInstance) return dbInstance;

  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');

  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  dbInstance = db;
  return db;
}

export function closeDb(): void {
  dbInstance?.close();
  dbInstance = null;
}
