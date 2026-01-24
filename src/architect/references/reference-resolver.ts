/**
 * Reference Resolver - URI-based reference system
 *
 * "I know because I must know. It is my purpose." — The Keymaker
 *
 * Resolves URI references to documentation, tools, schemas, and other resources.
 * Supports caching, template variables, and strict/advisory enforcement.
 *
 * Phase 4 Implementation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * Supported URI schemes
 */
export type URIScheme =
  | 'guide'      // Markdown documentation
  | 'tool'       // Internal tools
  | 'mcp'        // MCP server tools
  | 'agent'      // Agent types
  | 'skill'      // Agent skills
  | 'schema'     // JSON schemas
  | 'template'   // Prompt/contract templates
  | 'config'     // Configuration values
  | 'architect'  // Source of Truth paths
  | 'oracle';    // Oracle data

/**
 * Parsed URI components
 */
export interface ParsedURI {
  scheme: URIScheme;
  path: string;
  segments: string[];
  raw: string;
}

/**
 * Resolved reference content
 */
export interface ResolvedReference {
  uri: string;
  scheme: URIScheme;
  path: string;
  content: unknown;
  contentType: 'markdown' | 'json' | 'yaml' | 'text' | 'object';
  enforce: 'strict' | 'advisory';
  resolvedAt: Date;
  fromCache: boolean;
}

/**
 * Reference configuration
 */
export interface ReferenceConfig {
  ref: string;
  enforce?: 'strict' | 'advisory';
  sections?: string[];
  required?: boolean;
  min_level?: string;
}

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  value: ResolvedReference;
  timestamp: number;
}

/**
 * Resolver configuration
 */
export interface ResolverConfig {
  /** Base paths for each scheme */
  basePaths?: Partial<Record<URIScheme, string>>;
  /** Cache TTL in milliseconds (default: 60000) */
  cacheTTL?: number;
  /** Template variables for resolution */
  templateVars?: Record<string, string>;
}

/**
 * Validation result for references
 */
export interface ReferenceValidationResult {
  valid: boolean;
  errors: Array<{
    uri: string;
    message: string;
    enforce: 'strict' | 'advisory';
  }>;
  warnings: Array<{
    uri: string;
    message: string;
  }>;
  resolvedRefs: ResolvedReference[];
}

/**
 * Reference Resolver
 *
 * Resolves URI-based references to their content.
 */
export class ReferenceResolver {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number;
  private basePaths: Record<URIScheme, string>;
  private templateVars: Record<string, string>;

  constructor(config: ResolverConfig = {}) {
    this.cacheTTL = config.cacheTTL ?? 60000; // 1 minute default
    this.templateVars = config.templateVars ?? {};

    // Default base paths
    const home = homedir();
    this.basePaths = {
      guide: path.join(home, '.construct', 'guides'),
      tool: path.join(home, '.construct', 'tools'),
      mcp: '', // MCP tools are resolved differently
      agent: path.join(home, '.construct', 'agents'),
      skill: path.join(home, '.construct', 'skills'),
      schema: path.join(home, '.construct', 'schemas'),
      template: path.join(home, '.construct', 'templates'),
      config: path.join(home, '.construct', 'config'),
      architect: path.join(home, '.construct', 'truth'),
      oracle: '', // Oracle refs are resolved via Oracle API
      ...config.basePaths,
    };
  }

  /**
   * Set template variables for resolution
   */
  setTemplateVars(vars: Record<string, string>): void {
    this.templateVars = { ...this.templateVars, ...vars };
  }

  /**
   * Set a specific template variable
   */
  setTemplateVar(key: string, value: string): void {
    this.templateVars[key] = value;
  }

  /**
   * Parse a URI string into components
   */
  parseURI(uri: string): ParsedURI {
    const match = uri.match(/^([a-z]+):\/\/(.+)$/);
    if (!match || match[1] === undefined || match[2] === undefined) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    const scheme = match[1] as URIScheme;
    const validSchemes: URIScheme[] = [
      'guide', 'tool', 'mcp', 'agent', 'skill',
      'schema', 'template', 'config', 'architect', 'oracle'
    ];

    if (!validSchemes.includes(scheme)) {
      throw new Error(`Unknown URI scheme: ${scheme}`);
    }

    const uriPath = match[2];
    const segments = uriPath.split('/').filter(s => s.length > 0);

    return {
      scheme,
      path: uriPath,
      segments,
      raw: uri,
    };
  }

  /**
   * Resolve template variables in a path
   */
  resolveTemplateVars(uriPath: string): string {
    return uriPath.replace(/\{([^}]+)\}/g, (_, key) => {
      const value = this.templateVars[key];
      if (value === undefined) {
        throw new Error(`Unknown template variable: {${key}}`);
      }
      return value;
    });
  }

  /**
   * Resolve a URI to its content
   */
  async resolve(
    uri: string,
    enforce: 'strict' | 'advisory' = 'advisory'
  ): Promise<ResolvedReference> {
    // Check cache first
    const cached = this.cache.get(uri);
    if (cached && !this.isExpired(cached)) {
      return { ...cached.value, fromCache: true };
    }

    const parsed = this.parseURI(uri);
    const resolvedPath = this.resolveTemplateVars(parsed.path);

    let content: unknown;
    let contentType: ResolvedReference['contentType'];

    switch (parsed.scheme) {
      case 'guide':
      case 'template':
        content = await this.loadMarkdown(parsed.scheme, resolvedPath);
        contentType = 'markdown';
        break;

      case 'schema':
        content = await this.loadJSON(parsed.scheme, resolvedPath);
        contentType = 'json';
        break;

      case 'config':
      case 'architect':
        content = await this.loadYAML(parsed.scheme, resolvedPath);
        contentType = 'yaml';
        break;

      case 'tool':
      case 'agent':
      case 'skill':
        content = await this.loadDefinition(parsed.scheme, resolvedPath);
        contentType = 'object';
        break;

      case 'mcp':
        content = this.resolveMCPTool(resolvedPath);
        contentType = 'object';
        break;

      case 'oracle':
        content = await this.resolveOracleRef(resolvedPath);
        contentType = 'object';
        break;

      default:
        throw new Error(`Unsupported scheme: ${parsed.scheme}`);
    }

    const resolved: ResolvedReference = {
      uri,
      scheme: parsed.scheme,
      path: resolvedPath,
      content,
      contentType,
      enforce,
      resolvedAt: new Date(),
      fromCache: false,
    };

    // Cache the result
    this.cache.set(uri, {
      value: resolved,
      timestamp: Date.now(),
    });

    return resolved;
  }

  /**
   * Resolve a reference configuration
   */
  async resolveConfig(config: ReferenceConfig): Promise<ResolvedReference> {
    return this.resolve(config.ref, config.enforce ?? 'advisory');
  }

  /**
   * Resolve multiple references
   */
  async resolveAll(refs: ReferenceConfig[]): Promise<ResolvedReference[]> {
    return Promise.all(refs.map(ref => this.resolveConfig(ref)));
  }

  /**
   * Validate strict references
   *
   * Returns validation result with errors for strict refs that fail.
   */
  async validateStrict(refs: ReferenceConfig[]): Promise<ReferenceValidationResult> {
    const errors: ReferenceValidationResult['errors'] = [];
    const warnings: ReferenceValidationResult['warnings'] = [];
    const resolvedRefs: ResolvedReference[] = [];

    for (const ref of refs) {
      try {
        const resolved = await this.resolveConfig(ref);
        resolvedRefs.push(resolved);

        // Check if required and content is empty
        if (ref.required && !resolved.content) {
          const error = {
            uri: ref.ref,
            message: `Required reference is empty: ${ref.ref}`,
            enforce: ref.enforce ?? 'advisory' as const,
          };
          if (ref.enforce === 'strict') {
            errors.push(error);
          } else {
            warnings.push({ uri: error.uri, message: error.message });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error = {
          uri: ref.ref,
          message: `Failed to resolve reference: ${message}`,
          enforce: ref.enforce ?? 'advisory' as const,
        };

        if (ref.enforce === 'strict') {
          errors.push(error);
        } else {
          warnings.push({ uri: error.uri, message: error.message });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      resolvedRefs,
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  pruneCache(): number {
    let pruned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
    };
  }

  // Private helper methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.cacheTTL;
  }

  private async loadMarkdown(scheme: URIScheme, uriPath: string): Promise<string> {
    const basePath = this.basePaths[scheme];
    const filePath = path.join(basePath, uriPath);

    // Ensure .md extension
    const fullPath = filePath.endsWith('.md') ? filePath : `${filePath}.md`;

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Guide not found: ${fullPath}`);
      }
      throw err;
    }
  }

  private async loadJSON(scheme: URIScheme, uriPath: string): Promise<unknown> {
    const basePath = this.basePaths[scheme];
    const filePath = path.join(basePath, uriPath);

    // Ensure .json extension
    const fullPath = filePath.endsWith('.json') ? filePath : `${filePath}.json`;

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Schema not found: ${fullPath}`);
      }
      throw err;
    }
  }

  private async loadYAML(scheme: URIScheme, uriPath: string): Promise<unknown> {
    const basePath = this.basePaths[scheme];
    const filePath = path.join(basePath, uriPath);

    // Try .yaml then .yml
    let fullPath = filePath.endsWith('.yaml') || filePath.endsWith('.yml')
      ? filePath
      : `${filePath}.yaml`;

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { parse } = await import('yaml');
      return parse(content);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Try .yml extension
        fullPath = `${filePath}.yml`;
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const { parse } = await import('yaml');
          return parse(content);
        } catch {
          throw new Error(`Config not found: ${filePath}.yaml or ${filePath}.yml`);
        }
      }
      throw err;
    }
  }

  private async loadDefinition(scheme: URIScheme, uriPath: string): Promise<unknown> {
    // Try JSON first, then YAML
    try {
      return await this.loadJSON(scheme, uriPath);
    } catch {
      try {
        return await this.loadYAML(scheme, uriPath);
      } catch {
        throw new Error(`Definition not found for ${scheme}://${uriPath}`);
      }
    }
  }

  private resolveMCPTool(uriPath: string): { server: string; tool: string } {
    // MCP URI format: mcp://server-name/tool-name
    const segments = uriPath.split('/');
    if (segments.length < 2 || segments[0] === undefined) {
      throw new Error(`Invalid MCP URI: mcp://${uriPath}`);
    }

    return {
      server: segments[0],
      tool: segments.slice(1).join('/'),
    };
  }

  private async resolveOracleRef(uriPath: string): Promise<unknown> {
    // Oracle refs require the Oracle instance
    // Return a placeholder that can be resolved later
    return {
      type: 'oracle-ref',
      path: uriPath,
      requiresOracle: true,
    };
  }
}

/**
 * Extract specific sections from markdown content
 */
export function extractMarkdownSections(
  content: string,
  sections: string[]
): string {
  const lines = content.split('\n');
  const result: string[] = [];
  const __currentSection: string | null = null;
  let inTargetSection = false;
  let sectionLevel = 0;

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch && headerMatch[1] !== undefined && headerMatch[2] !== undefined) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].toLowerCase().trim();

      // Check if this is a target section
      if (sections.some(s => title.includes(s.toLowerCase()))) {
        _currentSection = title;
        inTargetSection = true;
        sectionLevel = level;
        result.push(line);
      } else if (inTargetSection && level <= sectionLevel) {
        // End of target section (same or higher level header)
        inTargetSection = false;
        // _currentSection tracking ended
      } else if (inTargetSection) {
        result.push(line);
      }
    } else if (inTargetSection) {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Default resolver instance
 */
export const defaultResolver = new ReferenceResolver();
