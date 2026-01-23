import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AgentProfileStore } from '../src/oracle/agent-profile-store.js';
import { DatabaseConnection, initDatabase } from '../src/oracle/database.js';

describe('AgentProfileStore', () => {
  let db: DatabaseConnection;
  let store: AgentProfileStore;

  beforeEach(async () => {
    await initDatabase();
    db = new DatabaseConnection(':memory:');
    await db.open();
    store = new AgentProfileStore(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('create', () => {
    it('should create a new agent profile', async () => {
      const profile = await store.create({
        id: 'openai/gpt-4',
        provider: 'openai',
        model: 'gpt-4',
        xp: 0,
        level: 'rookie',
      });

      expect(profile.id).toBe('openai/gpt-4');
      expect(profile.provider).toBe('openai');
      expect(profile.model).toBe('gpt-4');
      expect(profile.xp).toBe(0);
      expect(profile.level).toBe('rookie');
      expect(profile.specializations).toEqual({});
      expect(profile.achievements).toEqual([]);
    });

    it('should initialize stats to zero', async () => {
      const profile = await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      expect(profile.stats.totalTasks).toBe(0);
      expect(profile.stats.successRate).toBe(0);
      expect(profile.stats.averageScore).toBe(0);
      expect(profile.stats.totalXpEarned).toBe(0);
      expect(profile.stats.totalCostIncurred).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return undefined for non-existent profile', async () => {
      const profile = await store.getById('unknown/agent');
      expect(profile).toBeUndefined();
    });

    it('should return existing profile', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 100,
        level: 'reliable',
      });

      const profile = await store.getById('test/agent');

      expect(profile).toBeDefined();
      expect(profile?.xp).toBe(100);
      expect(profile?.level).toBe('reliable');
    });
  });

  describe('getOrCreate', () => {
    it('should create profile if not exists', async () => {
      const profile = await store.getOrCreate('new/agent', 'new', 'agent');

      expect(profile.id).toBe('new/agent');
      expect(profile.provider).toBe('new');
      expect(profile.model).toBe('agent');
      expect(profile.level).toBe('rookie');
    });

    it('should return existing profile if exists', async () => {
      await store.create({
        id: 'existing/agent',
        provider: 'existing',
        model: 'agent',
        xp: 500,
        level: 'trusted',
      });

      const profile = await store.getOrCreate('existing/agent', 'existing', 'agent');

      expect(profile.xp).toBe(500);
      expect(profile.level).toBe('trusted');
    });
  });

  describe('update', () => {
    it('should update XP and level', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      const updated = await store.update('test/agent', { xp: 150, level: 'reliable' });

      expect(updated?.xp).toBe(150);
      expect(updated?.level).toBe('reliable');
    });

    it('should return undefined for non-existent profile', async () => {
      const result = await store.update('unknown/agent', { xp: 100 });
      expect(result).toBeUndefined();
    });
  });

  describe('recordTaskCompletion', () => {
    it('should update stats after successful task', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      const profile = await store.recordTaskCompletion(
        'test/agent',
        true, // success
        8.0,  // score
        25,   // xpEarned
        0.01, // costIncurred
        'image_generation' // taskType
      );

      expect(profile?.stats.totalTasks).toBe(1);
      expect(profile?.stats.successRate).toBe(100);
      expect(profile?.stats.averageScore).toBe(8.0);
      expect(profile?.stats.totalXpEarned).toBe(25);
      expect(profile?.xp).toBe(25);
    });

    it('should update stats after failed task', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      const profile = await store.recordTaskCompletion(
        'test/agent',
        false, // failure
        4.0,
        0,
        0.01,
        'test'
      );

      expect(profile?.stats.totalTasks).toBe(1);
      expect(profile?.stats.successRate).toBe(0);
    });

    it('should create specialization for task type', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      const profile = await store.recordTaskCompletion(
        'test/agent',
        true,
        9.0,
        30,
        0.02,
        'code_review'
      );

      expect(profile?.specializations['code_review']).toBeDefined();
      expect(profile?.specializations['code_review']?.tasksCompleted).toBe(1);
      expect(profile?.specializations['code_review']?.avgScore).toBe(9.0);
      expect(profile?.specializations['code_review']?.bestScore).toBe(9.0);
      expect(profile?.specializations['code_review']?.currentStreak).toBe(1);
    });

    it('should update existing specialization', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      // First task
      await store.recordTaskCompletion('test/agent', true, 7.0, 20, 0.01, 'testing');

      // Second task
      const profile = await store.recordTaskCompletion('test/agent', true, 9.0, 30, 0.01, 'testing');

      expect(profile?.specializations['testing']?.tasksCompleted).toBe(2);
      expect(profile?.specializations['testing']?.avgScore).toBe(8.0); // (7+9)/2
      expect(profile?.specializations['testing']?.bestScore).toBe(9.0);
      expect(profile?.specializations['testing']?.currentStreak).toBe(2);
    });

    it('should reset streak on failure', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      // Build up streak
      await store.recordTaskCompletion('test/agent', true, 8.0, 20, 0.01, 'test');
      await store.recordTaskCompletion('test/agent', true, 8.0, 20, 0.01, 'test');

      // Fail
      const profile = await store.recordTaskCompletion('test/agent', false, 4.0, 0, 0.01, 'test');

      expect(profile?.specializations['test']?.currentStreak).toBe(0);
    });

    it('should level up when XP threshold is crossed', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 90,
        level: 'rookie',
      });

      const profile = await store.recordTaskCompletion('test/agent', true, 8.0, 20, 0.01, 'test');

      expect(profile?.xp).toBe(110);
      expect(profile?.level).toBe('reliable');
    });
  });

  describe('addAchievement', () => {
    it('should add achievement to agent', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      await store.addAchievement('test/agent', {
        id: 'first_task',
        name: 'First Steps',
        description: 'Complete your first task',
        xpBonus: 10,
      });

      const profile = await store.getById('test/agent');

      expect(profile?.achievements).toHaveLength(1);
      expect(profile?.achievements[0]?.id).toBe('first_task');
      expect(profile?.achievements[0]?.name).toBe('First Steps');
    });

    it('should not duplicate achievements', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      const achievement = {
        id: 'test_achievement',
        name: 'Test',
        description: 'Test achievement',
        xpBonus: 5,
      };

      await store.addAchievement('test/agent', achievement);
      await store.addAchievement('test/agent', achievement); // Duplicate

      const profile = await store.getById('test/agent');

      expect(profile?.achievements).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('should return all profiles sorted by XP', async () => {
      await store.create({ id: 'low/xp', provider: 'low', model: 'xp', xp: 50, level: 'rookie' });
      await store.create({ id: 'mid/xp', provider: 'mid', model: 'xp', xp: 200, level: 'reliable' });
      await store.create({ id: 'high/xp', provider: 'high', model: 'xp', xp: 1000, level: 'trusted' });

      const all = await store.getAll();

      expect(all).toHaveLength(3);
      expect(all[0]?.id).toBe('high/xp');
      expect(all[1]?.id).toBe('mid/xp');
      expect(all[2]?.id).toBe('low/xp');
    });
  });

  describe('getTopAgents', () => {
    it('should return limited number of top agents', async () => {
      for (let i = 0; i < 10; i++) {
        await store.create({
          id: `agent/${i}`,
          provider: 'test',
          model: `${i}`,
          xp: i * 100,
          level: 'rookie',
        });
      }

      const top = await store.getTopAgents(5);

      expect(top).toHaveLength(5);
      expect(top[0]?.xp).toBe(900);
    });
  });

  describe('delete', () => {
    it('should delete profile and related data', async () => {
      await store.create({
        id: 'test/agent',
        provider: 'test',
        model: 'agent',
        xp: 0,
        level: 'rookie',
      });

      await store.addAchievement('test/agent', {
        id: 'test',
        name: 'Test',
        description: 'Test',
        xpBonus: 5,
      });

      await store.recordTaskCompletion('test/agent', true, 8.0, 20, 0.01, 'test');

      const deleted = await store.delete('test/agent');

      expect(deleted).toBe(true);
      expect(await store.getById('test/agent')).toBeUndefined();
    });

    it('should return false for non-existent profile', async () => {
      const deleted = await store.delete('unknown/agent');
      expect(deleted).toBe(false);
    });
  });
});
