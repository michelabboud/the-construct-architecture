/**
 * Truth Loader - Configuration and rules loading
 *
 * Loads truth (configurations, rules, limits) from global and project sources.
 * Supports inheritance where project truth extends global truth.
 *
 * Phase 4 Implementation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * Path rule configuration
 */
export interface PathRule {
  pattern: string;
  reason: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  id: string;
  apiKeyEnvVar?: string;
  baseURL?: string;
  defaultModel?: string;
  enabled?: boolean;
}

/**
 * Cost limits
 */
export interface CostLimits {
  max_per_request?: number;
  max_per_session?: number;
  max_per_day?: number;
  warn_threshold?: number;
}

/**
 * Reference paths configuration
 */
export interface ReferencePaths {
  guide?: string;
  schema?: string;
  template?: string;
  config?: string;
}

/**
 * Truth configuration structure
 */
export interface Truth {
  // Version info
  version?: string;

  // Path rules
  paths?: {
    forbidden?: PathRule[];
    allowed?: string[];
    write_allowed?: string[];
    read_allowed?: string[];
  };

  // Action rules
  actions?: {
    forbidden?: string[];
    requires_approval?: string[];
  };

  // Provider settings
  providers?: {
    default?: string;
    configs?: ProviderConfig[];
  };

  // Cost limits
  limits?: {
    cost?: CostLimits;
    retries?: {
      max_attempts?: number;
      backoff?: 'none' | 'linear' | 'exponential';
    };
    time?: {
      max_duration_ms?: number;
    };
  };

  // Reference paths
  reference_paths?: ReferencePaths;

  // Custom settings (extensible)
  custom?: Record<string, unknown>;
}

/**
 * Truth Loader configuration
 */
export interface TruthLoaderConfig {
  /** Global truth directory (default: ~/.construct/truth/) */
  globalTruthPath?: string;
  /** Project truth file (default: .construct/truth.yaml) */
  projectTruthPath?: string;
  /** Working directory for project truth resolution */
  workingDir?: string;
}

/**
 * Loaded truth with source tracking
 */
export interface LoadedTruth {
  truth: Truth;
  sources: {
    global: string | null;
    project: string | null;
  };
  loadedAt: Date;
}

/**
 * Truth Loader
 *
 * Loads and merges truth from global and project sources.
 */
export class TruthLoader {
  private globalTruthPath: string;
  private projectTruthPath: string;
  private workingDir: string;
  private loadedTruth: LoadedTruth | null = null;

  constructor(config: TruthLoaderConfig = {}) {
    const home = homedir();
    this.globalTruthPath = config.globalTruthPath ?? path.join(home, '.construct', 'truth');
    this.projectTruthPath = config.projectTruthPath ?? '.construct/truth.yaml';
    this.workingDir = config.workingDir ?? process.cwd();
  }

  /**
   * Load truth from all sources
   */
  async load(): Promise<LoadedTruth> {
    const globalTruth = await this.loadGlobalTruth();
    const projectTruth = await this.loadProjectTruth();

    // Merge: project extends global
    const mergedTruth = this.mergeTruth(globalTruth.truth, projectTruth.truth);

    this.loadedTruth = {
      truth: mergedTruth,
      sources: {
        global: globalTruth.source,
        project: projectTruth.source,
      },
      loadedAt: new Date(),
    };

    return this.loadedTruth;
  }

  /**
   * Get loaded truth (loads if not already loaded)
   */
  async getTruth(): Promise<Truth> {
    if (!this.loadedTruth) {
      await this.load();
    }
    return this.loadedTruth!.truth;
  }

  /**
   * Reload truth from sources
   */
  async reload(): Promise<LoadedTruth> {
    this.loadedTruth = null;
    return this.load();
  }

  /**
   * Check if truth has been loaded
   */
  isLoaded(): boolean {
    return this.loadedTruth !== null;
  }

  /**
   * Get loaded truth info
   */
  getLoadedTruth(): LoadedTruth | null {
    return this.loadedTruth;
  }

  /**
   * Load global truth from ~/.construct/truth/
   */
  private async loadGlobalTruth(): Promise<{ truth: Truth; source: string | null }> {
    const truthFile = path.join(this.globalTruthPath, 'truth.yaml');

    try {
      const content = await fs.readFile(truthFile, 'utf-8');
      const { parse } = await import('yaml');
      const truth = parse(content) as Truth;
      return { truth: truth ?? {}, source: truthFile };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Try truth.yml
        const ymlFile = path.join(this.globalTruthPath, 'truth.yml');
        try {
          const content = await fs.readFile(ymlFile, 'utf-8');
          const { parse } = await import('yaml');
          const truth = parse(content) as Truth;
          return { truth: truth ?? {}, source: ymlFile };
        } catch {
          // No global truth file - that's OK
          return { truth: {}, source: null };
        }
      }
      throw err;
    }
  }

  /**
   * Load project truth from .construct/truth.yaml
   */
  private async loadProjectTruth(): Promise<{ truth: Truth; source: string | null }> {
    const truthFile = path.join(this.workingDir, this.projectTruthPath);

    try {
      const content = await fs.readFile(truthFile, 'utf-8');
      const { parse } = await import('yaml');
      const truth = parse(content) as Truth;
      return { truth: truth ?? {}, source: truthFile };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Try .yml extension
        const ymlFile = truthFile.replace('.yaml', '.yml');
        try {
          const content = await fs.readFile(ymlFile, 'utf-8');
          const { parse } = await import('yaml');
          const truth = parse(content) as Truth;
          return { truth: truth ?? {}, source: ymlFile };
        } catch {
          // No project truth file - that's OK
          return { truth: {}, source: null };
        }
      }
      throw err;
    }
  }

  /**
   * Deep merge two truth objects (project extends global)
   */
  private mergeTruth(global: Truth, project: Truth): Truth {
    return this.deepMergeObjects(global, project) as Truth;
  }

  /**
   * Deep merge two objects (using unknown for flexibility with strict typing)
   */
  private deepMergeObjects(base: unknown, override: unknown): unknown {
    // Handle non-object cases
    if (typeof base !== 'object' || base === null) {
      return override;
    }
    if (typeof override !== 'object' || override === null) {
      return override;
    }

    // Handle arrays - concatenate
    if (Array.isArray(override)) {
      if (Array.isArray(base)) {
        return [...base, ...override];
      }
      return override;
    }

    // Handle objects - deep merge
    const baseObj = base as Record<string, unknown>;
    const overrideObj = override as Record<string, unknown>;
    const result: Record<string, unknown> = { ...baseObj };

    for (const key of Object.keys(overrideObj)) {
      const baseValue = baseObj[key];
      const overrideValue = overrideObj[key];

      if (overrideValue === undefined) {
        continue;
      }

      if (Array.isArray(overrideValue)) {
        // Arrays: concatenate (project adds to global)
        if (Array.isArray(baseValue)) {
          result[key] = [...baseValue, ...overrideValue];
        } else {
          result[key] = overrideValue;
        }
      } else if (
        typeof overrideValue === 'object' &&
        overrideValue !== null
      ) {
        // Objects: deep merge
        if (
          typeof baseValue === 'object' &&
          baseValue !== null &&
          !Array.isArray(baseValue)
        ) {
          result[key] = this.deepMergeObjects(baseValue, overrideValue);
        } else {
          result[key] = overrideValue;
        }
      } else {
        // Primitives: override
        result[key] = overrideValue;
      }
    }

    return result;
  }

  /**
   * Get a specific truth value by path
   */
  async get<T>(path: string): Promise<T | undefined> {
    const truth = await this.getTruth();
    return this.getByPath(truth, path) as T | undefined;
  }

  /**
   * Get value by dot-notation path
   */
  private getByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Create default global truth directory structure
   */
  async initializeGlobalTruth(): Promise<void> {
    // Create directories
    await fs.mkdir(this.globalTruthPath, { recursive: true });
    await fs.mkdir(path.join(this.globalTruthPath, '..', 'guides'), { recursive: true });
    await fs.mkdir(path.join(this.globalTruthPath, '..', 'schemas'), { recursive: true });
    await fs.mkdir(path.join(this.globalTruthPath, '..', 'templates'), { recursive: true });
    await fs.mkdir(path.join(this.globalTruthPath, '..', 'config'), { recursive: true });

    // Check if truth.yaml exists
    const truthFile = path.join(this.globalTruthPath, 'truth.yaml');
    try {
      await fs.access(truthFile);
      // File exists, don't overwrite
    } catch {
      // Create default truth.yaml
      const defaultTruth = `# The Construct - Global Truth
# This file defines global rules and settings

version: "1.0.0"

paths:
  forbidden:
    - pattern: "**/node_modules/**"
      reason: "Never modify dependencies"
    - pattern: "**/.git/**"
      reason: "Never modify git internals"
    - pattern: "**/.env*"
      reason: "Never access environment files"

actions:
  forbidden:
    - DELETE
    - EXECUTE_SHELL

providers:
  default: openai

limits:
  cost:
    max_per_request: 0.10
    max_per_session: 1.00
    warn_threshold: 0.80
  retries:
    max_attempts: 3
    backoff: exponential

reference_paths:
  guide: "~/.construct/guides/"
  schema: "~/.construct/schemas/"
  template: "~/.construct/templates/"
  config: "~/.construct/config/"
`;

      await fs.writeFile(truthFile, defaultTruth, 'utf-8');
    }
  }

  /**
   * Create default project truth file
   */
  async initializeProjectTruth(projectDir?: string): Promise<void> {
    const dir = projectDir ?? this.workingDir;
    const constructDir = path.join(dir, '.construct');
    const truthFile = path.join(constructDir, 'truth.yaml');

    await fs.mkdir(constructDir, { recursive: true });

    try {
      await fs.access(truthFile);
      // File exists, don't overwrite
    } catch {
      // Create default project truth.yaml
      const defaultTruth = `# Project Truth
# This file extends the global truth with project-specific settings

# Add project-specific forbidden paths
paths:
  forbidden:
    - pattern: "**/dist/**"
      reason: "Don't modify build output directly"

# Project-specific settings
custom:
  project_name: "My Project"
`;

      await fs.writeFile(truthFile, defaultTruth, 'utf-8');
    }
  }
}

/**
 * Default truth loader instance
 */
export const defaultTruthLoader = new TruthLoader();
