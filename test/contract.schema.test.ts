import { describe, it, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  validateContract,
  parseContract,
  ContractSchema,
  type Contract,
} from '../src/architect/schemas/contract.schema.js';

describe('Contract Schema', () => {
  describe('validateContract', () => {
    it('should validate a valid contract object', () => {
      const validContract: Contract = {
        contract: {
          id: 'test-001',
          version: '1.0.0',
          type: 'image_generation',
          name: 'Test Contract',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test-suite',
            priority: 'normal',
            tags: ['test'],
          },
          requirements: {
            description: 'Test description',
          },
          goals: {
            objectives: ['Test objective'],
            success_threshold: 7.0,
          },
          limitations: {},
        },
      };

      const result = validateContract(validContract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.contract).toBeDefined();
    });

    it('should reject a contract missing required fields', () => {
      const invalidContract = {
        contract: {
          id: 'test-001',
          // Missing: version, type, name, metadata, requirements, goals, limitations
        },
      };

      const result = validateContract(invalidContract);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid priority value', () => {
      const invalidContract = {
        contract: {
          id: 'test-001',
          version: '1.0.0',
          type: 'image_generation',
          name: 'Test Contract',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test-suite',
            priority: 'invalid-priority', // Invalid
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

      const result = validateContract(invalidContract);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('priority'))).toBe(true);
    });

    it('should validate success_threshold is within bounds', () => {
      const contractWithHighThreshold = {
        contract: {
          id: 'test-001',
          version: '1.0.0',
          type: 'test',
          name: 'Test',
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
            success_threshold: 15.0, // Above max of 10
          },
          limitations: {},
        },
      };

      const result = validateContract(contractWithHighThreshold);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('10'))).toBe(true);
    });

    it('should accept optional fields when omitted', () => {
      const minimalContract: Contract = {
        contract: {
          id: 'minimal-001',
          version: '1.0.0',
          type: 'test',
          name: 'Minimal Contract',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'low',
            tags: [],
          },
          requirements: {
            description: 'Minimal requirements',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
        },
      };

      const result = validateContract(minimalContract);

      expect(result.valid).toBe(true);
    });

    it('should validate deliverables structure', () => {
      const contractWithDeliverables: Contract = {
        contract: {
          id: 'test-deliverables',
          version: '1.0.0',
          type: 'image_generation',
          name: 'Deliverables Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'normal',
            tags: [],
          },
          requirements: {
            description: 'Test with deliverables',
            deliverables: [
              {
                type: 'image',
                format: 'png',
                min_width: 1024,
                min_height: 768,
                save_to: '~/output/',
              },
            ],
          },
          goals: {
            objectives: ['Generate image'],
            success_threshold: 7.0,
          },
          limitations: {},
        },
      };

      const result = validateContract(contractWithDeliverables);

      expect(result.valid).toBe(true);
      expect(result.contract?.contract.requirements.deliverables).toHaveLength(1);
    });

    it('should validate forbidden_paths structure', () => {
      const contractWithForbiddenPaths = {
        contract: {
          id: 'test-paths',
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
            description: 'Test forbidden paths',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {
            forbidden_paths: [
              { pattern: '**/src/**', reason: 'Source code' },
              { pattern: '**/.env*', reason: 'Secrets' },
            ],
          },
        },
      };

      const result = validateContract(contractWithForbiddenPaths);

      expect(result.valid).toBe(true);
      expect(result.contract?.contract.limitations.forbidden_paths).toHaveLength(2);
    });

    it('should reject forbidden_paths without reason', () => {
      const contractWithInvalidPaths = {
        contract: {
          id: 'test-paths',
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
              { pattern: '**/src/**' }, // Missing reason
            ],
          },
        },
      };

      const result = validateContract(contractWithInvalidPaths);

      expect(result.valid).toBe(false);
    });
  });

  describe('parseContract', () => {
    it('should parse a valid YAML contract', async () => {
      const yamlPath = join(__dirname, 'fixtures', 'valid-contract.yaml');
      const yamlContent = await readFile(yamlPath, 'utf-8');

      const result = await parseContract(yamlContent);

      expect(result.valid).toBe(true);
      expect(result.contract).toBeDefined();
      expect(result.contract?.contract.id).toBe('test-001');
      expect(result.contract?.contract.type).toBe('image_generation');
    });

    it('should reject an invalid YAML contract', async () => {
      const yamlPath = join(__dirname, 'fixtures', 'invalid-contract.yaml');
      const yamlContent = await readFile(yamlPath, 'utf-8');

      const result = await parseContract(yamlContent);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed YAML gracefully', async () => {
      const malformedYaml = `
        contract:
          id: "test
          broken: yaml
      `;

      await expect(parseContract(malformedYaml)).rejects.toThrow();
    });
  });

  describe('ContractSchema type inference', () => {
    it('should correctly infer Contract type', () => {
      // This is a compile-time check - if this compiles, types are correct
      const contract: Contract = {
        contract: {
          id: 'type-test',
          version: '1.0.0',
          type: 'test',
          name: 'Type Test',
          metadata: {
            created_at: '2026-01-23T12:00:00Z',
            created_by: 'test',
            priority: 'critical',
            tags: ['type-check'],
          },
          requirements: {
            description: 'Type inference test',
          },
          goals: {
            objectives: ['Compile'],
            success_threshold: 10,
          },
          limitations: {
            forbidden_actions: ['DELETE'],
            constraints: ['Must compile'],
          },
        },
      };

      expect(contract.contract.metadata.priority).toBe('critical');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty tags array', () => {
      const contract = {
        contract: {
          id: 'empty-tags',
          version: '1.0.0',
          type: 'test',
          name: 'Empty Tags',
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

      const result = validateContract(contract);
      expect(result.valid).toBe(true);
    });

    it('should handle all priority levels', () => {
      const priorities = ['critical', 'high', 'normal', 'low'] as const;

      for (const priority of priorities) {
        const contract = {
          contract: {
            id: `priority-${priority}`,
            version: '1.0.0',
            type: 'test',
            name: `Priority ${priority}`,
            metadata: {
              created_at: '2026-01-23T12:00:00Z',
              created_by: 'test',
              priority,
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

        const result = validateContract(contract);
        expect(result.valid).toBe(true);
      }
    });

    it('should validate limits structure', () => {
      const contract = {
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
            description: 'Test',
          },
          goals: {
            objectives: [],
            success_threshold: 5.0,
          },
          limitations: {},
          limits: {
            cost: {
              max_usd: 1.0,
              warn_at: 0.8,
              track_by: 'contract',
            },
            time: {
              max_duration_ms: 60000,
              warn_at_ms: 45000,
            },
            retries: {
              max_attempts: 3,
              backoff: 'exponential',
              retry_on: ['rate_limit', 'timeout'],
            },
            tokens: {
              max_input: 10000,
              max_output: 4000,
            },
          },
        },
      };

      const result = validateContract(contract);
      expect(result.valid).toBe(true);
    });
  });
});
