/**
 * The Sentinels - QA & Enforcement
 *
 * "Sentinels are programmed to return to the source when a target
 *  has been destroyed or otherwise lost."
 *
 * Validates outputs, blocks forbidden actions, scores quality.
 * NOT just monitoring - actively BLOCKS unauthorized actions.
 *
 * Phase 1 + Phase 5 Implementation
 */

import { minimatch } from 'minimatch';
import type { Architect } from '../architect/architect.js';
import type { Contract } from '../architect/schemas/contract.schema.js';
import {
  ActionValidator,
  type ValidatableAction,
  type ActionValidationResult,
  type ActionValidatorConfig,
  ActionValidationError,
} from './validators/action-validator.js';
import {
  OutputValidator,
  type OutputValidationResult as FullOutputValidationResult,
  type OutputValidatorConfig,
} from './validators/output-validator.js';
import {
  EnforcementEngine,
  type EnforcementConfig,
  type EscalationRequest,
  type EscalationHandler,
} from './enforcement.js';

// Re-export Phase 5 types
export type {
  ValidatableAction,
  ActionValidationResult,
  ActionValidatorConfig,
  FullOutputValidationResult,
  OutputValidatorConfig,
  EnforcementConfig,
  EscalationRequest,
  EscalationHandler,
};
export { ActionValidator, ActionValidationError, OutputValidator, EnforcementEngine };

export interface ValidationResult {
  valid: boolean;
  score: number;        // 0-10
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
}

export interface Action {
  type: string;
  path?: string;
  operation?: 'read' | 'write';
  tool?: string;
  params?: Record<string, unknown>;
}

/**
 * Custom error for blocked actions
 */
export class ActionBlockedError extends Error {
  constructor(
    public action: Action,
    public reason: string
  ) {
    super(`Action blocked: ${reason}`);
    this.name = 'ActionBlockedError';
  }
}

/**
 * Custom error for blocked paths
 */
export class PathBlockedError extends Error {
  constructor(
    public path: string,
    public reason: string
  ) {
    super(`Path blocked: ${reason}`);
    this.name = 'PathBlockedError';
  }
}

/**
 * Sentinels configuration
 */
export interface SentinelsConfig {
  /** Enable Phase 5 features (action validator, output validator, enforcement) */
  enablePhase5?: boolean;
  /** Action validator configuration */
  actionValidatorConfig?: ActionValidatorConfig;
  /** Output validator configuration */
  outputValidatorConfig?: OutputValidatorConfig;
  /** Enforcement engine configuration */
  enforcementConfig?: EnforcementConfig;
}

/**
 * The Sentinels - QA & Enforcement Layer
 *
 * Phase 1: Basic validation (checkAction, checkPath, checkTool, validateOutput)
 * Phase 5: Full QA system with ActionValidator, OutputValidator, EnforcementEngine
 */
export class Sentinels {
  private config: SentinelsConfig;
  private actionValidator?: ActionValidator;
  private outputValidator?: OutputValidator;
  private enforcement?: EnforcementEngine;

  constructor(private architect: Architect, config: SentinelsConfig = {}) {
    this.config = config;

    // Initialize Phase 5 components if enabled
    if (config.enablePhase5) {
      this.actionValidator = new ActionValidator(architect, config.actionValidatorConfig);
      this.outputValidator = new OutputValidator(config.outputValidatorConfig);
      this.enforcement = new EnforcementEngine(architect, config.enforcementConfig);
    }
  }

  /**
   * Check if an action is allowed by both Architect and contract
   * Throws ActionBlockedError if not allowed
   */
  async checkAction(action: Action, contract: Contract): Promise<void> {
    // Check against Architect rules first (global)
    if (!this.architect.isActionAllowed(action.type)) {
      throw new ActionBlockedError(
        action,
        `Action "${action.type}" is forbidden by Architect rules`
      );
    }

    // Check against contract limitations
    const forbidden = contract.contract.limitations?.forbidden_actions || [];
    for (const forbiddenAction of forbidden) {
      if (action.type.toUpperCase().includes(forbiddenAction.toUpperCase())) {
        throw new ActionBlockedError(
          action,
          `Action "${action.type}" is forbidden by contract`
        );
      }
    }

    // Check path if provided
    if (action.path && action.operation) {
      await this.checkPath(action.path, action.operation, contract);
    }

    // Check tool if provided
    if (action.tool) {
      this.checkTool(action.tool, contract);
    }
  }

  /**
   * Check if a path is allowed
   * Throws PathBlockedError if not allowed
   */
  async checkPath(
    path: string,
    operation: 'read' | 'write',
    contract: Contract
  ): Promise<void> {
    // Check against Architect rules first
    if (!this.architect.isPathAllowed(path, operation)) {
      throw new PathBlockedError(
        path,
        'Path is forbidden by Architect rules'
      );
    }

    // Check against contract forbidden paths
    const forbiddenPaths = contract.contract.limitations?.forbidden_paths || [];
    for (const rule of forbiddenPaths) {
      if (this.matchesPattern(path, rule.pattern)) {
        throw new PathBlockedError(path, rule.reason);
      }
    }
  }

  /**
   * Check if a tool is allowed by contract
   */
  checkTool(tool: string, contract: Contract): boolean {
    const resources = contract.contract.resources;
    if (!resources?.tools) {
      return true; // No restrictions
    }

    // Check if forbidden
    if (resources.tools.forbidden?.some(t => tool.includes(t))) {
      throw new ActionBlockedError(
        { type: 'TOOL_CALL', tool },
        `Tool "${tool}" is forbidden by contract`
      );
    }

    // Check if allowed (if allowed list exists)
    if (resources.tools.allowed && resources.tools.allowed.length > 0) {
      const isAllowed = resources.tools.allowed.some(pattern =>
        this.matchesToolPattern(tool, pattern)
      );
      if (!isAllowed) {
        throw new ActionBlockedError(
          { type: 'TOOL_CALL', tool },
          `Tool "${tool}" is not in the allowed list`
        );
      }
    }

    return true;
  }

  /**
   * Validate an output against contract requirements
   */
  async validateOutput(
    output: unknown,
    contract: Contract
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Check if output exists
    if (output === null || output === undefined) {
      errors.push({
        code: 'OUTPUT_MISSING',
        message: 'Output is null or undefined',
        severity: 'critical',
      });
    }

    // Check deliverables if defined
    const deliverables = contract.contract.requirements?.deliverables;
    if (deliverables && deliverables.length > 0) {
      // TODO: Validate each deliverable
      // For now, just check that output exists
    }

    // Calculate score based on errors/warnings
    let score = 10;
    score -= errors.filter(e => e.severity === 'critical').length * 3;
    score -= errors.filter(e => e.severity === 'error').length * 1;
    score -= warnings.length * 0.5;
    score = Math.max(0, Math.min(10, score));

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Check if output meets the success threshold
   */
  meetsThreshold(result: ValidationResult, contract: Contract): boolean {
    const threshold = contract.contract.goals.success_threshold;
    return result.score >= threshold;
  }

  /**
   * Glob pattern matching using minimatch
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    return minimatch(normalizedPath, normalizedPattern, {
      dot: true,
      matchBase: true,
    });
  }

  /**
   * Match tool patterns (supports wildcards)
   */
  private matchesToolPattern(tool: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return tool.startsWith(prefix);
    }
    return tool === pattern;
  }

  // ============ Phase 5: Full QA System ============

  /**
   * Get action validator (Phase 5)
   * Throws if Phase 5 is not enabled
   */
  getActionValidator(): ActionValidator {
    if (!this.actionValidator) {
      throw new Error('Phase 5 not enabled. Set enablePhase5: true in config.');
    }
    return this.actionValidator;
  }

  /**
   * Get output validator (Phase 5)
   * Throws if Phase 5 is not enabled
   */
  getOutputValidator(): OutputValidator {
    if (!this.outputValidator) {
      throw new Error('Phase 5 not enabled. Set enablePhase5: true in config.');
    }
    return this.outputValidator;
  }

  /**
   * Get enforcement engine (Phase 5)
   * Throws if Phase 5 is not enabled
   */
  getEnforcementEngine(): EnforcementEngine {
    if (!this.enforcement) {
      throw new Error('Phase 5 not enabled. Set enablePhase5: true in config.');
    }
    return this.enforcement;
  }

  /**
   * Check if Phase 5 features are enabled
   */
  isPhase5Enabled(): boolean {
    return !!this.config.enablePhase5;
  }

  /**
   * Validate action with full Phase 5 validation (if enabled)
   * Falls back to Phase 1 checkAction if Phase 5 not enabled
   */
  async validateActionFull(
    action: ValidatableAction,
    contract: Contract
  ): Promise<ActionValidationResult> {
    if (this.actionValidator) {
      return this.actionValidator.validate(action, contract);
    }

    // Fall back to Phase 1 validation
    const phase1Action: Action = { type: action.type };
    if ('tool' in action && (action as { tool: string }).tool) {
      phase1Action.tool = (action as { tool: string }).tool;
    }
    if ('path' in action && (action as { path: string }).path) {
      phase1Action.path = (action as { path: string }).path;
    }
    if (action.type.includes('READ')) {
      phase1Action.operation = 'read';
    } else if (action.type.includes('WRITE')) {
      phase1Action.operation = 'write';
    }

    try {
      await this.checkAction(phase1Action, contract);
      return {
        allowed: true,
        action,
        violations: [],
        timestamp: new Date(),
        durationMs: 0,
      };
    } catch (error) {
      return {
        allowed: false,
        action,
        violations: [{
          code: 'PHASE1_BLOCKED',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
          source: 'contract',
        }],
        timestamp: new Date(),
        durationMs: 0,
      };
    }
  }

  /**
   * Validate output with full Phase 5 validation (if enabled)
   * Falls back to Phase 1 validateOutput if Phase 5 not enabled
   */
  async validateOutputFull(
    output: unknown,
    contract: Contract
  ): Promise<FullOutputValidationResult> {
    if (this.outputValidator) {
      return this.outputValidator.validate(output, contract);
    }

    // Fall back to Phase 1 validation
    const phase1Result = await this.validateOutput(output, contract);

    return {
      valid: phase1Result.valid,
      score: phase1Result.score,
      scoreBreakdown: {
        completeness: phase1Result.valid ? 1 : 0,
        correctness: phase1Result.valid ? 1 : 0,
        format: 1,
        constraints: 1,
      },
      issues: phase1Result.errors.map(e => {
        const issue: { code: string; message: string; severity: 'critical' | 'error'; path?: string } = {
          code: e.code,
          message: e.message,
          severity: e.severity,
        };
        if (e.path) {
          issue.path = e.path;
        }
        return issue;
      }),
      deliverables: [],
      timestamp: new Date(),
      durationMs: 0,
    };
  }

  /**
   * Enforce action using enforcement engine (Phase 5)
   * Throws if action is blocked
   */
  async enforceAction(
    action: ValidatableAction,
    contract: Contract
  ): Promise<void> {
    if (this.enforcement) {
      await this.enforcement.enforceAction(action, contract);
    } else {
      // Fall back to Phase 1
      const phase1Action: Action = { type: action.type };
      if ('tool' in action && (action as { tool: string }).tool) {
        phase1Action.tool = (action as { tool: string }).tool;
      }
      if ('path' in action && (action as { path: string }).path) {
        phase1Action.path = (action as { path: string }).path;
      }
      if (action.type.includes('READ')) {
        phase1Action.operation = 'read';
      } else if (action.type.includes('WRITE')) {
        phase1Action.operation = 'write';
      }
      await this.checkAction(phase1Action, contract);
    }
  }

  /**
   * Get enforcement statistics (Phase 5)
   */
  getEnforcementStats() {
    if (!this.enforcement) {
      return null;
    }
    return this.enforcement.getStats();
  }

  /**
   * Get compliance report (Phase 5)
   */
  getComplianceReport(options?: { contractId?: string; since?: Date }): string | null {
    if (!this.enforcement) {
      return null;
    }
    return this.enforcement.generateComplianceReport(options);
  }

  /**
   * Set escalation handler (Phase 5)
   */
  setEscalationHandler(handler: EscalationHandler): void {
    if (this.enforcement) {
      this.enforcement.setEscalationHandler(handler);
    }
  }
}
