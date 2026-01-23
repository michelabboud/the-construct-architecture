import { describe, it, expect } from '@jest/globals';
import { LevelUpSystem } from '../src/oracle/level-up.js';
import {
  type AgentProfile,
  type XPEvent,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
} from '../src/types/agent.js';

describe('LevelUpSystem', () => {
  const levelUpSystem = new LevelUpSystem();

  const createProfile = (overrides: Partial<AgentProfile> = {}): AgentProfile => ({
    id: 'test/agent',
    provider: 'test',
    model: 'agent',
    xp: 0,
    level: 'rookie',
    specializations: {},
    achievements: [],
    stats: {
      totalTasks: 0,
      totalXpEarned: 0,
      totalCostIncurred: 0,
      averageScore: 0,
      successRate: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createEvent = (type: XPEvent['type'], overrides: Partial<XPEvent> = {}): XPEvent => ({
    type,
    agentId: 'test/agent',
    contractId: 'test-contract',
    taskType: 'test',
    ...overrides,
  });

  describe('awardXP', () => {
    it('should award XP for task completion', () => {
      const profile = createProfile({ xp: 0 });
      const event = createEvent('task_completed');

      const award = levelUpSystem.awardXP(profile, event);

      expect(award.xpAwarded).toBe(XP_REWARDS.task_completed);
      expect(award.totalXp).toBe(XP_REWARDS.task_completed);
    });

    it('should award bonus XP for first try success', () => {
      const profile = createProfile({ xp: 50 });
      const event = createEvent('first_try_success');

      const award = levelUpSystem.awardXP(profile, event);

      expect(award.xpAwarded).toBe(XP_REWARDS.first_try_success);
      expect(award.totalXp).toBe(50 + XP_REWARDS.first_try_success);
    });

    it('should award XP for high scores', () => {
      const profile = createProfile({ xp: 0 });
      const scoreAbove8 = createEvent('score_above_8');
      const scoreAbove9 = createEvent('score_above_9');
      const perfectScore = createEvent('perfect_score');

      expect(levelUpSystem.awardXP(profile, scoreAbove8).xpAwarded).toBe(XP_REWARDS.score_above_8);
      expect(levelUpSystem.awardXP(profile, scoreAbove9).xpAwarded).toBe(XP_REWARDS.score_above_9);
      expect(levelUpSystem.awardXP(profile, perfectScore).xpAwarded).toBe(XP_REWARDS.perfect_score);
    });

    it('should award streak bonuses', () => {
      const profile = createProfile({ xp: 0 });

      expect(levelUpSystem.awardXP(profile, createEvent('streak_5')).xpAwarded).toBe(XP_REWARDS.streak_5);
      expect(levelUpSystem.awardXP(profile, createEvent('streak_10')).xpAwarded).toBe(XP_REWARDS.streak_10);
      expect(levelUpSystem.awardXP(profile, createEvent('streak_25')).xpAwarded).toBe(XP_REWARDS.streak_25);
    });

    it('should include level up result when crossing threshold', () => {
      // Just below reliable threshold
      const profile = createProfile({ xp: LEVEL_THRESHOLDS.reliable - 5, level: 'rookie' });
      const event = createEvent('task_completed'); // Awards 10 XP

      const award = levelUpSystem.awardXP(profile, event);

      expect(award.levelUp).toBeDefined();
      expect(award.levelUp?.previousLevel).toBe('rookie');
      expect(award.levelUp?.newLevel).toBe('reliable');
    });

    it('should not include level up when staying at same level', () => {
      const profile = createProfile({ xp: 10, level: 'rookie' });
      const event = createEvent('task_completed');

      const award = levelUpSystem.awardXP(profile, event);

      expect(award.levelUp).toBeUndefined();
    });
  });

  describe('calculateLevel', () => {
    it('should return rookie for XP below reliable threshold', () => {
      expect(levelUpSystem.calculateLevel(0)).toBe('rookie');
      expect(levelUpSystem.calculateLevel(50)).toBe('rookie');
      expect(levelUpSystem.calculateLevel(99)).toBe('rookie');
    });

    it('should return reliable for XP at or above reliable threshold', () => {
      expect(levelUpSystem.calculateLevel(100)).toBe('reliable');
      expect(levelUpSystem.calculateLevel(250)).toBe('reliable');
      expect(levelUpSystem.calculateLevel(499)).toBe('reliable');
    });

    it('should return trusted for XP at or above trusted threshold', () => {
      expect(levelUpSystem.calculateLevel(500)).toBe('trusted');
      expect(levelUpSystem.calculateLevel(1000)).toBe('trusted');
      expect(levelUpSystem.calculateLevel(1999)).toBe('trusted');
    });

    it('should return expert for XP at or above expert threshold', () => {
      expect(levelUpSystem.calculateLevel(2000)).toBe('expert');
      expect(levelUpSystem.calculateLevel(5000)).toBe('expert');
      expect(levelUpSystem.calculateLevel(10000)).toBe('expert');
    });
  });

  describe('checkLevelUp', () => {
    it('should return level up result when level changes', () => {
      const profile = createProfile({ xp: 50, level: 'rookie' });

      const result = levelUpSystem.checkLevelUp(profile, 150);

      expect(result).toBeDefined();
      expect(result?.previousLevel).toBe('rookie');
      expect(result?.newLevel).toBe('reliable');
      expect(result?.totalXp).toBe(150);
    });

    it('should return undefined when level stays the same', () => {
      const profile = createProfile({ xp: 50, level: 'rookie' });

      const result = levelUpSystem.checkLevelUp(profile, 75);

      expect(result).toBeUndefined();
    });

    it('should handle multiple level jumps', () => {
      const profile = createProfile({ xp: 0, level: 'rookie' });

      const result = levelUpSystem.checkLevelUp(profile, 600);

      expect(result).toBeDefined();
      expect(result?.previousLevel).toBe('rookie');
      expect(result?.newLevel).toBe('trusted'); // Skipped reliable
    });
  });

  describe('getXpToNextLevel', () => {
    it('should return XP needed for next level', () => {
      const rookieProfile = createProfile({ xp: 50, level: 'rookie' });
      const reliableProfile = createProfile({ xp: 200, level: 'reliable' });
      const trustedProfile = createProfile({ xp: 1000, level: 'trusted' });

      expect(levelUpSystem.getXpToNextLevel(rookieProfile)).toBe(50); // 100 - 50
      expect(levelUpSystem.getXpToNextLevel(reliableProfile)).toBe(300); // 500 - 200
      expect(levelUpSystem.getXpToNextLevel(trustedProfile)).toBe(1000); // 2000 - 1000
    });

    it('should return 0 for expert level', () => {
      const expertProfile = createProfile({ xp: 5000, level: 'expert' });

      expect(levelUpSystem.getXpToNextLevel(expertProfile)).toBe(0);
    });
  });

  describe('XP thresholds', () => {
    it('should have correct threshold values', () => {
      expect(LEVEL_THRESHOLDS.rookie).toBe(0);
      expect(LEVEL_THRESHOLDS.reliable).toBe(100);
      expect(LEVEL_THRESHOLDS.trusted).toBe(500);
      expect(LEVEL_THRESHOLDS.expert).toBe(2000);
    });
  });

  describe('XP rewards', () => {
    it('should have correct reward values', () => {
      expect(XP_REWARDS.task_completed).toBe(10);
      expect(XP_REWARDS.first_try_success).toBe(5);
      expect(XP_REWARDS.score_above_8).toBe(15);
      expect(XP_REWARDS.score_above_9).toBe(25);
      expect(XP_REWARDS.perfect_score).toBe(50);
      expect(XP_REWARDS.under_budget).toBe(10);
      expect(XP_REWARDS.fast_completion).toBe(5);
      expect(XP_REWARDS.streak_5).toBe(25);
      expect(XP_REWARDS.streak_10).toBe(50);
      expect(XP_REWARDS.streak_25).toBe(100);
    });
  });
});
