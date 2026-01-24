/**
 * Output Validator - Output Quality Assurance
 *
 * "You have to understand, most people are not ready to be unplugged."
 *
 * Validates outputs against schemas, checks deliverables,
 * provides AI-based quality scoring, and severity classification.
 *
 * Phase 5 Implementation
 */

import { z } from 'zod';
import type { Contract } from '../../architect/schemas/contract.schema.js';

/**
 * Severity levels for validation issues
 */
export type Severity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Validation issue details
 */
export interface ValidationIssue {
  code: string;
  message: string;
  severity: Severity;
  path?: string;
  expected?: unknown;
  actual?: unknown;
  suggestion?: string;
}

/**
 * Deliverable validation result
 */
export interface DeliverableValidationResult {
  deliverableIndex: number;
  deliverableType: string;
  valid: boolean;
  issues: ValidationIssue[];
  metadata?: Record<string, unknown>;
}

/**
 * Quality score breakdown
 */
export interface QualityScoreBreakdown {
  completeness: number;    // 0-1: Are all deliverables present?
  correctness: number;     // 0-1: Do outputs match requirements?
  format: number;          // 0-1: Are formats correct?
  constraints: number;     // 0-1: Are limitations respected?
  aiScore?: number;        // 0-1: AI-based quality assessment (optional)
}

/**
 * Full output validation result
 */
export interface OutputValidationResult {
  valid: boolean;
  score: number;           // 0-10 overall score
  scoreBreakdown: QualityScoreBreakdown;
  issues: ValidationIssue[];
  deliverables: DeliverableValidationResult[];
  timestamp: Date;
  durationMs: number;
}

/**
 * AI Quality Scorer interface (pluggable)
 */
export interface AIQualityScorer {
  /**
   * Score the quality of an output
   * @param output The output to score
   * @param contract The contract requirements
   * @returns Score between 0 and 1
   */
  score(output: unknown, contract: Contract): Promise<number>;
}

/**
 * Schema provider interface
 */
export interface SchemaProvider {
  /**
   * Get schema for a deliverable type
   */
  getSchema(type: string): z.ZodSchema | undefined;
}

/**
 * Output Validator configuration
 */
export interface OutputValidatorConfig {
  /** AI quality scorer (optional) */
  aiScorer?: AIQualityScorer;
  /** Schema provider for deliverable validation */
  schemaProvider?: SchemaProvider;
  /** Weights for score calculation */
  scoreWeights?: {
    completeness?: number;
    correctness?: number;
    format?: number;
    constraints?: number;
    aiScore?: number;
  };
  /** Strict mode - fail on any issue */
  strictMode?: boolean;
}

/**
 * Default schema provider with common deliverable schemas
 */
export class DefaultSchemaProvider implements SchemaProvider {
  private schemas: Map<string, z.ZodSchema> = new Map();

  constructor() {
    this.registerDefaultSchemas();
  }

  private registerDefaultSchemas(): void {
    // Image deliverable
    this.schemas.set('image', z.object({
      path: z.string().optional(),
      url: z.string().url().optional(),
      format: z.enum(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']).optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    }).refine(data => data.path !== undefined || data.url !== undefined, {
      message: 'Image must have either path or url',
    }));

    // Text deliverable
    this.schemas.set('text', z.object({
      content: z.string(),
      format: z.enum(['plain', 'markdown', 'html', 'json']).optional(),
      encoding: z.string().optional(),
    }));

    // File deliverable
    this.schemas.set('file', z.object({
      path: z.string(),
      content: z.unknown().optional(),
      size: z.number().nonnegative().optional(),
      mimeType: z.string().optional(),
    }));

    // Code deliverable
    this.schemas.set('code', z.object({
      content: z.string(),
      language: z.string(),
      filename: z.string().optional(),
    }));

    // Data deliverable
    this.schemas.set('data', z.object({
      data: z.unknown(),
      format: z.enum(['json', 'yaml', 'csv', 'xml']).optional(),
      schema: z.string().optional(),
    }));
  }

  getSchema(type: string): z.ZodSchema | undefined {
    return this.schemas.get(type.toLowerCase());
  }

  registerSchema(type: string, schema: z.ZodSchema): void {
    this.schemas.set(type.toLowerCase(), schema);
  }
}

/**
 * Output Validator
 *
 * Validates contract outputs against requirements, schemas,
 * and optional AI-based quality assessment.
 */
/**
 * Internal config type with required weights
 */
interface InternalConfig {
  aiScorer?: AIQualityScorer;
  schemaProvider: SchemaProvider;
  scoreWeights: Required<NonNullable<OutputValidatorConfig['scoreWeights']>>;
  strictMode: boolean;
}

export class OutputValidator {
  private config: InternalConfig;

  constructor(config: OutputValidatorConfig = {}) {
    const scoreWeights: InternalConfig['scoreWeights'] = {
      completeness: config.scoreWeights?.completeness ?? 0.3,
      correctness: config.scoreWeights?.correctness ?? 0.3,
      format: config.scoreWeights?.format ?? 0.2,
      constraints: config.scoreWeights?.constraints ?? 0.2,
      aiScore: config.scoreWeights?.aiScore ?? 0,
    };

    // Adjust weights if AI scorer is provided
    if (config.aiScorer && !config.scoreWeights) {
      scoreWeights.completeness = 0.2;
      scoreWeights.correctness = 0.2;
      scoreWeights.format = 0.15;
      scoreWeights.constraints = 0.15;
      scoreWeights.aiScore = 0.3;
    }

    this.config = {
      schemaProvider: config.schemaProvider ?? new DefaultSchemaProvider(),
      scoreWeights,
      strictMode: config.strictMode ?? false,
    };

    if (config.aiScorer) {
      this.config.aiScorer = config.aiScorer;
    }
  }

  /**
   * Validate output against contract requirements
   */
  async validate(
    output: unknown,
    contract: Contract
  ): Promise<OutputValidationResult> {
    const startTime = Date.now();
    const issues: ValidationIssue[] = [];
    const deliverableResults: DeliverableValidationResult[] = [];

    // Basic existence check
    if (output === null || output === undefined) {
      issues.push({
        code: 'OUTPUT_MISSING',
        message: 'Output is null or undefined',
        severity: 'critical',
      });

      return this.createResult(
        issues,
        deliverableResults,
        { completeness: 0, correctness: 0, format: 0, constraints: 0 },
        startTime
      );
    }

    // Validate deliverables if defined
    const deliverables = contract.contract.requirements?.deliverables;
    if (deliverables && deliverables.length > 0) {
      const outputArray = Array.isArray(output) ? output : [output];

      for (let i = 0; i < deliverables.length; i++) {
        const deliverable = deliverables[i];
        if (!deliverable) continue;

        const outputItem = outputArray[i];
        const result = this.validateDeliverable(outputItem, deliverable, i);
        deliverableResults.push(result);
        issues.push(...result.issues);
      }
    }

    // Check constraints
    const constraintIssues = this.validateConstraints(output, contract);
    issues.push(...constraintIssues);

    // Calculate score breakdown
    const scoreBreakdown = await this.calculateScoreBreakdown(
      output,
      contract,
      issues,
      deliverableResults
    );

    return this.createResult(issues, deliverableResults, scoreBreakdown, startTime);
  }

  /**
   * Validate a single deliverable
   */
  private validateDeliverable(
    output: unknown,
    deliverable: NonNullable<Contract['contract']['requirements']['deliverables']>[number],
    index: number
  ): DeliverableValidationResult {
    const issues: ValidationIssue[] = [];
    const deliverableType = deliverable.type;

    // Check if output exists for this deliverable
    if (output === undefined || output === null) {
      issues.push({
        code: 'DELIVERABLE_MISSING',
        message: `Deliverable ${index} (${deliverableType}) is missing`,
        severity: 'error',
        path: `deliverables[${index}]`,
      });

      return {
        deliverableIndex: index,
        deliverableType,
        valid: false,
        issues,
      };
    }

    // Validate against schema if available
    const schema = this.config.schemaProvider.getSchema(deliverableType);
    if (schema) {
      const parseResult = schema.safeParse(output);
      if (!parseResult.success) {
        for (const error of parseResult.error.issues) {
          issues.push({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: error.message,
            severity: 'error',
            path: `deliverables[${index}].${error.path.join('.')}`,
            expected: error.code,
          });
        }
      }
    }

    // Check format if specified
    if (deliverable.format && typeof output === 'object' && output !== null) {
      const outputObj = output as Record<string, unknown>;
      if (outputObj['format'] && outputObj['format'] !== deliverable.format) {
        issues.push({
          code: 'FORMAT_MISMATCH',
          message: `Expected format "${deliverable.format}", got "${outputObj['format']}"`,
          severity: 'warning',
          path: `deliverables[${index}].format`,
          expected: deliverable.format,
          actual: outputObj['format'],
        });
      }
    }

    // Check save_to if specified
    if (deliverable.save_to && typeof output === 'object' && output !== null) {
      const outputObj = output as Record<string, unknown>;
      const outputPath = outputObj['path'] as string | undefined;

      if (outputPath && !outputPath.startsWith(deliverable.save_to.replace('~', ''))) {
        issues.push({
          code: 'SAVE_PATH_MISMATCH',
          message: `Output should be saved to "${deliverable.save_to}"`,
          severity: 'warning',
          path: `deliverables[${index}].save_to`,
          expected: deliverable.save_to,
          actual: outputPath,
        });
      }
    }

    return {
      deliverableIndex: index,
      deliverableType,
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Validate constraints from contract limitations
   */
  private validateConstraints(
    _output: unknown,
    _contract: Contract
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // Note: max_output_size not currently in contract schema
    // Size limits can be added via custom validation if needed
    return issues;
  }

  /**
   * Calculate score breakdown
   */
  private async calculateScoreBreakdown(
    output: unknown,
    contract: Contract,
    issues: ValidationIssue[],
    deliverableResults: DeliverableValidationResult[]
  ): Promise<QualityScoreBreakdown> {
    const deliverables = contract.contract.requirements?.deliverables ?? [];
    const totalDeliverables = deliverables.length;

    // Completeness: How many deliverables are present and valid?
    const validDeliverables = deliverableResults.filter(r => r.valid).length;
    const completeness = totalDeliverables > 0
      ? validDeliverables / totalDeliverables
      : (output !== null && output !== undefined ? 1 : 0);

    // Correctness: Based on critical/error issues
    const criticalErrors = issues.filter(i => i.severity === 'critical').length;
    const errors = issues.filter(i => i.severity === 'error').length;
    const correctness = Math.max(0, 1 - (criticalErrors * 0.5) - (errors * 0.2));

    // Format: Based on format-related issues
    const formatIssues = issues.filter(i =>
      i.code.includes('FORMAT') || i.code.includes('SCHEMA')
    ).length;
    const format = Math.max(0, 1 - (formatIssues * 0.25));

    // Constraints: Based on constraint violations
    const constraintIssues = issues.filter(i =>
      i.code.includes('SIZE') || i.code.includes('PATH') || i.code.includes('CONSTRAINT')
    ).length;
    const constraints = Math.max(0, 1 - (constraintIssues * 0.3));

    // AI Score (if available)
    let aiScore: number | undefined;
    if (this.config.aiScorer) {
      try {
        aiScore = await this.config.aiScorer.score(output, contract);
      } catch {
        // AI scoring failed - proceed without it
      }
    }

    const breakdown: QualityScoreBreakdown = {
      completeness,
      correctness,
      format,
      constraints,
    };
    if (aiScore !== undefined) {
      breakdown.aiScore = aiScore;
    }
    return breakdown;
  }

  /**
   * Create validation result
   */
  private createResult(
    issues: ValidationIssue[],
    deliverables: DeliverableValidationResult[],
    scoreBreakdown: QualityScoreBreakdown,
    startTime: number
  ): OutputValidationResult {
    // Calculate overall score
    const weights = this.config.scoreWeights;
    let totalWeight = weights.completeness + weights.correctness + weights.format + weights.constraints;

    let score =
      (scoreBreakdown.completeness * weights.completeness) +
      (scoreBreakdown.correctness * weights.correctness) +
      (scoreBreakdown.format * weights.format) +
      (scoreBreakdown.constraints * weights.constraints);

    if (scoreBreakdown.aiScore !== undefined && weights.aiScore > 0) {
      score += scoreBreakdown.aiScore * weights.aiScore;
      totalWeight += weights.aiScore;
    }

    // Normalize to 0-10 scale
    score = (score / totalWeight) * 10;
    score = Math.max(0, Math.min(10, score));

    // Determine validity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const errorIssues = issues.filter(i => i.severity === 'error');

    let valid: boolean;
    if (this.config.strictMode) {
      valid = issues.length === 0;
    } else {
      valid = criticalIssues.length === 0 && errorIssues.length === 0;
    }

    return {
      valid,
      score: Math.round(score * 100) / 100, // 2 decimal places
      scoreBreakdown,
      issues,
      deliverables,
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Estimate output size in bytes
   */
  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'string') {
      return value.length;
    }

    if (Buffer.isBuffer(value)) {
      return value.length;
    }

    // For objects, estimate JSON size
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  /**
   * Check if output meets the success threshold
   */
  meetsThreshold(result: OutputValidationResult, contract: Contract): boolean {
    const threshold = contract.contract.goals.success_threshold;
    return result.score >= threshold;
  }

  /**
   * Get issues filtered by severity
   */
  getIssuesBySeverity(
    result: OutputValidationResult,
    severities: Severity[]
  ): ValidationIssue[] {
    return result.issues.filter(i => severities.includes(i.severity));
  }

  /**
   * Format issues as human-readable report
   */
  formatReport(result: OutputValidationResult): string {
    const lines: string[] = [];

    lines.push(`Output Validation Report`);
    lines.push(`========================`);
    lines.push(`Valid: ${result.valid ? 'Yes' : 'No'}`);
    lines.push(`Score: ${result.score}/10`);
    lines.push(``);
    lines.push(`Score Breakdown:`);
    lines.push(`  Completeness: ${(result.scoreBreakdown.completeness * 100).toFixed(0)}%`);
    lines.push(`  Correctness:  ${(result.scoreBreakdown.correctness * 100).toFixed(0)}%`);
    lines.push(`  Format:       ${(result.scoreBreakdown.format * 100).toFixed(0)}%`);
    lines.push(`  Constraints:  ${(result.scoreBreakdown.constraints * 100).toFixed(0)}%`);
    if (result.scoreBreakdown.aiScore !== undefined) {
      lines.push(`  AI Score:     ${(result.scoreBreakdown.aiScore * 100).toFixed(0)}%`);
    }

    if (result.issues.length > 0) {
      lines.push(``);
      lines.push(`Issues (${result.issues.length}):`);
      for (const issue of result.issues) {
        const severity = issue.severity.toUpperCase().padEnd(8);
        lines.push(`  [${severity}] ${issue.code}: ${issue.message}`);
        if (issue.path) {
          lines.push(`             Path: ${issue.path}`);
        }
        if (issue.suggestion) {
          lines.push(`             Suggestion: ${issue.suggestion}`);
        }
      }
    }

    if (result.deliverables.length > 0) {
      lines.push(``);
      lines.push(`Deliverables (${result.deliverables.length}):`);
      for (const d of result.deliverables) {
        const status = d.valid ? 'PASS' : 'FAIL';
        lines.push(`  [${status}] #${d.deliverableIndex} (${d.deliverableType})`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * Create output validator with default configuration
 */
export function createOutputValidator(
  config?: OutputValidatorConfig
): OutputValidator {
  return new OutputValidator(config);
}
