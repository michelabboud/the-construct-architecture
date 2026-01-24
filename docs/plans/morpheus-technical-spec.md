# Morpheus - Technical Specification

> *"The Matrix is everywhere. It is all around us."* — Morpheus

## Overview

This document provides detailed technical specifications for implementing Morpheus, the AI-powered migration wizard for The Construct architecture.

**Key Architecture Decisions:**
1. **Built on The Construct**: Morpheus uses its own architecture (dogfooding)
2. **Team Agents**: The Nebuchadnezzar Crew handles different migration aspects
3. **YAML Workflows**: Flexible, customizable migration workflows
4. **AI-Verified Checklists**: Switch agent verifies completion with evidence

## File Structure

```
src/morpheus/
├── index.ts                    # Main exports
├── morpheus.ts                 # Morpheus Commander (orchestrates crew)
│
├── crew/                       # The Nebuchadnezzar Crew (Team Agents)
│   ├── index.ts               # Crew exports
│   ├── types.ts               # Shared crew types
│   ├── base-agent.ts          # Base agent class
│   │
│   ├── tank/                  # Tank - The Operator (Scanner)
│   │   ├── tank.ts            # Tank agent implementation
│   │   ├── scanner.ts         # File system scanner
│   │   ├── ast-parser.ts      # TypeScript AST parser
│   │   ├── dependency-mapper.ts # Package dependency analysis
│   │   └── indexer.ts         # AI usage indexer
│   │
│   ├── mouse/                 # Mouse - The Programmer (Generator)
│   │   ├── mouse.ts           # Mouse agent implementation
│   │   ├── contract-generator.ts # Contract YAML generation
│   │   ├── code-generator.ts  # Migration code generation
│   │   ├── config-generator.ts # Config file generation
│   │   ├── type-generator.ts  # TypeScript type generation
│   │   └── templates/         # Generation templates
│   │       ├── contract.hbs
│   │       ├── keymaker.hbs
│   │       └── executor.hbs
│   │
│   ├── trinity/               # Trinity - The Executor (AI Operations)
│   │   ├── trinity.ts         # Trinity agent implementation
│   │   ├── comprehend.ts      # AI code comprehension
│   │   ├── intent-extractor.ts # Prompt intent extraction
│   │   ├── migrator.ts        # AI-powered migration execution
│   │   └── advisor.ts         # Interactive migration advisor
│   │
│   ├── switch/                # Switch - The Validator
│   │   ├── switch.ts          # Switch agent implementation
│   │   ├── validator.ts       # Contract/code validation
│   │   ├── verifier.ts        # Checklist verification
│   │   └── auditor.ts         # Migration auditing
│   │
│   └── apoc/                  # Apoc - The Planner
│       ├── apoc.ts            # Apoc agent implementation
│       ├── planner.ts         # Migration plan generation
│       ├── risk-assessor.ts   # Risk assessment
│       ├── estimator.ts       # Effort estimation
│       └── rollback.ts        # Rollback planning
│
├── workflow/                   # Workflow Engine
│   ├── types.ts               # Workflow type definitions
│   ├── executor.ts            # Workflow execution engine
│   ├── state-machine.ts       # Workflow state management
│   ├── checklist.ts           # Checklist manager
│   └── loader.ts              # YAML workflow loader
│
├── patterns/                   # Detection patterns
│   ├── patterns.ts            # Pattern registry
│   ├── openai-patterns.ts     # OpenAI SDK patterns
│   ├── anthropic-patterns.ts  # Anthropic SDK patterns
│   ├── langchain-patterns.ts  # LangChain patterns
│   └── anti-patterns.ts       # Anti-pattern detection
│
├── reporter/                   # Report generation
│   ├── reporter.ts            # Main reporter
│   ├── formats/
│   │   ├── markdown.ts
│   │   ├── html.ts
│   │   └── json.ts
│   └── templates/             # Report templates
│
├── cli/                        # Command Line Interface
│   ├── index.ts               # CLI entry point
│   ├── commands/
│   │   ├── analyze.ts         # Tank-powered analysis
│   │   ├── plan.ts            # Apoc-powered planning
│   │   ├── guide.ts           # Interactive guide
│   │   ├── migrate.ts         # Mouse+Trinity migration
│   │   ├── verify.ts          # Switch-powered verification
│   │   └── ask.ts             # Trinity advisor
│   └── ui/
│       ├── progress.ts        # Progress display
│       ├── checklist.ts       # Checklist display
│       └── team-status.ts     # Team agent status
│
├── contracts/                  # Morpheus's own contracts
│   ├── tank/
│   │   ├── scan-project.yaml
│   │   ├── index-ai-usage.yaml
│   │   └── map-dependencies.yaml
│   ├── mouse/
│   │   ├── generate-contract.yaml
│   │   ├── generate-migration.yaml
│   │   ├── generate-config.yaml
│   │   └── generate-types.yaml
│   ├── trinity/
│   │   ├── comprehend-code.yaml
│   │   ├── extract-intent.yaml
│   │   ├── analyze-architecture.yaml
│   │   └── migration-advisor.yaml
│   ├── switch/
│   │   ├── validate-contract.yaml
│   │   ├── verify-checklist.yaml
│   │   ├── audit-migration.yaml
│   │   └── quality-report.yaml
│   └── apoc/
│       ├── create-plan.yaml
│       ├── assess-risks.yaml
│       ├── estimate-effort.yaml
│       └── plan-rollback.yaml
│
├── workflows/                  # Workflow definitions
│   ├── standard-migration.yaml
│   ├── quick-migration.yaml
│   ├── security-focused.yaml
│   └── minimal.yaml
│
├── knowledge/                  # Knowledge base
│   ├── construct-architecture.ts
│   ├── patterns.ts
│   ├── anti-patterns.ts
│   └── best-practices.ts
│
└── types/                      # Type definitions
    ├── morpheus.ts            # Core Morpheus types
    ├── crew.ts                # Team agent types
    ├── workflow.ts            # Workflow types
    └── index.ts               # Type exports
```

## Type Definitions

### Core Types

```typescript
// src/types/morpheus.ts

// ============ Scanner Types ============

export interface ProjectScan {
  rootPath: string;
  scannedAt: Date;
  files: ScannedFile[];
  dependencies: DependencyScan;
  configs: ConfigScan;
  statistics: ScanStatistics;
}

export interface ScannedFile {
  path: string;
  relativePath: string;
  language: 'typescript' | 'javascript' | 'json' | 'yaml' | 'other';
  size: number;
  ast?: AST;
  imports: ImportStatement[];
  exports: ExportStatement[];
}

export interface DependencyScan {
  packageManager: 'npm' | 'yarn' | 'pnpm';
  packageJson: PackageJson;
  lockfilePresent: boolean;
  nodeVersion?: string;
  typescript: boolean;
  tsConfig?: TSConfig;
  aiPackages: AIPackageInfo[];
  relatedPackages: PackageInfo[];
}

export interface AIPackageInfo {
  name: string;
  version: string;
  provider: AIProvider;
  features: AIFeature[];
}

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'cohere'
  | 'mistral'
  | 'langchain'
  | 'llamaindex'
  | 'custom';

export type AIFeature =
  | 'chat'
  | 'completion'
  | 'embeddings'
  | 'vision'
  | 'audio'
  | 'tools'
  | 'streaming'
  | 'agents';

export interface ConfigScan {
  envFiles: string[];
  configFiles: string[];
  hasEnvExample: boolean;
  detectedSecrets: SecretDetection[];
}

export interface ScanStatistics {
  totalFiles: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  aiRelatedFiles: number;
  scanDuration: number;
}

// ============ Analysis Types ============

export interface FullAnalysis {
  project: ProjectScan;
  aiUsage: AIUsageAnalysis;
  architecture: ArchitectureAnalysis;
  security: SecurityAnalysis;
  quality: QualityAnalysis;
  gaps: GapAnalysis;
}

export interface AIUsageAnalysis {
  providers: ProviderUsage[];
  prompts: PromptAnalysis[];
  tools: ToolAnalysis[];
  patterns: DetectedPattern[];
  antiPatterns: DetectedAntiPattern[];
}

export interface ProviderUsage {
  provider: AIProvider;
  package: string;
  version: string;
  locations: FileLocation[];
  models: string[];
  features: AIFeature[];
  callCount: number;
}

export interface FileLocation {
  file: string;
  line: number;
  column: number;
  snippet?: string;
}

export interface PromptAnalysis {
  id: string;
  location: FileLocation;
  type: 'inline' | 'template' | 'file' | 'dynamic';
  structure: PromptStructure;
  variables: PromptVariable[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTokens: number;
  recommendations: string[];
}

export interface PromptStructure {
  hasSystemPrompt: boolean;
  hasUserPrompt: boolean;
  hasAssistantExamples: boolean;
  messageCount: number;
  systemPromptContent?: string;
  userPromptTemplate?: string;
}

export interface PromptVariable {
  name: string;
  source: 'parameter' | 'context' | 'computed';
  type?: string;
}

export interface ToolAnalysis {
  id: string;
  location: FileLocation;
  name: string;
  description?: string;
  parameters: ToolParameter[];
  handler: ToolHandler;
  pattern: 'openai-functions' | 'anthropic-tools' | 'langchain' | 'custom';
  hasValidation: boolean;
  hasErrorHandling: boolean;
}

export interface ToolParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export interface ToolHandler {
  location: FileLocation;
  async: boolean;
  hasErrorHandling: boolean;
  returnsValue: boolean;
}

export interface DetectedPattern {
  id: string;
  name: string;
  category: 'good' | 'neutral' | 'warning';
  locations: FileLocation[];
  description: string;
  recommendation?: string;
}

export interface DetectedAntiPattern {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  locations: FileLocation[];
  description: string;
  impact: string;
  remediation: string;
}

export interface ArchitectureAnalysis {
  structure: StructureAssessment;
  patterns: ArchitecturePattern[];
  layers: LayerAnalysis;
  coupling: CouplingAnalysis;
  score: number; // 0-100
}

export interface StructureAssessment {
  hasServiceLayer: boolean;
  hasSeparateAIModule: boolean;
  hasConfigFiles: boolean;
  hasTypeDefinitions: boolean;
  hasCentralizedErrors: boolean;
  hasLogging: boolean;
  hasTests: boolean;
  directoryStructure: DirectoryNode;
}

export interface SecurityAnalysis {
  score: number; // 0-100
  findings: SecurityFinding[];
  hasAuthentication: boolean;
  hasAuthorization: boolean;
  hasAuditLogging: boolean;
  hasSecretManagement: boolean;
  hasInputValidation: boolean;
  hasOutputSanitization: boolean;
  exposedSecrets: ExposedSecret[];
}

export interface SecurityFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  location?: FileLocation;
  remediation: string;
}

export interface QualityAnalysis {
  score: number; // 0-100
  errorHandling: ErrorHandlingAnalysis;
  validation: ValidationAnalysis;
  testing: TestingAnalysis;
  documentation: DocumentationAnalysis;
}

export interface ErrorHandlingAnalysis {
  hasGlobalHandler: boolean;
  hasTryCatch: boolean;
  hasRetryLogic: boolean;
  hasCircuitBreaker: boolean;
  uncaughtAICalls: FileLocation[];
}

export interface ValidationAnalysis {
  hasInputValidation: boolean;
  hasOutputValidation: boolean;
  validationLibrary?: string;
  validatedEndpoints: number;
  unvalidatedEndpoints: number;
}

export interface GapAnalysis {
  missing: GapItem[];
  partial: GapItem[];
  recommendations: GapRecommendation[];
  prioritizedActions: PrioritizedAction[];
}

export interface GapItem {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  constructComponent: string; // Which Construct component addresses this
}

export interface GapRecommendation {
  priority: number;
  title: string;
  description: string;
  effort: 'trivial' | 'small' | 'medium' | 'large';
  benefit: string;
}

// ============ Planning Types ============

export interface MigrationPlan {
  id: string;
  projectName: string;
  generatedAt: Date;
  morpheusVersion: string;

  // Assessment summary
  currentState: CurrentStateSummary;
  targetState: TargetStateSummary;
  gapAnalysis: GapAnalysis;

  // Risk analysis
  risks: MigrationRisk[];
  mitigations: RiskMitigation[];

  // Phases
  phases: MigrationPhase[];

  // Generated artifacts
  artifacts: GeneratedArtifacts;

  // Estimates
  estimates: MigrationEstimates;
}

export interface CurrentStateSummary {
  aiProviders: string[];
  promptCount: number;
  toolCount: number;
  architectureScore: number;
  securityScore: number;
  qualityScore: number;
  keyFindings: string[];
}

export interface TargetStateSummary {
  architecture: string;
  components: string[];
  benefits: string[];
}

export interface MigrationRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'technical' | 'operational' | 'schedule' | 'resource';
}

export interface RiskMitigation {
  riskId: string;
  strategy: string;
  actions: string[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  order: number;

  goals: string[];
  dependsOn: string[];

  tasks: MigrationTask[];
  verification: VerificationStep[];
  rollback: RollbackStep[];

  estimatedEffort: EffortEstimate;
}

export interface MigrationTask {
  id: string;
  name: string;
  description: string;
  type: 'install' | 'configure' | 'refactor' | 'create' | 'test' | 'verify';

  // What files are affected
  affectedFiles: string[];

  // Detailed steps
  steps: TaskStep[];

  // Verification
  verification: string;

  // Can this be automated?
  automatable: boolean;
  automationScript?: string;
}

export interface TaskStep {
  order: number;
  description: string;
  command?: string;
  codeChange?: CodeChange;
}

export interface CodeChange {
  file: string;
  type: 'create' | 'modify' | 'delete';
  description: string;
  before?: string;
  after?: string;
}

export interface VerificationStep {
  name: string;
  type: 'test' | 'manual' | 'automated';
  command?: string;
  expectedResult: string;
}

export interface RollbackStep {
  order: number;
  description: string;
  command?: string;
}

export interface MigrationEstimates {
  totalEffort: EffortEstimate;
  phaseEfforts: Record<string, EffortEstimate>;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  confidence: number; // 0-100
  assumptions: string[];
}

export interface EffortEstimate {
  optimistic: number; // hours
  realistic: number;
  pessimistic: number;
  unit: 'hours' | 'days' | 'weeks';
}

// ============ Generator Types ============

export interface GeneratedArtifacts {
  contracts: GeneratedContract[];
  configs: GeneratedConfig[];
  scaffolding: GeneratedFile[];
}

export interface GeneratedContract {
  id: string;
  name: string;
  sourcePrompt: PromptAnalysis;
  content: string; // YAML content
  outputPath: string;
  confidence: number; // How confident we are in the generation
  warnings: string[];
}

export interface GeneratedConfig {
  type: 'architect' | 'keymaker' | 'sentinels' | 'oracle' | 'smith';
  content: string; // YAML content
  outputPath: string;
  description: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'test' | 'documentation';
  description: string;
}

// ============ Report Types ============

export interface MigrationReport {
  format: 'markdown' | 'html' | 'json' | 'pdf';
  sections: ReportSection[];
  generatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  subsections?: ReportSection[];
}
```

### Team Agent Types (Nebuchadnezzar Crew)

```typescript
// src/types/crew.ts

// ============ Base Agent Types ============

export type CrewMember = 'tank' | 'mouse' | 'trinity' | 'switch' | 'apoc';

export interface BaseAgent {
  name: CrewMember;
  description: string;
  contracts: string[];
  enabled: boolean;

  // Execute a contract
  execute<TInput, TOutput>(
    contractId: string,
    input: TInput
  ): Promise<AgentResult<TOutput>>;
}

export interface AgentResult<T> {
  success: boolean;
  output?: T;
  error?: AgentError;
  timing: {
    startedAt: Date;
    completedAt: Date;
    duration: number;
  };
  tokens?: {
    input: number;
    output: number;
  };
}

export interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

// ============ Tank Agent Types ============

export interface TankAgent extends BaseAgent {
  name: 'tank';

  // Scanning
  scanProject(path: string): Promise<ProjectScan>;
  scanFiles(patterns: string[]): Promise<ScannedFile[]>;
  scanDependencies(path: string): Promise<DependencyScan>;

  // Indexing
  indexAIUsage(scan: ProjectScan): Promise<AIUsageIndex>;
  indexPrompts(scan: ProjectScan): Promise<PromptIndex>;
  indexTools(scan: ProjectScan): Promise<ToolIndex>;

  // Loading
  loadAST(file: string): Promise<AST>;
  loadConfig(file: string): Promise<unknown>;
}

export interface AIUsageIndex {
  providers: Map<AIProvider, ProviderUsage>;
  prompts: PromptAnalysis[];
  tools: ToolAnalysis[];
  patterns: DetectedPattern[];
  antiPatterns: DetectedAntiPattern[];
}

export interface PromptIndex {
  prompts: PromptAnalysis[];
  byFile: Map<string, PromptAnalysis[]>;
  byProvider: Map<AIProvider, PromptAnalysis[]>;
  byComplexity: Map<string, PromptAnalysis[]>;
}

export interface ToolIndex {
  tools: ToolAnalysis[];
  byPattern: Map<string, ToolAnalysis[]>;
}

// ============ Mouse Agent Types ============

export interface MouseAgent extends BaseAgent {
  name: 'mouse';

  // Contract generation
  generateContract(prompt: PromptAnalysis): Promise<GeneratedContract>;
  generateContracts(prompts: PromptAnalysis[]): Promise<GeneratedContract[]>;

  // Code generation
  generateMigrationCode(task: MigrationTask): Promise<GeneratedCode>;
  generateKeymakerAdapter(provider: ProviderUsage): Promise<GeneratedCode>;
  generateContractExecutor(contracts: GeneratedContract[]): Promise<GeneratedCode>;

  // Config generation
  generateArchitectConfig(analysis: FullAnalysis): Promise<GeneratedConfig>;
  generateKeymakerConfig(providers: ProviderUsage[]): Promise<GeneratedConfig>;
  generateProjectTruth(analysis: FullAnalysis): Promise<GeneratedConfig>;

  // Type generation
  generateTypes(contracts: GeneratedContract[]): Promise<GeneratedCode>;
}

export interface GeneratedCode {
  content: string;
  path: string;
  language: 'typescript' | 'javascript' | 'yaml';
  description: string;
  warnings: string[];
}

// ============ Trinity Agent Types ============

export interface TrinityAgent extends BaseAgent {
  name: 'trinity';

  // AI-powered analysis
  comprehendCode(code: string, context: string): Promise<CodeComprehension>;
  extractIntent(prompt: PromptAnalysis): Promise<PromptIntent>;
  analyzeArchitecture(scan: ProjectScan): Promise<ArchitectureAnalysis>;

  // AI-powered migration
  migratePrompt(prompt: PromptAnalysis): Promise<MigrationResult>;
  migrateToolCall(tool: ToolAnalysis): Promise<MigrationResult>;
  migrateProvider(provider: ProviderUsage): Promise<MigrationResult>;

  // Advisor
  advise(question: string, context: MigrationContext): Promise<AdvisorResponse>;
  suggest(situation: MigrationSituation): Promise<Suggestion[]>;
  explain(concept: string): Promise<Explanation>;
}

export interface CodeComprehension {
  summary: string;
  purpose: string;
  complexity: 'simple' | 'moderate' | 'complex';
  patterns: string[];
  concerns: string[];
  suggestions: string[];
}

export interface PromptIntent {
  goal: string;
  inputs: string[];
  expectedOutput: string;
  constraints: string[];
  suggestedContract: {
    id: string;
    goals: string[];
    limitations: string[];
  };
}

export interface MigrationResult {
  success: boolean;
  originalCode: string;
  migratedCode: string;
  changes: CodeChange[];
  warnings: string[];
  verification: string;
}

export interface AdvisorResponse {
  answer: string;
  suggestions: string[];
  relevantDocs: { title: string; url: string }[];
  nextSteps?: string[];
}

export interface MigrationContext {
  currentPhase: string;
  currentStep: string;
  projectAnalysis: FullAnalysis;
  migrationPlan: MigrationPlan;
  completedSteps: string[];
}

// ============ Switch Agent Types ============

export interface SwitchAgent extends BaseAgent {
  name: 'switch';

  // Validation
  validateContract(contract: GeneratedContract): Promise<ValidationResult>;
  validateMigration(migration: MigrationResult): Promise<ValidationResult>;
  validateConfig(config: GeneratedConfig): Promise<ValidationResult>;
  validateCode(code: GeneratedCode): Promise<ValidationResult>;

  // AI-powered verification
  verifyChecklist(item: ChecklistItem, context: ProjectContext): Promise<VerificationResult>;
  verifyPhaseComplete(phase: WorkflowPhase): Promise<VerificationResult>;
  verifyMigrationComplete(plan: MigrationPlan): Promise<VerificationResult>;

  // Auditing
  auditMigration(migration: MigrationResult): Promise<AuditReport>;
  generateQualityReport(project: string): Promise<QualityReport>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
}

export interface VerificationResult {
  verified: boolean;
  evidence: string;
  confidence: number; // 0-100
  method: 'automated' | 'ai-verified' | 'manual';
  details?: string;
}

export interface AuditReport {
  migration: string;
  timestamp: Date;
  findings: AuditFinding[];
  overallScore: number;
  recommendation: 'approve' | 'review' | 'reject';
}

export interface AuditFinding {
  severity: 'info' | 'low' | 'medium' | 'high';
  area: string;
  finding: string;
  remediation?: string;
}

// ============ Apoc Agent Types ============

export interface ApocAgent extends BaseAgent {
  name: 'apoc';

  // Planning
  createMigrationPlan(analysis: FullAnalysis): Promise<MigrationPlan>;
  planPhase(analysis: FullAnalysis, phaseType: PhaseType): Promise<MigrationPhase>;
  planTasks(phase: MigrationPhase): Promise<MigrationTask[]>;
  prioritizeTasks(tasks: MigrationTask[]): Promise<MigrationTask[]>;

  // Risk assessment
  assessRisks(plan: MigrationPlan): Promise<MigrationRisk[]>;
  suggestMitigations(risks: MigrationRisk[]): Promise<RiskMitigation[]>;
  evaluateImpact(change: CodeChange): Promise<ImpactAssessment>;

  // Estimation
  estimateEffort(plan: MigrationPlan): Promise<MigrationEstimates>;
  estimateTimeline(plan: MigrationPlan): Promise<Timeline>;

  // Rollback
  planRollback(phase: MigrationPhase): Promise<RollbackPlan>;
  createCheckpoint(state: WorkflowState): Promise<Checkpoint>;
}

export interface ImpactAssessment {
  scope: 'local' | 'module' | 'project-wide';
  affectedFiles: string[];
  affectedTests: string[];
  breakingChanges: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface RollbackPlan {
  phaseId: string;
  steps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Checkpoint {
  id: string;
  createdAt: Date;
  phaseId: string;
  stepId: string;
  state: WorkflowState;
  files: Map<string, string>; // path -> content backup
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  phases: {
    phaseId: string;
    startDate: Date;
    endDate: Date;
    milestones: { name: string; date: Date }[];
  }[];
  criticalPath: string[];
}

export type PhaseType =
  | 'foundation'
  | 'keymaker-migration'
  | 'contract-migration'
  | 'sentinel-integration'
  | 'oracle-integration'
  | 'security-hardening'
  | 'chaos-testing';
```

## Detection Patterns

### OpenAI Pattern Detection

```typescript
// src/morpheus/patterns/openai-patterns.ts

export const openaiPatterns: DetectionPattern[] = [
  {
    id: 'openai-import',
    name: 'OpenAI SDK Import',
    astPattern: {
      type: 'ImportDeclaration',
      source: { value: 'openai' },
    },
    indicates: {
      aiProvider: 'openai',
    },
  },
  {
    id: 'openai-chat-completion',
    name: 'OpenAI Chat Completion',
    astPattern: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        property: { name: 'create' },
        object: {
          type: 'MemberExpression',
          property: { name: 'completions' },
        },
      },
    },
    indicates: {
      aiProvider: 'openai',
      feature: 'chat',
    },
  },
  {
    id: 'openai-function-calling',
    name: 'OpenAI Function Calling',
    astPattern: {
      type: 'Property',
      key: { name: 'functions' },
      value: { type: 'ArrayExpression' },
    },
    indicates: {
      aiProvider: 'openai',
      feature: 'tools',
    },
  },
  {
    id: 'openai-streaming',
    name: 'OpenAI Streaming',
    astPattern: {
      type: 'Property',
      key: { name: 'stream' },
      value: { type: 'Literal', value: true },
    },
    indicates: {
      feature: 'streaming',
    },
  },
];
```

### Anti-Pattern Detection

```typescript
// src/morpheus/patterns/anti-patterns.ts

export const antiPatterns: DetectionPattern[] = [
  {
    id: 'hardcoded-api-key',
    name: 'Hardcoded API Key',
    astPattern: {
      type: 'Property',
      key: { name: /apiKey|api_key/i },
      value: { type: 'Literal', value: /^sk-/ },
    },
    indicates: {
      antiPattern: 'hardcoded-secret',
      securityIssue: 'credential-exposure',
    },
    recommendation: 'Move API keys to environment variables',
    severity: 'critical',
  },
  {
    id: 'no-error-handling',
    name: 'AI Call Without Error Handling',
    astPattern: {
      type: 'AwaitExpression',
      argument: {
        type: 'CallExpression',
        // AI call patterns
      },
      // Not inside try-catch
      notAncestor: { type: 'TryStatement' },
    },
    indicates: {
      antiPattern: 'unhandled-ai-error',
    },
    recommendation: 'Wrap AI calls in try-catch with proper error handling',
    severity: 'high',
  },
  {
    id: 'inline-prompt',
    name: 'Inline Prompt String',
    astPattern: {
      type: 'Property',
      key: { name: 'content' },
      value: {
        type: 'Literal',
        value: { minLength: 100 }, // Long inline string
      },
    },
    indicates: {
      antiPattern: 'inline-prompt',
    },
    recommendation: 'Move prompts to contract files for version control',
    severity: 'medium',
  },
  {
    id: 'no-output-validation',
    name: 'Unvalidated AI Output',
    astPattern: {
      // Detect AI call result used directly without validation
    },
    indicates: {
      antiPattern: 'unvalidated-output',
    },
    recommendation: 'Add output validation using Sentinels',
    severity: 'high',
  },
];
```

## Contract Generation Logic

```typescript
// src/morpheus/generator/contract-generator.ts

export class ContractGenerator {
  generateContract(prompt: PromptAnalysis): GeneratedContract {
    const contractId = this.generateContractId(prompt);
    const contractName = this.inferContractName(prompt);

    // Extract input variables
    const inputs = this.extractInputs(prompt);

    // Infer output structure
    const outputs = this.inferOutputs(prompt);

    // Generate YAML
    const yaml = this.generateYaml({
      id: contractId,
      name: contractName,
      version: '1.0.0',
      type: this.inferContractType(prompt),
      requirements: {
        input: inputs,
        output: outputs,
      },
      goals: this.inferGoals(prompt),
      limitations: this.generateDefaultLimitations(),
      prompts: {
        system: prompt.structure.systemPromptContent,
        user: prompt.structure.userPromptTemplate,
      },
    });

    return {
      id: contractId,
      name: contractName,
      sourcePrompt: prompt,
      content: yaml,
      outputPath: `contracts/${contractId}.yaml`,
      confidence: this.calculateConfidence(prompt),
      warnings: this.generateWarnings(prompt),
    };
  }

  private extractInputs(prompt: PromptAnalysis): Record<string, InputSchema> {
    const inputs: Record<string, InputSchema> = {};

    for (const variable of prompt.variables) {
      inputs[variable.name] = {
        type: variable.type ?? 'string',
        description: `Input variable: ${variable.name}`,
        // Try to infer constraints from usage
      };
    }

    return inputs;
  }

  private inferOutputs(prompt: PromptAnalysis): Record<string, OutputSchema> {
    // Analyze prompt to infer expected output structure
    // This is heuristic-based and may need human review

    const systemPrompt = prompt.structure.systemPromptContent ?? '';

    if (systemPrompt.includes('JSON') || systemPrompt.includes('json')) {
      return this.inferJsonOutput(systemPrompt);
    }

    // Default to string output
    return {
      result: {
        type: 'string',
        description: 'AI response',
      },
    };
  }

  private inferGoals(prompt: PromptAnalysis): string[] {
    const goals: string[] = [];
    const systemPrompt = prompt.structure.systemPromptContent ?? '';

    // Extract goals from system prompt
    // Look for imperative sentences, bullet points, etc.

    // Default goals
    goals.push('Complete the task as specified');
    goals.push('Provide accurate and helpful response');

    return goals;
  }
}
```

## CLI Implementation

```typescript
// src/morpheus/cli.ts

import { Command } from 'commander';
import { Morpheus } from './morpheus.js';

const program = new Command();

program
  .name('morpheus')
  .description('Migration wizard for The Construct architecture')
  .version('1.0.0');

program
  .command('analyze <project>')
  .description('Analyze a project for AI usage')
  .option('-o, --output <path>', 'Output path for analysis')
  .option('-f, --format <format>', 'Output format', 'json')
  .action(async (project, options) => {
    const morpheus = new Morpheus();
    const analysis = await morpheus.analyze(project);

    if (options.output) {
      await morpheus.saveAnalysis(analysis, options.output, options.format);
    } else {
      morpheus.printAnalysisSummary(analysis);
    }
  });

program
  .command('plan <project>')
  .description('Generate a migration plan')
  .option('-o, --output <path>', 'Output directory for plan')
  .option('--include-artifacts', 'Include generated artifacts')
  .action(async (project, options) => {
    const morpheus = new Morpheus();
    const analysis = await morpheus.analyze(project);
    const plan = await morpheus.plan(analysis);

    if (options.output) {
      await morpheus.savePlan(plan, options.output, options.includeArtifacts);
    }

    morpheus.printPlanSummary(plan);
  });

program
  .command('guide <project>')
  .description('Interactive migration guide')
  .action(async (project) => {
    const morpheus = new Morpheus();
    await morpheus.interactiveGuide(project);
  });

program
  .command('generate <type> <project>')
  .description('Generate specific artifacts (contracts, config, scaffold)')
  .option('-o, --output <path>', 'Output directory')
  .action(async (type, project, options) => {
    const morpheus = new Morpheus();
    await morpheus.generate(type, project, options.output);
  });

program
  .command('report <project>')
  .description('Generate migration report')
  .option('-f, --format <format>', 'Report format (md, html, pdf)', 'md')
  .option('-o, --output <path>', 'Output path')
  .action(async (project, options) => {
    const morpheus = new Morpheus();
    await morpheus.generateReport(project, options.format, options.output);
  });

program
  .command('verify <project>')
  .description('Verify migration progress')
  .action(async (project) => {
    const morpheus = new Morpheus();
    const result = await morpheus.verify(project);
    morpheus.printVerificationResult(result);
  });

program.parse();
```

## Testing Strategy

```typescript
// Test categories for Morpheus

describe('Scanner', () => {
  describe('File Scanner', () => {
    it('should scan TypeScript files');
    it('should scan JavaScript files');
    it('should respect .gitignore');
    it('should handle large projects');
  });

  describe('AST Scanner', () => {
    it('should parse TypeScript AST');
    it('should parse JavaScript AST');
    it('should extract imports');
    it('should extract exports');
  });

  describe('Dependency Scanner', () => {
    it('should detect AI packages');
    it('should detect package manager');
    it('should parse tsconfig');
  });
});

describe('Analyzer', () => {
  describe('AI Usage Analyzer', () => {
    it('should detect OpenAI usage');
    it('should detect Anthropic usage');
    it('should detect LangChain usage');
    it('should find all prompts');
    it('should find all tools');
  });

  describe('Pattern Detector', () => {
    it('should detect anti-patterns');
    it('should detect good patterns');
    it('should calculate confidence');
  });
});

describe('Planner', () => {
  it('should generate valid phases');
  it('should order phases by dependencies');
  it('should estimate effort');
  it('should identify risks');
});

describe('Generator', () => {
  describe('Contract Generator', () => {
    it('should generate valid YAML');
    it('should extract variables');
    it('should infer outputs');
  });

  describe('Config Generator', () => {
    it('should generate Architect config');
    it('should generate Keymaker config');
  });
});
```

## Performance Considerations

1. **Large Projects**: Use streaming/chunked processing
2. **AST Parsing**: Cache parsed ASTs
3. **Pattern Matching**: Use compiled regex, optimize AST traversal
4. **Memory**: Process files in batches, don't load all at once

## Security Considerations

1. **Secret Detection**: Never log or store detected secrets
2. **File Access**: Respect file permissions, don't access outside project
3. **Generated Output**: Sanitize generated code
4. **Report Privacy**: Option to redact sensitive paths/names

---

*"What you know you can't explain, but you feel it."* — Morpheus
