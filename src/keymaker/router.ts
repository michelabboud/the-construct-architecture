/**
 * Provider Router - Intelligent request routing
 *
 * Routes AI requests to the best provider based on:
 * - Oracle performance data (success rate, average score)
 * - Cost constraints from contract
 * - Model requirements
 * - Provider availability
 * - Fallback logic
 */

import {
  ProviderRegistry,
  defaultRegistry,
  type ProviderDefinition,
  type ModelDefinition,
  type ProviderCapabilities,
} from './providers.js';
import type { Oracle } from '../oracle/oracle.js';

/**
 * Routing constraints from contract
 */
export interface RoutingConstraints {
  maxCostPerRequest?: number;
  requiredCapabilities?: Array<keyof ProviderCapabilities>;
  preferredProviders?: string[];
  excludedProviders?: string[];
  preferLocal?: boolean; // Prefer Ollama if available
  preferCheapest?: boolean;
  preferFastest?: boolean;
  preferBestQuality?: boolean;
  minSuccessRate?: number; // From Oracle data
  minAvgScore?: number; // From Oracle data
  model?: string; // Specific model required
}

/**
 * Provider score for ranking
 */
export interface ProviderScore {
  provider: ProviderDefinition;
  model: ModelDefinition;
  score: number;
  reasons: string[];
  estimatedCost: number;
  oracleData?: {
    successRate: number;
    avgScore: number;
    totalTasks: number;
  };
}

/**
 * Routing decision
 */
export interface RoutingDecision {
  provider: ProviderDefinition;
  model: ModelDefinition;
  fallbacks: Array<{ provider: ProviderDefinition; model: ModelDefinition }>;
  reasons: string[];
  estimatedCost: number;
}

/**
 * Provider Router
 *
 * Makes intelligent routing decisions based on multiple factors.
 */
export class ProviderRouter {
  private registry: ProviderRegistry;
  private oracle?: Oracle;
  private providerLatencies: Map<string, number[]> = new Map();

  constructor(config: { registry?: ProviderRegistry; oracle?: Oracle } = {}) {
    this.registry = config.registry ?? defaultRegistry;
    if (config.oracle) {
      this.oracle = config.oracle;
    }
  }

  /**
   * Set Oracle for performance-based routing
   */
  setOracle(oracle: Oracle): void {
    this.oracle = oracle;
  }

  /**
   * Record latency for a provider (used for fastest routing)
   */
  recordLatency(providerId: string, latencyMs: number): void {
    let latencies = this.providerLatencies.get(providerId);
    if (!latencies) {
      latencies = [];
      this.providerLatencies.set(providerId, latencies);
    }
    latencies.push(latencyMs);
    // Keep only last 20 samples
    if (latencies.length > 20) {
      latencies.shift();
    }
  }

  /**
   * Get average latency for a provider
   */
  private getAverageLatency(providerId: string): number | undefined {
    const latencies = this.providerLatencies.get(providerId);
    if (!latencies || latencies.length === 0) return undefined;
    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  /**
   * Get Oracle performance data for a provider
   */
  private async getOracleData(providerId: string): Promise<ProviderScore['oracleData'] | undefined> {
    if (!this.oracle) return undefined;

    // Get all agents for this provider and aggregate their stats
    const topAgents = await this.oracle.getTopAgents(100);
    const providerAgents = topAgents.filter(a => a.provider === providerId);

    if (providerAgents.length === 0) return undefined;

    const totalTasks = providerAgents.reduce((sum, a) => sum + a.stats.totalTasks, 0);
    if (totalTasks === 0) return undefined;

    const weightedSuccessRate = providerAgents.reduce(
      (sum, a) => sum + a.stats.successRate * a.stats.totalTasks,
      0
    ) / totalTasks;

    const weightedAvgScore = providerAgents.reduce(
      (sum, a) => sum + a.stats.averageScore * a.stats.totalTasks,
      0
    ) / totalTasks;

    return {
      successRate: weightedSuccessRate,
      avgScore: weightedAvgScore,
      totalTasks,
    };
  }

  /**
   * Score a provider/model combination
   */
  private async scoreProvider(
    provider: ProviderDefinition,
    model: ModelDefinition,
    constraints: RoutingConstraints,
    estimatedInputTokens: number = 1000,
    estimatedOutputTokens: number = 500
  ): Promise<ProviderScore> {
    const reasons: string[] = [];
    let score = 100; // Start with perfect score

    // Check if provider is available
    if (!this.registry.isProviderAvailable(provider.id)) {
      return {
        provider,
        model,
        score: 0,
        reasons: ['Provider not available (no API key)'],
        estimatedCost: 0,
      };
    }

    // Check required capabilities
    if (constraints.requiredCapabilities) {
      for (const cap of constraints.requiredCapabilities) {
        if (!model.capabilities[cap]) {
          score = 0;
          reasons.push(`Missing required capability: ${cap}`);
        }
      }
    }

    // Check excluded providers
    if (constraints.excludedProviders?.includes(provider.id)) {
      return {
        provider,
        model,
        score: 0,
        reasons: ['Provider excluded by constraints'],
        estimatedCost: 0,
      };
    }

    // Calculate estimated cost
    const estimatedCost = this.registry.estimateCost(
      provider.id,
      model.id,
      estimatedInputTokens,
      estimatedOutputTokens
    );

    // Check cost constraint
    if (constraints.maxCostPerRequest && estimatedCost > constraints.maxCostPerRequest) {
      score = 0;
      reasons.push(`Exceeds cost limit: $${estimatedCost.toFixed(4)} > $${constraints.maxCostPerRequest.toFixed(4)}`);
    }

    // Preferred providers bonus
    if (constraints.preferredProviders?.includes(provider.id)) {
      score += 20;
      reasons.push('Preferred provider');
    }

    // Local preference (Ollama)
    if (constraints.preferLocal && provider.id === 'ollama') {
      score += 30;
      reasons.push('Local provider preferred');
    }

    // Cost optimization
    if (constraints.preferCheapest) {
      // Lower cost = higher score. Max bonus of 30 for free (Ollama)
      const costScore = Math.max(0, 30 - estimatedCost * 100);
      score += costScore;
      reasons.push(`Cost score: +${costScore.toFixed(1)}`);
    }

    // Speed optimization
    if (constraints.preferFastest) {
      const latency = this.getAverageLatency(provider.id);
      if (latency !== undefined) {
        // Lower latency = higher score. Max bonus of 20 for <500ms
        const speedScore = Math.max(0, 20 - latency / 100);
        score += speedScore;
        reasons.push(`Speed score: +${speedScore.toFixed(1)} (${latency.toFixed(0)}ms avg)`);
      }
    }

    // Quality optimization (from Oracle data)
    const oracleData = await this.getOracleData(provider.id);

    if (oracleData) {
      // Check minimum thresholds
      if (constraints.minSuccessRate && oracleData.successRate < constraints.minSuccessRate) {
        score -= 30;
        reasons.push(`Success rate ${oracleData.successRate.toFixed(1)}% below minimum ${constraints.minSuccessRate}%`);
      }

      if (constraints.minAvgScore && oracleData.avgScore < constraints.minAvgScore) {
        score -= 30;
        reasons.push(`Avg score ${oracleData.avgScore.toFixed(1)} below minimum ${constraints.minAvgScore}`);
      }

      // Quality bonus
      if (constraints.preferBestQuality) {
        // Higher success rate and score = higher bonus
        const qualityScore = (oracleData.successRate / 100 * 15) + (oracleData.avgScore * 1.5);
        score += qualityScore;
        reasons.push(`Quality score: +${qualityScore.toFixed(1)} (${oracleData.totalTasks} tasks tracked)`);
      }
    } else if (constraints.preferBestQuality) {
      // No Oracle data, slight penalty for unknown quality
      score -= 5;
      reasons.push('No performance history');
    }

    const result: ProviderScore = {
      provider,
      model,
      score: Math.max(0, score),
      reasons,
      estimatedCost,
    };

    if (oracleData) {
      result.oracleData = oracleData;
    }

    return result;
  }

  /**
   * Route a request to the best provider
   */
  async route(
    constraints: RoutingConstraints = {},
    estimatedInputTokens: number = 1000,
    estimatedOutputTokens: number = 500
  ): Promise<RoutingDecision> {
    // If a specific model is required, find its provider
    if (constraints.model) {
      const provider = this.registry.findProviderByModel(constraints.model);
      if (provider) {
        const model = this.registry.getModel(provider.id, constraints.model);
        if (model) {
          const score = await this.scoreProvider(provider, model, constraints, estimatedInputTokens, estimatedOutputTokens);
          if (score.score > 0) {
            return {
              provider,
              model,
              fallbacks: [],
              reasons: score.reasons,
              estimatedCost: score.estimatedCost,
            };
          }
        }
      }
      throw new Error(`Required model ${constraints.model} not available`);
    }

    // Score all available providers
    const scores: ProviderScore[] = [];

    for (const provider of this.registry.getAllProviders()) {
      for (const model of provider.models) {
        const score = await this.scoreProvider(
          provider,
          model,
          constraints,
          estimatedInputTokens,
          estimatedOutputTokens
        );
        if (score.score > 0) {
          scores.push(score);
        }
      }
    }

    if (scores.length === 0) {
      throw new Error('No providers available matching constraints');
    }

    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0]!;
    const fallbacks = scores.slice(1, 4).map(s => ({ provider: s.provider, model: s.model }));

    return {
      provider: best.provider,
      model: best.model,
      fallbacks,
      reasons: best.reasons,
      estimatedCost: best.estimatedCost,
    };
  }

  /**
   * Get all provider scores for transparency
   */
  async getAllScores(
    constraints: RoutingConstraints = {},
    estimatedInputTokens: number = 1000,
    estimatedOutputTokens: number = 500
  ): Promise<ProviderScore[]> {
    const scores: ProviderScore[] = [];

    for (const provider of this.registry.getAllProviders()) {
      for (const model of provider.models) {
        const score = await this.scoreProvider(
          provider,
          model,
          constraints,
          estimatedInputTokens,
          estimatedOutputTokens
        );
        scores.push(score);
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Route with fallback execution
   *
   * Tries the best provider, falling back to others on failure.
   */
  async routeWithFallback<T>(
    constraints: RoutingConstraints,
    execute: (provider: ProviderDefinition, model: ModelDefinition) => Promise<T>
  ): Promise<{ result: T; provider: ProviderDefinition; model: ModelDefinition; attempts: number }> {
    const decision = await this.route(constraints);
    const candidates = [
      { provider: decision.provider, model: decision.model },
      ...decision.fallbacks,
    ];

    let lastError: Error | undefined;
    let attempts = 0;

    for (const candidate of candidates) {
      attempts++;
      const startTime = Date.now();

      try {
        const result = await execute(candidate.provider, candidate.model);

        // Record successful latency
        this.recordLatency(candidate.provider.id, Date.now() - startTime);

        return {
          result,
          provider: candidate.provider,
          model: candidate.model,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next fallback
      }
    }

    throw lastError ?? new Error('All providers failed');
  }
}

/**
 * Default router instance
 */
export const defaultRouter = new ProviderRouter();
