/**
 * Morpheus Knowledge Base - The Construct Architecture
 *
 * "The Construct is a loading program. We can load anything, from clothing
 *  to equipment, weapons, training simulations... anything we need." — Morpheus
 *
 * Knowledge about The Construct architecture and its components.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Construct component definition
 */
export interface ConstructComponent {
  id: string;
  name: string;
  role: string;
  description: string;
  responsibilities: string[];
  interfaces: ComponentInterface[];
  dependencies: string[];
  configuration: ConfigurationSpec[];
  migrationNotes: string[];
  matrixQuote?: string;
}

/**
 * Component interface definition
 */
export interface ComponentInterface {
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  description: string;
  dataType: string;
}

/**
 * Configuration specification
 */
export interface ConfigurationSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

/**
 * Migration path between current state and Construct
 */
export interface MigrationPath {
  fromPattern: string;
  toComponent: string;
  steps: string[];
  complexity: 'low' | 'medium' | 'high';
  effort: string;
}

// ============================================================================
// THE CONSTRUCT COMPONENTS
// ============================================================================

/**
 * The Architect - Source of Truth
 */
const ARCHITECT: ConstructComponent = {
  id: 'architect',
  name: 'The Architect',
  role: 'Source of Truth',
  description: 'The Architect is the source of truth for all configuration, rules, and contracts. It provides read-only access during execution and validates all configurations.',
  responsibilities: [
    'Load and validate configuration files',
    'Provide read-only access to rules and limits',
    'Manage contract definitions and schemas',
    'Handle configuration inheritance (global → project)',
    'Validate configuration changes before applying',
  ],
  interfaces: [
    {
      name: 'getConfig',
      type: 'output',
      description: 'Retrieve configuration values',
      dataType: 'ArchitectConfig',
    },
    {
      name: 'getContract',
      type: 'output',
      description: 'Retrieve contract definition by ID',
      dataType: 'Contract',
    },
    {
      name: 'getRules',
      type: 'output',
      description: 'Retrieve enforcement rules',
      dataType: 'Rule[]',
    },
    {
      name: 'validateContract',
      type: 'input',
      description: 'Validate a contract definition',
      dataType: 'ValidationResult',
    },
  ],
  dependencies: [],
  configuration: [
    {
      name: 'version',
      type: 'string',
      required: true,
      description: 'Configuration version',
      example: '"1.0.0"',
    },
    {
      name: 'truth.sources',
      type: 'string[]',
      required: true,
      description: 'Configuration file paths',
      example: '["architect.yaml", "rules.yaml"]',
    },
    {
      name: 'contracts.path',
      type: 'string',
      required: true,
      description: 'Path to contract definitions',
      example: '"contracts/"',
    },
    {
      name: 'defaults',
      type: 'object',
      required: false,
      description: 'Default values for contracts',
      example: '{ maxTokens: 4096, temperature: 0.7 }',
    },
  ],
  migrationNotes: [
    'Move hardcoded prompts to prompt files',
    'Extract configuration to YAML files',
    'Define contracts for each AI operation',
    'Set up validation schemas',
  ],
  matrixQuote: '"There are levels of survival we are prepared to accept."',
};

/**
 * The Oracle - Judgment & Insight
 */
const ORACLE: ConstructComponent = {
  id: 'oracle',
  name: 'The Oracle',
  role: 'Judgment & Insight',
  description: 'The Oracle provides judgment on AI execution quality and manages the XP/Level-Up system. It tracks agent performance and provides insights.',
  responsibilities: [
    'Judge execution results for quality',
    'Award XP for successful operations',
    'Track agent level progression',
    'Store and analyze performance metrics',
    'Provide insights and recommendations',
  ],
  interfaces: [
    {
      name: 'judge',
      type: 'input',
      description: 'Judge an execution result',
      dataType: 'JudgmentInput',
    },
    {
      name: 'getProfile',
      type: 'output',
      description: 'Get agent profile with XP and level',
      dataType: 'AgentProfile',
    },
    {
      name: 'awardXP',
      type: 'input',
      description: 'Award XP to an agent',
      dataType: 'XPAward',
    },
    {
      name: 'getInsights',
      type: 'output',
      description: 'Get performance insights',
      dataType: 'Insight[]',
    },
  ],
  dependencies: ['architect'],
  configuration: [
    {
      name: 'xp.baseAmount',
      type: 'number',
      required: true,
      description: 'Base XP for successful execution',
      example: '10',
    },
    {
      name: 'xp.bonusMultipliers',
      type: 'object',
      required: false,
      description: 'Multipliers for bonus XP',
      example: '{ quality: 1.5, speed: 1.2 }',
    },
    {
      name: 'levelThresholds',
      type: 'number[]',
      required: true,
      description: 'XP thresholds for each level',
      example: '[0, 100, 250, 500, 1000]',
    },
    {
      name: 'judgment.criteria',
      type: 'object',
      required: false,
      description: 'Criteria for judging quality',
      example: '{ accuracy: 0.4, speed: 0.3, cost: 0.3 }',
    },
  ],
  migrationNotes: [
    'Define quality metrics for AI operations',
    'Set up XP and level thresholds',
    'Configure judgment criteria',
    'Implement performance tracking',
  ],
  matrixQuote: '"I\'d ask you to sit down, but you\'re not going to anyway. And don\'t worry about the vase."',
};

/**
 * The Agents - Orchestrator
 */
const AGENTS: ConstructComponent = {
  id: 'agents',
  name: 'The Agents',
  role: 'Orchestrator',
  description: 'The Agents orchestrate AI execution by managing the contract lifecycle. They coordinate between components and ensure contracts are executed properly.',
  responsibilities: [
    'Load and parse contracts',
    'Orchestrate execution workflow',
    'Manage execution state',
    'Coordinate with Sentinels for validation',
    'Handle execution errors and retries',
  ],
  interfaces: [
    {
      name: 'execute',
      type: 'bidirectional',
      description: 'Execute a contract',
      dataType: 'ExecutionRequest → ExecutionResult',
    },
    {
      name: 'getState',
      type: 'output',
      description: 'Get current execution state',
      dataType: 'ExecutionState',
    },
    {
      name: 'abort',
      type: 'input',
      description: 'Abort current execution',
      dataType: 'void',
    },
  ],
  dependencies: ['architect', 'oracle', 'sentinels', 'programs'],
  configuration: [
    {
      name: 'execution.timeout',
      type: 'number',
      required: true,
      description: 'Default execution timeout (ms)',
      example: '30000',
    },
    {
      name: 'execution.retries',
      type: 'number',
      required: false,
      description: 'Number of retry attempts',
      example: '3',
    },
    {
      name: 'execution.parallel',
      type: 'boolean',
      required: false,
      description: 'Allow parallel contract execution',
      example: 'true',
    },
  ],
  migrationNotes: [
    'Map existing AI calls to contracts',
    'Define execution workflows',
    'Set up error handling and retries',
    'Configure timeouts appropriately',
  ],
  matrixQuote: '"Never send a human to do a machine\'s job."',
};

/**
 * The Sentinels - QA & Enforcement
 */
const SENTINELS: ConstructComponent = {
  id: 'sentinels',
  name: 'The Sentinels',
  role: 'QA & Enforcement',
  description: 'The Sentinels validate inputs, outputs, and actions. They enforce rules and block unauthorized operations.',
  responsibilities: [
    'Validate contract inputs',
    'Validate AI outputs',
    'Enforce action rules',
    'Block forbidden operations',
    'Score output quality',
  ],
  interfaces: [
    {
      name: 'validateInput',
      type: 'input',
      description: 'Validate contract input',
      dataType: 'InputValidation',
    },
    {
      name: 'validateOutput',
      type: 'input',
      description: 'Validate AI output',
      dataType: 'OutputValidation',
    },
    {
      name: 'validateAction',
      type: 'input',
      description: 'Validate a tool action',
      dataType: 'ActionValidation',
    },
    {
      name: 'getViolations',
      type: 'output',
      description: 'Get validation violations',
      dataType: 'Violation[]',
    },
  ],
  dependencies: ['architect'],
  configuration: [
    {
      name: 'validation.strict',
      type: 'boolean',
      required: false,
      description: 'Enable strict validation mode',
      example: 'true',
    },
    {
      name: 'validation.schemas',
      type: 'object',
      required: false,
      description: 'Custom validation schemas',
      example: '{ output: { type: "object" } }',
    },
    {
      name: 'rules.forbidden',
      type: 'string[]',
      required: false,
      description: 'Forbidden patterns',
      example: '["rm -rf", "sudo", ".env"]',
    },
    {
      name: 'quality.thresholds',
      type: 'object',
      required: false,
      description: 'Quality score thresholds',
      example: '{ minimum: 0.7, excellent: 0.9 }',
    },
  ],
  migrationNotes: [
    'Define input validation schemas',
    'Define output validation schemas',
    'Configure forbidden patterns',
    'Set up quality thresholds',
  ],
  matrixQuote: '"They are the gatekeepers. They are guarding all the doors."',
};

/**
 * The Programs - Workers
 */
const PROGRAMS: ConstructComponent = {
  id: 'programs',
  name: 'The Programs',
  role: 'Workers',
  description: 'The Programs are the workers that execute AI calls. They handle the actual communication with AI providers.',
  responsibilities: [
    'Execute AI API calls',
    'Handle tool/function calls',
    'Manage response streaming',
    'Track token usage',
    'Handle provider-specific logic',
  ],
  interfaces: [
    {
      name: 'run',
      type: 'bidirectional',
      description: 'Run an AI operation',
      dataType: 'RunRequest → RunResult',
    },
    {
      name: 'stream',
      type: 'output',
      description: 'Stream AI response',
      dataType: 'AsyncIterator<Token>',
    },
    {
      name: 'executeTool',
      type: 'bidirectional',
      description: 'Execute a tool call',
      dataType: 'ToolCall → ToolResult',
    },
  ],
  dependencies: ['keymaker', 'sentinels'],
  configuration: [
    {
      name: 'defaults.temperature',
      type: 'number',
      required: false,
      description: 'Default temperature',
      example: '0.7',
    },
    {
      name: 'defaults.maxTokens',
      type: 'number',
      required: false,
      description: 'Default max tokens',
      example: '4096',
    },
    {
      name: 'tools',
      type: 'Tool[]',
      required: false,
      description: 'Available tools',
      example: '[{ name: "search", handler: searchFn }]',
    },
  ],
  migrationNotes: [
    'Migrate AI call logic to workers',
    'Configure default parameters',
    'Register available tools',
    'Set up response handling',
  ],
  matrixQuote: '"The only way to deal with this, is to do it."',
};

/**
 * The Keymaker - Tool Adapter
 */
const KEYMAKER: ConstructComponent = {
  id: 'keymaker',
  name: 'The Keymaker',
  role: 'Tool Adapter',
  description: 'The Keymaker adapts to different AI providers through LiteLLM. It handles provider-specific translation and routing.',
  responsibilities: [
    'Adapt to different AI providers',
    'Translate requests to provider format',
    'Handle provider-specific features',
    'Route requests based on rules',
    'Track provider performance',
  ],
  interfaces: [
    {
      name: 'complete',
      type: 'bidirectional',
      description: 'Complete a prompt',
      dataType: 'CompletionRequest → CompletionResponse',
    },
    {
      name: 'chat',
      type: 'bidirectional',
      description: 'Chat completion',
      dataType: 'ChatRequest → ChatResponse',
    },
    {
      name: 'embed',
      type: 'bidirectional',
      description: 'Generate embeddings',
      dataType: 'EmbedRequest → EmbedResponse',
    },
  ],
  dependencies: ['architect'],
  configuration: [
    {
      name: 'providers',
      type: 'object',
      required: true,
      description: 'Provider configurations',
      example: '{ openai: { apiKey: "$OPENAI_API_KEY" } }',
    },
    {
      name: 'routing.default',
      type: 'string',
      required: true,
      description: 'Default provider',
      example: '"openai"',
    },
    {
      name: 'routing.rules',
      type: 'Rule[]',
      required: false,
      description: 'Provider routing rules',
      example: '[{ if: "cost < budget", use: "gpt-3.5" }]',
    },
    {
      name: 'fallback',
      type: 'string',
      required: false,
      description: 'Fallback provider',
      example: '"anthropic"',
    },
  ],
  migrationNotes: [
    'Configure primary provider',
    'Set up fallback providers',
    'Define routing rules',
    'Migrate provider-specific code',
  ],
  matrixQuote: '"I have been making keys since you were a little boy."',
};

/**
 * Agent Smith - Security (Optional)
 */
const SMITH: ConstructComponent = {
  id: 'smith',
  name: 'Agent Smith',
  role: 'Security',
  description: 'Agent Smith provides zero-trust security for AI operations. He validates all inputs/outputs and monitors for threats.',
  responsibilities: [
    'Enforce zero-trust security',
    'Validate input safety',
    'Monitor for prompt injection',
    'Track security events',
    'Block malicious operations',
  ],
  interfaces: [
    {
      name: 'validate',
      type: 'input',
      description: 'Validate for security threats',
      dataType: 'SecurityCheck',
    },
    {
      name: 'monitor',
      type: 'input',
      description: 'Monitor an operation',
      dataType: 'Operation',
    },
    {
      name: 'getThreats',
      type: 'output',
      description: 'Get detected threats',
      dataType: 'Threat[]',
    },
  ],
  dependencies: ['architect', 'sentinels'],
  configuration: [
    {
      name: 'security.level',
      type: 'string',
      required: false,
      description: 'Security level (low/medium/high)',
      example: '"high"',
    },
    {
      name: 'security.rules',
      type: 'Rule[]',
      required: false,
      description: 'Security rules',
      example: '[{ block: "prompt_injection" }]',
    },
    {
      name: 'monitoring.enabled',
      type: 'boolean',
      required: false,
      description: 'Enable security monitoring',
      example: 'true',
    },
  ],
  migrationNotes: [
    'Define security requirements',
    'Configure security rules',
    'Set up monitoring',
    'Enable threat detection',
  ],
  matrixQuote: '"I\'m going to be honest with you. I... hate this place."',
};

// ============================================================================
// CONSTRUCT ARCHITECTURE
// ============================================================================

/**
 * All Construct components
 */
export const CONSTRUCT_COMPONENTS: ConstructComponent[] = [
  ARCHITECT,
  ORACLE,
  AGENTS,
  SENTINELS,
  PROGRAMS,
  KEYMAKER,
  SMITH,
];

/**
 * Component dependency graph
 */
export const COMPONENT_DEPENDENCIES: Record<string, string[]> = {
  architect: [],
  oracle: ['architect'],
  agents: ['architect', 'oracle', 'sentinels', 'programs'],
  sentinels: ['architect'],
  programs: ['keymaker', 'sentinels'],
  keymaker: ['architect'],
  smith: ['architect', 'sentinels'],
};

/**
 * Recommended migration order
 */
export const MIGRATION_ORDER: string[] = [
  'architect',  // 1. Set up configuration first
  'keymaker',   // 2. Configure providers
  'sentinels',  // 3. Set up validation
  'programs',   // 4. Migrate workers
  'agents',     // 5. Set up orchestration
  'oracle',     // 6. Add judgment and XP
  'smith',      // 7. Add security (optional)
];

// ============================================================================
// MIGRATION PATHS
// ============================================================================

/**
 * Common migration paths from existing patterns
 */
export const MIGRATION_PATHS: MigrationPath[] = [
  {
    fromPattern: 'Hardcoded prompts',
    toComponent: 'architect',
    steps: [
      'Extract prompts to separate files',
      'Define prompt templates with variables',
      'Create contract definitions for each prompt',
      'Update code to load prompts from Architect',
    ],
    complexity: 'low',
    effort: '2-4 hours per prompt',
  },
  {
    fromPattern: 'Direct OpenAI SDK usage',
    toComponent: 'keymaker',
    steps: [
      'Create provider interface abstraction',
      'Implement Keymaker adapter for OpenAI',
      'Configure provider in keymaker.yaml',
      'Update code to use Keymaker',
    ],
    complexity: 'medium',
    effort: '4-8 hours',
  },
  {
    fromPattern: 'Scattered AI calls',
    toComponent: 'programs',
    steps: [
      'Identify all AI call locations',
      'Create centralized worker service',
      'Define contracts for each operation type',
      'Migrate calls to use workers',
    ],
    complexity: 'medium',
    effort: '1-2 days',
  },
  {
    fromPattern: 'No input validation',
    toComponent: 'sentinels',
    steps: [
      'Define input schemas with Zod',
      'Create validation rules',
      'Configure Sentinels validation',
      'Add validation to AI pipeline',
    ],
    complexity: 'low',
    effort: '2-4 hours',
  },
  {
    fromPattern: 'No output validation',
    toComponent: 'sentinels',
    steps: [
      'Define expected output schemas',
      'Create output validation rules',
      'Configure quality thresholds',
      'Add output validation to pipeline',
    ],
    complexity: 'low',
    effort: '2-4 hours',
  },
  {
    fromPattern: 'No error handling',
    toComponent: 'agents',
    steps: [
      'Define error categories',
      'Implement retry logic',
      'Configure timeout handling',
      'Add fallback behavior',
    ],
    complexity: 'medium',
    effort: '4-8 hours',
  },
  {
    fromPattern: 'No quality tracking',
    toComponent: 'oracle',
    steps: [
      'Define quality metrics',
      'Set up XP system',
      'Configure judgment criteria',
      'Implement performance tracking',
    ],
    complexity: 'medium',
    effort: '1 day',
  },
  {
    fromPattern: 'Security concerns',
    toComponent: 'smith',
    steps: [
      'Audit current security posture',
      'Define security rules',
      'Configure threat detection',
      'Enable security monitoring',
    ],
    complexity: 'high',
    effort: '2-3 days',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get component by ID
 */
export function getComponentById(id: string): ConstructComponent | undefined {
  return CONSTRUCT_COMPONENTS.find(c => c.id === id);
}

/**
 * Get component dependencies
 */
export function getComponentDependencies(id: string): string[] {
  return COMPONENT_DEPENDENCIES[id] || [];
}

/**
 * Get components that depend on a given component
 */
export function getDependentComponents(id: string): string[] {
  return Object.entries(COMPONENT_DEPENDENCIES)
    .filter(([_, deps]) => deps.includes(id))
    .map(([compId]) => compId);
}

/**
 * Get migration path for a pattern
 */
export function getMigrationPath(pattern: string): MigrationPath | undefined {
  return MIGRATION_PATHS.find(p =>
    p.fromPattern.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Get all migration paths for a component
 */
export function getMigrationPathsForComponent(componentId: string): MigrationPath[] {
  return MIGRATION_PATHS.filter(p => p.toComponent === componentId);
}

/**
 * Check if component can be migrated (dependencies satisfied)
 */
export function canMigrateComponent(componentId: string, migratedComponents: string[]): boolean {
  const deps = getComponentDependencies(componentId);
  return deps.every(dep => migratedComponents.includes(dep));
}

/**
 * Get next components that can be migrated
 */
export function getNextMigratableComponents(migratedComponents: string[]): string[] {
  return MIGRATION_ORDER.filter(id =>
    !migratedComponents.includes(id) &&
    canMigrateComponent(id, migratedComponents)
  );
}

/**
 * Calculate migration progress
 */
export function calculateMigrationProgress(migratedComponents: string[]): number {
  const coreComponents = MIGRATION_ORDER.filter(id => id !== 'smith'); // Smith is optional
  const migratedCore = migratedComponents.filter(id => coreComponents.includes(id));
  return (migratedCore.length / coreComponents.length) * 100;
}

/**
 * Get component configuration template
 */
export function getComponentConfigTemplate(id: string): string {
  const component = getComponentById(id);
  if (!component) return '';

  const lines = [`# ${component.name} Configuration`, ''];

  for (const config of component.configuration) {
    lines.push(`# ${config.description}`);
    if (config.required) {
      lines.push(`# Required: yes`);
    }
    lines.push(`${config.name}: ${config.example || `# ${config.type}`}`);
    lines.push('');
  }

  return lines.join('\n');
}
