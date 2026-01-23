/**
 * The Architect - Source of Truth
 *
 * "I am the Architect. I created the Matrix."
 *
 * Provides read-only access to truth (configurations, rules, limits).
 * Immutable during execution.
 *
 * Phase 1 Implementation - Minimal version
 */

import { minimatch } from 'minimatch';
import { Contract, ContractSchema, validateContract, ContractValidationResult } from './schemas/contract.schema.js';

export interface ArchitectConfig {
  configPath?: string;
  truthPath?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PathRule {
  pattern: string;
  reason: string;
}

/**
 * The Architect - Source of Truth
 *
 * TODO Phase 1:
 * - Load configuration from YAML files
 * - Provide read-only access to truth
 * - Validate contracts against rules
 */
export class Architect {
  private config: ArchitectConfig;
  private truth: Record<string, unknown> = {};
  private rules: {
    forbiddenPaths: PathRule[];
    forbiddenActions: string[];
    allowedPaths: string[];
  } = {
    forbiddenPaths: [],
    forbiddenActions: [],
    allowedPaths: [],
  };

  constructor(config: ArchitectConfig = {}) {
    this.config = config;
  }

  /**
   * Initialize the Architect by loading truth from files
   */
  async initialize(): Promise<void> {
    // TODO: Load from YAML files
    // For now, use defaults
    this.rules = {
      forbiddenPaths: [
        { pattern: '**/node_modules/**', reason: 'Never modify dependencies' },
        { pattern: '**/.git/**', reason: 'Never modify git internals' },
        { pattern: '**/.env*', reason: 'Never access environment files' },
      ],
      forbiddenActions: [
        'DELETE',
        'EXECUTE_SHELL',
      ],
      allowedPaths: [
        '~/visual-forge-projects/**',
        '~/test-output/**',
      ],
    };
  }

  /**
   * Get a configuration value by path
   */
  getConfig<T>(path: string): T | undefined {
    // TODO: Implement path resolution
    return this.truth[path] as T | undefined;
  }

  /**
   * Check if an action is allowed
   */
  isActionAllowed(action: string): boolean {
    return !this.rules.forbiddenActions.includes(action.toUpperCase());
  }

  /**
   * Check if a path is allowed for an operation
   */
  isPathAllowed(path: string, operation: 'read' | 'write'): boolean {
    // Check forbidden paths
    for (const rule of this.rules.forbiddenPaths) {
      if (this.matchesPattern(path, rule.pattern)) {
        return false;
      }
    }

    // For writes, also check allowed paths
    if (operation === 'write') {
      // If we have allowed paths defined, check against them
      if (this.rules.allowedPaths.length > 0) {
        return this.rules.allowedPaths.some(pattern =>
          this.matchesPattern(path, pattern)
        );
      }
    }

    return true;
  }

  /**
   * Validate a contract against the Architect's rules
   */
  validateContract(contract: Contract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate contract structure using Zod
    const schemaResult = validateContract(contract);
    if (!schemaResult.valid) {
      errors.push(...schemaResult.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    }

    // Validate limitations match Architect rules
    const limitations = contract.contract.limitations;
    if (limitations?.forbidden_paths) {
      for (const pathRule of limitations.forbidden_paths) {
        // Check that contract forbidden paths don't conflict with allowed paths
        // (Contracts can only be more restrictive, not less)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get the forbidden path rules
   */
  getForbiddenPaths(): PathRule[] {
    return [...this.rules.forbiddenPaths];
  }

  /**
   * Get the forbidden actions
   */
  getForbiddenActions(): string[] {
    return [...this.rules.forbiddenActions];
  }

  /**
   * Glob pattern matching using minimatch
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Normalize path separators
    const normalizedPath = path.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    return minimatch(normalizedPath, normalizedPattern, {
      dot: true,         // Match dotfiles
      matchBase: true,   // Match basename if pattern has no slashes
    });
  }
}
