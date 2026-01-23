/**
 * Integration Test: Oracle Integration with ContractExecutor
 *
 * Tests the full flow: execute contract -> Oracle judgment -> XP award
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { Architect } from '../../src/architect/architect.js';
import { Sentinels } from '../../src/sentinels/sentinels.js';
import { ContractExecutor } from '../../src/agents/contract-executor.js';
import { Oracle } from '../../src/oracle/oracle.js';
import { DatabaseConnection, initDatabase } from '../../src/oracle/database.js';
import type { Contract } from '../../src/architect/schemas/contract.schema.js';

describe('Oracle Integration with ContractExecutor', () => {
  let architect: Architect;
  let sentinels: Sentinels;
  let db: DatabaseConnection;
  let oracle: Oracle;
  let executor: ContractExecutor;

  const createContract = (overrides: Partial<Contract['contract']> = {}): Contract => ({
    contract: {
      id: `contract-${Date.now()}`,
      version: '1.0.0',
      type: 'test',
      name: 'Test Contract',
      metadata: {
        created_at: '2026-01-23T12:00:00Z',
        created_by: 'test',
        priority: 'normal',
        tags: [],
      },
      requirements: {
        description: 'Test requirements',
      },
      goals: {
        objectives: ['Test objective'],
        success_threshold: 7.0,
      },
      limitations: {},
      ...overrides,
    },
  });

  beforeEach(async () => {
    await initDatabase();
    architect = new Architect();
    await architect.initialize();
    sentinels = new Sentinels(architect);
    db = new DatabaseConnection(':memory:');
    await db.open();
    oracle = new Oracle({ db, autoSave: false });
    executor = new ContractExecutor({
      architect,
      sentinels,
      oracle,
      agentId: 'test/agent',
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Contract execution with Oracle judgment', () => {
    it('should return judgment after successful execution', async () => {
      const contract = createContract();

      const result = await executor.execute(contract);

      expect(result.judgment).toBeDefined();
      expect(result.judgment?.verdict).toBe('approved');
      expect(result.judgment?.xpAwarded).toBeGreaterThan(0);
    });

    it('should award XP to agent profile', async () => {
      const contract = createContract();

      // First execution
      await executor.execute(contract);

      const profile = await oracle.getProfile('test/agent');

      expect(profile).toBeDefined();
      expect(profile?.xp).toBeGreaterThan(0);
      expect(profile?.stats.totalTasks).toBe(1);
    });

    it('should accumulate XP across multiple executions', async () => {
      const contract1 = createContract({ id: 'contract-1' });
      const contract2 = createContract({ id: 'contract-2' });
      const contract3 = createContract({ id: 'contract-3' });

      await executor.execute(contract1);
      await executor.execute(contract2);
      await executor.execute(contract3);

      const profile = await oracle.getProfile('test/agent');

      expect(profile?.stats.totalTasks).toBe(3);
      expect(profile?.xp).toBeGreaterThan(30); // At least 10 XP per task
    });

    it('should track achievements', async () => {
      const contract = createContract();

      const result = await executor.execute(contract);

      // First task should unlock first_task achievement
      expect(result.judgment?.achievementsUnlocked).toContain('first_task');
    });

    it('should record specialization for task type', async () => {
      const contract = createContract({ type: 'image_generation' });

      await executor.execute(contract);

      const profile = await oracle.getProfile('test/agent');

      expect(profile?.specializations['image_generation']).toBeDefined();
      expect(profile?.specializations['image_generation']?.tasksCompleted).toBe(1);
    });

    it('should provide feedback in judgment', async () => {
      const contract = createContract();

      const result = await executor.execute(contract);

      expect(result.judgment?.feedback).toBeDefined();
      expect(result.judgment?.feedback.length).toBeGreaterThan(0);
    });

    it('should calculate quality scores', async () => {
      const contract = createContract();

      const result = await executor.execute(contract);

      expect(result.judgment?.quality).toBeDefined();
      expect(result.judgment?.quality.accuracy).toBeGreaterThan(0);
      expect(result.judgment?.quality.completeness).toBeGreaterThan(0);
    });

    it('should assess compliance', async () => {
      const contract = createContract();

      const result = await executor.execute(contract);

      expect(result.judgment?.compliance).toBeDefined();
      expect(result.judgment?.compliance.metRequirements).toBe(true);
      expect(result.judgment?.compliance.schemaValid).toBe(true);
    });
  });

  describe('Agent level progression', () => {
    it('should level up agent after reaching XP threshold', async () => {
      // Create executor for a fresh agent
      const newExecutor = new ContractExecutor({
        architect,
        sentinels,
        oracle,
        agentId: 'levelup/agent',
      });

      // Execute multiple contracts to accumulate XP
      // Each approved task with perfect score (10) gives ~110 XP
      // (10 base + 5 first try + 15 score>=8 + 25 score>=9 + 50 perfect + 5 speed)
      // Plus achievements: first_task +10, streak_5 +25
      for (let i = 0; i < 5; i++) {
        await newExecutor.execute(createContract({ id: `levelup-contract-${i}` }));
      }

      const profile = await oracle.getProfile('levelup/agent');

      // With ~110 XP per task + achievements, 5 tasks = ~585 XP
      // trusted threshold is 500 XP
      expect(profile?.level).toBe('trusted');
    });
  });

  describe('Judgment history', () => {
    it('should store judgment history', async () => {
      const contract = createContract();

      await executor.execute(contract);

      const history = await oracle.getJudgmentHistory('test/agent');

      expect(history).toHaveLength(1);
      expect(history[0]?.judgment.verdict).toBe('approved');
    });

    it('should limit judgment history results', async () => {
      for (let i = 0; i < 5; i++) {
        await executor.execute(createContract({ id: `history-contract-${i}` }));
      }

      const limitedHistory = await oracle.getJudgmentHistory('test/agent', 3);

      expect(limitedHistory).toHaveLength(3);
    });
  });

  describe('Leaderboard', () => {
    it('should return top agents by XP', async () => {
      // Create executors for different agents
      const agent1Executor = new ContractExecutor({
        architect,
        sentinels,
        oracle,
        agentId: 'leaderboard/agent1',
      });

      const agent2Executor = new ContractExecutor({
        architect,
        sentinels,
        oracle,
        agentId: 'leaderboard/agent2',
      });

      // Agent 2 executes more contracts
      await agent1Executor.execute(createContract({ id: 'lb-1' }));

      await agent2Executor.execute(createContract({ id: 'lb-2' }));
      await agent2Executor.execute(createContract({ id: 'lb-3' }));
      await agent2Executor.execute(createContract({ id: 'lb-4' }));

      const topAgents = await oracle.getTopAgents(10);

      expect(topAgents.length).toBe(2);
      expect(topAgents[0]?.id).toBe('leaderboard/agent2');
      expect(topAgents[0]?.xp).toBeGreaterThan(topAgents[1]?.xp ?? 0);
    });
  });

  describe('Without Oracle', () => {
    it('should execute without Oracle and return no judgment', async () => {
      const executorWithoutOracle = new ContractExecutor({
        architect,
        sentinels,
        // No Oracle provided
        agentId: 'no-oracle/agent',
      });

      const contract = createContract();
      const result = await executorWithoutOracle.execute(contract);

      expect(result.success).toBe(true);
      expect(result.judgment).toBeUndefined();
    });
  });
});
