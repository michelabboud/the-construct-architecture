import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Oracle } from '../src/oracle/oracle.js';
import { DatabaseConnection, initDatabase } from '../src/oracle/database.js';
import type { Contract } from '../src/architect/schemas/contract.schema.js';
import type { AgentSubmission } from '../src/types/judgment.js';

describe('Oracle', () => {
  let db: DatabaseConnection;
  let oracle: Oracle;

  const createContract = (overrides: Partial<Contract['contract']> = {}): Contract => ({
    contract: {
      id: 'test-contract',
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

  const createSubmission = (overrides: Partial<AgentSubmission> = {}): AgentSubmission => ({
    agentId: 'openai/gpt-4',
    contractId: 'test-contract',
    output: { result: 'success' },
    duration: 1000,
    cost: 0.01,
    ...overrides,
  });

  beforeEach(async () => {
    await initDatabase();
    db = new DatabaseConnection(':memory:');
    await db.open();
    oracle = new Oracle({ db, autoSave: false });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('submitForJudgment', () => {
    it('should approve a successful submission', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: true, score: 8.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('approved');
      expect(judgment.score).toBeGreaterThan(0);
      expect(judgment.xpAwarded).toBeGreaterThan(0);
    });

    it('should reject an invalid submission', async () => {
      const contract = createContract();
      const submission = createSubmission({ output: null });
      const validation = { valid: false, score: 3.0, errors: ['Critical error: output missing'] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('rejected');
      expect(judgment.xpAwarded).toBe(0); // No XP for rejected
    });

    it('should mark as needs_revision for partial failure', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: false, score: 6.0, errors: ['Minor issue found'] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('needs_revision');
      expect(judgment.xpAwarded).toBe(5); // Partial XP
    });

    it('should award bonus XP for high scores', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: true, score: 9.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.xpAwarded).toBeGreaterThan(30); // Base + score bonuses
    });

    it('should award speed bonus for fast completion', async () => {
      const contract = createContract();
      const submission = createSubmission({ duration: 2000 }); // Under 5 seconds
      const validation = { valid: true, score: 8.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      // Should include speed bonus
      expect(judgment.xpAwarded).toBeGreaterThanOrEqual(35); // 10 base + 5 first try + 15 score + 5 speed
    });

    it('should award first task achievement', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: true, score: 8.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.achievementsUnlocked).toContain('first_task');
    });

    it('should create agent profile on first submission', async () => {
      const contract = createContract();
      const submission = createSubmission({ agentId: 'anthropic/claude-3' });
      const validation = { valid: true, score: 8.0, errors: [] };

      await oracle.submitForJudgment(submission, contract, validation);

      const profile = await oracle.getProfile('anthropic/claude-3');
      expect(profile).toBeDefined();
      expect(profile?.provider).toBe('anthropic');
      expect(profile?.model).toBe('claude-3');
    });

    it('should accumulate XP across submissions', async () => {
      const contract = createContract();
      const validation = { valid: true, score: 8.0, errors: [] };

      // First submission
      await oracle.submitForJudgment(
        createSubmission({ agentId: 'test/model' }),
        contract,
        validation
      );

      // Second submission
      await oracle.submitForJudgment(
        createSubmission({ agentId: 'test/model' }),
        contract,
        validation
      );

      const profile = await oracle.getProfile('test/model');
      expect(profile?.xp).toBeGreaterThan(30); // At least 30 XP from two tasks
      expect(profile?.stats.totalTasks).toBe(2);
    });
  });

  describe('getProfile', () => {
    it('should return undefined for unknown agent', async () => {
      const profile = await oracle.getProfile('unknown/agent');
      expect(profile).toBeUndefined();
    });

    it('should return profile with correct structure', async () => {
      const contract = createContract();
      const submission = createSubmission({ agentId: 'google/gemini' });
      const validation = { valid: true, score: 8.0, errors: [] };

      await oracle.submitForJudgment(submission, contract, validation);

      const profile = await oracle.getProfile('google/gemini');

      expect(profile).toMatchObject({
        id: 'google/gemini',
        provider: 'google',
        model: 'gemini',
        level: 'rookie',
      });
      expect(profile?.stats.totalTasks).toBe(1);
      expect(profile?.stats.successRate).toBe(100);
    });
  });

  describe('getJudgmentHistory', () => {
    it('should return empty array for new agent', async () => {
      const history = await oracle.getJudgmentHistory('new/agent');
      expect(history).toHaveLength(0);
    });

    it('should return judgment history', async () => {
      const contract = createContract();
      const submission = createSubmission({ agentId: 'test/agent' });
      const validation = { valid: true, score: 8.0, errors: [] };

      await oracle.submitForJudgment(submission, contract, validation);

      const history = await oracle.getJudgmentHistory('test/agent');

      expect(history).toHaveLength(1);
      expect(history[0]?.judgment.verdict).toBe('approved');
    });

    it('should limit results', async () => {
      const contract = createContract();
      const validation = { valid: true, score: 8.0, errors: [] };

      // Submit 5 tasks
      for (let i = 0; i < 5; i++) {
        await oracle.submitForJudgment(
          createSubmission({ agentId: 'test/agent' }),
          contract,
          validation
        );
      }

      const history = await oracle.getJudgmentHistory('test/agent', 3);

      expect(history).toHaveLength(3);
    });
  });

  describe('getTopAgents', () => {
    it('should return agents sorted by XP', async () => {
      const contract = createContract();
      const validationHigh = { valid: true, score: 10.0, errors: [] };
      const validationLow = { valid: true, score: 7.0, errors: [] };

      // Agent with low XP
      await oracle.submitForJudgment(
        createSubmission({ agentId: 'low/xp' }),
        contract,
        validationLow
      );

      // Agent with high XP (multiple tasks, high scores)
      for (let i = 0; i < 3; i++) {
        await oracle.submitForJudgment(
          createSubmission({ agentId: 'high/xp' }),
          contract,
          validationHigh
        );
      }

      const topAgents = await oracle.getTopAgents(10);

      expect(topAgents.length).toBe(2);
      expect(topAgents[0]?.id).toBe('high/xp');
      expect(topAgents[0]?.xp).toBeGreaterThan(topAgents[1]?.xp ?? 0);
    });
  });

  describe('Verdict determination', () => {
    it('should approve when score meets threshold', async () => {
      const contract = createContract({ goals: { objectives: [], success_threshold: 7.0 } });
      const submission = createSubmission();
      const validation = { valid: true, score: 7.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('approved');
    });

    it('should reject when score is far below threshold', async () => {
      const contract = createContract({ goals: { objectives: [], success_threshold: 8.0 } });
      const submission = createSubmission();
      const validation = { valid: true, score: 4.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('rejected');
    });

    it('should needs_revision when score is slightly below threshold', async () => {
      const contract = createContract({ goals: { objectives: [], success_threshold: 8.0 } });
      const submission = createSubmission();
      const validation = { valid: true, score: 6.5, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.verdict).toBe('needs_revision');
    });
  });

  describe('Compliance assessment', () => {
    it('should detect violated limitations', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: false, score: 5.0, errors: ['Forbidden path accessed'] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.compliance.followedLimitations).toBe(false);
    });

    it('should detect unmet requirements', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: false, score: 5.0, errors: ['Requirement not met'] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.compliance.metRequirements).toBe(false);
    });
  });

  describe('Feedback generation', () => {
    it('should include verdict-based feedback', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: true, score: 8.0, errors: [] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.feedback.some(f => f.includes('successfully'))).toBe(true);
    });

    it('should include errors in feedback', async () => {
      const contract = createContract();
      const submission = createSubmission();
      const validation = { valid: false, score: 5.0, errors: ['Something went wrong'] };

      const judgment = await oracle.submitForJudgment(submission, contract, validation);

      expect(judgment.feedback.some(f => f.includes('Issues found'))).toBe(true);
    });
  });
});
