/**
 * Worker - Executes tasks within contracts
 *
 * Part of The Programs (Workers)
 *
 * "Every program that is created must have a purpose.
 *  If it does not, it is deleted."
 *
 * Phase 1 & 3 Implementation
 */

import type { Sentinels } from '../sentinels/sentinels.js';
import type { Contract } from '../architect/schemas/contract.schema.js';
import {
  Keymaker,
  type GenerateOptions,
  type ToolDefinition,
  type Message,
} from '../keymaker/keymaker.js';

export interface Task {
  id: string;
  type: string;
  description: string;
  inputs: Record<string, unknown>;
  expectedOutput: string;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

export interface TaskResult {
  success: boolean;
  taskId: string;
  output?: unknown;
  outputPath?: string;
  duration: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
  cost: number;
  model?: string;
  provider?: string;
  error?: string;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  sentinels: Sentinels;
  keymaker?: Keymaker;
  usePlaceholder?: boolean; // For testing without API keys
}

/**
 * Worker - Task executor
 *
 * Executes AI tasks using the Keymaker and validates results with Sentinels.
 */
export class Worker {
  private sentinels: Sentinels;
  private keymaker?: Keymaker;
  private usePlaceholder: boolean;

  constructor(config: WorkerConfig | Sentinels) {
    // Support both old and new constructor signatures
    if ('sentinels' in config) {
      this.sentinels = config.sentinels;
      if (config.keymaker) {
        this.keymaker = config.keymaker;
      }
      this.usePlaceholder = config.usePlaceholder ?? !config.keymaker;
    } else {
      // Legacy: just Sentinels passed
      this.sentinels = config;
      this.usePlaceholder = true;
    }
  }

  /**
   * Set the Keymaker (can be called after construction)
   */
  setKeymaker(keymaker: Keymaker): void {
    this.keymaker = keymaker;
    this.usePlaceholder = false;
  }

  /**
   * Execute a task within a contract
   */
  async execute(task: Task, contract: Contract): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Execute the task
      const result = await this.executeTask(task, contract);

      // Validate output with Sentinels
      const validation = await this.sentinels.validateOutput(result.output, contract);

      const duration = Date.now() - startTime;

      const taskResult: TaskResult = {
        success: validation.valid,
        taskId: task.id,
        output: result.output,
        duration,
        cost: result.cost,
      };

      if (result.tokenUsage) {
        taskResult.tokenUsage = result.tokenUsage;
      }
      if (result.model) {
        taskResult.model = result.model;
      }
      if (result.provider) {
        taskResult.provider = result.provider;
      }

      return taskResult;
    } catch (error) {
      return {
        success: false,
        taskId: task.id,
        duration: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute the actual task
   */
  private async executeTask(
    task: Task,
    contract: Contract
  ): Promise<{
    output: unknown;
    tokenUsage?: { input: number; output: number };
    cost: number;
    model?: string;
    provider?: string;
  }> {
    // Use placeholder if no Keymaker or explicitly set
    if (this.usePlaceholder || !this.keymaker) {
      return {
        output: {
          message: `Task ${task.id} executed (placeholder)`,
          taskType: task.type,
        },
        cost: 0,
      };
    }

    // Build messages for the AI
    const messages = this.buildMessages(task, contract);

    // Get routing constraints from contract
    const routingConstraints = this.keymaker.getConstraintsFromContract(contract);

    // Build generate options
    const options: GenerateOptions = {
      routingConstraints,
    };

    if (contract.contract.limits?.tokens?.max_output) {
      options.maxTokens = contract.contract.limits.tokens.max_output;
    }
    if (task.tools) {
      options.tools = task.tools;
    }

    // Execute with tools if provided
    if (task.tools && task.tools.length > 0) {
      const response = await this.keymaker.executeWithTools(
        messages,
        task.tools,
        async (name, args) => {
          // Tool execution would be handled here
          // For now, return a placeholder
          return JSON.stringify({ result: `Tool ${name} executed`, args });
        },
        options
      );

      return {
        output: this.parseOutput(response.content, task.expectedOutput),
        tokenUsage: {
          input: response.tokenUsage.input,
          output: response.tokenUsage.output,
        },
        cost: response.cost,
        model: response.model,
        provider: response.provider,
      };
    }

    // Simple generation without tools
    const response = await this.keymaker.chat(messages, options);

    return {
      output: this.parseOutput(response.content, task.expectedOutput),
      tokenUsage: {
        input: response.tokenUsage.input,
        output: response.tokenUsage.output,
      },
      cost: response.cost,
      model: response.model,
      provider: response.provider,
    };
  }

  /**
   * Build messages for the AI call
   */
  private buildMessages(task: Task, contract: Contract): Message[] {
    const messages: Message[] = [];

    // System prompt
    const systemPrompt = this.buildSystemPrompt(task, contract);
    messages.push({ role: 'system', content: systemPrompt });

    // User prompt with task details
    const userPrompt = this.buildUserPrompt(task);
    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }

  /**
   * Build system prompt from contract context
   */
  private buildSystemPrompt(task: Task, contract: Contract): string {
    const parts: string[] = [];

    // Use custom system prompt if provided
    if (task.systemPrompt) {
      parts.push(task.systemPrompt);
    } else {
      // Default system prompt from contract
      parts.push(`You are an AI assistant executing a task for: ${contract.contract.name}`);

      // Add goals
      if (contract.contract.goals.objectives.length > 0) {
        parts.push('\nObjectives:');
        parts.push(...contract.contract.goals.objectives.map(o => `- ${o}`));
      }
    }

    // Add limitations
    const limitations = contract.contract.limitations;
    if (limitations) {
      if (limitations.constraints && limitations.constraints.length > 0) {
        parts.push('\nConstraints you must follow:');
        parts.push(...limitations.constraints.map(c => `- ${c}`));
      }

      if (limitations.forbidden_actions && limitations.forbidden_actions.length > 0) {
        parts.push('\nForbidden actions:');
        parts.push(...limitations.forbidden_actions.map(a => `- Do not ${a}`));
      }
    }

    // Add expected output format
    parts.push(`\nExpected output format: ${task.expectedOutput}`);

    return parts.join('\n');
  }

  /**
   * Build user prompt from task
   */
  private buildUserPrompt(task: Task): string {
    const parts: string[] = [];

    // Task description
    parts.push(task.description);

    // Task inputs
    if (Object.keys(task.inputs).length > 0) {
      parts.push('\nInputs:');
      for (const [key, value] of Object.entries(task.inputs)) {
        if (typeof value === 'string') {
          parts.push(`${key}: ${value}`);
        } else {
          parts.push(`${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Parse AI output based on expected format
   */
  private parseOutput(content: string | null, expectedFormat: string): unknown {
    if (!content) {
      return null;
    }

    // Try to parse as JSON if expected
    if (expectedFormat.toLowerCase().includes('json') ||
        expectedFormat.toLowerCase().includes('object')) {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch?.[1]) {
          return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(content);
      } catch {
        // Return as string if JSON parsing fails
        return content;
      }
    }

    // Return as string for other formats
    return content;
  }

  /**
   * Execute multiple tasks in sequence
   */
  async executeSequence(tasks: Task[], contract: Contract): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    for (const task of tasks) {
      const result = await this.execute(task, contract);
      results.push(result);

      // Stop on first failure if contract requires it
      if (!result.success && contract.contract.limits?.retries?.max_attempts === 0) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(tasks: Task[], contract: Contract): Promise<TaskResult[]> {
    return Promise.all(tasks.map(task => this.execute(task, contract)));
  }
}
