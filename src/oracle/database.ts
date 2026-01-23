/**
 * Database Module - SQLite via sql.js
 *
 * Pure JavaScript SQLite implementation for cross-platform compatibility.
 */

import initSqlJs, { type Database, type SqlValue } from 'sql.js';

export type { SqlValue };
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize sql.js (must be called before using database)
 */
export async function initDatabase(): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
}

/**
 * Database connection wrapper
 */
export class DatabaseConnection {
  private db: Database | null = null;
  private dbPath: string;
  private inMemory: boolean;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
    this.inMemory = dbPath === ':memory:';
  }

  /**
   * Open the database connection
   */
  async open(): Promise<void> {
    if (!SQL) {
      await initDatabase();
    }

    if (this.inMemory) {
      this.db = new SQL!.Database();
    } else {
      try {
        const buffer = await readFile(this.dbPath);
        this.db = new SQL!.Database(buffer);
      } catch {
        // File doesn't exist, create new database
        this.db = new SQL!.Database();
      }
    }

    // Initialize schema
    await this.initSchema();
  }

  /**
   * Initialize database schema
   */
  private async initSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    // Agent profiles table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agent_profiles (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level TEXT DEFAULT 'rookie',
        total_tasks INTEGER DEFAULT 0,
        successful_tasks INTEGER DEFAULT 0,
        total_xp_earned INTEGER DEFAULT 0,
        total_cost_incurred REAL DEFAULT 0,
        average_score REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Specializations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS specializations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level TEXT DEFAULT 'rookie',
        tasks_completed INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0,
        best_score REAL DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        FOREIGN KEY (agent_id) REFERENCES agent_profiles(id),
        UNIQUE(agent_id, task_type)
      )
    `);

    // Achievements table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        xp_bonus INTEGER DEFAULT 0,
        awarded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agent_profiles(id),
        UNIQUE(agent_id, achievement_id)
      )
    `);

    // Judgment history table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS judgment_history (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        contract_id TEXT NOT NULL,
        verdict TEXT NOT NULL,
        score REAL NOT NULL,
        xp_awarded INTEGER DEFAULT 0,
        compliance_json TEXT,
        quality_json TEXT,
        feedback_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agent_profiles(id)
      )
    `);

    // Create indexes
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_specializations_agent ON specializations(agent_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_achievements_agent ON achievements(agent_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_judgment_agent ON judgment_history(agent_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_judgment_contract ON judgment_history(contract_id)`);
  }

  /**
   * Execute a SQL statement
   */
  run(sql: string, params: SqlValue[] = []): void {
    if (!this.db) throw new Error('Database not open');
    this.db.run(sql, params);
  }

  /**
   * Execute a query and return results
   */
  query<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
    if (!this.db) throw new Error('Database not open');

    const stmt = this.db.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();

    return results;
  }

  /**
   * Execute a query and return first result
   */
  queryOne<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | undefined {
    const results = this.query<T>(sql, params);
    return results[0];
  }

  /**
   * Save database to file (no-op for in-memory)
   */
  async save(): Promise<void> {
    if (this.inMemory || !this.db) return;

    const data = this.db.export();
    const buffer = Buffer.from(data);

    // Ensure directory exists
    await mkdir(dirname(this.dbPath), { recursive: true });
    await writeFile(this.dbPath, buffer);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if database is open
   */
  isOpen(): boolean {
    return this.db !== null;
  }
}

// Default database instance
let defaultDb: DatabaseConnection | null = null;

/**
 * Get the default database connection
 */
export async function getDatabase(dbPath?: string): Promise<DatabaseConnection> {
  if (!defaultDb) {
    defaultDb = new DatabaseConnection(dbPath);
    await defaultDb.open();
  }
  return defaultDb;
}

/**
 * Close the default database
 */
export async function closeDatabase(): Promise<void> {
  if (defaultDb) {
    await defaultDb.close();
    defaultDb = null;
  }
}
