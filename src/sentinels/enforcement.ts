/**
 * Enforcement Engine - Real-time Action Control & Escalation
 *
 * "The Matrix is a system, Neo. That system is our enemy."
 *
 * Provides real-time action blocking, comprehensive logging,
 * escalation to human review, and audit trail for compliance.
 *
 * Phase 5 Implementation
 */

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
  type OutputValidationResult,
  type OutputValidatorConfig,
  type Severity,
} from './validators/output-validator.js';

/**
 * Escalation level
 */
export type EscalationLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Escalation request
 */
export interface EscalationRequest {
  id: string;
  timestamp: Date;
  level: EscalationLevel;
  reason: string;
  contractId: string;
  action?: ValidatableAction;
  output?: unknown;
  validationResult?: ActionValidationResult | OutputValidationResult;
  context?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

/**
 * Escalation handler interface
 */
export interface EscalationHandler {
  /**
   * Handle an escalation request
   * @returns true if escalation is approved, false if rejected
   */
  handle(request: EscalationRequest): Promise<boolean>;
}

/**
 * Log entry for enforcement events
 */
export interface EnforcementLogEntry {
  id: string;
  timestamp: Date;
  eventType: 'action_check' | 'action_blocked' | 'output_validated' | 'escalation' | 'policy_violation';
  contractId: string;
  details: {
    action?: ValidatableAction;
    output?: unknown;
    validationResult?: ActionValidationResult | OutputValidationResult;
    escalation?: EscalationRequest;
    blocked?: boolean;
    reason?: string;
  };
  severity: Severity;
}

/**
 * Enforcement statistics
 */
export interface EnforcementStats {
  totalActions: number;
  blockedActions: number;
  allowedActions: number;
  totalOutputs: number;
  validOutputs: number;
  invalidOutputs: number;
  escalations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  };
  byContractId: Record<string, {
    actions: number;
    blocked: number;
    outputs: number;
    invalid: number;
  }>;
}

/**
 * Enforcement Engine configuration
 */
export interface EnforcementConfig {
  /** Action validator configuration */
  actionValidatorConfig?: ActionValidatorConfig;
  /** Output validator configuration */
  outputValidatorConfig?: OutputValidatorConfig;
  /** Escalation handler (required for escalation support) */
  escalationHandler?: EscalationHandler;
  /** Auto-escalate on critical violations (default: true) */
  autoEscalate?: boolean;
  /** Escalation timeout in ms (default: 300000 = 5 minutes) */
  escalationTimeout?: number;
  /** Maximum log entries to keep (default: 10000) */
  maxLogEntries?: number;
  /** Enable strict mode - block on any violation (default: false) */
  strictMode?: boolean;
}

/**
 * Enforcement Engine
 *
 * Central enforcement system that coordinates action validation,
 * output validation, logging, and escalation.
 */
/**
 * Internal config type with required fields
 */
interface InternalEnforcementConfig {
  escalationHandler?: EscalationHandler;
  actionValidatorConfig?: ActionValidatorConfig;
  outputValidatorConfig?: OutputValidatorConfig;
  autoEscalate: boolean;
  escalationTimeout: number;
  maxLogEntries: number;
  strictMode: boolean;
}

export class EnforcementEngine {
  private architect: Architect;
  private config: InternalEnforcementConfig;
  private actionValidator: ActionValidator;
  private outputValidator: OutputValidator;
  private logs: EnforcementLogEntry[] = [];
  private escalations: Map<string, EscalationRequest> = new Map();
  private logIdCounter = 0;
  private escalationIdCounter = 0;

  constructor(architect: Architect, config: EnforcementConfig = {}) {
    this.architect = architect;
    this.config = {
      autoEscalate: config.autoEscalate ?? true,
      escalationTimeout: config.escalationTimeout ?? 300000,
      maxLogEntries: config.maxLogEntries ?? 10000,
      strictMode: config.strictMode ?? false,
    };

    if (config.actionValidatorConfig) {
      this.config.actionValidatorConfig = config.actionValidatorConfig;
    }
    if (config.outputValidatorConfig) {
      this.config.outputValidatorConfig = config.outputValidatorConfig;
    }
    if (config.escalationHandler) {
      this.config.escalationHandler = config.escalationHandler;
    }

    this.actionValidator = new ActionValidator(architect, config.actionValidatorConfig);
    this.outputValidator = new OutputValidator(config.outputValidatorConfig);
  }

  // ============ Action Enforcement ============

  /**
   * Check if an action is allowed
   * Does NOT block - just returns result
   */
  async checkAction(
    action: ValidatableAction,
    contract: Contract
  ): Promise<ActionValidationResult> {
    const result = await this.actionValidator.validate(action, contract);

    this.log({
      eventType: 'action_check',
      contractId: contract.contract.id,
      details: {
        action,
        validationResult: result,
        blocked: !result.allowed,
      },
      severity: result.allowed ? 'info' : 'error',
    });

    return result;
  }

  /**
   * Enforce action - block if not allowed
   * Throws ActionValidationError if blocked
   */
  async enforceAction(
    action: ValidatableAction,
    contract: Contract
  ): Promise<void> {
    const result = await this.actionValidator.validate(action, contract);

    if (!result.allowed) {
      const reason = result.violations[0]?.message ?? 'Action blocked';
      const details: EnforcementLogEntry['details'] = {
        action,
        validationResult: result,
        blocked: true,
      };
      if (reason) {
        details.reason = reason;
      }
      this.log({
        eventType: 'action_blocked',
        contractId: contract.contract.id,
        details,
        severity: 'error',
      });

      // Auto-escalate if enabled and has critical violations
      if (this.config.autoEscalate && this.hasCriticalViolations(result)) {
        await this.escalate({
          level: 'high',
          reason: `Critical action violation: ${result.violations[0]?.message}`,
          contractId: contract.contract.id,
          action,
          validationResult: result,
        });
      }

      throw new ActionValidationError(
        action,
        result.violations,
        result.violations[0]?.message ?? 'Action not allowed'
      );
    }

    this.log({
      eventType: 'action_check',
      contractId: contract.contract.id,
      details: {
        action,
        validationResult: result,
        blocked: false,
      },
      severity: 'info',
    });
  }

  /**
   * Enforce action with optional escalation on failure
   * Returns true if allowed, false if blocked (after escalation if applicable)
   */
  async enforceWithEscalation(
    action: ValidatableAction,
    contract: Contract
  ): Promise<boolean> {
    const result = await this.actionValidator.validate(action, contract);

    if (result.allowed) {
      return true;
    }

    // Check if escalation is possible
    if (!this.config.escalationHandler) {
      return false;
    }

    // Create escalation
    const level = this.determineEscalationLevel(result);
    const escalation = await this.escalate({
      level,
      reason: `Action blocked: ${result.violations[0]?.message}`,
      contractId: contract.contract.id,
      action,
      validationResult: result,
    });

    // Wait for resolution
    const approved = await this.waitForEscalation(escalation.id);
    return approved;
  }

  // ============ Output Enforcement ============

  /**
   * Validate output against contract requirements
   */
  async validateOutput(
    output: unknown,
    contract: Contract
  ): Promise<OutputValidationResult> {
    const result = await this.outputValidator.validate(output, contract);

    this.log({
      eventType: 'output_validated',
      contractId: contract.contract.id,
      details: {
        output,
        validationResult: result,
      },
      severity: result.valid ? 'info' : 'warning',
    });

    // Auto-escalate on invalid output if enabled
    if (!result.valid && this.config.autoEscalate && result.score < 5) {
      await this.escalate({
        level: 'medium',
        reason: `Output validation failed with score ${result.score}/10`,
        contractId: contract.contract.id,
        output,
        validationResult: result,
      });
    }

    return result;
  }

  /**
   * Check if output meets the success threshold
   */
  outputMeetsThreshold(result: OutputValidationResult, contract: Contract): boolean {
    return this.outputValidator.meetsThreshold(result, contract);
  }

  // ============ Escalation System ============

  /**
   * Create an escalation request
   */
  async escalate(request: Omit<EscalationRequest, 'id' | 'timestamp' | 'status'>): Promise<EscalationRequest> {
    const escalation: EscalationRequest = {
      id: `esc-${++this.escalationIdCounter}-${Date.now()}`,
      timestamp: new Date(),
      status: 'pending',
      ...request,
    };

    this.escalations.set(escalation.id, escalation);

    this.log({
      eventType: 'escalation',
      contractId: request.contractId,
      details: {
        escalation,
      },
      severity: this.escalationLevelToSeverity(request.level),
    });

    // Trigger handler if available
    if (this.config.escalationHandler) {
      try {
        const approved = await this.config.escalationHandler.handle(escalation);
        this.resolveEscalation(escalation.id, approved ? 'approved' : 'rejected');
      } catch (error) {
        // Handler failed - leave as pending
        console.error('Escalation handler failed:', error);
      }
    }

    // Set timeout
    setTimeout(() => {
      const esc = this.escalations.get(escalation.id);
      if (esc && esc.status === 'pending') {
        this.resolveEscalation(escalation.id, 'expired');
      }
    }, this.config.escalationTimeout);

    return escalation;
  }

  /**
   * Resolve an escalation
   */
  resolveEscalation(
    id: string,
    status: 'approved' | 'rejected' | 'expired',
    resolvedBy?: string,
    resolution?: string
  ): boolean {
    const escalation = this.escalations.get(id);
    if (!escalation || escalation.status !== 'pending') {
      return false;
    }

    escalation.status = status;
    escalation.resolvedAt = new Date();
    if (resolvedBy) {
      escalation.resolvedBy = resolvedBy;
    }
    if (resolution) {
      escalation.resolution = resolution;
    }

    return true;
  }

  /**
   * Wait for escalation to be resolved
   */
  private async waitForEscalation(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const escalation = this.escalations.get(id);
        if (!escalation || escalation.status !== 'pending') {
          clearInterval(checkInterval);
          resolve(escalation?.status === 'approved');
        }
      }, 100);

      // Timeout safety
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, this.config.escalationTimeout + 1000);
    });
  }

  /**
   * Get pending escalations
   */
  getPendingEscalations(): EscalationRequest[] {
    return Array.from(this.escalations.values()).filter(e => e.status === 'pending');
  }

  /**
   * Get escalation by ID
   */
  getEscalation(id: string): EscalationRequest | undefined {
    return this.escalations.get(id);
  }

  /**
   * Get all escalations
   */
  getAllEscalations(options?: {
    status?: EscalationRequest['status'];
    level?: EscalationLevel;
    contractId?: string;
  }): EscalationRequest[] {
    let escalations = Array.from(this.escalations.values());

    if (options?.status) {
      escalations = escalations.filter(e => e.status === options.status);
    }
    if (options?.level) {
      escalations = escalations.filter(e => e.level === options.level);
    }
    if (options?.contractId) {
      escalations = escalations.filter(e => e.contractId === options.contractId);
    }

    return escalations;
  }

  // ============ Logging & Audit ============

  /**
   * Add a log entry
   */
  private log(entry: Omit<EnforcementLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: EnforcementLogEntry = {
      id: `log-${++this.logIdCounter}-${Date.now()}`,
      timestamp: new Date(),
      ...entry,
    };

    this.logs.push(logEntry);

    // Trim if too large
    while (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift();
    }
  }

  /**
   * Get log entries
   */
  getLogs(options?: {
    eventType?: EnforcementLogEntry['eventType'];
    contractId?: string;
    severity?: Severity;
    since?: Date;
    limit?: number;
  }): EnforcementLogEntry[] {
    let entries = [...this.logs];

    if (options?.eventType) {
      entries = entries.filter(e => e.eventType === options.eventType);
    }
    if (options?.contractId) {
      entries = entries.filter(e => e.contractId === options.contractId);
    }
    if (options?.severity) {
      entries = entries.filter(e => e.severity === options.severity);
    }
    if (options?.since) {
      const since = options.since;
      entries = entries.filter(e => e.timestamp >= since);
    }
    if (options?.limit) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  /**
   * Get blocked actions from logs
   */
  getBlockedActions(options?: {
    contractId?: string;
    since?: Date;
    limit?: number;
  }): EnforcementLogEntry[] {
    return this.getLogs({
      ...options,
      eventType: 'action_blocked',
    });
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get enforcement statistics
   */
  getStats(): EnforcementStats {
    const stats: EnforcementStats = {
      totalActions: 0,
      blockedActions: 0,
      allowedActions: 0,
      totalOutputs: 0,
      validOutputs: 0,
      invalidOutputs: 0,
      escalations: {
        total: this.escalations.size,
        pending: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
      },
      byContractId: {},
    };

    // Count escalations by status
    for (const esc of this.escalations.values()) {
      stats.escalations[esc.status]++;
    }

    // Process logs
    for (const entry of this.logs) {
      // Initialize contract stats if needed
      if (!stats.byContractId[entry.contractId]) {
        stats.byContractId[entry.contractId] = {
          actions: 0,
          blocked: 0,
          outputs: 0,
          invalid: 0,
        };
      }
      const contractStats = stats.byContractId[entry.contractId];
      if (!contractStats) continue;

      switch (entry.eventType) {
        case 'action_check':
        case 'action_blocked':
          stats.totalActions++;
          contractStats.actions++;
          if (entry.details.blocked) {
            stats.blockedActions++;
            contractStats.blocked++;
          } else {
            stats.allowedActions++;
          }
          break;

        case 'output_validated':
          stats.totalOutputs++;
          contractStats.outputs++;
          const result = entry.details.validationResult as OutputValidationResult | undefined;
          if (result?.valid) {
            stats.validOutputs++;
          } else {
            stats.invalidOutputs++;
            contractStats.invalid++;
          }
          break;
      }
    }

    return stats;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(options?: {
    contractId?: string;
    since?: Date;
  }): string {
    const stats = this.getStats();
    const logs = this.getLogs(options);
    const escalations = this.getAllEscalations(options);

    const lines: string[] = [];

    lines.push('=====================================');
    lines.push('ENFORCEMENT COMPLIANCE REPORT');
    lines.push('=====================================');
    lines.push(`Generated: ${new Date().toISOString()}`);
    if (options?.contractId) {
      lines.push(`Contract: ${options.contractId}`);
    }
    if (options?.since) {
      lines.push(`Since: ${options.since.toISOString()}`);
    }
    lines.push('');

    lines.push('ACTION ENFORCEMENT');
    lines.push('------------------');
    lines.push(`Total Actions: ${stats.totalActions}`);
    lines.push(`Allowed: ${stats.allowedActions}`);
    lines.push(`Blocked: ${stats.blockedActions}`);
    lines.push(`Block Rate: ${stats.totalActions > 0 ? ((stats.blockedActions / stats.totalActions) * 100).toFixed(1) : 0}%`);
    lines.push('');

    lines.push('OUTPUT VALIDATION');
    lines.push('-----------------');
    lines.push(`Total Outputs: ${stats.totalOutputs}`);
    lines.push(`Valid: ${stats.validOutputs}`);
    lines.push(`Invalid: ${stats.invalidOutputs}`);
    lines.push(`Success Rate: ${stats.totalOutputs > 0 ? ((stats.validOutputs / stats.totalOutputs) * 100).toFixed(1) : 0}%`);
    lines.push('');

    lines.push('ESCALATIONS');
    lines.push('-----------');
    lines.push(`Total: ${stats.escalations.total}`);
    lines.push(`Pending: ${stats.escalations.pending}`);
    lines.push(`Approved: ${stats.escalations.approved}`);
    lines.push(`Rejected: ${stats.escalations.rejected}`);
    lines.push(`Expired: ${stats.escalations.expired}`);
    lines.push('');

    if (escalations.length > 0) {
      lines.push('ESCALATION DETAILS');
      lines.push('------------------');
      for (const esc of escalations.slice(-10)) {
        lines.push(`[${esc.level.toUpperCase()}] ${esc.timestamp.toISOString()}`);
        lines.push(`  Status: ${esc.status}`);
        lines.push(`  Reason: ${esc.reason}`);
        if (esc.resolution) {
          lines.push(`  Resolution: ${esc.resolution}`);
        }
        lines.push('');
      }
    }

    const blockedLogs = logs.filter(l => l.eventType === 'action_blocked').slice(-10);
    if (blockedLogs.length > 0) {
      lines.push('RECENT BLOCKED ACTIONS');
      lines.push('----------------------');
      for (const log of blockedLogs) {
        lines.push(`${log.timestamp.toISOString()}: ${log.details.reason ?? 'Unknown'}`);
      }
    }

    return lines.join('\n');
  }

  // ============ Helper Methods ============

  private hasCriticalViolations(result: ActionValidationResult): boolean {
    return result.violations.some(v => v.severity === 'critical');
  }

  private determineEscalationLevel(result: ActionValidationResult): EscalationLevel {
    const hasCritical = result.violations.some(v => v.severity === 'critical');
    const hasError = result.violations.some(v => v.severity === 'error');
    const hasWarning = result.violations.some(v => v.severity === 'warning');

    if (hasCritical) return 'critical';
    if (hasError) return 'high';
    if (hasWarning) return 'medium';
    return 'low';
  }

  private escalationLevelToSeverity(level: EscalationLevel): Severity {
    switch (level) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  }

  // ============ Accessors ============

  /**
   * Get action validator instance
   */
  getActionValidator(): ActionValidator {
    return this.actionValidator;
  }

  /**
   * Get output validator instance
   */
  getOutputValidator(): OutputValidator {
    return this.outputValidator;
  }

  /**
   * Set escalation handler
   */
  setEscalationHandler(handler: EscalationHandler): void {
    this.config.escalationHandler = handler;
  }
}

/**
 * Create enforcement engine with default configuration
 */
export function createEnforcementEngine(
  architect: Architect,
  config?: EnforcementConfig
): EnforcementEngine {
  return new EnforcementEngine(architect, config);
}

/**
 * Simple console-based escalation handler for testing
 */
export class ConsoleEscalationHandler implements EscalationHandler {
  async handle(request: EscalationRequest): Promise<boolean> {
    console.log(`\n[ESCALATION] Level: ${request.level}`);
    console.log(`Contract: ${request.contractId}`);
    console.log(`Reason: ${request.reason}`);
    console.log(`Timestamp: ${request.timestamp.toISOString()}`);

    // For testing, auto-approve low/medium, reject high/critical
    const approved = request.level === 'low' || request.level === 'medium' || request.level === 'none';
    console.log(`Auto-decision: ${approved ? 'APPROVED' : 'REJECTED'}\n`);

    return approved;
  }
}
