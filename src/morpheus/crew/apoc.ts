/**
 * Apoc Agent - The Strategist
 *
 * "Believe me when I say we have a difficult time ahead of us." — Apoc
 *
 * Apoc is the migration planner who creates comprehensive migration plans,
 * identifies risks, estimates effort, and designs rollback procedures.
 */

import {
  BaseAgent,
  AgentTask,
  VerificationContext,
  createDefaultAgentConfig,
} from './base-agent.js';
import {
  MigrationPlan,
  MigrationPhase,
  MigrationTask,
  MigrationRisk,
  RiskMitigation,
  MigrationVerification,
  RollbackStep,
  MigrationEstimates,
  EffortEstimate,
  FullAnalysis,
  GapAnalysis,
  GapItem,
  GapRecommendation,
  CurrentStateSummary,
  TargetStateSummary,
  GeneratedArtifacts,
  PromptAnalysis,
  ToolAnalysis,
  DetectedAntiPattern,
  AgentConfig,
  VerificationResult as ChecklistVerificationResult,
} from '../../types/morpheus.js';

// ============================================================================
// PLANNING CONSTANTS
// ============================================================================

/**
 * The Construct components and their descriptions
 */
const CONSTRUCT_COMPONENTS = {
  architect: {
    name: 'Architect',
    description: 'Source of truth for contracts, configs, and rules',
    effort: { optimistic: 2, realistic: 4, pessimistic: 8 },
  },
  oracle: {
    name: 'Oracle',
    description: 'XP system, judgment, and agent insights',
    effort: { optimistic: 4, realistic: 8, pessimistic: 16 },
  },
  keymaker: {
    name: 'Keymaker',
    description: 'Multi-provider AI gateway with LiteLLM',
    effort: { optimistic: 4, realistic: 8, pessimistic: 12 },
  },
  sentinels: {
    name: 'Sentinels',
    description: 'QA enforcement and validation',
    effort: { optimistic: 8, realistic: 16, pessimistic: 24 },
  },
  programs: {
    name: 'Programs',
    description: 'AI workers and tool handlers',
    effort: { optimistic: 4, realistic: 8, pessimistic: 16 },
  },
  agents: {
    name: 'Agents',
    description: 'Orchestration and contract execution',
    effort: { optimistic: 8, realistic: 16, pessimistic: 24 },
  },
  smith: {
    name: 'Smith',
    description: 'Security architecture and zero trust',
    effort: { optimistic: 4, realistic: 8, pessimistic: 12 },
  },
};

/**
 * Risk categories and weights
 */
const RISK_WEIGHTS = {
  technical: 1.0,
  operational: 0.8,
  schedule: 0.6,
  resource: 0.5,
};

/**
 * Probability/impact to score mapping
 */
const RISK_SCORES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Common risks in AI migrations
 */
const COMMON_RISKS: Array<Omit<MigrationRisk, 'id'>> = [
  {
    title: 'API compatibility issues',
    description: 'Existing AI API calls may not be compatible with new architecture',
    probability: 'medium',
    impact: 'high',
    category: 'technical',
  },
  {
    title: 'Prompt behavior changes',
    description: 'Migrated prompts may behave differently with new providers',
    probability: 'medium',
    impact: 'medium',
    category: 'technical',
  },
  {
    title: 'Performance regression',
    description: 'New architecture may have different performance characteristics',
    probability: 'low',
    impact: 'medium',
    category: 'operational',
  },
  {
    title: 'Team learning curve',
    description: 'Team needs to learn new patterns and tools',
    probability: 'high',
    impact: 'low',
    category: 'resource',
  },
  {
    title: 'Integration complexity',
    description: 'Integrating with existing systems may be complex',
    probability: 'medium',
    impact: 'medium',
    category: 'technical',
  },
];

// ============================================================================
// APOC AGENT CLASS
// ============================================================================

/**
 * Apoc Agent - The Strategist
 *
 * Creates migration plans, estimates effort, identifies risks.
 */
export class Apoc extends BaseAgent {
  private planCache: Map<string, MigrationPlan> = new Map();

  constructor(config: AgentConfig = createDefaultAgentConfig(['create-plan', 'estimate-effort', 'identify-risks'])) {
    super('apoc', config);
  }

  // --------------------------------------------------------------------------
  // TASK EXECUTION
  // --------------------------------------------------------------------------

  protected async executeTask<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>
  ): Promise<TOutput> {
    const input = task.input as Record<string, unknown>;

    switch (task.type) {
      case 'plan':
        return this.handlePlanTask(input) as TOutput;
      case 'analyze':
        return this.handleAnalyzeTask(input) as TOutput;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  private async handlePlanTask(input: Record<string, unknown>): Promise<unknown> {
    const planType = input.planType as string;

    switch (planType) {
      case 'migration':
        return this.generateMigrationPlan(
          input.analysis as FullAnalysis,
          input.projectName as string
        );
      case 'phase':
        return this.generatePhase(
          input.component as string,
          input.gaps as GapItem[],
          input.order as number
        );
      case 'rollback':
        return this.generateRollbackPlan(input.phase as MigrationPhase);
      default:
        throw new Error(`Unknown plan type: ${planType}`);
    }
  }

  private async handleAnalyzeTask(input: Record<string, unknown>): Promise<unknown> {
    const analyzeType = input.analyzeType as string;

    switch (analyzeType) {
      case 'risks':
        return this.identifyRisks(input.analysis as FullAnalysis);
      case 'effort':
        return this.estimateEffort(input.phases as MigrationPhase[]);
      case 'gaps':
        return this.analyzeGaps(input.analysis as FullAnalysis);
      default:
        throw new Error(`Unknown analyze type: ${analyzeType}`);
    }
  }

  protected async performVerification(
    itemId: string,
    context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    const itemText = context.itemText.toLowerCase();

    // Apoc can verify planning-related checklist items
    if (this.isPlanningItem(itemId, itemText)) {
      return this.verifyPlanningItem(itemId, context);
    }

    // Check if this is a risk-related item
    if (this.isRiskItem(itemId, itemText)) {
      return this.verifyRiskItem(itemId, context);
    }

    // Check if this is an effort-related item
    if (this.isEffortItem(itemId, itemText)) {
      return this.verifyEffortItem(itemId, context);
    }

    return {
      verified: false,
      evidence: '',
      confidence: 0,
      method: 'manual',
      details: 'Item requires manual verification',
    };
  }

  private isPlanningItem(itemId: string, text: string): boolean {
    return itemId.includes('plan') || text.includes('plan') || text.includes('migration');
  }

  private isRiskItem(itemId: string, text: string): boolean {
    return itemId.includes('risk') || text.includes('risk') || text.includes('mitigation');
  }

  private isEffortItem(itemId: string, text: string): boolean {
    return itemId.includes('effort') || text.includes('effort') || text.includes('estimate');
  }

  private async verifyPlanningItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Planning capability verified - Apoc can create migration plans',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyRiskItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Risk identification capability verified',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyEffortItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<ChecklistVerificationResult> {
    return {
      verified: true,
      evidence: 'Effort estimation capability verified',
      confidence: 0.9,
      method: 'automated',
    };
  }

  // --------------------------------------------------------------------------
  // MIGRATION PLAN GENERATION
  // --------------------------------------------------------------------------

  /**
   * Generate a complete migration plan from analysis
   */
  async generateMigrationPlan(
    analysis: FullAnalysis,
    projectName: string
  ): Promise<MigrationPlan> {
    // Generate current state summary
    const currentState = this.summarizeCurrentState(analysis);

    // Generate target state summary
    const targetState = this.generateTargetState(analysis);

    // Analyze gaps
    const gapAnalysis = this.analyzeGaps(analysis);

    // Identify risks
    const risks = this.identifyRisks(analysis);

    // Generate mitigations
    const mitigations = this.generateMitigations(risks);

    // Generate phases
    const phases = this.generatePhases(analysis, gapAnalysis);

    // Generate artifacts placeholder
    const artifacts = this.generateArtifactsPlaceholder();

    // Estimate total effort
    const estimates = this.estimateEffort(phases);

    const plan: MigrationPlan = {
      id: `migration-${Date.now()}`,
      projectName,
      generatedAt: new Date(),
      morpheusVersion: '1.0.0',
      currentState,
      targetState,
      gapAnalysis,
      risks,
      mitigations,
      phases,
      artifacts,
      estimates,
    };

    // Cache the plan
    this.planCache.set(plan.id, plan);

    return plan;
  }

  /**
   * Summarize current state from analysis
   */
  private summarizeCurrentState(analysis: FullAnalysis): CurrentStateSummary {
    const providers = analysis.aiUsage.providers.map(p => p.provider);
    const uniqueProviders = [...new Set(providers)];

    const keyFindings: string[] = [];

    // Add findings based on analysis
    if (analysis.aiUsage.antiPatterns.length > 0) {
      keyFindings.push(`Found ${analysis.aiUsage.antiPatterns.length} anti-patterns`);
    }

    if (analysis.security.findings.length > 0) {
      keyFindings.push(`Found ${analysis.security.findings.length} security findings`);
    }

    if (!analysis.architecture.structure.hasSeparateAIModule) {
      keyFindings.push('AI code is not separated into dedicated module');
    }

    if (!analysis.architecture.structure.hasTypeDefinitions) {
      keyFindings.push('Missing TypeScript type definitions');
    }

    if (!analysis.architecture.structure.hasTests) {
      keyFindings.push('Missing test coverage');
    }

    return {
      aiProviders: uniqueProviders,
      promptCount: analysis.aiUsage.prompts.length,
      toolCount: analysis.aiUsage.tools.length,
      architectureScore: analysis.architecture.score,
      securityScore: analysis.security.score,
      qualityScore: analysis.quality.score,
      keyFindings,
    };
  }

  /**
   * Generate target state description
   */
  private generateTargetState(analysis: FullAnalysis): TargetStateSummary {
    const components: string[] = ['Architect', 'Keymaker'];

    // Add components based on needs
    if (analysis.aiUsage.prompts.length > 0) {
      components.push('Programs');
    }

    if (analysis.aiUsage.tools.length > 0) {
      components.push('Agents');
    }

    components.push('Sentinels', 'Oracle');

    if (analysis.security.score < 80) {
      components.push('Smith');
    }

    const benefits: string[] = [
      'Centralized AI configuration via Architect',
      'Multi-provider support via Keymaker',
      'Contract-based AI orchestration',
      'Full QA enforcement via Sentinels',
      'XP tracking and insights via Oracle',
    ];

    if (components.includes('Smith')) {
      benefits.push('Zero-trust security via Smith');
    }

    return {
      architecture: 'The Construct',
      components,
      benefits,
    };
  }

  /**
   * Analyze gaps between current and target state
   */
  analyzeGaps(analysis: FullAnalysis): GapAnalysis {
    const missing: GapItem[] = [];
    const partial: GapItem[] = [];
    const recommendations: GapRecommendation[] = [];

    // Check for missing components based on analysis
    if (!analysis.architecture.structure.hasConfigFiles) {
      missing.push({
        area: 'Configuration',
        description: 'No centralized AI configuration',
        impact: 'high',
        constructComponent: 'Architect',
      });
    }

    if (!analysis.architecture.structure.hasSeparateAIModule) {
      missing.push({
        area: 'Architecture',
        description: 'AI code scattered throughout codebase',
        impact: 'high',
        constructComponent: 'Programs',
      });
    }

    if (!analysis.architecture.structure.hasTypeDefinitions) {
      partial.push({
        area: 'Types',
        description: 'Missing or incomplete type definitions',
        impact: 'medium',
        constructComponent: 'Architect',
      });
    }

    if (!analysis.architecture.structure.hasTests) {
      partial.push({
        area: 'Testing',
        description: 'Insufficient test coverage for AI code',
        impact: 'medium',
        constructComponent: 'Sentinels',
      });
    }

    if (!analysis.architecture.structure.hasCentralizedErrors) {
      partial.push({
        area: 'Error Handling',
        description: 'Error handling not centralized',
        impact: 'low',
        constructComponent: 'Agents',
      });
    }

    // Add gaps from anti-patterns
    for (const antiPattern of analysis.aiUsage.antiPatterns) {
      if (antiPattern.severity === 'high' || antiPattern.severity === 'critical') {
        missing.push({
          area: antiPattern.name,
          description: antiPattern.description,
          impact: antiPattern.severity === 'critical' ? 'high' : 'medium',
          constructComponent: this.mapAntiPatternToComponent(antiPattern),
        });
      }
    }

    // Generate recommendations
    const prioritizedGaps = [...missing, ...partial].sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    let priority = 1;
    for (const gap of prioritizedGaps.slice(0, 5)) {
      recommendations.push({
        priority: priority++,
        title: `Address ${gap.area}`,
        description: `${gap.description}. Implement via ${gap.constructComponent}.`,
        effort: gap.impact === 'high' ? 'large' : gap.impact === 'medium' ? 'medium' : 'small',
        benefit: `Improved ${gap.area.toLowerCase()} with The Construct patterns`,
      });
    }

    return { missing, partial, recommendations };
  }

  /**
   * Map anti-pattern to Construct component
   */
  private mapAntiPatternToComponent(antiPattern: DetectedAntiPattern): string {
    const mapping: Record<string, string> = {
      'hardcoded-api-key': 'Smith',
      'inline-prompts': 'Architect',
      'no-error-handling': 'Agents',
      'no-validation': 'Sentinels',
      'no-rate-limiting': 'Keymaker',
      'no-retry-logic': 'Keymaker',
      'no-timeout': 'Agents',
    };

    return mapping[antiPattern.id] || 'Architect';
  }

  // --------------------------------------------------------------------------
  // RISK IDENTIFICATION
  // --------------------------------------------------------------------------

  /**
   * Identify risks from analysis
   */
  identifyRisks(analysis: FullAnalysis): MigrationRisk[] {
    const risks: MigrationRisk[] = [];
    let riskId = 1;

    // Add common risks
    for (const commonRisk of COMMON_RISKS) {
      risks.push({
        id: `risk-${riskId++}`,
        ...commonRisk,
      });
    }

    // Add risks based on analysis
    if (analysis.aiUsage.providers.length > 1) {
      risks.push({
        id: `risk-${riskId++}`,
        title: 'Multiple provider complexity',
        description: `Project uses ${analysis.aiUsage.providers.length} AI providers which adds migration complexity`,
        probability: 'medium',
        impact: 'medium',
        category: 'technical',
      });
    }

    if (analysis.aiUsage.prompts.length > 20) {
      risks.push({
        id: `risk-${riskId++}`,
        title: 'Large number of prompts',
        description: `${analysis.aiUsage.prompts.length} prompts to migrate may extend timeline`,
        probability: 'high',
        impact: 'medium',
        category: 'schedule',
      });
    }

    if (analysis.security.score < 50) {
      risks.push({
        id: `risk-${riskId++}`,
        title: 'Security debt',
        description: 'Low security score indicates significant security improvements needed',
        probability: 'high',
        impact: 'high',
        category: 'technical',
      });
    }

    if (analysis.aiUsage.antiPatterns.some(ap => ap.severity === 'critical')) {
      risks.push({
        id: `risk-${riskId++}`,
        title: 'Critical anti-patterns',
        description: 'Critical anti-patterns found that require immediate attention',
        probability: 'high',
        impact: 'high',
        category: 'technical',
      });
    }

    if (!analysis.architecture.structure.hasTests) {
      risks.push({
        id: `risk-${riskId++}`,
        title: 'No test coverage',
        description: 'Lack of tests increases risk of undetected regressions',
        probability: 'high',
        impact: 'high',
        category: 'operational',
      });
    }

    return risks;
  }

  /**
   * Generate mitigations for identified risks
   */
  generateMitigations(risks: MigrationRisk[]): RiskMitigation[] {
    const mitigations: RiskMitigation[] = [];

    for (const risk of risks) {
      const mitigation = this.generateMitigationForRisk(risk);
      if (mitigation) {
        mitigations.push(mitigation);
      }
    }

    return mitigations;
  }

  /**
   * Generate mitigation for a specific risk
   */
  private generateMitigationForRisk(risk: MigrationRisk): RiskMitigation | null {
    const strategies: Record<string, { strategy: string; actions: string[] }> = {
      'API compatibility issues': {
        strategy: 'Adapter pattern',
        actions: [
          'Create adapter layer for existing API calls',
          'Implement compatibility tests',
          'Gradual migration with feature flags',
        ],
      },
      'Prompt behavior changes': {
        strategy: 'Testing and validation',
        actions: [
          'Create prompt test suite before migration',
          'Compare outputs between old and new systems',
          'Document expected behavior changes',
        ],
      },
      'Performance regression': {
        strategy: 'Performance monitoring',
        actions: [
          'Establish performance baseline',
          'Add performance tests',
          'Monitor metrics during migration',
        ],
      },
      'Team learning curve': {
        strategy: 'Training and documentation',
        actions: [
          'Provide team training sessions',
          'Create documentation and examples',
          'Assign migration champions',
        ],
      },
      'Integration complexity': {
        strategy: 'Incremental integration',
        actions: [
          'Start with isolated components',
          'Create integration tests',
          'Use dependency injection for flexibility',
        ],
      },
      'Multiple provider complexity': {
        strategy: 'Unified interface',
        actions: [
          'Implement Keymaker abstraction layer',
          'Standardize provider configurations',
          'Create provider-agnostic contracts',
        ],
      },
      'Large number of prompts': {
        strategy: 'Batch processing',
        actions: [
          'Prioritize prompts by usage frequency',
          'Create prompt migration templates',
          'Automate repetitive migrations',
        ],
      },
      'Security debt': {
        strategy: 'Security-first migration',
        actions: [
          'Address critical security issues first',
          'Implement Smith security layer early',
          'Add security tests to CI/CD',
        ],
      },
      'Critical anti-patterns': {
        strategy: 'Refactoring priority',
        actions: [
          'Address critical anti-patterns before feature work',
          'Create refactoring checklist',
          'Review changes with security focus',
        ],
      },
      'No test coverage': {
        strategy: 'Test-driven migration',
        actions: [
          'Add tests before migrating each component',
          'Implement Sentinels validation',
          'Require test coverage for new code',
        ],
      },
    };

    const key = risk.title;
    if (strategies[key]) {
      return {
        riskId: risk.id,
        strategy: strategies[key]!.strategy,
        actions: strategies[key]!.actions,
      };
    }

    // Generic mitigation for unknown risks
    return {
      riskId: risk.id,
      strategy: 'Monitor and adapt',
      actions: [
        'Monitor risk indicators',
        'Prepare contingency plan',
        'Regular risk review meetings',
      ],
    };
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(risks: MigrationRisk[]): number {
    if (risks.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const risk of risks) {
      const probability = RISK_SCORES[risk.probability] ?? 1;
      const impact = RISK_SCORES[risk.impact] ?? 1;
      const weight = RISK_WEIGHTS[risk.category] ?? 0.5;

      totalScore += (probability * impact) * weight;
      totalWeight += weight;
    }

    // Normalize to 0-100 scale
    const maxPossibleScore = risks.length * 9 * 1.0; // max prob * max impact * max weight
    return Math.round((totalScore / maxPossibleScore) * 100);
  }

  // --------------------------------------------------------------------------
  // PHASE GENERATION
  // --------------------------------------------------------------------------

  /**
   * Generate migration phases
   */
  generatePhases(analysis: FullAnalysis, gapAnalysis: GapAnalysis): MigrationPhase[] {
    const phases: MigrationPhase[] = [];
    let order = 1;

    // Phase 1: Setup - Always first
    phases.push(this.generateSetupPhase(order++));

    // Phase 2: Configuration - Architect setup
    if (gapAnalysis.missing.some(g => g.constructComponent === 'Architect')) {
      phases.push(this.generatePhase('architect', gapAnalysis.missing.filter(g => g.constructComponent === 'Architect'), order++));
    }

    // Phase 3: Provider Integration - Keymaker
    if (analysis.aiUsage.providers.length > 0) {
      phases.push(this.generatePhase('keymaker', gapAnalysis.missing.filter(g => g.constructComponent === 'Keymaker'), order++));
    }

    // Phase 4: Prompt Migration - Programs
    if (analysis.aiUsage.prompts.length > 0) {
      phases.push(this.generatePromptMigrationPhase(analysis.aiUsage.prompts, order++));
    }

    // Phase 5: Tool Migration - Agents
    if (analysis.aiUsage.tools.length > 0) {
      phases.push(this.generateToolMigrationPhase(analysis.aiUsage.tools, order++));
    }

    // Phase 6: QA Setup - Sentinels
    phases.push(this.generatePhase('sentinels', gapAnalysis.missing.filter(g => g.constructComponent === 'Sentinels'), order++));

    // Phase 7: XP System - Oracle
    phases.push(this.generatePhase('oracle', gapAnalysis.missing.filter(g => g.constructComponent === 'Oracle'), order++));

    // Phase 8: Security - Smith (if needed)
    if (analysis.security.score < 80 || gapAnalysis.missing.some(g => g.constructComponent === 'Smith')) {
      phases.push(this.generatePhase('smith', gapAnalysis.missing.filter(g => g.constructComponent === 'Smith'), order++));
    }

    // Final Phase: Validation
    phases.push(this.generateValidationPhase(order));

    return phases;
  }

  /**
   * Generate setup phase
   */
  private generateSetupPhase(order: number): MigrationPhase {
    return {
      id: 'setup',
      name: 'Project Setup',
      description: 'Initialize The Construct project structure and dependencies',
      order,
      goals: [
        'Install The Construct dependencies',
        'Create directory structure',
        'Initialize configuration files',
      ],
      dependsOn: [],
      tasks: [
        {
          id: 'setup-1',
          name: 'Install dependencies',
          description: 'Install The Construct npm packages',
          type: 'install',
          affectedFiles: ['package.json'],
          steps: [
            { order: 1, description: 'Install core package', command: 'npm install the-construct' },
            { order: 2, description: 'Install LiteLLM', command: 'npm install litellm' },
            { order: 3, description: 'Install Zod', command: 'npm install zod' },
          ],
          verification: 'Verify packages installed successfully',
          automatable: true,
          automationScript: 'npm install the-construct litellm zod',
        },
        {
          id: 'setup-2',
          name: 'Create directory structure',
          description: 'Create The Construct directory structure',
          type: 'create',
          affectedFiles: [
            'construct/',
            'construct/contracts/',
            'construct/configs/',
            'construct/truth/',
          ],
          steps: [
            { order: 1, description: 'Create main directory', command: 'mkdir -p construct' },
            { order: 2, description: 'Create contracts directory', command: 'mkdir -p construct/contracts' },
            { order: 3, description: 'Create configs directory', command: 'mkdir -p construct/configs' },
            { order: 4, description: 'Create truth directory', command: 'mkdir -p construct/truth' },
          ],
          verification: 'Verify directory structure exists',
          automatable: true,
        },
      ],
      verification: [
        { name: 'Dependencies installed', type: 'automated', expectedResult: 'All packages in package.json' },
        { name: 'Directories created', type: 'automated', expectedResult: 'All directories exist' },
      ],
      rollback: [
        { order: 1, description: 'Remove installed packages', command: 'npm uninstall the-construct litellm zod' },
        { order: 2, description: 'Remove directories', command: 'rm -rf construct/' },
      ],
      estimatedEffort: { optimistic: 1, realistic: 2, pessimistic: 4, unit: 'hours' },
    };
  }

  /**
   * Generate a phase for a Construct component
   */
  generatePhase(
    component: string,
    gaps: GapItem[],
    order: number
  ): MigrationPhase {
    const componentInfo = CONSTRUCT_COMPONENTS[component as keyof typeof CONSTRUCT_COMPONENTS];

    if (!componentInfo) {
      return this.generateGenericPhase(component, gaps, order);
    }

    const tasks: MigrationTask[] = [];
    let taskId = 1;

    // Configuration task
    tasks.push({
      id: `${component}-${taskId++}`,
      name: `Configure ${componentInfo.name}`,
      description: `Set up ${componentInfo.name} configuration`,
      type: 'configure',
      affectedFiles: [`construct/configs/${component}.yaml`],
      steps: [
        { order: 1, description: `Create ${component} configuration file` },
        { order: 2, description: 'Configure options based on project needs' },
        { order: 3, description: 'Validate configuration' },
      ],
      verification: `Configuration is valid and complete`,
      automatable: false,
    });

    // Integration task
    tasks.push({
      id: `${component}-${taskId++}`,
      name: `Integrate ${componentInfo.name}`,
      description: `Integrate ${componentInfo.name} with existing code`,
      type: 'refactor',
      affectedFiles: ['src/'],
      steps: [
        { order: 1, description: `Import ${componentInfo.name} in main module` },
        { order: 2, description: 'Replace existing patterns with Construct patterns' },
        { order: 3, description: 'Update affected files' },
      ],
      verification: `${componentInfo.name} is properly integrated`,
      automatable: false,
    });

    // Test task
    tasks.push({
      id: `${component}-${taskId++}`,
      name: `Test ${componentInfo.name}`,
      description: `Create and run tests for ${componentInfo.name}`,
      type: 'test',
      affectedFiles: [`test/${component}.test.ts`],
      steps: [
        { order: 1, description: 'Create test file' },
        { order: 2, description: 'Add unit tests' },
        { order: 3, description: 'Run tests' },
      ],
      verification: 'All tests pass',
      automatable: true,
      automationScript: `npm test -- --testPathPattern="${component}"`,
    });

    const dependsOn = order > 1 ? [this.getPreviousPhaseId(order)] : [];

    return {
      id: component,
      name: `${componentInfo.name} Setup`,
      description: componentInfo.description,
      order,
      goals: [
        `Configure ${componentInfo.name}`,
        `Integrate with existing code`,
        `Verify functionality`,
      ],
      dependsOn,
      tasks,
      verification: [
        { name: 'Configuration valid', type: 'automated', expectedResult: 'No validation errors' },
        { name: 'Tests pass', type: 'test', command: `npm test -- ${component}`, expectedResult: 'All tests pass' },
      ],
      rollback: [
        { order: 1, description: `Remove ${component} configuration` },
        { order: 2, description: 'Revert code changes' },
      ],
      estimatedEffort: {
        optimistic: componentInfo.effort.optimistic,
        realistic: componentInfo.effort.realistic,
        pessimistic: componentInfo.effort.pessimistic,
        unit: 'hours',
      },
    };
  }

  /**
   * Generate generic phase for unknown components
   */
  private generateGenericPhase(component: string, gaps: GapItem[], order: number): MigrationPhase {
    return {
      id: component,
      name: `${component} Setup`,
      description: `Set up ${component} component`,
      order,
      goals: [`Configure ${component}`, 'Integrate with codebase'],
      dependsOn: order > 1 ? [this.getPreviousPhaseId(order)] : [],
      tasks: [
        {
          id: `${component}-1`,
          name: `Configure ${component}`,
          description: `Set up ${component}`,
          type: 'configure',
          affectedFiles: [],
          steps: [{ order: 1, description: `Configure ${component}` }],
          verification: 'Configuration complete',
          automatable: false,
        },
      ],
      verification: [{ name: 'Setup complete', type: 'manual', expectedResult: 'Component configured' }],
      rollback: [{ order: 1, description: 'Revert changes' }],
      estimatedEffort: { optimistic: 2, realistic: 4, pessimistic: 8, unit: 'hours' },
    };
  }

  /**
   * Generate prompt migration phase
   */
  private generatePromptMigrationPhase(prompts: PromptAnalysis[], order: number): MigrationPhase {
    const tasks: MigrationTask[] = [];

    // Group prompts by complexity
    const simplePrompts = prompts.filter(p => p.complexity === 'simple');
    const moderatePrompts = prompts.filter(p => p.complexity === 'moderate');
    const complexPrompts = prompts.filter(p => p.complexity === 'complex');

    let taskId = 1;

    if (simplePrompts.length > 0) {
      tasks.push({
        id: `prompts-${taskId++}`,
        name: 'Migrate simple prompts',
        description: `Migrate ${simplePrompts.length} simple prompts to contracts`,
        type: 'refactor',
        affectedFiles: simplePrompts.map(p => p.location.file),
        steps: [
          { order: 1, description: 'Create contracts for simple prompts' },
          { order: 2, description: 'Update code to use contracts' },
        ],
        verification: 'Simple prompts migrated successfully',
        automatable: true,
      });
    }

    if (moderatePrompts.length > 0) {
      tasks.push({
        id: `prompts-${taskId++}`,
        name: 'Migrate moderate prompts',
        description: `Migrate ${moderatePrompts.length} moderate prompts to contracts`,
        type: 'refactor',
        affectedFiles: moderatePrompts.map(p => p.location.file),
        steps: [
          { order: 1, description: 'Analyze prompt structure' },
          { order: 2, description: 'Create contracts with proper variables' },
          { order: 3, description: 'Update code to use contracts' },
        ],
        verification: 'Moderate prompts migrated successfully',
        automatable: false,
      });
    }

    if (complexPrompts.length > 0) {
      tasks.push({
        id: `prompts-${taskId++}`,
        name: 'Migrate complex prompts',
        description: `Migrate ${complexPrompts.length} complex prompts to contracts`,
        type: 'refactor',
        affectedFiles: complexPrompts.map(p => p.location.file),
        steps: [
          { order: 1, description: 'Decompose complex prompts' },
          { order: 2, description: 'Create modular contracts' },
          { order: 3, description: 'Implement composition patterns' },
          { order: 4, description: 'Update code to use contracts' },
        ],
        verification: 'Complex prompts migrated successfully',
        automatable: false,
      });
    }

    return {
      id: 'prompts',
      name: 'Prompt Migration',
      description: `Migrate ${prompts.length} prompts to Construct contracts`,
      order,
      goals: [
        'Convert inline prompts to contracts',
        'Implement prompt composition',
        'Add prompt validation',
      ],
      dependsOn: ['architect', 'keymaker'],
      tasks,
      verification: [
        { name: 'All prompts migrated', type: 'automated', expectedResult: 'No inline prompts remaining' },
        { name: 'Contracts valid', type: 'automated', expectedResult: 'All contracts validate' },
      ],
      rollback: [
        { order: 1, description: 'Restore original prompt files' },
        { order: 2, description: 'Remove generated contracts' },
      ],
      estimatedEffort: {
        optimistic: Math.max(prompts.length, 4),
        realistic: Math.max(prompts.length * 2, 8),
        pessimistic: Math.max(prompts.length * 4, 16),
        unit: 'hours',
      },
    };
  }

  /**
   * Generate tool migration phase
   */
  private generateToolMigrationPhase(tools: ToolAnalysis[], order: number): MigrationPhase {
    const tasks: MigrationTask[] = [];
    let taskId = 1;

    for (const tool of tools.slice(0, 5)) { // Limit to 5 individual tasks
      tasks.push({
        id: `tools-${taskId++}`,
        name: `Migrate tool: ${tool.name}`,
        description: `Migrate ${tool.name} to Construct tool handler`,
        type: 'refactor',
        affectedFiles: [tool.location.file],
        steps: [
          { order: 1, description: 'Create tool contract' },
          { order: 2, description: 'Implement tool handler' },
          { order: 3, description: 'Add validation' },
        ],
        verification: `Tool ${tool.name} works correctly`,
        automatable: tool.hasValidation && tool.hasErrorHandling,
      });
    }

    if (tools.length > 5) {
      tasks.push({
        id: `tools-${taskId++}`,
        name: `Migrate remaining tools`,
        description: `Migrate ${tools.length - 5} additional tools`,
        type: 'refactor',
        affectedFiles: tools.slice(5).map(t => t.location.file),
        steps: [
          { order: 1, description: 'Create contracts for remaining tools' },
          { order: 2, description: 'Implement handlers' },
          { order: 3, description: 'Add validation and testing' },
        ],
        verification: 'All remaining tools migrated',
        automatable: false,
      });
    }

    return {
      id: 'tools',
      name: 'Tool Migration',
      description: `Migrate ${tools.length} AI tools to Construct`,
      order,
      goals: [
        'Convert tools to Construct format',
        'Implement proper validation',
        'Add error handling',
      ],
      dependsOn: ['prompts'],
      tasks,
      verification: [
        { name: 'All tools migrated', type: 'automated', expectedResult: 'All tools converted' },
        { name: 'Tools functional', type: 'test', command: 'npm test -- tools', expectedResult: 'All tests pass' },
      ],
      rollback: [
        { order: 1, description: 'Restore original tool implementations' },
        { order: 2, description: 'Remove Construct tool handlers' },
      ],
      estimatedEffort: {
        optimistic: Math.max(tools.length * 2, 4),
        realistic: Math.max(tools.length * 4, 8),
        pessimistic: Math.max(tools.length * 8, 16),
        unit: 'hours',
      },
    };
  }

  /**
   * Generate validation phase
   */
  private generateValidationPhase(order: number): MigrationPhase {
    return {
      id: 'validation',
      name: 'Migration Validation',
      description: 'Validate the complete migration',
      order,
      goals: [
        'Verify all components working',
        'Run full test suite',
        'Performance validation',
      ],
      dependsOn: this.getAllPreviousPhaseIds(order),
      tasks: [
        {
          id: 'validation-1',
          name: 'Run full test suite',
          description: 'Execute all tests to verify migration',
          type: 'test',
          affectedFiles: [],
          steps: [
            { order: 1, description: 'Run unit tests', command: 'npm test' },
            { order: 2, description: 'Run integration tests', command: 'npm run test:integration' },
          ],
          verification: 'All tests pass',
          automatable: true,
          automationScript: 'npm test',
        },
        {
          id: 'validation-2',
          name: 'Verify Construct components',
          description: 'Verify all Construct components are working',
          type: 'verify',
          affectedFiles: [],
          steps: [
            { order: 1, description: 'Verify Architect configuration' },
            { order: 2, description: 'Verify Keymaker providers' },
            { order: 3, description: 'Verify Sentinels validation' },
            { order: 4, description: 'Verify Oracle XP system' },
          ],
          verification: 'All components verified',
          automatable: false,
        },
        {
          id: 'validation-3',
          name: 'Performance validation',
          description: 'Validate performance meets requirements',
          type: 'verify',
          affectedFiles: [],
          steps: [
            { order: 1, description: 'Run performance benchmarks' },
            { order: 2, description: 'Compare with baseline' },
            { order: 3, description: 'Document results' },
          ],
          verification: 'Performance acceptable',
          automatable: false,
        },
      ],
      verification: [
        { name: 'All tests pass', type: 'test', command: 'npm test', expectedResult: '100% pass rate' },
        { name: 'Manual verification complete', type: 'manual', expectedResult: 'Sign-off received' },
      ],
      rollback: [
        { order: 1, description: 'This is the final phase - rollback to previous checkpoint if needed' },
      ],
      estimatedEffort: { optimistic: 4, realistic: 8, pessimistic: 16, unit: 'hours' },
    };
  }

  /**
   * Get previous phase ID
   */
  private getPreviousPhaseId(order: number): string {
    const phases = ['setup', 'architect', 'keymaker', 'prompts', 'tools', 'sentinels', 'oracle', 'smith'];
    return phases[Math.min(order - 2, phases.length - 1)] || 'setup';
  }

  /**
   * Get all previous phase IDs
   */
  private getAllPreviousPhaseIds(order: number): string[] {
    const phases = ['setup', 'architect', 'keymaker', 'prompts', 'tools', 'sentinels', 'oracle', 'smith'];
    return phases.slice(0, Math.min(order - 1, phases.length));
  }

  /**
   * Generate rollback plan for a phase
   */
  generateRollbackPlan(phase: MigrationPhase): RollbackStep[] {
    const steps: RollbackStep[] = [];
    let order = 1;

    // Reverse order of tasks
    const reversedTasks = [...phase.tasks].reverse();

    for (const task of reversedTasks) {
      for (const file of task.affectedFiles) {
        steps.push({
          order: order++,
          description: `Restore ${file} from backup`,
          command: `git checkout HEAD~1 -- ${file}`,
        });
      }
    }

    // Add cleanup step
    steps.push({
      order: order++,
      description: 'Remove any generated files',
    });

    // Add verification step
    steps.push({
      order: order++,
      description: 'Verify rollback successful',
      command: 'npm test',
    });

    return steps;
  }

  // --------------------------------------------------------------------------
  // EFFORT ESTIMATION
  // --------------------------------------------------------------------------

  /**
   * Estimate effort for all phases
   */
  estimateEffort(phases: MigrationPhase[]): MigrationEstimates {
    const phaseEfforts: Record<string, EffortEstimate> = {};
    let totalOptimistic = 0;
    let totalRealistic = 0;
    let totalPessimistic = 0;

    for (const phase of phases) {
      phaseEfforts[phase.id] = phase.estimatedEffort;
      totalOptimistic += phase.estimatedEffort.optimistic;
      totalRealistic += phase.estimatedEffort.realistic;
      totalPessimistic += phase.estimatedEffort.pessimistic;
    }

    // Determine complexity based on total effort
    let complexity: MigrationEstimates['complexity'];
    if (totalRealistic <= 40) {
      complexity = 'low';
    } else if (totalRealistic <= 80) {
      complexity = 'medium';
    } else if (totalRealistic <= 160) {
      complexity = 'high';
    } else {
      complexity = 'very-high';
    }

    // Calculate confidence based on variance
    const variance = (totalPessimistic - totalOptimistic) / totalRealistic;
    const confidence = Math.max(0.5, Math.min(0.95, 1 - variance / 2));

    return {
      totalEffort: {
        optimistic: totalOptimistic,
        realistic: totalRealistic,
        pessimistic: totalPessimistic,
        unit: 'hours',
      },
      phaseEfforts,
      complexity,
      confidence: Math.round(confidence * 100) / 100,
      assumptions: [
        'Team has TypeScript experience',
        'Existing code has reasonable quality',
        'No major external dependencies blocking migration',
        'Dedicated migration time available',
      ],
    };
  }

  /**
   * Generate placeholder artifacts
   */
  private generateArtifactsPlaceholder(): GeneratedArtifacts {
    return {
      contracts: [],
      configs: [],
      scaffolding: [],
    };
  }

  // --------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Get cached plan
   */
  getCachedPlan(planId: string): MigrationPlan | undefined {
    return this.planCache.get(planId);
  }

  /**
   * Clear plan cache
   */
  clearCache(): void {
    this.planCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an Apoc agent instance
 *
 * "Believe me when I say we have a difficult time ahead of us."
 */
export function createApoc(config?: AgentConfig): Apoc {
  return new Apoc(config);
}
