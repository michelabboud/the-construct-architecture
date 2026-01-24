/**
 * The Oracle - Judgment & Insight
 *
 * "I'm interested in one thing, the future.
 *  And the only way to get there is together."
 *
 * Collects feedback, manages Level-Up system, exposes insights.
 * Judges execution results and awards XP based on performance.
 *
 * Phase 2 Implementation
 */

import type {
  AgentSubmission,
  Judgment,
  Verdict,
  Compliance,
  QualityScores,
  JudgmentRecord,
} from '../types/judgment.js';
import type {
  AgentProfile,
  // Future use: XPEvent, XPAward, XPEventType,
  Achievement,
} from '../types/agent.js';
import type { Contract } from '../architect/schemas/contract.schema.js';
import { LevelUpSystem } from './level-up.js';
import { AgentProfileStore } from './agent-profile-store.js';
import { DatabaseConnection, type SqlValue } from './database.js';

/**
 * Oracle configuration
 */
export interface OracleConfig {
  db: DatabaseConnection;
  autoSave?: boolean;
}

/**
 * Achievement definitions
 */
const ACHIEVEMENTS: Record<string, Omit<Achievement, 'awardedAt'>> = {
  first_task: {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    xpBonus: 10,
  },
  streak_5: {
    id: 'streak_5',
    name: 'On a Roll',
    description: 'Complete 5 tasks in a row',
    xpBonus: 25,
  },
  streak_10: {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Complete 10 tasks in a row',
    xpBonus: 50,
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfection',
    description: 'Achieve a perfect score of 10',
    xpBonus: 50,
  },
  reliable_level: {
    id: 'reliable_level',
    name: 'Proving Ground',
    description: 'Reach Reliable level',
    xpBonus: 100,
  },
  trusted_level: {
    id: 'trusted_level',
    name: 'Trust Earned',
    description: 'Reach Trusted level',
    xpBonus: 250,
  },
  expert_level: {
    id: 'expert_level',
    name: 'Master of the Craft',
    description: 'Reach Expert level',
    xpBonus: 500,
  },
  cost_efficient: {
    id: 'cost_efficient',
    name: 'Budget Master',
    description: 'Complete a task under 50% of budget',
    xpBonus: 15,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a task in under 5 seconds',
    xpBonus: 20,
  },
};

/**
 * The Oracle - Feedback and Judgment System
 */
export class Oracle {
  private levelUpSystem: LevelUpSystem;
  private profileStore: AgentProfileStore;
  private db: DatabaseConnection;
  private autoSave: boolean;

  constructor(config: OracleConfig) {
    this.db = config.db;
    this.autoSave = config.autoSave ?? true;
    this.levelUpSystem = new LevelUpSystem();
    this.profileStore = new AgentProfileStore(this.db);
  }

  /**
   * Submit work for judgment
   */
  async submitForJudgment(
    submission: AgentSubmission,
    contract: Contract,
    validation: { valid: boolean; score: number; errors: string[] }
  ): Promise<Judgment> {
    // Get or create agent profile
    const profile = await this.profileStore.getOrCreate(
      submission.agentId,
      this.extractProvider(submission.agentId),
      this.extractModel(submission.agentId)
    );

    // Determine verdict based on validation
    const verdict = this.determineVerdict(validation, contract);

    // Calculate compliance
    const compliance = this.assessCompliance(submission, contract, validation);

    // Calculate quality scores
    const quality = this.assessQuality(validation, submission);

    // Calculate overall score
    const score = this.calculateOverallScore(validation.score, compliance, quality);

    // Generate feedback
    const feedback = this.generateFeedback(verdict, compliance, quality, validation.errors);

    // Calculate XP to award
    const xpAwarded = this.calculateXP(verdict, score, submission, contract, profile);

    // Check for achievements
    const achievementsUnlocked = await this.checkAchievements(profile, verdict, score, submission);

    // Update agent profile
    const success = verdict === 'approved';
    await this.profileStore.recordTaskCompletion(
      submission.agentId,
      success,
      score,
      xpAwarded,
      submission.cost,
      contract.contract.type
    );

    // Store judgment in history
    await this.storeJudgment(submission, contract, {
      verdict,
      score,
      compliance,
      quality,
      feedback,
      xpAwarded,
      achievementsUnlocked: achievementsUnlocked.map(a => a.id),
    });

    // Save database if autoSave is enabled
    if (this.autoSave) {
      await this.db.save();
    }

    return {
      verdict,
      score,
      compliance,
      quality,
      feedback,
      xpAwarded,
      achievementsUnlocked: achievementsUnlocked.map(a => a.id),
    };
  }

  /**
   * Determine verdict based on validation results
   */
  private determineVerdict(
    validation: { valid: boolean; score: number; errors: string[] },
    contract: Contract
  ): Verdict {
    const threshold = contract.contract.goals.success_threshold;

    if (!validation.valid) {
      // Check severity of errors
      const criticalErrors = validation.errors.filter(e =>
        e.toLowerCase().includes('critical') || e.toLowerCase().includes('missing')
      );

      if (criticalErrors.length > 0) {
        return 'rejected';
      }
      return 'needs_revision';
    }

    if (validation.score >= threshold) {
      return 'approved';
    }

    if (validation.score >= threshold - 2) {
      return 'needs_revision';
    }

    return 'rejected';
  }

  /**
   * Assess compliance with contract
   */
  private assessCompliance(
    submission: AgentSubmission,
    contract: Contract,
    validation: { valid: boolean; errors: string[] }
  ): Compliance {
    return {
      metRequirements: validation.valid && validation.errors.length === 0,
      followedLimitations: !validation.errors.some(e =>
        e.toLowerCase().includes('forbidden') || e.toLowerCase().includes('blocked')
      ),
      schemaValid: validation.valid,
    };
  }

  /**
   * Assess quality of the output
   */
  private assessQuality(
    validation: { score: number },
    submission: AgentSubmission
  ): QualityScores {
    const baseScore = validation.score;

    return {
      accuracy: baseScore,
      completeness: submission.output !== null && submission.output !== undefined ? baseScore : 0,
      consistency: baseScore, // Would need history for true consistency scoring
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    validationScore: number,
    compliance: Compliance,
    quality: QualityScores
  ): number {
    let score = validationScore;

    // Compliance penalties
    if (!compliance.metRequirements) score -= 2;
    if (!compliance.followedLimitations) score -= 3;
    if (!compliance.schemaValid) score -= 1;

    // Quality adjustments
    const avgQuality = (quality.accuracy + quality.completeness + quality.consistency) / 3;
    score = (score + avgQuality) / 2;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Generate feedback based on judgment
   */
  private generateFeedback(
    verdict: Verdict,
    compliance: Compliance,
    quality: QualityScores,
    errors: string[]
  ): string[] {
    const feedback: string[] = [];

    // Verdict-based feedback
    switch (verdict) {
      case 'approved':
        feedback.push('Task completed successfully.');
        break;
      case 'needs_revision':
        feedback.push('Task needs some improvements before approval.');
        break;
      case 'rejected':
        feedback.push('Task did not meet requirements and was rejected.');
        break;
      case 'escalated':
        feedback.push('Task has been escalated for human review.');
        break;
    }

    // Compliance feedback
    if (!compliance.metRequirements) {
      feedback.push('Some requirements were not met.');
    }
    if (!compliance.followedLimitations) {
      feedback.push('Some limitations were violated.');
    }

    // Quality feedback
    if (quality.accuracy >= 9) {
      feedback.push('Excellent accuracy.');
    } else if (quality.accuracy < 6) {
      feedback.push('Accuracy needs improvement.');
    }

    // Include errors
    if (errors.length > 0) {
      feedback.push(`Issues found: ${errors.slice(0, 3).join('; ')}`);
    }

    return feedback;
  }

  /**
   * Calculate XP to award
   */
  private calculateXP(
    verdict: Verdict,
    score: number,
    submission: AgentSubmission,
    contract: Contract,
    _profile: AgentProfile
  ): number {
    // No XP for rejected tasks (positive-only system)
    if (verdict === 'rejected') {
      return 0;
    }

    let xp = 0;

    // Base XP for completion
    if (verdict === 'approved') {
      xp += 10;

      // First try success bonus
      if (!submission.retries || submission.retries === 0) {
        xp += 5;
      }

      // Score-based bonuses
      if (score >= 8) xp += 15;
      if (score >= 9) xp += 25;
      if (score === 10) xp += 50;

      // Under budget bonus
      const costLimit = contract.contract.limits?.cost?.max_usd;
      if (costLimit && submission.cost < costLimit * 0.5) {
        xp += 10;
      }

      // Speed bonus (under 5 seconds)
      if (submission.duration < 5000) {
        xp += 5;
      }
    } else if (verdict === 'needs_revision') {
      // Partial XP for work that needs revision
      xp += 5;
    }

    return xp;
  }

  /**
   * Check and award achievements
   */
  private async checkAchievements(
    profile: AgentProfile,
    verdict: Verdict,
    score: number,
    submission: AgentSubmission
  ): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    const taskType = 'general'; // Would come from contract

    // First task
    if (profile.stats.totalTasks === 0) {
      const achievement = ACHIEVEMENTS['first_task'];
      if (achievement) {
        await this.profileStore.addAchievement(profile.id, achievement);
        unlocked.push({ ...achievement, awardedAt: new Date() });
      }
    }

    // Streak achievements
    const specialization = profile.specializations[taskType];
    if (specialization && verdict === 'approved') {
      const streak = specialization.currentStreak + 1;

      if (streak === 5) {
        const achievement = ACHIEVEMENTS['streak_5'];
        if (achievement) {
          await this.profileStore.addAchievement(profile.id, achievement);
          unlocked.push({ ...achievement, awardedAt: new Date() });
        }
      }

      if (streak === 10) {
        const achievement = ACHIEVEMENTS['streak_10'];
        if (achievement) {
          await this.profileStore.addAchievement(profile.id, achievement);
          unlocked.push({ ...achievement, awardedAt: new Date() });
        }
      }
    }

    // Perfect score
    if (score === 10) {
      const achievement = ACHIEVEMENTS['perfect_score'];
      if (achievement) {
        await this.profileStore.addAchievement(profile.id, achievement);
        unlocked.push({ ...achievement, awardedAt: new Date() });
      }
    }

    // Speed achievement
    if (submission.duration < 5000 && verdict === 'approved') {
      const achievement = ACHIEVEMENTS['speed_demon'];
      if (achievement) {
        await this.profileStore.addAchievement(profile.id, achievement);
        unlocked.push({ ...achievement, awardedAt: new Date() });
      }
    }

    return unlocked;
  }

  /**
   * Store judgment in history
   */
  private async storeJudgment(
    submission: AgentSubmission,
    contract: Contract,
    judgment: Judgment
  ): Promise<void> {
    const id = `jdg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    this.db.run(
      `INSERT INTO judgment_history
       (id, agent_id, contract_id, verdict, score, xp_awarded, compliance_json, quality_json, feedback_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        submission.agentId,
        contract.contract.id,
        judgment.verdict,
        judgment.score,
        judgment.xpAwarded,
        JSON.stringify(judgment.compliance),
        JSON.stringify(judgment.quality),
        JSON.stringify(judgment.feedback),
      ] as SqlValue[]
    );
  }

  /**
   * Get agent profile
   */
  async getProfile(agentId: string): Promise<AgentProfile | undefined> {
    return this.profileStore.getById(agentId);
  }

  /**
   * Get or create agent profile
   */
  async getOrCreateProfile(agentId: string, provider: string, model: string): Promise<AgentProfile> {
    return this.profileStore.getOrCreate(agentId, provider, model);
  }

  /**
   * Get judgment history for an agent
   */
  async getJudgmentHistory(agentId: string, limit: number = 10): Promise<JudgmentRecord[]> {
    const rows = this.db.query<{
      id: string;
      agent_id: string;
      contract_id: string;
      verdict: string;
      score: number;
      xp_awarded: number;
      compliance_json: string;
      quality_json: string;
      feedback_json: string;
      created_at: string;
    }>(
      `SELECT * FROM judgment_history WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?`,
      [agentId, limit] as SqlValue[]
    );

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at),
      sessionId: '',
      workflowId: '',
      nodeId: '',
      agent: {
        id: row.agent_id,
        provider: this.extractProvider(row.agent_id),
        model: this.extractModel(row.agent_id),
        role: 'worker' as const,
        level: 'rookie',
        xp: 0,
      },
      contract: {
        id: row.contract_id,
        type: '',
        requirements: [],
        limitations: [],
      },
      evidence: {
        output: null,
        duration: 0,
        tokenUsage: { input: 0, output: 0 },
        cost: 0,
        retries: 0,
        toolsUsed: [],
      },
      judgment: {
        verdict: row.verdict as Verdict,
        score: row.score,
        compliance: JSON.parse(row.compliance_json) as Compliance,
        quality: JSON.parse(row.quality_json) as QualityScores,
        feedback: JSON.parse(row.feedback_json) as string[],
        xpAwarded: row.xp_awarded,
        achievementsUnlocked: [],
      },
    }));
  }

  /**
   * Get top agents by XP
   */
  async getTopAgents(limit: number = 10): Promise<AgentProfile[]> {
    return this.profileStore.getTopAgents(limit);
  }

  /**
   * Get the level-up system for direct XP calculations
   */
  getLevelUpSystem(): LevelUpSystem {
    return this.levelUpSystem;
  }

  /**
   * Extract provider from agent ID (format: provider/model)
   */
  private extractProvider(agentId: string): string {
    const parts = agentId.split('/');
    return parts[0] ?? 'unknown';
  }

  /**
   * Extract model from agent ID (format: provider/model)
   */
  private extractModel(agentId: string): string {
    const parts = agentId.split('/');
    return parts[1] ?? agentId;
  }

  /**
   * Save database (manual save if autoSave is disabled)
   */
  async save(): Promise<void> {
    await this.db.save();
  }
}
