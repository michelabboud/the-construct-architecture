/**
 * Workflow State Persistence
 *
 * "What is real? How do you define real?" — Morpheus
 *
 * Persists workflow state using SQLite for resumable migrations.
 */

import { EventEmitter } from 'events';
import initSqlJs, { type Database } from 'sql.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import {
  WorkflowState,
  WorkflowStatus,
  WorkflowProgress,
  WorkflowEvent,
  WorkflowEventType,
  ChecklistState,
  Checkpoint,
  FileBackup,
  CrewMember,
  AgentError,
} from '../../types/morpheus.js';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize sql.js
 */
async function initSql(): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
}

/**
 * State store options
 */
export interface StateStoreOptions {
  /** Database file path (default: .morpheus/state.db) */
  dbPath?: string;
  /** Use in-memory database */
  inMemory?: boolean;
  /** Auto-save interval in milliseconds (0 to disable) */
  autoSaveInterval?: number;
}

/**
 * WorkflowStateStore class
 *
 * Persists workflow state to SQLite for resumable migrations.
 */
export class WorkflowStateStore extends EventEmitter {
  private db: Database | null = null;
  private dbPath: string;
  private inMemory: boolean;
  private autoSaveInterval: number;
  private saveTimer: NodeJS.Timeout | null = null;
  private dirty: boolean = false;

  constructor(options: StateStoreOptions = {}) {
    super();
    this.dbPath = options.dbPath ?? '.morpheus/state.db';
    this.inMemory = options.inMemory ?? false;
    this.autoSaveInterval = options.autoSaveInterval ?? 5000;
  }

  /**
   * Open the database connection
   */
  async open(): Promise<void> {
    await initSql();

    if (this.inMemory) {
      this.db = new SQL!.Database();
    } else {
      // Ensure directory exists
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

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

    // Start auto-save if enabled
    if (this.autoSaveInterval > 0 && !this.inMemory) {
      this.saveTimer = setInterval(() => this.save(), this.autoSaveInterval);
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }

    if (this.dirty && !this.inMemory) {
      await this.save();
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Save database to disk
   */
  async save(): Promise<void> {
    if (!this.db || this.inMemory) return;

    const data = this.db.export();
    const buffer = Buffer.from(data);
    await writeFile(this.dbPath, buffer);
    this.dirty = false;
  }

  /**
   * Initialize database schema
   */
  private async initSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    // Workflow states table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS workflow_states (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        project_path TEXT NOT NULL,
        current_phase TEXT,
        current_step TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        progress_json TEXT NOT NULL DEFAULT '{}',
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      )
    `);

    // Workflow events table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS workflow_events (
        id TEXT PRIMARY KEY,
        workflow_state_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        phase_id TEXT,
        step_id TEXT,
        agent_id TEXT,
        details_json TEXT NOT NULL DEFAULT '{}',
        error_json TEXT,
        FOREIGN KEY (workflow_state_id) REFERENCES workflow_states(id)
      )
    `);

    // Checkpoints table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        workflow_state_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        phase_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (workflow_state_id) REFERENCES workflow_states(id)
      )
    `);

    // File backups table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS file_backups (
        id TEXT PRIMARY KEY,
        checkpoint_id TEXT NOT NULL,
        path TEXT NOT NULL,
        content TEXT NOT NULL,
        existed INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
      )
    `);

    // Checklists table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS checklists (
        workflow_state_id TEXT NOT NULL,
        phase_id TEXT NOT NULL,
        state_json TEXT NOT NULL,
        PRIMARY KEY (workflow_state_id, phase_id),
        FOREIGN KEY (workflow_state_id) REFERENCES workflow_states(id)
      )
    `);

    // Create indexes
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_workflow_states_project
      ON workflow_states(project_path)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_workflow_events_state
      ON workflow_events(workflow_state_id)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_checkpoints_state
      ON checkpoints(workflow_state_id)
    `);
  }

  /**
   * Create a new workflow state
   */
  async createState(
    workflowId: string,
    projectPath: string
  ): Promise<WorkflowState> {
    if (!this.db) throw new Error('Database not open');

    const id = randomUUID();
    const now = new Date();
    const progress: WorkflowProgress = {
      completedPhases: [],
      completedSteps: [],
      skippedSteps: [],
      failedSteps: [],
      failedPhases: [],
      checklists: {},
    };

    this.db.run(
      `INSERT INTO workflow_states
       (id, workflow_id, project_path, status, progress_json, started_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, workflowId, projectPath, 'pending', JSON.stringify(progress), now.toISOString(), now.toISOString()]
    );

    this.dirty = true;

    const state: WorkflowState = {
      id,
      workflowId,
      projectPath,
      currentPhase: '',
      currentStep: '',
      status: 'pending',
      progress,
      history: [],
      startedAt: now,
      updatedAt: now,
    };

    // Record creation event
    await this.addEvent(id, 'workflow_started', {});

    return state;
  }

  /**
   * Get a workflow state by ID
   */
  async getState(stateId: string): Promise<WorkflowState | null> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT * FROM workflow_states WHERE id = ?`,
      [stateId]
    );

    if (result.length === 0 || result[0]!.values.length === 0) {
      return null;
    }

    const row = result[0]!.values[0]!;
    const columns = result[0]!.columns;
    const data = Object.fromEntries(columns.map((col, i) => [col, row[i]]));

    // Get events
    const events = await this.getEvents(stateId);

    const state: WorkflowState = {
      id: data.id as string,
      workflowId: data.workflow_id as string,
      projectPath: data.project_path as string,
      currentPhase: (data.current_phase as string) ?? '',
      currentStep: (data.current_step as string) ?? '',
      status: data.status as WorkflowStatus,
      progress: JSON.parse(data.progress_json as string),
      history: events,
      startedAt: new Date(data.started_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
    if (data.completed_at) {
      state.completedAt = new Date(data.completed_at as string);
    }
    return state;
  }

  /**
   * Get workflow state by project path
   */
  async getStateByProject(projectPath: string): Promise<WorkflowState | null> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT id FROM workflow_states WHERE project_path = ? ORDER BY updated_at DESC LIMIT 1`,
      [projectPath]
    );

    if (result.length === 0 || result[0]!.values.length === 0) {
      return null;
    }

    const stateId = result[0]!.values[0]![0] as string;
    return this.getState(stateId);
  }

  /**
   * Get all incomplete workflow states
   */
  async getIncompleteStates(): Promise<WorkflowState[]> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT id FROM workflow_states
       WHERE status NOT IN ('completed', 'failed', 'rolled_back')
       ORDER BY updated_at DESC`
    );

    if (result.length === 0) {
      return [];
    }

    const states: WorkflowState[] = [];
    for (const row of result[0]!.values) {
      const state = await this.getState(row[0] as string);
      if (state) {
        states.push(state);
      }
    }

    return states;
  }

  /**
   * Update workflow state
   */
  async updateState(state: WorkflowState): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    const now = new Date();
    state.updatedAt = now;

    this.db.run(
      `UPDATE workflow_states SET
       current_phase = ?,
       current_step = ?,
       status = ?,
       progress_json = ?,
       updated_at = ?,
       completed_at = ?
       WHERE id = ?`,
      [
        state.currentPhase,
        state.currentStep,
        state.status,
        JSON.stringify(state.progress),
        now.toISOString(),
        state.completedAt?.toISOString() ?? null,
        state.id,
      ]
    );

    this.dirty = true;
  }

  /**
   * Delete a workflow state
   */
  async deleteState(stateId: string): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    // Delete related data first
    this.db.run(`DELETE FROM file_backups WHERE checkpoint_id IN
                 (SELECT id FROM checkpoints WHERE workflow_state_id = ?)`, [stateId]);
    this.db.run(`DELETE FROM checkpoints WHERE workflow_state_id = ?`, [stateId]);
    this.db.run(`DELETE FROM workflow_events WHERE workflow_state_id = ?`, [stateId]);
    this.db.run(`DELETE FROM checklists WHERE workflow_state_id = ?`, [stateId]);
    this.db.run(`DELETE FROM workflow_states WHERE id = ?`, [stateId]);

    this.dirty = true;
  }

  /**
   * Add an event to workflow history
   */
  async addEvent(
    stateId: string,
    type: WorkflowEventType,
    details: Record<string, unknown>,
    options?: {
      phaseId?: string;
      stepId?: string;
      agentId?: CrewMember;
      error?: AgentError;
    }
  ): Promise<WorkflowEvent> {
    if (!this.db) throw new Error('Database not open');

    const id = randomUUID();
    const now = new Date();

    this.db.run(
      `INSERT INTO workflow_events
       (id, workflow_state_id, timestamp, type, phase_id, step_id, agent_id, details_json, error_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        stateId,
        now.toISOString(),
        type,
        options?.phaseId ?? null,
        options?.stepId ?? null,
        options?.agentId ?? null,
        JSON.stringify(details),
        options?.error ? JSON.stringify(options.error) : null,
      ]
    );

    this.dirty = true;

    const event: WorkflowEvent = {
      id,
      timestamp: now,
      type,
      details,
    };
    if (options?.phaseId) event.phaseId = options.phaseId;
    if (options?.stepId) event.stepId = options.stepId;
    if (options?.agentId) event.agentId = options.agentId;
    if (options?.error) event.error = options.error;
    return event;
  }

  /**
   * Get events for a workflow state
   */
  async getEvents(stateId: string): Promise<WorkflowEvent[]> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT * FROM workflow_events WHERE workflow_state_id = ? ORDER BY timestamp ASC`,
      [stateId]
    );

    if (result.length === 0) {
      return [];
    }

    const columns = result[0]!.columns;
    return result[0]!.values.map((row) => {
      const data = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
      const event: WorkflowEvent = {
        id: data.id as string,
        timestamp: new Date(data.timestamp as string),
        type: data.type as WorkflowEventType,
        details: JSON.parse(data.details_json as string),
      };
      if (data.phase_id) event.phaseId = data.phase_id as string;
      if (data.step_id) event.stepId = data.step_id as string;
      if (data.agent_id) event.agentId = data.agent_id as CrewMember;
      if (data.error_json) event.error = JSON.parse(data.error_json as string);
      return event;
    });
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(
    stateId: string,
    phaseId: string,
    stepId: string,
    description: string,
    fileBackups: Array<{ path: string; content: string; existed: boolean }>
  ): Promise<Checkpoint> {
    if (!this.db) throw new Error('Database not open');

    const id = randomUUID();
    const now = new Date();

    this.db.run(
      `INSERT INTO checkpoints (id, workflow_state_id, created_at, phase_id, step_id, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, stateId, now.toISOString(), phaseId, stepId, description]
    );

    // Insert file backups
    for (const backup of fileBackups) {
      const backupId = randomUUID();
      this.db.run(
        `INSERT INTO file_backups (id, checkpoint_id, path, content, existed)
         VALUES (?, ?, ?, ?, ?)`,
        [backupId, id, backup.path, backup.content, backup.existed ? 1 : 0]
      );
    }

    this.dirty = true;

    // Record event
    await this.addEvent(stateId, 'checkpoint_created', { checkpointId: id }, { phaseId, stepId });

    return {
      id,
      workflowStateId: stateId,
      createdAt: now,
      phaseId,
      stepId,
      description,
      fileBackups: fileBackups.map((b) => ({
        path: b.path,
        content: b.content,
        existed: b.existed,
      })),
    };
  }

  /**
   * Get checkpoints for a workflow state
   */
  async getCheckpoints(stateId: string): Promise<Checkpoint[]> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT * FROM checkpoints WHERE workflow_state_id = ? ORDER BY created_at DESC, id DESC`,
      [stateId]
    );

    if (result.length === 0) {
      return [];
    }

    const columns = result[0]!.columns;
    const checkpoints: Checkpoint[] = [];

    for (const row of result[0]!.values) {
      const data = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
      const checkpointId = data.id as string;

      // Get file backups for this checkpoint
      const backupsResult = this.db.exec(
        `SELECT * FROM file_backups WHERE checkpoint_id = ?`,
        [checkpointId]
      );

      const fileBackups: FileBackup[] = backupsResult.length > 0
        ? backupsResult[0]!.values.map((backupRow) => {
            const backupData = Object.fromEntries(
              backupsResult[0]!.columns.map((col, i) => [col, backupRow[i]])
            );
            return {
              path: backupData.path as string,
              content: backupData.content as string,
              existed: backupData.existed === 1,
            };
          })
        : [];

      checkpoints.push({
        id: checkpointId,
        workflowStateId: stateId,
        createdAt: new Date(data.created_at as string),
        phaseId: data.phase_id as string,
        stepId: data.step_id as string,
        description: data.description as string,
        fileBackups,
      });
    }

    return checkpoints;
  }

  /**
   * Get the latest checkpoint for a workflow state
   */
  async getLatestCheckpoint(stateId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.getCheckpoints(stateId);
    return checkpoints.length > 0 ? checkpoints[0]! : null;
  }

  /**
   * Save checklist state
   */
  async saveChecklist(stateId: string, checklistState: ChecklistState): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    this.db.run(
      `INSERT OR REPLACE INTO checklists (workflow_state_id, phase_id, state_json)
       VALUES (?, ?, ?)`,
      [stateId, checklistState.phaseId, JSON.stringify(checklistState)]
    );

    this.dirty = true;
  }

  /**
   * Get checklist state
   */
  async getChecklist(stateId: string, phaseId: string): Promise<ChecklistState | null> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT state_json FROM checklists WHERE workflow_state_id = ? AND phase_id = ?`,
      [stateId, phaseId]
    );

    if (result.length === 0 || result[0]!.values.length === 0) {
      return null;
    }

    return JSON.parse(result[0]!.values[0]![0] as string);
  }

  /**
   * Get all checklists for a workflow state
   */
  async getAllChecklists(stateId: string): Promise<Record<string, ChecklistState>> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec(
      `SELECT phase_id, state_json FROM checklists WHERE workflow_state_id = ?`,
      [stateId]
    );

    if (result.length === 0) {
      return {};
    }

    const checklists: Record<string, ChecklistState> = {};
    for (const row of result[0]!.values) {
      const phaseId = row[0] as string;
      checklists[phaseId] = JSON.parse(row[1] as string);
    }

    return checklists;
  }
}

/**
 * Create a workflow state store instance
 */
export function createStateStore(options?: StateStoreOptions): WorkflowStateStore {
  return new WorkflowStateStore(options);
}
