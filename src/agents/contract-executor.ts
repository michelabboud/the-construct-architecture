/**
 * Contract Executor - Executes contracts
 *
 * Part of The Agents (Orchestrator)
 *
 * Phase 1 & 2 Implementation
 */

import type { Architect } from '../architect/architect.js';
import type { Sentinels } from '../sentinels/sentinels.js';
import type { Contract } from '../architect/schemas/contract.schema.js';
import type { Oracle } from '../oracle/oracle.js';
import type { Judgment } from '../types/judgment.js';

export interface ExecutionResult {
  success: boolean;
  contractId: string;
  output?: unknown;
  outputPath?: string;
  duration: number;
  cost: number;
  retries: number;
  validation?: {
    valid: boolean;
    score: number;
    errors: string[];
  };
  judgment?: Judgment;
  error?: string;
}

export interface ExecutionContext {
  startTime: number;
  cost: number;
  retries: number;
  toolsUsed: string[];
}

/**
 * Contract Executor Configuration
 */
export interface ContractExecutorConfig {
  architect: Architect;
  sentinels: Sentinels;
  oracle?: Oracle;
  agentId?: string;
}

/**
 * Contract Executor
 *
 * Executes contracts and reports results to the Oracle for judgment.
 */
export class ContractExecutor {
  private architect: Architect;
  private sentinels: Sentinels;
  private oracle?: Oracle;
  private agentId: string;

  constructor(config: ContractExecutorConfig) {
    this.architect = config.architect;
    this.sentinels = config.sentinels;
    if (config.oracle) {
      this.oracle = config.oracle;
    }
    this.agentId = config.agentId ?? 'default/agent';
  }

  /**
   * Execute a contract
   */
  async execute(contract: Contract): Promise<ExecutionResult> {
    const startTime = Date.now();
    const context: ExecutionContext = {
      startTime,
      cost: 0,
      retries: 0,
      toolsUsed: [],
    };

    try {
      // Validate contract against Architect rules
      const contractValidation = this.architect.validateContract(contract);
      if (!contractValidation.valid) {
        return {
          success: false,
          contractId: contract.contract.id,
          duration: Date.now() - startTime,
          cost: 0,
          retries: 0,
          error: `Contract validation failed: ${contractValidation.errors.join(', ')}`,
        };
      }

      // Execute the contract
      const output = await this.executeContract(contract, context);

      // Validate output with Sentinels
      const outputValidation = await this.sentinels.validateOutput(output, contract);

      const duration = Date.now() - startTime;
      const meetsThreshold = this.sentinels.meetsThreshold(outputValidation, contract);
      const validationResult = {
        valid: outputValidation.valid,
        score: outputValidation.score,
        errors: outputValidation.errors.map(e => e.message),
      };

      // Submit to Oracle for judgment if available
      let judgment: Judgment | undefined;
      if (this.oracle) {
        judgment = await this.oracle.submitForJudgment(
          {
            agentId: this.agentId,
            contractId: contract.contract.id,
            output,
            duration,
            cost: context.cost,
            retries: context.retries,
          },
          contract,
          validationResult
        );
      }

      const result: ExecutionResult = {
        success: outputValidation.valid && meetsThreshold,
        contractId: contract.contract.id,
        output,
        duration,
        cost: context.cost,
        retries: context.retries,
        validation: validationResult,
      };

      if (judgment) {
        result.judgment = judgment;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        contractId: contract.contract.id,
        duration: Date.now() - startTime,
        cost: context.cost,
        retries: context.retries,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute the contract's requirements
   */
  private async executeContract(
    contract: Contract,
    context: ExecutionContext
  ): Promise<unknown> {
    // TODO: Implement actual execution logic
    // This will involve:
    // 1. Processing required tools in order
    // 2. Calling the Worker to execute AI tasks
    // 3. Validating outputs at each step
    // 4. Handling retries

    const requirements = contract.contract.requirements;

    // Check if we need to use specific tools in order
    if (requirements.tools?.must_use_in_order) {
      for (const step of requirements.tools.must_use_in_order) {
        // Validate tool is allowed
        this.sentinels.checkTool(step.tool, contract);

        // TODO: Execute tool
        context.toolsUsed.push(step.tool);
      }
    }

    // For now, return a placeholder output
    return {
      message: 'Contract executed (placeholder)',
      toolsUsed: context.toolsUsed,
    };
  }

  /**
   * Check if we should retry
   */
  private shouldRetry(context: ExecutionContext, contract: Contract): boolean {
    const limits = contract.contract.limits;
    if (!limits?.retries) {
      return false;
    }

    return context.retries < limits.retries.max_attempts;
  }

  /**
   * Check if we're within cost limits
   */
  private isWithinCostLimit(context: ExecutionContext, contract: Contract): boolean {
    const limits = contract.contract.limits;
    if (!limits?.cost) {
      return true;
    }

    return context.cost < limits.cost.max_usd;
  }

  /**
   * Check if we're within time limits
   */
  private isWithinTimeLimit(context: ExecutionContext, contract: Contract): boolean {
    const limits = contract.contract.limits;
    if (!limits?.time) {
      return true;
    }

    const elapsed = Date.now() - context.startTime;
    return elapsed < limits.time.max_duration_ms;
  }
}
