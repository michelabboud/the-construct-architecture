/**
 * Morpheus - Migration Wizard Types
 *
 * "The Matrix is everywhere. It is all around us." — Morpheus
 *
 * Core type definitions for the Morpheus migration wizard.
 */

import { z } from 'zod';

// ============================================================================
// CREW AGENT TYPES (Nebuchadnezzar Crew)
// ============================================================================

/**
 * Team member identifiers
 */
export type CrewMember = 'tank' | 'mouse' | 'trinity' | 'switch' | 'apoc';

/**
 * Agent execution result
 */
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

/**
 * Agent error details
 */
export interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

/**
 * Base agent configuration
 */
export interface AgentConfig {
  enabled: boolean;
  contracts: string[];
  settings?: Record<string, unknown>;
}

/**
 * Crew configuration
 */
export interface CrewConfig {
  tank: AgentConfig;
  mouse: AgentConfig;
  trinity: AgentConfig;
  switch: AgentConfig;
  apoc: AgentConfig;
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  version: string;
  description: string;
  config: WorkflowConfig;
  crew?: Partial<Record<CrewMember, 'enabled' | 'disabled'>>;
  phases: WorkflowPhase[];
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  requireApproval: boolean;
  allowSkip: boolean;
  rollbackOnFailure: boolean;
  aiAssistance: 'enabled' | 'disabled' | 'optional';
  checkpoints: boolean;
}

/**
 * Workflow phase definition
 */
export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  dependsOn: string[];
  lead?: CrewMember;
  steps: WorkflowStep[];
  checklist: ChecklistItemDef[];
  verification?: VerificationDef[];
  approval?: ApprovalConfig;
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'automated' | 'semi-automated' | 'ai-assisted' | 'manual';
  agent?: CrewMember;
  action?: string;
  contract?: string;
  input?: Record<string, unknown>;
  review?: 'required' | 'optional' | 'none';
  approval?: 'per-file' | 'per-step' | 'none';
  timeout?: number;
  retries?: number;
}

/**
 * Checklist item definition in workflow
 */
export interface ChecklistItemDef {
  id: string;
  text: string;
  required?: boolean;
  verification?: {
    agent?: CrewMember;
    type: 'manual' | 'automated' | 'ai-verify';
    contract?: string;
  };
}

/**
 * Verification definition
 */
export interface VerificationDef {
  agent?: CrewMember;
  type: 'ai-verify' | 'automated' | 'manual';
  contract?: string;
}

/**
 * Approval configuration
 */
export interface ApprovalConfig {
  required: boolean;
  message?: string;
}

// ============================================================================
// WORKFLOW STATE TYPES
// ============================================================================

/**
 * Workflow execution state
 */
export interface WorkflowState {
  id: string;
  workflowId: string;
  projectPath: string;
  currentPhase: string;
  currentStep: string;
  status: WorkflowStatus;
  progress: WorkflowProgress;
  history: WorkflowEvent[];
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'rolled_back';

/**
 * Workflow progress tracking
 */
export interface WorkflowProgress {
  completedPhases: string[];
  completedSteps: string[];
  skippedSteps: string[];
  failedSteps: string[];
  failedPhases: string[];
  checklists: Record<string, ChecklistState>;
}

/**
 * Workflow event for history tracking
 */
export interface WorkflowEvent {
  id: string;
  timestamp: Date;
  type: WorkflowEventType;
  phaseId?: string;
  stepId?: string;
  agentId?: CrewMember;
  details: Record<string, unknown>;
  error?: AgentError;
}

export type WorkflowEventType =
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'workflow_paused'
  | 'workflow_resumed'
  | 'phase_started'
  | 'phase_completed'
  | 'phase_failed'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'checklist_updated'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'checkpoint_created'
  | 'rollback_started'
  | 'rollback_completed';

// ============================================================================
// CHECKLIST TYPES
// ============================================================================

/**
 * Checklist state
 */
export interface ChecklistState {
  phaseId: string;
  items: ChecklistItem[];
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
}

/**
 * Checklist item with state
 */
export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  status: ChecklistItemStatus;
  verification: ChecklistVerification;
  completedAt?: Date;
  completedBy?: 'user' | 'automated' | 'ai';
  evidence?: string;
  error?: string;
}

export type ChecklistItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

/**
 * Checklist verification configuration
 */
export interface ChecklistVerification {
  type: 'manual' | 'automated' | 'ai-verify';
  agent?: CrewMember;
  contract?: string;
  check?: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  evidence: string;
  confidence: number;
  method: 'automated' | 'ai-verified' | 'manual';
  details?: string;
  suggestions?: string[];
}

// ============================================================================
// SCANNER TYPES (Tank Agent)
// ============================================================================

/**
 * Project scan result
 */
export interface ProjectScan {
  rootPath: string;
  scannedAt: Date;
  files: ScannedFile[];
  dependencies: DependencyScan;
  configs: ConfigScan;
  statistics: ScanStatistics;
}

/**
 * Scanned file information
 */
export interface ScannedFile {
  path: string;
  relativePath: string;
  language: FileLanguage;
  size: number;
  lines: number;
  imports: ImportStatement[];
  exports: ExportStatement[];
  hasAIUsage: boolean;
  /** Optional: file content (loaded on demand) */
  content?: string;
}

export type FileLanguage = 'typescript' | 'javascript' | 'json' | 'yaml' | 'markdown' | 'other';

/**
 * Import statement
 */
export interface ImportStatement {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  line: number;
}

/**
 * Export statement
 */
export interface ExportStatement {
  name: string;
  isDefault: boolean;
  line: number;
}

/**
 * Dependency scan result
 */
export interface DependencyScan {
  packageManager: 'npm' | 'yarn' | 'pnpm';
  packageJson: Record<string, unknown>;
  lockfilePresent: boolean;
  nodeVersion?: string;
  typescript: boolean;
  tsConfig?: Record<string, unknown>;
  aiPackages: AIPackageInfo[];
  relatedPackages: PackageInfo[];
}

/**
 * AI package information
 */
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

/**
 * Package information
 */
export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
}

/**
 * Configuration scan result
 */
export interface ConfigScan {
  envFiles: string[];
  configFiles: string[];
  hasEnvExample: boolean;
  detectedSecrets: SecretDetection[];
}

/**
 * Detected secret (redacted)
 */
export interface SecretDetection {
  file: string;
  line: number;
  type: 'api_key' | 'password' | 'token' | 'credential' | 'other';
  pattern: string;
  redacted: boolean;
}

/**
 * Scan statistics
 */
export interface ScanStatistics {
  totalFiles: number;
  totalLines: number;
  languageBreakdown: Record<FileLanguage, number>;
  aiRelatedFiles: number;
  scanDuration: number;
}

// ============================================================================
// ANALYSIS TYPES (Trinity Agent)
// ============================================================================

/**
 * Full analysis result
 */
export interface FullAnalysis {
  project: ProjectScan;
  aiUsage: AIUsageAnalysis;
  architecture: ArchitectureAnalysis;
  security: SecurityAnalysis;
  quality: QualityAnalysis;
  gaps: GapAnalysis;
}

/**
 * AI usage analysis
 */
export interface AIUsageAnalysis {
  providers: ProviderUsage[];
  prompts: PromptAnalysis[];
  tools: ToolAnalysis[];
  patterns: DetectedPattern[];
  antiPatterns: DetectedAntiPattern[];
}

/**
 * Provider usage details
 */
export interface ProviderUsage {
  provider: AIProvider;
  package: string;
  version: string;
  locations: FileLocation[];
  models: string[];
  features: AIFeature[];
  callCount: number;
}

/**
 * File location reference
 */
export interface FileLocation {
  file: string;
  line: number;
  column: number;
  snippet?: string;
}

/**
 * Prompt analysis result
 */
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

/**
 * Prompt structure details
 */
export interface PromptStructure {
  hasSystemPrompt: boolean;
  hasUserPrompt: boolean;
  hasAssistantExamples: boolean;
  messageCount: number;
  systemPromptContent?: string;
  userPromptTemplate?: string;
}

/**
 * Prompt variable
 */
export interface PromptVariable {
  name: string;
  source: 'parameter' | 'context' | 'computed';
  type?: string;
}

/**
 * Tool analysis result
 */
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

/**
 * Tool parameter
 */
export interface ToolParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

/**
 * Tool handler
 */
export interface ToolHandler {
  location: FileLocation;
  async: boolean;
  hasErrorHandling: boolean;
  returnsValue: boolean;
}

/**
 * Detected pattern
 */
export interface DetectedPattern {
  id: string;
  name: string;
  category: 'good' | 'neutral' | 'warning';
  locations: FileLocation[];
  description: string;
  recommendation?: string;
}

/**
 * Detected anti-pattern
 */
export interface DetectedAntiPattern {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  locations: FileLocation[];
  description: string;
  impact: string;
  remediation: string;
}

/**
 * Architecture analysis
 */
export interface ArchitectureAnalysis {
  structure: StructureAssessment;
  patterns: string[];
  score: number;
  recommendations: string[];
}

/**
 * Structure assessment
 */
export interface StructureAssessment {
  hasServiceLayer: boolean;
  hasSeparateAIModule: boolean;
  hasConfigFiles: boolean;
  hasTypeDefinitions: boolean;
  hasCentralizedErrors: boolean;
  hasLogging: boolean;
  hasTests: boolean;
}

/**
 * Security analysis
 */
export interface SecurityAnalysis {
  score: number;
  findings: SecurityFinding[];
  hasAuthentication: boolean;
  hasAuthorization: boolean;
  hasAuditLogging: boolean;
  hasSecretManagement: boolean;
  hasInputValidation: boolean;
  hasOutputSanitization: boolean;
}

/**
 * Security finding
 */
export interface SecurityFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  location?: FileLocation;
  remediation: string;
}

/**
 * Quality analysis
 */
export interface QualityAnalysis {
  score: number;
  hasErrorHandling: boolean;
  hasValidation: boolean;
  hasTesting: boolean;
  hasDocumentation: boolean;
  findings: string[];
}

/**
 * Gap analysis
 */
export interface GapAnalysis {
  missing: GapItem[];
  partial: GapItem[];
  recommendations: GapRecommendation[];
}

/**
 * Gap item
 */
export interface GapItem {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  constructComponent: string;
}

/**
 * Gap recommendation
 */
export interface GapRecommendation {
  priority: number;
  title: string;
  description: string;
  effort: 'trivial' | 'small' | 'medium' | 'large';
  benefit: string;
}

// ============================================================================
// MIGRATION PLAN TYPES (Apoc Agent)
// ============================================================================

/**
 * Migration plan
 */
export interface MigrationPlan {
  id: string;
  projectName: string;
  generatedAt: Date;
  morpheusVersion: string;
  currentState: CurrentStateSummary;
  targetState: TargetStateSummary;
  gapAnalysis: GapAnalysis;
  risks: MigrationRisk[];
  mitigations: RiskMitigation[];
  phases: MigrationPhase[];
  artifacts: GeneratedArtifacts;
  estimates: MigrationEstimates;
}

/**
 * Current state summary
 */
export interface CurrentStateSummary {
  aiProviders: string[];
  promptCount: number;
  toolCount: number;
  architectureScore: number;
  securityScore: number;
  qualityScore: number;
  keyFindings: string[];
}

/**
 * Target state summary
 */
export interface TargetStateSummary {
  architecture: string;
  components: string[];
  benefits: string[];
}

/**
 * Migration risk
 */
export interface MigrationRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'technical' | 'operational' | 'schedule' | 'resource';
}

/**
 * Risk mitigation
 */
export interface RiskMitigation {
  riskId: string;
  strategy: string;
  actions: string[];
}

/**
 * Migration phase
 */
export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  goals: string[];
  dependsOn: string[];
  tasks: MigrationTask[];
  verification: MigrationVerification[];
  rollback: RollbackStep[];
  estimatedEffort: EffortEstimate;
}

/**
 * Migration task
 */
export interface MigrationTask {
  id: string;
  name: string;
  description: string;
  type: 'install' | 'configure' | 'refactor' | 'create' | 'test' | 'verify';
  affectedFiles: string[];
  steps: TaskStep[];
  verification: string;
  automatable: boolean;
  automationScript?: string;
}

/**
 * Task step
 */
export interface TaskStep {
  order: number;
  description: string;
  command?: string;
  codeChange?: CodeChange;
}

/**
 * Code change
 */
export interface CodeChange {
  file: string;
  type: 'create' | 'modify' | 'delete';
  description: string;
  before?: string;
  after?: string;
}

/**
 * Migration verification
 */
export interface MigrationVerification {
  name: string;
  type: 'test' | 'manual' | 'automated';
  command?: string;
  expectedResult: string;
}

/**
 * Rollback step
 */
export interface RollbackStep {
  order: number;
  description: string;
  command?: string;
}

/**
 * Migration estimates
 */
export interface MigrationEstimates {
  totalEffort: EffortEstimate;
  phaseEfforts: Record<string, EffortEstimate>;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  confidence: number;
  assumptions: string[];
}

/**
 * Effort estimate
 */
export interface EffortEstimate {
  optimistic: number;
  realistic: number;
  pessimistic: number;
  unit: 'hours' | 'days' | 'weeks';
}

// ============================================================================
// GENERATION TYPES (Mouse Agent)
// ============================================================================

/**
 * Generated artifacts
 */
export interface GeneratedArtifacts {
  contracts: GeneratedContract[];
  configs: GeneratedConfig[];
  scaffolding: GeneratedFile[];
}

/**
 * Generated contract
 */
export interface GeneratedContract {
  id: string;
  name: string;
  sourcePrompt?: PromptAnalysis;
  content: string;
  outputPath: string;
  confidence: number;
  warnings: string[];
}

/**
 * Generated config
 */
export interface GeneratedConfig {
  type: 'architect' | 'keymaker' | 'sentinels' | 'oracle' | 'smith';
  content: string;
  outputPath: string;
  description: string;
}

/**
 * Generated file
 */
export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'test' | 'documentation';
  description: string;
}

// ============================================================================
// VALIDATION TYPES (Switch Agent)
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
}

/**
 * Audit report
 */
export interface AuditReport {
  migration: string;
  timestamp: Date;
  findings: AuditFinding[];
  overallScore: number;
  recommendation: 'approve' | 'review' | 'reject';
}

/**
 * Audit finding
 */
export interface AuditFinding {
  severity: 'info' | 'low' | 'medium' | 'high';
  area: string;
  finding: string;
  remediation?: string;
}

// ============================================================================
// CHECKPOINT TYPES
// ============================================================================

/**
 * Workflow checkpoint
 */
export interface Checkpoint {
  id: string;
  workflowStateId: string;
  createdAt: Date;
  phaseId: string;
  stepId: string;
  description: string;
  fileBackups: FileBackup[];
}

/**
 * File backup
 */
export interface FileBackup {
  path: string;
  content: string;
  existed: boolean;
}

/**
 * Rollback plan
 */
export interface RollbackPlan {
  checkpointId: string;
  phaseId: string;
  steps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Workflow config schema
 */
export const WorkflowConfigSchema = z.object({
  requireApproval: z.boolean().default(true),
  allowSkip: z.boolean().default(false),
  rollbackOnFailure: z.boolean().default(true),
  aiAssistance: z.enum(['enabled', 'disabled', 'optional']).default('enabled'),
  checkpoints: z.boolean().default(true),
});

/**
 * Workflow step schema
 */
export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['automated', 'semi-automated', 'ai-assisted', 'manual']),
  agent: z.enum(['tank', 'mouse', 'trinity', 'switch', 'apoc']).optional(),
  action: z.string().optional(),
  contract: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  review: z.enum(['required', 'optional', 'none']).optional(),
  approval: z.enum(['per-file', 'per-step', 'none']).optional(),
  timeout: z.number().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
});

/**
 * Checklist item definition schema
 */
export const ChecklistItemDefSchema = z.object({
  id: z.string(),
  text: z.string(),
  required: z.boolean().optional().default(true),
  verification: z.object({
    agent: z.enum(['tank', 'mouse', 'trinity', 'switch', 'apoc']).optional(),
    type: z.enum(['manual', 'automated', 'ai-verify']),
    contract: z.string().optional(),
  }).optional(),
});

/**
 * Workflow phase schema
 */
export const WorkflowPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dependsOn: z.array(z.string()).default([]),
  lead: z.enum(['tank', 'mouse', 'trinity', 'switch', 'apoc']).optional(),
  steps: z.array(WorkflowStepSchema),
  checklist: z.array(ChecklistItemDefSchema).default([]),
  verification: z.array(z.object({
    agent: z.enum(['tank', 'mouse', 'trinity', 'switch', 'apoc']).optional(),
    type: z.enum(['ai-verify', 'automated', 'manual']),
    contract: z.string().optional(),
  })).optional(),
  approval: z.object({
    required: z.boolean(),
    message: z.string().optional(),
  }).optional(),
});

/**
 * Workflow schema
 */
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  config: WorkflowConfigSchema,
  crew: z.record(z.enum(['enabled', 'disabled'])).optional(),
  phases: z.array(WorkflowPhaseSchema),
});

export type WorkflowInput = z.input<typeof WorkflowSchema>;
export type WorkflowOutput = z.output<typeof WorkflowSchema>;
