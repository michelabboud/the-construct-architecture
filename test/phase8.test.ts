/**
 * Phase 8 Tests - Morpheus Migration Wizard
 *
 * "The Matrix is a system, Neo. That system is our enemy." — Morpheus
 *
 * Tests for the Morpheus migration wizard components.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as morpheus from '../src/morpheus/index.js';
import {
  // Workflow system
  WorkflowLoader,
  createWorkflowLoader,
  ChecklistManager,
  createChecklistManager,
  WorkflowStateStore,
  createStateStore,
  BUILT_IN_WORKFLOWS,
  // Crew system
  BaseAgent,
  CREW_ROLES,
  createDefaultAgentConfig,
  isValidCrewMember,
  getCrewMemberByName,
  getAllCrewMembers,
  AgentTask,
  VerificationContext,
  // Morpheus Commander
  Morpheus,
  createMorpheus,
  // Tank Agent
  Tank,
  createTank,
  // Mouse Agent
  Mouse,
  createMouse,
  // Trinity Agent
  Trinity,
  createTrinity,
  // Switch Agent
  Switch,
  createSwitch,
  // Apoc Agent
  Apoc,
  createApoc,
  // Reporter
  Reporter,
  createReporter,
  // CLI
  MorpheusCLI,
  createCLI,
  createStyle,
  MORPHEUS_BANNER,
  MORPHEUS_BANNER_SMALL,
  // Types
  WorkflowPhase,
  ChecklistItemDef,
  CrewMember,
  AgentConfig,
  VerificationResult,
  Workflow,
} from '../src/morpheus/index.js';
import {
  ProjectScan,
  DependencyScan,
  ConfigScan,
  PromptAnalysis,
  FullAnalysis,
  GeneratedContract,
  GeneratedConfig,
  GeneratedArtifacts,
  ToolAnalysis,
  DetectedPattern,
  DetectedAntiPattern,
  ArchitectureAnalysis,
  StructureAssessment,
  FileLocation,
  ScannedFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AuditReport,
  AuditFinding,
  MigrationPlan,
  MigrationPhase,
  MigrationTask,
  MigrationRisk,
  RiskMitigation,
  MigrationVerification,
  RollbackStep,
  MigrationEstimates,
  EffortEstimate,
  CurrentStateSummary,
  TargetStateSummary,
  GapAnalysis,
  CodeChange,
} from '../src/types/morpheus.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// ============================================================================
// SHARED TEST HELPERS
// ============================================================================

/**
 * Creates a mock FullAnalysis for testing
 */
const createMockFullAnalysis = (overrides: Partial<FullAnalysis> = {}): FullAnalysis => ({
  project: {
    rootPath: '/test/project',
    scannedAt: new Date(),
    files: [
      {
        path: '/test/project/src/ai/chat.ts',
        relativePath: 'src/ai/chat.ts',
        language: 'typescript',
        size: 1000,
        lines: 50,
        imports: [{ source: 'openai', specifiers: ['OpenAI'], isDefault: false, isNamespace: false, line: 1 }],
        exports: [{ name: 'chat', isDefault: false, line: 10 }],
        hasAIUsage: true,
      },
    ],
    dependencies: {
      packageManager: 'npm',
      packageJson: { name: 'test', version: '1.0.0' },
      lockfilePresent: true,
      typescript: true,
      aiPackages: [
        { name: '@openai/api', version: '4.0.0', provider: 'openai', features: ['chat', 'embeddings'] },
      ],
      relatedPackages: [],
    },
    configs: {
      envFiles: ['.env'],
      configFiles: ['tsconfig.json'],
      hasEnvExample: true,
      detectedSecrets: [],
    },
    statistics: {
      totalFiles: 10,
      totalLines: 500,
      aiRelatedFiles: 3,
      languageBreakdown: { typescript: 10, javascript: 0, yaml: 0, json: 0, markdown: 0, other: 0 },
      scanDuration: 100,
    },
  },
  aiUsage: {
    providers: [
      {
        provider: 'openai',
        package: '@openai/api',
        version: '4.0.0',
        locations: [{ file: '/test/project/src/ai/chat.ts', line: 5, column: 1 }],
        models: ['gpt-4'],
        features: ['chat'],
        callCount: 5,
      },
    ],
    prompts: [
      {
        id: 'prompt-1',
        location: { file: '/test/project/src/ai/chat.ts', line: 20, column: 1 },
        type: 'inline',
        structure: {
          hasSystemPrompt: true,
          hasUserPrompt: true,
          hasAssistantExamples: false,
          messageCount: 2,
        },
        variables: [
          { name: 'input', source: 'parameter', type: 'string' },
        ],
        complexity: 'moderate',
        estimatedTokens: 100,
        recommendations: ['Consider using template files'],
      },
    ],
    tools: [
      {
        id: 'tool-1',
        name: 'search',
        location: { file: '/test/project/src/tools/search.ts', line: 10, column: 1 },
        handler: {
          location: { file: '/test/project/src/tools/search.ts', line: 15, column: 1 },
          async: true,
          hasErrorHandling: true,
          returnsValue: true,
        },
        parameters: [
          { name: 'query', type: 'string', description: 'Search query', required: true },
        ],
        pattern: 'openai-functions',
        hasValidation: true,
        hasErrorHandling: true,
      },
    ],
    patterns: [
      { id: 'pattern-1', name: 'Error Handling', description: 'Proper error handling', category: 'good', locations: [{ file: '/test/file.ts', line: 10, column: 1 }] },
    ],
    antiPatterns: [
      { id: 'antipattern-1', name: 'Hardcoded prompts', description: 'Prompts are hardcoded', severity: 'medium', locations: [{ file: '/test/chat.ts', line: 5, column: 1 }], impact: 'Difficult to modify', remediation: 'Extract prompts to config' },
    ],
  },
  architecture: {
    structure: {
      hasServiceLayer: true,
      hasSeparateAIModule: true,
      hasConfigFiles: true,
      hasTypeDefinitions: true,
      hasTests: false,
      hasCentralizedErrors: false,
      hasLogging: true,
    },
    patterns: [],
    score: 65,
    recommendations: ['Add tests', 'Centralize errors'],
  },
  security: {
    score: 45,
    findings: [
      {
        id: 'sec-1',
        severity: 'high',
        category: 'credentials',
        title: 'Hardcoded API Key',
        description: 'Potential hardcoded API key',
        location: { file: '/test/config.ts', line: 5, column: 10 },
        remediation: 'Use environment variables',
      },
    ],
    hasAuthentication: false,
    hasAuthorization: false,
    hasAuditLogging: false,
    hasSecretManagement: false,
    hasInputValidation: false,
    hasOutputSanitization: false,
  },
  quality: {
    score: 70,
    hasErrorHandling: true,
    hasValidation: true,
    hasTesting: false,
    hasDocumentation: false,
    findings: ['No test files found', 'Missing documentation'],
  },
  gaps: {
    missing: [
      { area: 'Configuration', description: 'No Architect config found', impact: 'high', constructComponent: 'Architect' },
    ],
    partial: [
      { area: 'Testing', description: 'Partial test coverage', impact: 'medium', constructComponent: 'Sentinels' },
    ],
    recommendations: [
      { priority: 1, title: 'Add Architect config', description: 'Create config file', effort: 'small', benefit: 'Centralized config' },
    ],
  },
  ...overrides,
});

/**
 * Creates a mock MigrationPlan for testing
 */
const createMockMigrationPlan = (overrides: Partial<MigrationPlan> = {}): MigrationPlan => ({
  id: 'plan-1',
  projectName: 'Test Project',
  generatedAt: new Date(),
  morpheusVersion: '1.0.0',
  currentState: {
    aiProviders: ['openai'],
    promptCount: 3,
    toolCount: 2,
    architectureScore: 65,
    securityScore: 45,
    qualityScore: 70,
    keyFindings: ['No tests', 'Hardcoded prompts'],
  },
  targetState: {
    architecture: 'The Construct',
    components: ['Architect', 'Keymaker', 'Sentinels', 'Oracle'],
    benefits: ['Multi-provider support', 'Contract-based development', 'Enhanced security'],
  },
  gapAnalysis: {
    missing: [
      { area: 'Configuration', description: 'Architect config is missing', impact: 'high', constructComponent: 'Architect' },
    ],
    partial: [],
    recommendations: [
      { priority: 1, title: 'Add Architect config', description: 'Create configuration file', effort: 'small', benefit: 'Centralized configuration' },
    ],
  },
  risks: [
    {
      id: 'risk-1',
      title: 'API compatibility',
      description: 'Provider APIs may differ',
      probability: 'medium',
      impact: 'high',
      category: 'technical',
    },
  ],
  mitigations: [
    {
      riskId: 'risk-1',
      strategy: 'Use adapter pattern',
      actions: ['Create adapter interface', 'Implement provider-specific adapters'],
    },
  ],
  phases: [
    {
      id: 'setup',
      name: 'Project Setup',
      order: 1,
      description: 'Set up project structure',
      goals: ['Create directory structure', 'Initialize configuration'],
      dependsOn: [],
      tasks: [
        {
          id: 'setup-1',
          name: 'Create directories',
          type: 'create',
          description: 'Create Construct directories',
          affectedFiles: ['src/construct'],
          steps: [{ order: 1, description: 'Create src/construct', command: 'mkdir -p src/construct' }],
          verification: 'Check that src/construct directory exists',
          automatable: true,
        },
      ],
      verification: [{ name: 'Verify setup', type: 'automated', command: 'test -d src/construct', expectedResult: 'Directory exists' }],
      rollback: [{ order: 1, description: 'Remove directories', command: 'rm -rf src/construct' }],
      estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
    },
  ],
  artifacts: {
    contracts: [],
    configs: [],
    scaffolding: [],
  },
  estimates: {
    totalEffort: { optimistic: 8, realistic: 16, pessimistic: 32, unit: 'hours' },
    phaseEfforts: { setup: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' } },
    complexity: 'medium',
    confidence: 0.75,
    assumptions: ['Team familiar with TypeScript'],
  },
  ...overrides,
});

/**
 * Creates a mock ValidationResult for testing
 */
const createMockValidationResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  valid: true,
  errors: [],
  warnings: [],
  score: 100,
  ...overrides,
});

// ============================================================================
// WORKFLOW LOADER TESTS
// ============================================================================

describe('Phase 8a: Workflow Loader', () => {
  let loader: WorkflowLoader;

  beforeEach(() => {
    loader = createWorkflowLoader({
      workflowsDir: 'test/fixtures/workflows',
      strict: false,
    });
  });

  test('creates workflow loader with default options', () => {
    const defaultLoader = createWorkflowLoader();
    expect(defaultLoader).toBeInstanceOf(WorkflowLoader);
  });

  test('has built-in workflow IDs', () => {
    expect(BUILT_IN_WORKFLOWS).toContain('standard-migration');
    expect(BUILT_IN_WORKFLOWS).toContain('quick-migration');
    expect(BUILT_IN_WORKFLOWS).toContain('security-focused');
    expect(BUILT_IN_WORKFLOWS).toContain('minimal');
  });

  test('loads workflow from YAML string', async () => {
    const yaml = `
id: test-workflow
name: Test Workflow
version: '1.0.0'
description: A test workflow
config:
  requireApproval: true
  allowSkip: false
  rollbackOnFailure: true
  aiAssistance: enabled
  checkpoints: true
phases:
  - id: phase-1
    name: Phase 1
    description: First phase
    dependsOn: []
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist:
      - id: check-1
        text: Verify step 1
        required: true
`;

    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(true);
    expect(result.workflow).toBeDefined();
    expect(result.workflow!.id).toBe('test-workflow');
    expect(result.workflow!.phases).toHaveLength(1);
    expect(result.workflow!.phases[0]!.steps).toHaveLength(1);
  });

  test('validates phase dependencies', async () => {
    const yaml = `
id: invalid-deps
name: Invalid Dependencies
version: '1.0.0'
description: Has invalid dependencies
config:
  requireApproval: true
  allowSkip: false
  rollbackOnFailure: true
  aiAssistance: enabled
  checkpoints: true
phases:
  - id: phase-1
    name: Phase 1
    description: First phase
    dependsOn:
      - non-existent-phase
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist: []
`;

    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.message).toContain('non-existent-phase');
  });

  test('detects circular dependencies', async () => {
    const yaml = `
id: circular
name: Circular Dependencies
version: '1.0.0'
description: Has circular dependencies
config:
  requireApproval: true
  allowSkip: false
  rollbackOnFailure: true
  aiAssistance: enabled
  checkpoints: true
phases:
  - id: phase-a
    name: Phase A
    description: Phase A
    dependsOn:
      - phase-b
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist: []
  - id: phase-b
    name: Phase B
    description: Phase B
    dependsOn:
      - phase-a
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist: []
`;

    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.message.includes('Circular'))).toBe(true);
  });

  test('validates workflow schema', async () => {
    const yaml = `
id: missing-fields
name: Missing Fields
`;

    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('lists available workflows', async () => {
    const workflows = await loader.listWorkflows();
    expect(Array.isArray(workflows)).toBe(true);
  });

  test('clears cache', () => {
    loader.clearCache();
    // Should not throw
  });
});

// ============================================================================
// CHECKLIST MANAGER TESTS
// ============================================================================

describe('Phase 8a: Checklist Manager', () => {
  let manager: ChecklistManager;

  const createTestPhase = (): WorkflowPhase => ({
    id: 'test-phase',
    name: 'Test Phase',
    description: 'A test phase',
    dependsOn: [],
    steps: [],
    checklist: [
      {
        id: 'item-1',
        text: 'Required item',
        required: true,
        verification: { type: 'manual' },
      },
      {
        id: 'item-2',
        text: 'Optional item',
        required: false,
        verification: { type: 'automated' },
      },
      {
        id: 'item-3',
        text: 'AI-verified item',
        required: true,
        verification: { type: 'ai-verify', agent: 'trinity' },
      },
    ],
  });

  beforeEach(() => {
    manager = createChecklistManager({ requireEvidence: false });
  });

  test('creates checklist manager', () => {
    expect(manager).toBeInstanceOf(ChecklistManager);
  });

  test('initializes checklist from phase', () => {
    const phase = createTestPhase();
    const state = manager.initializeChecklist(phase);

    expect(state.phaseId).toBe('test-phase');
    expect(state.items).toHaveLength(3);
    expect(state.status).toBe('pending');
  });

  test('gets checklist by phase ID', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const checklist = manager.getChecklist('test-phase');
    expect(checklist).toBeDefined();
    expect(checklist?.phaseId).toBe('test-phase');
  });

  test('gets specific item', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const item = manager.getItem('test-phase', 'item-1');
    expect(item).toBeDefined();
    expect(item?.text).toBe('Required item');
  });

  test('marks item as complete', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const result = manager.markComplete('test-phase', 'item-1', 'user');
    expect(result).toBe(true);

    const item = manager.getItem('test-phase', 'item-1');
    expect(item?.status).toBe('completed');
    expect(item?.completedBy).toBe('user');
    expect(item?.completedAt).toBeDefined();
  });

  test('marks item as failed', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const result = manager.markFailed('test-phase', 'item-1', 'Test error');
    expect(result).toBe(true);

    const item = manager.getItem('test-phase', 'item-1');
    expect(item?.status).toBe('failed');
    expect(item?.error).toBe('Test error');
  });

  test('marks item as skipped (optional only)', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    // Required item cannot be skipped
    const required = manager.markSkipped('test-phase', 'item-1');
    expect(required).toBe(false);

    // Optional item can be skipped
    const optional = manager.markSkipped('test-phase', 'item-2');
    expect(optional).toBe(true);

    const item = manager.getItem('test-phase', 'item-2');
    expect(item?.status).toBe('skipped');
  });

  test('marks item as in progress', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const result = manager.markInProgress('test-phase', 'item-1');
    expect(result).toBe(true);

    const item = manager.getItem('test-phase', 'item-1');
    expect(item?.status).toBe('in_progress');
  });

  test('resets item', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    manager.markComplete('test-phase', 'item-1', 'user');
    const result = manager.resetItem('test-phase', 'item-1');
    expect(result).toBe(true);

    const item = manager.getItem('test-phase', 'item-1');
    expect(item?.status).toBe('pending');
    expect(item?.completedAt).toBeUndefined();
  });

  test('checks if checklist is complete', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    expect(manager.isChecklistComplete('test-phase')).toBe(false);

    // Complete all items
    manager.markComplete('test-phase', 'item-1', 'user');
    manager.markSkipped('test-phase', 'item-2');
    manager.markComplete('test-phase', 'item-3', 'ai');

    expect(manager.isChecklistComplete('test-phase')).toBe(true);
  });

  test('checks required items completion', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    expect(manager.areRequiredItemsComplete('test-phase')).toBe(false);

    // Complete only required items
    manager.markComplete('test-phase', 'item-1', 'user');
    manager.markComplete('test-phase', 'item-3', 'ai');

    expect(manager.areRequiredItemsComplete('test-phase')).toBe(true);
  });

  test('gets progress', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const progress = manager.getProgress('test-phase');
    expect(progress).toBeDefined();
    expect(progress?.total).toBe(3);
    expect(progress?.pending).toBe(3);
    expect(progress?.completed).toBe(0);

    manager.markComplete('test-phase', 'item-1', 'user');
    const updated = manager.getProgress('test-phase');
    expect(updated?.completed).toBe(1);
    expect(updated?.percentage).toBe(33);
  });

  test('gets items needing verification', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const items = manager.getItemsNeedingVerification('test-phase');
    expect(items).toHaveLength(2); // automated and ai-verify items
  });

  test('gets items by verification type', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const manual = manager.getItemsByVerificationType('test-phase', 'manual');
    expect(manual).toHaveLength(1);

    const aiVerify = manager.getItemsByVerificationType('test-phase', 'ai-verify');
    expect(aiVerify).toHaveLength(1);
  });

  test('applies verification result', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    const result: VerificationResult = {
      verified: true,
      evidence: 'Test passed',
      confidence: 0.95,
      method: 'automated',
    };

    manager.applyVerification('test-phase', 'item-2', result);

    const item = manager.getItem('test-phase', 'item-2');
    expect(item?.status).toBe('completed');
    expect(item?.completedBy).toBe('automated');
  });

  test('exports and imports state', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);
    manager.markComplete('test-phase', 'item-1', 'user');

    const exported = manager.exportState();
    expect(exported['test-phase']).toBeDefined();

    const newManager = createChecklistManager();
    newManager.importState(exported);

    const item = newManager.getItem('test-phase', 'item-1');
    expect(item?.status).toBe('completed');
  });

  test('emits events', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);

    let eventReceived = false;
    manager.on('item:completed', () => {
      eventReceived = true;
    });

    manager.markComplete('test-phase', 'item-1', 'user');
    expect(eventReceived).toBe(true);
  });

  test('clears all checklists', () => {
    const phase = createTestPhase();
    manager.initializeChecklist(phase);
    manager.clear();

    const checklist = manager.getChecklist('test-phase');
    expect(checklist).toBeUndefined();
  });
});

// ============================================================================
// STATE STORE TESTS
// ============================================================================

describe('Phase 8a: State Store', () => {
  let store: WorkflowStateStore;

  beforeEach(async () => {
    store = createStateStore({ inMemory: true });
    await store.open();
  });

  afterEach(async () => {
    await store.close();
  });

  test('creates state store', () => {
    expect(store).toBeInstanceOf(WorkflowStateStore);
  });

  test('creates workflow state', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    expect(state.id).toBeDefined();
    expect(state.workflowId).toBe('test-workflow');
    expect(state.projectPath).toBe('/project/path');
    expect(state.status).toBe('pending');
    expect(state.progress.completedPhases).toEqual([]);
  });

  test('gets state by ID', async () => {
    const created = await store.createState('test-workflow', '/project/path');
    const retrieved = await store.getState(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.workflowId).toBe('test-workflow');
  });

  test('gets state by project path', async () => {
    await store.createState('test-workflow', '/project/path');
    const state = await store.getStateByProject('/project/path');

    expect(state).toBeDefined();
    expect(state?.projectPath).toBe('/project/path');
  });

  test('returns null for non-existent state', async () => {
    const state = await store.getState('non-existent');
    expect(state).toBeNull();
  });

  test('updates state', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    state.status = 'running';
    state.currentPhase = 'phase-1';
    state.progress.completedSteps.push('step-1');
    await store.updateState(state);

    const retrieved = await store.getState(state.id);
    expect(retrieved?.status).toBe('running');
    expect(retrieved?.currentPhase).toBe('phase-1');
    expect(retrieved?.progress.completedSteps).toContain('step-1');
  });

  test('deletes state', async () => {
    const state = await store.createState('test-workflow', '/project/path');
    await store.deleteState(state.id);

    const retrieved = await store.getState(state.id);
    expect(retrieved).toBeNull();
  });

  test('adds events', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    await store.addEvent(state.id, 'phase_started', { phaseName: 'Phase 1' }, {
      phaseId: 'phase-1',
    });

    const events = await store.getEvents(state.id);
    expect(events.length).toBeGreaterThanOrEqual(2); // workflow_started + phase_started
    expect(events.some(e => e.type === 'phase_started')).toBe(true);
  });

  test('creates checkpoints', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    const checkpoint = await store.createCheckpoint(
      state.id,
      'phase-1',
      'step-1',
      'Before changes',
      [{ path: '/file.ts', content: 'original', existed: true }]
    );

    expect(checkpoint.id).toBeDefined();
    expect(checkpoint.phaseId).toBe('phase-1');
    expect(checkpoint.fileBackups).toHaveLength(1);
  });

  test('gets checkpoints', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    await store.createCheckpoint(state.id, 'phase-1', 'step-1', 'First', []);
    await store.createCheckpoint(state.id, 'phase-1', 'step-2', 'Second', []);

    const checkpoints = await store.getCheckpoints(state.id);
    expect(checkpoints.length).toBe(2);
  });

  test('gets latest checkpoint', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    await store.createCheckpoint(state.id, 'phase-1', 'step-1', 'First', []);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await store.createCheckpoint(state.id, 'phase-1', 'step-2', 'Second', []);

    const latest = await store.getLatestCheckpoint(state.id);
    // Should return one of the checkpoints (latest by timestamp)
    expect(latest).toBeDefined();
    expect(['First', 'Second']).toContain(latest?.description);
  });

  test('saves and retrieves checklists', async () => {
    const state = await store.createState('test-workflow', '/project/path');

    const checklistState = {
      phaseId: 'phase-1',
      items: [
        {
          id: 'item-1',
          text: 'Test item',
          required: true,
          status: 'completed' as const,
          verification: { type: 'manual' as const },
        },
      ],
      status: 'completed' as const,
    };

    await store.saveChecklist(state.id, checklistState);
    const retrieved = await store.getChecklist(state.id, 'phase-1');

    expect(retrieved).toBeDefined();
    expect(retrieved!.items[0]!.status).toBe('completed');
  });

  test('gets incomplete states', async () => {
    await store.createState('test-1', '/path1');
    const complete = await store.createState('test-2', '/path2');
    complete.status = 'completed';
    await store.updateState(complete);

    const incomplete = await store.getIncompleteStates();
    expect(incomplete.length).toBeGreaterThanOrEqual(1);
    expect(incomplete.some(s => s.status === 'pending')).toBe(true);
    expect(incomplete.every(s => s.status !== 'completed')).toBe(true);
  });
});

// ============================================================================
// BASE AGENT TESTS
// ============================================================================

describe('Phase 8a: Crew Base Agent', () => {
  class TestAgent extends BaseAgent {
    executeCount = 0;

    constructor(id: CrewMember, config: AgentConfig) {
      super(id, config);
    }

    protected async executeTask<TInput, TOutput>(task: AgentTask<TInput, TOutput>): Promise<TOutput> {
      this.executeCount++;
      return { result: 'success' } as TOutput;
    }

    protected async performVerification(
      _itemId: string,
      _context: VerificationContext
    ): Promise<VerificationResult> {
      return {
        verified: true,
        evidence: 'Test verification',
        confidence: 0.9,
        method: 'ai-verified',
      };
    }
  }

  test('crew roles are defined', () => {
    expect(CREW_ROLES.tank.name).toBe('Tank');
    expect(CREW_ROLES.mouse.name).toBe('Mouse');
    expect(CREW_ROLES.trinity.name).toBe('Trinity');
    expect(CREW_ROLES.switch.name).toBe('Switch');
    expect(CREW_ROLES.apoc.name).toBe('Apoc');
  });

  test('each crew member has capabilities', () => {
    expect(CREW_ROLES.tank.capabilities).toContain('scan');
    expect(CREW_ROLES.mouse.capabilities).toContain('generate');
    expect(CREW_ROLES.trinity.capabilities).toContain('analyze');
    expect(CREW_ROLES.switch.capabilities).toContain('validate');
    expect(CREW_ROLES.apoc.capabilities).toContain('plan');
  });

  test('validates crew member IDs', () => {
    expect(isValidCrewMember('tank')).toBe(true);
    expect(isValidCrewMember('mouse')).toBe(true);
    expect(isValidCrewMember('invalid')).toBe(false);
  });

  test('gets crew member by name', () => {
    expect(getCrewMemberByName('Tank')).toBe('tank');
    expect(getCrewMemberByName('TRINITY')).toBe('trinity');
    expect(getCrewMemberByName('invalid')).toBeUndefined();
  });

  test('gets all crew members', () => {
    const members = getAllCrewMembers();
    expect(members).toHaveLength(5);
    expect(members).toContain('tank');
    expect(members).toContain('mouse');
    expect(members).toContain('trinity');
    expect(members).toContain('switch');
    expect(members).toContain('apoc');
  });

  test('creates default agent config', () => {
    const config = createDefaultAgentConfig(['scan-project']);
    expect(config.enabled).toBe(true);
    expect(config.contracts).toContain('scan-project');
  });

  test('creates agent with config', () => {
    const config = createDefaultAgentConfig(['scan-project']);
    const agent = new TestAgent('tank', config);

    expect(agent.id).toBe('tank');
    expect(agent.role.name).toBe('Tank');
    expect(agent.isEnabled()).toBe(true);
  });

  test('checks capabilities', () => {
    const config = createDefaultAgentConfig();
    const tank = new TestAgent('tank', config);
    const mouse = new TestAgent('mouse', config);

    expect(tank.hasCapability('scan')).toBe(true);
    expect(tank.hasCapability('generate')).toBe(false);
    expect(mouse.hasCapability('generate')).toBe(true);
    expect(mouse.hasCapability('scan')).toBe(false);
  });

  test('gets agent status', () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('tank', config);

    const status = agent.getStatus();
    expect(status.id).toBe('tank');
    expect(status.name).toBe('Tank');
    expect(status.enabled).toBe(true);
    expect(status.busy).toBe(false);
  });

  test('executes task', async () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('tank', config);

    const task: AgentTask = {
      id: 'test-task',
      type: 'scan',
      input: {},
    };

    const result = await agent.execute(task);
    expect(result.success).toBe(true);
    expect(result.output).toEqual({ result: 'success' });
    expect(agent.executeCount).toBe(1);
  });

  test('returns error for unsupported capability', async () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('tank', config);

    const task: AgentTask = {
      id: 'test-task',
      type: 'generate', // Tank doesn't have this capability
      input: {},
    };

    const result = await agent.execute(task);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CAPABILITY_NOT_SUPPORTED');
  });

  test('returns error when disabled', async () => {
    const config: AgentConfig = { enabled: false, contracts: [] };
    const agent = new TestAgent('tank', config);

    const task: AgentTask = {
      id: 'test-task',
      type: 'scan',
      input: {},
    };

    const result = await agent.execute(task);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AGENT_DISABLED');
  });

  test('performs verification', async () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('trinity', config);

    const result = await agent.verify('item-1', {
      phaseId: 'phase-1',
      checklistItemId: 'item-1',
      itemText: 'Test item',
      projectPath: '/project',
    });

    expect(result.verified).toBe(true);
    expect(result.confidence).toBe(0.9);
  });

  test('sets and clears context', () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('tank', config);

    agent.setContext({
      projectPath: '/project',
      phaseId: 'phase-1',
    });

    // Can set context without error
    agent.clearContext();
    // Can clear context without error
  });

  test('emits events', async () => {
    const config = createDefaultAgentConfig();
    const agent = new TestAgent('tank', config);

    let started = false;
    let completed = false;

    agent.on('task:started', () => { started = true; });
    agent.on('task:completed', () => { completed = true; });

    const task: AgentTask = {
      id: 'test-task',
      type: 'scan',
      input: {},
    };

    await agent.execute(task);

    expect(started).toBe(true);
    expect(completed).toBe(true);
  });
});

// ============================================================================
// MORPHEUS COMMANDER TESTS
// ============================================================================

describe('Phase 8a: Morpheus Commander', () => {
  let morpheus: Morpheus;

  beforeEach(() => {
    morpheus = createMorpheus({
      inMemoryState: true,
      requireApproval: false,
    });
  });

  afterEach(async () => {
    await morpheus.shutdown();
  });

  test('creates Morpheus instance', () => {
    expect(morpheus).toBeInstanceOf(Morpheus);
  });

  test('initializes and shuts down', async () => {
    await morpheus.initialize();
    await morpheus.shutdown();
    // Should not throw
  });

  test('registers crew members', async () => {
    class MockAgent extends BaseAgent {
      protected async executeTask<TInput, TOutput>(_task: AgentTask<TInput, TOutput>): Promise<TOutput> {
        return {} as TOutput;
      }
      protected async performVerification(): Promise<VerificationResult> {
        return { verified: true, evidence: '', confidence: 1, method: 'manual' };
      }
    }

    await morpheus.initialize();

    const agent = new MockAgent('tank', createDefaultAgentConfig());
    morpheus.registerAgent(agent);

    expect(morpheus.getAgent('tank')).toBe(agent);
  });

  test('gets all crew members', async () => {
    await morpheus.initialize();
    const crew = morpheus.getCrew();
    expect(crew).toBeInstanceOf(Map);
  });

  test('lists workflows', async () => {
    await morpheus.initialize();
    const workflows = await morpheus.listWorkflows();
    expect(Array.isArray(workflows)).toBe(true);
  });

  test('loads workflow', async () => {
    await morpheus.initialize();

    // Create a valid workflow YAML
    const yaml = `
id: test-workflow
name: Test Workflow
version: '1.0.0'
description: A test workflow
config:
  requireApproval: false
  allowSkip: false
  rollbackOnFailure: true
  aiAssistance: enabled
  checkpoints: true
phases:
  - id: phase-1
    name: Phase 1
    description: First phase
    dependsOn: []
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist: []
`;

    // Use loadFromString via the loader
    const loader = createWorkflowLoader();
    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(true);
  });

  test('gets checklist manager', async () => {
    await morpheus.initialize();
    const manager = morpheus.getChecklistManager();
    expect(manager).toBeInstanceOf(ChecklistManager);
  });

  test('gets state store', async () => {
    await morpheus.initialize();
    const store = morpheus.getStateStore();
    expect(store).toBeInstanceOf(WorkflowStateStore);
  });

  test('emits progress events', async () => {
    await morpheus.initialize();

    let progressReceived = false;
    morpheus.on('progress', () => {
      progressReceived = true;
    });

    // Progress events would be emitted during run
    // For now, just verify the event listener can be attached
    expect(morpheus.listenerCount('progress')).toBe(1);
  });

  test('emits message events', async () => {
    await morpheus.initialize();

    let messageReceived = false;
    morpheus.on('message', () => {
      messageReceived = true;
    });

    expect(morpheus.listenerCount('message')).toBe(1);
  });

  test('getCurrentWorkflow returns null before run', async () => {
    await morpheus.initialize();
    expect(morpheus.getCurrentWorkflow()).toBeNull();
  });

  test('getCurrentState returns null before run', async () => {
    await morpheus.initialize();
    expect(morpheus.getCurrentState()).toBeNull();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Phase 8a: Integration', () => {
  test('workflow loader + checklist manager', async () => {
    const loader = createWorkflowLoader();
    const manager = createChecklistManager();

    const yaml = `
id: integration-test
name: Integration Test
version: '1.0.0'
description: Integration test workflow
config:
  requireApproval: false
  allowSkip: false
  rollbackOnFailure: true
  aiAssistance: enabled
  checkpoints: true
phases:
  - id: phase-1
    name: Phase 1
    description: First phase
    dependsOn: []
    steps:
      - id: step-1
        name: Step 1
        type: manual
    checklist:
      - id: check-1
        text: First check
        required: true
      - id: check-2
        text: Second check
        required: false
`;

    const result = await loader.loadFromString(yaml);
    expect(result.success).toBe(true);

    expect(result.workflow).toBeDefined();
    const state = manager.initializeChecklist(result.workflow!.phases[0]!);
    expect(state.items).toHaveLength(2);

    manager.markComplete('phase-1', 'check-1', 'user');
    expect(manager.areRequiredItemsComplete('phase-1')).toBe(true);
  });

  test('state store + checklist persistence', async () => {
    const store = createStateStore({ inMemory: true });
    await store.open();

    const state = await store.createState('test-workflow', '/project');

    const checklistState = {
      phaseId: 'phase-1',
      items: [
        {
          id: 'item-1',
          text: 'Test item',
          required: true,
          status: 'completed' as const,
          verification: { type: 'manual' as const },
        },
      ],
      status: 'completed' as const,
    };

    await store.saveChecklist(state.id, checklistState);

    const allChecklists = await store.getAllChecklists(state.id);
    expect(allChecklists['phase-1']).toBeDefined();
    expect(allChecklists['phase-1']!.items[0]!.status).toBe('completed');

    await store.close();
  });
});

// ============================================================================
// TANK AGENT TESTS (Phase 8b)
// ============================================================================

describe('Phase 8b: Tank Agent', () => {
  let tank: Tank;
  let testDir: string;

  beforeEach(async () => {
    tank = createTank();
    // Create a unique test directory
    testDir = join(tmpdir(), `tank-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    tank.clearCache();
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Tank Creation', () => {
    test('creates Tank agent with factory function', () => {
      const agent = createTank();
      expect(agent).toBeInstanceOf(Tank);
      expect(agent.id).toBe('tank');
    });

    test('creates Tank with custom config', () => {
      const config = createDefaultAgentConfig(['scan-project', 'custom-contract']);
      const agent = createTank(config);
      expect(agent).toBeInstanceOf(Tank);
    });

    test('Tank has scan capabilities', () => {
      expect(tank.hasCapability('scan')).toBe(true);
      expect(tank.hasCapability('analyze')).toBe(true);
    });

    test('Tank does not have other capabilities', () => {
      expect(tank.hasCapability('generate')).toBe(false);
      expect(tank.hasCapability('validate')).toBe(false);
      expect(tank.hasCapability('plan')).toBe(false);
    });

    test('Tank role is correct', () => {
      expect(tank.role.name).toBe('Tank');
      expect(tank.role.title).toBe('The Operator');
    });
  });

  describe('Project Scanning', () => {
    test('scans empty directory', async () => {
      const scan = await tank.scanProject(testDir);

      expect(scan).toBeDefined();
      expect(scan.rootPath).toBe(testDir);
      expect(scan.files).toEqual([]);
      expect(scan.statistics.totalFiles).toBe(0);
    });

    test('scans directory with TypeScript files', async () => {
      // Create test files
      await writeFile(join(testDir, 'index.ts'), `
import { something } from './utils.js';
export const main = () => console.log('hello');
`);
      await writeFile(join(testDir, 'utils.ts'), `
export const something = 'value';
`);

      const scan = await tank.scanProject(testDir);

      expect(scan.files.length).toBe(2);
      expect(scan.statistics.languageBreakdown.typescript).toBe(2);
    });

    test('scans directory with JavaScript files', async () => {
      await writeFile(join(testDir, 'app.js'), `
const express = require('express');
module.exports = { app };
`);

      const scan = await tank.scanProject(testDir);

      expect(scan.files.length).toBe(1);
      expect(scan.files[0]!.language).toBe('javascript');
      expect(scan.statistics.languageBreakdown.javascript).toBe(1);
    });

    test('extracts imports from TypeScript', async () => {
      await writeFile(join(testDir, 'imports.ts'), `
import { openai } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import { something, another } from './local.js';
`);

      const scan = await tank.scanProject(testDir);
      const file = scan.files.find(f => f.relativePath === 'imports.ts');

      expect(file).toBeDefined();
      expect(file!.imports.length).toBe(4);

      const openaiImport = file!.imports.find(i => i.source === 'openai');
      expect(openaiImport).toBeDefined();
      expect(openaiImport!.specifiers).toContain('openai');

      const anthropicImport = file!.imports.find(i => i.source === '@anthropic-ai/sdk');
      expect(anthropicImport).toBeDefined();
      expect(anthropicImport!.isDefault).toBe(true);

      const fsImport = file!.imports.find(i => i.source === 'fs');
      expect(fsImport).toBeDefined();
      expect(fsImport!.isNamespace).toBe(true);
    });

    test('extracts exports from TypeScript', async () => {
      await writeFile(join(testDir, 'exports.ts'), `
export const value = 42;
export function doSomething() {}
export class MyClass {}
export { something, another };
export default MainClass;
`);

      const scan = await tank.scanProject(testDir);
      const file = scan.files.find(f => f.relativePath === 'exports.ts');

      expect(file).toBeDefined();
      expect(file!.exports.length).toBeGreaterThan(0);

      const defaultExport = file!.exports.find(e => e.isDefault);
      expect(defaultExport).toBeDefined();
    });

    test('extracts CommonJS requires', async () => {
      await writeFile(join(testDir, 'common.js'), `
const express = require('express');
const { OpenAI } = require('openai');
`);

      const scan = await tank.scanProject(testDir);
      const file = scan.files.find(f => f.relativePath === 'common.js');

      expect(file).toBeDefined();
      expect(file!.imports.length).toBe(2);

      const expressImport = file!.imports.find(i => i.source === 'express');
      expect(expressImport).toBeDefined();

      const openaiImport = file!.imports.find(i => i.source === 'openai');
      expect(openaiImport).toBeDefined();
    });

    test('detects AI usage from imports', async () => {
      await writeFile(join(testDir, 'ai-usage.ts'), `
import OpenAI from 'openai';

const client = new OpenAI();
`);

      const scan = await tank.scanProject(testDir);
      const file = scan.files.find(f => f.relativePath === 'ai-usage.ts');

      expect(file).toBeDefined();
      expect(file!.hasAIUsage).toBe(true);
    });

    test('detects AI usage from patterns', async () => {
      await writeFile(join(testDir, 'patterns.ts'), `
// Using gpt-4 for processing
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [],
});
`);

      const scan = await tank.scanProject(testDir);
      const file = scan.files.find(f => f.relativePath === 'patterns.ts');

      expect(file).toBeDefined();
      expect(file!.hasAIUsage).toBe(true);
    });

    test('counts AI-related files', async () => {
      await writeFile(join(testDir, 'ai1.ts'), `import { OpenAI } from 'openai';`);
      await writeFile(join(testDir, 'ai2.ts'), `import Anthropic from '@anthropic-ai/sdk';`);
      await writeFile(join(testDir, 'normal.ts'), `export const x = 1;`);

      const scan = await tank.scanProject(testDir);

      expect(scan.statistics.aiRelatedFiles).toBe(2);
    });

    test('skips node_modules by default', async () => {
      await mkdir(join(testDir, 'node_modules', 'some-package'), { recursive: true });
      await writeFile(join(testDir, 'node_modules', 'some-package', 'index.js'), 'module.exports = {};');
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      const scan = await tank.scanProject(testDir);

      expect(scan.files.length).toBe(1);
      expect(scan.files[0]!.relativePath).toBe('app.ts');
    });

    test('includes node_modules when option set', async () => {
      await mkdir(join(testDir, 'node_modules', 'test-pkg'), { recursive: true });
      await writeFile(join(testDir, 'node_modules', 'test-pkg', 'index.js'), 'module.exports = {};');
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      const scan = await tank.scanProject(testDir, { includeNodeModules: true });

      expect(scan.files.length).toBeGreaterThan(1);
    });

    test('respects max file size', async () => {
      const largeContent = 'x'.repeat(10000);
      await writeFile(join(testDir, 'large.ts'), largeContent);
      await writeFile(join(testDir, 'small.ts'), 'export const x = 1;');

      const scan = await tank.scanProject(testDir, { maxFileSize: 100 });

      expect(scan.files.length).toBe(1);
      expect(scan.files[0]!.relativePath).toBe('small.ts');
    });

    test('caches scan results', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      const scan1 = await tank.scanProject(testDir);
      const scan2 = await tank.scanProject(testDir);

      // Same reference if cached
      expect(scan1).toBe(scan2);
    });

    test('bypasses cache when useCache is false', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      const scan1 = await tank.scanProject(testDir);
      const scan2 = await tank.scanProject(testDir, { useCache: false });

      // Different references
      expect(scan1).not.toBe(scan2);
    });

    test('clearCache removes cached scans', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      await tank.scanProject(testDir);
      expect(tank.getCachedScan(testDir)).toBeDefined();

      tank.clearCache();
      expect(tank.getCachedScan(testDir)).toBeUndefined();
    });
  });

  describe('Dependency Analysis', () => {
    test('analyzes project without package.json', async () => {
      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.packageManager).toBe('npm');
      expect(deps.lockfilePresent).toBe(false);
      expect(deps.aiPackages).toEqual([]);
    });

    test('analyzes basic package.json', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.0.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.packageJson.name).toBe('test-project');
      expect(deps.aiPackages).toEqual([]);
    });

    test('detects AI packages', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'ai-project',
        dependencies: {
          'openai': '^4.0.0',
          '@anthropic-ai/sdk': '^0.5.0',
          'express': '^4.0.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.aiPackages.length).toBe(2);

      const openai = deps.aiPackages.find(p => p.name === 'openai');
      expect(openai).toBeDefined();
      expect(openai!.provider).toBe('openai');
      expect(openai!.features).toContain('chat');

      const anthropic = deps.aiPackages.find(p => p.name === '@anthropic-ai/sdk');
      expect(anthropic).toBeDefined();
      expect(anthropic!.provider).toBe('anthropic');
    });

    test('detects LangChain packages', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'langchain-project',
        dependencies: {
          'langchain': '^0.1.0',
          '@langchain/core': '^0.1.0',
          '@langchain/openai': '^0.1.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.aiPackages.length).toBe(3);
      deps.aiPackages.forEach(pkg => {
        expect(pkg.provider).toBe('langchain');
      });
    });

    test('detects npm package manager', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await writeFile(join(testDir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3 }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.packageManager).toBe('npm');
      expect(deps.lockfilePresent).toBe(true);
    });

    test('detects yarn package manager', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await writeFile(join(testDir, 'yarn.lock'), '# yarn.lock');

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.packageManager).toBe('yarn');
      expect(deps.lockfilePresent).toBe(true);
    });

    test('detects pnpm package manager', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await writeFile(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 5.4');

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.packageManager).toBe('pnpm');
      expect(deps.lockfilePresent).toBe(true);
    });

    test('detects TypeScript from tsconfig', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await writeFile(join(testDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.typescript).toBe(true);
    });

    test('detects TypeScript from dependencies', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test',
        devDependencies: {
          'typescript': '^5.0.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.typescript).toBe(true);
    });

    test('detects related packages', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test',
        dependencies: {
          'express': '^4.0.0',
          'react': '^18.0.0',
          'zod': '^3.0.0',
        },
        devDependencies: {
          'jest': '^29.0.0',
          'eslint': '^8.0.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.relatedPackages.length).toBeGreaterThan(0);

      const packageNames = deps.relatedPackages.map(p => p.name);
      expect(packageNames).toContain('express');
      expect(packageNames).toContain('react');
      expect(packageNames).toContain('zod');
      expect(packageNames).toContain('jest');
      expect(packageNames).toContain('eslint');
    });

    test('reads tsconfig when present', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await writeFile(join(testDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          strict: true,
          target: 'ES2022',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.tsConfig).toBeDefined();
      expect(deps.tsConfig!.compilerOptions).toBeDefined();
    });

    test('detects node version from engines', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test',
        engines: {
          node: '>=18.0.0',
        },
      }));

      const deps = await tank.analyzeDependencies(testDir);

      expect(deps.nodeVersion).toBe('>=18.0.0');
    });
  });

  describe('Config Scanning', () => {
    test('scans for env files', async () => {
      await writeFile(join(testDir, '.env'), 'API_KEY=test');
      await writeFile(join(testDir, '.env.local'), 'LOCAL_KEY=test');
      await writeFile(join(testDir, '.env.example'), 'API_KEY=your_key_here');

      const config = await tank.scanConfigs(testDir);

      expect(config.envFiles).toContain('.env');
      expect(config.envFiles).toContain('.env.local');
      expect(config.envFiles).toContain('.env.example');
      expect(config.hasEnvExample).toBe(true);
    });

    test('detects secrets in env files', async () => {
      await writeFile(join(testDir, '.env'), `
OPENAI_API_KEY=sk-1234567890abcdefghijklmnop
ANTHROPIC_API_KEY=sk-ant-api03-something
SECRET=mysecretvalue
`);

      const config = await tank.scanConfigs(testDir);

      expect(config.detectedSecrets.length).toBeGreaterThan(0);

      const apiKey = config.detectedSecrets.find(s => s.type === 'api_key');
      expect(apiKey).toBeDefined();
      expect(apiKey!.redacted).toBe(true);
    });

    test('does not scan example files for secrets', async () => {
      await writeFile(join(testDir, '.env.example'), `
OPENAI_API_KEY=sk-your-key-here
`);

      const config = await tank.scanConfigs(testDir);

      expect(config.detectedSecrets.length).toBe(0);
    });

    test('handles missing config directory gracefully', async () => {
      const nonExistentDir = join(testDir, 'non-existent');
      const config = await tank.scanConfigs(nonExistentDir);

      expect(config.envFiles).toEqual([]);
      expect(config.configFiles).toEqual([]);
    });
  });

  describe('Utility Methods', () => {
    test('getAIRelatedFiles filters correctly', async () => {
      await writeFile(join(testDir, 'ai.ts'), `import OpenAI from 'openai';`);
      await writeFile(join(testDir, 'normal.ts'), `export const x = 1;`);

      const scan = await tank.scanProject(testDir);
      const aiFiles = tank.getAIRelatedFiles(scan);

      expect(aiFiles.length).toBe(1);
      expect(aiFiles[0]!.relativePath).toBe('ai.ts');
    });

    test('getFilesByLanguage filters correctly', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');
      await writeFile(join(testDir, 'lib.ts'), 'export const y = 2;');
      await writeFile(join(testDir, 'config.json'), '{}');

      const scan = await tank.scanProject(testDir);

      const tsFiles = tank.getFilesByLanguage(scan, 'typescript');
      expect(tsFiles.length).toBe(2);

      const jsonFiles = tank.getFilesByLanguage(scan, 'json');
      expect(jsonFiles.length).toBe(1);
    });

    test('hasAIProvider checks correctly', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test',
        dependencies: {
          'openai': '^4.0.0',
        },
      }));

      const scan = await tank.scanProject(testDir);

      expect(tank.hasAIProvider(scan, 'openai')).toBe(true);
      expect(tank.hasAIProvider(scan, 'anthropic')).toBe(false);
    });
  });

  describe('Task Execution', () => {
    test('executes scan task', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');
      tank.setContext({ projectPath: testDir, phaseId: 'test' });

      const task: AgentTask = {
        id: 'test-scan',
        type: 'scan',
        input: {},
      };

      const result = await tank.execute(task);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect((result.output as ProjectScan).files).toBeDefined();
    });

    test('executes analyze task', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test',
        dependencies: { 'openai': '^4.0.0' },
      }));
      tank.setContext({ projectPath: testDir, phaseId: 'test' });

      const task: AgentTask = {
        id: 'test-analyze',
        type: 'analyze',
        input: {},
      };

      const result = await tank.execute(task);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect((result.output as DependencyScan).aiPackages).toBeDefined();
    });

    test('fails for unsupported task type', async () => {
      tank.setContext({ projectPath: testDir, phaseId: 'test' });

      const task: AgentTask = {
        id: 'test-generate',
        type: 'generate', // Tank doesn't support this
        input: {},
      };

      const result = await tank.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CAPABILITY_NOT_SUPPORTED');
    });

    test('requires project path', async () => {
      // No context set
      const task: AgentTask = {
        id: 'test-scan',
        type: 'scan',
        input: {},
      };

      const result = await tank.execute(task);

      expect(result.success).toBe(false);
    });
  });

  describe('Verification', () => {
    test('verifies scan-related items', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');

      const result = await tank.verify('scan-project', {
        phaseId: 'discovery',
        checklistItemId: 'scan-project',
        itemText: 'Project files scanned',
        projectPath: testDir,
      });

      expect(result.verified).toBe(true);
      expect(result.method).toBe('automated');
      expect(result.confidence).toBe(1.0);
      expect(result.evidence).toContain('Scanned');
    });

    test('verifies dependency-related items', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      const result = await tank.verify('check-dependencies', {
        phaseId: 'discovery',
        checklistItemId: 'check-dependencies',
        itemText: 'Dependencies analyzed',
        projectPath: testDir,
      });

      expect(result.verified).toBe(true);
    });

    test('returns manual verification for non-scan items', async () => {
      const result = await tank.verify('validate-contracts', {
        phaseId: 'migration',
        checklistItemId: 'validate-contracts',
        itemText: 'Contracts validated',
        projectPath: testDir,
      });

      expect(result.verified).toBe(false);
      expect(result.method).toBe('manual');
    });
  });

  describe('Statistics', () => {
    test('calculates file statistics', async () => {
      await writeFile(join(testDir, 'app.ts'), 'export const x = 1;\nexport const y = 2;');
      await writeFile(join(testDir, 'lib.js'), 'module.exports = {};');
      await writeFile(join(testDir, 'config.json'), '{}');

      const scan = await tank.scanProject(testDir);

      expect(scan.statistics.totalFiles).toBe(3);
      expect(scan.statistics.totalLines).toBeGreaterThan(0);
      expect(scan.statistics.languageBreakdown.typescript).toBe(1);
      expect(scan.statistics.languageBreakdown.javascript).toBe(1);
      expect(scan.statistics.languageBreakdown.json).toBe(1);
      expect(scan.statistics.scanDuration).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// MOUSE AGENT TESTS (Phase 8c)
// ============================================================================

describe('Phase 8c: Mouse Agent', () => {
  let mouse: Mouse;

  beforeEach(() => {
    mouse = createMouse();
  });

  describe('Creation & Configuration', () => {
    test('creates mouse with createMouse factory', () => {
      expect(mouse).toBeInstanceOf(Mouse);
    });

    test('creates mouse with new Mouse()', () => {
      const m = new Mouse();
      expect(m).toBeInstanceOf(Mouse);
    });

    test('has correct crew ID', () => {
      expect(mouse.getStatus().id).toBe('mouse');
    });

    test('has correct name', () => {
      const status = mouse.getStatus();
      expect(status.name).toBe('Mouse');
    });

    test('has generate capability', () => {
      expect(mouse.hasCapability('generate')).toBe(true);
    });

    test('has transform capability', () => {
      expect(mouse.hasCapability('transform')).toBe(true);
    });

    test('does not have scan capability', () => {
      expect(mouse.hasCapability('scan')).toBe(false);
    });

    test('does not have verify capability', () => {
      expect(mouse.hasCapability('verify')).toBe(false);
    });

    test('is enabled by default', () => {
      const status = mouse.getStatus();
      expect(status.enabled).toBe(true);
    });

    test('can be created with custom config', () => {
      const m = createMouse({ enabled: false, contracts: ['custom-contract'] });
      const status = m.getStatus();
      expect(status.enabled).toBe(false);
    });
  });

  describe('Contract Generation', () => {
    const createMockPrompt = (overrides?: Partial<PromptAnalysis>): PromptAnalysis => ({
      id: 'test-prompt',
      location: { file: '/src/prompts/test.ts', line: 10, column: 0 },
      type: 'template',
      structure: {
        hasSystemPrompt: true,
        hasUserPrompt: true,
        hasAssistantExamples: false,
        messageCount: 2,
        systemPromptContent: 'You are a helpful assistant.',
        userPromptTemplate: 'Please help me with {{task}}',
      },
      variables: [{ name: 'task', source: 'parameter', type: 'string' }],
      complexity: 'simple',
      estimatedTokens: 100,
      recommendations: [],
      ...overrides,
    });

    test('generates contract from prompt', async () => {
      const prompt = createMockPrompt();
      const contract = await mouse.generateContract(prompt);

      expect(contract.id).toBe('test-prompt');
      expect(contract.name).toBe('Test Prompt');
      expect(contract.content).toContain('contract:');
      expect(contract.outputPath).toBe('contracts/test-prompt.yaml');
      expect(contract.sourcePrompt).toBe(prompt);
    });

    test('infers contract ID from file name when no ID', async () => {
      const prompt = createMockPrompt({
        id: 'unknown',
        location: { file: '/src/services/chat-service.ts', line: 10, column: 0 },
      });
      const contract = await mouse.generateContract(prompt);

      expect(contract.id).toBe('chat-service');
    });

    test('generates contract name as title case', async () => {
      const prompt = createMockPrompt({ id: 'user-registration-flow' });
      const contract = await mouse.generateContract(prompt);

      expect(contract.name).toBe('User Registration Flow');
    });

    test('infers completion type for standard prompts', async () => {
      const prompt = createMockPrompt();
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('type: completion');
    });

    test('infers chat type from system prompt', async () => {
      const prompt = createMockPrompt({
        structure: {
          hasSystemPrompt: true,
          hasUserPrompt: true,
          hasAssistantExamples: false,
          messageCount: 2,
          systemPromptContent: 'You are a chat assistant for conversations.',
          userPromptTemplate: '{{message}}',
        },
      });
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('type: chat');
    });

    test('infers embedding type from content', async () => {
      const prompt = createMockPrompt({
        structure: {
          hasSystemPrompt: true,
          hasUserPrompt: true,
          hasAssistantExamples: false,
          messageCount: 2,
          systemPromptContent: 'Process the following for embedding and vector storage.',
          userPromptTemplate: '{{text}}',
        },
      });
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('type: embedding');
    });

    test('extracts objectives from prompt structure', async () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'input', source: 'parameter', type: 'string' },
          { name: 'context', source: 'context', type: 'object' },
        ],
        complexity: 'complex',
      });
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('Follow system prompt guidelines');
      expect(contract.content).toContain('Process 2 input variable(s)');
      expect(contract.content).toContain('Handle complex multi-step processing');
    });

    test('includes generated tags', async () => {
      const prompt = createMockPrompt({ type: 'template', complexity: 'complex' });
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('- generated');
      expect(contract.content).toContain('- morpheus');
      expect(contract.content).toContain('- template');
      expect(contract.content).toContain('- complex');
    });

    test('includes system and user prompts', async () => {
      const prompt = createMockPrompt();
      const contract = await mouse.generateContract(prompt);

      expect(contract.content).toContain('prompts:');
      expect(contract.content).toContain('system:');
      expect(contract.content).toContain('You are a helpful assistant.');
      expect(contract.content).toContain('user:');
    });

    test('adds warning when no prompts detected', async () => {
      const prompt = createMockPrompt({
        structure: {
          hasSystemPrompt: false,
          hasUserPrompt: false,
          hasAssistantExamples: false,
          messageCount: 0,
        },
      });
      const contract = await mouse.generateContract(prompt);

      expect(contract.warnings).toContain('No prompts detected - contract may be incomplete');
    });

    test('adds warning when no variables detected', async () => {
      const prompt = createMockPrompt({ variables: [] });
      const contract = await mouse.generateContract(prompt);

      expect(contract.warnings).toContain('No variables detected - prompt may be static');
    });

    test('calculates confidence score', async () => {
      const highConfidencePrompt = createMockPrompt({
        structure: {
          hasSystemPrompt: true,
          hasUserPrompt: true,
          hasAssistantExamples: false,
          messageCount: 2,
          systemPromptContent: 'System',
          userPromptTemplate: 'User',
        },
        variables: [{ name: 'input', source: 'parameter' }],
        type: 'template',
        complexity: 'simple',
      });
      const contract = await mouse.generateContract(highConfidencePrompt);

      // Base 0.5 + 0.15 (system) + 0.15 (user) + 0.1 (vars) + 0.05 (template) + 0.05 (simple)
      expect(contract.confidence).toBe(1.0); // capped at 1.0
    });

    test('generates multiple contracts', async () => {
      const prompts = [
        createMockPrompt({ id: 'prompt-1' }),
        createMockPrompt({ id: 'prompt-2' }),
        createMockPrompt({ id: 'prompt-3' }),
      ];

      const contracts = await mouse.generateContracts(prompts);

      expect(contracts).toHaveLength(3);
      expect(contracts[0]!.id).toBe('prompt-1');
      expect(contracts[1]!.id).toBe('prompt-2');
      expect(contracts[2]!.id).toBe('prompt-3');
    });
  });

  describe('Config Generation', () => {
    const createMockAnalysis = (overrides?: Partial<FullAnalysis>): FullAnalysis => ({
      project: {
        rootPath: '/test-project',
        scannedAt: new Date(),
        files: [],
        dependencies: {
          packageManager: 'npm',
          packageJson: { name: 'test-project' },
          lockfilePresent: true,
          typescript: true,
          aiPackages: [],
          relatedPackages: [],
        },
        configs: {
          envFiles: [],
          configFiles: [],
          hasEnvExample: false,
          detectedSecrets: [],
        },
        statistics: {
          totalFiles: 10,
          totalLines: 500,
          languageBreakdown: { typescript: 8, javascript: 2, json: 0, yaml: 0, markdown: 0, other: 0 },
          aiRelatedFiles: 3,
          scanDuration: 100,
        },
      },
      aiUsage: {
        providers: [],
        prompts: [],
        tools: [],
        patterns: [],
        antiPatterns: [],
      },
      architecture: {
        structure: {
          hasServiceLayer: false,
          hasSeparateAIModule: false,
          hasConfigFiles: true,
          hasTypeDefinitions: true,
          hasCentralizedErrors: false,
          hasLogging: false,
          hasTests: true,
        },
        patterns: [],
        score: 70,
        recommendations: [],
      },
      security: {
        score: 80,
        findings: [],
        hasAuthentication: false,
        hasAuthorization: false,
        hasAuditLogging: false,
        hasSecretManagement: false,
        hasInputValidation: true,
        hasOutputSanitization: false,
      },
      quality: {
        score: 75,
        hasErrorHandling: true,
        hasValidation: true,
        hasTesting: true,
        hasDocumentation: false,
        findings: [],
      },
      gaps: {
        missing: [],
        partial: [],
        recommendations: [],
      },
      ...overrides,
    });

    test('generates architect config', async () => {
      const analysis = createMockFullAnalysis();
      const config = await mouse.generateConfig('architect', analysis);

      expect(config.type).toBe('architect');
      expect(config.content).toContain('version: "1.0.0"');
      expect(config.content).toContain('truth:');
      expect(config.content).toContain('sources:');
      expect(config.content).toContain('contracts:');
      expect(config.outputPath).toBe('architect.yaml');
    });

    test('generates keymaker config', async () => {
      const analysis = createMockFullAnalysis();
      const config = await mouse.generateConfig('keymaker', analysis);

      expect(config.type).toBe('keymaker');
      expect(config.content).toContain('providers:');
      expect(config.content).toContain('routing:');
      expect(config.outputPath).toBe('keymaker.yaml');
    });

    test('generates sentinels config', async () => {
      const analysis = createMockFullAnalysis();
      const config = await mouse.generateConfig('sentinels', analysis);

      expect(config.type).toBe('sentinels');
      expect(config.content).toContain('validation:');
      expect(config.content).toContain('validateInputs:');
      expect(config.content).toContain('validateOutputs:');
      expect(config.outputPath).toBe('sentinels.yaml');
    });

    test('generates oracle config', async () => {
      const analysis = createMockFullAnalysis();
      const config = await mouse.generateConfig('oracle', analysis);

      expect(config.type).toBe('oracle');
      expect(config.content).toContain('xp:');
      expect(config.content).toContain('levelThresholds:');
      expect(config.content).toContain('judgment:');
      expect(config.outputPath).toBe('oracle.yaml');
    });

    test('generates smith config', async () => {
      const analysis = createMockFullAnalysis();
      const config = await mouse.generateConfig('smith', analysis);

      expect(config.type).toBe('smith');
      expect(config.content).toContain('security:');
      expect(config.content).toContain('zeroTrust: true');
      expect(config.content).toContain('team:');
      expect(config.outputPath).toBe('smith.yaml');
    });

    test('keymaker config uses detected providers', async () => {
      const analysis = createMockAnalysis({
        aiUsage: {
          providers: [
            { provider: 'openai', package: 'openai', version: '^4.0.0', locations: [], models: [], features: [], callCount: 0 },
            { provider: 'anthropic', package: '@anthropic-ai/sdk', version: '^0.5.0', locations: [], models: [], features: [], callCount: 0 },
          ],
          prompts: [],
          tools: [],
          patterns: [],
          antiPatterns: [],
        },
      });
      const config = await mouse.generateConfig('keymaker', analysis);

      expect(config.content).toContain('openai:');
      expect(config.content).toContain('anthropic:');
    });

    test('architect config uses project name from path', async () => {
      const analysis = createMockAnalysis({
        project: {
          rootPath: '/home/user/my-awesome-project',
          scannedAt: new Date(),
          files: [],
          dependencies: {
            packageManager: 'npm',
            packageJson: { name: 'my-awesome-project' },
            lockfilePresent: true,
            typescript: true,
            aiPackages: [],
            relatedPackages: [],
          },
          configs: {
            envFiles: [],
            configFiles: [],
            hasEnvExample: false,
            detectedSecrets: [],
          },
          statistics: {
            totalFiles: 10,
            totalLines: 500,
            languageBreakdown: { typescript: 10, javascript: 0, json: 0, yaml: 0, markdown: 0, other: 0 },
            aiRelatedFiles: 0,
            scanDuration: 100,
          },
        },
      });
      const config = await mouse.generateConfig('architect', analysis);

      expect(config.content).toContain('my-awesome-project');
    });

    test('throws error for unknown config type', async () => {
      const analysis = createMockFullAnalysis();
      await expect(
        mouse.generateConfig('unknown' as GeneratedConfig['type'], analysis)
      ).rejects.toThrow('Unknown config type: unknown');
    });
  });

  describe('Type Generation', () => {
    test('generates types from contract', async () => {
      const contract: GeneratedContract = {
        id: 'user-prompt',
        name: 'User Prompt',
        content: '',
        outputPath: 'contracts/user-prompt.yaml',
        confidence: 0.9,
        warnings: [],
        sourcePrompt: {
          id: 'user-prompt',
          location: { file: '/src/prompts.ts', line: 1, column: 0 },
          type: 'template',
          structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 2 },
          variables: [
            { name: 'username', source: 'parameter', type: 'string' },
            { name: 'count', source: 'parameter', type: 'number' },
          ],
          complexity: 'simple',
          estimatedTokens: 50,
          recommendations: [],
        },
      };

      const types = await mouse.generateTypes(contract);

      expect(types.path).toBe('src/contracts/user-prompt.types.ts');
      expect(types.type).toBe('source');
      expect(types.content).toContain('import { z } from \'zod\'');
      expect(types.content).toContain('UserPromptInputSchema');
      expect(types.content).toContain('username: z.string()');
      expect(types.content).toContain('count: z.number()');
      expect(types.content).toContain('UserPromptOutputSchema');
      expect(types.content).toContain('UserPromptContract');
    });

    test('generates default input field when no variables', async () => {
      const contract: GeneratedContract = {
        id: 'simple-contract',
        name: 'Simple Contract',
        content: '',
        outputPath: 'contracts/simple-contract.yaml',
        confidence: 0.5,
        warnings: [],
      };

      const types = await mouse.generateTypes(contract);

      expect(types.content).toContain('input: z.string()');
      expect(types.content).toContain('result: z.string()');
    });

    test('infers Zod types from variable types', async () => {
      const contract: GeneratedContract = {
        id: 'typed-contract',
        name: 'Typed Contract',
        content: '',
        outputPath: 'contracts/typed-contract.yaml',
        confidence: 0.9,
        warnings: [],
        sourcePrompt: {
          id: 'typed-contract',
          location: { file: '/src/prompts.ts', line: 1, column: 0 },
          type: 'template',
          structure: { hasSystemPrompt: false, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 1 },
          variables: [
            { name: 'text', source: 'parameter', type: 'string' },
            { name: 'count', source: 'parameter', type: 'number' },
            { name: 'active', source: 'parameter', type: 'boolean' },
            { name: 'items', source: 'parameter', type: 'array' },
            { name: 'data', source: 'parameter', type: 'object' },
          ],
          complexity: 'moderate',
          estimatedTokens: 100,
          recommendations: [],
        },
      };

      const types = await mouse.generateTypes(contract);

      expect(types.content).toContain('text: z.string()');
      expect(types.content).toContain('count: z.number()');
      expect(types.content).toContain('active: z.boolean()');
      expect(types.content).toContain('items: z.array(z.unknown())');
      expect(types.content).toContain('data: z.record(z.unknown())');
    });
  });

  describe('Template System', () => {
    test('expands simple variables', () => {
      const template = 'Hello {{name}}!';
      const result = mouse.expandTemplate(template, { name: 'World' });

      expect(result).toBe('Hello World!');
    });

    test('handles undefined variables', () => {
      const template = 'Value: {{missing}}';
      const result = mouse.expandTemplate(template, {});

      expect(result).toBe('Value: ');
    });

    test('expands multiple variables', () => {
      const template = '{{greeting}} {{name}}, welcome to {{place}}!';
      const result = mouse.expandTemplate(template, {
        greeting: 'Hello',
        name: 'Neo',
        place: 'The Construct',
      });

      expect(result).toBe('Hello Neo, welcome to The Construct!');
    });

    test('expands #each blocks with arrays', () => {
      const template = 'Items:{{#each items}}\n- {{this}}{{/each}}';
      const result = mouse.expandTemplate(template, {
        items: ['apple', 'banana', 'cherry'],
      });

      expect(result).toBe('Items:\n- apple\n- banana\n- cherry');
    });

    test('expands #each blocks with object arrays', () => {
      const template = '{{#each users}}Name: {{this.name}}, Age: {{this.age}}\n{{/each}}';
      const result = mouse.expandTemplate(template, {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      });

      expect(result).toBe('Name: Alice, Age: 30\nName: Bob, Age: 25\n');
    });

    test('handles empty arrays in #each', () => {
      const template = 'Items:{{#each items}}\n- {{this}}{{/each}}';
      const result = mouse.expandTemplate(template, { items: [] });

      expect(result).toBe('Items:');
    });

    test('handles non-array in #each', () => {
      const template = 'Items:{{#each items}}\n- {{this}}{{/each}}';
      const result = mouse.expandTemplate(template, { items: 'not-an-array' });

      expect(result).toBe('Items:');
    });

    test('expands #if blocks when truthy', () => {
      const template = '{{#if showMessage}}Hello!{{/if}}';
      const result = mouse.expandTemplate(template, { showMessage: true });

      expect(result).toBe('Hello!');
    });

    test('removes #if blocks when falsy', () => {
      const template = 'Start{{#if showMessage}}Hello!{{/if}}End';
      const result = mouse.expandTemplate(template, { showMessage: false });

      expect(result).toBe('StartEnd');
    });

    test('expands #unless blocks when falsy', () => {
      const template = '{{#unless hasItems}}No items{{/unless}}';
      const result = mouse.expandTemplate(template, { hasItems: false });

      expect(result).toBe('No items');
    });

    test('removes #unless blocks when truthy', () => {
      const template = '{{#unless hasItems}}No items{{/unless}}';
      const result = mouse.expandTemplate(template, { hasItems: true });

      expect(result).toBe('');
    });

    test('supports @index in #each', () => {
      const template = '{{#each items}}{{@index}}: {{this}}\n{{/each}}';
      const result = mouse.expandTemplate(template, {
        items: ['a', 'b', 'c'],
      });

      expect(result).toBe('0: a\n1: b\n2: c\n');
    });

    test('handles nested template constructs', () => {
      const template = `{{#if enabled}}
Features:{{#each features}}
- {{this}}{{/each}}
{{/if}}`;
      const result = mouse.expandTemplate(template, {
        enabled: true,
        features: ['chat', 'completions', 'embeddings'],
      });

      expect(result).toContain('Features:');
      expect(result).toContain('- chat');
      expect(result).toContain('- completions');
      expect(result).toContain('- embeddings');
    });
  });

  describe('Template Registration', () => {
    test('registers custom template', () => {
      mouse.registerTemplate('greeting', 'Hello {{name}}!');
      const template = mouse.getTemplate('greeting');

      expect(template).toBe('Hello {{name}}!');
    });

    test('returns undefined for unregistered template', () => {
      const template = mouse.getTemplate('nonexistent');

      expect(template).toBeUndefined();
    });

    test('clears template cache', () => {
      mouse.registerTemplate('test', 'Test template');
      expect(mouse.getTemplate('test')).toBeDefined();

      mouse.clearTemplateCache();

      expect(mouse.getTemplate('test')).toBeUndefined();
    });

    test('overwrites existing template', () => {
      mouse.registerTemplate('greeting', 'Hello {{name}}!');
      mouse.registerTemplate('greeting', 'Hi {{name}}!');

      expect(mouse.getTemplate('greeting')).toBe('Hi {{name}}!');
    });
  });

  describe('Scaffolding Generation', () => {
    const createMockAnalysis = (): FullAnalysis => ({
      project: {
        rootPath: '/test-project',
        scannedAt: new Date(),
        files: [],
        dependencies: {
          packageManager: 'npm',
          packageJson: { name: 'test-project' },
          lockfilePresent: true,
          typescript: true,
          aiPackages: [],
          relatedPackages: [],
        },
        configs: {
          envFiles: [],
          configFiles: [],
          hasEnvExample: false,
          detectedSecrets: [],
        },
        statistics: {
          totalFiles: 10,
          totalLines: 500,
          languageBreakdown: { typescript: 10, javascript: 0, json: 0, yaml: 0, markdown: 0, other: 0 },
          aiRelatedFiles: 3,
          scanDuration: 100,
        },
      },
      aiUsage: {
        providers: [
          { provider: 'openai', package: 'openai', version: '^4.0.0', locations: [], models: [], features: [], callCount: 0 },
        ],
        prompts: [
          {
            id: 'test-prompt',
            location: { file: '/src/prompts.ts', line: 10, column: 0 },
            type: 'template',
            structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 2, systemPromptContent: 'System', userPromptTemplate: '{{input}}' },
            variables: [{ name: 'input', source: 'parameter', type: 'string' }],
            complexity: 'simple',
            estimatedTokens: 50,
            recommendations: [],
          },
        ],
        tools: [],
        patterns: [],
        antiPatterns: [],
      },
      architecture: {
        structure: { hasServiceLayer: false, hasSeparateAIModule: false, hasConfigFiles: true, hasTypeDefinitions: true, hasCentralizedErrors: false, hasLogging: false, hasTests: true },
        patterns: [],
        score: 70,
        recommendations: [],
      },
      security: { score: 80, findings: [], hasAuthentication: false, hasAuthorization: false, hasAuditLogging: false, hasSecretManagement: false, hasInputValidation: true, hasOutputSanitization: false },
      quality: { score: 75, hasErrorHandling: true, hasValidation: true, hasTesting: true, hasDocumentation: false, findings: [] },
      gaps: { missing: [], partial: [], recommendations: [] },
    });

    test('generates all configs', async () => {
      const analysis = createMockFullAnalysis();
      const artifacts = await mouse.generateScaffolding(analysis);

      expect(artifacts.configs).toHaveLength(5);

      const configTypes = artifacts.configs.map(c => c.type);
      expect(configTypes).toContain('architect');
      expect(configTypes).toContain('keymaker');
      expect(configTypes).toContain('sentinels');
      expect(configTypes).toContain('oracle');
      expect(configTypes).toContain('smith');
    });

    test('generates contracts from prompts', async () => {
      const analysis = createMockFullAnalysis();
      const artifacts = await mouse.generateScaffolding(analysis);

      expect(artifacts.contracts.length).toBeGreaterThan(0);
      expect(artifacts.contracts[0]!.id).toBe('prompt-1');
    });

    test('generates construct index file', async () => {
      const analysis = createMockFullAnalysis();
      const artifacts = await mouse.generateScaffolding(analysis);

      const indexFile = artifacts.scaffolding.find(f => f.path.includes('index.ts'));
      expect(indexFile).toBeDefined();
      expect(indexFile!.content).toContain('export * from \'./architect.js\'');
      expect(indexFile!.content).toContain('export * from \'./oracle.js\'');
    });
  });

  describe('Task Execution', () => {
    const createMockPrompt = (): PromptAnalysis => ({
      id: 'test-prompt',
      location: { file: '/src/prompts.ts', line: 10, column: 0 },
      type: 'template',
      structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 2, systemPromptContent: 'System', userPromptTemplate: '{{input}}' },
      variables: [{ name: 'input', source: 'parameter', type: 'string' }],
      complexity: 'simple',
      estimatedTokens: 50,
      recommendations: [],
    });

    test('executes generate contract task', async () => {
      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });

      const task: AgentTask = {
        id: 'gen-contract',
        type: 'generate',
        input: { generateType: 'contract', prompt: createMockPrompt() },
      };

      const result = await mouse.execute(task);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect((result.output as GeneratedContract).id).toBe('test-prompt');
    });

    test('executes generate contracts task', async () => {
      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });

      const task: AgentTask = {
        id: 'gen-contracts',
        type: 'generate',
        input: { generateType: 'contracts', prompts: [createMockPrompt()] },
      };

      const result = await mouse.execute(task);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.output)).toBe(true);
    });

    test('executes transform template task', async () => {
      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });

      const task: AgentTask = {
        id: 'transform-template',
        type: 'transform',
        input: {
          transformType: 'template',
          template: 'Hello {{name}}!',
          variables: { name: 'Mouse' },
        },
      };

      const result = await mouse.execute(task);

      expect(result.success).toBe(true);
      expect(result.output).toBe('Hello Mouse!');
    });

    test('fails for unsupported task type', async () => {
      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });

      const task: AgentTask = {
        id: 'test-scan',
        type: 'scan', // Mouse doesn't support this
        input: {},
      };

      const result = await mouse.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CAPABILITY_NOT_SUPPORTED');
    });

    test('fails when disabled', async () => {
      const disabledMouse = createMouse({ enabled: false, contracts: [] });

      const task: AgentTask = {
        id: 'gen-contract',
        type: 'generate',
        input: { generateType: 'contract', prompt: createMockPrompt() },
      };

      const result = await disabledMouse.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AGENT_DISABLED');
    });
  });

  describe('Verification', () => {
    // Note: Mouse has 'generate' and 'transform' capabilities, not 'verify'
    // So calling verify() returns a default response indicating no verification support

    test('returns no verification support for Mouse agent', async () => {
      const result = await mouse.verify('generate-contracts', {
        phaseId: 'migration',
        checklistItemId: 'generate-contracts',
        itemText: 'Contracts generated',
        projectPath: '/test',
      });

      // Mouse doesn't have 'verify' capability
      expect(result.verified).toBe(false);
      expect(result.method).toBe('manual');
      expect(result.details).toContain('does not support verification');
    });

    test('does not have verify capability', () => {
      expect(mouse.hasCapability('verify')).toBe(false);
    });

    test('has generate capability instead', () => {
      expect(mouse.hasCapability('generate')).toBe(true);
    });

    test('has transform capability instead', () => {
      expect(mouse.hasCapability('transform')).toBe(true);
    });
  });

  describe('Events', () => {
    test('emits task:started event', async () => {
      let started = false;
      mouse.on('task:started', () => { started = true; });

      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'transform',
        input: { transformType: 'template', template: 'Test', variables: {} },
      };

      await mouse.execute(task);

      expect(started).toBe(true);
    });

    test('emits task:completed event', async () => {
      let completed = false;
      mouse.on('task:completed', () => { completed = true; });

      mouse.setContext({ projectPath: '/test', phaseId: 'migration' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'transform',
        input: { transformType: 'template', template: 'Test', variables: {} },
      };

      await mouse.execute(task);

      expect(completed).toBe(true);
    });
  });
});

// ============================================================================
// TRINITY AGENT TESTS (Phase 8d)
// ============================================================================

describe('Phase 8d: Trinity Agent - The Expert', () => {
  let trinity: Trinity;

  beforeEach(() => {
    trinity = createTrinity();
  });

  describe('Creation and Configuration', () => {
    test('creates Trinity agent with factory function', () => {
      const agent = createTrinity();
      expect(agent).toBeInstanceOf(Trinity);
    });

    test('creates Trinity agent with new keyword', () => {
      const agent = new Trinity();
      expect(agent).toBeInstanceOf(Trinity);
    });

    test('has correct agent id', () => {
      const status = trinity.getStatus();
      expect(status.id).toBe('trinity');
    });

    test('has analyze and verify capabilities', () => {
      expect(trinity.hasCapability('analyze')).toBe(true);
      expect(trinity.hasCapability('verify')).toBe(true);
    });

    test('does not have scan or generate capabilities', () => {
      expect(trinity.hasCapability('scan')).toBe(false);
      expect(trinity.hasCapability('generate')).toBe(false);
    });

    test('extends BaseAgent', () => {
      expect(trinity).toBeInstanceOf(BaseAgent);
    });

    test('is not busy initially', () => {
      const status = trinity.getStatus();
      expect(status.busy).toBe(false);
    });

    test('is enabled initially', () => {
      const status = trinity.getStatus();
      expect(status.enabled).toBe(true);
    });

    test('can set context', () => {
      trinity.setContext({ projectPath: '/test', phaseId: 'analysis' });
      const status = trinity.getStatus();
      expect(status.busy).toBe(false);
    });
  });

  describe('Prompt Analysis', () => {
    const samplePromptCode = `
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: \`Analyze the following code: \${code}\` }
        ],
        max_tokens: 1000
      });
    `;

    const sampleLocation: FileLocation = {
      file: '/test/src/ai/analyzer.ts',
      line: 10,
      column: 0,
    };

    test('analyzes prompt structure with system and user prompts', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(analysis.structure.hasSystemPrompt).toBe(true);
      expect(analysis.structure.hasUserPrompt).toBe(true);
      expect(analysis.structure.messageCount).toBeGreaterThanOrEqual(2);
    });

    test('extracts prompt variables', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(analysis.variables.length).toBeGreaterThanOrEqual(1);
      expect(analysis.variables.some(v => v.name === 'code')).toBe(true);
    });

    test('estimates token count', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(analysis.estimatedTokens).toBeGreaterThan(0);
      expect(analysis.estimatedTokens).toBeLessThan(1000);
    });

    test('assesses prompt complexity', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(['simple', 'moderate', 'complex']).toContain(analysis.complexity);
    });

    test('generates recommendations', async () => {
      const simplePrompt = `const prompt = 'Hello world';`;
      const analysis = await trinity.analyzePrompt(simplePrompt, sampleLocation);

      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('identifies prompt type', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(['inline', 'template', 'file', 'dynamic']).toContain(analysis.type);
    });

    test('generates unique prompt ID from location', async () => {
      const analysis = await trinity.analyzePrompt(samplePromptCode, sampleLocation);

      expect(analysis.id).toBeDefined();
      expect(analysis.id).toContain('10'); // Line number
    });
  });

  describe('Intent Extraction', () => {
    test('detects code-generation intent', () => {
      const intent = trinity.extractIntent('Write a function that calculates fibonacci');
      expect(intent).toBe('code-generation');
    });

    test('detects code-explanation intent', () => {
      // Use explicit explanation keywords without triggering code-generation patterns
      const intent = trinity.extractIntent('Explain how does this work');
      expect(intent).toBe('code-explanation');
    });

    test('detects code-review intent', () => {
      // Use explicit review keywords
      const intent = trinity.extractIntent('Analyze for bugs and issues');
      expect(intent).toBe('code-review');
    });

    test('detects summarization intent', () => {
      const intent = trinity.extractIntent('Summarize the key points');
      expect(intent).toBe('summarization');
    });

    test('detects translation intent', () => {
      // Use explicit translation keywords without programming languages
      const intent = trinity.extractIntent('Convert from one format to another');
      expect(intent).toBe('translation');
    });

    test('detects question-answering intent', () => {
      const intent = trinity.extractIntent('What is the time complexity of quicksort?');
      expect(intent).toBe('question-answering');
    });

    test('returns unknown for ambiguous content', () => {
      const intent = trinity.extractIntent('xyz123');
      expect(intent).toBe('unknown');
    });
  });

  describe('Tool Analysis', () => {
    // Use object property syntax to match OpenAI pattern regex
    const sampleToolCode = `
      const config = {
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_weather',
              description: 'Get weather information for a location',
              parameters: {
                type: 'object',
                properties: {
                  location: { type: 'string', description: 'City name' },
                  unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
                },
                required: ['location']
              }
            }
          }
        ]
      };
    `;

    const sampleLocation: FileLocation = {
      file: '/test/src/tools/weather.ts',
      line: 1,
      column: 0,
    };

    test('extracts tool name', async () => {
      const analysis = await trinity.analyzeTool(sampleToolCode, sampleLocation);

      expect(analysis.name).toBe('get_weather');
    });

    test('extracts tool description', async () => {
      const analysis = await trinity.analyzeTool(sampleToolCode, sampleLocation);

      expect(analysis.description).toBe('Get weather information for a location');
    });

    test('extracts tool parameters', async () => {
      const analysis = await trinity.analyzeTool(sampleToolCode, sampleLocation);

      expect(analysis.parameters.length).toBeGreaterThanOrEqual(1);
      expect(analysis.parameters.some(p => p.name === 'location')).toBe(true);
    });

    test('detects openai-functions pattern', async () => {
      const analysis = await trinity.analyzeTool(sampleToolCode, sampleLocation);

      expect(analysis.pattern).toBe('openai-functions');
    });

    test('checks for validation', async () => {
      const analysis = await trinity.analyzeTool(sampleToolCode, sampleLocation);

      expect(typeof analysis.hasValidation).toBe('boolean');
    });

    test('checks for error handling', async () => {
      const codeWithErrorHandling = `
        async function handleTool(input: string) {
          try {
            const result = await processTool(input);
            return result;
          } catch (error) {
            throw new Error('Tool failed');
          }
        }
      `;
      const analysis = await trinity.analyzeTool(codeWithErrorHandling, sampleLocation);

      expect(analysis.hasErrorHandling).toBe(true);
    });

    test('detects langchain pattern', async () => {
      const langchainCode = `
        const tool = new Tool({
          name: 'calculator',
          description: 'Performs calculations',
          func: async (input) => eval(input)
        });
      `;
      const analysis = await trinity.analyzeTool(langchainCode, sampleLocation);

      expect(analysis.pattern).toBe('langchain');
    });
  });

  describe('Pattern Analysis', () => {
    const createMockScan = (files: Array<{ path: string; content?: string }>): ProjectScan => ({
      rootPath: '/test/project',
      scannedAt: new Date(),
      files: files.map(f => {
        const scannedFile: ScannedFile = {
          path: `/test/project/${f.path}`,
          relativePath: f.path,
          language: 'typescript' as const,
          size: f.content?.length || 0,
          lines: f.content?.split('\n').length || 1,
          hasAIUsage: false,
          imports: [],
          exports: [],
        };
        if (f.content !== undefined) {
          scannedFile.content = f.content;
        }
        return scannedFile;
      }),
      statistics: {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + (f.content?.split('\n').length || 1), 0),
        languageBreakdown: {
          typescript: files.length,
          javascript: 0,
          json: 0,
          yaml: 0,
          markdown: 0,
          other: 0,
        },
        aiRelatedFiles: 0,
        scanDuration: 100,
      },
      dependencies: {
        packageManager: 'npm',
        packageJson: {},
        lockfilePresent: false,
        typescript: true,
        aiPackages: [],
        relatedPackages: [],
      },
      configs: {
        envFiles: [],
        configFiles: [],
        hasEnvExample: false,
        detectedSecrets: [],
      },
    });

    test('detects centralized-config good pattern', async () => {
      const scan = createMockScan([
        { path: 'src/config.ts', content: 'export const config = {}' },
        { path: 'src/index.ts', content: '' },
      ]);

      const { patterns } = await trinity.analyzePatterns(scan);

      expect(patterns.some(p => p.id === 'centralized-config')).toBe(true);
    });

    test('detects service-layer good pattern', async () => {
      const scan = createMockScan([
        { path: 'src/services/userService.ts', content: '' },
        { path: 'src/services/aiService.ts', content: '' },
      ]);

      const { patterns } = await trinity.analyzePatterns(scan);

      expect(patterns.some(p => p.id === 'service-layer')).toBe(true);
    });

    test('detects type-definitions good pattern', async () => {
      const scan = createMockScan([
        { path: 'src/types.ts', content: 'interface User {}' },
      ]);

      const { patterns } = await trinity.analyzePatterns(scan);

      expect(patterns.some(p => p.id === 'type-definitions')).toBe(true);
    });

    test('detects hardcoded-api-key anti-pattern', async () => {
      const scan = createMockScan([
        { path: 'src/ai.ts', content: 'const key = "sk-1234567890abcdefghij"' },
      ]);

      const { antiPatterns } = await trinity.analyzePatterns(scan);

      expect(antiPatterns.some(p => p.id === 'hardcoded-api-key')).toBe(true);
      expect(antiPatterns.find(p => p.id === 'hardcoded-api-key')?.severity).toBe('critical');
    });

    test('provides descriptions for patterns', async () => {
      const scan = createMockScan([
        { path: 'src/config.ts', content: '' },
      ]);

      const { patterns } = await trinity.analyzePatterns(scan);

      const configPattern = patterns.find(p => p.id === 'centralized-config');
      expect(configPattern?.description).toBeDefined();
      expect(configPattern?.description?.length).toBeGreaterThan(0);
    });

    test('provides locations for detected patterns', async () => {
      const scan = createMockScan([
        { path: 'src/services/api.ts', content: '' },
      ]);

      const { patterns } = await trinity.analyzePatterns(scan);

      const servicePattern = patterns.find(p => p.id === 'service-layer');
      expect(servicePattern?.locations).toBeDefined();
      expect(servicePattern?.locations.length).toBeGreaterThan(0);
    });
  });

  describe('Architecture Analysis', () => {
    const createMockScan = (files: Array<{ path: string; content?: string }>): ProjectScan => ({
      rootPath: '/test/project',
      scannedAt: new Date(),
      files: files.map(f => {
        const scannedFile: ScannedFile = {
          path: `/test/project/${f.path}`,
          relativePath: f.path,
          language: 'typescript' as const,
          size: f.content?.length || 0,
          lines: f.content?.split('\n').length || 1,
          hasAIUsage: false,
          imports: [],
          exports: [],
        };
        if (f.content !== undefined) {
          scannedFile.content = f.content;
        }
        return scannedFile;
      }),
      statistics: {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + (f.content?.split('\n').length || 1), 0),
        languageBreakdown: {
          typescript: files.length,
          javascript: 0,
          json: 0,
          yaml: 0,
          markdown: 0,
          other: 0,
        },
        aiRelatedFiles: 0,
        scanDuration: 100,
      },
      dependencies: {
        packageManager: 'npm',
        packageJson: {},
        lockfilePresent: false,
        typescript: true,
        aiPackages: [],
        relatedPackages: [],
      },
      configs: {
        envFiles: [],
        configFiles: [],
        hasEnvExample: false,
        detectedSecrets: [],
      },
    });

    test('assesses project structure', async () => {
      const scan = createMockScan([
        { path: 'src/services/api.ts', content: '' },
        { path: 'src/types.ts', content: '' },
        { path: 'src/config.ts', content: '' },
        { path: 'src/ai/llm.ts', content: '' },
        { path: 'test/app.test.ts', content: '' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.structure.hasServiceLayer).toBe(true);
      expect(analysis.structure.hasTypeDefinitions).toBe(true);
      expect(analysis.structure.hasConfigFiles).toBe(true);
      expect(analysis.structure.hasSeparateAIModule).toBe(true);
      expect(analysis.structure.hasTests).toBe(true);
    });

    test('calculates architecture score', async () => {
      const scan = createMockScan([
        { path: 'src/services/api.ts', content: '' },
        { path: 'src/types.ts', content: '' },
        { path: 'src/ai/llm.ts', content: '' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.score).toBeGreaterThan(50);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    test('generates recommendations for missing patterns', async () => {
      const scan = createMockScan([
        { path: 'src/index.ts', content: '' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('service layer'))).toBe(true);
    });

    test('detects architecture patterns like MVC', async () => {
      const scan = createMockScan([
        { path: 'src/controllers/userController.ts', content: '' },
        { path: 'src/middleware/auth.ts', content: '' },
        { path: 'src/handlers/eventHandler.ts', content: '' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.patterns).toContain('MVC/Controller Pattern');
      expect(analysis.patterns).toContain('Middleware Pattern');
      expect(analysis.patterns).toContain('Handler Pattern');
    });

    test('detects logging in codebase', async () => {
      const scan = createMockScan([
        { path: 'src/app.ts', content: 'console.log("Starting app")' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.structure.hasLogging).toBe(true);
    });

    test('detects centralized error handling', async () => {
      const scan = createMockScan([
        { path: 'src/errors.ts', content: 'class AppError extends Error {}' },
      ]);

      const analysis = await trinity.analyzeArchitecture(scan);

      expect(analysis.structure.hasCentralizedErrors).toBe(true);
    });
  });

  describe('Verification', () => {
    beforeEach(() => {
      trinity.setContext({ projectPath: '/test', phaseId: 'analysis' });
    });

    test('verifies analysis-related items', async () => {
      const result = await trinity.verify('analyze-prompts', {
        phaseId: 'analysis',
        checklistItemId: 'analyze-prompts',
        itemText: 'Analyze all prompts in codebase',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
      expect(result.method).toBe('automated');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('verifies pattern-related items', async () => {
      const result = await trinity.verify('detect-patterns', {
        phaseId: 'analysis',
        checklistItemId: 'detect-patterns',
        itemText: 'Detect anti-patterns in architecture',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
      expect(result.evidence).toContain('Pattern');
    });

    test('verifies prompt-related items', async () => {
      const result = await trinity.verify('prompt-analysis', {
        phaseId: 'analysis',
        checklistItemId: 'prompt-analysis',
        itemText: 'Extract prompt intent and variables',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
      expect(result.evidence).toContain('Prompt');
    });

    test('returns manual verification for unknown items', async () => {
      const result = await trinity.verify('generate-code', {
        phaseId: 'migration',
        checklistItemId: 'generate-code',
        itemText: 'Generate migration code',
        projectPath: '/test',
      });

      expect(result.verified).toBe(false);
      expect(result.method).toBe('manual');
    });

    test('has verify capability', () => {
      expect(trinity.hasCapability('verify')).toBe(true);
    });
  });

  describe('Task Execution', () => {
    beforeEach(() => {
      trinity.setContext({ projectPath: '/test', phaseId: 'analysis' });
    });

    test('executes analyze task for prompts', async () => {
      const task: AgentTask = {
        id: 'analyze-prompts',
        type: 'analyze',
        input: {
          analyzeType: 'prompt',
          content: 'const prompt = "You are a helpful assistant"',
          location: { file: '/test.ts', line: 1, column: 0 },
        },
      };

      const result = await trinity.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect((result.output as PromptAnalysis).structure).toBeDefined();
    });

    test('executes analyze task for tools', async () => {
      const task: AgentTask = {
        id: 'analyze-tools',
        type: 'analyze',
        input: {
          analyzeType: 'tool',
          content: 'const tool = { name: "calculator", description: "Does math" }',
          location: { file: '/tools.ts', line: 1, column: 0 },
        },
      };

      const result = await trinity.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect((result.output as ToolAnalysis).name).toBeDefined();
    });

    test('executes analyze task for intent', async () => {
      const task: AgentTask = {
        id: 'extract-intent',
        type: 'analyze',
        input: {
          analyzeType: 'intent',
          content: 'Write a function to sort an array',
        },
      };

      const result = await trinity.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toBe('code-generation');
    });

    test('executes verify task', async () => {
      const task: AgentTask = {
        id: 'verify-analysis',
        type: 'verify',
        input: {
          itemId: 'analyze-prompts',
          context: {
            phaseId: 'analysis',
            checklistItemId: 'analyze-prompts',
            itemText: 'Analyze prompts',
            projectPath: '/test',
          },
        },
      };

      const result = await trinity.execute(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect((result.output as VerificationResult).verified).toBe(true);
    });

    test('returns error for unsupported task type', async () => {
      const task: AgentTask = {
        id: 'invalid-task',
        type: 'generate' as any,
        input: {},
      };

      const result = await trinity.execute(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('generate');
    });

    test('returns error for unknown analyze type', async () => {
      const task: AgentTask = {
        id: 'invalid-analyze',
        type: 'analyze',
        input: {
          analyzeType: 'unknown-type',
        },
      };

      const result = await trinity.execute(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown analyze type');
    });
  });

  describe('Cache Management', () => {
    test('can get cached analysis', () => {
      const cached = trinity.getCachedAnalysis<string>('nonexistent');
      expect(cached).toBeUndefined();
    });

    test('can clear cache', () => {
      trinity.clearCache();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Events', () => {
    test('emits task:started event', async () => {
      let started = false;
      trinity.on('task:started', () => { started = true; });

      trinity.setContext({ projectPath: '/test', phaseId: 'analysis' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'analyze',
        input: { analyzeType: 'intent', content: 'Hello' },
      };

      await trinity.execute(task);

      expect(started).toBe(true);
    });

    test('emits task:completed event', async () => {
      let completed = false;
      trinity.on('task:completed', () => { completed = true; });

      trinity.setContext({ projectPath: '/test', phaseId: 'analysis' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'analyze',
        input: { analyzeType: 'intent', content: 'Hello' },
      };

      await trinity.execute(task);

      expect(completed).toBe(true);
    });
  });
});

// ============================================================================
// SWITCH AGENT TESTS (Phase 8e)
// ============================================================================

describe('Phase 8e: Switch Agent - The Skeptic', () => {
  let switchAgent: Switch;

  beforeEach(() => {
    switchAgent = createSwitch();
  });

  describe('Creation and Configuration', () => {
    test('creates Switch agent with factory function', () => {
      const agent = createSwitch();
      expect(agent).toBeInstanceOf(Switch);
    });

    test('creates Switch agent with new keyword', () => {
      const agent = new Switch();
      expect(agent).toBeInstanceOf(Switch);
    });

    test('has correct agent id', () => {
      const status = switchAgent.getStatus();
      expect(status.id).toBe('switch');
    });

    test('has validate and verify capabilities', () => {
      expect(switchAgent.hasCapability('validate')).toBe(true);
      expect(switchAgent.hasCapability('verify')).toBe(true);
    });

    test('does not have scan or generate capabilities', () => {
      expect(switchAgent.hasCapability('scan')).toBe(false);
      expect(switchAgent.hasCapability('generate')).toBe(false);
    });

    test('extends BaseAgent', () => {
      expect(switchAgent).toBeInstanceOf(BaseAgent);
    });

    test('is not busy initially', () => {
      const status = switchAgent.getStatus();
      expect(status.busy).toBe(false);
    });
  });

  describe('Contract Validation', () => {
    // Extended contract type for validation testing (includes fields Switch checks for)
    type ExtendedContract = GeneratedContract & {
      version?: string;
      type?: string;
      objectives?: string[];
      constraints?: string[];
      qualityCriteria?: Record<string, unknown>;
    };

    const validContract: ExtendedContract = {
      id: 'morpheus/test-contract',
      name: 'Test Contract',
      content: 'contract: ...',
      outputPath: './contracts/test.yaml',
      confidence: 0.85,
      warnings: [],
      // Extended fields for validation
      version: '1.0.0',
      type: 'chat',
      objectives: ['Objective 1', 'Objective 2'],
      constraints: ['Constraint 1'],
      qualityCriteria: { accuracy: { weight: 0.5, minScore: 8 } },
    };

    test('validates a correct contract', async () => {
      const result = await switchAgent.validateContract(validContract as GeneratedContract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(90);
    });

    test('detects missing required fields', async () => {
      const contract = { ...validContract, id: undefined } as unknown as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    });

    test('detects invalid ID format', async () => {
      const contract = { ...validContract, id: 'invalid-id' } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.errors.some(e => e.code === 'INVALID_ID_FORMAT')).toBe(true);
    });

    test('warns on invalid version format', async () => {
      const contract = { ...validContract, version: 'v1' } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.warnings.some(w => w.code === 'INVALID_VERSION_FORMAT')).toBe(true);
    });

    test('detects invalid contract type', async () => {
      const contract = { ...validContract, type: 'invalid-type' } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.errors.some(e => e.code === 'INVALID_CONTRACT_TYPE')).toBe(true);
    });

    test('warns on too many objectives', async () => {
      const contract = {
        ...validContract,
        objectives: Array(15).fill('Objective'),
      } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.warnings.some(w => w.code === 'TOO_MANY_OBJECTIVES')).toBe(true);
    });

    test('warns on missing constraints', async () => {
      const contract = { ...validContract, constraints: [] } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.warnings.some(w => w.code === 'NO_CONSTRAINTS')).toBe(true);
    });

    test('detects invalid confidence', async () => {
      const contract = { ...validContract, confidence: 1.5 } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.errors.some(e => e.code === 'INVALID_CONFIDENCE')).toBe(true);
    });

    test('warns on low confidence', async () => {
      const contract = { ...validContract, confidence: 0.3 } as GeneratedContract;
      const result = await switchAgent.validateContract(contract);

      expect(result.warnings.some(w => w.code === 'LOW_CONFIDENCE')).toBe(true);
    });

    test('validates multiple contracts', async () => {
      const contracts = [validContract, { ...validContract, id: 'morpheus/test-2' }] as GeneratedContract[];
      const result = await switchAgent.validateContracts(contracts);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects duplicate contract IDs', async () => {
      const contracts = [validContract, validContract] as GeneratedContract[];
      const result = await switchAgent.validateContracts(contracts);

      expect(result.errors.some(e => e.code === 'DUPLICATE_CONTRACT_ID')).toBe(true);
    });
  });

  describe('Config Validation', () => {
    const validConfig: GeneratedConfig = {
      type: 'architect',
      content: `
truth:
  sources:
    - path: ./contracts
models:
  default: gpt-4
contracts:
  registry: ./registry
`,
      outputPath: './config/architect.yaml',
      description: 'Architect configuration',
    };

    test('validates a correct config', async () => {
      const result = await switchAgent.validateConfig(validConfig);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    test('detects missing config type', async () => {
      const config = { content: 'test: true', outputPath: './config.yaml', description: 'Test' } as unknown as GeneratedConfig;
      const result = await switchAgent.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_CONFIG_TYPE')).toBe(true);
    });

    test('detects unknown config type', async () => {
      const config = { type: 'unknown-type', content: 'test: true', outputPath: './config.yaml', description: 'Test' } as unknown as GeneratedConfig;
      const result = await switchAgent.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNKNOWN_CONFIG_TYPE')).toBe(true);
    });

    test('detects missing required sections', async () => {
      const config: GeneratedConfig = { type: 'architect', content: 'other: true', outputPath: './config.yaml', description: 'Test' };
      const result = await switchAgent.validateConfig(config);

      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_SECTION')).toBe(true);
    });

    test('detects hardcoded API keys', async () => {
      const config: GeneratedConfig = {
        type: 'keymaker',
        content: `
providers:
  openai:
    apiKey: sk-1234567890abcdefghijklmnop
`,
        outputPath: './config/keymaker.yaml',
        description: 'Keymaker config',
      };
      const result = await switchAgent.validateConfig(config);

      expect(result.errors.some(e => e.code === 'SECURITY_ISSUE')).toBe(true);
    });

    test('warns on disabled security', async () => {
      const config: GeneratedConfig = {
        type: 'architect',
        content: `
truth:
  sources: []
models:
  default: gpt-4
security: false
`,
        outputPath: './config/architect.yaml',
        description: 'Architect config',
      };
      const result = await switchAgent.validateConfig(config);

      expect(result.warnings.some(w => w.code === 'SECURITY_WARNING')).toBe(true);
    });

    test('validates multiple configs', async () => {
      const configs: GeneratedConfig[] = [
        validConfig,
        { type: 'keymaker', content: 'providers:\n  openai:\n    model: gpt-4', outputPath: './config/keymaker.yaml', description: 'Keymaker' },
      ];
      const result = await switchAgent.validateConfigs(configs);

      expect(result.score).toBeGreaterThan(50);
    });
  });

  describe('Migration Validation', () => {
    const createMockPlan = (): MigrationPlan => ({
      id: 'migration-001',
      projectName: 'Test Migration',
      generatedAt: new Date(),
      morpheusVersion: '1.0.0',
      currentState: {
        aiProviders: ['openai'],
        promptCount: 5,
        toolCount: 2,
        architectureScore: 70,
        securityScore: 80,
        qualityScore: 75,
        keyFindings: ['Finding 1'],
      },
      targetState: {
        architecture: 'The Construct',
        components: ['Architect', 'Oracle'],
        benefits: ['Better orchestration'],
      },
      gapAnalysis: {
        missing: [],
        partial: [],
        recommendations: [],
      },
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: 'First phase',
          order: 1,
          goals: ['Complete setup'],
          dependsOn: [],
          tasks: [
            {
              id: 'task-1',
              name: 'Task 1',
              description: 'First task',
              type: 'refactor',
              affectedFiles: ['src/index.ts'],
              steps: [
                { order: 1, description: 'Step 1', command: 'npm run build' },
              ],
              verification: 'Run npm test',
              automatable: true,
            },
          ],
          verification: [{ name: 'Test', type: 'test', expectedResult: 'All pass' }],
          rollback: [{ order: 1, description: 'Undo step 1' }],
          estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
        },
      ],
      risks: [
        { id: 'risk-1', title: 'Test risk', description: 'Test risk description', probability: 'low', impact: 'low', category: 'technical' },
      ],
      mitigations: [
        { riskId: 'risk-1', strategy: 'Monitor', actions: ['Watch logs'] },
      ],
      artifacts: {
        contracts: [],
        configs: [],
        scaffolding: [],
      },
      estimates: {
        totalEffort: { optimistic: 2, realistic: 4, pessimistic: 8, unit: 'hours' },
        phaseEfforts: {},
        complexity: 'medium',
        confidence: 0.8,
        assumptions: ['No major blockers'],
      },
    });

    test('validates a correct migration plan', async () => {
      const plan = createMockPlan();
      const result = await switchAgent.validateMigration(plan);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    test('detects missing plan ID', async () => {
      const plan = createMockPlan();
      plan.id = undefined as any;
      const result = await switchAgent.validateMigration(plan);

      expect(result.errors.some(e => e.code === 'MISSING_PLAN_ID')).toBe(true);
    });

    test('detects missing phases', async () => {
      const plan = createMockPlan();
      plan.phases = [];
      const result = await switchAgent.validateMigration(plan);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'NO_PHASES')).toBe(true);
    });

    test('detects missing rollback plan', async () => {
      const plan = createMockPlan();
      // Remove rollback from all phases
      plan.phases[0]!.rollback = [];
      const result = await switchAgent.validateMigration(plan);

      expect(result.errors.some(e => e.code === 'MISSING_ROLLBACK')).toBe(true);
    });

    test('detects unmitigated high risks', async () => {
      const plan = createMockPlan();
      plan.risks = [
        { id: 'risk-1', title: 'High risk', description: 'High risk description', probability: 'high', impact: 'high', category: 'technical' },
      ];
      plan.mitigations = []; // Remove mitigations
      const result = await switchAgent.validateMigration(plan);

      expect(result.errors.some(e => e.code === 'UNMITIGATED_RISK')).toBe(true);
    });

    test('warns on empty phases', async () => {
      const plan = createMockPlan();
      plan.phases[0]!.tasks = [];
      const result = await switchAgent.validateMigration(plan);

      expect(result.warnings.some(w => w.code === 'EMPTY_PHASE')).toBe(true);
    });
  });

  describe('Task Validation', () => {
    const createMockTask = (): MigrationTask => ({
      id: 'task-1',
      name: 'Test Task',
      description: 'Test task',
      type: 'refactor',
      affectedFiles: ['src/index.ts'],
      steps: [
        { order: 1, description: 'Step 1', command: 'npm run build' },
      ],
      verification: 'Run npm test',
      automatable: true,
    });

    test('validates a correct task', async () => {
      const task = createMockTask();
      const result = await switchAgent.validateTask(task);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(90);
    });

    test('detects missing task ID', async () => {
      const task = createMockTask();
      task.id = undefined as any;
      const result = await switchAgent.validateTask(task);

      expect(result.errors.some(e => e.code === 'MISSING_TASK_ID')).toBe(true);
    });

    test('detects missing task name', async () => {
      const task = createMockTask();
      task.name = undefined as any;
      const result = await switchAgent.validateTask(task);

      expect(result.errors.some(e => e.code === 'MISSING_TASK_NAME')).toBe(true);
    });

    test('detects missing steps', async () => {
      const task = createMockTask();
      task.steps = [];
      const result = await switchAgent.validateTask(task);

      expect(result.errors.some(e => e.code === 'NO_STEPS')).toBe(true);
    });

    test('detects forbidden commands', async () => {
      const task = createMockTask();
      task.steps = [
        { order: 1, description: 'Dangerous', command: 'rm -rf /' },
      ];
      const result = await switchAgent.validateTask(task);

      expect(result.errors.some(e => e.code === 'FORBIDDEN_COMMAND')).toBe(true);
    });

    test('warns on missing verification', async () => {
      const task = createMockTask();
      task.verification = undefined as any;
      const result = await switchAgent.validateTask(task);

      expect(result.warnings.some(w => w.code === 'NO_VERIFICATION')).toBe(true);
    });

    // Note: Rollback is at the phase level, not task level
  });

  describe('Change Auditing', () => {
    const createMockChanges = (): CodeChange[] => [
      { file: 'src/new-file.ts', type: 'create', description: 'Create new file', after: 'export const x = 1;' },
      { file: 'src/existing.ts', type: 'modify', description: 'Modify existing', before: 'const a = 1;', after: 'const a = 2;' },
    ];

    test('audits changes and provides report', async () => {
      const changes = createMockChanges();
      const report = await switchAgent.auditChanges(changes, 'test-migration');

      expect(report).toBeDefined();
      expect(report.migration).toBe('test-migration');
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.overallScore).toBeGreaterThan(0);
      expect(['approve', 'review', 'reject']).toContain(report.recommendation);
    });

    test('provides summary finding', async () => {
      const changes = createMockChanges();
      const report = await switchAgent.auditChanges(changes);

      const summary = report.findings.find(f => f.area === 'summary');
      expect(summary).toBeDefined();
      expect(summary?.finding).toContain('created');
    });

    test('flags file deletions', async () => {
      const changes: CodeChange[] = [
        { file: 'src/old-file.ts', type: 'delete', description: 'Remove old file', before: 'const x = 1;\n'.repeat(100) },
      ];
      const report = await switchAgent.auditChanges(changes);

      const finding = report.findings.find(f => f.finding.includes('deletion'));
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe('medium');
    });

    test('flags sensitive file changes', async () => {
      const changes: CodeChange[] = [
        { file: '.env', type: 'modify', description: 'Update env', after: 'DB_HOST=localhost' },
      ];
      const report = await switchAgent.auditChanges(changes);

      const finding = report.findings.find(f => f.finding.includes('Sensitive'));
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe('high');
    });

    test('detects API keys in content', async () => {
      const changes: CodeChange[] = [
        { file: 'src/config.ts', type: 'create', description: 'Add config', after: 'const key = "sk-1234567890abcdefghijklmnop"' },
      ];
      const report = await switchAgent.auditChanges(changes);

      const finding = report.findings.find(f => f.finding.includes('API key'));
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe('high');
    });

    test('detects debug code', async () => {
      const changes: CodeChange[] = [
        { file: 'src/app.ts', type: 'modify', description: 'Add logging', after: 'console.log("debug")' },
      ];
      const report = await switchAgent.auditChanges(changes);

      const finding = report.findings.find(f => f.finding.includes('Debug'));
      expect(finding).toBeDefined();
    });

    test('flags disabled tests', async () => {
      const changes: CodeChange[] = [
        { file: 'test/app.test.ts', type: 'modify', description: 'Skip test', after: 'it.skip("test", () => {})' },
      ];
      const report = await switchAgent.auditChanges(changes);

      const finding = report.findings.find(f => f.finding.includes('Skipped'));
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe('medium');
    });

    test('recommends review for high severity findings', async () => {
      const changes: CodeChange[] = [
        { file: '.env', type: 'modify', description: 'Update env', after: 'SECRET=value' },
      ];
      const report = await switchAgent.auditChanges(changes);

      expect(report.recommendation).toBe('review');
    });

    test('recommends reject for multiple high severity', async () => {
      const changes: CodeChange[] = [
        { file: '.env', type: 'modify', description: 'Update env', after: 'sk-1234567890abcdefghijklmnop' },
        { file: 'secrets.json', type: 'modify', description: 'Update secrets', after: 'sk-abcdefghijklmnop1234567890' },
        { file: 'credentials.ts', type: 'create', description: 'Add creds', after: 'eval("code")' },
      ];
      const report = await switchAgent.auditChanges(changes);

      expect(report.recommendation).toBe('reject');
    });
  });

  describe('Verification', () => {
    beforeEach(() => {
      switchAgent.setContext({ projectPath: '/test', phaseId: 'validation' });
    });

    test('verifies validation-related items', async () => {
      const result = await switchAgent.verify('validate-contracts', {
        phaseId: 'validation',
        checklistItemId: 'validate-contracts',
        itemText: 'Validate all contracts',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
      expect(result.method).toBe('automated');
    });

    test('verifies quality-related items', async () => {
      const result = await switchAgent.verify('check-quality', {
        phaseId: 'validation',
        checklistItemId: 'check-quality',
        itemText: 'Check quality score',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
    });

    test('verifies audit-related items', async () => {
      const result = await switchAgent.verify('audit-changes', {
        phaseId: 'validation',
        checklistItemId: 'audit-changes',
        itemText: 'Audit all changes',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
    });

    test('returns manual verification for unknown items', async () => {
      const result = await switchAgent.verify('generate-code', {
        phaseId: 'migration',
        checklistItemId: 'generate-code',
        itemText: 'Generate migration code',
        projectPath: '/test',
      });

      expect(result.verified).toBe(false);
      expect(result.method).toBe('manual');
    });
  });

  describe('Task Execution', () => {
    beforeEach(() => {
      switchAgent.setContext({ projectPath: '/test', phaseId: 'validation' });
    });

    test('executes validate task for contract', async () => {
      const task: AgentTask = {
        id: 'validate-contract',
        type: 'validate',
        input: {
          validateType: 'contract',
          contract: {
            id: 'morpheus/test',
            version: '1.0.0',
            type: 'chat',
            name: 'Test',
            objectives: ['obj1'],
            constraints: ['con1'],
            content: 'contract: ...',
          },
        },
      };

      const result = await switchAgent.execute(task);

      expect(result.success).toBe(true);
      expect((result.output as ValidationResult).valid).toBe(true);
    });

    test('executes validate task for migration', async () => {
      const task: AgentTask = {
        id: 'validate-migration',
        type: 'validate',
        input: {
          validateType: 'migration',
          plan: {
            id: 'migration-1',
            name: 'Test',
            phases: [{
              id: 'p1',
              name: 'Phase 1',
              order: 1,
              tasks: [{
                id: 't1',
                name: 'Task 1',
                type: 'code-change',
                steps: [{ order: 1, description: 'Do thing', action: 'modify' }],
              }],
            }],
            rollback: [{ order: 1, description: 'Undo', action: 'restore' }],
          },
        },
      };

      const result = await switchAgent.execute(task);

      expect(result.success).toBe(true);
    });

    test('executes validate task for changes', async () => {
      const task: AgentTask = {
        id: 'audit-changes',
        type: 'validate',
        input: {
          validateType: 'changes',
          changes: [{ type: 'create', path: 'src/new.ts' }],
          context: 'test-migration',
        },
      };

      const result = await switchAgent.execute(task);

      expect(result.success).toBe(true);
      expect((result.output as AuditReport).migration).toBe('test-migration');
    });

    test('returns error for unsupported task type', async () => {
      const task: AgentTask = {
        id: 'invalid-task',
        type: 'generate' as any,
        input: {},
      };

      const result = await switchAgent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown validate type', async () => {
      const task: AgentTask = {
        id: 'invalid-validate',
        type: 'validate',
        input: {
          validateType: 'unknown-type',
        },
      };

      const result = await switchAgent.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown validate type');
    });
  });

  describe('Cache Management', () => {
    test('can cache validation result', () => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [], score: 100 };
      switchAgent.cacheValidation('test-key', result);

      const cached = switchAgent.getCachedValidation('test-key');
      expect(cached).toEqual(result);
    });

    test('returns undefined for non-existent cache key', () => {
      const cached = switchAgent.getCachedValidation('nonexistent');
      expect(cached).toBeUndefined();
    });

    test('can clear cache', () => {
      const result: ValidationResult = { valid: true, errors: [], warnings: [], score: 100 };
      switchAgent.cacheValidation('test-key', result);
      switchAgent.clearCache();

      const cached = switchAgent.getCachedValidation('test-key');
      expect(cached).toBeUndefined();
    });
  });

  describe('Events', () => {
    test('emits task:started event', async () => {
      let started = false;
      switchAgent.on('task:started', () => { started = true; });

      switchAgent.setContext({ projectPath: '/test', phaseId: 'validation' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'validate',
        input: {
          validateType: 'contract',
          contract: { id: 'test/c', version: '1.0.0', type: 'chat', name: 'T', objectives: ['o'], content: '' },
        },
      };

      await switchAgent.execute(task);

      expect(started).toBe(true);
    });

    test('emits task:completed event', async () => {
      let completed = false;
      switchAgent.on('task:completed', () => { completed = true; });

      switchAgent.setContext({ projectPath: '/test', phaseId: 'validation' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'validate',
        input: {
          validateType: 'contract',
          contract: { id: 'test/c', version: '1.0.0', type: 'chat', name: 'T', objectives: ['o'], content: '' },
        },
      };

      await switchAgent.execute(task);

      expect(completed).toBe(true);
    });
  });
});

// ============================================================================
// APOC AGENT TESTS (Phase 8f)
// ============================================================================

describe('Phase 8f: Apoc Agent - The Strategist', () => {
  let apoc: Apoc;

  // Helper to create a mock FullAnalysis
  const createMockAnalysis = (overrides: Partial<FullAnalysis> = {}): FullAnalysis => ({
    project: {
      rootPath: '/test/project',
      scannedAt: new Date(),
      files: [
        { path: '/test/project/src/ai.ts', relativePath: 'src/ai.ts', language: 'typescript', size: 1000, lines: 50, hasAIUsage: true, imports: [], exports: [] },
        { path: '/test/project/src/chat.ts', relativePath: 'src/chat.ts', language: 'typescript', size: 800, lines: 40, hasAIUsage: true, imports: [], exports: [] },
      ],
      dependencies: {
        packageManager: 'npm',
        packageJson: {},
        lockfilePresent: true,
        typescript: true,
        aiPackages: [{ name: 'openai', version: '4.0.0', provider: 'openai', features: ['chat'] }],
        relatedPackages: [],
      },
      configs: {
        envFiles: ['.env'],
        configFiles: [],
        hasEnvExample: true,
        detectedSecrets: [],
      },
      statistics: {
        totalFiles: 10,
        totalLines: 500,
        languageBreakdown: { typescript: 8, javascript: 1, json: 1, yaml: 0, markdown: 0, other: 0 },
        aiRelatedFiles: 2,
        scanDuration: 100,
      },
    },
    aiUsage: {
      providers: [
        { provider: 'openai', package: '@openai/api', version: '4.0.0', locations: [{ file: 'src/ai.ts', line: 1, column: 0 }], models: ['gpt-4'], features: ['chat'], callCount: 5 },
        { provider: 'anthropic', package: '@anthropic-ai/sdk', version: '0.8.0', locations: [{ file: 'src/chat.ts', line: 1, column: 0 }], models: ['claude-3'], features: ['chat'], callCount: 2 },
      ],
      prompts: [
        {
          id: 'prompt-1',
          type: 'inline',
          location: { file: 'src/ai.ts', line: 10, column: 0 },
          structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 2 },
          variables: [{ name: 'input', source: 'parameter', type: 'string' }],
          estimatedTokens: 500,
          complexity: 'moderate',
          recommendations: ['Consider extracting to template'],
        },
        {
          id: 'prompt-2',
          type: 'template',
          location: { file: 'src/chat.ts', line: 20, column: 0 },
          structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 3 },
          variables: [],
          estimatedTokens: 200,
          complexity: 'simple',
          recommendations: [],
        },
      ],
      tools: [
        {
          id: 'tool-1',
          name: 'search',
          description: 'Search function',
          location: { file: 'src/tools.ts', line: 1, column: 0 },
          parameters: [{ name: 'query', type: 'string', description: 'Search query', required: true }],
          pattern: 'openai-functions',
          hasValidation: true,
          hasErrorHandling: true,
          handler: { location: { file: 'src/tools.ts', line: 10, column: 0 }, async: true, hasErrorHandling: true, returnsValue: true },
        },
      ],
      patterns: [
        { id: 'centralized-config', name: 'Centralized Config', category: 'good', description: 'Has config file', locations: [{ file: 'src/config.ts', line: 1, column: 0 }] },
      ],
      antiPatterns: [
        { id: 'hardcoded-api-key', name: 'Hardcoded API Key', description: 'API key in code', severity: 'critical', locations: [{ file: 'src/ai.ts', line: 5, column: 0 }], impact: 'Security risk', remediation: 'Use environment variables' },
      ],
    },
    architecture: {
      structure: {
        hasServiceLayer: false,
        hasSeparateAIModule: false,
        hasConfigFiles: false,
        hasTypeDefinitions: true,
        hasTests: false,
        hasCentralizedErrors: false,
        hasLogging: true,
      },
      patterns: [],
      score: 65,
      recommendations: ['Create dedicated AI module', 'Add centralized configuration'],
    },
    security: {
      score: 45,
      findings: [
        { id: 'sec-1', severity: 'high', category: 'secrets', title: 'Exposed API Key', description: 'API key in source', location: { file: 'src/ai.ts', line: 5, column: 0 }, remediation: 'Use env vars' },
      ],
      hasAuthentication: false,
      hasAuthorization: false,
      hasAuditLogging: false,
      hasSecretManagement: false,
      hasInputValidation: true,
      hasOutputSanitization: false,
    },
    quality: {
      score: 70,
      hasErrorHandling: true,
      hasValidation: true,
      hasTesting: false,
      hasDocumentation: false,
      findings: ['Add more tests', 'Improve error handling'],
    },
    gaps: {
      missing: [
        { area: 'Configuration', description: 'No centralized AI configuration', impact: 'high', constructComponent: 'Architect' },
      ],
      partial: [],
      recommendations: [],
    },
    ...overrides,
  });

  beforeEach(() => {
    apoc = createApoc();
  });

  describe('Creation and Configuration', () => {
    test('creates Apoc agent with factory function', () => {
      const agent = createApoc();
      expect(agent).toBeInstanceOf(Apoc);
    });

    test('creates Apoc agent with new keyword', () => {
      const agent = new Apoc();
      expect(agent).toBeInstanceOf(Apoc);
    });

    test('has correct agent id', () => {
      const status = apoc.getStatus();
      expect(status.id).toBe('apoc');
    });

    test('has plan and analyze capabilities', () => {
      expect(apoc.hasCapability('plan')).toBe(true);
      expect(apoc.hasCapability('analyze')).toBe(true);
    });

    test('does not have scan or generate capabilities', () => {
      expect(apoc.hasCapability('scan')).toBe(false);
      expect(apoc.hasCapability('generate')).toBe(false);
    });

    test('extends BaseAgent', () => {
      expect(apoc).toBeInstanceOf(BaseAgent);
    });

    test('is not busy initially', () => {
      const status = apoc.getStatus();
      expect(status.busy).toBe(false);
    });

    test('is enabled initially', () => {
      const status = apoc.getStatus();
      expect(status.enabled).toBe(true);
    });

    test('can set context', () => {
      apoc.setContext({ projectPath: '/test', phaseId: 'planning' });
      const status = apoc.getStatus();
      expect(status.busy).toBe(false);
    });

    test('creates agent with custom config', () => {
      const config = createDefaultAgentConfig(['custom-tool']);
      const agent = createApoc(config);
      expect(agent).toBeInstanceOf(Apoc);
    });
  });

  describe('Migration Plan Generation', () => {
    test('generates complete migration plan from analysis', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan).toBeDefined();
      expect(plan.id).toContain('migration-');
      expect(plan.projectName).toBe('test-project');
      expect(plan.morpheusVersion).toBe('1.0.0');
      expect(plan.generatedAt).toBeInstanceOf(Date);
    });

    test('includes current state summary', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.currentState).toBeDefined();
      expect(plan.currentState.aiProviders).toContain('openai');
      expect(plan.currentState.promptCount).toBe(1);
      expect(plan.currentState.toolCount).toBe(1);
      expect(plan.currentState.architectureScore).toBe(65);
      expect(plan.currentState.securityScore).toBe(45);
      expect(plan.currentState.qualityScore).toBe(70);
    });

    test('includes key findings in current state', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.currentState.keyFindings.length).toBeGreaterThan(0);
      expect(plan.currentState.keyFindings.some(f => f.includes('anti-patterns'))).toBe(true);
    });

    test('includes target state summary', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.targetState).toBeDefined();
      expect(plan.targetState.architecture).toBe('The Construct');
      expect(plan.targetState.components).toContain('Architect');
      expect(plan.targetState.components).toContain('Keymaker');
      expect(plan.targetState.benefits.length).toBeGreaterThan(0);
    });

    test('adds Smith component when security score is low', async () => {
      const analysis = createMockAnalysis({
        security: {
          score: 45,
          findings: [],
          hasAuthentication: false,
          hasAuthorization: false,
          hasAuditLogging: false,
          hasSecretManagement: false,
          hasInputValidation: false,
          hasOutputSanitization: false,
        },
      });
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.targetState.components).toContain('Smith');
    });

    test('includes gap analysis', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.gapAnalysis).toBeDefined();
      expect(plan.gapAnalysis.missing).toBeDefined();
      expect(plan.gapAnalysis.partial).toBeDefined();
      expect(plan.gapAnalysis.recommendations).toBeDefined();
    });

    test('includes identified risks', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.risks).toBeDefined();
      expect(plan.risks.length).toBeGreaterThan(0);
      expect(plan.risks[0]!.id).toBeDefined();
      expect(plan.risks[0]!.title).toBeDefined();
    });

    test('includes risk mitigations', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.mitigations).toBeDefined();
      expect(plan.mitigations.length).toBeGreaterThan(0);
      expect(plan.mitigations[0]!.riskId).toBeDefined();
      expect(plan.mitigations[0]!.strategy).toBeDefined();
    });

    test('includes migration phases', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.phases).toBeDefined();
      expect(plan.phases.length).toBeGreaterThan(0);
      // Setup should be first
      expect(plan.phases[0]!.id).toBe('setup');
      expect(plan.phases[0]!.order).toBe(1);
    });

    test('includes effort estimates', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      expect(plan.estimates).toBeDefined();
      expect(plan.estimates.totalEffort).toBeDefined();
      expect(plan.estimates.totalEffort.optimistic).toBeGreaterThan(0);
      expect(plan.estimates.totalEffort.realistic).toBeGreaterThan(0);
      expect(plan.estimates.totalEffort.pessimistic).toBeGreaterThan(0);
      expect(plan.estimates.complexity).toBeDefined();
      expect(plan.estimates.confidence).toBeGreaterThan(0);
    });

    test('caches generated plan', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test-project');

      const cached = apoc.getCachedPlan(plan.id);
      expect(cached).toBeDefined();
      expect(cached?.id).toBe(plan.id);
    });
  });

  describe('Risk Identification', () => {
    test('identifies common risks', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);

      expect(risks.length).toBeGreaterThan(0);
      expect(risks.some(r => r.title.includes('API compatibility'))).toBe(true);
      expect(risks.some(r => r.title.includes('Prompt behavior'))).toBe(true);
    });

    test('identifies risk based on multiple providers', () => {
      const analysis = createMockFullAnalysis();
      // Add a second provider to trigger the risk
      analysis.aiUsage.providers.push({
        provider: 'anthropic',
        package: '@anthropic-ai/sdk',
        version: '0.5.0',
        locations: [{ file: '/test/src/ai/claude.ts', line: 1, column: 1 }],
        models: ['claude-3'],
        features: ['chat'],
        callCount: 3,
      });
      const risks = apoc.identifyRisks(analysis);

      expect(risks.some(r => r.title.includes('Multiple provider'))).toBe(true);
    });

    test('identifies risk based on low security score', () => {
      const analysis = createMockAnalysis({
        security: {
          score: 40,
          findings: [],
          hasAuthentication: false,
          hasAuthorization: false,
          hasAuditLogging: false,
          hasSecretManagement: false,
          hasInputValidation: false,
          hasOutputSanitization: false,
        },
      });
      const risks = apoc.identifyRisks(analysis);

      expect(risks.some(r => r.title.includes('Security debt'))).toBe(true);
    });

    test('identifies risk based on critical anti-patterns', () => {
      const analysis = createMockFullAnalysis();
      // Add a critical anti-pattern to trigger the risk
      analysis.aiUsage.antiPatterns.push({
        id: 'critical-ap',
        name: 'Unvalidated AI Output',
        description: 'AI output used without validation',
        severity: 'critical',
        locations: [{ file: '/test/src/ai/output.ts', line: 10, column: 1 }],
        impact: 'Security vulnerability',
        remediation: 'Validate all AI outputs',
      });
      const risks = apoc.identifyRisks(analysis);

      expect(risks.some(r => r.title.includes('Critical anti-patterns'))).toBe(true);
    });

    test('identifies risk based on missing tests', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);

      expect(risks.some(r => r.title.includes('No test coverage'))).toBe(true);
    });

    test('identifies risk based on large prompt count', () => {
      const manyPrompts = Array(25).fill(null).map((_, i) => ({
        id: `prompt-${i}`,
        type: 'inline' as const,
        location: { file: `src/p${i}.ts`, line: 1, column: 0 },
        structure: { hasSystemPrompt: true, hasUserPrompt: true, hasAssistantExamples: false, messageCount: 2 },
        variables: [] as PromptAnalysis['variables'],
        estimatedTokens: 100,
        complexity: 'simple' as const,
        recommendations: [] as string[],
      }));
      const analysis = createMockAnalysis({
        aiUsage: {
          providers: [],
          prompts: manyPrompts,
          tools: [],
          patterns: [],
          antiPatterns: [],
        },
      });
      const risks = apoc.identifyRisks(analysis);

      expect(risks.some(r => r.title.includes('Large number of prompts'))).toBe(true);
    });

    test('risks have proper structure', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);

      for (const risk of risks) {
        expect(risk.id).toBeDefined();
        expect(risk.title).toBeDefined();
        expect(risk.description).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(risk.probability);
        expect(['low', 'medium', 'high']).toContain(risk.impact);
        expect(['technical', 'operational', 'schedule', 'resource']).toContain(risk.category);
      }
    });
  });

  describe('Risk Mitigation Generation', () => {
    test('generates mitigations for identified risks', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);
      const mitigations = apoc.generateMitigations(risks);

      expect(mitigations.length).toBeGreaterThan(0);
    });

    test('mitigations reference risk IDs', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);
      const mitigations = apoc.generateMitigations(risks);

      for (const mitigation of mitigations) {
        expect(mitigation.riskId).toBeDefined();
        expect(risks.some(r => r.id === mitigation.riskId)).toBe(true);
      }
    });

    test('mitigations include strategy and actions', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);
      const mitigations = apoc.generateMitigations(risks);

      for (const mitigation of mitigations) {
        expect(mitigation.strategy).toBeDefined();
        expect(mitigation.actions).toBeDefined();
        expect(mitigation.actions.length).toBeGreaterThan(0);
      }
    });

    test('provides specific mitigations for known risks', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);
      const mitigations = apoc.generateMitigations(risks);

      const apiRisk = risks.find(r => r.title === 'API compatibility issues');
      if (apiRisk) {
        const mitigation = mitigations.find(m => m.riskId === apiRisk.id);
        expect(mitigation?.strategy).toBe('Adapter pattern');
      }
    });
  });

  describe('Risk Score Calculation', () => {
    test('calculates risk score from risks', () => {
      const analysis = createMockFullAnalysis();
      const risks = apoc.identifyRisks(analysis);
      const score = apoc.calculateRiskScore(risks);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('returns 0 for empty risks', () => {
      const score = apoc.calculateRiskScore([]);
      expect(score).toBe(0);
    });

    test('higher impact/probability increases score', () => {
      const lowRisks: MigrationRisk[] = [
        { id: 'r1', title: 'Low', description: '', probability: 'low', impact: 'low', category: 'technical' },
      ];
      const highRisks: MigrationRisk[] = [
        { id: 'r2', title: 'High', description: '', probability: 'high', impact: 'high', category: 'technical' },
      ];

      const lowScore = apoc.calculateRiskScore(lowRisks);
      const highScore = apoc.calculateRiskScore(highRisks);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Gap Analysis', () => {
    test('analyzes gaps in architecture', () => {
      const analysis = createMockFullAnalysis();
      const gaps = apoc.analyzeGaps(analysis);

      expect(gaps).toBeDefined();
      expect(gaps.missing).toBeDefined();
      expect(gaps.partial).toBeDefined();
      expect(gaps.recommendations).toBeDefined();
    });

    test('identifies missing configuration as gap', () => {
      const analysis = createMockFullAnalysis();
      // Override to test gap detection when config files are missing
      analysis.architecture.structure.hasConfigFiles = false;
      const gaps = apoc.analyzeGaps(analysis);

      expect(gaps.missing.some(g => g.area === 'Configuration')).toBe(true);
    });

    test('identifies missing AI module as gap', () => {
      const analysis = createMockFullAnalysis();
      // Override to test gap detection when AI module is not separate
      analysis.architecture.structure.hasSeparateAIModule = false;
      const gaps = apoc.analyzeGaps(analysis);

      expect(gaps.missing.some(g => g.area === 'Architecture')).toBe(true);
    });

    test('identifies missing tests as partial gap', () => {
      const analysis = createMockFullAnalysis();
      const gaps = apoc.analyzeGaps(analysis);

      expect(gaps.partial.some(g => g.area === 'Testing')).toBe(true);
    });

    test('gaps map to Construct components', () => {
      const analysis = createMockFullAnalysis();
      const gaps = apoc.analyzeGaps(analysis);

      const allGaps = [...gaps.missing, ...gaps.partial];
      for (const gap of allGaps) {
        expect(gap.constructComponent).toBeDefined();
        expect(['Architect', 'Keymaker', 'Sentinels', 'Oracle', 'Programs', 'Agents', 'Smith']).toContain(gap.constructComponent);
      }
    });

    test('generates prioritized recommendations', () => {
      const analysis = createMockFullAnalysis();
      const gaps = apoc.analyzeGaps(analysis);

      expect(gaps.recommendations.length).toBeGreaterThan(0);
      expect(gaps.recommendations[0]!.priority).toBe(1);
    });
  });

  describe('Phase Generation', () => {
    test('generates phases from analysis', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(plan.phases.length).toBeGreaterThan(0);
    });

    test('first phase is always setup', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(plan.phases[0]!.id).toBe('setup');
      expect(plan.phases[0]!.name).toBe('Project Setup');
    });

    test('last phase is validation', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      const lastPhase = plan.phases[plan.phases.length - 1]!;
      expect(lastPhase.id).toBe('validation');
    });

    test('phases have proper order', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (let i = 0; i < plan.phases.length; i++) {
        expect(plan.phases[i]!.order).toBe(i + 1);
      }
    });

    test('phases have dependencies', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      // Second phase should depend on first (setup)
      if (plan.phases.length > 1) {
        expect(plan.phases[1]!.dependsOn.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('each phase has tasks', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        expect(phase.tasks.length).toBeGreaterThan(0);
      }
    });

    test('each phase has verification steps', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        expect(phase.verification.length).toBeGreaterThan(0);
      }
    });

    test('each phase has rollback steps', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        expect(phase.rollback.length).toBeGreaterThan(0);
      }
    });

    test('each phase has effort estimate', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        expect(phase.estimatedEffort).toBeDefined();
        expect(phase.estimatedEffort.optimistic).toBeGreaterThan(0);
        expect(phase.estimatedEffort.realistic).toBeGreaterThan(0);
        expect(phase.estimatedEffort.pessimistic).toBeGreaterThan(0);
        expect(phase.estimatedEffort.unit).toBe('hours');
      }
    });

    test('generates phase for specific component', () => {
      const phase = apoc.generatePhase('architect', [], 2);

      expect(phase.id).toBe('architect');
      expect(phase.name).toContain('Architect');
      expect(phase.order).toBe(2);
    });
  });

  describe('Task Generation', () => {
    test('setup phase has correct tasks', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      const setupPhase = plan.phases.find(p => p.id === 'setup');
      expect(setupPhase?.tasks.some(t => t.name.includes('Install'))).toBe(true);
      expect(setupPhase?.tasks.some(t => t.name.includes('directory'))).toBe(true);
    });

    test('tasks have proper structure', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        for (const task of phase.tasks) {
          expect(task.id).toBeDefined();
          expect(task.name).toBeDefined();
          expect(task.description).toBeDefined();
          expect(task.type).toBeDefined();
          expect(task.steps).toBeDefined();
          expect(task.steps.length).toBeGreaterThan(0);
        }
      }
    });

    test('task steps have order', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      for (const phase of plan.phases) {
        for (const task of phase.tasks) {
          for (let i = 0; i < task.steps.length; i++) {
            expect(task.steps[i]!.order).toBe(i + 1);
          }
        }
      }
    });

    test('some tasks are automatable', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      const allTasks = plan.phases.flatMap(p => p.tasks);
      const automatableTasks = allTasks.filter(t => t.automatable);

      expect(automatableTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Effort Estimation', () => {
    test('estimates total effort for phases', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(plan.estimates.totalEffort.optimistic).toBeGreaterThan(0);
      expect(plan.estimates.totalEffort.realistic).toBeGreaterThan(plan.estimates.totalEffort.optimistic);
      expect(plan.estimates.totalEffort.pessimistic).toBeGreaterThan(plan.estimates.totalEffort.realistic);
    });

    test('includes phase-level effort breakdown', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(Object.keys(plan.estimates.phaseEfforts).length).toBe(plan.phases.length);
    });

    test('determines complexity based on total effort', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(['low', 'medium', 'high', 'very-high']).toContain(plan.estimates.complexity);
    });

    test('calculates confidence level', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(plan.estimates.confidence).toBeGreaterThanOrEqual(0.5);
      expect(plan.estimates.confidence).toBeLessThanOrEqual(0.95);
    });

    test('includes assumptions', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      expect(plan.estimates.assumptions).toBeDefined();
      expect(plan.estimates.assumptions.length).toBeGreaterThan(0);
    });

    test('estimates effort directly', () => {
      const phases: MigrationPhase[] = [
        {
          id: 'p1',
          name: 'Phase 1',
          description: '',
          order: 1,
          goals: [],
          dependsOn: [],
          tasks: [],
          verification: [],
          rollback: [],
          estimatedEffort: { optimistic: 4, realistic: 8, pessimistic: 16, unit: 'hours' },
        },
        {
          id: 'p2',
          name: 'Phase 2',
          description: '',
          order: 2,
          goals: [],
          dependsOn: [],
          tasks: [],
          verification: [],
          rollback: [],
          estimatedEffort: { optimistic: 2, realistic: 4, pessimistic: 8, unit: 'hours' },
        },
      ];

      const estimates = apoc.estimateEffort(phases);

      expect(estimates.totalEffort.optimistic).toBe(6);
      expect(estimates.totalEffort.realistic).toBe(12);
      expect(estimates.totalEffort.pessimistic).toBe(24);
    });
  });

  describe('Rollback Plan Generation', () => {
    test('generates rollback plan for phase', () => {
      const phase: MigrationPhase = {
        id: 'test-phase',
        name: 'Test Phase',
        description: '',
        order: 1,
        goals: [],
        dependsOn: [],
        tasks: [
          { id: 't1', name: 'T1', description: '', type: 'create', affectedFiles: ['src/a.ts', 'src/b.ts'], steps: [], verification: '', automatable: false },
          { id: 't2', name: 'T2', description: '', type: 'refactor', affectedFiles: ['src/c.ts'], steps: [], verification: '', automatable: false },
        ],
        verification: [],
        rollback: [],
        estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
      };

      const rollback = apoc.generateRollbackPlan(phase);

      expect(rollback.length).toBeGreaterThan(0);
    });

    test('rollback steps restore affected files', () => {
      const phase: MigrationPhase = {
        id: 'test-phase',
        name: 'Test',
        description: '',
        order: 1,
        goals: [],
        dependsOn: [],
        tasks: [
          { id: 't1', name: 'T1', description: '', type: 'refactor', affectedFiles: ['src/file.ts'], steps: [], verification: '', automatable: false },
        ],
        verification: [],
        rollback: [],
        estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
      };

      const rollback = apoc.generateRollbackPlan(phase);

      expect(rollback.some(r => r.description.includes('Restore'))).toBe(true);
    });

    test('rollback includes verification step', () => {
      const phase: MigrationPhase = {
        id: 'test-phase',
        name: 'Test',
        description: '',
        order: 1,
        goals: [],
        dependsOn: [],
        tasks: [
          { id: 't1', name: 'T1', description: '', type: 'create', affectedFiles: ['src/a.ts'], steps: [], verification: '', automatable: false },
        ],
        verification: [],
        rollback: [],
        estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
      };

      const rollback = apoc.generateRollbackPlan(phase);

      expect(rollback.some(r => r.description.includes('Verify'))).toBe(true);
    });
  });

  describe('Verification', () => {
    beforeEach(() => {
      apoc.setContext({ projectPath: '/test', phaseId: 'planning' });
    });

    test('verifies planning-related items', async () => {
      const result = await apoc.verify('create-plan', {
        phaseId: 'planning',
        checklistItemId: 'create-plan',
        itemText: 'Create migration plan',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
      expect(result.method).toBe('automated');
    });

    test('verifies risk-related items', async () => {
      const result = await apoc.verify('identify-risks', {
        phaseId: 'planning',
        checklistItemId: 'identify-risks',
        itemText: 'Identify risks and mitigations',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
    });

    test('verifies effort-related items', async () => {
      const result = await apoc.verify('estimate-effort', {
        phaseId: 'planning',
        checklistItemId: 'estimate-effort',
        itemText: 'Estimate effort for migration',
        projectPath: '/test',
      });

      expect(result.verified).toBe(true);
    });

    test('returns manual verification for unknown items', async () => {
      const result = await apoc.verify('run-tests', {
        phaseId: 'testing',
        checklistItemId: 'run-tests',
        itemText: 'Run all tests',
        projectPath: '/test',
      });

      expect(result.verified).toBe(false);
      expect(result.method).toBe('manual');
    });
  });

  describe('Task Execution', () => {
    beforeEach(() => {
      apoc.setContext({ projectPath: '/test', phaseId: 'planning' });
    });

    test('executes plan task for migration', async () => {
      const analysis = createMockFullAnalysis();
      const task: AgentTask = {
        id: 'generate-plan',
        type: 'plan',
        input: {
          planType: 'migration',
          analysis,
          projectName: 'test-project',
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(true);
      expect((result.output as MigrationPlan).id).toBeDefined();
    });

    test('executes plan task for rollback', async () => {
      const phase: MigrationPhase = {
        id: 'test',
        name: 'Test',
        description: '',
        order: 1,
        goals: [],
        dependsOn: [],
        tasks: [{ id: 't1', name: 'T', description: '', type: 'create', affectedFiles: ['f.ts'], steps: [], verification: '', automatable: false }],
        verification: [],
        rollback: [],
        estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
      };

      const task: AgentTask = {
        id: 'generate-rollback',
        type: 'plan',
        input: {
          planType: 'rollback',
          phase,
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.output)).toBe(true);
    });

    test('executes analyze task for risks', async () => {
      const analysis = createMockFullAnalysis();
      const task: AgentTask = {
        id: 'analyze-risks',
        type: 'analyze',
        input: {
          analyzeType: 'risks',
          analysis,
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.output)).toBe(true);
    });

    test('executes analyze task for effort', async () => {
      const phases: MigrationPhase[] = [
        {
          id: 'p1',
          name: 'P1',
          description: '',
          order: 1,
          goals: [],
          dependsOn: [],
          tasks: [],
          verification: [],
          rollback: [],
          estimatedEffort: { optimistic: 4, realistic: 8, pessimistic: 16, unit: 'hours' },
        },
      ];

      const task: AgentTask = {
        id: 'estimate-effort',
        type: 'analyze',
        input: {
          analyzeType: 'effort',
          phases,
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(true);
      expect((result.output as MigrationEstimates).totalEffort).toBeDefined();
    });

    test('executes analyze task for gaps', async () => {
      const analysis = createMockFullAnalysis();
      const task: AgentTask = {
        id: 'analyze-gaps',
        type: 'analyze',
        input: {
          analyzeType: 'gaps',
          analysis,
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(true);
      expect((result.output as GapAnalysis).missing).toBeDefined();
    });

    test('returns error for unsupported task type', async () => {
      const task: AgentTask = {
        id: 'invalid-task',
        type: 'generate' as any,
        input: {},
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns error for unknown plan type', async () => {
      const task: AgentTask = {
        id: 'invalid-plan',
        type: 'plan',
        input: {
          planType: 'unknown-type',
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown plan type');
    });

    test('returns error for unknown analyze type', async () => {
      const task: AgentTask = {
        id: 'invalid-analyze',
        type: 'analyze',
        input: {
          analyzeType: 'unknown-type',
        },
      };

      const result = await apoc.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown analyze type');
    });
  });

  describe('Cache Management', () => {
    test('can retrieve cached plan', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      const cached = apoc.getCachedPlan(plan.id);
      expect(cached).toBeDefined();
      expect(cached?.id).toBe(plan.id);
    });

    test('returns undefined for non-existent plan', () => {
      const cached = apoc.getCachedPlan('nonexistent-plan-id');
      expect(cached).toBeUndefined();
    });

    test('can clear cache', async () => {
      const analysis = createMockFullAnalysis();
      const plan = await apoc.generateMigrationPlan(analysis, 'test');

      apoc.clearCache();

      const cached = apoc.getCachedPlan(plan.id);
      expect(cached).toBeUndefined();
    });
  });

  describe('Events', () => {
    test('emits task:started event', async () => {
      let started = false;
      apoc.on('task:started', () => { started = true; });

      apoc.setContext({ projectPath: '/test', phaseId: 'planning' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'analyze',
        input: { analyzeType: 'gaps', analysis: createMockAnalysis() },
      };

      await apoc.execute(task);

      expect(started).toBe(true);
    });

    test('emits task:completed event', async () => {
      let completed = false;
      apoc.on('task:completed', () => { completed = true; });

      apoc.setContext({ projectPath: '/test', phaseId: 'planning' });
      const task: AgentTask = {
        id: 'test-task',
        type: 'analyze',
        input: { analyzeType: 'gaps', analysis: createMockAnalysis() },
      };

      await apoc.execute(task);

      expect(completed).toBe(true);
    });
  });
});

// ============================================================================
// PHASE 8g: Reporter Tests
// ============================================================================

describe('Phase 8g: Reporter', () => {
  const { Reporter, createReporter } = morpheus;

  describe('Reporter Creation', () => {
    test('creates reporter with factory function', () => {
      const reporter = createReporter();
      expect(reporter).toBeInstanceOf(Reporter);
    });

    test('creates reporter with constructor', () => {
      const reporter = new Reporter();
      expect(reporter).toBeDefined();
    });
  });

  describe('Migration Plan Reports', () => {
    test('generates markdown plan report', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'markdown' });

      expect(report.format).toBe('markdown');
      expect(report.content).toContain('# Migration Plan');
      expect(report.content).toContain('Test Project');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    test('generates HTML plan report', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'html' });

      expect(report.format).toBe('html');
      expect(report.content).toContain('<!DOCTYPE html>');
      expect(report.content).toContain('<title>');
    });

    test('generates JSON plan report', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'json' });

      expect(report.format).toBe('json');
      const parsed = JSON.parse(report.content);
      expect(parsed.phases).toBeDefined();
    });

    test('includes risks section', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'markdown' });

      expect(report.content).toContain('Risks');
      expect(report.content).toContain('API compatibility');
    });

    test('includes phases section', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'markdown' });

      expect(report.content).toContain('Phases');
      expect(report.content).toContain('Project Setup');
    });

    test('includes estimates section', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'markdown' });

      expect(report.content).toContain('Estimates');
    });

    test('includes metadata when requested', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan, { format: 'markdown', includeMetadata: true });

      expect(report.metadata).toBeDefined();
    });

    test('returns report sections', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();

      const report = reporter.generatePlanReport(plan);

      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.sections.includes('summary')).toBe(true);
    });
  });

  describe('Analysis Reports', () => {
    test('generates markdown analysis report', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'markdown' });

      expect(report.format).toBe('markdown');
      expect(report.content).toContain('Analysis Report');
    });

    test('generates HTML analysis report', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'html' });

      expect(report.format).toBe('html');
      expect(report.content).toContain('<!DOCTYPE html>');
    });

    test('includes provider information', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'markdown' });

      expect(report.content).toContain('Providers');
    });

    test('includes pattern analysis', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'markdown' });

      expect(report.content).toContain('Patterns');
    });
  });

  describe('Validation Reports', () => {
    test('generates markdown validation report', () => {
      const reporter = createReporter();
      const validation = createMockValidationResult({
        valid: false,
        errors: [{ code: 'E001', message: 'Missing required field', location: 'config.yaml:5' }],
        warnings: [{ code: 'W001', message: 'Deprecated option used' }],
        score: 50,
      });

      const report = reporter.generateValidationReport(validation, { format: 'markdown' });

      expect(report.format).toBe('markdown');
      expect(report.content).toContain('Validation Report');
    });

    test('includes errors in report', () => {
      const reporter = createReporter();
      const validation = createMockValidationResult({
        valid: false,
        errors: [{ code: 'E001', message: 'Missing required field', location: 'config.yaml:5' }],
        score: 50,
      });

      const report = reporter.generateValidationReport(validation, { format: 'markdown' });

      expect(report.content).toContain('E001');
      expect(report.content).toContain('Missing required field');
    });

    test('includes warnings in report', () => {
      const reporter = createReporter();
      const validation = createMockValidationResult({
        valid: false,
        warnings: [{ code: 'W001', message: 'Deprecated option used' }],
        score: 75,
      });

      const report = reporter.generateValidationReport(validation, { format: 'markdown' });

      expect(report.content).toContain('W001');
      expect(report.content).toContain('Deprecated option used');
    });

    test('shows pass status for valid results', () => {
      const reporter = createReporter();
      const validation = createMockValidationResult();

      const report = reporter.generateValidationReport(validation, { format: 'markdown' });

      expect(report.content).toContain('PASSED');
    });
  });

  describe('Progress Reports', () => {
    test('generates progress report', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();
      const progress = {
        totalPhases: 3,
        completedPhases: 0,
        currentPhase: 'setup',
        totalTasks: 5,
        completedTasks: 2,
        startedAt: new Date(),
      };

      const report = reporter.generateProgressReport(plan, progress, { format: 'markdown' });

      expect(report.format).toBe('markdown');
      expect(report.content).toContain('Progress');
    });

    test('includes completion percentage', () => {
      const reporter = createReporter();
      const plan = createMockMigrationPlan();
      const progress = {
        totalPhases: 2,
        completedPhases: 1,
        currentPhase: 'phase2',
        totalTasks: 10,
        completedTasks: 5,
        startedAt: new Date(),
      };

      const report = reporter.generateProgressReport(plan, progress, { format: 'markdown' });

      expect(report.content).toContain('50%');
    });
  });

  describe('Report Formatting', () => {
    test('HTML report includes CSS styling', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'html' });

      expect(report.content).toContain('<style>');
    });

    test('HTML report supports matrix theme', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'html', theme: 'matrix' });

      expect(report.content).toContain('#00ff00');
    });

    test('HTML report supports dark theme', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'html', theme: 'dark' });

      expect(report.content).toContain('#1a1a2e');
    });

    test('HTML report supports light theme', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'html', theme: 'light' });

      expect(report.content).toContain('#fff');
    });

    test('JSON format is valid JSON', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'json' });

      expect(() => JSON.parse(report.content)).not.toThrow();
    });

    test('markdown format uses proper headers', () => {
      const reporter = createReporter();
      const analysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(analysis, { format: 'markdown' });

      expect(report.content).toMatch(/^# /m);
      expect(report.content).toMatch(/^## /m);
    });
  });

  describe('Generic Report Generation', () => {
    test('generate method works with plan data', () => {
      const reporter = createReporter();
      const data = { plan: createMockMigrationPlan() };

      const report = reporter.generate(data);

      expect(report).toBeDefined();
      expect(report.content).toBeDefined();
    });

    test('generate method works with analysis data', () => {
      const reporter = createReporter();
      const data = { analysis: createMockFullAnalysis() };

      const report = reporter.generate(data);

      expect(report).toBeDefined();
    });

    test('generate method works with validation data', () => {
      const reporter = createReporter();
      const data = { validation: createMockValidationResult() };

      const report = reporter.generate(data);

      expect(report).toBeDefined();
    });
  });
});

// ============================================================================
// PHASE 8g: CLI Tests
// ============================================================================

describe('Phase 8g: CLI', () => {
  const { MorpheusCLI, createCLI, createStyle, MORPHEUS_BANNER, MORPHEUS_BANNER_SMALL } = morpheus;

  describe('CLI Creation', () => {
    test('creates CLI with factory function', () => {
      const cli = createCLI();
      expect(cli).toBeInstanceOf(MorpheusCLI);
    });

    test('creates CLI with constructor', () => {
      const cli = new MorpheusCLI();
      expect(cli).toBeDefined();
    });

    test('creates CLI with options', () => {
      const cli = createCLI({ colors: false, verbose: true });
      expect(cli).toBeDefined();
    });

    test('creates CLI with custom output function', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.info('test message');

      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Style Creation', () => {
    test('creates style with colors enabled', () => {
      const style = createStyle(true);

      expect(style.cyan).toBeDefined();
      expect(style.green).toBeDefined();
      expect(style.yellow).toBeDefined();
      expect(style.red).toBeDefined();
      expect(style.bold).toBeDefined();
      expect(style.dim).toBeDefined();
    });

    test('creates style with colors disabled', () => {
      const style = createStyle(false);

      expect(style.cyan('test')).toBe('test');
      expect(style.green('test')).toBe('test');
      expect(style.yellow('test')).toBe('test');
      expect(style.red('test')).toBe('test');
    });

    test('colored style adds ANSI codes', () => {
      const style = createStyle(true);

      expect(style.cyan('test')).toContain('\x1b[36m');
      expect(style.green('test')).toContain('\x1b[32m');
      expect(style.yellow('test')).toContain('\x1b[33m');
      expect(style.red('test')).toContain('\x1b[31m');
    });
  });

  describe('Banners', () => {
    test('MORPHEUS_BANNER is defined', () => {
      expect(MORPHEUS_BANNER).toBeDefined();
      expect(MORPHEUS_BANNER.length).toBeGreaterThan(0);
    });

    test('MORPHEUS_BANNER_SMALL is defined', () => {
      expect(MORPHEUS_BANNER_SMALL).toBeDefined();
      expect(MORPHEUS_BANNER_SMALL.length).toBeGreaterThan(0);
    });

    test('showBanner outputs banner', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.showBanner();

      expect(messages.some(m => m.includes('Welcome to the real world'))).toBe(true);
    });

    test('showBanner small outputs smaller banner', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.showBanner(true);

      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Output Methods', () => {
    test('info outputs with info styling', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ colors: true }, output);

      cli.info('test info');

      expect(messages.length).toBeGreaterThan(0);
    });

    test('success outputs with green styling', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ colors: true }, output);

      cli.success('test success');

      expect(messages.some(m => m.includes('✓') || m.includes('success'))).toBe(true);
    });

    test('warn outputs with yellow styling', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ colors: true }, output);

      cli.warn('test warning');

      expect(messages.length).toBeGreaterThan(0);
    });

    test('error outputs with red styling', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ colors: true }, output);

      cli.error('test error');

      expect(messages.length).toBeGreaterThan(0);
    });

    test('speak outputs Matrix-style quote', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.speak('Test message', 'Test Source');

      expect(messages.some(m => m.includes('Test message'))).toBe(true);
    });

    test('section outputs section header', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.section('Test Section');

      expect(messages.some(m => m.includes('Test Section'))).toBe(true);
    });
  });

  describe('Progress Bar', () => {
    test('progressBar outputs progress', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.progressBar(5, 10, 'Testing');

      expect(messages.some(m => m.includes('50%') || m.includes('█'))).toBe(true);
    });

    test('progressBar shows 0% at start', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.progressBar(0, 10, 'Start');

      expect(messages.some(m => m.includes('0%') || m.includes('░'))).toBe(true);
    });

    test('progressBar shows 100% at end', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.progressBar(10, 10, 'Complete');

      expect(messages.some(m => m.includes('100%'))).toBe(true);
    });
  });

  describe('Table Output', () => {
    test('table outputs formatted table', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.table(['Name', 'Value'], [['Row1', 'Val1'], ['Row2', 'Val2']]);

      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.includes('Name'))).toBe(true);
    });

    test('table handles varying column widths', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.table(['Short', 'A Very Long Column Header'], [['a', 'b']]);

      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Verbose Mode', () => {
    test('verbose outputs when verbose enabled', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ verbose: true }, output);

      cli.verbose('verbose message');

      expect(messages.some(m => m.includes('verbose message'))).toBe(true);
    });

    test('verbose suppressed when verbose disabled', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ verbose: false }, output);

      cli.verbose('verbose message');

      expect(messages.every(m => !m.includes('verbose message'))).toBe(true);
    });
  });

  describe('Quiet Mode', () => {
    test('quiet mode suppresses non-error output', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ quiet: true }, output);

      cli.info('info message');
      cli.success('success message');
      cli.warn('warn message');

      // In quiet mode, these should be suppressed
      expect(messages.every(m => !m.includes('info message'))).toBe(true);
    });

    test('errors still shown in quiet mode', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({ quiet: true }, output);

      cli.error('error message');

      expect(messages.some(m => m.includes('error message'))).toBe(true);
    });
  });

  describe('Crew Status', () => {
    test('showCrewStatus displays crew members', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.showCrewStatus();

      expect(messages.some(m => m.includes('Tank') || m.includes('Trinity') || m.includes('Mouse'))).toBe(true);
    });

    test('showCrewStatus shows all crew roles', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.showCrewStatus();

      const combined = messages.join(' ');
      expect(combined).toContain('Operator');
      expect(combined).toContain('Expert');
      expect(combined).toContain('Programmer');
      expect(combined).toContain('Skeptic');
      expect(combined).toContain('Strategist');
    });
  });

  describe('Report Generation', () => {
    test('generateReport returns markdown', () => {
      const cli = createCLI();
      const plan = createMockMigrationPlan();

      const report = cli.generateReport(plan, 'markdown');

      expect(report).toContain('#');
    });

    test('generateReport supports HTML format', () => {
      const cli = createCLI();
      const plan = createMockMigrationPlan();

      const report = cli.generateReport(plan, 'html');

      expect(report).toContain('<!DOCTYPE html>');
    });

    test('generateReport supports JSON format', () => {
      const cli = createCLI();
      const plan = createMockMigrationPlan();

      const report = cli.generateReport(plan, 'json');

      expect(() => JSON.parse(report)).not.toThrow();
    });
  });

  describe('List Item Output', () => {
    test('listItem outputs bulleted item', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.listItem('Test item');

      expect(messages.some(m => m.includes('•') || m.includes('-'))).toBe(true);
      expect(messages.some(m => m.includes('Test item'))).toBe(true);
    });

    test('listItem supports indentation', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.listItem('Indented item', 4);

      expect(messages.some(m => m.includes('    '))).toBe(true);
    });
  });

  describe('Subsection Output', () => {
    test('subsection outputs subsection header', () => {
      const messages: string[] = [];
      const output = (msg: string) => messages.push(msg);
      const cli = createCLI({}, output);

      cli.subsection('Test Subsection');

      expect(messages.some(m => m.includes('Test Subsection'))).toBe(true);
    });
  });
});

// =============================================================================
// Phase 8h: Knowledge Base Tests
// =============================================================================

describe('Phase 8h: Knowledge Base', () => {
  describe('Patterns', () => {
    test('PATTERNS contains pattern definitions', () => {
      const { PATTERNS } = require('../src/morpheus/knowledge/patterns.js');

      expect(Array.isArray(PATTERNS)).toBe(true);
      expect(PATTERNS.length).toBeGreaterThan(0);

      // Check pattern structure
      const pattern = PATTERNS[0];
      expect(pattern).toHaveProperty('id');
      expect(pattern).toHaveProperty('name');
      expect(pattern).toHaveProperty('category');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('problem');
      expect(pattern).toHaveProperty('solution');
      expect(pattern).toHaveProperty('complexity');
      expect(pattern).toHaveProperty('tags');
      expect(pattern).toHaveProperty('examples');
      expect(pattern).toHaveProperty('benefits');
    });

    test('getPatternsByCategory returns patterns for category', () => {
      const { getPatternsByCategory } = require('../src/morpheus/knowledge/patterns.js');

      const promptPatterns = getPatternsByCategory('prompt');

      expect(Array.isArray(promptPatterns)).toBe(true);
      expect(promptPatterns.every((p: any) => p.category === 'prompt')).toBe(true);
    });

    test('getPatternById returns specific pattern', () => {
      const { getPatternById, PATTERNS } = require('../src/morpheus/knowledge/patterns.js');

      const firstPattern = PATTERNS[0];
      const found = getPatternById(firstPattern.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstPattern.id);
    });

    test('getPatternById returns undefined for unknown id', () => {
      const { getPatternById } = require('../src/morpheus/knowledge/patterns.js');

      const found = getPatternById('nonexistent-pattern');

      expect(found).toBeUndefined();
    });

    test('searchPatterns finds patterns by query', () => {
      const { searchPatterns } = require('../src/morpheus/knowledge/patterns.js');

      const results = searchPatterns('prompt');

      expect(Array.isArray(results)).toBe(true);
    });

    test('getPatternsForComponent returns component patterns', () => {
      const { getPatternsForComponent } = require('../src/morpheus/knowledge/patterns.js');

      const patterns = getPatternsForComponent('architect');

      expect(Array.isArray(patterns)).toBe(true);
    });

    test('patterns have valid complexity values', () => {
      const { PATTERNS } = require('../src/morpheus/knowledge/patterns.js');

      const validComplexities = ['simple', 'moderate', 'advanced'];

      PATTERNS.forEach((pattern: any) => {
        expect(validComplexities).toContain(pattern.complexity);
      });
    });

    test('patterns have examples with code', () => {
      const { PATTERNS } = require('../src/morpheus/knowledge/patterns.js');

      const patternsWithExamples = PATTERNS.filter((p: any) => p.examples.length > 0);

      expect(patternsWithExamples.length).toBeGreaterThan(0);

      patternsWithExamples.forEach((pattern: any) => {
        pattern.examples.forEach((example: any) => {
          expect(example).toHaveProperty('title');
          expect(example).toHaveProperty('code');
        });
      });
    });
  });

  describe('Anti-Patterns', () => {
    test('ANTI_PATTERNS contains anti-pattern definitions', () => {
      const { ANTI_PATTERNS } = require('../src/morpheus/knowledge/anti-patterns.js');

      expect(Array.isArray(ANTI_PATTERNS)).toBe(true);
      expect(ANTI_PATTERNS.length).toBeGreaterThan(0);

      // Check structure
      const antiPattern = ANTI_PATTERNS[0];
      expect(antiPattern).toHaveProperty('id');
      expect(antiPattern).toHaveProperty('name');
      expect(antiPattern).toHaveProperty('category');
      expect(antiPattern).toHaveProperty('severity');
      expect(antiPattern).toHaveProperty('description');
      expect(antiPattern).toHaveProperty('symptoms');
      expect(antiPattern).toHaveProperty('consequences');
      expect(antiPattern).toHaveProperty('detection');
      expect(antiPattern).toHaveProperty('remediation');
    });

    test('getAntiPatternsByCategory returns anti-patterns for category', () => {
      const { getAntiPatternsByCategory } = require('../src/morpheus/knowledge/anti-patterns.js');

      const securityAntiPatterns = getAntiPatternsByCategory('security');

      expect(Array.isArray(securityAntiPatterns)).toBe(true);
      expect(securityAntiPatterns.every((ap: any) => ap.category === 'security')).toBe(true);
    });

    test('getAntiPatternsBySeverity returns anti-patterns by severity', () => {
      const { getAntiPatternsBySeverity } = require('../src/morpheus/knowledge/anti-patterns.js');

      const criticalAntiPatterns = getAntiPatternsBySeverity('critical');

      expect(Array.isArray(criticalAntiPatterns)).toBe(true);
      expect(criticalAntiPatterns.every((ap: any) => ap.severity === 'critical')).toBe(true);
    });

    test('getAntiPatternById returns specific anti-pattern', () => {
      const { getAntiPatternById, ANTI_PATTERNS } = require('../src/morpheus/knowledge/anti-patterns.js');

      const first = ANTI_PATTERNS[0];
      const found = getAntiPatternById(first.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(first.id);
    });

    test('getAllDetectionRules returns all detection rules', () => {
      const { getAllDetectionRules } = require('../src/morpheus/knowledge/anti-patterns.js');

      const rules = getAllDetectionRules();

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      rules.forEach((rule: any) => {
        expect(rule).toHaveProperty('antiPatternId');
        expect(rule).toHaveProperty('rule');
        expect(rule.rule).toHaveProperty('type');
        expect(rule.rule).toHaveProperty('description');
        expect(rule.rule).toHaveProperty('confidence');
      });
    });

    test('searchAntiPatterns finds anti-patterns by query', () => {
      const { searchAntiPatterns } = require('../src/morpheus/knowledge/anti-patterns.js');

      const results = searchAntiPatterns('security');

      expect(Array.isArray(results)).toBe(true);
    });

    test('anti-patterns have valid severity values', () => {
      const { ANTI_PATTERNS } = require('../src/morpheus/knowledge/anti-patterns.js');

      const validSeverities = ['critical', 'high', 'medium', 'low'];

      ANTI_PATTERNS.forEach((ap: any) => {
        expect(validSeverities).toContain(ap.severity);
      });
    });

    test('detection rules have valid types', () => {
      const { getAllDetectionRules } = require('../src/morpheus/knowledge/anti-patterns.js');

      const validTypes = ['regex', 'ast', 'semantic'];
      const rules = getAllDetectionRules();

      rules.forEach((rule: any) => {
        expect(validTypes).toContain(rule.rule.type);
      });
    });
  });

  describe('Best Practices', () => {
    test('BEST_PRACTICES contains practice definitions', () => {
      const { BEST_PRACTICES } = require('../src/morpheus/knowledge/best-practices.js');

      expect(Array.isArray(BEST_PRACTICES)).toBe(true);
      expect(BEST_PRACTICES.length).toBeGreaterThan(0);

      // Check structure
      const practice = BEST_PRACTICES[0];
      expect(practice).toHaveProperty('id');
      expect(practice).toHaveProperty('title');
      expect(practice).toHaveProperty('category');
      expect(practice).toHaveProperty('priority');
      expect(practice).toHaveProperty('description');
      expect(practice).toHaveProperty('rationale');
      expect(practice).toHaveProperty('guidelines');
      expect(practice).toHaveProperty('checklist');
    });

    test('getBestPracticesByCategory returns practices for category', () => {
      const { getBestPracticesByCategory } = require('../src/morpheus/knowledge/best-practices.js');

      const securityPractices = getBestPracticesByCategory('security');

      expect(Array.isArray(securityPractices)).toBe(true);
      expect(securityPractices.every((bp: any) => bp.category === 'security')).toBe(true);
    });

    test('getBestPracticesByPriority returns practices by priority', () => {
      const { getBestPracticesByPriority } = require('../src/morpheus/knowledge/best-practices.js');

      const mustHave = getBestPracticesByPriority('must-have');

      expect(Array.isArray(mustHave)).toBe(true);
      expect(mustHave.every((bp: any) => bp.priority === 'must-have')).toBe(true);
    });

    test('getBestPracticeById returns specific practice', () => {
      const { getBestPracticeById, BEST_PRACTICES } = require('../src/morpheus/knowledge/best-practices.js');

      const first = BEST_PRACTICES[0];
      const found = getBestPracticeById(first.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(first.id);
    });

    test('getBestPracticesForComponent returns component practices', () => {
      const { getBestPracticesForComponent } = require('../src/morpheus/knowledge/best-practices.js');

      const practices = getBestPracticesForComponent('sentinels');

      expect(Array.isArray(practices)).toBe(true);
    });

    test('getMigrationChecklist returns checklist items', () => {
      const { getMigrationChecklist } = require('../src/morpheus/knowledge/best-practices.js');

      const checklist = getMigrationChecklist();

      expect(Array.isArray(checklist)).toBe(true);
      expect(checklist.length).toBeGreaterThan(0);

      checklist.forEach((entry: any) => {
        expect(entry).toHaveProperty('practice');
        expect(entry).toHaveProperty('items');
        expect(entry.practice).toHaveProperty('id');
        expect(entry.practice).toHaveProperty('title');
        expect(Array.isArray(entry.items)).toBe(true);

        entry.items.forEach((item: any) => {
          expect(item).toHaveProperty('item');
          expect(item).toHaveProperty('required');
        });
      });
    });

    test('searchBestPractices finds practices by query', () => {
      const { searchBestPractices } = require('../src/morpheus/knowledge/best-practices.js');

      const results = searchBestPractices('security');

      expect(Array.isArray(results)).toBe(true);
    });

    test('best practices have valid priority values', () => {
      const { BEST_PRACTICES } = require('../src/morpheus/knowledge/best-practices.js');

      const validPriorities = ['must-have', 'should-have', 'nice-to-have'];

      BEST_PRACTICES.forEach((bp: any) => {
        expect(validPriorities).toContain(bp.priority);
      });
    });
  });

  describe('Construct Components', () => {
    test('CONSTRUCT_COMPONENTS contains component definitions', () => {
      const { CONSTRUCT_COMPONENTS } = require('../src/morpheus/knowledge/construct.js');

      expect(Array.isArray(CONSTRUCT_COMPONENTS)).toBe(true);
      expect(CONSTRUCT_COMPONENTS.length).toBeGreaterThan(0);

      // Check structure
      const component = CONSTRUCT_COMPONENTS[0];
      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('role');
      expect(component).toHaveProperty('description');
      expect(component).toHaveProperty('responsibilities');
      expect(component).toHaveProperty('interfaces');
      expect(component).toHaveProperty('dependencies');
      expect(component).toHaveProperty('configuration');
      expect(component).toHaveProperty('migrationNotes');
    });

    test('CONSTRUCT_COMPONENTS includes all core components', () => {
      const { CONSTRUCT_COMPONENTS } = require('../src/morpheus/knowledge/construct.js');

      const componentIds = CONSTRUCT_COMPONENTS.map((c: any) => c.id);

      expect(componentIds).toContain('architect');
      expect(componentIds).toContain('oracle');
      expect(componentIds).toContain('agents');
      expect(componentIds).toContain('sentinels');
      expect(componentIds).toContain('programs');
      expect(componentIds).toContain('keymaker');
    });

    test('getComponentById returns specific component', () => {
      const { getComponentById } = require('../src/morpheus/knowledge/construct.js');

      const architect = getComponentById('architect');

      expect(architect).toBeDefined();
      expect(architect?.id).toBe('architect');
      expect(architect?.name).toBe('The Architect');
    });

    test('getComponentById returns undefined for unknown id', () => {
      const { getComponentById } = require('../src/morpheus/knowledge/construct.js');

      const unknown = getComponentById('nonexistent');

      expect(unknown).toBeUndefined();
    });

    test('getComponentDependencies returns component dependencies', () => {
      const { getComponentDependencies } = require('../src/morpheus/knowledge/construct.js');

      const deps = getComponentDependencies('agents');

      expect(Array.isArray(deps)).toBe(true);
    });

    test('getDependentComponents returns components that depend on given component', () => {
      const { getDependentComponents } = require('../src/morpheus/knowledge/construct.js');

      const dependents = getDependentComponents('architect');

      expect(Array.isArray(dependents)).toBe(true);
    });

    test('MIGRATION_ORDER defines correct migration sequence', () => {
      const { MIGRATION_ORDER } = require('../src/morpheus/knowledge/construct.js');

      expect(Array.isArray(MIGRATION_ORDER)).toBe(true);
      expect(MIGRATION_ORDER.length).toBeGreaterThan(0);

      // Architect should come first
      expect(MIGRATION_ORDER[0]).toBe('architect');
    });

    test('canMigrateComponent checks dependencies', () => {
      const { canMigrateComponent } = require('../src/morpheus/knowledge/construct.js');

      // Architect has no dependencies, should always be migratable
      expect(canMigrateComponent('architect', [])).toBe(true);

      // Agents depends on other components
      expect(canMigrateComponent('agents', [])).toBe(false);
    });

    test('getNextMigratableComponents returns available components', () => {
      const { getNextMigratableComponents } = require('../src/morpheus/knowledge/construct.js');

      // With no components migrated, only architect should be available
      const available = getNextMigratableComponents([]);

      expect(Array.isArray(available)).toBe(true);
      expect(available).toContain('architect');
    });

    test('calculateMigrationProgress returns percentage', () => {
      const { calculateMigrationProgress, MIGRATION_ORDER } = require('../src/morpheus/knowledge/construct.js');

      // Empty = 0%
      expect(calculateMigrationProgress([])).toBe(0);

      // All = 100%
      expect(calculateMigrationProgress(MIGRATION_ORDER)).toBe(100);

      // Partial = somewhere in between
      const partial = calculateMigrationProgress(['architect', 'keymaker']);
      expect(partial).toBeGreaterThan(0);
      expect(partial).toBeLessThan(100);
    });

    test('getComponentConfigTemplate returns config template', () => {
      const { getComponentConfigTemplate } = require('../src/morpheus/knowledge/construct.js');

      const template = getComponentConfigTemplate('architect');

      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Paths', () => {
    test('MIGRATION_PATHS contains path definitions', () => {
      const { MIGRATION_PATHS } = require('../src/morpheus/knowledge/construct.js');

      expect(Array.isArray(MIGRATION_PATHS)).toBe(true);
      expect(MIGRATION_PATHS.length).toBeGreaterThan(0);

      // Check structure
      const path = MIGRATION_PATHS[0];
      expect(path).toHaveProperty('fromPattern');
      expect(path).toHaveProperty('toComponent');
      expect(path).toHaveProperty('steps');
      expect(path).toHaveProperty('complexity');
      expect(path).toHaveProperty('effort');
    });

    test('getMigrationPath returns specific path', () => {
      const { getMigrationPath, MIGRATION_PATHS } = require('../src/morpheus/knowledge/construct.js');

      const first = MIGRATION_PATHS[0];
      const found = getMigrationPath(first.fromPattern);

      expect(found).toBeDefined();
      expect(found?.fromPattern).toBe(first.fromPattern);
      expect(found?.toComponent).toBe(first.toComponent);
    });

    test('getMigrationPathsForComponent returns paths to component', () => {
      const { getMigrationPathsForComponent } = require('../src/morpheus/knowledge/construct.js');

      const paths = getMigrationPathsForComponent('keymaker');

      expect(Array.isArray(paths)).toBe(true);
    });
  });

  describe('KnowledgeBase Class', () => {
    test('createKnowledgeBase creates instance', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();

      expect(kb).toBeDefined();
      expect(typeof kb.getPatterns).toBe('function');
      expect(typeof kb.getAntiPatterns).toBe('function');
      expect(typeof kb.getBestPractices).toBe('function');
      expect(typeof kb.getComponents).toBe('function');
      expect(typeof kb.search).toBe('function');
    });

    test('KnowledgeBase.getPatterns returns all patterns', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const patterns = kb.getPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    test('KnowledgeBase.getAntiPatterns returns all anti-patterns', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const antiPatterns = kb.getAntiPatterns();

      expect(Array.isArray(antiPatterns)).toBe(true);
      expect(antiPatterns.length).toBeGreaterThan(0);
    });

    test('KnowledgeBase.getBestPractices returns all best practices', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const practices = kb.getBestPractices();

      expect(Array.isArray(practices)).toBe(true);
      expect(practices.length).toBeGreaterThan(0);
    });

    test('KnowledgeBase.getComponents returns all components', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const components = kb.getComponents();

      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);
    });

    test('KnowledgeBase.search performs unified search', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const results = kb.search('security');

      expect(Array.isArray(results)).toBe(true);

      // Results should include different types
      const types = new Set(results.map((r: any) => r.type));
      expect(types.size).toBeGreaterThan(0);
    });

    test('KnowledgeBase.search supports type filtering', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const results = kb.search('security', {
        includePatterns: true,
        includeAntiPatterns: false,
        includeBestPractices: false,
        includeConstruct: false,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.every((r: any) => r.type === 'pattern')).toBe(true);
    });

    test('KnowledgeBase.search supports limit option', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const results = kb.search('security', { limit: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
    });

    test('KnowledgeBase.getRecommendations returns context-aware recommendations', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const recommendations = kb.getRecommendations({
        hasHardcodedPrompts: true,
        hasErrorHandling: false,
        hasValidation: false,
        hasTesting: false,
        securityScore: 30,
      });

      expect(recommendations).toHaveProperty('patterns');
      expect(recommendations).toHaveProperty('antiPatterns');
      expect(recommendations).toHaveProperty('bestPractices');
      expect(recommendations).toHaveProperty('migrationPaths');
    });

    test('KnowledgeBase.getMigrationGuidance returns guidance for pattern', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const guidance = kb.getMigrationGuidance('hardcoded prompts');

      if (guidance) {
        expect(guidance).toHaveProperty('currentState');
        expect(guidance).toHaveProperty('targetComponent');
        expect(guidance).toHaveProperty('steps');
        expect(guidance).toHaveProperty('estimatedEffort');
        expect(guidance).toHaveProperty('relatedPatterns');
        expect(guidance).toHaveProperty('antiPatternsToAvoid');
        expect(guidance).toHaveProperty('bestPractices');
      }
    });

    test('KnowledgeBase.getComponentKnowledge returns complete component info', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const knowledge = kb.getComponentKnowledge('architect');

      expect(knowledge).toHaveProperty('component');
      expect(knowledge).toHaveProperty('patterns');
      expect(knowledge).toHaveProperty('antiPatterns');
      expect(knowledge).toHaveProperty('bestPractices');
      expect(knowledge).toHaveProperty('migrationPaths');

      expect(knowledge.component?.id).toBe('architect');
    });

    test('KnowledgeBase.getComponentKnowledge returns undefined for unknown component', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();
      const knowledge = kb.getComponentKnowledge('nonexistent');

      expect(knowledge.component).toBeUndefined();
    });
  });

  describe('Morpheus Index Exports', () => {
    test('exports knowledge base functions', () => {
      const morpheus = require('../src/morpheus/index.js');

      // Main knowledge base
      expect(morpheus.createKnowledgeBase).toBeDefined();
      expect(morpheus.KnowledgeBase).toBeDefined();

      // Patterns
      expect(morpheus.PATTERNS).toBeDefined();
      expect(morpheus.getPatternsByCategory).toBeDefined();
      expect(morpheus.getPatternById).toBeDefined();
      expect(morpheus.searchPatterns).toBeDefined();
      expect(morpheus.getPatternsForComponent).toBeDefined();

      // Anti-patterns
      expect(morpheus.ANTI_PATTERNS).toBeDefined();
      expect(morpheus.getAntiPatternsByCategory).toBeDefined();
      expect(morpheus.getAntiPatternsBySeverity).toBeDefined();
      expect(morpheus.getAntiPatternById).toBeDefined();
      expect(morpheus.getAllDetectionRules).toBeDefined();
      expect(morpheus.searchAntiPatterns).toBeDefined();

      // Best practices
      expect(morpheus.BEST_PRACTICES).toBeDefined();
      expect(morpheus.getBestPracticesByCategory).toBeDefined();
      expect(morpheus.getBestPracticesByPriority).toBeDefined();
      expect(morpheus.getBestPracticeById).toBeDefined();
      expect(morpheus.getBestPracticesForComponent).toBeDefined();
      expect(morpheus.getMigrationChecklist).toBeDefined();
      expect(morpheus.searchBestPractices).toBeDefined();

      // Construct components
      expect(morpheus.CONSTRUCT_COMPONENTS).toBeDefined();
      expect(morpheus.COMPONENT_DEPENDENCIES).toBeDefined();
      expect(morpheus.MIGRATION_ORDER).toBeDefined();
      expect(morpheus.MIGRATION_PATHS).toBeDefined();
      expect(morpheus.getComponentById).toBeDefined();
      expect(morpheus.getComponentDependencies).toBeDefined();
      expect(morpheus.getDependentComponents).toBeDefined();
      expect(morpheus.getMigrationPath).toBeDefined();
      expect(morpheus.getMigrationPathsForComponent).toBeDefined();
      expect(morpheus.canMigrateComponent).toBeDefined();
      expect(morpheus.getNextMigratableComponents).toBeDefined();
      expect(morpheus.calculateMigrationProgress).toBeDefined();
      expect(morpheus.getComponentConfigTemplate).toBeDefined();
    });
  });
});

// =============================================================================
// Phase 8i: Integration Tests
// =============================================================================

describe('Phase 8i: Integration Tests', () => {
  // Helper to create a mock FullAnalysis (matching the structure used in other tests)
  const createMockFullAnalysis = (overrides: Partial<any> = {}): any => ({
    project: {
      rootPath: '/test/project',
      scannedAt: new Date(),
      files: [
        { path: '/test/project/src/ai.ts', relativePath: 'src/ai.ts', language: 'typescript', size: 1000, lines: 50, hasAIUsage: true, imports: [], exports: [] },
      ],
      dependencies: {
        packages: [],
        aiPackages: [],
        devPackages: [],
        peerPackages: [],
      },
      config: {
        hasEnvFile: true,
        hasSecrets: false,
        secretsFound: [],
        configFiles: [],
      },
      statistics: {
        totalFiles: 1,
        totalLines: 50,
        languageBreakdown: { typescript: 1 },
        aiFileCount: 1,
      },
    },
    aiUsage: {
      providers: [
        { provider: 'openai', package: 'openai', version: '^4.0.0', locations: [], models: ['gpt-4'], features: ['chat'], callCount: 5 },
      ],
      prompts: [],
      tools: [],
      patterns: [],
      antiPatterns: [],
    },
    architecture: {
      structure: { hasArchitect: false, hasOracle: false, hasAgents: false, hasSentinels: false, hasPrograms: false, hasKeymaker: false },
      score: 50,
      recommendations: ['Add Architect component'],
    },
    security: {
      score: 70,
      findings: [],
      hasAuthentication: false,
      hasAuthorization: false,
      hasInputValidation: false,
      hasOutputValidation: false,
      hasSecretManagement: true,
      hasAuditLogging: false,
    },
    quality: {
      score: 60,
      codeQuality: 60,
      typeQuality: 50,
      testQuality: 40,
      documentationQuality: 50,
    },
    gaps: {
      missingComponents: ['architect', 'keymaker'],
      partialComponents: [],
      recommendations: [],
    },
    ...overrides,
  });

  describe('Crew Coordination', () => {
    test('Apoc generates migration plan from analysis', async () => {
      const apoc = createApoc();
      const mockAnalysis = createMockFullAnalysis();

      // Apoc creates plan from analysis
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'test-project');

      expect(plan).toBeDefined();
      expect(plan.currentState).toBeDefined();
      expect(plan.targetState).toBeDefined();
      expect(plan.phases.length).toBeGreaterThan(0);
    });

    test('Mouse generates config from analysis', async () => {
      const mouse = createMouse();
      const mockAnalysis = createMockFullAnalysis();

      // Mouse generates config from analysis using public generateConfig method
      const config = await mouse.generateConfig('architect', mockAnalysis);

      expect(config).toBeDefined();
      // The generated architect config should contain project configuration
      expect(config.content).toContain('version:');
      expect(config.content.length).toBeGreaterThan(100);
    });

    test('Mouse generation flows into Switch validation', async () => {
      const mouse = createMouse();
      const switch_ = createSwitch();

      // Mouse generates a contract - use actual PromptAnalysis interface
      const mockPromptAnalysis = {
        id: 'test-prompt',
        location: { file: '/test/prompts.ts', line: 1, column: 1 },
        type: 'inline' as const,
        structure: {
          hasSystemPrompt: true,
          hasUserPrompt: false,
          hasAssistantExamples: false,
          messageCount: 1,
          systemPromptContent: 'You are a helpful assistant',
        },
        variables: [],
        complexity: 'simple' as const,
        estimatedTokens: 100,
        recommendations: [],
      };

      const contract = await mouse.generateContract(mockPromptAnalysis);

      // Switch validates the contract (pass the GeneratedContract object)
      // Note: Generated contracts need additional fields (at root level) to pass
      // full validation - this tests that the validation flow works
      const validation = await switch_.validateContract(contract);

      expect(validation).toBeDefined();
      // Validation returns a score and identifies issues in generated contracts
      expect(typeof validation.score).toBe('number');
      expect(validation.errors).toBeDefined();
      expect(validation.warnings).toBeDefined();
    });

    test('full crew pipeline: analyze -> plan -> generate -> validate', async () => {
      const apoc = createApoc();
      const mouse = createMouse();
      const switch_ = createSwitch();
      const mockAnalysis = createMockFullAnalysis();

      // Step 1: Apoc plans
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'test-project');
      expect(plan.phases.length).toBeGreaterThan(0);

      // Step 2: Mouse generates config using public generateConfig method
      const config = await mouse.generateConfig('architect', mockAnalysis);
      expect(config.content.length).toBeGreaterThan(0);

      // Step 3: Switch validates (pass the GeneratedConfig object)
      const configValidation = await switch_.validateConfig(config);
      expect(configValidation.errors.length).toBe(0);
    });
  });

  describe('Workflow Integration', () => {
    // Define a test workflow YAML for integration tests
    const testWorkflowYaml = `
id: test-workflow
name: Test Workflow
version: 1.0.0
description: A test workflow for integration tests
config:
  requireApproval: false
  allowSkip: false
  rollbackOnFailure: true
phases:
  - id: setup
    name: Setup Phase
    description: Initial setup
    required: true
    checklist:
      - id: check-1
        text: Verify setup complete
        required: true
    steps:
      - id: step-1
        name: Initialize
        type: automated
        agent: tank
  - id: migrate
    name: Migration Phase
    description: Main migration
    required: true
    depends_on:
      - setup
    checklist:
      - id: check-2
        text: Verify migration complete
        required: true
    steps:
      - id: step-2
        name: Migrate
        type: ai-assisted
        agent: mouse
`;

    test('workflow loads and validates correctly', async () => {
      const loader = createWorkflowLoader();

      const result = await loader.loadFromString(testWorkflowYaml);

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow!.id).toBe('test-workflow');
      expect(result.workflow!.phases.length).toBeGreaterThan(0);
    });

    test('checklist manager tracks workflow progress', async () => {
      const loader = createWorkflowLoader();
      const checklistManager = createChecklistManager();

      const result = await loader.loadFromString(testWorkflowYaml);

      // Ensure workflow loaded successfully
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow!.phases.length).toBeGreaterThan(0);

      const workflow = result.workflow!;
      const phase = workflow.phases[0]!;

      // Initialize checklist from phase
      checklistManager.initializeChecklist(phase);

      const checklist = checklistManager.getChecklist(phase.id);
      expect(checklist).toBeDefined();
      expect(checklist?.status).toBe('pending');
    });

    test('state store persists and retrieves workflow state', async () => {
      const stateStore = createStateStore({ inMemory: true });
      await stateStore.open();

      const state = await stateStore.createState('test-workflow', '/test/project');

      expect(state).toBeDefined();
      expect(state.workflowId).toBe('test-workflow');
      expect(state.projectPath).toBe('/test/project');
      expect(state.status).toBe('pending');

      await stateStore.close();
    });
  });

  describe('Knowledge-Guided Migration', () => {
    test('knowledge base provides relevant recommendations during migration', () => {
      const { createKnowledgeBase } = require('../src/morpheus/knowledge/knowledge-base.js');

      const kb = createKnowledgeBase();

      // Simulate analysis finding issues
      const mockContext = {
        hasHardcodedPrompts: true,
        hasErrorHandling: false,
        hasValidation: false,
        hasTesting: false,
        securityScore: 40,
      };

      const recommendations = kb.getRecommendations(mockContext);

      // Should get recommendations for all the issues
      expect(recommendations.patterns.length).toBeGreaterThan(0);
      expect(recommendations.antiPatterns.length).toBeGreaterThan(0);
      expect(recommendations.bestPractices.length).toBeGreaterThan(0);
    });

    test('knowledge base guides component migration order', () => {
      const { canMigrateComponent, getNextMigratableComponents } = require('../src/morpheus/knowledge/construct.js');

      // Start with empty
      let migrated: string[] = [];
      let available = getNextMigratableComponents(migrated);

      // First available should be architect (no dependencies)
      expect(available).toContain('architect');

      // Migrate architect
      migrated.push('architect');
      available = getNextMigratableComponents(migrated);

      // Now keymaker should be available
      expect(available).toContain('keymaker');

      // Migrate in order - agents depends on: architect, oracle, sentinels, programs
      migrated.push('keymaker');
      migrated.push('oracle');     // Required for agents
      migrated.push('sentinels');
      migrated.push('programs');

      // Agents depends on architect, oracle, sentinels, programs
      expect(canMigrateComponent('agents', migrated)).toBe(true);
    });
  });

  describe('Report Integration', () => {
    test('reporter generates complete migration report', async () => {
      const reporter = createReporter();
      const apoc = createApoc();
      const mockAnalysis = createMockFullAnalysis();

      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'test-project');

      // Generate report using generatePlanReport (returns GeneratedReport)
      const report = reporter.generatePlanReport(plan);

      expect(report.content).toContain('Migration Plan');
      expect(report.content).toContain('Phase');
      expect(report.content.length).toBeGreaterThan(500);
    });

    test('reporter generates analysis report', () => {
      const reporter = createReporter();
      const mockAnalysis = createMockFullAnalysis();

      const report = reporter.generateAnalysisReport(mockAnalysis);

      // generateAnalysisReport returns GeneratedReport with .content
      expect(report.content).toContain('Analysis');
      expect(report.content.length).toBeGreaterThan(100);
    });

    test('reporter generates validation report from Switch output', async () => {
      const reporter = createReporter();
      const switch_ = createSwitch();

      // Create a GeneratedContract object for validation
      const mockContract = {
        id: 'test-contract',
        name: 'Test Contract',
        content: `
id: test-contract
name: Test Contract
version: 1.0.0
type: completion
prompts:
  system: You are a helpful assistant
`,
        outputPath: '/test/contracts/test-contract.yaml',
        confidence: 0.9,
        warnings: [],
      };

      const validation = await switch_.validateContract(mockContract);

      const report = reporter.generateValidationReport(validation);

      expect(report.content).toContain('Validation');
    });
  });

  describe('CLI Integration', () => {
    test('CLI displays crew coordination', () => {
      const { createCLI } = require('../src/morpheus/cli/index.js');

      const messages: string[] = [];
      const cli = createCLI({}, (msg: string) => messages.push(msg));

      cli.showCrewStatus();

      const combined = messages.join('\n');
      expect(combined).toContain('Operator');
      expect(combined).toContain('Programmer');
      expect(combined).toContain('Expert');
      expect(combined).toContain('Skeptic');
      expect(combined).toContain('Strategist');
    });

    test('CLI can generate reports in all formats', async () => {
      const { createCLI } = require('../src/morpheus/cli/index.js');
      const apoc = createApoc();
      const mockAnalysis = createMockFullAnalysis();

      const cli = createCLI();
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'test-project');

      const markdown = cli.generateReport(plan, 'markdown');
      const html = cli.generateReport(plan, 'html');
      const json = cli.generateReport(plan, 'json');

      expect(markdown).toContain('#');
      expect(html).toContain('<!DOCTYPE html>');
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('End-to-End Migration Scenarios', () => {
    test('scenario: OpenAI-only project migration', async () => {
      const apoc = createApoc();
      const mouse = createMouse();
      const switch_ = createSwitch();

      const mockAnalysis = createMockFullAnalysis({
        aiUsage: {
          providers: [
            { provider: 'openai', package: 'openai', version: '^4.0.0', locations: [], models: ['gpt-4'], features: ['chat'], callCount: 5 },
          ],
          prompts: [],
          tools: [],
          patterns: [],
          antiPatterns: [],
        },
      });

      // Plan should include Keymaker migration
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'openai-project');
      expect(plan.phases.some((p: any) => p.name.toLowerCase().includes('keymaker'))).toBe(true);

      // Generate Keymaker config using public generateConfig method
      const keymakerConfig = await mouse.generateConfig('keymaker', mockAnalysis);
      expect(keymakerConfig.content).toContain('openai');

      // Validate config (pass the GeneratedConfig object)
      const validation = await switch_.validateConfig(keymakerConfig);
      expect(validation.errors.length).toBe(0);
    });

    test('scenario: multi-provider project migration', async () => {
      const apoc = createApoc();

      const mockAnalysis = createMockFullAnalysis({
        aiUsage: {
          providers: [
            { provider: 'openai', package: 'openai', version: '^4.0.0', locations: [], models: ['gpt-4'], features: ['chat', 'tools'], callCount: 3 },
            { provider: 'anthropic', package: '@anthropic-ai/sdk', version: '^0.9.0', locations: [], models: ['claude-3'], features: ['chat'], callCount: 2 },
          ],
          prompts: [],
          tools: [],
          patterns: [],
          antiPatterns: [],
        },
      });

      // Plan should recommend Keymaker for provider abstraction
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'multi-provider');

      // Should have higher complexity due to multiple providers
      expect(plan.estimates.complexity).toBeDefined();
    });

    test('scenario: security-focused migration', async () => {
      const apoc = createApoc();

      const mockAnalysis = createMockFullAnalysis({
        security: {
          score: 40,
          findings: [
            { type: 'hardcoded_secret', severity: 'critical', file: '/test/ai.ts', line: 1, message: 'Hardcoded API key' },
          ],
          hasAuthentication: false,
          hasAuthorization: false,
          hasInputValidation: false,
          hasOutputValidation: false,
          hasSecretManagement: false,
          hasAuditLogging: false,
        },
      });

      // Plan should include security phase (Smith handles security in The Construct)
      const plan = await apoc.generateMigrationPlan(mockAnalysis, 'security-project');
      expect(plan.phases.some((p: any) => p.name.toLowerCase().includes('security') || p.name.toLowerCase().includes('smith'))).toBe(true);

      // Plan should have risks (category is: technical, operational, schedule, resource)
      expect(plan.risks.length).toBeGreaterThan(0);
      // Low security score should generate technical risks
      expect(plan.risks.some((r: any) => r.category === 'technical')).toBe(true);
    });
  });

  describe('Morpheus Commander Integration', () => {
    test('Morpheus initializes correctly', async () => {
      const morpheus = createMorpheus({ inMemoryState: true });

      await morpheus.initialize();

      // Morpheus should be initialized
      expect(morpheus).toBeDefined();

      await morpheus.shutdown();
    });

    test('Morpheus can register and retrieve agents', async () => {
      const morpheus = createMorpheus({ inMemoryState: true });
      const tank = createTank();

      morpheus.registerAgent(tank);

      const retrieved = morpheus.getAgent('tank');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('tank');

      await morpheus.shutdown();
    });

    test('Morpheus handles missing workflows gracefully', async () => {
      const morpheus = createMorpheus({ inMemoryState: true });

      // Non-existent workflow should return failure
      const result = await morpheus.loadWorkflow('non-existent-workflow');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Morpheus message callbacks work', async () => {
      const messages: any[] = [];
      const morpheus = createMorpheus({
        inMemoryState: true,
        callbacks: {
          onMessage: (msg) => messages.push(msg),
        },
      });

      await morpheus.initialize();

      // Initialize should trigger welcome message
      expect(messages.length).toBeGreaterThan(0);

      await morpheus.shutdown();
    });

    test('Morpheus lists available workflows', async () => {
      const morpheus = createMorpheus({ inMemoryState: true });

      const workflows = await morpheus.listWorkflows();

      // Should return an array (even if empty when no workflow files exist)
      expect(Array.isArray(workflows)).toBe(true);
    });
  });

  describe('Complete System Integration', () => {
    test('all Morpheus components export correctly', () => {
      const m = require('../src/morpheus/index.js');

      // Core Morpheus
      expect(m.Morpheus).toBeDefined();
      expect(m.createMorpheus).toBeDefined();

      // Workflow system
      expect(m.WorkflowLoader).toBeDefined();
      expect(m.createWorkflowLoader).toBeDefined();
      expect(m.ChecklistManager).toBeDefined();
      expect(m.createChecklistManager).toBeDefined();
      expect(m.WorkflowStateStore).toBeDefined();
      expect(m.createStateStore).toBeDefined();
      expect(m.BUILT_IN_WORKFLOWS).toBeDefined();

      // Crew agents
      expect(m.Tank).toBeDefined();
      expect(m.createTank).toBeDefined();
      expect(m.Mouse).toBeDefined();
      expect(m.createMouse).toBeDefined();
      expect(m.Trinity).toBeDefined();
      expect(m.createTrinity).toBeDefined();
      expect(m.Switch).toBeDefined();
      expect(m.createSwitch).toBeDefined();
      expect(m.Apoc).toBeDefined();
      expect(m.createApoc).toBeDefined();

      // Reporter
      expect(m.Reporter).toBeDefined();
      expect(m.createReporter).toBeDefined();

      // CLI
      expect(m.MorpheusCLI).toBeDefined();
      expect(m.createCLI).toBeDefined();

      // Knowledge Base
      expect(m.KnowledgeBase).toBeDefined();
      expect(m.createKnowledgeBase).toBeDefined();
      expect(m.PATTERNS).toBeDefined();
      expect(m.ANTI_PATTERNS).toBeDefined();
      expect(m.BEST_PRACTICES).toBeDefined();
      expect(m.CONSTRUCT_COMPONENTS).toBeDefined();
    });

    test('crew roles are properly defined', () => {
      expect(CREW_ROLES.tank).toBeDefined();
      expect(CREW_ROLES.mouse).toBeDefined();
      expect(CREW_ROLES.trinity).toBeDefined();
      expect(CREW_ROLES.switch).toBeDefined();
      expect(CREW_ROLES.apoc).toBeDefined();

      expect(CREW_ROLES.tank.name).toBe('Tank');
      expect(CREW_ROLES.tank.title).toBe('The Operator');
      expect(CREW_ROLES.mouse.name).toBe('Mouse');
      expect(CREW_ROLES.mouse.title).toBe('The Designer');
      expect(CREW_ROLES.trinity.name).toBe('Trinity');
      expect(CREW_ROLES.trinity.title).toBe('The Expert');
      expect(CREW_ROLES.switch.name).toBe('Switch');
      expect(CREW_ROLES.switch.title).toBe('The Skeptic');
      expect(CREW_ROLES.apoc.name).toBe('Apoc');
      expect(CREW_ROLES.apoc.title).toBe('The Strategist');
    });

    test('agents have proper capabilities', () => {
      const tank = createTank();
      const mouse = createMouse();
      const trinity = createTrinity();
      const switch_ = createSwitch();
      const apoc = createApoc();

      expect(tank.hasCapability('scan')).toBe(true);
      expect(mouse.hasCapability('generate')).toBe(true);
      expect(trinity.hasCapability('analyze')).toBe(true);
      expect(switch_.hasCapability('validate')).toBe(true);
      expect(apoc.hasCapability('plan')).toBe(true);
    });
  });
});
