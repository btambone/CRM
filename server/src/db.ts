import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "crm.sqlite3");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    size TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'new_lead',
    status TEXT NOT NULL DEFAULT 'open',
    value REAL DEFAULT 0,
    source TEXT,
    owner TEXT,
    notes TEXT,
    expected_close_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
  CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads(contact_id);
  CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
  CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
  CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
`;

// Thin shim over sql.js that mimics the small subset of the better-sqlite3
// API this app uses (prepare().all/get/run, exec, pragma), so route files
// don't need to know the underlying engine changed. sql.js is a WASM build
// of SQLite with no native compile step, unlike better-sqlite3.
class Statement {
  constructor(
    private sqlDb: SqlJsDatabase,
    private sql: string,
    private persist: () => void
  ) {}

  all(...params: any[]): any[] {
    const stmt = this.sqlDb.prepare(this.sql);
    try {
      stmt.bind(params);
      const rows: any[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  get(...params: any[]): any {
    const stmt = this.sqlDb.prepare(this.sql);
    try {
      stmt.bind(params);
      return stmt.step() ? stmt.getAsObject() : undefined;
    } finally {
      stmt.free();
    }
  }

  run(...params: any[]): { lastInsertRowid: number; changes: number } {
    const stmt = this.sqlDb.prepare(this.sql);
    try {
      stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = this.sqlDb.getRowsModified();
    const idResult = this.sqlDb.exec("SELECT last_insert_rowid() AS id");
    const lastInsertRowid = idResult.length ? Number(idResult[0].values[0][0]) : 0;
    this.persist();
    return { lastInsertRowid, changes };
  }
}

class DbHandle {
  constructor(
    private sqlDb: SqlJsDatabase,
    private filePath: string
  ) {}

  prepare(sql: string): Statement {
    return new Statement(this.sqlDb, sql, () => this.persist());
  }

  exec(sql: string): void {
    this.sqlDb.run(sql);
    this.persist();
  }

  pragma(pragma: string): void {
    this.sqlDb.run(`PRAGMA ${pragma}`);
  }

  persist(): void {
    fs.writeFileSync(this.filePath, Buffer.from(this.sqlDb.export()));
  }
}

export let db: DbHandle;

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs();
  const existing = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  const sqlDb = new SQL.Database(existing);
  db = new DbHandle(sqlDb, dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
}

export const STAGES = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal Sent" },
  { key: "closed_won", label: "Closed Won" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
