/**
 * Morpheus - Migration Wizard
 *
 * "What is real? How do you define real? If you're talking about what you can feel,
 *  what you can smell, what you can taste and see, then 'real' is simply electrical
 *  signals interpreted by your brain." — Morpheus
 *
 * AI-powered migration wizard for The Construct architecture.
 */

// Main Morpheus Commander - value exports
export {
  Morpheus,
  createMorpheus,
} from './morpheus.js';

// Main Morpheus Commander - type exports
export type {
  MorpheusOptions,
  MorpheusCallbacks,
  MorpheusRunOptions,
  MorpheusRunResult,
  MorpheusMessage,
  PillChoiceContext,
  ApprovalContext,
  FileChange,
  UserInputOptions,
  ProgressUpdate,
} from './morpheus.js';

// Workflow system - value exports
export {
  WorkflowLoader,
  createWorkflowLoader,
  BUILT_IN_WORKFLOWS,
} from './workflow/loader.js';

// Workflow system - type exports
export type {
  WorkflowLoaderOptions,
  WorkflowValidator,
  ValidationIssue,
  WorkflowLoadResult,
  BuiltInWorkflowId,
} from './workflow/loader.js';

// Checklist Manager - value exports
export {
  ChecklistManager,
  createChecklistManager,
} from './workflow/checklist.js';

// Checklist Manager - type exports
export type {
  ChecklistManagerOptions,
  ChecklistUpdateEvent,
} from './workflow/checklist.js';

// State Store - value exports
export {
  WorkflowStateStore,
  createStateStore,
} from './workflow/state.js';

// State Store - type exports
export type {
  StateStoreOptions,
} from './workflow/state.js';

// Reporter - value exports
export {
  Reporter,
  createReporter,
} from './reporter/index.js';

// Reporter - type exports
export type {
  ReportFormat,
  ReportSection,
  ReportOptions,
  ReportData,
  ProgressData,
  GeneratedReport,
} from './reporter/index.js';

// CLI - value exports
export {
  MorpheusCLI,
  createCLI,
  createStyle,
  MORPHEUS_BANNER,
  MORPHEUS_BANNER_SMALL,
} from './cli/index.js';

// CLI - type exports
export type {
  CLIOptions,
  CLIResult,
  CLIStyle,
  OutputFn,
} from './cli/index.js';

// Knowledge Base - value exports
export {
  KnowledgeBase,
  createKnowledgeBase,
  // Patterns
  PATTERNS,
  getPatternsByCategory,
  getPatternById,
  searchPatterns,
  getPatternsForComponent,
  // Anti-Patterns
  ANTI_PATTERNS,
  getAntiPatternsByCategory,
  getAntiPatternsBySeverity,
  getAntiPatternById,
  getAllDetectionRules,
  searchAntiPatterns,
  // Best Practices
  BEST_PRACTICES,
  getBestPracticesByCategory,
  getBestPracticesByPriority,
  getBestPracticeById,
  getBestPracticesForComponent,
  getMigrationChecklist,
  searchBestPractices,
  // Construct Knowledge
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
} from './knowledge/index.js';

// Knowledge Base - type exports
export type {
  QueryOptions,
  SearchResult,
  MigrationGuidance,
  CodeContext,
  // Patterns
  Pattern,
  PatternCategory,
  PatternComplexity,
  PatternExample,
  // Anti-Patterns
  AntiPattern,
  AntiPatternCategory,
  AntiPatternSeverity,
  DetectionRule,
  AntiPatternExample,
  // Best Practices
  BestPractice,
  BestPracticeCategory,
  Priority,
  ChecklistItem as BestPracticeChecklistItem,
  Resource,
  // Construct Knowledge
  ConstructComponent,
  ComponentInterface,
  ConfigurationSpec,
  MigrationPath,
} from './knowledge/index.js';

// Crew (team agents) - value exports
export {
  BaseAgent,
  AgentExecutionError,
  CREW_ROLES,
  createDefaultAgentConfig,
  isValidCrewMember,
  getCrewMemberByName,
  getAllCrewMembers,
  // Tank - The Operator (Scanner)
  Tank,
  createTank,
  // Mouse - The Programmer (Generator)
  Mouse,
  createMouse,
  // Trinity - The Expert (Analyzer)
  Trinity,
  createTrinity,
  // Switch - The Skeptic (Validator)
  Switch,
  createSwitch,
  // Apoc - The Strategist (Planner)
  Apoc,
  createApoc,
} from './crew/index.js';

// Crew (team agents) - type exports
export type {
  AgentCapability,
  AgentContext,
  AgentTask,
  AgentStatus,
  ExecutionOptions,
  VerificationContext,
  CrewRole,
} from './crew/index.js';

// Re-export types from main types module
export type {
  // Crew types
  CrewMember,
  AgentResult,
  AgentError,
  AgentConfig,
  CrewConfig,

  // Workflow types
  Workflow,
  WorkflowConfig,
  WorkflowPhase,
  WorkflowStep,
  ChecklistItemDef,
  VerificationDef,
  ApprovalConfig,

  // State types
  WorkflowState,
  WorkflowStatus,
  WorkflowProgress,
  WorkflowEvent,
  WorkflowEventType,

  // Checklist types
  ChecklistState,
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistVerification,
  VerificationResult,

  // Checkpoint types
  Checkpoint,
  FileBackup,
  RollbackPlan,

  // Scanner types (Tank)
  ProjectScan,
  ScannedFile,
  FileLanguage,
  ImportStatement,
  ExportStatement,
  DependencyScan,
  AIPackageInfo,
  AIProvider,
  AIFeature,
  PackageInfo,
  ConfigScan,
  SecretDetection,
  ScanStatistics,

  // Analysis types (Trinity)
  FullAnalysis,
  AIUsageAnalysis,
  ProviderUsage,
  FileLocation,
  PromptAnalysis,
  PromptStructure,
  PromptVariable,
  ToolAnalysis,
  ToolParameter,
  ToolHandler,
  DetectedPattern,
  DetectedAntiPattern,
  ArchitectureAnalysis,
  StructureAssessment,
  SecurityAnalysis,
  SecurityFinding,
  QualityAnalysis,
  GapAnalysis,
  GapItem,
  GapRecommendation,

  // Migration plan types (Apoc)
  MigrationPlan,
  CurrentStateSummary,
  TargetStateSummary,
  MigrationRisk,
  RiskMitigation,
  MigrationPhase,
  MigrationTask,
  TaskStep,
  CodeChange,
  MigrationVerification,
  RollbackStep,
  MigrationEstimates,
  EffortEstimate,

  // Generation types (Mouse)
  GeneratedArtifacts,
  GeneratedContract,
  GeneratedConfig,
  GeneratedFile,

  // Validation types (Switch)
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AuditReport,
  AuditFinding,
} from '../types/morpheus.js';

// Re-export Zod schemas
export {
  WorkflowSchema,
  WorkflowConfigSchema,
  WorkflowPhaseSchema,
  WorkflowStepSchema,
  ChecklistItemDefSchema,
} from '../types/morpheus.js';
