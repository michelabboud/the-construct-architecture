import { describe, it, expect, beforeEach } from '@jest/globals';
import { Architect } from '../src/architect/architect.js';
import type { Contract } from '../src/architect/schemas/contract.schema.js';

describe('Architect', () => {
  let architect: Architect;

  beforeEach(async () => {
    architect = new Architect();
    await architect.initialize();
  });

  describe('initialization', () => {
    it('should initialize with default rules', async () => {
      const forbiddenPaths = architect.getForbiddenPaths();
      const forbiddenActions = architect.getForbiddenActions();

      expect(forbiddenPaths.length).toBeGreaterThan(0);
      expect(forbiddenActions.length).toBeGreaterThan(0);
    });

    it('should have node_modules as forbidden path', async () => {
      const forbiddenPaths = architect.getForbiddenPaths();

      const hasNodeModules = forbiddenPaths.some(rule =>
        rule.pattern.includes('node_modules')
      );
      expect(hasNodeModules).toBe(true);
    });

    it('should have .git as forbidden path', async () => {
      const forbiddenPaths = architect.getForbiddenPaths();

      const hasGit = forbiddenPaths.some(rule =>
        rule.pattern.includes('.git')
      );
      expect(hasGit).toBe(true);
    });

    it('should have .env as forbidden path', async () => {
      const forbiddenPaths = architect.getForbiddenPaths();

      const hasEnv = forbiddenPaths.some(rule =>
        rule.pattern.includes('.env')
      );
      expect(hasEnv).toBe(true);
    });
  });

  describe('isActionAllowed', () => {
    it('should allow regular actions', () => {
      expect(architect.isActionAllowed('READ')).toBe(true);
      expect(architect.isActionAllowed('WRITE')).toBe(true);
      expect(architect.isActionAllowed('GENERATE_IMAGE')).toBe(true);
    });

    it('should forbid DELETE action', () => {
      expect(architect.isActionAllowed('DELETE')).toBe(false);
      expect(architect.isActionAllowed('delete')).toBe(false);
    });

    it('should forbid EXECUTE_SHELL action', () => {
      expect(architect.isActionAllowed('EXECUTE_SHELL')).toBe(false);
      expect(architect.isActionAllowed('execute_shell')).toBe(false);
    });
  });

  describe('isPathAllowed', () => {
    describe('read operations', () => {
      it('should allow reading from normal paths', () => {
        expect(architect.isPathAllowed('/home/user/project/file.ts', 'read')).toBe(true);
        expect(architect.isPathAllowed('~/documents/readme.md', 'read')).toBe(true);
      });

      it('should forbid reading from node_modules', () => {
        expect(architect.isPathAllowed('/project/node_modules/package/index.js', 'read')).toBe(false);
        expect(architect.isPathAllowed('node_modules/zod/index.js', 'read')).toBe(false);
      });

      it('should forbid reading from .git', () => {
        expect(architect.isPathAllowed('/project/.git/config', 'read')).toBe(false);
        expect(architect.isPathAllowed('.git/HEAD', 'read')).toBe(false);
      });

      it('should forbid reading .env files', () => {
        expect(architect.isPathAllowed('/project/.env', 'read')).toBe(false);
        expect(architect.isPathAllowed('.env.local', 'read')).toBe(false);
        expect(architect.isPathAllowed('/app/.env.production', 'read')).toBe(false);
      });
    });

    describe('write operations', () => {
      it('should allow writing to allowed paths', () => {
        expect(architect.isPathAllowed('~/visual-forge-projects/output/image.png', 'write')).toBe(true);
        expect(architect.isPathAllowed('~/test-output/result.json', 'write')).toBe(true);
      });

      it('should forbid writing to node_modules', () => {
        expect(architect.isPathAllowed('/project/node_modules/hack.js', 'write')).toBe(false);
      });

      it('should forbid writing to .git', () => {
        expect(architect.isPathAllowed('/project/.git/config', 'write')).toBe(false);
      });

      it('should forbid writing .env files', () => {
        expect(architect.isPathAllowed('/project/.env', 'write')).toBe(false);
      });
    });
  });

  describe('validateContract', () => {
    it('should validate a valid contract', () => {
      const validContract: Contract = {
        contract: {
          id: 'test-001',
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
            description: 'Test',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
        },
      };

      const result = architect.validateContract(validContract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid contract structure', () => {
      const invalidContract = {
        contract: {
          id: 'invalid',
          // Missing required fields
        },
      } as Contract;

      const result = architect.validateContract(invalidContract);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate contract with forbidden paths', () => {
      const contractWithPaths: Contract = {
        contract: {
          id: 'paths-test',
          version: '1.0.0',
          type: 'test',
          name: 'Paths Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {
            forbidden_paths: [
              { pattern: '**/secret/**', reason: 'Secrets' },
            ],
          },
        },
      };

      const result = architect.validateContract(contractWithPaths);

      expect(result.valid).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return undefined for unknown config paths', async () => {
      const value = await architect.getConfig('unknown.path');

      expect(value).toBeUndefined();
    });
  });

  describe('pattern matching', () => {
    it('should match glob patterns with **', () => {
      // Using isPathAllowed as a proxy to test pattern matching
      expect(architect.isPathAllowed('/any/path/node_modules/deep/file.js', 'read')).toBe(false);
      expect(architect.isPathAllowed('/a/b/c/.git/d/e/f', 'read')).toBe(false);
    });

    it('should match patterns with wildcard at end', () => {
      expect(architect.isPathAllowed('/project/.env.local', 'read')).toBe(false);
      expect(architect.isPathAllowed('/project/.env.production', 'read')).toBe(false);
    });
  });
});
