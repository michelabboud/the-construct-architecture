/**
 * Level-Up System - XP and Agent Leveling
 *
 * Positive-only: good work earns XP, bad work earns 0 (not negative).
 *
 * Phase 2 Implementation (placeholder for Phase 1)
 */

import {
  type AgentLevel,
  type AgentProfile,
  type XPEvent,
  type XPAward,
  type LevelUpResult,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
} from '../types/agent.js';

/**
 * Level-Up System
 *
 * TODO Phase 2:
 * - Track XP per agent/provider/model
 * - Handle level transitions
 * - Award achievements
 */
export class LevelUpSystem {
  /**
   * Award XP for an event
   */
  awardXP(profile: AgentProfile, event: XPEvent): XPAward {
    const xpAwarded = XP_REWARDS[event.type] || 0;

    const newTotalXp = profile.xp + xpAwarded;
    const levelUp = this.checkLevelUp(profile, newTotalXp);

    return {
      agentId: event.agentId,
      event: event.type,
      xpAwarded,
      totalXp: newTotalXp,
      levelUp,
    };
  }

  /**
   * Check if agent should level up
   */
  checkLevelUp(profile: AgentProfile, newXp: number): LevelUpResult | undefined {
    const currentLevel = profile.level;
    const newLevel = this.calculateLevel(newXp);

    if (newLevel !== currentLevel) {
      return {
        agentId: profile.id,
        previousLevel: currentLevel,
        newLevel,
        totalXp: newXp,
        timestamp: new Date(),
      };
    }

    return undefined;
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): AgentLevel {
    if (xp >= LEVEL_THRESHOLDS.expert) return 'expert';
    if (xp >= LEVEL_THRESHOLDS.trusted) return 'trusted';
    if (xp >= LEVEL_THRESHOLDS.reliable) return 'reliable';
    return 'rookie';
  }

  /**
   * Get XP needed for next level
   */
  getXpToNextLevel(profile: AgentProfile): number {
    const currentLevel = profile.level;
    const levels: AgentLevel[] = ['rookie', 'reliable', 'trusted', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex >= levels.length - 1) {
      return 0; // Already at max level
    }

    const nextLevel = levels[currentIndex + 1];
    return LEVEL_THRESHOLDS[nextLevel] - profile.xp;
  }
}
