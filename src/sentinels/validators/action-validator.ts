/**
 * Action Validator - Tool Call Interception & Validation
 *
 * "There is no escape." — Agent Smith
 *
 * Intercepts all tool calls, validates against contract limitations,
 * blocks unauthorized actions, and maintains an audit log.
 *
 * Phase 5 Implementation
 */

import { minimatch } from 'minimatch';
import type { Architect } from '../../architect/architect.js';
import type { Contract } from '../../architect/schemas/contract.schema.js';

/**
 * Action types that can be validated
 */
export type ActionType =
  | 'TOOL_CALL'
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'FILE_DELETE'
  | 'NETWORK_REQUEST'
  | 'SHELL_EXECUTE'
  | 'DATABASE_QUERY'
  | 'API_CALL'
  | string;

/**
 * Tool call action details
 */
export interface ToolCallAction {
  type: 'TOOL_CALL';
  tool: string;
  params?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * File operation action details
 */
export interface FileAction {
  type: 'FILE_READ' | 'FILE_WRITE' | 'FILE_DELETE';
  path: string;
  content?: string;
  timestamp?: Date;
}

/**
 * Network request action details
 */
export interface NetworkAction {
  type: 'NETWORK_REQUEST';
  url: string;
  method: string;
  headers?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Shell execution action details
 */
export interface ShellAction {
  type: 'SHELL_EXECUTE';
  command: string;
  args?: string[];
  cwd?: string;
  timestamp?: Date;
}

/**
 * Generic action for extensibility
 */
export interface GenericAction {
  type: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Union type for all action types
 */
export type ValidatableAction =
  | ToolCallAction
  | FileAction
  | NetworkAction
  | ShellAction
  | GenericAction;

/**
 * Validation result for an action
 */
export interface ActionValidationResult {
  allowed: boolean;
  action: ValidatableAction;
  violations: ActionViolation[];
  timestamp: Date;
  durationMs: number;
}

/**
 * Violation details
 */
export interface ActionViolation {
  code: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
  source: 'architect' | 'contract' | 'policy';
  rule?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  contractId: string;
  action: ValidatableAction;
  result: ActionValidationResult;
  context?: Record<string, unknown>;
}

/**
 * Action Validator configuration
 */
export interface ActionValidatorConfig {
  /** Enable audit logging (default: true) */
  enableAudit?: boolean;
  /** Maximum audit log entries to keep (default: 1000) */
  maxAuditEntries?: number;
  /** Custom policies to apply */
  customPolicies?: ActionPolicy[];
}

/**
 * Custom action policy
 */
export interface ActionPolicy {
  id: string;
  name: string;
  description?: string;
  /** Check function returns violations if policy is violated */
  check: (action: ValidatableAction, contract: Contract) => ActionViolation[];
}

/**
 * Action Validator
 *
 * Validates all actions against Architect rules, contract limitations,
 * and custom policies. Maintains audit log of all validations.
 */
export class ActionValidator {
  private architect: Architect;
  private config: Required<ActionValidatorConfig>;
  private auditLog: AuditLogEntry[] = [];
  private customPolicies: ActionPolicy[] = [];
  private auditIdCounter = 0;

  constructor(architect: Architect, config: ActionValidatorConfig = {}) {
    this.architect = architect;
    this.config = {
      enableAudit: config.enableAudit ?? true,
      maxAuditEntries: config.maxAuditEntries ?? 1000,
      customPolicies: config.customPolicies ?? [],
    };
    this.customPolicies = [...this.config.customPolicies];
  }

  /**
   * Validate an action against all rules
   */
  async validate(
    action: ValidatableAction,
    contract: Contract
  ): Promise<ActionValidationResult> {
    const startTime = Date.now();
    const violations: ActionViolation[] = [];

    // Ensure timestamp
    if (!action.timestamp) {
      action.timestamp = new Date();
    }

    // Check Architect rules (global)
    violations.push(...this.checkArchitectRules(action));

    // Check contract limitations
    violations.push(...this.checkContractLimitations(action, contract));

    // Check custom policies
    violations.push(...this.checkCustomPolicies(action, contract));

    const result: ActionValidationResult = {
      allowed: violations.filter(v => v.severity === 'critical' || v.severity === 'error').length === 0,
      action,
      violations,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
    };

    // Log to audit trail
    if (this.config.enableAudit) {
      this.logAudit(contract.contract.id, action, result);
    }

    return result;
  }

  /**
   * Validate and throw if not allowed
   */
  async validateOrThrow(
    action: ValidatableAction,
    contract: Contract
  ): Promise<void> {
    const result = await this.validate(action, contract);

    if (!result.allowed) {
      const criticalViolation = result.violations.find(
        v => v.severity === 'critical' || v.severity === 'error'
      );
      throw new ActionValidationError(
        action,
        result.violations,
        criticalViolation?.message ?? 'Action not allowed'
      );
    }
  }

  /**
   * Check action against Architect rules
   */
  private checkArchitectRules(action: ValidatableAction): ActionViolation[] {
    const violations: ActionViolation[] = [];

    // Check forbidden actions
    if (!this.architect.isActionAllowed(action.type)) {
      violations.push({
        code: 'ARCHITECT_ACTION_FORBIDDEN',
        message: `Action "${action.type}" is forbidden by Architect rules`,
        severity: 'critical',
        source: 'architect',
      });
    }

    // Check path for file actions
    if (this.isFileAction(action)) {
      const operation = action.type === 'FILE_READ' ? 'read' : 'write';
      if (!this.architect.isPathAllowed(action.path, operation)) {
        const reason = this.architect.getPathForbiddenReason(action.path);
        violations.push({
          code: 'ARCHITECT_PATH_FORBIDDEN',
          message: reason ?? `Path "${action.path}" is forbidden by Architect rules`,
          severity: 'critical',
          source: 'architect',
        });
      }
    }

    return violations;
  }

  /**
   * Check action against contract limitations
   */
  private checkContractLimitations(
    action: ValidatableAction,
    contract: Contract
  ): ActionViolation[] {
    const violations: ActionViolation[] = [];
    const limitations = contract.contract.limitations;

    // Check forbidden actions
    if (limitations?.forbidden_actions) {
      for (const forbidden of limitations.forbidden_actions) {
        if (action.type.toUpperCase().includes(forbidden.toUpperCase())) {
          violations.push({
            code: 'CONTRACT_ACTION_FORBIDDEN',
            message: `Action "${action.type}" is forbidden by contract`,
            severity: 'error',
            source: 'contract',
            rule: `forbidden_actions: ${forbidden}`,
          });
        }
      }
    }

    // Check forbidden paths for file actions
    if (this.isFileAction(action) && limitations?.forbidden_paths) {
      for (const rule of limitations.forbidden_paths) {
        if (this.matchesPattern(action.path, rule.pattern)) {
          violations.push({
            code: 'CONTRACT_PATH_FORBIDDEN',
            message: rule.reason,
            severity: 'error',
            source: 'contract',
            rule: `forbidden_paths: ${rule.pattern}`,
          });
        }
      }
    }

    // Check tool restrictions for tool calls
    if (this.isToolCall(action)) {
      const toolViolations = this.checkToolRestrictions(action, contract);
      violations.push(...toolViolations);
    }

    // Network restrictions could be added via custom policies
    // Note: forbidden_domains not currently in contract schema

    return violations;
  }

  /**
   * Check tool restrictions
   */
  private checkToolRestrictions(
    action: ToolCallAction,
    contract: Contract
  ): ActionViolation[] {
    const violations: ActionViolation[] = [];
    const tools = contract.contract.resources?.tools;

    if (!tools) {
      return violations;
    }

    // Check forbidden tools
    if (tools.forbidden) {
      for (const forbidden of tools.forbidden) {
        if (action.tool.includes(forbidden)) {
          violations.push({
            code: 'CONTRACT_TOOL_FORBIDDEN',
            message: `Tool "${action.tool}" is forbidden by contract`,
            severity: 'error',
            source: 'contract',
            rule: `tools.forbidden: ${forbidden}`,
          });
        }
      }
    }

    // Check allowed tools (if list exists, tool must be in it)
    if (tools.allowed && tools.allowed.length > 0) {
      const isAllowed = tools.allowed.some(pattern =>
        this.matchesToolPattern(action.tool, pattern)
      );
      if (!isAllowed) {
        violations.push({
          code: 'CONTRACT_TOOL_NOT_ALLOWED',
          message: `Tool "${action.tool}" is not in the allowed list`,
          severity: 'error',
          source: 'contract',
          rule: `tools.allowed: [${tools.allowed.join(', ')}]`,
        });
      }
    }

    return violations;
  }

  /**
   * Check custom policies
   */
  private checkCustomPolicies(
    action: ValidatableAction,
    contract: Contract
  ): ActionViolation[] {
    const violations: ActionViolation[] = [];

    for (const policy of this.customPolicies) {
      try {
        const policyViolations = policy.check(action, contract);
        violations.push(...policyViolations);
      } catch (error) {
        // Policy error - add warning but don't block
        violations.push({
          code: 'POLICY_ERROR',
          message: `Policy "${policy.id}" failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'warning',
          source: 'policy',
          rule: policy.id,
        });
      }
    }

    return violations;
  }

  /**
   * Add a custom policy
   */
  addPolicy(policy: ActionPolicy): void {
    this.customPolicies.push(policy);
  }

  /**
   * Remove a custom policy
   */
  removePolicy(policyId: string): boolean {
    const index = this.customPolicies.findIndex(p => p.id === policyId);
    if (index !== -1) {
      this.customPolicies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all policies
   */
  getPolicies(): ActionPolicy[] {
    return [...this.customPolicies];
  }

  /**
   * Log to audit trail
   */
  private logAudit(
    contractId: string,
    action: ValidatableAction,
    result: ActionValidationResult,
    context?: Record<string, unknown>
  ): void {
    const entry: AuditLogEntry = {
      id: `audit-${++this.auditIdCounter}-${Date.now()}`,
      timestamp: new Date(),
      contractId,
      action,
      result,
    };
    if (context) {
      entry.context = context;
    }

    this.auditLog.push(entry);

    // Trim log if too large
    while (this.auditLog.length > this.config.maxAuditEntries) {
      this.auditLog.shift();
    }
  }

  /**
   * Get audit log entries
   */
  getAuditLog(options?: {
    contractId?: string;
    since?: Date;
    allowed?: boolean;
    limit?: number;
  }): AuditLogEntry[] {
    let entries = [...this.auditLog];

    if (options?.contractId) {
      entries = entries.filter(e => e.contractId === options.contractId);
    }

    if (options?.since) {
      const since = options.since;
      entries = entries.filter(e => e.timestamp >= since);
    }

    if (options?.allowed !== undefined) {
      entries = entries.filter(e => e.result.allowed === options.allowed);
    }

    if (options?.limit) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get audit statistics
   */
  getAuditStats(): {
    total: number;
    allowed: number;
    blocked: number;
    byViolationCode: Record<string, number>;
  } {
    const stats = {
      total: this.auditLog.length,
      allowed: 0,
      blocked: 0,
      byViolationCode: {} as Record<string, number>,
    };

    for (const entry of this.auditLog) {
      if (entry.result.allowed) {
        stats.allowed++;
      } else {
        stats.blocked++;
      }

      for (const violation of entry.result.violations) {
        stats.byViolationCode[violation.code] =
          (stats.byViolationCode[violation.code] ?? 0) + 1;
      }
    }

    return stats;
  }

  // Type guards and helpers

  private isFileAction(action: ValidatableAction): action is FileAction {
    return ['FILE_READ', 'FILE_WRITE', 'FILE_DELETE'].includes(action.type);
  }

  private isToolCall(action: ValidatableAction): action is ToolCallAction {
    return action.type === 'TOOL_CALL';
  }

  private isNetworkAction(action: ValidatableAction): action is NetworkAction {
    return action.type === 'NETWORK_REQUEST';
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    return minimatch(normalizedPath, normalizedPattern, {
      dot: true,
      matchBase: true,
    });
  }

  private matchesToolPattern(tool: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return tool.startsWith(prefix);
    }
    return tool === pattern;
  }
}

/**
 * Error thrown when action validation fails
 */
export class ActionValidationError extends Error {
  constructor(
    public readonly action: ValidatableAction,
    public readonly violations: ActionViolation[],
    message: string
  ) {
    super(`Action validation failed: ${message}`);
    this.name = 'ActionValidationError';
  }
}

/**
 * Default action validator factory
 */
export function createActionValidator(
  architect: Architect,
  config?: ActionValidatorConfig
): ActionValidator {
  return new ActionValidator(architect, config);
}
