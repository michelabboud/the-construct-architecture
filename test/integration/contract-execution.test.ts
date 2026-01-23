/**
 * Integration Test: Contract Execution
 *
 * Tests the full flow: load contract -> execute -> validate -> report
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { Architect } from '../../src/architect/architect.js';
import { Sentinels, ActionBlockedError, PathBlockedError } from '../../src/sentinels/sentinels.js';
import { ContractExecutor } from '../../src/agents/contract-executor.js';
import { Worker } from '../../src/programs/worker.js';
import { parseContract, type Contract } from '../../src/architect/schemas/contract.schema.js';

describe('Contract Execution Integration', () => {
  let architect: Architect;
  let sentinels: Sentinels;
  let executor: ContractExecutor;
  let worker: Worker;

  beforeEach(async () => {
    architect = new Architect();
    await architect.initialize();
    sentinels = new Sentinels(architect);
    executor = new ContractExecutor({ architect, sentinels });
    worker = new Worker(sentinels);
  });

  describe('Full execution flow', () => {
    it('should execute a valid contract from YAML', async () => {
      // Load contract from fixture
      const yamlPath = join(__dirname, '..', 'fixtures', 'valid-contract.yaml');
      const yamlContent = await readFile(yamlPath, 'utf-8');
      const parseResult = await parseContract(yamlContent);

      expect(parseResult.valid).toBe(true);
      expect(parseResult.contract).toBeDefined();

      const contract = parseResult.contract!;

      // Execute contract
      const result = await executor.execute(contract);

      expect(result.contractId).toBe('test-001');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.cost).toBe(0); // Placeholder execution has no cost
      expect(result.retries).toBe(0);
    });

    it('should validate contract against Architect rules', async () => {
      const contract: Contract = {
        contract: {
          id: 'validation-test',
          version: '1.0.0',
          type: 'test',
          name: 'Validation Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test Architect validation',
          },
          goals: {
            objectives: ['Pass validation'],
            success_threshold: 5.0,
          },
          limitations: {
            forbidden_paths: [
              { pattern: '**/test/**', reason: 'Test directory' },
            ],
          },
        },
      };

      const validation = architect.validateContract(contract);

      expect(validation.valid).toBe(true);
    });

    it('should fail for invalid contract structure', async () => {
      const invalidContract = {
        contract: {
          id: 'invalid',
          // Missing required fields
        },
      } as Contract;

      const result = await executor.execute(invalidContract);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });
  });

  describe('Path blocking', () => {
    it('should block execution when contract targets forbidden path', async () => {
      const contract: Contract = {
        contract: {
          id: 'path-test',
          version: '1.0.0',
          type: 'test',
          name: 'Path Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test path blocking',
            deliverables: [
              {
                type: 'file',
                save_to: '/project/node_modules/malicious.js',
              },
            ],
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
        },
      };

      // Verify path is blocked by Sentinels
      await expect(
        sentinels.checkPath('/project/node_modules/malicious.js', 'write', contract)
      ).rejects.toThrow(PathBlockedError);
    });

    it('should block paths defined in contract limitations', async () => {
      const contract: Contract = {
        contract: {
          id: 'custom-path-test',
          version: '1.0.0',
          type: 'test',
          name: 'Custom Path Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test custom path blocking',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {
            forbidden_paths: [
              { pattern: '**/secret/**', reason: 'Secret files' },
              { pattern: '**/private/**', reason: 'Private directory' },
            ],
          },
        },
      };

      await expect(
        sentinels.checkPath('/home/user/secret/password.txt', 'read', contract)
      ).rejects.toThrow(PathBlockedError);

      await expect(
        sentinels.checkPath('/app/private/config.json', 'write', contract)
      ).rejects.toThrow(PathBlockedError);
    });
  });

  describe('Action blocking', () => {
    it('should block forbidden actions', async () => {
      const contract: Contract = {
        contract: {
          id: 'action-test',
          version: '1.0.0',
          type: 'test',
          name: 'Action Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test action blocking',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {
            forbidden_actions: ['SEND_EMAIL', 'EXTERNAL_API_CALL'],
          },
        },
      };

      await expect(
        sentinels.checkAction({ type: 'SEND_EMAIL' }, contract)
      ).rejects.toThrow(ActionBlockedError);

      await expect(
        sentinels.checkAction({ type: 'EXTERNAL_API_CALL' }, contract)
      ).rejects.toThrow(ActionBlockedError);

      // Should allow non-forbidden actions
      await expect(
        sentinels.checkAction({ type: 'GENERATE_IMAGE' }, contract)
      ).resolves.toBeUndefined();
    });

    it('should always block Architect-level forbidden actions', async () => {
      const contract: Contract = {
        contract: {
          id: 'architect-action-test',
          version: '1.0.0',
          type: 'test',
          name: 'Architect Action Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test Architect action blocking',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {}, // Contract doesn't forbid DELETE, but Architect does
        },
      };

      await expect(
        sentinels.checkAction({ type: 'DELETE' }, contract)
      ).rejects.toThrow(ActionBlockedError);

      await expect(
        sentinels.checkAction({ type: 'EXECUTE_SHELL' }, contract)
      ).rejects.toThrow(ActionBlockedError);
    });
  });

  describe('Output validation', () => {
    it('should validate output and return score', async () => {
      const contract: Contract = {
        contract: {
          id: 'output-test',
          version: '1.0.0',
          type: 'test',
          name: 'Output Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test output validation',
          },
          goals: {
            objectives: ['Produce valid output'],
            success_threshold: 7.0,
          },
          limitations: {},
        },
      };

      const output = { result: 'success', data: { key: 'value' } };
      const validation = await sentinels.validateOutput(output, contract);

      expect(validation.valid).toBe(true);
      expect(validation.score).toBe(10);
      expect(validation.errors).toHaveLength(0);
      expect(sentinels.meetsThreshold(validation, contract)).toBe(true);
    });

    it('should fail validation for null output', async () => {
      const contract: Contract = {
        contract: {
          id: 'null-output-test',
          version: '1.0.0',
          type: 'test',
          name: 'Null Output Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test null output handling',
          },
          goals: {
            objectives: [],
            success_threshold: 8.0, // Higher threshold - null output scores 7.0
          },
          limitations: {},
        },
      };

      const validation = await sentinels.validateOutput(null, contract);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      // Score is 7.0 (10 - 3 for critical error), threshold is 8.0
      expect(validation.score).toBe(7);
      expect(sentinels.meetsThreshold(validation, contract)).toBe(false);
    });
  });

  describe('Tool validation', () => {
    it('should validate tools against contract resources', () => {
      const contract: Contract = {
        contract: {
          id: 'tool-test',
          version: '1.0.0',
          type: 'image_generation',
          name: 'Tool Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test tool validation',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
          resources: {
            tools: {
              allowed: ['mcp://visual-forge/*', 'mcp://quality-inspector/*'],
              forbidden: ['bash://*', 'shell://*'],
            },
          },
        },
      };

      // Allowed tools
      expect(sentinels.checkTool('mcp://visual-forge/generate_image', contract)).toBe(true);
      expect(sentinels.checkTool('mcp://quality-inspector/analyze', contract)).toBe(true);

      // Forbidden tools
      expect(() => sentinels.checkTool('bash://execute', contract)).toThrow(ActionBlockedError);
      expect(() => sentinels.checkTool('shell://run', contract)).toThrow(ActionBlockedError);

      // Not in allowed list
      expect(() => sentinels.checkTool('mcp://other/action', contract)).toThrow(ActionBlockedError);
    });
  });

  describe('Worker execution', () => {
    it('should execute a task and validate output', async () => {
      const contract: Contract = {
        contract: {
          id: 'worker-test',
          version: '1.0.0',
          type: 'test',
          name: 'Worker Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test worker execution',
          },
          goals: {
            objectives: ['Execute task'],
            success_threshold: 5.0,
          },
          limitations: {},
        },
      };

      const task = {
        id: 'task-001',
        type: 'test',
        description: 'Test task',
        inputs: { prompt: 'Generate something' },
        expectedOutput: 'string',
      };

      const result = await worker.execute(task, contract);

      expect(result.taskId).toBe('task-001');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.success).toBe(true); // Placeholder returns valid output
    });
  });

  describe('Cost and time limits', () => {
    it('should track cost limits from contract', async () => {
      const contract: Contract = {
        contract: {
          id: 'limits-test',
          version: '1.0.0',
          type: 'test',
          name: 'Limits Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test cost limits',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
          limits: {
            cost: {
              max_usd: 0.10,
              warn_at: 0.08,
            },
            time: {
              max_duration_ms: 30000,
              warn_at_ms: 20000,
            },
            retries: {
              max_attempts: 3,
              backoff: 'exponential',
            },
          },
        },
      };

      const result = await executor.execute(contract);

      // Placeholder execution should complete within limits
      expect(result.cost).toBeLessThan(contract.contract.limits!.cost!.max_usd);
      expect(result.duration).toBeLessThan(contract.contract.limits!.time!.max_duration_ms);
    });
  });
});
