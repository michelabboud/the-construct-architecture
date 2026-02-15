/**
 * Morpheus Knowledge Base Module
 *
 * "I'm trying to free your mind, Neo. But I can only show you the door.
 *  You're the one that has to walk through it." — Morpheus
 *
 * Exports knowledge about AI development patterns, anti-patterns,
 * best practices, and The Construct architecture.
 */

// Main Knowledge Base - value exports
export {
  KnowledgeBase,
  createKnowledgeBase,
} from './knowledge-base.js';

// Main Knowledge Base - type exports
export type {
  QueryOptions,
  SearchResult,
  MigrationGuidance,
  CodeContext,
} from './knowledge-base.js';

// Patterns - value exports
export {
  PATTERNS,
  getPatternsByCategory,
  getPatternById,
  searchPatterns,
  getPatternsForComponent,
} from './patterns.js';

// Patterns - type exports
export type {
  Pattern,
  PatternCategory,
  PatternComplexity,
  PatternExample,
} from './patterns.js';

// Anti-Patterns - value exports
export {
  ANTI_PATTERNS,
  getAntiPatternsByCategory,
  getAntiPatternsBySeverity,
  getAntiPatternById,
  getAllDetectionRules,
  searchAntiPatterns,
} from './anti-patterns.js';

// Anti-Patterns - type exports
export type {
  AntiPattern,
  AntiPatternCategory,
  AntiPatternSeverity,
  DetectionRule,
  AntiPatternExample,
} from './anti-patterns.js';

// Best Practices - value exports
export {
  BEST_PRACTICES,
  getBestPracticesByCategory,
  getBestPracticesByPriority,
  getBestPracticeById,
  getBestPracticesForComponent,
  getMigrationChecklist,
  searchBestPractices,
} from './best-practices.js';

// Best Practices - type exports
export type {
  BestPractice,
  BestPracticeCategory,
  Priority,
  ChecklistItem,
  Resource,
} from './best-practices.js';

// The Construct - value exports
export {
  CONSTRUCT_COMPONENTS,
  COMPONENT_DEPENDENCIES,
  MIGRATION_ORDER,
  MIGRATION_PATHS,
  getComponentById,
  getComponentDependencies,
  getDependentComponents,
  getMigrationPath,
  getMigrationPathsForComponent,
  canMigrateComponent,
  getNextMigratableComponents,
  calculateMigrationProgress,
  getComponentConfigTemplate,
} from './construct.js';

// The Construct - type exports
export type {
  ConstructComponent,
  ComponentInterface,
  ConfigurationSpec,
  MigrationPath,
} from './construct.js';
