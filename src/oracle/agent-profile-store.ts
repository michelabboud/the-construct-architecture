/**
 * Agent Profile Store - Persistence for Agent Profiles
 *
 * Stores and retrieves agent performance data using SQLite.
 */

import { DatabaseConnection, type SqlValue } from './database.js';
import {
  type AgentProfile,
  type AgentLevel,
  type Specialization,
  type Achievement,
  type AgentStats,
  LEVEL_THRESHOLDS,
} from '../types/agent.js';

/**
 * Database row types
 */
interface AgentProfileRow {
  id: string;
  provider: string;
  model: string;
  xp: number;
  level: string;
  total_tasks: number;
  successful_tasks: number;
  total_xp_earned: number;
  total_cost_incurred: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

interface SpecializationRow {
  id: number;
  agent_id: string;
  task_type: string;
  xp: number;
  level: string;
  tasks_completed: number;
  avg_score: number;
  best_score: number;
  current_streak: number;
}

interface AchievementRow {
  id: number;
  agent_id: string;
  achievement_id: string;
  name: string;
  description: string | null;
  xp_bonus: number;
  awarded_at: string;
}

/**
 * Agent Profile Store
 */
export class AgentProfileStore {
  constructor(private db: DatabaseConnection) {}

  /**
   * Create a new agent profile
   */
  async create(profile: Omit<AgentProfile, 'createdAt' | 'updatedAt' | 'specializations' | 'achievements' | 'stats'>): Promise<AgentProfile> {
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO agent_profiles (id, provider, model, xp, level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.provider, profile.model, profile.xp, profile.level, now, now]
    );

    return this.getById(profile.id) as Promise<AgentProfile>;
  }

  /**
   * Get agent profile by ID
   */
  async getById(id: string): Promise<AgentProfile | undefined> {
    const row = this.db.queryOne<AgentProfileRow>(
      `SELECT * FROM agent_profiles WHERE id = ?`,
      [id]
    );

    if (!row) return undefined;

    return this.rowToProfile(row);
  }

  /**
   * Get or create agent profile
   */
  async getOrCreate(id: string, provider: string, model: string): Promise<AgentProfile> {
    let profile = await this.getById(id);

    if (!profile) {
      profile = await this.create({
        id,
        provider,
        model,
        xp: 0,
        level: 'rookie',
      });
    }

    return profile;
  }

  /**
   * Update agent profile
   */
  async update(id: string, updates: Partial<AgentProfile>): Promise<AgentProfile | undefined> {
    const profile = await this.getById(id);
    if (!profile) return undefined;

    const now = new Date().toISOString();

    if (updates.xp !== undefined || updates.level !== undefined) {
      this.db.run(
        `UPDATE agent_profiles SET xp = ?, level = ?, updated_at = ? WHERE id = ?`,
        [updates.xp ?? profile.xp, updates.level ?? profile.level, now, id]
      );
    }

    return this.getById(id);
  }

  /**
   * Update agent stats after task completion
   */
  async recordTaskCompletion(
    agentId: string,
    success: boolean,
    score: number,
    xpEarned: number,
    costIncurred: number,
    taskType: string
  ): Promise<AgentProfile | undefined> {
    const profile = await this.getById(agentId);
    if (!profile) return undefined;

    const now = new Date().toISOString();

    // Update main profile stats
    const newTotalTasks = profile.stats.totalTasks + 1;
    const newSuccessfulTasks = profile.stats.totalTasks * (profile.stats.successRate / 100) + (success ? 1 : 0);
    const newSuccessRate = (newSuccessfulTasks / newTotalTasks) * 100;
    const newAvgScore = ((profile.stats.averageScore * profile.stats.totalTasks) + score) / newTotalTasks;
    const newTotalXp = profile.stats.totalXpEarned + xpEarned;
    const newTotalCost = profile.stats.totalCostIncurred + costIncurred;
    const newXp = profile.xp + xpEarned;
    const newLevel = this.calculateLevel(newXp);

    this.db.run(
      `UPDATE agent_profiles SET
        xp = ?,
        level = ?,
        total_tasks = ?,
        successful_tasks = ?,
        total_xp_earned = ?,
        total_cost_incurred = ?,
        average_score = ?,
        updated_at = ?
       WHERE id = ?`,
      [newXp, newLevel, newTotalTasks, Math.round(newSuccessfulTasks), newTotalXp, newTotalCost, newAvgScore, now, agentId]
    );

    // Update or create specialization
    await this.updateSpecialization(agentId, taskType, success, score, xpEarned);

    return this.getById(agentId);
  }

  /**
   * Update specialization for a task type
   */
  private async updateSpecialization(
    agentId: string,
    taskType: string,
    success: boolean,
    score: number,
    xpEarned: number
  ): Promise<void> {
    const existing = this.db.queryOne<SpecializationRow>(
      `SELECT * FROM specializations WHERE agent_id = ? AND task_type = ?`,
      [agentId, taskType]
    );

    if (existing) {
      const newTasksCompleted = existing.tasks_completed + 1;
      const newAvgScore = ((existing.avg_score * existing.tasks_completed) + score) / newTasksCompleted;
      const newBestScore = Math.max(existing.best_score, score);
      const newStreak = success ? existing.current_streak + 1 : 0;
      const newXp = existing.xp + xpEarned;
      const newLevel = this.calculateLevel(newXp);

      this.db.run(
        `UPDATE specializations SET
          xp = ?, level = ?, tasks_completed = ?, avg_score = ?,
          best_score = ?, current_streak = ?
         WHERE agent_id = ? AND task_type = ?`,
        [newXp, newLevel, newTasksCompleted, newAvgScore, newBestScore, newStreak, agentId, taskType]
      );
    } else {
      this.db.run(
        `INSERT INTO specializations (agent_id, task_type, xp, level, tasks_completed, avg_score, best_score, current_streak)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [agentId, taskType, xpEarned, 'rookie', 1, score, score, success ? 1 : 0]
      );
    }
  }

  /**
   * Add achievement to agent
   */
  async addAchievement(agentId: string, achievement: Omit<Achievement, 'awardedAt'>): Promise<void> {
    const now = new Date().toISOString();

    try {
      this.db.run(
        `INSERT INTO achievements (agent_id, achievement_id, name, description, xp_bonus, awarded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [agentId, achievement.id, achievement.name, achievement.description, achievement.xpBonus, now]
      );
    } catch {
      // Achievement already exists (unique constraint)
    }
  }

  /**
   * Get all agent profiles
   */
  async getAll(): Promise<AgentProfile[]> {
    const rows = this.db.query<AgentProfileRow>(`SELECT * FROM agent_profiles ORDER BY xp DESC`);
    return Promise.all(rows.map(row => this.rowToProfile(row)));
  }

  /**
   * Get top agents by XP
   */
  async getTopAgents(limit: number = 10): Promise<AgentProfile[]> {
    const rows = this.db.query<AgentProfileRow>(
      `SELECT * FROM agent_profiles ORDER BY xp DESC LIMIT ?`,
      [limit]
    );
    return Promise.all(rows.map(row => this.rowToProfile(row)));
  }

  /**
   * Delete agent profile
   */
  async delete(id: string): Promise<boolean> {
    const profile = await this.getById(id);
    if (!profile) return false;

    this.db.run(`DELETE FROM achievements WHERE agent_id = ?`, [id]);
    this.db.run(`DELETE FROM specializations WHERE agent_id = ?`, [id]);
    this.db.run(`DELETE FROM agent_profiles WHERE id = ?`, [id]);

    return true;
  }

  /**
   * Convert database row to AgentProfile
   */
  private async rowToProfile(row: AgentProfileRow): Promise<AgentProfile> {
    const specializations = await this.getSpecializations(row.id);
    const achievements = await this.getAchievements(row.id);

    const stats: AgentStats = {
      totalTasks: row.total_tasks,
      totalXpEarned: row.total_xp_earned,
      totalCostIncurred: row.total_cost_incurred,
      averageScore: row.average_score,
      successRate: row.total_tasks > 0
        ? (row.successful_tasks / row.total_tasks) * 100
        : 0,
    };

    return {
      id: row.id,
      provider: row.provider,
      model: row.model,
      xp: row.xp,
      level: row.level as AgentLevel,
      specializations,
      achievements,
      stats,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get specializations for an agent
   */
  private async getSpecializations(agentId: string): Promise<Record<string, Specialization>> {
    const rows = this.db.query<SpecializationRow>(
      `SELECT * FROM specializations WHERE agent_id = ?`,
      [agentId]
    );

    const specializations: Record<string, Specialization> = {};
    for (const row of rows) {
      specializations[row.task_type] = {
        taskType: row.task_type,
        xp: row.xp,
        level: row.level as AgentLevel,
        tasksCompleted: row.tasks_completed,
        avgScore: row.avg_score,
        bestScore: row.best_score,
        currentStreak: row.current_streak,
      };
    }

    return specializations;
  }

  /**
   * Get achievements for an agent
   */
  private async getAchievements(agentId: string): Promise<Achievement[]> {
    const rows = this.db.query<AchievementRow>(
      `SELECT * FROM achievements WHERE agent_id = ? ORDER BY awarded_at DESC`,
      [agentId]
    );

    return rows.map(row => ({
      id: row.achievement_id,
      name: row.name,
      description: row.description ?? '',
      xpBonus: row.xp_bonus,
      awardedAt: new Date(row.awarded_at),
    }));
  }

  /**
   * Calculate level from XP
   */
  private calculateLevel(xp: number): AgentLevel {
    if (xp >= LEVEL_THRESHOLDS.expert) return 'expert';
    if (xp >= LEVEL_THRESHOLDS.trusted) return 'trusted';
    if (xp >= LEVEL_THRESHOLDS.reliable) return 'reliable';
    return 'rookie';
  }
}
