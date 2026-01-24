/**
 * Base Agent - Nebuchadnezzar Crew
 *
 * "The body cannot live without the mind." — Morpheus
 *
 * Base class for all crew members (Tank, Mouse, Trinity, Switch, Apoc).
 * Each agent has specific capabilities and uses contracts from The Construct.
 */

import { EventEmitter } from 'events';
import {
  CrewMember,
  AgentResult,
  AgentError,
  AgentConfig,
  VerificationResult,
} from '../../types/morpheus.js';

// ============================================================================
// AGENT CAPABILITY TYPES
// ============================================================================

/**
 * Agent capability - what an agent can do
 */
export type AgentCapability =
  | 'scan'           // Scan files and projects
  | 'analyze'        // Analyze code and patterns
  | 'generate'       // Generate files and configs
  | 'validate'       // Validate outputs
  | 'plan'           // Create plans
  | 'verify'         // Verify checklist items
  | 'execute'        // Execute commands
  | 'transform';     // Transform code

/**
 * Agent role descriptions
 */
export const CREW_ROLES: Record<CrewMember, CrewRole> = {
  tank: {
    name: 'Tank',
    title: 'The Operator',
    quote: 'I know what you\'re thinking, because right now I\'m thinking the same thing.',
    description: 'Scans and analyzes project structure, dependencies, and configurations.',
    capabilities: ['scan', 'analyze', 'verify'],
    contracts: ['scan-project', 'analyze-dependencies', 'detect-ai-usage'],
  },
  mouse: {
    name: 'Mouse',
    title: 'The Designer',
    quote: 'To deny our own impulses is to deny the very thing that makes us human.',
    description: 'Generates contracts, configurations, and scaffolding for The Construct.',
    capabilities: ['generate', 'transform'],
    contracts: ['generate-contract', 'generate-config', 'generate-scaffolding'],
  },
  trinity: {
    name: 'Trinity',
    title: 'The Expert',
    quote: 'The answer is out there, and it\'s looking for you.',
    description: 'Deep analysis of AI usage patterns, prompts, and tool calls.',
    capabilities: ['analyze', 'verify'],
    contracts: ['analyze-prompts', 'analyze-tools', 'analyze-patterns', 'verify-checklist'],
  },
  switch: {
    name: 'Switch',
    title: 'The Skeptic',
    quote: 'Not like this. Not like this.',
    description: 'Validates migrations, ensures quality, and audits changes.',
    capabilities: ['validate', 'verify'],
    contracts: ['validate-contract', 'validate-migration', 'audit-changes'],
  },
  apoc: {
    name: 'Apoc',
    title: 'The Strategist',
    quote: 'Believe me when I say we have a difficult time ahead of us.',
    description: 'Creates migration plans, estimates effort, and manages risks.',
    capabilities: ['plan', 'analyze', 'verify'],
    contracts: ['create-plan', 'estimate-effort', 'identify-risks'],
  },
};

/**
 * Crew role definition
 */
export interface CrewRole {
  name: string;
  title: string;
  quote: string;
  description: string;
  capabilities: AgentCapability[];
  contracts: string[];
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

/**
 * Execution context for agents
 */
export interface AgentContext {
  /** Workflow state ID */
  workflowStateId?: string;
  /** Current phase ID */
  phaseId?: string;
  /** Current step ID */
  stepId?: string;
  /** Project root path */
  projectPath: string;
  /** Contract being executed */
  contractId?: string;
  /** Input parameters */
  input?: Record<string, unknown>;
  /** Whether running in dry-run mode */
  dryRun?: boolean;
  /** AI provider to use */
  provider?: string;
  /** Model to use */
  model?: string;
  /** Maximum tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
}

/**
 * Agent task definition
 */
export interface AgentTask<TInput = unknown, TOutput = unknown> {
  /** Task ID */
  id: string;
  /** Task type */
  type: AgentCapability;
  /** Contract to execute */
  contract?: string;
  /** Task input */
  input: TInput;
  /** Expected output type */
  outputType?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Agent execution options
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Number of retries */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Whether to throw on error */
  throwOnError?: boolean;
}

// ============================================================================
// BASE AGENT CLASS
// ============================================================================

/**
 * Base agent events
 */
export interface BaseAgentEvents {
  'task:started': (task: AgentTask) => void;
  'task:completed': (task: AgentTask, result: AgentResult<unknown>) => void;
  'task:failed': (task: AgentTask, error: AgentError) => void;
  'task:retrying': (task: AgentTask, attempt: number) => void;
}

/**
 * BaseAgent abstract class
 *
 * All crew members extend this class.
 */
export abstract class BaseAgent extends EventEmitter {
  /** Agent ID (crew member) */
  readonly id: CrewMember;
  /** Agent role information */
  readonly role: CrewRole;
  /** Agent configuration */
  protected config: AgentConfig;
  /** Current context */
  protected context?: AgentContext;
  /** Whether agent is busy */
  protected busy: boolean = false;

  constructor(id: CrewMember, config: AgentConfig) {
    super();
    this.id = id;
    this.role = CREW_ROLES[id];
    this.config = config;

    // Validate config contracts against role contracts
    if (config.contracts.length > 0) {
      for (const contract of config.contracts) {
        if (!this.role.contracts.includes(contract) && !contract.includes('/')) {
          console.warn(
            `[${this.role.name}] Contract "${contract}" not in standard contracts for this agent`
          );
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  /**
   * Check if agent has a capability
   */
  hasCapability(capability: AgentCapability): boolean {
    return this.role.capabilities.includes(capability);
  }

  /**
   * Check if agent is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if agent is busy
   */
  isBusy(): boolean {
    return this.busy;
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return {
      id: this.id,
      name: this.role.name,
      enabled: this.config.enabled,
      busy: this.busy,
      capabilities: this.role.capabilities,
    };
  }

  /**
   * Set execution context
   */
  setContext(context: AgentContext): void {
    this.context = context;
  }

  /**
   * Clear execution context
   */
  clearContext(): void {
    delete this.context;
  }

  /**
   * Execute a task
   */
  async execute<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>,
    options: ExecutionOptions = {}
  ): Promise<AgentResult<TOutput>> {
    if (!this.config.enabled) {
      return this.createErrorResult('AGENT_DISABLED', `${this.role.name} is disabled`);
    }

    if (this.busy) {
      return this.createErrorResult('AGENT_BUSY', `${this.role.name} is busy`);
    }

    if (!this.hasCapability(task.type)) {
      return this.createErrorResult(
        'CAPABILITY_NOT_SUPPORTED',
        `${this.role.name} does not support capability: ${task.type}`
      );
    }

    this.busy = true;
    const startedAt = new Date();

    this.emit('task:started', task);

    const timeout = options.timeout ?? task.timeout ?? 60000;
    const retries = options.retries ?? 0;
    const retryDelay = options.retryDelay ?? 1000;

    let lastError: AgentError | undefined;
    let attempt = 0;

    while (attempt <= retries) {
      if (attempt > 0) {
        this.emit('task:retrying', task, attempt);
        await this.delay(retryDelay * attempt);
      }

      try {
        const result = await this.executeWithTimeout(
          () => this.executeTask(task),
          timeout
        );

        const completedAt = new Date();
        const agentResult: AgentResult<TOutput> = {
          success: true,
          output: result as TOutput,
          timing: {
            startedAt,
            completedAt,
            duration: completedAt.getTime() - startedAt.getTime(),
          },
        };

        this.busy = false;
        this.emit('task:completed', task, agentResult);
        return agentResult;
      } catch (error) {
        lastError = this.normalizeError(error);

        if (!lastError.recoverable) {
          break;
        }

        attempt++;
      }
    }

    const completedAt = new Date();
    const errorResult: AgentResult<TOutput> = {
      success: false,
      error: lastError!,
      timing: {
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
      },
    };

    this.busy = false;
    this.emit('task:failed', task, lastError!);

    if (options.throwOnError) {
      throw new AgentExecutionError(lastError!);
    }

    return errorResult;
  }

  /**
   * Verify a checklist item
   */
  async verify(
    itemId: string,
    context: VerificationContext
  ): Promise<VerificationResult> {
    if (!this.hasCapability('verify')) {
      return {
        verified: false,
        evidence: '',
        confidence: 0,
        method: 'manual',
        details: `${this.role.name} does not support verification`,
      };
    }

    try {
      return await this.performVerification(itemId, context);
    } catch (error) {
      return {
        verified: false,
        evidence: '',
        confidence: 0,
        method: 'ai-verified',
        details: `Verification failed: ${(error as Error).message}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // ABSTRACT METHODS (Implement in subclasses)
  // --------------------------------------------------------------------------

  /**
   * Execute a task (implement in subclass)
   */
  protected abstract executeTask<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>
  ): Promise<TOutput>;

  /**
   * Perform verification (implement in subclass)
   */
  protected abstract performVerification(
    itemId: string,
    context: VerificationContext
  ): Promise<VerificationResult>;

  // --------------------------------------------------------------------------
  // PROTECTED HELPERS
  // --------------------------------------------------------------------------

  /**
   * Create an error result
   */
  protected createErrorResult<T>(code: string, message: string): AgentResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        recoverable: false,
      },
      timing: {
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
      },
    };
  }

  /**
   * Normalize error to AgentError
   */
  protected normalizeError(error: unknown): AgentError {
    if (error instanceof AgentExecutionError) {
      return error.agentError;
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        recoverable: this.isRecoverableError(error),
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      recoverable: false,
    };
  }

  /**
   * Check if error is recoverable
   */
  protected isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /timeout/i,
      /rate limit/i,
      /429/,
      /503/,
      /connection/i,
      /ECONNRESET/,
      /ETIMEDOUT/,
    ];

    return recoverablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Execute with timeout
   */
  protected async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get setting from config
   */
  protected getSetting<T>(key: string, defaultValue: T): T {
    if (this.config.settings && key in this.config.settings) {
      return this.config.settings[key] as T;
    }
    return defaultValue;
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Agent status
 */
export interface AgentStatus {
  id: CrewMember;
  name: string;
  enabled: boolean;
  busy: boolean;
  capabilities: AgentCapability[];
}

/**
 * Verification context
 */
export interface VerificationContext {
  phaseId: string;
  checklistItemId: string;
  itemText: string;
  contract?: string;
  projectPath: string;
  evidence?: string;
}

/**
 * Agent execution error
 */
export class AgentExecutionError extends Error {
  constructor(public readonly agentError: AgentError) {
    super(agentError.message);
    this.name = 'AgentExecutionError';
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create default agent config
 */
export function createDefaultAgentConfig(
  contracts: string[] = []
): AgentConfig {
  return {
    enabled: true,
    contracts,
    settings: {},
  };
}

/**
 * Check if a crew member ID is valid
 */
export function isValidCrewMember(id: string): id is CrewMember {
  return ['tank', 'mouse', 'trinity', 'switch', 'apoc'].includes(id);
}

/**
 * Get crew member by name
 */
export function getCrewMemberByName(name: string): CrewMember | undefined {
  const normalized = name.toLowerCase();
  if (isValidCrewMember(normalized)) {
    return normalized;
  }
  return undefined;
}

/**
 * Get all crew members
 */
export function getAllCrewMembers(): CrewMember[] {
  return ['tank', 'mouse', 'trinity', 'switch', 'apoc'];
}
