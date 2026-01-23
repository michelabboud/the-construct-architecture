/**
 * The Sentinels - QA & Enforcement
 *
 * "Sentinels are programmed to return to the source when a target
 *  has been destroyed or otherwise lost."
 *
 * Validates outputs, blocks forbidden actions, scores quality.
 * NOT just monitoring - actively BLOCKS unauthorized actions.
 *
 * Phase 1 Implementation - Basic validation
 */

import type { Architect } from '../architect/architect.js';
import type { Contract } from '../architect/schemas/contract.schema.js';

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
 * The Sentinels - QA & Enforcement Layer
 *
 * TODO Phase 1:
 * - Validate outputs against contract requirements
 * - Block forbidden actions (path checks)
 * - Return pass/fail with score
 */
export class Sentinels {
  constructor(private architect: Architect) {}

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
   * Simple glob pattern matching
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
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
}
