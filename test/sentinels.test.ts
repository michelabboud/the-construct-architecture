import { describe, it, expect, beforeEach } from '@jest/globals';
import { Architect } from '../src/architect/architect.js';
import {
  Sentinels,
  ActionBlockedError,
  PathBlockedError,
  type Action,
} from '../src/sentinels/sentinels.js';
import type { Contract } from '../src/architect/schemas/contract.schema.js';

describe('Sentinels', () => {
  let architect: Architect;
  let sentinels: Sentinels;

  const createMinimalContract = (overrides: Partial<Contract['contract']> = {}): Contract => ({
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

  beforeEach(async () => {
    architect = new Architect();
    await architect.initialize();
    sentinels = new Sentinels(architect);
  });

  describe('checkAction', () => {
    it('should allow valid actions', async () => {
      const contract = createMinimalContract();
      const action: Action = { type: 'READ' };

      await expect(sentinels.checkAction(action, contract)).resolves.toBeUndefined();
    });

    it('should block forbidden actions from Architect', async () => {
      const contract = createMinimalContract();
      const action: Action = { type: 'DELETE' };

      await expect(sentinels.checkAction(action, contract)).rejects.toThrow(ActionBlockedError);
    });

    it('should block forbidden actions from contract', async () => {
      const contract = createMinimalContract({
        limitations: {
          forbidden_actions: ['SEND_EMAIL'],
        },
      });
      const action: Action = { type: 'SEND_EMAIL' };

      await expect(sentinels.checkAction(action, contract)).rejects.toThrow(ActionBlockedError);
    });

    it('should check path when action includes path', async () => {
      const contract = createMinimalContract({
        limitations: {
          forbidden_paths: [
            { pattern: '**/secret/**', reason: 'Secret files' },
          ],
        },
      });
      const action: Action = {
        type: 'WRITE',
        path: '/home/user/secret/password.txt',
        operation: 'write',
      };

      await expect(sentinels.checkAction(action, contract)).rejects.toThrow(PathBlockedError);
    });

    it('should check tool when action includes tool', async () => {
      const contract = createMinimalContract({
        resources: {
          tools: {
            forbidden: ['bash://'],
          },
        },
      });
      const action: Action = {
        type: 'TOOL_CALL',
        tool: 'bash://execute',
      };

      await expect(sentinels.checkAction(action, contract)).rejects.toThrow(ActionBlockedError);
    });
  });

  describe('checkPath', () => {
    it('should allow valid paths', async () => {
      const contract = createMinimalContract();

      await expect(
        sentinels.checkPath('/home/user/project/file.ts', 'read', contract)
      ).resolves.toBeUndefined();
    });

    it('should block paths forbidden by Architect', async () => {
      const contract = createMinimalContract();

      await expect(
        sentinels.checkPath('/project/node_modules/index.js', 'read', contract)
      ).rejects.toThrow(PathBlockedError);
    });

    it('should block paths forbidden by contract', async () => {
      const contract = createMinimalContract({
        limitations: {
          forbidden_paths: [
            { pattern: '**/private/**', reason: 'Private directory' },
          ],
        },
      });

      await expect(
        sentinels.checkPath('/home/user/private/secrets.txt', 'read', contract)
      ).rejects.toThrow(PathBlockedError);
    });

    it('should include reason in PathBlockedError', async () => {
      const contract = createMinimalContract({
        limitations: {
          forbidden_paths: [
            { pattern: '**/config/**', reason: 'Configuration files are off-limits' },
          ],
        },
      });

      try {
        await sentinels.checkPath('/app/config/database.yml', 'read', contract);
        throw new Error('Should have thrown PathBlockedError');
      } catch (error) {
        expect(error).toBeInstanceOf(PathBlockedError);
        expect((error as PathBlockedError).reason).toBe('Configuration files are off-limits');
      }
    });
  });

  describe('checkTool', () => {
    it('should allow tools when no restrictions exist', () => {
      const contract = createMinimalContract();

      expect(sentinels.checkTool('mcp://visual-forge/generate_image', contract)).toBe(true);
    });

    it('should allow tools in allowed list', () => {
      const contract = createMinimalContract({
        resources: {
          tools: {
            allowed: ['mcp://visual-forge/*'],
          },
        },
      });

      expect(sentinels.checkTool('mcp://visual-forge/generate_image', contract)).toBe(true);
    });

    it('should block tools in forbidden list', () => {
      const contract = createMinimalContract({
        resources: {
          tools: {
            forbidden: ['bash://'],
          },
        },
      });

      expect(() => sentinels.checkTool('bash://execute', contract)).toThrow(ActionBlockedError);
    });

    it('should block tools not in allowed list', () => {
      const contract = createMinimalContract({
        resources: {
          tools: {
            allowed: ['mcp://visual-forge/*'],
          },
        },
      });

      expect(() => sentinels.checkTool('mcp://other-service/action', contract)).toThrow(
        ActionBlockedError
      );
    });
  });

  describe('validateOutput', () => {
    it('should return valid=true for non-null output', async () => {
      const contract = createMinimalContract();
      const output = { result: 'success' };

      const result = await sentinels.validateOutput(output, contract);

      expect(result.valid).toBe(true);
      expect(result.score).toBe(10);
    });

    it('should return valid=false for null output', async () => {
      const contract = createMinimalContract();

      const result = await sentinels.validateOutput(null, contract);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.code).toBe('OUTPUT_MISSING');
    });

    it('should return valid=false for undefined output', async () => {
      const contract = createMinimalContract();

      const result = await sentinels.validateOutput(undefined, contract);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'OUTPUT_MISSING')).toBe(true);
    });

    it('should calculate score based on errors', async () => {
      const contract = createMinimalContract();

      const result = await sentinels.validateOutput(null, contract);

      // Score should be reduced due to critical error
      expect(result.score).toBeLessThan(10);
    });

    it('should not go below 0 score', async () => {
      const contract = createMinimalContract();

      const result = await sentinels.validateOutput(null, contract);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('meetsThreshold', () => {
    it('should return true when score meets threshold', () => {
      const contract = createMinimalContract({
        goals: {
          objectives: [],
          success_threshold: 7.0,
        },
      });

      const result = {
        valid: true,
        score: 8.0,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      expect(sentinels.meetsThreshold(result, contract)).toBe(true);
    });

    it('should return true when score equals threshold', () => {
      const contract = createMinimalContract({
        goals: {
          objectives: [],
          success_threshold: 7.0,
        },
      });

      const result = {
        valid: true,
        score: 7.0,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      expect(sentinels.meetsThreshold(result, contract)).toBe(true);
    });

    it('should return false when score is below threshold', () => {
      const contract = createMinimalContract({
        goals: {
          objectives: [],
          success_threshold: 7.0,
        },
      });

      const result = {
        valid: true,
        score: 6.0,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      expect(sentinels.meetsThreshold(result, contract)).toBe(false);
    });
  });

  describe('Error classes', () => {
    it('ActionBlockedError should contain action and reason', () => {
      const action: Action = { type: 'DELETE', path: '/file.txt' };
      const error = new ActionBlockedError(action, 'Deletion is forbidden');

      expect(error.action).toBe(action);
      expect(error.reason).toBe('Deletion is forbidden');
      expect(error.message).toContain('blocked');
      expect(error.name).toBe('ActionBlockedError');
    });

    it('PathBlockedError should contain path and reason', () => {
      const error = new PathBlockedError('/secret/file.txt', 'Secret directory');

      expect(error.path).toBe('/secret/file.txt');
      expect(error.reason).toBe('Secret directory');
      expect(error.message).toContain('blocked');
      expect(error.name).toBe('PathBlockedError');
    });
  });

  describe('Integration with Architect', () => {
    it('should use Architect rules for path validation', async () => {
      const contract = createMinimalContract();

      // This should be blocked by Architect's default rules
      await expect(
        sentinels.checkPath('/project/.git/config', 'read', contract)
      ).rejects.toThrow(PathBlockedError);
    });

    it('should use Architect rules for action validation', async () => {
      const contract = createMinimalContract();

      // This should be blocked by Architect's default rules
      await expect(
        sentinels.checkAction({ type: 'EXECUTE_SHELL' }, contract)
      ).rejects.toThrow(ActionBlockedError);
    });

    it('should combine Architect and contract rules', async () => {
      const contract = createMinimalContract({
        limitations: {
          forbidden_paths: [
            { pattern: '**/custom/**', reason: 'Custom forbidden' },
          ],
        },
      });

      // Architect rule
      await expect(
        sentinels.checkPath('/project/node_modules/file.js', 'read', contract)
      ).rejects.toThrow(PathBlockedError);

      // Contract rule
      await expect(
        sentinels.checkPath('/project/custom/file.js', 'read', contract)
      ).rejects.toThrow(PathBlockedError);
    });
  });
});
