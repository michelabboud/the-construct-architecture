/**
 * Morpheus Knowledge Base - Main Module
 *
 * "Remember... all I'm offering is the truth. Nothing more." — Morpheus
 *
 * Central knowledge base for AI development patterns, anti-patterns,
 * best practices, and The Construct architecture.
 */

import {
  Pattern,
  PatternCategory,
  PATTERNS,
  getPatternsByCategory,
  getPatternById,
  searchPatterns,
  getPatternsForComponent,
} from './patterns.js';

import {
  AntiPattern,
  AntiPatternCategory,
  AntiPatternSeverity,
  DetectionRule,
  ANTI_PATTERNS,
  getAntiPatternsByCategory,
  getAntiPatternsBySeverity,
  getAntiPatternById,
  getAllDetectionRules,
  searchAntiPatterns,
} from './anti-patterns.js';

import {
  BestPractice,
  BestPracticeCategory,
  Priority,
  BEST_PRACTICES,
  getBestPracticesByCategory,
  getBestPracticesByPriority,
  getBestPracticeById,
  getBestPracticesForComponent,
  getMigrationChecklist,
  searchBestPractices,
} from './best-practices.js';

import {
  ConstructComponent,
  MigrationPath,
  CONSTRUCT_COMPONENTS,
  MIGRATION_ORDER,
  MIGRATION_PATHS,
  getComponentById,
  getComponentDependencies,
  getMigrationPath,
  getMigrationPathsForComponent,
  canMigrateComponent,
  getNextMigratableComponents,
  calculateMigrationProgress,
  getComponentConfigTemplate,
} from './construct.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Knowledge base query options
 */
export interface QueryOptions {
  includePatterns?: boolean;
  includeAntiPatterns?: boolean;
  includeBestPractices?: boolean;
  includeConstruct?: boolean;
  limit?: number;
}

/**
 * Knowledge base search result
 */
export interface SearchResult {
  type: 'pattern' | 'anti-pattern' | 'best-practice' | 'component' | 'migration-path';
  id: string;
  name: string;
  description: string;
  relevance: number;
  item: Pattern | AntiPattern | BestPractice | ConstructComponent | MigrationPath;
}

/**
 * Migration guidance result
 */
export interface MigrationGuidance {
  currentState: string;
  targetComponent: string;
  steps: string[];
  relatedPatterns: Pattern[];
  antiPatternsToAvoid: AntiPattern[];
  bestPractices: BestPractice[];
  estimatedEffort: string;
}

/**
 * Code analysis context for knowledge queries
 */
export interface CodeContext {
  hasHardcodedPrompts?: boolean;
  hasMultipleProviders?: boolean;
  hasErrorHandling?: boolean;
  hasValidation?: boolean;
  hasTesting?: boolean;
  hasTypeDefinitions?: boolean;
  securityScore?: number;
  qualityScore?: number;
  detectedPatterns?: string[];
  detectedAntiPatterns?: string[];
}

// ============================================================================
// KNOWLEDGE BASE CLASS
// ============================================================================

/**
 * Morpheus Knowledge Base
 *
 * Central repository of knowledge about AI development patterns,
 * best practices, and The Construct architecture.
 */
export class KnowledgeBase {
  // -------------------------------------------------------------------------
  // PATTERNS
  // -------------------------------------------------------------------------

  /**
   * Get all patterns
   */
  getPatterns(): Pattern[] {
    return PATTERNS;
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: PatternCategory): Pattern[] {
    return getPatternsByCategory(category);
  }

  /**
   * Get a specific pattern by ID
   */
  getPattern(id: string): Pattern | undefined {
    return getPatternById(id);
  }

  /**
   * Search patterns
   */
  searchPatterns(query: string): Pattern[] {
    return searchPatterns(query);
  }

  /**
   * Get patterns for a Construct component
   */
  getPatternsForComponent(component: string): Pattern[] {
    return getPatternsForComponent(component);
  }

  // -------------------------------------------------------------------------
  // ANTI-PATTERNS
  // -------------------------------------------------------------------------

  /**
   * Get all anti-patterns
   */
  getAntiPatterns(): AntiPattern[] {
    return ANTI_PATTERNS;
  }

  /**
   * Get anti-patterns by category
   */
  getAntiPatternsByCategory(category: AntiPatternCategory): AntiPattern[] {
    return getAntiPatternsByCategory(category);
  }

  /**
   * Get anti-patterns by severity
   */
  getAntiPatternsBySeverity(severity: AntiPatternSeverity): AntiPattern[] {
    return getAntiPatternsBySeverity(severity);
  }

  /**
   * Get a specific anti-pattern by ID
   */
  getAntiPattern(id: string): AntiPattern | undefined {
    return getAntiPatternById(id);
  }

  /**
   * Search anti-patterns
   */
  searchAntiPatterns(query: string): AntiPattern[] {
    return searchAntiPatterns(query);
  }

  /**
   * Get all detection rules
   */
  getDetectionRules(): Array<{ antiPatternId: string; rule: DetectionRule }> {
    return getAllDetectionRules();
  }

  // -------------------------------------------------------------------------
  // BEST PRACTICES
  // -------------------------------------------------------------------------

  /**
   * Get all best practices
   */
  getBestPractices(): BestPractice[] {
    return BEST_PRACTICES;
  }

  /**
   * Get best practices by category
   */
  getBestPracticesByCategory(category: BestPracticeCategory): BestPractice[] {
    return getBestPracticesByCategory(category);
  }

  /**
   * Get best practices by priority
   */
  getBestPracticesByPriority(priority: Priority): BestPractice[] {
    return getBestPracticesByPriority(priority);
  }

  /**
   * Get a specific best practice by ID
   */
  getBestPractice(id: string): BestPractice | undefined {
    return getBestPracticeById(id);
  }

  /**
   * Get best practices for a Construct component
   */
  getBestPracticesForComponent(component: string): BestPractice[] {
    return getBestPracticesForComponent(component);
  }

  /**
   * Search best practices
   */
  searchBestPractices(query: string): BestPractice[] {
    return searchBestPractices(query);
  }

  /**
   * Get migration checklist
   */
  getMigrationChecklist(): Array<{ practice: BestPractice; items: { item: string; required: boolean }[] }> {
    return getMigrationChecklist();
  }

  // -------------------------------------------------------------------------
  // CONSTRUCT ARCHITECTURE
  // -------------------------------------------------------------------------

  /**
   * Get all Construct components
   */
  getComponents(): ConstructComponent[] {
    return CONSTRUCT_COMPONENTS;
  }

  /**
   * Get a specific component by ID
   */
  getComponent(id: string): ConstructComponent | undefined {
    return getComponentById(id);
  }

  /**
   * Get component dependencies
   */
  getComponentDependencies(id: string): string[] {
    return getComponentDependencies(id);
  }

  /**
   * Get recommended migration order
   */
  getMigrationOrder(): string[] {
    return MIGRATION_ORDER;
  }

  /**
   * Get migration paths
   */
  getMigrationPaths(): MigrationPath[] {
    return MIGRATION_PATHS;
  }

  /**
   * Get migration path for a pattern
   */
  getMigrationPath(pattern: string): MigrationPath | undefined {
    return getMigrationPath(pattern);
  }

  /**
   * Get migration paths for a component
   */
  getMigrationPathsForComponent(componentId: string): MigrationPath[] {
    return getMigrationPathsForComponent(componentId);
  }

  /**
   * Check if component can be migrated
   */
  canMigrateComponent(componentId: string, migratedComponents: string[]): boolean {
    return canMigrateComponent(componentId, migratedComponents);
  }

  /**
   * Get next migratable components
   */
  getNextMigratableComponents(migratedComponents: string[]): string[] {
    return getNextMigratableComponents(migratedComponents);
  }

  /**
   * Calculate migration progress
   */
  calculateMigrationProgress(migratedComponents: string[]): number {
    return calculateMigrationProgress(migratedComponents);
  }

  /**
   * Get component configuration template
   */
  getComponentConfigTemplate(id: string): string {
    return getComponentConfigTemplate(id);
  }

  // -------------------------------------------------------------------------
  // UNIFIED SEARCH
  // -------------------------------------------------------------------------

  /**
   * Search across all knowledge
   */
  search(query: string, options: QueryOptions = {}): SearchResult[] {
    const results: SearchResult[] = [];
    const {
      includePatterns = true,
      includeAntiPatterns = true,
      includeBestPractices = true,
      includeConstruct = true,
      limit = 20,
    } = options;

    const lowerQuery = query.toLowerCase();

    // Search patterns
    if (includePatterns) {
      for (const pattern of PATTERNS) {
        const relevance = this.calculateRelevance(
          lowerQuery,
          pattern.name,
          pattern.description,
          pattern.tags
        );
        if (relevance > 0) {
          results.push({
            type: 'pattern',
            id: pattern.id,
            name: pattern.name,
            description: pattern.description,
            relevance,
            item: pattern,
          });
        }
      }
    }

    // Search anti-patterns
    if (includeAntiPatterns) {
      for (const antiPattern of ANTI_PATTERNS) {
        const relevance = this.calculateRelevance(
          lowerQuery,
          antiPattern.name,
          antiPattern.description,
          antiPattern.symptoms
        );
        if (relevance > 0) {
          results.push({
            type: 'anti-pattern',
            id: antiPattern.id,
            name: antiPattern.name,
            description: antiPattern.description,
            relevance,
            item: antiPattern,
          });
        }
      }
    }

    // Search best practices
    if (includeBestPractices) {
      for (const practice of BEST_PRACTICES) {
        const relevance = this.calculateRelevance(
          lowerQuery,
          practice.title,
          practice.description,
          practice.guidelines
        );
        if (relevance > 0) {
          results.push({
            type: 'best-practice',
            id: practice.id,
            name: practice.title,
            description: practice.description,
            relevance,
            item: practice,
          });
        }
      }
    }

    // Search Construct components
    if (includeConstruct) {
      for (const component of CONSTRUCT_COMPONENTS) {
        const relevance = this.calculateRelevance(
          lowerQuery,
          component.name,
          component.description,
          component.responsibilities
        );
        if (relevance > 0) {
          results.push({
            type: 'component',
            id: component.id,
            name: component.name,
            description: component.description,
            relevance,
            item: component,
          });
        }
      }

      // Search migration paths
      for (const path of MIGRATION_PATHS) {
        const relevance = this.calculateRelevance(
          lowerQuery,
          path.fromPattern,
          path.steps.join(' '),
          []
        );
        if (relevance > 0) {
          results.push({
            type: 'migration-path',
            id: `${path.fromPattern}->${path.toComponent}`,
            name: `${path.fromPattern} → ${path.toComponent}`,
            description: path.steps[0] || '',
            relevance,
            item: path,
          });
        }
      }
    }

    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Calculate search relevance score
   */
  private calculateRelevance(
    query: string,
    name: string,
    description: string,
    extras: string[]
  ): number {
    let score = 0;

    // Exact name match
    if (name.toLowerCase() === query) {
      score += 1.0;
    }
    // Name contains query
    else if (name.toLowerCase().includes(query)) {
      score += 0.8;
    }

    // Description contains query
    if (description.toLowerCase().includes(query)) {
      score += 0.5;
    }

    // Extras (tags, symptoms, etc.) contain query
    for (const extra of extras) {
      if (extra.toLowerCase().includes(query)) {
        score += 0.2;
      }
    }

    return score;
  }

  // -------------------------------------------------------------------------
  // CONTEXT-AWARE RECOMMENDATIONS
  // -------------------------------------------------------------------------

  /**
   * Get recommendations based on code context
   */
  getRecommendations(context: CodeContext): {
    patterns: Pattern[];
    antiPatterns: AntiPattern[];
    bestPractices: BestPractice[];
    migrationPaths: MigrationPath[];
  } {
    const patterns: Pattern[] = [];
    const antiPatterns: AntiPattern[] = [];
    const bestPractices: BestPractice[] = [];
    const migrationPaths: MigrationPath[] = [];

    // Recommend based on detected issues
    if (context.hasHardcodedPrompts) {
      patterns.push(...this.searchPatterns('prompt template'));
      antiPatterns.push(...this.searchAntiPatterns('hardcoded'));
      bestPractices.push(...this.searchBestPractices('externalize'));
      const path = this.getMigrationPath('hardcoded prompts');
      if (path) migrationPaths.push(path);
    }

    if (!context.hasErrorHandling) {
      patterns.push(...this.searchPatterns('error handling'));
      antiPatterns.push(...this.searchAntiPatterns('no error'));
      bestPractices.push(...this.searchBestPractices('error handling'));
    }

    if (!context.hasValidation) {
      patterns.push(...this.searchPatterns('validation'));
      antiPatterns.push(...this.searchAntiPatterns('unvalidated'));
      bestPractices.push(...this.searchBestPractices('validate'));
      const path = this.getMigrationPath('no validation');
      if (path) migrationPaths.push(path);
    }

    if (context.securityScore !== undefined && context.securityScore < 50) {
      patterns.push(...this.getPatternsByCategory('security'));
      antiPatterns.push(...this.getAntiPatternsByCategory('security'));
      bestPractices.push(...this.getBestPracticesByCategory('security'));
      const path = this.getMigrationPath('security');
      if (path) migrationPaths.push(path);
    }

    if (!context.hasTesting) {
      antiPatterns.push(...this.searchAntiPatterns('mock'));
      antiPatterns.push(...this.searchAntiPatterns('prompt test'));
      bestPractices.push(...this.getBestPracticesByCategory('testing'));
    }

    // Deduplicate results
    return {
      patterns: this.deduplicateById(patterns),
      antiPatterns: this.deduplicateById(antiPatterns),
      bestPractices: this.deduplicateById(bestPractices),
      migrationPaths: this.deduplicatePaths(migrationPaths),
    };
  }

  /**
   * Get migration guidance for a specific pattern/issue
   */
  getMigrationGuidance(fromPattern: string): MigrationGuidance | undefined {
    const path = this.getMigrationPath(fromPattern);
    if (!path) return undefined;

    const component = this.getComponent(path.toComponent);
    if (!component) return undefined;

    return {
      currentState: fromPattern,
      targetComponent: component.name,
      steps: path.steps,
      relatedPatterns: this.getPatternsForComponent(path.toComponent),
      antiPatternsToAvoid: this.getAntiPatternsByCategory(
        this.mapComponentToCategory(path.toComponent)
      ),
      bestPractices: this.getBestPracticesForComponent(path.toComponent),
      estimatedEffort: path.effort,
    };
  }

  /**
   * Get a comprehensive knowledge summary for a component
   */
  getComponentKnowledge(componentId: string): {
    component: ConstructComponent | undefined;
    patterns: Pattern[];
    antiPatterns: AntiPattern[];
    bestPractices: BestPractice[];
    migrationPaths: MigrationPath[];
  } {
    return {
      component: this.getComponent(componentId),
      patterns: this.getPatternsForComponent(componentId),
      antiPatterns: this.getAntiPatternsByCategory(this.mapComponentToCategory(componentId)),
      bestPractices: this.getBestPracticesForComponent(componentId),
      migrationPaths: this.getMigrationPathsForComponent(componentId),
    };
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  private deduplicateById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  private deduplicatePaths(paths: MigrationPath[]): MigrationPath[] {
    const seen = new Set<string>();
    return paths.filter(path => {
      const key = `${path.fromPattern}->${path.toComponent}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private mapComponentToCategory(componentId: string): AntiPatternCategory {
    const mapping: Record<string, AntiPatternCategory> = {
      architect: 'maintainability',
      oracle: 'performance',
      agents: 'reliability',
      sentinels: 'security',
      programs: 'reliability',
      keymaker: 'reliability',
      smith: 'security',
    };
    return mapping[componentId] || 'maintainability';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new KnowledgeBase instance
 */
export function createKnowledgeBase(): KnowledgeBase {
  return new KnowledgeBase();
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
  Pattern,
  PatternCategory,
  AntiPattern,
  AntiPatternCategory,
  AntiPatternSeverity,
  DetectionRule,
  BestPractice,
  BestPracticeCategory,
  Priority,
  ConstructComponent,
  MigrationPath,
};
