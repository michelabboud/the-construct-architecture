/**
 * Phase 5 Tests - Full Sentinels / QA System
 *
 * Tests for:
 * - ActionValidator: Tool call interception and validation
 * - OutputValidator: Output quality validation
 * - EnforcementEngine: Real-time action control and escalation
 */

import { Architect } from '../src/architect/architect.js';
import {
  ActionValidator,
  type ValidatableAction,
  type ActionPolicy,
  ActionValidationError,
} from '../src/sentinels/validators/action-validator.js';
import {
  OutputValidator,
  DefaultSchemaProvider,
  type AIQualityScorer,
} from '../src/sentinels/validators/output-validator.js';
import {
  EnforcementEngine,
  type EscalationHandler,
} from '../src/sentinels/enforcement.js';
import { Sentinels } from '../src/sentinels/sentinels.js';
import type { Contract } from '../src/architect/schemas/contract.schema.js';

describe('Phase 5: Full Sentinels / QA System', () => {
  let architect: Architect;

  const createMinimalContract = (overrides: Partial<Contract['contract']> = {}): Contract => ({
    contract: {
      id: 'test-contract-phase5',
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
        objectives: ['Test Phase 5 components'],
        success_threshold: 7,
      },
      limitations: {},
      ...overrides,
    },
  });

  beforeEach(async () => {
    architect = new Architect();
    await architect.initialize();
  });

  describe('ActionValidator', () => {
    let validator: ActionValidator;
    let contract: Contract;

    beforeEach(() => {
      validator = new ActionValidator(architect);
      contract = createMinimalContract({
        limitations: {
          forbidden_actions: ['NETWORK_REQUEST'],
          forbidden_paths: [
            { pattern: '**/private/**', reason: 'Private directory access forbidden' },
          ],
        },
        resources: {
          tools: {
            allowed: ['read/*', 'write/*', 'search'],
            forbidden: ['execute', 'delete'],
          },
        },
      });
    });

    describe('validate()', () => {
      it('should allow valid tool calls', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'read/file',
          params: { path: '/src/index.ts' },
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      });

      it('should block forbidden actions from Architect', async () => {
        const action: ValidatableAction = {
          type: 'DELETE',
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0]?.code).toBe('ARCHITECT_ACTION_FORBIDDEN');
        expect(result.violations[0]?.source).toBe('architect');
      });

      it('should block forbidden actions from contract', async () => {
        const action: ValidatableAction = {
          type: 'NETWORK_REQUEST',
          url: 'https://example.com',
          method: 'GET',
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(false);
        expect(result.violations.some(v => v.code === 'CONTRACT_ACTION_FORBIDDEN')).toBe(true);
      });

      it('should block forbidden paths from contract', async () => {
        const action: ValidatableAction = {
          type: 'FILE_WRITE',
          path: '/app/private/data.json',
          content: '{}',
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(false);
        expect(result.violations.some(v => v.code === 'CONTRACT_PATH_FORBIDDEN')).toBe(true);
      });

      it('should block forbidden tools', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'execute',
          params: {},
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(false);
        expect(result.violations.some(v => v.code === 'CONTRACT_TOOL_FORBIDDEN')).toBe(true);
      });

      it('should block tools not in allowed list', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'unknown-tool',
          params: {},
        };

        const result = await validator.validate(action, contract);

        expect(result.allowed).toBe(false);
        expect(result.violations.some(v => v.code === 'CONTRACT_TOOL_NOT_ALLOWED')).toBe(true);
      });
    });

    describe('validateOrThrow()', () => {
      it('should not throw for valid actions', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
          params: { query: 'test' },
        };

        await expect(validator.validateOrThrow(action, contract)).resolves.not.toThrow();
      });

      it('should throw ActionValidationError for invalid actions', async () => {
        const action: ValidatableAction = {
          type: 'DELETE',
        };

        await expect(validator.validateOrThrow(action, contract))
          .rejects.toThrow(ActionValidationError);
      });
    });

    describe('Custom Policies', () => {
      it('should apply custom policies', async () => {
        const customPolicy: ActionPolicy = {
          id: 'no-large-files',
          name: 'No Large Files',
          description: 'Block writes larger than 1MB',
          check: (action) => {
            if (action.type === 'FILE_WRITE') {
              const fileAction = action as { content?: string };
              if (fileAction.content && fileAction.content.length > 1000000) {
                return [{
                  code: 'POLICY_LARGE_FILE',
                  message: 'File content exceeds 1MB limit',
                  severity: 'error',
                  source: 'policy',
                }];
              }
            }
            return [];
          },
        };

        validator.addPolicy(customPolicy);

        const largeAction: ValidatableAction = {
          type: 'FILE_WRITE',
          path: '/app/large.txt',
          content: 'x'.repeat(2000000),
        };

        const result = await validator.validate(largeAction, contract);

        expect(result.violations.some(v => v.code === 'POLICY_LARGE_FILE')).toBe(true);
      });

      it('should allow removing policies', () => {
        const policy: ActionPolicy = {
          id: 'test-policy',
          name: 'Test',
          check: () => [],
        };

        validator.addPolicy(policy);
        expect(validator.getPolicies()).toHaveLength(1);

        const removed = validator.removePolicy('test-policy');
        expect(removed).toBe(true);
        expect(validator.getPolicies()).toHaveLength(0);
      });
    });

    describe('Audit Log', () => {
      it('should maintain audit log', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        await validator.validate(action, contract);
        await validator.validate(action, contract);

        const logs = validator.getAuditLog();
        expect(logs).toHaveLength(2);
      });

      it('should filter audit logs', async () => {
        const action1: ValidatableAction = { type: 'TOOL_CALL', tool: 'search' };
        const action2: ValidatableAction = { type: 'DELETE' };

        await validator.validate(action1, contract);
        await validator.validate(action2, contract);

        const allowedLogs = validator.getAuditLog({ allowed: true });
        const blockedLogs = validator.getAuditLog({ allowed: false });

        expect(allowedLogs).toHaveLength(1);
        expect(blockedLogs).toHaveLength(1);
      });

      it('should provide audit statistics', async () => {
        const validAction: ValidatableAction = { type: 'TOOL_CALL', tool: 'search' };
        const invalidAction: ValidatableAction = { type: 'DELETE' };

        await validator.validate(validAction, contract);
        await validator.validate(invalidAction, contract);

        const stats = validator.getAuditStats();

        expect(stats.total).toBe(2);
        expect(stats.allowed).toBe(1);
        expect(stats.blocked).toBe(1);
        expect(Object.keys(stats.byViolationCode).length).toBeGreaterThan(0);
      });
    });
  });

  describe('OutputValidator', () => {
    let validator: OutputValidator;
    let contract: Contract;

    beforeEach(() => {
      validator = new OutputValidator();
      contract = createMinimalContract();
    });

    describe('validate()', () => {
      it('should validate valid output', async () => {
        const output = { content: 'Hello, world!', format: 'plain' };

        const result = await validator.validate(output, contract);

        expect(result.valid).toBe(true);
        expect(result.score).toBeGreaterThan(0);
        expect(result.scoreBreakdown).toBeDefined();
      });

      it('should fail on null output', async () => {
        const result = await validator.validate(null, contract);

        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.code === 'OUTPUT_MISSING')).toBe(true);
        expect(result.score).toBe(0);
      });

      it('should fail on undefined output', async () => {
        const result = await validator.validate(undefined, contract);

        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.code === 'OUTPUT_MISSING')).toBe(true);
      });

      it('should validate deliverables', async () => {
        const contractWithDeliverables = createMinimalContract({
          requirements: {
            description: 'Test requirements',
            deliverables: [
              { type: 'text', save_to: '/output/text.txt', format: 'plain' },
              { type: 'code', save_to: '/output/code.js' },
            ],
          },
        });

        const output = [
          { content: 'Text content', format: 'plain' },
          { content: 'console.log("hello")', language: 'javascript' },
        ];

        const result = await validator.validate(output, contractWithDeliverables);

        expect(result.deliverables).toHaveLength(2);
        expect(result.deliverables[0]?.valid).toBe(true);
        expect(result.deliverables[1]?.valid).toBe(true);
      });

      it('should detect missing deliverables', async () => {
        const contractWithDeliverables = createMinimalContract({
          requirements: {
            description: 'Test requirements',
            deliverables: [
              { type: 'text', save_to: '/output/text.txt' },
              { type: 'code', save_to: '/output/code.js' },
            ],
          },
        });

        const output = [{ content: 'Only one output', format: 'plain' }];

        const result = await validator.validate(output, contractWithDeliverables);

        expect(result.deliverables[1]?.valid).toBe(false);
        expect(result.issues.some(i => i.code === 'DELIVERABLE_MISSING')).toBe(true);
      });
    });

    describe('Score Breakdown', () => {
      it('should provide score breakdown', async () => {
        const output = { content: 'Test output' };
        const result = await validator.validate(output, contract);

        expect(result.scoreBreakdown.completeness).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.completeness).toBeLessThanOrEqual(1);
        expect(result.scoreBreakdown.correctness).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.correctness).toBeLessThanOrEqual(1);
        expect(result.scoreBreakdown.format).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.format).toBeLessThanOrEqual(1);
        expect(result.scoreBreakdown.constraints).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.constraints).toBeLessThanOrEqual(1);
      });
    });

    describe('AI Scorer Integration', () => {
      it('should use AI scorer when provided', async () => {
        const mockScorer: AIQualityScorer = {
          score: jest.fn().mockResolvedValue(0.85),
        };

        const validatorWithAI = new OutputValidator({
          aiScorer: mockScorer,
        });

        const output = { content: 'Test output' };
        const result = await validatorWithAI.validate(output, contract);

        expect(mockScorer.score).toHaveBeenCalledWith(output, contract);
        expect(result.scoreBreakdown.aiScore).toBe(0.85);
      });

      it('should handle AI scorer failures gracefully', async () => {
        const failingScorer: AIQualityScorer = {
          score: jest.fn().mockRejectedValue(new Error('AI service unavailable')),
        };

        const validatorWithAI = new OutputValidator({
          aiScorer: failingScorer,
        });

        const output = { content: 'Test output' };
        const result = await validatorWithAI.validate(output, contract);

        // Should complete without AI score
        expect(result.scoreBreakdown.aiScore).toBeUndefined();
        expect(result.score).toBeGreaterThan(0);
      });
    });

    describe('meetsThreshold()', () => {
      it('should return true when score meets threshold', async () => {
        const output = { content: 'Valid output', format: 'plain' };
        const result = await validator.validate(output, contract);

        const meets = validator.meetsThreshold(result, contract);
        expect(meets).toBe(result.score >= contract.contract.goals.success_threshold);
      });
    });

    describe('formatReport()', () => {
      it('should generate human-readable report', async () => {
        const output = { content: 'Test output' };
        const result = await validator.validate(output, contract);

        const report = validator.formatReport(result);

        expect(report).toContain('Output Validation Report');
        expect(report).toContain('Score:');
        expect(report).toContain('Completeness:');
        expect(report).toContain('Correctness:');
      });
    });

    describe('DefaultSchemaProvider', () => {
      let schemaProvider: DefaultSchemaProvider;

      beforeEach(() => {
        schemaProvider = new DefaultSchemaProvider();
      });

      it('should have default schemas', () => {
        expect(schemaProvider.getSchema('image')).toBeDefined();
        expect(schemaProvider.getSchema('text')).toBeDefined();
        expect(schemaProvider.getSchema('file')).toBeDefined();
        expect(schemaProvider.getSchema('code')).toBeDefined();
        expect(schemaProvider.getSchema('data')).toBeDefined();
      });

      it('should return undefined for unknown types', () => {
        expect(schemaProvider.getSchema('unknown-type')).toBeUndefined();
      });

      it('should allow registering custom schemas', () => {
        const { z } = require('zod');
        const customSchema = z.object({ custom: z.string() });

        schemaProvider.registerSchema('custom', customSchema);

        expect(schemaProvider.getSchema('custom')).toBe(customSchema);
      });
    });
  });

  describe('EnforcementEngine', () => {
    let engine: EnforcementEngine;
    let contract: Contract;

    beforeEach(() => {
      engine = new EnforcementEngine(architect);
      contract = createMinimalContract({
        limitations: {
          forbidden_actions: ['NETWORK_REQUEST'],
        },
        resources: {
          tools: {
            allowed: ['search'],
          },
        },
      });
    });

    describe('checkAction()', () => {
      it('should check action without blocking', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        const result = await engine.checkAction(action, contract);

        expect(result.allowed).toBe(true);
      });

      it('should log action checks', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        await engine.checkAction(action, contract);

        const logs = engine.getLogs({ eventType: 'action_check' });
        expect(logs.length).toBeGreaterThan(0);
      });
    });

    describe('enforceAction()', () => {
      it('should not throw for valid actions', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        await expect(engine.enforceAction(action, contract)).resolves.not.toThrow();
      });

      it('should throw for invalid actions', async () => {
        const action: ValidatableAction = {
          type: 'DELETE',
        };

        await expect(engine.enforceAction(action, contract))
          .rejects.toThrow(ActionValidationError);
      });

      it('should log blocked actions', async () => {
        const action: ValidatableAction = {
          type: 'DELETE',
        };

        try {
          await engine.enforceAction(action, contract);
        } catch {
          // Expected
        }

        const logs = engine.getLogs({ eventType: 'action_blocked' });
        expect(logs.length).toBeGreaterThan(0);
      });
    });

    describe('validateOutput()', () => {
      it('should validate output', async () => {
        const output = { content: 'Test output' };

        const result = await engine.validateOutput(output, contract);

        expect(result).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
      });

      it('should log output validations', async () => {
        const output = { content: 'Test output' };

        await engine.validateOutput(output, contract);

        const logs = engine.getLogs({ eventType: 'output_validated' });
        expect(logs.length).toBeGreaterThan(0);
      });
    });

    describe('Escalation System', () => {
      it('should create escalations', async () => {
        const escalation = await engine.escalate({
          level: 'medium',
          reason: 'Test escalation',
          contractId: contract.contract.id,
        });

        expect(escalation.id).toBeDefined();
        expect(escalation.status).toBe('pending');
        expect(escalation.level).toBe('medium');
      });

      it('should resolve escalations', async () => {
        const escalation = await engine.escalate({
          level: 'low',
          reason: 'Test',
          contractId: contract.contract.id,
        });

        const resolved = engine.resolveEscalation(escalation.id, 'approved', 'admin', 'Approved for testing');

        expect(resolved).toBe(true);

        const updated = engine.getEscalation(escalation.id);
        expect(updated?.status).toBe('approved');
        expect(updated?.resolvedBy).toBe('admin');
      });

      it('should track pending escalations', async () => {
        await engine.escalate({ level: 'low', reason: 'Test 1', contractId: 'c1' });
        await engine.escalate({ level: 'medium', reason: 'Test 2', contractId: 'c2' });

        const pending = engine.getPendingEscalations();
        expect(pending.length).toBe(2);
      });

      it('should filter escalations', async () => {
        await engine.escalate({ level: 'low', reason: 'Low', contractId: 'c1' });
        await engine.escalate({ level: 'high', reason: 'High', contractId: 'c1' });

        const lowEscalations = engine.getAllEscalations({ level: 'low' });
        expect(lowEscalations.length).toBe(1);
      });

      it('should use escalation handler', async () => {
        const handler: EscalationHandler = {
          handle: jest.fn().mockResolvedValue(true),
        };

        engine.setEscalationHandler(handler);

        await engine.escalate({
          level: 'medium',
          reason: 'Test with handler',
          contractId: contract.contract.id,
        });

        expect(handler.handle).toHaveBeenCalled();
      });
    });

    describe('getStats()', () => {
      it('should provide enforcement statistics', async () => {
        const validAction: ValidatableAction = { type: 'TOOL_CALL', tool: 'search' };
        const invalidAction: ValidatableAction = { type: 'DELETE' };

        await engine.checkAction(validAction, contract);
        try {
          await engine.enforceAction(invalidAction, contract);
        } catch {
          // Expected
        }
        await engine.validateOutput({ content: 'test' }, contract);

        const stats = engine.getStats();

        expect(stats.totalActions).toBe(2);
        expect(stats.blockedActions).toBe(1);
        expect(stats.totalOutputs).toBe(1);
      });
    });

    describe('generateComplianceReport()', () => {
      it('should generate compliance report', async () => {
        await engine.checkAction({ type: 'TOOL_CALL', tool: 'search' }, contract);
        await engine.validateOutput({ content: 'test' }, contract);

        const report = engine.generateComplianceReport();

        expect(report).toContain('ENFORCEMENT COMPLIANCE REPORT');
        expect(report).toContain('ACTION ENFORCEMENT');
        expect(report).toContain('OUTPUT VALIDATION');
        expect(report).toContain('ESCALATIONS');
      });
    });
  });

  describe('Sentinels Integration', () => {
    describe('Phase 5 Disabled', () => {
      let sentinels: Sentinels;

      beforeEach(() => {
        sentinels = new Sentinels(architect);
      });

      it('should use Phase 1 validation as fallback', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };
        const contract = createMinimalContract();

        const result = await sentinels.validateActionFull(action, contract);

        expect(result.allowed).toBe(true);
      });

      it('should throw when accessing Phase 5 components', () => {
        expect(() => sentinels.getActionValidator()).toThrow('Phase 5 not enabled');
        expect(() => sentinels.getOutputValidator()).toThrow('Phase 5 not enabled');
        expect(() => sentinels.getEnforcementEngine()).toThrow('Phase 5 not enabled');
      });

      it('should report Phase 5 as disabled', () => {
        expect(sentinels.isPhase5Enabled()).toBe(false);
      });
    });

    describe('Phase 5 Enabled', () => {
      let sentinels: Sentinels;
      let contract: Contract;

      beforeEach(() => {
        sentinels = new Sentinels(architect, { enablePhase5: true });
        contract = createMinimalContract({
          resources: {
            tools: {
              allowed: ['search'],
            },
          },
        });
      });

      it('should report Phase 5 as enabled', () => {
        expect(sentinels.isPhase5Enabled()).toBe(true);
      });

      it('should provide Phase 5 components', () => {
        expect(sentinels.getActionValidator()).toBeInstanceOf(ActionValidator);
        expect(sentinels.getOutputValidator()).toBeInstanceOf(OutputValidator);
        expect(sentinels.getEnforcementEngine()).toBeInstanceOf(EnforcementEngine);
      });

      it('should validate actions with full Phase 5 validation', async () => {
        const action: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        const result = await sentinels.validateActionFull(action, contract);

        expect(result.allowed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should validate outputs with full Phase 5 validation', async () => {
        const output = { content: 'Test output' };

        const result = await sentinels.validateOutputFull(output, contract);

        expect(result.valid).toBe(true);
        expect(result.scoreBreakdown).toBeDefined();
      });

      it('should enforce actions', async () => {
        const validAction: ValidatableAction = {
          type: 'TOOL_CALL',
          tool: 'search',
        };

        await expect(sentinels.enforceAction(validAction, contract)).resolves.not.toThrow();

        const invalidAction: ValidatableAction = {
          type: 'DELETE',
        };

        await expect(sentinels.enforceAction(invalidAction, contract))
          .rejects.toThrow(ActionValidationError);
      });

      it('should provide enforcement stats', () => {
        const stats = sentinels.getEnforcementStats();
        expect(stats).not.toBeNull();
      });

      it('should generate compliance report', () => {
        const report = sentinels.getComplianceReport();
        expect(report).not.toBeNull();
        expect(report).toContain('ENFORCEMENT COMPLIANCE REPORT');
      });

      it('should allow setting escalation handler', () => {
        const handler: EscalationHandler = {
          handle: jest.fn().mockResolvedValue(true),
        };

        sentinels.setEscalationHandler(handler);

        // No error means success
        expect(true).toBe(true);
      });
    });
  });
});
