# Morpheus - AI Migration Wizard

> "What is real? How do you define real? If you're talking about what you can feel,
> what you can smell, what you can taste and see, then 'real' is simply electrical
> signals interpreted by your brain." — Morpheus

Morpheus is an AI-powered migration wizard that helps projects migrate to The Construct architecture. It orchestrates a team of specialized agents (The Nebuchadnezzar Crew) to analyze existing codebases, generate migration plans, and automate the transition.

## Table of Contents

- [Overview](#overview)
- [The Nebuchadnezzar Crew](#the-nebuchadnezzar-crew)
- [Workflow System](#workflow-system)
- [Knowledge Base](#knowledge-base)
- [CLI Interface](#cli-interface)
- [API Reference](#api-reference)

## Overview

### Key Features

- **Automated Analysis**: Deep analysis of existing AI usage patterns, dependencies, and architecture
- **Migration Planning**: Risk-aware migration plans with phases, tasks, and rollback strategies
- **Code Generation**: Automatic generation of Construct configs, contracts, and scaffolding
- **Validation**: Comprehensive validation of generated artifacts
- **Knowledge Base**: Built-in patterns, anti-patterns, and best practices

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MORPHEUS COMMANDER                       │
│              (Orchestrates the crew and workflow)           │
└─────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐        ┌─────────────┐
│    TANK     │      │   TRINITY   │        │    APOC     │
│  (Scanner)  │──────│  (Analyzer) │────────│  (Planner)  │
└─────────────┘      └─────────────┘        └─────────────┘
       │                      │                      │
       │                      ▼                      │
       │             ┌─────────────┐                 │
       │             │    MOUSE    │                 │
       │             │ (Generator) │◄────────────────┘
       │             └─────────────┘
       │                      │
       │                      ▼
       │             ┌─────────────┐
       └────────────►│   SWITCH    │
                     │ (Validator) │
                     └─────────────┘
```

## The Nebuchadnezzar Crew

### Tank - The Operator

**Role**: Project scanning and indexing

Tank scans the target project to understand its structure, dependencies, and AI usage patterns.

```typescript
import { createTank } from 'the-construct/morpheus';

const tank = createTank();

// Scan a project directory
const scan = await tank.scanProject('/path/to/project');

// Access scan results
console.log(scan.files);        // All scanned files
console.log(scan.dependencies); // Package dependencies
console.log(scan.config);       // Configuration files
console.log(scan.statistics);   // Summary statistics
```

**Capabilities**: `scan`, `analyze`, `verify`

**Contracts**:
- `scan-project`: Scan project structure and files
- `analyze-dependencies`: Analyze package dependencies
- `detect-ai-usage`: Detect AI SDK usage patterns

### Mouse - The Designer

**Role**: Code and configuration generation

Mouse generates Construct configurations, contracts, and scaffolding from analysis results.

```typescript
import { createMouse } from 'the-construct/morpheus';

const mouse = createMouse();

// Generate Architect config
const config = await mouse.generateConfig('architect', analysis);

// Generate contract from prompt
const contract = await mouse.generateContract(promptAnalysis);

// Generate all configs
const allConfigs = await mouse.generateAllConfigs(analysis);
```

**Capabilities**: `generate`, `transform`

**Contracts**:
- `generate-contract`: Generate AI contract from prompt analysis
- `generate-config`: Generate Construct component config
- `generate-scaffolding`: Generate project scaffolding

### Trinity - The Expert

**Role**: Deep code analysis

Trinity performs detailed analysis of AI usage patterns, prompts, tools, and architecture.

```typescript
import { createTrinity } from 'the-construct/morpheus';

const trinity = createTrinity();

// Analyze prompts in project
const prompts = await trinity.analyzePrompts(files);

// Analyze tool usage
const tools = await trinity.analyzeTools(files);

// Analyze patterns
const patterns = await trinity.analyzePatterns(code);

// Get full architecture assessment
const architecture = await trinity.analyzeArchitecture(scan);
```

**Capabilities**: `analyze`, `verify`

**Contracts**:
- `analyze-prompts`: Analyze AI prompts
- `analyze-tools`: Analyze tool call patterns
- `analyze-patterns`: Detect patterns and anti-patterns
- `verify-checklist`: AI-assisted verification

### Switch - The Skeptic

**Role**: Validation and auditing

Switch validates generated artifacts and audits changes for security and quality.

```typescript
import { createSwitch } from 'the-construct/morpheus';

const switch_ = createSwitch();

// Validate a contract
const result = await switch_.validateContract(contract);

// Validate config
const configResult = await switch_.validateConfig(config);

// Audit changes
const audit = await switch_.auditChanges(changes);
```

**Capabilities**: `validate`, `verify`

**Contracts**:
- `validate-contract`: Validate contract structure
- `validate-migration`: Validate migration plan
- `audit-changes`: Audit code changes

### Apoc - The Strategist

**Role**: Migration planning

Apoc creates comprehensive migration plans with phases, risks, and effort estimates.

```typescript
import { createApoc } from 'the-construct/morpheus';

const apoc = createApoc();

// Generate migration plan
const plan = await apoc.generateMigrationPlan(analysis, 'project-name');

// Plan includes:
// - Current state summary
// - Target state (Construct components)
// - Migration phases
// - Risk analysis
// - Effort estimates
// - Rollback procedures
```

**Capabilities**: `plan`, `verify`

**Contracts**:
- `generate-plan`: Generate migration plan
- `assess-risks`: Identify and assess risks
- `estimate-effort`: Estimate migration effort

## Workflow System

### Workflow Definition

Workflows are defined in YAML:

```yaml
id: standard-migration
name: Standard Migration Workflow
version: 1.0.0
description: Complete migration to The Construct

config:
  requireApproval: true
  rollbackOnFailure: true
  aiAssistance: enabled

phases:
  - id: analyze
    name: Analysis Phase
    description: Scan and analyze project
    required: true
    steps:
      - id: scan
        name: Scan Project
        type: automated
        agent: tank

      - id: analyze
        name: Deep Analysis
        type: ai-assisted
        agent: trinity
    checklist:
      - id: scan-complete
        text: Project scan completed
        required: true

  - id: plan
    name: Planning Phase
    description: Create migration plan
    depends_on:
      - analyze
    steps:
      - id: plan
        name: Generate Plan
        type: ai-assisted
        agent: apoc
```

### Workflow Loader

```typescript
import { createWorkflowLoader } from 'the-construct/morpheus';

const loader = createWorkflowLoader();

// Load from YAML string
const result = await loader.loadFromString(yamlContent);

// Load from file
const result = await loader.load('standard-migration');

// Access workflow
if (result.success) {
  const workflow = result.workflow;
  console.log(workflow.phases);
}
```

### Checklist Manager

```typescript
import { createChecklistManager } from 'the-construct/morpheus';

const manager = createChecklistManager();

// Initialize from phase
manager.initializeChecklist(phase);

// Mark items
manager.markItemComplete(phaseId, itemId);
manager.markItemFailed(phaseId, itemId, 'Reason');

// Check progress
const progress = manager.getProgress(phaseId);
console.log(`${progress.completed}/${progress.total} complete`);
```

### State Store

```typescript
import { createStateStore } from 'the-construct/morpheus';

const store = createStateStore({ inMemory: false });
await store.open();

// Create workflow state
const state = await store.createState('workflow-id', '/project/path');

// Update state
await store.updateState(state.id, {
  status: 'in_progress',
  currentPhase: 'analyze',
});

// Create checkpoints
await store.createCheckpoint(state.id, 'Before code changes', files);

// Close when done
await store.close();
```

## Knowledge Base

### Patterns

The knowledge base includes 15+ AI development patterns:

```typescript
import {
  PATTERNS,
  getPatternsByCategory,
  searchPatterns
} from 'the-construct/morpheus';

// Get patterns by category
const promptPatterns = getPatternsByCategory('prompt');
const architecturePatterns = getPatternsByCategory('architecture');

// Search patterns
const results = searchPatterns('caching');
```

**Categories**: prompt, tool, architecture, error-handling, security, testing, performance, migration

### Anti-Patterns

14+ anti-patterns with detection rules:

```typescript
import {
  ANTI_PATTERNS,
  getAntiPatternsBySeverity,
  getAllDetectionRules
} from 'the-construct/morpheus';

// Get critical anti-patterns
const critical = getAntiPatternsBySeverity('critical');

// Get detection rules for automated scanning
const rules = getAllDetectionRules();
```

**Categories**: security, reliability, maintainability, performance, cost, testing

### Best Practices

20+ best practices with checklists:

```typescript
import {
  BEST_PRACTICES,
  getMigrationChecklist,
  getBestPracticesForComponent
} from 'the-construct/morpheus';

// Get migration checklist
const checklist = getMigrationChecklist();

// Get practices for specific component
const architectPractices = getBestPracticesForComponent('architect');
```

### Component Knowledge

```typescript
import {
  CONSTRUCT_COMPONENTS,
  getComponentById,
  canMigrateComponent,
  getNextMigratableComponents
} from 'the-construct/morpheus';

// Get component details
const architect = getComponentById('architect');
console.log(architect.interfaces);
console.log(architect.dependencies);
console.log(architect.configuration);

// Check migration order
const migrated = ['architect', 'keymaker'];
const canMigrate = canMigrateComponent('sentinels', migrated);
const nextAvailable = getNextMigratableComponents(migrated);
```

### Unified Knowledge Base

```typescript
import { createKnowledgeBase } from 'the-construct/morpheus';

const kb = createKnowledgeBase();

// Unified search
const results = kb.search('rate limiting', { type: 'all' });

// Context-aware recommendations
const recommendations = kb.getRecommendations({
  hasHardcodedPrompts: true,
  securityScore: 40
});

// Migration guidance
const guidance = kb.getMigrationGuidance('openai-direct-calls');
```

## CLI Interface

### Basic Usage

```typescript
import { createCLI } from 'the-construct/morpheus';

const cli = createCLI();

// Display banner
cli.printBanner();

// Show crew status
cli.showCrewStatus();

// Display progress
cli.showProgress(50, 'Analyzing files...');

// Generate reports
const markdownReport = cli.generateReport(plan, 'markdown');
const htmlReport = cli.generateReport(plan, 'html');
```

### Output Modes

```typescript
// Verbose mode
const cli = createCLI({ verbose: true });

// Quiet mode
const cli = createCLI({ quiet: true });

// Custom output
const cli = createCLI({}, (message) => myLogger.log(message));
```

## API Reference

### Morpheus Commander

```typescript
import { createMorpheus, Morpheus } from 'the-construct/morpheus';

interface MorpheusOptions {
  inMemoryState?: boolean;      // Use in-memory state store
  workflowsDir?: string;        // Custom workflows directory
  callbacks?: MorpheusCallbacks;
}

interface MorpheusCallbacks {
  onMessage?: (msg: MorpheusMessage) => void;
  onProgress?: (update: ProgressUpdate) => void;
  onPillChoice?: (context: PillChoiceContext) => Promise<'red' | 'blue'>;
  onApproval?: (context: ApprovalContext) => Promise<boolean>;
}

const morpheus = createMorpheus({
  inMemoryState: true,
  callbacks: {
    onMessage: (msg) => console.log(msg.text),
    onProgress: (update) => progressBar.update(update.percentage),
  }
});

// Initialize
await morpheus.initialize();

// Register agents
morpheus.registerAgent(createTank());
morpheus.registerAgent(createMouse());

// Load workflow
const result = await morpheus.loadWorkflow('standard-migration');

// Run migration
const runResult = await morpheus.run('standard-migration', '/project/path');

// Shutdown
await morpheus.shutdown();
```

### Reporter

```typescript
import { createReporter, Reporter } from 'the-construct/morpheus';

const reporter = createReporter();

// Generate reports
const planReport = reporter.generatePlanReport(plan);
const analysisReport = reporter.generateAnalysisReport(analysis);
const validationReport = reporter.generateValidationReport(validation);
const progressReport = reporter.generateProgressReport(state);

// Reports return GeneratedReport
interface GeneratedReport {
  format: 'markdown' | 'html' | 'json';
  content: string;
  generatedAt: Date;
  sections: ReportSection[];
}
```

## Migration Order

The recommended order for migrating to The Construct:

1. **Architect** - Configuration and truth source (no dependencies)
2. **Keymaker** - Provider abstraction (depends on Architect)
3. **Oracle** - Judgment and XP system (depends on Architect)
4. **Sentinels** - Validation and QA (depends on Architect)
5. **Programs** - Worker execution (depends on Keymaker, Sentinels)
6. **Agents** - Orchestration (depends on Architect, Oracle, Sentinels, Programs)
7. **Smith** - Security layer (depends on Architect, Sentinels)

## Example: Full Migration

```typescript
import {
  createMorpheus,
  createTank,
  createTrinity,
  createApoc,
  createMouse,
  createSwitch,
  createReporter,
} from 'the-construct/morpheus';

async function migrateProject(projectPath: string) {
  // Initialize Morpheus
  const morpheus = createMorpheus({
    callbacks: {
      onMessage: (msg) => console.log(`[${msg.type}] ${msg.text}`),
      onProgress: (update) => console.log(`Progress: ${update.percentage}%`),
    }
  });

  await morpheus.initialize();

  // Register crew
  const tank = createTank();
  const trinity = createTrinity();
  const apoc = createApoc();
  const mouse = createMouse();
  const switch_ = createSwitch();

  morpheus.registerAgent(tank);
  morpheus.registerAgent(trinity);
  morpheus.registerAgent(apoc);
  morpheus.registerAgent(mouse);
  morpheus.registerAgent(switch_);

  // Step 1: Scan project
  const scan = await tank.scanProject(projectPath);
  console.log(`Scanned ${scan.statistics.totalFiles} files`);

  // Step 2: Deep analysis
  const architecture = await trinity.analyzeArchitecture(scan);
  console.log(`Architecture score: ${architecture.score}`);

  // Step 3: Generate migration plan
  const plan = await apoc.generateMigrationPlan({
    project: scan,
    aiUsage: { providers: [], prompts: [], tools: [], patterns: [], antiPatterns: [] },
    architecture,
    security: { score: 70, findings: [], hasAuthentication: false, hasAuthorization: false, hasInputValidation: false, hasOutputValidation: false, hasSecretManagement: true, hasAuditLogging: false },
    quality: { score: 60, codeQuality: 60, typeQuality: 50, testQuality: 40, documentationQuality: 50 },
    gaps: { missingComponents: [], partialComponents: [], recommendations: [] },
  }, 'my-project');

  console.log(`Migration phases: ${plan.phases.length}`);
  console.log(`Estimated effort: ${plan.estimates.realistic} hours`);

  // Step 4: Generate configs
  const configs = await mouse.generateAllConfigs({
    project: scan,
    aiUsage: { providers: [], prompts: [], tools: [], patterns: [], antiPatterns: [] },
    architecture,
    security: { score: 70, findings: [], hasAuthentication: false, hasAuthorization: false, hasInputValidation: false, hasOutputValidation: false, hasSecretManagement: true, hasAuditLogging: false },
    quality: { score: 60, codeQuality: 60, typeQuality: 50, testQuality: 40, documentationQuality: 50 },
    gaps: { missingComponents: [], partialComponents: [], recommendations: [] },
  });

  // Step 5: Validate configs
  for (const config of configs) {
    const validation = await switch_.validateConfig(config);
    if (!validation.valid) {
      console.log(`Config ${config.type} has issues:`, validation.errors);
    }
  }

  // Step 6: Generate report
  const reporter = createReporter();
  const report = reporter.generatePlanReport(plan);
  console.log(report.content);

  await morpheus.shutdown();
}

migrateProject('/path/to/project');
```

## Related Documentation

- [The Construct Architecture](./architecture.md)
- [Contract Schema](./contract-schema.md)
- [Morpheus Technical Spec](./plans/morpheus-technical-spec.md)
- [Security Architecture](./security-architecture.md)
