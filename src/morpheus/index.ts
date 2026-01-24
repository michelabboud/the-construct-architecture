/**
 * Morpheus - Migration Wizard
 *
 * "What is real? How do you define real? If you're talking about what you can feel,
 *  what you can smell, what you can taste and see, then 'real' is simply electrical
 *  signals interpreted by your brain." — Morpheus
 *
 * AI-powered migration wizard for The Construct architecture.
 */

// Main Morpheus Commander
export {
  Morpheus,
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
  createMorpheus,
} from './morpheus.js';

// Workflow system
export {
  WorkflowLoader,
  WorkflowLoaderOptions,
  WorkflowValidator,
  ValidationIssue,
  WorkflowLoadResult,
  createWorkflowLoader,
  BUILT_IN_WORKFLOWS,
  BuiltInWorkflowId,
} from './workflow/loader.js';

export {
  ChecklistManager,
  ChecklistManagerOptions,
  ChecklistUpdateEvent,
  createChecklistManager,
} from './workflow/checklist.js';

export {
  WorkflowStateStore,
  StateStoreOptions,
  createStateStore,
} from './workflow/state.js';

// Reporter
export {
  Reporter,
  createReporter,
  ReportFormat,
  ReportSection,
  ReportOptions,
  ReportData,
  ProgressData,
  GeneratedReport,
} from './reporter/index.js';

// CLI
export {
  MorpheusCLI,
  createCLI,
  CLIOptions,
  CLIResult,
  CLIStyle,
  OutputFn,
  createStyle,
  MORPHEUS_BANNER,
  MORPHEUS_BANNER_SMALL,
} from './cli/index.js';

// Knowledge Base
export {
  KnowledgeBase,
  createKnowledgeBase,
  QueryOptions,
  SearchResult,
  MigrationGuidance,
  CodeContext,
  // Patterns
  Pattern,
  PatternCategory,
  PatternComplexity,
  PatternExample,
  PATTERNS,
  getPatternsByCategory,
  getPatternById,
  searchPatterns,
  getPatternsForComponent,
  // Anti-Patterns
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
  // Best Practices
  BestPractice,
  BestPracticeCategory,
  Priority,
  ChecklistItem as BestPracticeChecklistItem,
  Resource,
  BEST_PRACTICES,
  getBestPracticesByCategory,
  getBestPracticesByPriority,
  getBestPracticeById,
  getBestPracticesForComponent,
  getMigrationChecklist,
  searchBestPractices,
  // Construct Knowledge
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
} from './knowledge/index.js';

// Crew (team agents)
export {
  BaseAgent,
  AgentCapability,
  AgentContext,
  AgentTask,
  AgentStatus,
  ExecutionOptions,
  VerificationContext,
  AgentExecutionError,
  CrewRole,
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
