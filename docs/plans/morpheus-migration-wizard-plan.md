# Morpheus - AI-Powered Migration Wizard

> *"I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it."* — Morpheus

## Executive Summary

Morpheus is an **AI-powered migration wizard** that uses The Construct's own architecture to analyze existing projects and guide them through adoption. Unlike simple static analyzers, Morpheus uses AI models via Keymaker to deeply understand code patterns, generate intelligent migration plans, and provide interactive guidance through flexible workflows and checklists.

**Key Differentiator**: Morpheus eats its own dog food - it's built on The Construct architecture and uses AI to help migrate other projects to The Construct.

## Core Philosophy

```
"You take the blue pill, the story ends. You wake up in your bed and believe
whatever you want to believe. You take the red pill, you stay in Wonderland,
and I show you how deep the rabbit hole goes."
```

Morpheus combines:
1. **Static Analysis**: AST parsing, pattern detection, dependency mapping
2. **AI Understanding**: Deep comprehension of prompts, intents, and architecture
3. **Flexible Workflows**: Customizable migration paths with checkpoints
4. **Interactive Checklists**: Track progress with AI-verified completion
5. **Code Generation**: AI-assisted contract and code generation

## Architecture: Morpheus on The Construct

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MORPHEUS                                       │
│                    (Built on The Construct Architecture)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        WORKFLOW ENGINE                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Workflow   │  │  Checklist  │  │   State     │  │  Progress   │  │   │
│  │  │  Executor   │  │   Manager   │  │   Machine   │  │   Tracker   │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────┘   │
│            │                │                │                │             │
│            ▼                ▼                ▼                ▼             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    AI ANALYSIS LAYER (via Keymaker)                  │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Code      │  │   Intent    │  │  Contract   │  │  Migration  │  │   │
│  │  │ Comprehend  │  │  Extractor  │  │  Generator  │  │  Advisor    │  │   │
│  │  │             │  │             │  │             │  │             │  │   │
│  │  │ "What does  │  │ "What is    │  │ "Generate   │  │ "How to     │  │   │
│  │  │  this code  │  │  this prompt│  │  a Construct│  │  migrate    │  │   │
│  │  │  do?"       │  │  trying to  │  │  contract"  │  │  this?"     │  │   │
│  │  │             │  │  achieve?"  │  │             │  │             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    STATIC ANALYSIS LAYER                             │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Scanner   │  │  AST        │  │   Pattern   │  │  Dependency │  │   │
│  │  │             │  │  Parser     │  │   Detector  │  │   Mapper    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    THE CONSTRUCT FOUNDATION                          │   │
│  │                                                                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │   │
│  │  │ Architect │ │  Oracle   │ │ Sentinels │ │ Keymaker  │ │  Agent  │ │   │
│  │  │  (Truth)  │ │(Judgment) │ │   (QA)    │ │ (Adapter) │ │  Smith  │ │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └─────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Nebuchadnezzar Crew - Morpheus's Team Agents

Like Agent Smith has his team of special agents (Brown, Jones, Johnson, Thompson, Jackson), Morpheus commands the **Nebuchadnezzar Crew** - specialized AI agents that handle different aspects of migration:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE NEBUCHADNEZZAR CREW                                  │
│                 "Morpheus's Migration Team Agents"                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            ┌─────────────┐                                  │
│                            │  MORPHEUS   │                                  │
│                            │ (Commander) │                                  │
│                            │             │                                  │
│                            │ Orchestrates│                                  │
│                            │ the mission │                                  │
│                            └──────┬──────┘                                  │
│                                   │                                         │
│         ┌───────────┬─────────────┼─────────────┬───────────┐               │
│         ▼           ▼             ▼             ▼           ▼               │
│   ┌───────────┐ ┌─────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│   │   TANK    │ │   MOUSE     │ │  TRINITY  │ │  SWITCH   │ │   APOC    │   │
│   │(Operator) │ │(Programmer) │ │ (Executor)│ │(Validator)│ │ (Planner) │   │
│   │           │ │             │ │           │ │           │ │           │   │
│   │ • Scan    │ │ • Generate  │ │ • Execute │ │ • Verify  │ │ • Plan    │   │
│   │ • Load    │ │   code      │ │   AI-     │ │ • Validate│ │ • Assess  │   │
│   │ • Map     │ │ • Create    │ │   powered │ │ • Check   │ │   risks   │   │
│   │   files   │ │   contracts │ │   tasks   │ │   quality │ │ • Estimate│   │
│   │ • Index   │ │ • Template  │ │ • Guide   │ │ • Audit   │ │ • Schedule│   │
│   │   deps    │ │   prompts   │ │   user    │ │   results │ │   phases  │   │
│   └───────────┘ └─────────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                                             │
│   "We're all gonna die."   "Look at her,     "Dodge      "Not like   "We    │
│                            Looking at him."   this."      this.."     need  │
│        - Tank               - Mouse         - Trinity    - Switch     an    │
│                                                                       exit" │
│                                                                      -Apoc  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Team Agent Responsibilities

#### Tank - The Operator
> *"I know everything. I just don't have time to explain it all."*

Tank is the **information specialist** - he scans, loads, and indexes all project data:

```typescript
interface TankAgent {
  // Project scanning
  scanProject(path: string): Promise<ProjectScan>;
  scanFiles(patterns: string[]): Promise<FileScan[]>;
  scanDependencies(): Promise<DependencyScan>;

  // Information loading
  loadAST(file: string): Promise<AST>;
  loadConfig(file: string): Promise<Config>;
  loadPackageInfo(): Promise<PackageInfo>;

  // Indexing
  indexAIUsage(scan: ProjectScan): Promise<AIUsageIndex>;
  indexPrompts(scan: ProjectScan): Promise<PromptIndex>;
  indexTools(scan: ProjectScan): Promise<ToolIndex>;
}
```

**Tank's Contracts:**
- `morpheus/tank/scan-project.yaml` - Full project scan
- `morpheus/tank/index-ai-usage.yaml` - AI usage indexing
- `morpheus/tank/map-dependencies.yaml` - Dependency mapping

#### Mouse - The Programmer
> *"To deny our own impulses is to deny the very thing that makes us human."*

Mouse is the **code generator** - he creates contracts, code, and configurations:

```typescript
interface MouseAgent {
  // Contract generation
  generateContract(prompt: PromptAnalysis): Promise<GeneratedContract>;
  generateContracts(prompts: PromptAnalysis[]): Promise<GeneratedContract[]>;

  // Code generation
  generateMigrationCode(task: MigrationTask): Promise<GeneratedCode>;
  generateKeymakerAdapter(provider: ProviderAnalysis): Promise<GeneratedCode>;
  generateSentinelValidator(schema: SchemaAnalysis): Promise<GeneratedCode>;

  // Configuration generation
  generateArchitectConfig(analysis: FullAnalysis): Promise<GeneratedConfig>;
  generateKeymakerConfig(providers: ProviderAnalysis[]): Promise<GeneratedConfig>;
  generateProjectTruth(analysis: FullAnalysis): Promise<GeneratedConfig>;

  // Template expansion
  expandTemplate(template: string, vars: Record<string, unknown>): string;
}
```

**Mouse's Contracts:**
- `morpheus/mouse/generate-contract.yaml` - Single contract generation
- `morpheus/mouse/generate-migration.yaml` - Migration code generation
- `morpheus/mouse/generate-config.yaml` - Configuration generation
- `morpheus/mouse/generate-types.yaml` - TypeScript type generation

#### Trinity - The Executor
> *"The answer is out there, Neo. It's looking for you, and it will find you if you want it to."*

Trinity is the **primary AI executor** - she handles all AI-powered migration tasks:

```typescript
interface TrinityAgent {
  // AI-powered analysis
  comprehendCode(code: string, context: string): Promise<CodeComprehension>;
  extractIntent(prompt: string): Promise<PromptIntent>;
  analyzeArchitecture(scan: ProjectScan): Promise<ArchitectureAnalysis>;

  // AI-powered migration
  migratePrompt(prompt: PromptAnalysis): Promise<MigrationResult>;
  migrateToolCall(tool: ToolAnalysis): Promise<MigrationResult>;
  migrateProvider(provider: ProviderAnalysis): Promise<MigrationResult>;

  // AI-powered guidance
  advise(question: string, context: MigrationContext): Promise<Advice>;
  suggest(situation: Situation): Promise<Suggestion[]>;
  explain(concept: string): Promise<Explanation>;
}
```

**Trinity's Contracts:**
- `morpheus/trinity/comprehend-code.yaml` - Deep code understanding
- `morpheus/trinity/extract-intent.yaml` - Prompt intent extraction
- `morpheus/trinity/analyze-architecture.yaml` - Architecture analysis
- `morpheus/trinity/migration-advisor.yaml` - Interactive advisor

#### Switch - The Validator
> *"Everything the body does, the brain does better."*

Switch is the **quality gatekeeper** - she validates and verifies all migration results:

```typescript
interface SwitchAgent {
  // Validation
  validateContract(contract: GeneratedContract): Promise<ValidationResult>;
  validateMigration(migration: MigrationResult): Promise<ValidationResult>;
  validateConfig(config: GeneratedConfig): Promise<ValidationResult>;

  // Verification
  verifyChecklist(item: ChecklistItem, context: ProjectContext): Promise<VerificationResult>;
  verifyPhaseComplete(phase: WorkflowPhase): Promise<VerificationResult>;
  verifyMigrationComplete(plan: MigrationPlan): Promise<VerificationResult>;

  // Quality checks
  checkCodeQuality(code: string): Promise<QualityReport>;
  checkContractQuality(contract: Contract): Promise<QualityReport>;
  auditMigration(migration: MigrationResult): Promise<AuditReport>;
}
```

**Switch's Contracts:**
- `morpheus/switch/validate-contract.yaml` - Contract validation
- `morpheus/switch/verify-checklist.yaml` - AI-powered checklist verification
- `morpheus/switch/audit-migration.yaml` - Migration audit
- `morpheus/switch/quality-report.yaml` - Quality assessment

#### Apoc - The Planner
> *"We need an exit."*

Apoc is the **strategic planner** - he creates migration plans and assesses risks:

```typescript
interface ApocAgent {
  // Planning
  createMigrationPlan(analysis: FullAnalysis): Promise<MigrationPlan>;
  planPhase(analysis: FullAnalysis, phaseType: PhaseType): Promise<MigrationPhase>;
  planTasks(phase: MigrationPhase): Promise<MigrationTask[]>;

  // Risk assessment
  assessRisks(plan: MigrationPlan): Promise<Risk[]>;
  suggestMitigations(risks: Risk[]): Promise<Mitigation[]>;
  evaluateImpact(change: ProposedChange): Promise<ImpactAssessment>;

  // Estimation
  estimateEffort(plan: MigrationPlan): Promise<EffortEstimate>;
  estimateTimeline(plan: MigrationPlan): Promise<Timeline>;
  prioritizeTasks(tasks: MigrationTask[]): Promise<MigrationTask[]>;

  // Rollback planning
  planRollback(phase: MigrationPhase): Promise<RollbackPlan>;
  createCheckpoint(state: WorkflowState): Promise<Checkpoint>;
}
```

**Apoc's Contracts:**
- `morpheus/apoc/create-plan.yaml` - Migration plan creation
- `morpheus/apoc/assess-risks.yaml` - Risk assessment
- `morpheus/apoc/estimate-effort.yaml` - Effort estimation
- `morpheus/apoc/plan-rollback.yaml` - Rollback planning

### Team Coordination

Morpheus coordinates the team through the **Workflow Engine**:

```typescript
// Morpheus delegates to team members
class MorpheusCommander {
  private tank: TankAgent;      // Scanning & loading
  private mouse: MouseAgent;    // Generation
  private trinity: TrinityAgent; // AI execution
  private switch_: SwitchAgent; // Validation (switch is reserved)
  private apoc: ApocAgent;      // Planning

  async executeWorkflow(projectPath: string, workflow: Workflow): Promise<WorkflowResult> {
    // Phase 1: Tank scans the project
    const scan = await this.tank.scanProject(projectPath);
    const aiIndex = await this.tank.indexAIUsage(scan);

    // Phase 2: Trinity analyzes with AI
    const analysis = await this.trinity.analyzeArchitecture(scan);
    const intents = await this.trinity.extractIntents(aiIndex.prompts);

    // Phase 3: Apoc creates the plan
    const plan = await this.apoc.createMigrationPlan({ scan, analysis, intents });
    const risks = await this.apoc.assessRisks(plan);

    // Phase 4: Execute with Trinity + Mouse
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        if (task.type === 'generate') {
          const result = await this.mouse.generateMigrationCode(task);
          await this.switch_.validateMigration(result);
        } else if (task.type === 'ai-migrate') {
          const result = await this.trinity.migratePrompt(task);
          await this.switch_.validateMigration(result);
        }
      }

      // Switch verifies phase completion
      await this.switch_.verifyPhaseComplete(phase);
    }

    return this.generateResult();
  }
}
```

### Team Agent Configuration

```yaml
# morpheus.config.yaml
team:
  tank:
    enabled: true
    contracts:
      - morpheus/tank/scan-project
      - morpheus/tank/index-ai-usage
      - morpheus/tank/map-dependencies
    settings:
      maxFileSizeKB: 1000
      excludePatterns:
        - node_modules/**
        - dist/**
        - .git/**

  mouse:
    enabled: true
    contracts:
      - morpheus/mouse/generate-contract
      - morpheus/mouse/generate-migration
      - morpheus/mouse/generate-config
    settings:
      templateStyle: typescript
      includeTypes: true
      includeTests: true

  trinity:
    enabled: true
    contracts:
      - morpheus/trinity/comprehend-code
      - morpheus/trinity/extract-intent
      - morpheus/trinity/analyze-architecture
      - morpheus/trinity/migration-advisor
    settings:
      model: gpt-4  # Uses best model for understanding
      maxContextTokens: 8000
      temperature: 0.3  # More deterministic

  switch:
    enabled: true
    contracts:
      - morpheus/switch/validate-contract
      - morpheus/switch/verify-checklist
      - morpheus/switch/audit-migration
    settings:
      strictValidation: true
      requireEvidence: true

  apoc:
    enabled: true
    contracts:
      - morpheus/apoc/create-plan
      - morpheus/apoc/assess-risks
      - morpheus/apoc/estimate-effort
    settings:
      riskThreshold: medium
      includeRollback: true
```

## The Workflow System

### Workflow Definition

Morpheus uses **YAML-defined workflows** that are flexible and customizable:

```yaml
# workflows/standard-migration.yaml
id: standard-migration
name: Standard Migration to The Construct
version: 1.0.0
description: Full migration workflow with all components

# Workflow-level configuration
config:
  requireApproval: true        # Require user approval between phases
  allowSkip: false             # Allow skipping optional steps
  rollbackOnFailure: true      # Auto-rollback on phase failure
  aiAssistance: enabled        # Use AI for guidance and generation

# Team agent configuration (Nebuchadnezzar Crew)
crew:
  tank: enabled      # Scanning & loading
  mouse: enabled     # Code generation
  trinity: enabled   # AI execution
  switch: enabled    # Validation
  apoc: enabled      # Planning

# Workflow phases
phases:
  - id: discovery
    name: Project Discovery
    description: Analyze the target project
    lead: tank       # Tank leads discovery phase
    steps:
      - id: scan-project
        name: Scan Project Structure
        agent: tank                           # Tank scans
        contract: morpheus/tank/scan-project

      - id: index-ai-usage
        name: Index AI Usage Patterns
        agent: tank                           # Tank indexes
        contract: morpheus/tank/index-ai-usage

      - id: understand-architecture
        name: Understand Current Architecture
        agent: trinity                        # Trinity analyzes with AI
        contract: morpheus/trinity/analyze-architecture

    checklist:
      - id: files-scanned
        text: "Project files scanned"
        verification: { agent: switch, type: automated }
      - id: providers-identified
        text: "AI providers identified"
        verification: { agent: switch, type: automated }
      - id: prompts-catalogued
        text: "Prompts catalogued"
        verification: { agent: switch, type: ai-verify }
      - id: architecture-documented
        text: "Architecture patterns documented"
        verification: { agent: switch, type: ai-verify }

    verification:
      agent: switch
      contract: morpheus/switch/verify-checklist

  - id: planning
    name: Migration Planning
    description: Generate migration plan
    dependsOn: [discovery]
    lead: apoc       # Apoc leads planning phase
    steps:
      - id: gap-analysis
        name: Perform Gap Analysis
        agent: trinity                        # Trinity understands gaps
        contract: morpheus/trinity/comprehend-code
        input: { mode: gap-analysis }

      - id: generate-plan
        name: Generate Migration Plan
        agent: apoc                           # Apoc creates the plan
        contract: morpheus/apoc/create-plan

      - id: assess-risks
        name: Assess Risks
        agent: apoc                           # Apoc assesses risks
        contract: morpheus/apoc/assess-risks

      - id: estimate-effort
        name: Estimate Migration Effort
        agent: apoc                           # Apoc estimates
        contract: morpheus/apoc/estimate-effort

    checklist:
      - id: gaps-identified
        text: "Gaps between current and target identified"
        verification: { agent: switch, type: ai-verify }
      - id: phases-defined
        text: "Migration phases defined"
        verification: { agent: switch, type: automated }
      - id: estimates-provided
        text: "Effort estimates provided"
        verification: { agent: switch, type: automated }
      - id: risks-assessed
        text: "Risks assessed"
        verification: { agent: switch, type: ai-verify }

    approval:
      required: true
      message: "Review the migration plan before proceeding"

  - id: foundation
    name: Foundation Setup
    description: Install and configure The Construct
    dependsOn: [planning]
    lead: mouse      # Mouse leads foundation setup (generation)
    steps:
      - id: install-construct
        name: Install The Construct
        type: automated
        action: npm install @the-construct/core

      - id: setup-architect
        name: Configure Architect
        agent: mouse                          # Mouse generates config
        contract: morpheus/mouse/generate-config
        input: { type: architect }

      - id: setup-project-truth
        name: Create Project Truth File
        agent: mouse                          # Mouse generates truth file
        contract: morpheus/mouse/generate-config
        input: { type: project-truth }

      - id: generate-types
        name: Generate TypeScript Types
        agent: mouse                          # Mouse generates types
        contract: morpheus/mouse/generate-types

    checklist:
      - id: package-installed
        text: "The Construct package installed"
        verification: { agent: switch, type: automated }
      - id: architect-created
        text: "architect.yaml created"
        verification: { agent: switch, contract: morpheus/switch/validate-contract }
      - id: truth-created
        text: "project-truth.yaml created"
        verification: { agent: switch, contract: morpheus/switch/validate-contract }
      - id: types-available
        text: "TypeScript types available"
        verification: { agent: switch, type: automated }

  - id: keymaker-migration
    name: Keymaker Integration
    description: Replace direct AI calls with Keymaker
    dependsOn: [foundation]
    lead: trinity    # Trinity leads AI-powered migration
    steps:
      - id: identify-calls
        name: Identify AI Calls to Migrate
        agent: trinity                        # Trinity identifies with AI
        contract: morpheus/trinity/comprehend-code
        input: { mode: identify-ai-calls }

      - id: generate-migrations
        name: Generate Migration Code
        agent: mouse                          # Mouse generates code
        contract: morpheus/mouse/generate-migration
        review: required

      - id: validate-migrations
        name: Validate Generated Code
        agent: switch                         # Switch validates
        contract: morpheus/switch/validate-contract

      - id: apply-migrations
        name: Apply Migrations
        agent: trinity                        # Trinity applies with AI guidance
        type: semi-automated
        approval: per-file

    checklist:
      - id: calls-identified
        text: "All direct AI calls identified"
        verification: { agent: switch, type: ai-verify }
      - id: code-generated
        text: "Migration code generated"
        verification: { agent: switch, type: automated }
      - id: migrations-reviewed
        text: "Migrations reviewed"
        verification: { agent: switch, type: manual }
      - id: tests-passing
        text: "Tests passing after migration"
        verification: { agent: switch, type: automated }

  - id: contract-migration
    name: Contract Migration
    description: Convert prompts to YAML contracts
    dependsOn: [keymaker-migration]
    lead: mouse      # Mouse leads contract generation
    steps:
      - id: extract-prompts
        name: Extract Existing Prompts
        agent: trinity                        # Trinity extracts with AI
        contract: morpheus/trinity/extract-intent

      - id: generate-contracts
        name: Generate YAML Contracts
        agent: mouse                          # Mouse generates contracts
        contract: morpheus/mouse/generate-contract
        review: required

      - id: validate-contracts
        name: Validate Contracts
        agent: switch                         # Switch validates
        contract: morpheus/switch/validate-contract

      - id: implement-executor
        name: Implement Contract Executor
        agent: mouse                          # Mouse generates executor code
        contract: morpheus/mouse/generate-migration
        input: { type: contract-executor }

    checklist:
      - id: prompts-extracted
        text: "All prompts extracted"
        verification: { agent: switch, type: ai-verify }
      - id: contracts-generated
        text: "YAML contracts generated"
        verification: { agent: switch, contract: morpheus/switch/validate-contract }
      - id: contracts-validated
        text: "Contracts validated by Sentinels"
        verification: { agent: switch, type: automated }
      - id: executor-working
        text: "Contract executor working"
        verification: { agent: switch, type: automated }

  # Additional phases follow same pattern:
  # - sentinel-integration: Switch validates, Mouse generates, Trinity guides
  # - oracle-integration: Apoc plans, Mouse generates, Trinity configures
  # - security-hardening: Apoc assesses, Mouse generates, Switch audits
  # - chaos-testing (optional): Apoc plans scenarios, Trinity executes
```

### Checklist System

Checklists are **first-class citizens** in Morpheus:

```typescript
interface Checklist {
  id: string;
  phaseId: string;
  items: ChecklistItem[];
  status: 'pending' | 'in_progress' | 'completed';
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;

  // Verification method
  verification:
    | { type: 'manual' }                    // User marks complete
    | { type: 'automated', check: string }  // Code verification
    | { type: 'ai-verify', contract: string }; // AI verification

  // Current state
  status: 'pending' | 'completed' | 'skipped' | 'failed';
  completedAt?: Date;
  completedBy?: 'user' | 'automated' | 'ai';
  evidence?: string;  // Proof of completion
}
```

**AI-Verified Checklists:**

```typescript
// Morpheus can verify checklist items using AI
const verifyChecklist = async (item: ChecklistItem) => {
  if (item.verification.type === 'ai-verify') {
    const result = await morpheus.execute({
      contractId: item.verification.contract,
      input: {
        checklistItem: item.text,
        projectContext: currentState,
      }
    });

    return {
      completed: result.output.isComplete,
      evidence: result.output.evidence,
      suggestions: result.output.suggestions,
    };
  }
};
```

## AI Contracts for Migration

Morpheus uses The Construct's own contract system for its AI operations:

### Discovery Contracts

```yaml
# contracts/morpheus/detect-ai-patterns.yaml
id: morpheus/detect-ai-patterns
name: Detect AI Usage Patterns
version: 1.0.0
type: analysis

requirements:
  input:
    fileContents:
      type: array
      items:
        type: object
        properties:
          path: { type: string }
          content: { type: string }
          ast: { type: object, optional: true }

  output:
    patterns:
      type: array
      items:
        type: object
        properties:
          type:
            type: string
            enum: [openai-chat, openai-functions, anthropic-chat,
                   anthropic-tools, langchain, custom]
          location:
            type: object
            properties:
              file: { type: string }
              line: { type: number }
              column: { type: number }
          code: { type: string }
          analysis:
            type: object
            properties:
              provider: { type: string }
              model: { type: string, optional: true }
              features: { type: array, items: { type: string } }
              hasSystemPrompt: { type: boolean }
              hasTools: { type: boolean }
              complexity: { type: string, enum: [simple, moderate, complex] }

prompts:
  system: |
    You are an expert code analyst specializing in AI/LLM integrations.
    Your task is to identify all AI usage patterns in the provided code.

    You understand:
    - OpenAI SDK patterns (chat completions, function calling, assistants)
    - Anthropic SDK patterns (messages API, tool use)
    - Google AI patterns (Gemini, PaLM)
    - LangChain patterns (chains, agents, tools)
    - Direct API calls via fetch/axios
    - Custom wrapper patterns

    For each pattern found, provide:
    1. The exact location (file, line, column)
    2. The type of pattern
    3. Analysis of what it does
    4. Any issues or anti-patterns detected

  user: |
    Analyze the following code files for AI usage patterns:

    {{#each fileContents}}
    === FILE: {{this.path}} ===
    {{this.content}}

    {{/each}}

    Identify all AI/LLM usage patterns and provide structured analysis.
```

### Contract Generation Contract

```yaml
# contracts/morpheus/generate-contracts.yaml
id: morpheus/generate-contracts
name: Generate Construct Contracts
version: 1.0.0
type: generation

requirements:
  input:
    prompts:
      type: array
      items:
        type: object
        properties:
          location: { type: string }
          systemPrompt: { type: string, optional: true }
          userPromptTemplate: { type: string }
          variables: { type: array, items: { type: string } }
          context: { type: string }

    projectContext:
      type: object
      properties:
        name: { type: string }
        domain: { type: string }
        existingContracts: { type: array }

  output:
    contracts:
      type: array
      items:
        type: object
        properties:
          id: { type: string }
          yaml: { type: string }
          sourceLocation: { type: string }
          notes: { type: string }

prompts:
  system: |
    You are an expert in The Construct architecture, specifically in creating
    YAML contracts for AI operations.

    The Construct contract schema includes:
    - id: Unique identifier (kebab-case)
    - name: Human-readable name
    - version: Semantic version
    - type: completion | chat | tool-use | embedding
    - requirements:
        - input: Zod-compatible schema for inputs
        - output: Zod-compatible schema for outputs
    - goals: What this contract aims to achieve
    - limitations: Constraints and forbidden actions
    - prompts:
        - system: System prompt
        - user: User prompt template with {{variables}}

    When generating contracts:
    1. Create meaningful IDs based on functionality
    2. Infer input/output schemas from the prompt
    3. Add appropriate goals and limitations
    4. Preserve the original prompt intent
    5. Add validation rules where appropriate

  user: |
    Generate Construct contracts for the following prompts found in project "{{projectContext.name}}":

    {{#each prompts}}
    === PROMPT {{@index}} ===
    Location: {{this.location}}
    System Prompt: {{this.systemPrompt}}
    User Template: {{this.userPromptTemplate}}
    Variables: {{this.variables}}
    Context: {{this.context}}

    {{/each}}

    Generate well-structured YAML contracts that preserve the original functionality
    while adding proper validation and structure.
```

### Migration Advisor Contract

```yaml
# contracts/morpheus/migration-advisor.yaml
id: morpheus/migration-advisor
name: Migration Advisor
version: 1.0.0
type: chat

requirements:
  input:
    question:
      type: string
      description: User's migration question
    context:
      type: object
      properties:
        currentPhase: { type: string }
        projectAnalysis: { type: object }
        migrationPlan: { type: object }
        completedSteps: { type: array }

  output:
    answer: { type: string }
    suggestions:
      type: array
      items: { type: string }
    relevantDocs:
      type: array
      items:
        type: object
        properties:
          title: { type: string }
          url: { type: string }

prompts:
  system: |
    You are Morpheus, an expert guide for migrating projects to The Construct architecture.

    You have deep knowledge of:
    - The Construct architecture (Architect, Oracle, Sentinels, Keymaker, Agent Smith)
    - Migration best practices
    - Common pitfalls and how to avoid them
    - TypeScript patterns for AI orchestration

    Current migration context:
    Phase: {{context.currentPhase}}
    Completed Steps: {{context.completedSteps}}

    Provide helpful, actionable guidance. Reference specific files or code
    when helpful. Suggest next steps when appropriate.

  user: |
    {{question}}
```

## Workflow Engine Implementation

### Core Workflow Types

```typescript
// src/morpheus/workflow/types.ts

export interface Workflow {
  id: string;
  name: string;
  version: string;
  description: string;
  config: WorkflowConfig;
  phases: WorkflowPhase[];
}

export interface WorkflowConfig {
  requireApproval: boolean;
  allowSkip: boolean;
  rollbackOnFailure: boolean;
  aiAssistance: 'enabled' | 'disabled' | 'optional';
  checkpoints: boolean;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  dependsOn: string[];
  aiAssisted: boolean;
  steps: WorkflowStep[];
  checklist: ChecklistItem[];
  verification: VerificationStep[];
  approval?: ApprovalConfig;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'automated' | 'semi-automated' | 'ai-assisted' | 'manual';
  action?: string;           // For automated steps
  contract?: string;         // For AI-assisted steps
  review?: 'required' | 'optional' | 'none';
  approval?: 'per-file' | 'per-step' | 'none';
  timeout?: number;
  retries?: number;
}

export interface WorkflowState {
  workflowId: string;
  projectPath: string;
  currentPhase: string;
  currentStep: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'waiting_approval';
  progress: {
    completedPhases: string[];
    completedSteps: string[];
    checklists: Map<string, ChecklistState>;
  };
  history: WorkflowEvent[];
  startedAt: Date;
  updatedAt: Date;
}
```

### Workflow Executor

```typescript
// src/morpheus/workflow/executor.ts

export class WorkflowExecutor {
  private construct: TheConstruct;
  private state: WorkflowState;
  private workflow: Workflow;

  constructor(
    private projectPath: string,
    private workflowId: string,
    private options: ExecutorOptions
  ) {
    // Initialize The Construct for Morpheus's own AI operations
    this.construct = createConstruct({
      architectConfig: 'morpheus/architect.yaml',
      contractsPath: 'morpheus/contracts/',
    });
  }

  async execute(): Promise<WorkflowResult> {
    this.workflow = await this.loadWorkflow(this.workflowId);
    this.state = await this.loadOrCreateState();

    for (const phase of this.workflow.phases) {
      if (this.isPhaseComplete(phase.id)) continue;
      if (!this.areDependenciesMet(phase)) {
        throw new Error(`Dependencies not met for phase: ${phase.id}`);
      }

      await this.executePhase(phase);

      // Check for approval requirement
      if (phase.approval?.required) {
        await this.waitForApproval(phase);
      }
    }

    return this.generateResult();
  }

  private async executePhase(phase: WorkflowPhase): Promise<void> {
    this.emit('phase:start', phase);
    this.state.currentPhase = phase.id;

    for (const step of phase.steps) {
      await this.executeStep(step, phase);
    }

    // Verify phase completion
    await this.verifyPhase(phase);

    // Update checklist
    await this.updateChecklist(phase);

    this.state.progress.completedPhases.push(phase.id);
    this.emit('phase:complete', phase);
  }

  private async executeStep(step: WorkflowStep, phase: WorkflowPhase): Promise<void> {
    this.emit('step:start', step);
    this.state.currentStep = step.id;

    let result: StepResult;

    switch (step.type) {
      case 'automated':
        result = await this.executeAutomatedStep(step);
        break;

      case 'ai-assisted':
        result = await this.executeAIAssistedStep(step);
        break;

      case 'semi-automated':
        result = await this.executeSemiAutomatedStep(step);
        break;

      case 'manual':
        result = await this.executeManualStep(step);
        break;
    }

    // Handle review requirement
    if (step.review === 'required') {
      await this.requestReview(step, result);
    }

    this.state.progress.completedSteps.push(step.id);
    this.emit('step:complete', step, result);
  }

  private async executeAIAssistedStep(step: WorkflowStep): Promise<StepResult> {
    // Use The Construct to execute the AI contract
    const contract = await this.construct.loadContract(step.contract!);

    // Prepare input with current context
    const input = await this.prepareStepInput(step);

    // Execute via Keymaker with full Construct pipeline
    const result = await this.construct.execute({
      contractId: step.contract!,
      input,
      options: {
        validateOutput: true,  // Sentinels validate
        trackXP: true,         // Oracle tracks
        audit: true,           // Agent Smith audits
      }
    });

    return {
      stepId: step.id,
      success: result.success,
      output: result.output,
      artifacts: result.artifacts,
    };
  }

  // ... more methods
}
```

### Interactive CLI Guide

```typescript
// src/morpheus/cli/guide.ts

export class MorpheusGuide {
  private executor: WorkflowExecutor;
  private advisor: MigrationAdvisor;

  async startInteractiveGuide(projectPath: string): Promise<void> {
    console.log(chalk.cyan(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   "Welcome to the real world."                            ║
    ║                                                           ║
    ║                    - Morpheus                             ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `));

    // Initial project analysis
    const analysis = await this.analyzeProject(projectPath);
    this.displayAnalysisSummary(analysis);

    // Ask user to choose workflow
    const workflow = await this.selectWorkflow();

    // Start the workflow
    this.executor = new WorkflowExecutor(projectPath, workflow.id, {
      interactive: true,
      onProgress: this.handleProgress.bind(this),
      onApprovalNeeded: this.handleApprovalNeeded.bind(this),
      onQuestion: this.handleQuestion.bind(this),
    });

    // Main interaction loop
    while (!this.executor.isComplete()) {
      const state = this.executor.getState();

      this.displayCurrentState(state);

      const action = await this.promptForAction(state);

      switch (action) {
        case 'continue':
          await this.executor.continue();
          break;

        case 'skip':
          await this.executor.skipCurrentStep();
          break;

        case 'ask':
          await this.askAdvisor();
          break;

        case 'checklist':
          await this.displayChecklist(state.currentPhase);
          break;

        case 'rollback':
          await this.executor.rollback();
          break;

        case 'pause':
          await this.executor.pause();
          return;
      }
    }

    this.displayCompletion();
  }

  private async askAdvisor(): Promise<void> {
    const question = await inquirer.prompt({
      type: 'input',
      name: 'question',
      message: 'Ask Morpheus:',
    });

    const answer = await this.advisor.ask(question.question);

    console.log(chalk.green('\nMorpheus:'));
    console.log(answer.response);

    if (answer.suggestions.length > 0) {
      console.log(chalk.yellow('\nSuggestions:'));
      answer.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
    }
  }

  private displayChecklist(phaseId: string): void {
    const checklist = this.executor.getChecklist(phaseId);

    console.log(chalk.cyan(`\n═══ Checklist: ${checklist.phaseName} ═══\n`));

    checklist.items.forEach(item => {
      const icon = item.status === 'completed' ? '✓' :
                   item.status === 'failed' ? '✗' : '○';
      const color = item.status === 'completed' ? chalk.green :
                    item.status === 'failed' ? chalk.red : chalk.white;

      console.log(color(`  ${icon} ${item.text}`));

      if (item.evidence) {
        console.log(chalk.gray(`      Evidence: ${item.evidence}`));
      }
    });

    const completed = checklist.items.filter(i => i.status === 'completed').length;
    console.log(chalk.cyan(`\n  Progress: ${completed}/${checklist.items.length}\n`));
  }
}
```

## File Structure

```
src/morpheus/
├── index.ts                    # Main exports
├── morpheus.ts                 # Morpheus Commander class
│
├── crew/                       # The Nebuchadnezzar Crew (Team Agents)
│   ├── index.ts               # Crew exports
│   ├── types.ts               # Shared crew types
│   │
│   ├── tank/                  # Tank - The Operator (Scanner)
│   │   ├── tank.ts            # Tank agent implementation
│   │   ├── scanner.ts         # File system scanner
│   │   ├── ast-parser.ts      # TypeScript AST parser
│   │   ├── dependency-mapper.ts
│   │   └── indexer.ts         # AI usage indexer
│   │
│   ├── mouse/                 # Mouse - The Programmer (Generator)
│   │   ├── mouse.ts           # Mouse agent implementation
│   │   ├── contract-generator.ts
│   │   ├── code-generator.ts
│   │   ├── config-generator.ts
│   │   ├── type-generator.ts
│   │   └── templates/         # Generation templates
│   │
│   ├── trinity/               # Trinity - The Executor (AI Operations)
│   │   ├── trinity.ts         # Trinity agent implementation
│   │   ├── comprehend.ts      # Code comprehension
│   │   ├── intent-extractor.ts
│   │   ├── migrator.ts        # AI-powered migration
│   │   └── advisor.ts         # Migration advisor
│   │
│   ├── switch/                # Switch - The Validator
│   │   ├── switch.ts          # Switch agent implementation
│   │   ├── validator.ts       # Contract/code validation
│   │   ├── verifier.ts        # Checklist verification
│   │   └── auditor.ts         # Migration auditing
│   │
│   └── apoc/                  # Apoc - The Planner
│       ├── apoc.ts            # Apoc agent implementation
│       ├── planner.ts         # Migration planner
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
├── reporter/                   # Reporting
│   ├── reporter.ts            # Report generator
│   ├── formats/               # Output formats (MD, HTML, JSON)
│   └── templates/             # Report templates
│
├── cli/                        # Command Line Interface
│   ├── index.ts               # CLI entry point
│   ├── commands/              # CLI commands
│   │   ├── analyze.ts         # Tank-powered analysis
│   │   ├── plan.ts            # Apoc-powered planning
│   │   ├── guide.ts           # Trinity-powered guidance
│   │   ├── migrate.ts         # Mouse+Trinity migration
│   │   ├── verify.ts          # Switch-powered verification
│   │   └── ask.ts             # Trinity advisor
│   └── guide.ts               # Interactive guide
│
├── contracts/                  # Morpheus's own contracts
│   │
│   ├── tank/                  # Tank's contracts
│   │   ├── scan-project.yaml
│   │   ├── index-ai-usage.yaml
│   │   └── map-dependencies.yaml
│   │
│   ├── mouse/                 # Mouse's contracts
│   │   ├── generate-contract.yaml
│   │   ├── generate-migration.yaml
│   │   ├── generate-config.yaml
│   │   └── generate-types.yaml
│   │
│   ├── trinity/               # Trinity's contracts
│   │   ├── comprehend-code.yaml
│   │   ├── extract-intent.yaml
│   │   ├── analyze-architecture.yaml
│   │   └── migration-advisor.yaml
│   │
│   ├── switch/                # Switch's contracts
│   │   ├── validate-contract.yaml
│   │   ├── verify-checklist.yaml
│   │   ├── audit-migration.yaml
│   │   └── quality-report.yaml
│   │
│   └── apoc/                  # Apoc's contracts
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
└── knowledge/                  # Construct knowledge base
    ├── architecture.md        # The Construct architecture docs
    ├── patterns.md            # Common patterns
    ├── anti-patterns.md       # Anti-patterns to detect
    └── best-practices.md      # Migration best practices
```

## TypeScript Support

Morpheus provides first-class TypeScript support:

### Type Detection

```typescript
// Morpheus understands TypeScript patterns
interface TypeScriptAnalysis {
  // Project configuration
  tsConfig: {
    strict: boolean;
    target: string;
    module: string;
    paths: Record<string, string[]>;
  };

  // Type definitions found
  typeDefinitions: {
    aiRelated: TypeDefinition[];    // Types for AI responses
    promptRelated: TypeDefinition[];// Types for prompt inputs
    toolRelated: TypeDefinition[];  // Types for tool parameters
  };

  // Zod schemas detected
  zodSchemas: {
    location: string;
    schemaName: string;
    inferredType: string;
  }[];
}
```

### Generated Types

```typescript
// Morpheus generates proper TypeScript types for contracts
// From: contracts/summarize-text.yaml
// Generated: src/contracts/summarize-text.types.ts

import { z } from 'zod';

export const SummarizeTextInputSchema = z.object({
  text: z.string().min(10).max(50000),
});

export const SummarizeTextOutputSchema = z.object({
  summary: z.string().max(1000),
});

export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

// Contract executor with full typing
export interface SummarizeTextContract {
  execute(input: SummarizeTextInput): Promise<SummarizeTextOutput>;
}
```

## CLI Commands

```bash
# Analyze a project (static + AI)
npx morpheus analyze ./my-project
npx morpheus analyze ./my-project --deep  # More thorough AI analysis

# Generate migration plan
npx morpheus plan ./my-project
npx morpheus plan ./my-project --workflow security-focused

# Interactive migration guide
npx morpheus guide ./my-project

# Execute specific workflow phase
npx morpheus migrate ./my-project --phase keymaker

# Ask the advisor a question
npx morpheus ask "How do I migrate my OpenAI tool calls?"

# View/manage checklists
npx morpheus checklist ./my-project
npx morpheus checklist ./my-project --mark-complete "install-construct"

# Verify migration progress
npx morpheus verify ./my-project

# Generate reports
npx morpheus report ./my-project --format html

# Resume interrupted migration
npx morpheus resume ./my-project
```

## Implementation Phases

### Phase 8a: Foundation & Workflow Engine
- [ ] Core types and interfaces
- [ ] Workflow YAML schema and loader
- [ ] Workflow executor base (Morpheus Commander)
- [ ] Checklist manager
- [ ] State persistence (SQLite)
- [ ] Team agent base interface

### Phase 8b: Tank Agent (The Operator)
- [ ] Tank agent core implementation
- [ ] File system scanner
- [ ] TypeScript AST parser
- [ ] Dependency mapper
- [ ] AI usage indexer
- [ ] Tank contracts:
  - [ ] `morpheus/tank/scan-project.yaml`
  - [ ] `morpheus/tank/index-ai-usage.yaml`
  - [ ] `morpheus/tank/map-dependencies.yaml`

### Phase 8c: Mouse Agent (The Programmer)
- [ ] Mouse agent core implementation
- [ ] Contract generator
- [ ] Code generator
- [ ] Config generator
- [ ] TypeScript type generator
- [ ] Template system
- [ ] Mouse contracts:
  - [ ] `morpheus/mouse/generate-contract.yaml`
  - [ ] `morpheus/mouse/generate-migration.yaml`
  - [ ] `morpheus/mouse/generate-config.yaml`
  - [ ] `morpheus/mouse/generate-types.yaml`

### Phase 8d: Trinity Agent (The Executor)
- [ ] Trinity agent core implementation
- [ ] Code comprehension engine
- [ ] Intent extraction
- [ ] Architecture analysis
- [ ] Migration advisor
- [ ] Trinity contracts:
  - [ ] `morpheus/trinity/comprehend-code.yaml`
  - [ ] `morpheus/trinity/extract-intent.yaml`
  - [ ] `morpheus/trinity/analyze-architecture.yaml`
  - [ ] `morpheus/trinity/migration-advisor.yaml`

### Phase 8e: Switch Agent (The Validator)
- [ ] Switch agent core implementation
- [ ] Contract validator
- [ ] Code validator
- [ ] Checklist verifier (AI-powered)
- [ ] Migration auditor
- [ ] Switch contracts:
  - [ ] `morpheus/switch/validate-contract.yaml`
  - [ ] `morpheus/switch/verify-checklist.yaml`
  - [ ] `morpheus/switch/audit-migration.yaml`
  - [ ] `morpheus/switch/quality-report.yaml`

### Phase 8f: Apoc Agent (The Planner)
- [ ] Apoc agent core implementation
- [ ] Migration planner
- [ ] Risk assessor
- [ ] Effort estimator
- [ ] Rollback planner
- [ ] Apoc contracts:
  - [ ] `morpheus/apoc/create-plan.yaml`
  - [ ] `morpheus/apoc/assess-risks.yaml`
  - [ ] `morpheus/apoc/estimate-effort.yaml`
  - [ ] `morpheus/apoc/plan-rollback.yaml`

### Phase 8g: CLI & Reporting
- [ ] CLI command structure
- [ ] Interactive guide (Morpheus speaks)
- [ ] Report generator
- [ ] Progress visualization
- [ ] Team status display

### Phase 8h: Knowledge Base
- [ ] Construct architecture knowledge
- [ ] Pattern library
- [ ] Anti-pattern detection
- [ ] Best practices documentation

### Phase 8i: Testing & Documentation
- [ ] Unit tests for all team agents
- [ ] Integration tests for workflows
- [ ] Migration test suite (sample projects)
- [ ] Comprehensive documentation
- [ ] Team agent documentation

## Success Criteria

1. **AI Understanding**: Trinity correctly identifies >90% of AI patterns
2. **Workflow Flexibility**: Custom workflows can be defined and executed
3. **Checklist Completeness**: Switch verifies all migration steps
4. **Contract Quality**: Mouse generates valid and usable contracts
5. **TypeScript Support**: Full type safety throughout
6. **Planning Accuracy**: Apoc creates actionable plans with accurate estimates
7. **Interactive Experience**: Smooth CLI guidance with Trinity as advisor
8. **Team Coordination**: All crew agents work together seamlessly
9. **Dogfooding**: Morpheus successfully uses The Construct for its own AI operations

## Dependencies

```json
{
  "dependencies": {
    "@the-construct/core": "^1.0.0",  // The Construct itself
    "@typescript-eslint/typescript-estree": "^7.0.0",
    "fast-glob": "^3.3.0",
    "yaml": "^2.3.0",
    "commander": "^11.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "better-sqlite3": "^9.0.0",
    "zod": "^3.22.0"
  }
}
```

---

*"Throughout human history, we have been dependent on machines to survive. Fate, it seems, is not without a sense of irony."* — Morpheus

**Morpheus is built on The Construct to help others adopt The Construct.**
