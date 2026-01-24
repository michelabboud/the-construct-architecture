/**
 * Workflow Loader
 *
 * "Throughout human history, we have been dependent on machines to survive." — Morpheus
 *
 * Loads and validates YAML workflow definitions.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';
import {
  Workflow,
  WorkflowSchema,
  WorkflowPhase,
  WorkflowStep,
  ChecklistItemDef,
} from '../../types/morpheus.js';

/**
 * Workflow loader options
 */
export interface WorkflowLoaderOptions {
  /** Base directory for workflow files */
  workflowsDir?: string;
  /** Whether to validate workflows strictly */
  strict?: boolean;
  /** Custom validators */
  validators?: WorkflowValidator[];
}

/**
 * Custom workflow validator
 */
export interface WorkflowValidator {
  name: string;
  validate(workflow: Workflow): ValidationIssue[];
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  type: 'error' | 'warning';
  path: string;
  message: string;
}

/**
 * Workflow load result
 */
export interface WorkflowLoadResult {
  success: boolean;
  workflow?: Workflow;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Default workflows directory
 */
const DEFAULT_WORKFLOWS_DIR = 'src/morpheus/workflows';

/**
 * Built-in workflow IDs
 */
export const BUILT_IN_WORKFLOWS = [
  'standard-migration',
  'quick-migration',
  'security-focused',
  'minimal',
] as const;

export type BuiltInWorkflowId = (typeof BUILT_IN_WORKFLOWS)[number];

/**
 * WorkflowLoader class
 *
 * Loads and validates YAML workflow definitions.
 */
export class WorkflowLoader {
  private workflowsDir: string;
  private strict: boolean;
  private validators: WorkflowValidator[];
  private cache: Map<string, Workflow> = new Map();

  constructor(options: WorkflowLoaderOptions = {}) {
    this.workflowsDir = options.workflowsDir ?? DEFAULT_WORKFLOWS_DIR;
    this.strict = options.strict ?? true;
    this.validators = options.validators ?? [];

    // Add built-in validators
    this.validators.push(
      new DependencyValidator(),
      new AgentContractValidator(),
      new ChecklistValidator()
    );
  }

  /**
   * Load a workflow by ID
   */
  async load(workflowId: string): Promise<WorkflowLoadResult> {
    // Check cache
    if (this.cache.has(workflowId)) {
      return {
        success: true,
        workflow: this.cache.get(workflowId)!,
        errors: [],
        warnings: [],
      };
    }

    // Determine file path
    const filePath = this.resolveWorkflowPath(workflowId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        errors: [
          {
            type: 'error',
            path: '',
            message: `Workflow file not found: ${filePath}`,
          },
        ],
        warnings: [],
      };
    }

    // Load and parse YAML
    let rawContent: string;
    try {
      rawContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: 'error',
            path: '',
            message: `Failed to read workflow file: ${(error as Error).message}`,
          },
        ],
        warnings: [],
      };
    }

    // Parse YAML
    let parsed: unknown;
    try {
      parsed = yaml.parse(rawContent);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: 'error',
            path: '',
            message: `Failed to parse YAML: ${(error as Error).message}`,
          },
        ],
        warnings: [],
      };
    }

    // Validate with Zod schema
    const schemaResult = WorkflowSchema.safeParse(parsed);
    if (!schemaResult.success) {
      const errors = schemaResult.error.issues.map((err) => ({
        type: 'error' as const,
        path: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        errors,
        warnings: [],
      };
    }

    const workflow = schemaResult.data as Workflow;

    // Run custom validators
    const allIssues: ValidationIssue[] = [];
    for (const validator of this.validators) {
      const issues = validator.validate(workflow);
      allIssues.push(...issues);
    }

    const errors = allIssues.filter((i) => i.type === 'error');
    const warnings = allIssues.filter((i) => i.type === 'warning');

    // In strict mode, warnings become errors
    if (this.strict && warnings.length > 0) {
      return {
        success: false,
        errors: [...errors, ...warnings.map((w) => ({ ...w, type: 'error' as const }))],
        warnings: [],
      };
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
      };
    }

    // Cache the workflow
    this.cache.set(workflowId, workflow);

    return {
      success: true,
      workflow,
      errors: [],
      warnings,
    };
  }

  /**
   * Load a workflow from a string
   */
  async loadFromString(yamlContent: string): Promise<WorkflowLoadResult> {
    // Parse YAML
    let parsed: unknown;
    try {
      parsed = yaml.parse(yamlContent);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: 'error',
            path: '',
            message: `Failed to parse YAML: ${(error as Error).message}`,
          },
        ],
        warnings: [],
      };
    }

    // Validate with Zod schema
    const schemaResult = WorkflowSchema.safeParse(parsed);
    if (!schemaResult.success) {
      const errors = schemaResult.error.issues.map((err) => ({
        type: 'error' as const,
        path: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        errors,
        warnings: [],
      };
    }

    const workflow = schemaResult.data as Workflow;

    // Run custom validators
    const allIssues: ValidationIssue[] = [];
    for (const validator of this.validators) {
      const issues = validator.validate(workflow);
      allIssues.push(...issues);
    }

    const errors = allIssues.filter((i) => i.type === 'error');
    const warnings = allIssues.filter((i) => i.type === 'warning');

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
      };
    }

    return {
      success: true,
      workflow,
      errors: [],
      warnings,
    };
  }

  /**
   * List available workflows
   */
  async listWorkflows(): Promise<string[]> {
    if (!fs.existsSync(this.workflowsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.workflowsDir);
    return files
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f) => path.basename(f, path.extname(f)));
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Resolve workflow file path
   */
  private resolveWorkflowPath(workflowId: string): string {
    // Check if it's already a path
    if (workflowId.includes('/') || workflowId.includes('\\')) {
      return workflowId;
    }

    // Try with .yaml extension
    const yamlPath = path.join(this.workflowsDir, `${workflowId}.yaml`);
    if (fs.existsSync(yamlPath)) {
      return yamlPath;
    }

    // Try with .yml extension
    const ymlPath = path.join(this.workflowsDir, `${workflowId}.yml`);
    if (fs.existsSync(ymlPath)) {
      return ymlPath;
    }

    // Default to .yaml
    return yamlPath;
  }
}

/**
 * Validates phase dependencies
 */
class DependencyValidator implements WorkflowValidator {
  name = 'DependencyValidator';

  validate(workflow: Workflow): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const phaseIds = new Set(workflow.phases.map((p) => p.id));

    for (const phase of workflow.phases) {
      for (const depId of phase.dependsOn) {
        if (!phaseIds.has(depId)) {
          issues.push({
            type: 'error',
            path: `phases.${phase.id}.dependsOn`,
            message: `Phase "${phase.id}" depends on unknown phase "${depId}"`,
          });
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(workflow.phases);
    for (const cycle of circularDeps) {
      issues.push({
        type: 'error',
        path: 'phases',
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
      });
    }

    return issues;
  }

  private findCircularDependencies(phases: WorkflowPhase[]): string[][] {
    const cycles: string[][] = [];
    const phaseMap = new Map(phases.map((p) => [p.id, p]));

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (phaseId: string): boolean => {
      visited.add(phaseId);
      recursionStack.add(phaseId);
      path.push(phaseId);

      const phase = phaseMap.get(phaseId);
      if (phase) {
        for (const depId of phase.dependsOn) {
          if (!visited.has(depId)) {
            if (dfs(depId)) {
              return true;
            }
          } else if (recursionStack.has(depId)) {
            // Found cycle
            const cycleStart = path.indexOf(depId);
            cycles.push([...path.slice(cycleStart), depId]);
            return true;
          }
        }
      }

      path.pop();
      recursionStack.delete(phaseId);
      return false;
    };

    for (const phase of phases) {
      if (!visited.has(phase.id)) {
        dfs(phase.id);
      }
    }

    return cycles;
  }
}

/**
 * Validates agent and contract assignments
 */
class AgentContractValidator implements WorkflowValidator {
  name = 'AgentContractValidator';

  validate(workflow: Workflow): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const phase of workflow.phases) {
      for (const step of phase.steps) {
        // AI-assisted steps should have a contract
        if (step.type === 'ai-assisted' && !step.contract) {
          issues.push({
            type: 'warning',
            path: `phases.${phase.id}.steps.${step.id}`,
            message: `AI-assisted step "${step.id}" has no contract specified`,
          });
        }

        // Automated steps should have an action
        if (step.type === 'automated' && !step.action && !step.contract) {
          issues.push({
            type: 'warning',
            path: `phases.${phase.id}.steps.${step.id}`,
            message: `Automated step "${step.id}" has no action or contract specified`,
          });
        }

        // Steps with contracts should have an agent (or use default)
        if (step.contract && !step.agent && !phase.lead) {
          issues.push({
            type: 'warning',
            path: `phases.${phase.id}.steps.${step.id}`,
            message: `Step "${step.id}" has a contract but no agent assigned`,
          });
        }
      }
    }

    return issues;
  }
}

/**
 * Validates checklist items
 */
class ChecklistValidator implements WorkflowValidator {
  name = 'ChecklistValidator';

  validate(workflow: Workflow): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const phase of workflow.phases) {
      const checklistIds = new Set<string>();

      for (const item of phase.checklist) {
        // Check for duplicate IDs
        if (checklistIds.has(item.id)) {
          issues.push({
            type: 'error',
            path: `phases.${phase.id}.checklist`,
            message: `Duplicate checklist item ID: "${item.id}"`,
          });
        }
        checklistIds.add(item.id);

        // AI-verify items should have a contract or agent
        if (item.verification?.type === 'ai-verify') {
          if (!item.verification.contract && !item.verification.agent) {
            issues.push({
              type: 'warning',
              path: `phases.${phase.id}.checklist.${item.id}`,
              message: `AI-verify checklist item "${item.id}" has no contract or agent specified`,
            });
          }
        }
      }
    }

    return issues;
  }
}

/**
 * Create a workflow loader instance
 */
export function createWorkflowLoader(options?: WorkflowLoaderOptions): WorkflowLoader {
  return new WorkflowLoader(options);
}
