/**
 * The Architect - Source of Truth
 *
 * "I am the Architect. I created the Matrix."
 *
 * Provides read-only access to truth (configurations, rules, limits).
 * Integrates with TruthLoader for config, ReferenceResolver for URIs,
 * and Registry for capability discovery.
 *
 * Phase 1 + Phase 4 Implementation
 */

import { minimatch } from 'minimatch';
import { Contract, validateContract } from './schemas/contract.schema.js';
import { TruthLoader, type Truth, type PathRule, type LoadedTruth } from './truth-loader.js';
import {
  ReferenceResolver,
  type ResolverConfig,
  type ReferenceValidationResult,
  type ReferenceConfig,
} from './references/reference-resolver.js';
import { Registry, type RegistryConfig } from './registry.js';

export interface ArchitectConfig {
  configPath?: string;
  truthPath?: string;
  /** Working directory for project truth resolution */
  workingDir?: string;
  /** Reference resolver configuration */
  resolverConfig?: ResolverConfig;
  /** Registry configuration */
  registryConfig?: RegistryConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContractFullValidationResult extends ValidationResult {
  referenceValidation?: ReferenceValidationResult;
}

// Re-export PathRule for backwards compatibility
export type { PathRule };

/**
 * The Architect - Source of Truth
 *
 * Central hub for configuration, rules, references, and registry.
 */
export class Architect {
  private config: ArchitectConfig;
  private truthLoader: TruthLoader;
  private referenceResolver: ReferenceResolver;
  private registry: Registry;
  private initialized: boolean = false;

  // Cached rules from truth
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

    // Initialize components - conditionally pass workingDir only if defined
    const truthLoaderConfig: { workingDir?: string } = {};
    if (config.workingDir !== undefined) {
      truthLoaderConfig.workingDir = config.workingDir;
    }
    this.truthLoader = new TruthLoader(truthLoaderConfig);

    this.referenceResolver = new ReferenceResolver(config.resolverConfig);

    this.registry = new Registry(config.registryConfig);
  }

  /**
   * Initialize the Architect by loading truth from files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load truth (global + project)
    const loaded = await this.truthLoader.load();

    // Extract rules from loaded truth
    this.updateRulesFromTruth(loaded.truth);

    this.initialized = true;
  }

  /**
   * Check if Architect is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure Architect is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Architect not initialized. Call initialize() first.');
    }
  }

  /**
   * Update internal rules from loaded truth
   */
  private updateRulesFromTruth(truth: Truth): void {
    // Path rules
    this.rules.forbiddenPaths = truth.paths?.forbidden ?? [
      { pattern: '**/node_modules/**', reason: 'Never modify dependencies' },
      { pattern: '**/.git/**', reason: 'Never modify git internals' },
      { pattern: '**/.env*', reason: 'Never access environment files' },
    ];

    this.rules.forbiddenActions = truth.actions?.forbidden ?? [
      'DELETE',
      'EXECUTE_SHELL',
    ];

    this.rules.allowedPaths = truth.paths?.write_allowed ?? truth.paths?.allowed ?? [];
  }

  /**
   * Get a configuration value by path
   */
  async getConfig<T>(path: string): Promise<T | undefined> {
    this.ensureInitialized();
    return this.truthLoader.get<T>(path);
  }

  /**
   * Get the full loaded truth
   */
  async getTruth(): Promise<Truth> {
    this.ensureInitialized();
    return this.truthLoader.getTruth();
  }

  /**
   * Get loaded truth info (including source files)
   */
  getLoadedTruthInfo(): LoadedTruth | null {
    return this.truthLoader.getLoadedTruth();
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
   * Get reason why a path is forbidden
   */
  getPathForbiddenReason(path: string): string | null {
    for (const rule of this.rules.forbiddenPaths) {
      if (this.matchesPattern(path, rule.pattern)) {
        return rule.reason;
      }
    }
    return null;
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
        for (const allowed of this.rules.allowedPaths) {
          if (this.matchesPattern(allowed, pathRule.pattern)) {
            warnings.push(
              `Contract forbids path "${pathRule.pattern}" which is globally allowed`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a contract including its references
   */
  async validateContractFull(contract: Contract): Promise<ContractFullValidationResult> {
    this.ensureInitialized();

    // Basic validation
    const basicResult = this.validateContract(contract);

    // Reference validation
    let referenceValidation: ReferenceValidationResult | undefined;

    const references = contract.contract.references;
    if (references) {
      const allRefs = this.extractAllReferences(references);
      referenceValidation = await this.referenceResolver.validateStrict(allRefs);

      // Add reference errors as contract errors if strict
      for (const error of referenceValidation.errors) {
        if (error.enforce === 'strict') {
          basicResult.errors.push(`Reference error: ${error.message}`);
        }
      }

      // Add reference warnings
      for (const warning of referenceValidation.warnings) {
        basicResult.warnings.push(`Reference warning: ${warning.message}`);
      }
    }

    // Build result with conditional referenceValidation
    const result: ContractFullValidationResult = {
      valid: basicResult.errors.length === 0,
      errors: basicResult.errors,
      warnings: basicResult.warnings,
    };
    if (referenceValidation !== undefined) {
      result.referenceValidation = referenceValidation;
    }
    return result;
  }

  /**
   * Extract all references from contract references section
   * Maps contract schema refs to ReferenceConfig format
   */
  private extractAllReferences(references: NonNullable<Contract['contract']['references']>): ReferenceConfig[] {
    const allRefs: ReferenceConfig[] = [];

    // Helper to map schema refs to ReferenceConfig (ensuring proper types)
    // Use ReadonlyArray to accept Zod-inferred types with exactOptionalPropertyTypes
    const mapRefs = (refs: ReadonlyArray<{
      ref: string;
      enforce?: 'strict' | 'advisory' | undefined;
      sections?: string[] | undefined;
      required?: boolean | undefined;
      min_level?: string | undefined;
    }> | undefined): void => {
      if (!refs) return;
      for (const r of refs) {
        const config: ReferenceConfig = { ref: r.ref };
        if (r.enforce !== undefined) config.enforce = r.enforce;
        if (r.sections !== undefined) config.sections = r.sections;
        if (r.required !== undefined) config.required = r.required;
        if (r.min_level !== undefined) config.min_level = r.min_level;
        allRefs.push(config);
      }
    };

    // Guides
    mapRefs(references.guides?.must_follow);

    // Tools
    mapRefs(references.tools?.mcp);
    mapRefs(references.tools?.internal);

    // Agents
    mapRefs(references.agents?.types);
    mapRefs(references.agents?.skills);

    // Schemas
    mapRefs(references.schemas?.input);
    mapRefs(references.schemas?.output);

    // Config
    mapRefs(references.config);

    // Architect
    mapRefs(references.architect);

    // Oracle
    mapRefs(references.oracle);

    return allRefs;
  }

  /**
   * Resolve a reference URI
   */
  async resolveReference(uri: string, enforce?: 'strict' | 'advisory') {
    this.ensureInitialized();
    return this.referenceResolver.resolve(uri, enforce);
  }

  /**
   * Set template variables for reference resolution
   */
  setTemplateVars(vars: Record<string, string>): void {
    this.referenceResolver.setTemplateVars(vars);
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
   * Get the registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Get the reference resolver
   */
  getReferenceResolver(): ReferenceResolver {
    return this.referenceResolver;
  }

  /**
   * Get the truth loader
   */
  getTruthLoader(): TruthLoader {
    return this.truthLoader;
  }

  /**
   * Reload truth from sources
   */
  async reload(): Promise<void> {
    const loaded = await this.truthLoader.reload();
    this.updateRulesFromTruth(loaded.truth);
  }

  /**
   * Initialize global truth directory structure
   */
  async initializeGlobalTruth(): Promise<void> {
    await this.truthLoader.initializeGlobalTruth();
  }

  /**
   * Initialize project truth file
   */
  async initializeProjectTruth(projectDir?: string): Promise<void> {
    await this.truthLoader.initializeProjectTruth(projectDir);
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
