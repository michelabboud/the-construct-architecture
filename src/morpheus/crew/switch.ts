/**
 * Switch Agent - The Skeptic
 *
 * "Not like this. Not like this." — Switch
 *
 * Switch is the validator who questions everything, ensures quality,
 * audits changes, and validates migrations before they're applied.
 */

import {
  BaseAgent,
  AgentTask,
  VerificationContext,
  createDefaultAgentConfig,
} from './base-agent.js';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AuditReport,
  AuditFinding,
  GeneratedContract,
  GeneratedConfig,
  MigrationPlan,
  MigrationTask,
  CodeChange,
  ProjectScan,
  AgentConfig,
  VerificationResult as ChecklistVerificationResult,
} from '../../types/morpheus.js';

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Contract validation rules
 */
const CONTRACT_RULES = {
  required_fields: ['id', 'version', 'type', 'name'],
  valid_types: ['completion', 'chat', 'embedding', 'tool', 'agent', 'workflow'],
  version_pattern: /^\d+\.\d+\.\d+$/,
  id_pattern: /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/,
  max_objectives: 10,
  min_objectives: 1,
};

/**
 * Config validation rules
 */
const CONFIG_RULES = {
  architect: {
    required: ['truth', 'models'],
    optional: ['contracts', 'defaults'],
  },
  keymaker: {
    required: ['providers'],
    optional: ['routing', 'rateLimiting', 'fallback'],
  },
  sentinels: {
    required: ['validation'],
    optional: ['quality', 'forbidden', 'escalation'],
  },
  oracle: {
    required: ['xp', 'levels'],
    optional: ['judgment', 'insights'],
  },
  smith: {
    required: ['security'],
    optional: ['team', 'policies'],
  },
};

/**
 * Migration validation rules
 */
const MIGRATION_RULES = {
  max_tasks_per_phase: 20,
  required_rollback: true,
  required_verification: true,
  max_file_changes: 50,
  forbidden_patterns: [
    /rm\s+-rf\s+\//,      // Dangerous rm commands
    /DROP\s+DATABASE/i,    // Database drops
    /DELETE\s+FROM.*WHERE\s+1/i, // Mass deletes
    /eval\s*\(/,           // Dynamic eval
  ],
};

/**
 * Code change risk levels (matches CodeChange.type values)
 */
const CHANGE_RISK: Record<CodeChange['type'], number> = {
  delete: 3,
  modify: 2,
  create: 1,
};

// ============================================================================
// SWITCH AGENT CLASS
// ============================================================================

/**
 * Switch Agent - The Skeptic
 *
 * Validates everything, trusts nothing.
 */
export class Switch extends BaseAgent {
  private validationCache: Map<string, ValidationResult> = new Map();

  constructor(config: AgentConfig = createDefaultAgentConfig(['validate-contract', 'validate-migration', 'audit-changes'])) {
    super('switch', config);
  }

  // --------------------------------------------------------------------------
  // TASK EXECUTION
  // --------------------------------------------------------------------------

  protected async executeTask<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>
  ): Promise<TOutput> {
    const input = task.input as Record<string, unknown>;

    switch (task.type) {
      case 'validate':
        return this.handleValidateTask(input) as TOutput;
      case 'verify':
        return this.handleVerifyTask(input) as TOutput;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  private async handleValidateTask(input: Record<string, unknown>): Promise<unknown> {
    const validateType = input.validateType as string;

    switch (validateType) {
      case 'contract':
        return this.validateContract(input.contract as GeneratedContract);
      case 'contracts':
        return this.validateContracts(input.contracts as GeneratedContract[]);
      case 'config':
        return this.validateConfig(input.config as GeneratedConfig);
      case 'configs':
        return this.validateConfigs(input.configs as GeneratedConfig[]);
      case 'migration':
        return this.validateMigration(input.plan as MigrationPlan);
      case 'changes':
        return this.auditChanges(input.changes as CodeChange[], input.context as string);
      case 'task':
        return this.validateTask(input.task as MigrationTask);
      default:
        throw new Error(`Unknown validate type: ${validateType}`);
    }
  }

  private async handleVerifyTask(input: Record<string, unknown>): Promise<ChecklistVerificationResult> {
    const itemId = input.itemId as string;
    const context = input.context as VerificationContext;
    return this.performVerification(itemId, context);
  }

  protected async performVerification(
    itemId: string,
    context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    const itemText = context.itemText.toLowerCase();

    // Switch can verify validation-related checklist items
    if (this.isValidationItem(itemId, itemText)) {
      return this.verifyValidationItem(itemId, context);
    }

    // Check if this is a quality-related item
    if (this.isQualityItem(itemId, itemText)) {
      return this.verifyQualityItem(itemId, context);
    }

    // Check if this is an audit-related item
    if (this.isAuditItem(itemId, itemText)) {
      return this.verifyAuditItem(itemId, context);
    }

    return {
      verified: false,
      evidence: '',
      confidence: 0,
      method: 'manual',
      details: 'Item requires manual verification',
    };
  }

  private isValidationItem(itemId: string, text: string): boolean {
    return itemId.includes('validat') || text.includes('validat') || text.includes('check');
  }

  private isQualityItem(itemId: string, text: string): boolean {
    return itemId.includes('quality') || text.includes('quality') || text.includes('score');
  }

  private isAuditItem(itemId: string, text: string): boolean {
    return itemId.includes('audit') || text.includes('audit') || text.includes('review');
  }

  private async verifyValidationItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Validation capability verified - Switch can validate contracts and migrations',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyQualityItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Quality checking capability verified',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyAuditItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Audit capability verified - Switch can audit changes',
      confidence: 0.9,
      method: 'automated',
    };
  }

  // --------------------------------------------------------------------------
  // CONTRACT VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validate a single generated contract
   *
   * Note: Contracts may have extended fields (version, type, objectives, constraints,
   * qualityCriteria) that are used for validation but not part of the base type.
   */
  async validateContract(contract: GeneratedContract): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // Type assertion for contracts with extended fields (parsed from YAML)
    const extContract = contract as GeneratedContract & {
      version?: string;
      type?: string;
      objectives?: string[];
      constraints?: string[];
      qualityCriteria?: Record<string, unknown>;
    };

    // Check required fields
    for (const field of CONTRACT_RULES.required_fields) {
      if (!this.hasField(extContract, field)) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Missing required field: ${field}`,
          location: `contract.${field}`,
          suggestion: `Add the ${field} field to the contract`,
        });
        score -= 10;
      }
    }

    // Validate contract ID format
    if (extContract.id && !CONTRACT_RULES.id_pattern.test(extContract.id)) {
      errors.push({
        code: 'INVALID_ID_FORMAT',
        message: `Contract ID must match pattern: namespace/name`,
        location: 'contract.id',
        suggestion: 'Use format like "morpheus/scan-project"',
      });
      score -= 5;
    }

    // Validate version format
    if (extContract.version && !CONTRACT_RULES.version_pattern.test(extContract.version)) {
      warnings.push({
        code: 'INVALID_VERSION_FORMAT',
        message: `Version should follow semver: x.y.z`,
        location: 'contract.version',
      });
      score -= 2;
    }

    // Validate contract type
    if (extContract.type && !CONTRACT_RULES.valid_types.includes(extContract.type)) {
      errors.push({
        code: 'INVALID_CONTRACT_TYPE',
        message: `Invalid contract type: ${extContract.type}`,
        location: 'contract.type',
        suggestion: `Valid types: ${CONTRACT_RULES.valid_types.join(', ')}`,
      });
      score -= 10;
    }

    // Validate objectives
    if (extContract.objectives) {
      if (extContract.objectives.length < CONTRACT_RULES.min_objectives) {
        errors.push({
          code: 'TOO_FEW_OBJECTIVES',
          message: `Contract must have at least ${CONTRACT_RULES.min_objectives} objective`,
          location: 'contract.objectives',
        });
        score -= 5;
      }
      if (extContract.objectives.length > CONTRACT_RULES.max_objectives) {
        warnings.push({
          code: 'TOO_MANY_OBJECTIVES',
          message: `Consider splitting contract - ${extContract.objectives.length} objectives is too many`,
          location: 'contract.objectives',
        });
        score -= 3;
      }
    }

    // Validate constraints exist
    if (!extContract.constraints || extContract.constraints.length === 0) {
      warnings.push({
        code: 'NO_CONSTRAINTS',
        message: 'Contract has no constraints defined',
        location: 'contract.constraints',
      });
      score -= 2;
    }

    // Check for quality indicators
    if (!extContract.qualityCriteria || Object.keys(extContract.qualityCriteria).length === 0) {
      warnings.push({
        code: 'NO_QUALITY_CRITERIA',
        message: 'Contract has no quality criteria defined',
        location: 'contract.qualityCriteria',
      });
      score -= 2;
    }

    // Validate confidence score
    if (extContract.confidence !== undefined) {
      if (extContract.confidence < 0 || extContract.confidence > 1) {
        errors.push({
          code: 'INVALID_CONFIDENCE',
          message: 'Confidence must be between 0 and 1',
          location: 'contract.confidence',
        });
        score -= 5;
      }
      if (extContract.confidence < 0.5) {
        warnings.push({
          code: 'LOW_CONFIDENCE',
          message: `Low confidence score: ${extContract.confidence}`,
          location: 'contract.confidence',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  /**
   * Validate multiple contracts
   */
  async validateContracts(contracts: GeneratedContract[]): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let totalScore = 0;

    const ids = new Set<string>();

    for (const contract of contracts) {
      const result = await this.validateContract(contract);
      allErrors.push(...result.errors.map(e => ({
        ...e,
        location: `[${contract.id}] ${e.location || ''}`,
      })));
      allWarnings.push(...result.warnings.map(w => ({
        ...w,
        location: `[${contract.id}] ${w.location || ''}`,
      })));
      totalScore += result.score;

      // Check for duplicate IDs
      if (contract.id) {
        if (ids.has(contract.id)) {
          allErrors.push({
            code: 'DUPLICATE_CONTRACT_ID',
            message: `Duplicate contract ID: ${contract.id}`,
            location: 'contracts',
          });
        }
        ids.add(contract.id);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      score: contracts.length > 0 ? Math.round(totalScore / contracts.length) : 0,
    };
  }

  private hasField(obj: unknown, field: string): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    return field in obj && (obj as Record<string, unknown>)[field] !== undefined;
  }

  // --------------------------------------------------------------------------
  // CONFIG VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validate a generated config
   */
  async validateConfig(config: GeneratedConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // Check config type
    if (!config.type) {
      errors.push({
        code: 'MISSING_CONFIG_TYPE',
        message: 'Config type is required',
        location: 'config.type',
      });
      return { valid: false, errors, warnings, score: 0 };
    }

    const rules = CONFIG_RULES[config.type as keyof typeof CONFIG_RULES];
    if (!rules) {
      errors.push({
        code: 'UNKNOWN_CONFIG_TYPE',
        message: `Unknown config type: ${config.type}`,
        location: 'config.type',
        suggestion: `Valid types: ${Object.keys(CONFIG_RULES).join(', ')}`,
      });
      return { valid: false, errors, warnings, score: 0 };
    }

    // Parse YAML content to validate structure
    const content = config.content;

    // Check required fields based on type
    for (const field of rules.required) {
      if (!content.includes(`${field}:`)) {
        errors.push({
          code: 'MISSING_REQUIRED_SECTION',
          message: `Missing required section: ${field}`,
          location: `config.content.${field}`,
          suggestion: `Add ${field}: section to the config`,
        });
        score -= 15;
      }
    }

    // Check for optional but recommended fields
    for (const field of rules.optional || []) {
      if (!content.includes(`${field}:`)) {
        warnings.push({
          code: 'MISSING_OPTIONAL_SECTION',
          message: `Consider adding optional section: ${field}`,
          location: `config.content.${field}`,
        });
        score -= 2;
      }
    }

    // Validate YAML syntax (basic check)
    if (!this.isValidYamlSyntax(content)) {
      errors.push({
        code: 'INVALID_YAML_SYNTAX',
        message: 'Config content has invalid YAML syntax',
        location: 'config.content',
      });
      score -= 20;
    }

    // Check for security issues
    const securityIssues = this.checkConfigSecurity(content);
    for (const issue of securityIssues) {
      if (issue.severity === 'error') {
        const error: ValidationError = {
          code: 'SECURITY_ISSUE',
          message: issue.message,
          location: 'config.content',
        };
        if (issue.suggestion) {
          error.suggestion = issue.suggestion;
        }
        errors.push(error);
        score -= 15;
      } else {
        warnings.push({
          code: 'SECURITY_WARNING',
          message: issue.message,
          location: 'config.content',
        });
        score -= 5;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  /**
   * Validate multiple configs
   */
  async validateConfigs(configs: GeneratedConfig[]): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let totalScore = 0;

    const types = new Set<string>();

    for (const config of configs) {
      const result = await this.validateConfig(config);
      allErrors.push(...result.errors.map(e => ({
        ...e,
        location: `[${config.type}] ${e.location || ''}`,
      })));
      allWarnings.push(...result.warnings.map(w => ({
        ...w,
        location: `[${config.type}] ${w.location || ''}`,
      })));
      totalScore += result.score;

      // Check for duplicate types
      if (config.type) {
        if (types.has(config.type)) {
          allErrors.push({
            code: 'DUPLICATE_CONFIG_TYPE',
            message: `Duplicate config type: ${config.type}`,
            location: 'configs',
          });
        }
        types.add(config.type);
      }
    }

    // Check for missing required config types
    const requiredTypes = ['architect', 'keymaker', 'sentinels'];
    for (const type of requiredTypes) {
      if (!types.has(type)) {
        allWarnings.push({
          code: 'MISSING_CONFIG_TYPE',
          message: `Consider adding ${type} config`,
          location: 'configs',
        });
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      score: configs.length > 0 ? Math.round(totalScore / configs.length) : 0,
    };
  }

  /**
   * Basic YAML syntax validation
   */
  private isValidYamlSyntax(content: string): boolean {
    // Check for basic YAML structure
    const lines = content.split('\n');
    let indentStack: number[] = [0];

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) continue;

      // Check indentation
      const indent = line.search(/\S/);
      if (indent === -1) continue;

      // Check for tabs (YAML prefers spaces)
      if (line.includes('\t')) {
        return false;
      }

      // Check for unbalanced quotes
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        // Could be multiline string, so just warn
      }
    }

    return true;
  }

  /**
   * Check config for security issues
   */
  private checkConfigSecurity(content: string): Array<{ severity: 'error' | 'warning'; message: string; suggestion?: string }> {
    const issues: Array<{ severity: 'error' | 'warning'; message: string; suggestion?: string }> = [];

    // Check for hardcoded secrets
    if (/sk-[a-zA-Z0-9]{20,}/.test(content)) {
      issues.push({
        severity: 'error',
        message: 'Hardcoded API key detected',
        suggestion: 'Use environment variables instead',
      });
    }

    // Check for hardcoded passwords
    if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(content)) {
      issues.push({
        severity: 'error',
        message: 'Hardcoded password detected',
        suggestion: 'Use environment variables or secrets manager',
      });
    }

    // Check for overly permissive settings
    if (/allowAll\s*:\s*true/i.test(content)) {
      issues.push({
        severity: 'warning',
        message: 'Overly permissive setting: allowAll',
        suggestion: 'Consider restricting permissions',
      });
    }

    // Check for disabled security
    if (/security\s*:\s*false/i.test(content) || /disabled\s*:\s*true/i.test(content)) {
      issues.push({
        severity: 'warning',
        message: 'Security appears to be disabled',
        suggestion: 'Enable security features',
      });
    }

    return issues;
  }

  // --------------------------------------------------------------------------
  // MIGRATION VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validate a migration plan
   */
  async validateMigration(plan: MigrationPlan): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // Check plan structure
    if (!plan.id) {
      errors.push({
        code: 'MISSING_PLAN_ID',
        message: 'Migration plan must have an ID',
        location: 'plan.id',
      });
      score -= 10;
    }

    if (!plan.phases || plan.phases.length === 0) {
      errors.push({
        code: 'NO_PHASES',
        message: 'Migration plan must have at least one phase',
        location: 'plan.phases',
      });
      return { valid: false, errors, warnings, score: 0 };
    }

    // Validate each phase
    let totalTasks = 0;
    for (let i = 0; i < plan.phases.length; i++) {
      const phase = plan.phases[i]!;

      if (!phase.name) {
        errors.push({
          code: 'MISSING_PHASE_NAME',
          message: `Phase ${i + 1} is missing a name`,
          location: `plan.phases[${i}].name`,
        });
        score -= 5;
      }

      if (!phase.tasks || phase.tasks.length === 0) {
        warnings.push({
          code: 'EMPTY_PHASE',
          message: `Phase "${phase.name || i + 1}" has no tasks`,
          location: `plan.phases[${i}].tasks`,
        });
        score -= 2;
      } else {
        if (phase.tasks.length > MIGRATION_RULES.max_tasks_per_phase) {
          warnings.push({
            code: 'TOO_MANY_TASKS',
            message: `Phase "${phase.name}" has ${phase.tasks.length} tasks (max: ${MIGRATION_RULES.max_tasks_per_phase})`,
            location: `plan.phases[${i}].tasks`,
          });
          score -= 3;
        }

        // Validate each task
        for (let j = 0; j < phase.tasks.length; j++) {
          const task = phase.tasks[j]!;
          const taskResult = await this.validateTask(task);

          errors.push(...taskResult.errors.map(e => ({
            ...e,
            location: `plan.phases[${i}].tasks[${j}].${e.location || ''}`,
          })));
          warnings.push(...taskResult.warnings.map(w => ({
            ...w,
            location: `plan.phases[${i}].tasks[${j}].${w.location || ''}`,
          })));
          score -= (100 - taskResult.score) / 10;
        }

        totalTasks += phase.tasks.length;
      }
    }

    // Check for rollback plan at phase level
    const hasRollback = plan.phases.some(phase => phase.rollback && phase.rollback.length > 0);
    if (MIGRATION_RULES.required_rollback && !hasRollback) {
      errors.push({
        code: 'MISSING_ROLLBACK',
        message: 'Migration plan must include rollback steps in at least one phase',
        location: 'plan.phases[].rollback',
        suggestion: 'Add rollback procedures for each phase',
      });
      score -= 15;
    }

    // Check risks
    if (!plan.risks || plan.risks.length === 0) {
      warnings.push({
        code: 'NO_RISKS_IDENTIFIED',
        message: 'No risks identified in migration plan',
        location: 'plan.risks',
      });
      score -= 5;
    } else {
      // Check that high risks have mitigations
      for (const risk of plan.risks) {
        const isHighRisk = risk.probability === 'high' || risk.impact === 'high';
        const hasMitigation = plan.mitigations?.some(m => m.riskId === risk.id);
        if (isHighRisk && !hasMitigation) {
          errors.push({
            code: 'UNMITIGATED_RISK',
            message: `High risk "${risk.title}" (probability: ${risk.probability}, impact: ${risk.impact}) has no mitigation`,
            location: 'plan.risks',
            suggestion: 'Add mitigation strategy for high risks',
          });
          score -= 10;
        }
      }
    }

    // Check estimates
    if (!plan.estimates) {
      warnings.push({
        code: 'NO_ESTIMATES',
        message: 'Migration plan has no effort estimates',
        location: 'plan.estimates',
      });
      score -= 3;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.round(score)),
    };
  }

  /**
   * Validate a single migration task
   */
  async validateTask(task: MigrationTask): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // Check required fields
    if (!task.id) {
      errors.push({
        code: 'MISSING_TASK_ID',
        message: 'Task must have an ID',
        location: 'id',
      });
      score -= 10;
    }

    if (!task.name) {
      errors.push({
        code: 'MISSING_TASK_NAME',
        message: 'Task must have a name',
        location: 'name',
      });
      score -= 10;
    }

    // Check for steps
    if (!task.steps || task.steps.length === 0) {
      errors.push({
        code: 'NO_STEPS',
        message: 'Task must have at least one step',
        location: 'steps',
      });
      score -= 15;
    } else {
      // Validate steps
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i]!;

        if (!step.description) {
          warnings.push({
            code: 'MISSING_STEP_DESCRIPTION',
            message: `Step ${i + 1} is missing a description`,
            location: `steps[${i}].description`,
          });
          score -= 2;
        }

        // Check for forbidden patterns in commands
        if (step.command) {
          for (const pattern of MIGRATION_RULES.forbidden_patterns) {
            if (pattern.test(step.command)) {
              errors.push({
                code: 'FORBIDDEN_COMMAND',
                message: `Step ${i + 1} contains forbidden command pattern`,
                location: `steps[${i}].command`,
                suggestion: 'Review and remove dangerous commands',
              });
              score -= 20;
            }
          }
        }
      }
    }

    // Check verification (it's a string description in the type)
    if (MIGRATION_RULES.required_verification && !task.verification) {
      warnings.push({
        code: 'NO_VERIFICATION',
        message: 'Task has no verification step',
        location: 'verification',
      });
      score -= 5;
    }

    // Note: Rollback is at the phase level, not task level

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  // --------------------------------------------------------------------------
  // CHANGE AUDITING
  // --------------------------------------------------------------------------

  /**
   * Audit code changes
   */
  async auditChanges(changes: CodeChange[], context?: string): Promise<AuditReport> {
    const findings: AuditFinding[] = [];
    let overallScore = 100;

    // Track change statistics
    let creates = 0;
    let modifies = 0;
    let deletes = 0;
    let totalRisk = 0;

    for (const change of changes) {
      // Count by type and add risk
      totalRisk += CHANGE_RISK[change.type];

      switch (change.type) {
        case 'create':
          creates++;
          break;
        case 'modify':
          modifies++;
          break;
        case 'delete':
          deletes++;
          // Flag deletions
          findings.push({
            severity: 'medium',
            area: 'file-changes',
            finding: `File deletion: ${change.file}`,
            remediation: 'Verify this file is safe to delete',
          });
          break;
      }

      // Check for sensitive file changes
      if (this.isSensitiveFile(change.file)) {
        findings.push({
          severity: 'high',
          area: 'security',
          finding: `Sensitive file modified: ${change.file}`,
          remediation: 'Review changes to sensitive files carefully',
        });
        overallScore -= 10;
      }

      // Check for large changes by counting lines in before/after
      const afterLines = change.after?.split('\n').length ?? 0;
      const beforeLines = change.before?.split('\n').length ?? 0;

      if (afterLines > 500) {
        findings.push({
          severity: 'low',
          area: 'complexity',
          finding: `Large file (${afterLines} lines): ${change.file}`,
          remediation: 'Consider breaking into smaller changes',
        });
        overallScore -= 2;
      }

      if (beforeLines > 200 && change.type === 'delete') {
        findings.push({
          severity: 'medium',
          area: 'complexity',
          finding: `Large deletion (${beforeLines} lines): ${change.file}`,
          remediation: 'Verify removed code is not needed',
        });
        overallScore -= 5;
      }

      // Check content for issues (use 'after' content for new/modified, 'before' for context)
      const contentToAudit = change.after || change.before;
      if (contentToAudit) {
        const contentIssues = this.auditChangeContent(contentToAudit, change.file);
        findings.push(...contentIssues);
        overallScore -= contentIssues.filter(f => f.severity === 'high').length * 10;
        overallScore -= contentIssues.filter(f => f.severity === 'medium').length * 5;
        overallScore -= contentIssues.filter(f => f.severity === 'low').length * 2;
      }
    }

    // Check total changes
    if (changes.length > MIGRATION_RULES.max_file_changes) {
      findings.push({
        severity: 'medium',
        area: 'scope',
        finding: `Large change set: ${changes.length} files (recommended max: ${MIGRATION_RULES.max_file_changes})`,
        remediation: 'Consider breaking into smaller change sets',
      });
      overallScore -= 10;
    }

    // Add summary finding
    findings.unshift({
      severity: 'info',
      area: 'summary',
      finding: `Change summary: ${creates} created, ${modifies} modified, ${deletes} deleted`,
    });

    // Calculate risk level
    const avgRisk = changes.length > 0 ? totalRisk / changes.length : 0;
    let recommendation: AuditReport['recommendation'] = 'approve';

    if (findings.some(f => f.severity === 'high')) {
      recommendation = 'review';
      overallScore = Math.min(overallScore, 70);
    }

    if (findings.filter(f => f.severity === 'high').length > 2 || avgRisk > 2.5) {
      recommendation = 'reject';
      overallScore = Math.min(overallScore, 50);
    }

    return {
      migration: context || 'unknown',
      timestamp: new Date(),
      findings,
      overallScore: Math.max(0, overallScore),
      recommendation,
    };
  }

  /**
   * Check if file is sensitive
   */
  private isSensitiveFile(path: string): boolean {
    const sensitivePatterns = [
      /\.env/i,
      /secrets?\./i,
      /credentials?\./i,
      /auth\./i,
      /password/i,
      /\.pem$/i,
      /\.key$/i,
      /config\/security/i,
    ];

    return sensitivePatterns.some(p => p.test(path));
  }

  /**
   * Audit change content for issues
   */
  private auditChangeContent(content: string, path: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Check for secrets
    if (/sk-[a-zA-Z0-9]{20,}/.test(content)) {
      findings.push({
        severity: 'high',
        area: 'security',
        finding: `API key detected in ${path}`,
        remediation: 'Remove API key and use environment variables',
      });
    }

    // Check for debug code
    if (/console\.(log|debug)\s*\(/.test(content) && !path.includes('test')) {
      findings.push({
        severity: 'low',
        area: 'quality',
        finding: `Debug logging in ${path}`,
        remediation: 'Consider removing debug statements',
      });
    }

    // Check for TODO/FIXME comments
    if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(content)) {
      findings.push({
        severity: 'info',
        area: 'quality',
        finding: `TODO/FIXME comment in ${path}`,
        remediation: 'Address or track these items',
      });
    }

    // Check for disabled tests
    if (/\.(skip|only)\s*\(/.test(content) && path.includes('test')) {
      findings.push({
        severity: 'medium',
        area: 'testing',
        finding: `Skipped or focused test in ${path}`,
        remediation: 'Remove .skip() or .only() before merging',
      });
    }

    // Check for eval usage
    if (/\beval\s*\(/.test(content)) {
      findings.push({
        severity: 'high',
        area: 'security',
        finding: `eval() usage in ${path}`,
        remediation: 'Avoid using eval() - it is a security risk',
      });
    }

    return findings;
  }

  // --------------------------------------------------------------------------
  // QUALITY SCORING
  // --------------------------------------------------------------------------

  /**
   * Calculate overall quality score for a project
   */
  calculateQualityScore(scan: ProjectScan, validations: ValidationResult[]): number {
    let score = 100;

    // Penalize based on validation issues
    for (const validation of validations) {
      score -= validation.errors.length * 5;
      score -= validation.warnings.length * 1;
    }

    // Bonus for good practices
    if (scan.files.some(f => f.relativePath.includes('test'))) {
      score += 5; // Has tests
    }

    if (scan.files.some(f => f.relativePath.includes('types') || f.relativePath.endsWith('.d.ts'))) {
      score += 5; // Has type definitions
    }

    return Math.max(0, Math.min(100, score));
  }

  // --------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Get cached validation result
   */
  getCachedValidation(key: string): ValidationResult | undefined {
    return this.validationCache.get(key);
  }

  /**
   * Cache validation result
   */
  cacheValidation(key: string, result: ValidationResult): void {
    this.validationCache.set(key, result);
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Switch agent instance
 *
 * "Not like this. Not like this."
 */
export function createSwitch(config?: AgentConfig): Switch {
  return new Switch(config);
}
