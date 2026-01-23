/**
 * Worker - Executes tasks within contracts
 *
 * Part of The Programs (Workers)
 *
 * "Every program that is created must have a purpose.
 *  If it does not, it is deleted."
 *
 * Phase 1 Implementation
 */

import type { Sentinels } from '../sentinels/sentinels.js';
import type { Contract } from '../architect/schemas/contract.schema.js';

export interface Task {
  id: string;
  type: string;
  description: string;
  inputs: Record<string, unknown>;
  expectedOutput: string;
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
  error?: string;
}

/**
 * Worker - Task executor
 *
 * TODO Phase 1:
 * - Execute a single AI call with contract context
 * - Report outcome to Sentinels for validation
 */
export class Worker {
  constructor(private sentinels: Sentinels) {}

  /**
   * Execute a task within a contract
   */
  async execute(task: Task, contract: Contract): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Execute the task
      // TODO: Integrate with Keymaker for actual AI calls
      const output = await this.executeTask(task, contract);

      // Validate output with Sentinels
      const validation = await this.sentinels.validateOutput(output, contract);

      const duration = Date.now() - startTime;

      return {
        success: validation.valid,
        taskId: task.id,
        output,
        duration,
        tokenUsage: {
          input: 0,  // TODO: Track actual usage
          output: 0,
        },
        cost: 0,  // TODO: Track actual cost
      };
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
  ): Promise<unknown> {
    // TODO: Implement actual task execution
    // This will involve:
    // 1. Building the prompt from task inputs
    // 2. Calling the AI via Keymaker
    // 3. Processing the response
    // 4. Saving output if needed

    // For now, return placeholder
    return {
      message: `Task ${task.id} executed (placeholder)`,
      taskType: task.type,
    };
  }

  /**
   * Build a prompt for the AI from task inputs
   */
  private buildPrompt(task: Task, contract: Contract): string {
    // TODO: Use contract context and guidance
    const parts: string[] = [];

    // Add task description
    parts.push(`Task: ${task.description}`);

    // Add inputs
    for (const [key, value] of Object.entries(task.inputs)) {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    }

    // Add expected output format
    parts.push(`Expected output: ${task.expectedOutput}`);

    // Add limitations
    const limitations = contract.contract.limitations;
    if (limitations) {
      if (limitations.constraints) {
        parts.push('Constraints:');
        parts.push(...limitations.constraints.map(c => `- ${c}`));
      }
    }

    return parts.join('\n');
  }
}
