/**
 * Morpheus Knowledge Base Module
 *
 * "I'm trying to free your mind, Neo. But I can only show you the door.
 *  You're the one that has to walk through it." — Morpheus
 *
 * Exports knowledge about AI development patterns, anti-patterns,
 * best practices, and The Construct architecture.
 */

// Main Knowledge Base
export {
  KnowledgeBase,
  createKnowledgeBase,
  QueryOptions,
  SearchResult,
  MigrationGuidance,
  CodeContext,
} from './knowledge-base.js';

// Patterns
export {
  Pattern,
  PatternCategory,
  PatternComplexity,
  PatternExample,
  PATTERNS,
  getPatternsByCategory,
  getPatternById,
  searchPatterns,
  getPatternsForComponent,
} from './patterns.js';

// Anti-Patterns
export {
  AntiPattern,
  AntiPatternCategory,
  AntiPatternSeverity,
  DetectionRule,
  AntiPatternExample,
  ANTI_PATTERNS,
  getAntiPatternsByCategory,
  getAntiPatternsBySeverity,
  getAntiPatternById,
  getAllDetectionRules,
  searchAntiPatterns,
} from './anti-patterns.js';

// Best Practices
export {
  BestPractice,
  BestPracticeCategory,
  Priority,
  ChecklistItem,
  Resource,
  BEST_PRACTICES,
  getBestPracticesByCategory,
  getBestPracticesByPriority,
  getBestPracticeById,
  getBestPracticesForComponent,
  getMigrationChecklist,
  searchBestPractices,
} from './best-practices.js';

// The Construct
export {
  ConstructComponent,
  ComponentInterface,
  ConfigurationSpec,
  MigrationPath,
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
