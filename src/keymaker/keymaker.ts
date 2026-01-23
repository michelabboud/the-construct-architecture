/**
 * The Keymaker - Provider-agnostic AI Interface
 *
 * "I know because I must know. It is my purpose."
 *
 * Provides a unified interface for calling multiple AI providers.
 * Handles routing, fallback, and tool calling across providers.
 *
 * Phase 3 Implementation
 */

import {
  AIClient,
  type AIRequest,
  type AIResponse,
  type Message,
  type ToolDefinition,
} from './ai-client.js';
import {
  ProviderRegistry,
  defaultRegistry,
  type ProviderDefinition,
  type ModelDefinition,
} from './providers.js';
import {
  ProviderRouter,
  type RoutingConstraints,
  type RoutingDecision,
} from './router.js';
import {
  adapterRegistry,
  AnthropicAdapter,
  GoogleAdapter,
  type ToolAdapter,
  type AdapterRequest,
} from './tool-adapters/index.js';
import type { Oracle } from '../oracle/oracle.js';
import type { Contract } from '../architect/schemas/contract.schema.js';

// Register default adapters
adapterRegistry.register(new AnthropicAdapter());
adapterRegistry.register(new GoogleAdapter());

/**
 * Keymaker configuration
 */
export interface KeymakerConfig {
  registry?: ProviderRegistry;
  oracle?: Oracle;
  defaultProvider?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Generate request options
 */
export interface GenerateOptions {
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { name: string };
  responseFormat?: { type: 'text' | 'json_object' };
  routingConstraints?: RoutingConstraints;
}

/**
 * Generate response
 */
export interface GenerateResponse {
  content: string | null;
  model: string;
  provider: string;
  tokenUsage: {
    input: number;
    output: number;
  };
  cost: number;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  finishReason: string | null;
  routingDecision?: RoutingDecision;
}

/**
 * The Keymaker - Provider-agnostic AI Interface
 */
export class Keymaker {
  private registry: ProviderRegistry;
  private router: ProviderRouter;
  private aiClient: AIClient;
  private oracle?: Oracle;
  private defaultProvider: string;
  private defaultModel: string;

  constructor(config: KeymakerConfig = {}) {
    this.registry = config.registry ?? defaultRegistry;
    this.defaultProvider = config.defaultProvider ?? 'openai';
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';

    // Build router config conditionally
    const routerConfig: { registry: ProviderRegistry; oracle?: Oracle } = { registry: this.registry };
    if (config.oracle) {
      routerConfig.oracle = config.oracle;
      this.oracle = config.oracle;
    }
    this.router = new ProviderRouter(routerConfig);

    // Build AI client config conditionally
    const aiClientConfig: {
      registry: ProviderRegistry;
      defaultProvider?: string;
      defaultModel?: string;
      timeout?: number;
      maxRetries?: number;
    } = { registry: this.registry };
    if (config.defaultProvider) {
      aiClientConfig.defaultProvider = config.defaultProvider;
    }
    if (config.defaultModel) {
      aiClientConfig.defaultModel = config.defaultModel;
    }
    if (config.timeout) {
      aiClientConfig.timeout = config.timeout;
    }
    if (config.maxRetries) {
      aiClientConfig.maxRetries = config.maxRetries;
    }
    this.aiClient = new AIClient(aiClientConfig);
  }

  /**
   * Set Oracle for performance-based routing
   */
  setOracle(oracle: Oracle): void {
    this.oracle = oracle;
    this.router.setOracle(oracle);
  }

  /**
   * Generate a response from an AI model
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    return this.chat(
      [{ role: 'user', content: prompt }],
      options
    );
  }

  /**
   * Generate with a system prompt
   */
  async generateWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    );
  }

  /**
   * Chat completion with message history
   */
  async chat(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    // Determine provider and model
    let providerId = options.provider ?? this.defaultProvider;
    let modelId = options.model ?? this.defaultModel;
    let routingDecision: RoutingDecision | undefined;

    // Use router if routing constraints provided or if no specific provider/model
    if (options.routingConstraints || (!options.provider && !options.model)) {
      const constraints: RoutingConstraints = {
        ...options.routingConstraints,
      };

      if (options.model) {
        constraints.model = options.model;
      }
      if (options.provider) {
        constraints.preferredProviders = [options.provider];
      }

      routingDecision = await this.router.route(constraints);
      providerId = routingDecision.provider.id;
      modelId = routingDecision.model.id;
    }

    const provider = this.registry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // Use OpenAI-compatible client or adapter
    let response: AIResponse;

    if (provider.openAICompatible) {
      // Build request object conditionally for exactOptionalPropertyTypes
      const aiRequest: AIRequest = {
        messages,
        model: modelId,
        provider: providerId,
        toolChoice: options.toolChoice === 'required'
          ? 'required'
          : options.toolChoice === 'none'
            ? 'none'
            : options.toolChoice && typeof options.toolChoice === 'object'
              ? { type: 'function', function: { name: options.toolChoice.name } }
              : 'auto',
      };
      if (options.maxTokens !== undefined) {
        aiRequest.maxTokens = options.maxTokens;
      }
      if (options.temperature !== undefined) {
        aiRequest.temperature = options.temperature;
      }
      if (options.tools) {
        aiRequest.tools = options.tools;
      }
      if (options.responseFormat) {
        aiRequest.responseFormat = options.responseFormat;
      }
      response = await this.aiClient.chat(aiRequest);
    } else {
      // Use adapter for non-OpenAI-compatible providers
      const adapter = adapterRegistry.get(providerId);
      if (!adapter) {
        throw new Error(`No adapter available for provider: ${providerId}`);
      }

      // Build adapter request conditionally
      const adapterRequest: AdapterRequest = {
        messages,
        model: modelId,
      };
      if (options.maxTokens !== undefined) {
        adapterRequest.maxTokens = options.maxTokens;
      }
      if (options.temperature !== undefined) {
        adapterRequest.temperature = options.temperature;
      }
      if (options.tools) {
        adapterRequest.tools = options.tools;
      }
      if (options.toolChoice) {
        adapterRequest.toolChoice = options.toolChoice;
      }

      const adapterResponse = await adapter.chat(adapterRequest);

      // Calculate cost
      const model = this.registry.getModel(providerId, modelId);
      const cost = model
        ? this.registry.estimateCost(
            providerId,
            modelId,
            adapterResponse.usage.promptTokens,
            adapterResponse.usage.completionTokens
          )
        : 0;

      response = {
        content: adapterResponse.content,
        model: modelId,
        provider: providerId,
        usage: adapterResponse.usage,
        cost,
        finishReason: adapterResponse.finishReason,
      };
      if (adapterResponse.toolCalls) {
        response.toolCalls = adapterResponse.toolCalls;
      }
    }

    // Build result with conditional optional properties
    const result: GenerateResponse = {
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokenUsage: {
        input: response.usage.promptTokens,
        output: response.usage.completionTokens,
      },
      cost: response.cost,
      finishReason: response.finishReason,
    };

    // Convert tool calls to simpler format and add if present
    if (response.toolCalls) {
      result.toolCalls = response.toolCalls.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      }));
    }

    if (routingDecision) {
      result.routingDecision = routingDecision;
    }

    return result;
  }

  /**
   * Generate with automatic fallback on failure
   */
  async generateWithFallback(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse & { attempts: number }> {
    const constraints: RoutingConstraints = {
      ...options.routingConstraints,
    };

    if (options.model) {
      constraints.model = options.model;
    }
    if (options.provider) {
      constraints.preferredProviders = [options.provider];
    }

    const result = await this.router.routeWithFallback(
      constraints,
      async (provider, model) => {
        return this.chat(
          [{ role: 'user', content: prompt }],
          {
            ...options,
            provider: provider.id,
            model: model.id,
          }
        );
      }
    );

    return {
      ...result.result,
      attempts: result.attempts,
    };
  }

  /**
   * Execute a tool-using conversation
   *
   * Sends messages, handles tool calls, and returns final response.
   */
  async executeWithTools(
    messages: Message[],
    tools: ToolDefinition[],
    executeToolCall: (name: string, args: Record<string, unknown>) => Promise<string>,
    options: Omit<GenerateOptions, 'tools'> = {},
    maxIterations: number = 10
  ): Promise<GenerateResponse> {
    let currentMessages = [...messages];
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      const response = await this.chat(currentMessages, { ...options, tools });

      // If no tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return response;
      }

      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: response.content ?? '',
        tool_calls: response.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      });

      // Execute tool calls and add results
      for (const toolCall of response.toolCalls) {
        const result = await executeToolCall(toolCall.name, toolCall.arguments);
        currentMessages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }

    throw new Error(`Max tool iterations (${maxIterations}) exceeded`);
  }

  /**
   * Get routing constraints from a contract
   */
  getConstraintsFromContract(contract: Contract): RoutingConstraints {
    const constraints: RoutingConstraints = {};
    const contractSpec = contract.contract;

    // Cost constraints
    if (contractSpec.limits?.cost?.max_usd) {
      // Estimate max cost per request (assume ~4 requests per contract)
      constraints.maxCostPerRequest = contractSpec.limits.cost.max_usd / 4;
    }

    // Model requirements
    if (contractSpec.resources?.models?.preferred) {
      constraints.model = contractSpec.resources.models.preferred;
    }

    // Provider preferences from contract metadata
    if (contractSpec.metadata?.tags?.includes('local')) {
      constraints.preferLocal = true;
    }
    if (contractSpec.metadata?.tags?.includes('cheap')) {
      constraints.preferCheapest = true;
    }
    if (contractSpec.metadata?.tags?.includes('quality')) {
      constraints.preferBestQuality = true;
    }

    return constraints;
  }

  /**
   * Get available providers
   */
  getProviders(): ProviderDefinition[] {
    return this.registry.getAllProviders();
  }

  /**
   * Get available providers (with API keys configured)
   */
  getAvailableProviders(): ProviderDefinition[] {
    return this.registry.getAvailableProviders();
  }

  /**
   * Check if a provider is available
   */
  async isProviderAvailable(providerId: string): Promise<boolean> {
    const provider = this.registry.getProvider(providerId);
    if (!provider) return false;

    if (!this.registry.isProviderAvailable(providerId)) return false;

    // For OpenAI-compatible providers, do a quick test
    if (provider.openAICompatible) {
      const result = await this.aiClient.testProvider(providerId);
      return result.available;
    }

    // For adapter-based providers, check if adapter exists and API key is set
    return adapterRegistry.has(providerId);
  }

  /**
   * Test all providers and return their status
   */
  async testAllProviders(): Promise<Map<string, { available: boolean; error?: string; latencyMs?: number }>> {
    const results = new Map<string, { available: boolean; error?: string; latencyMs?: number }>();

    for (const provider of this.registry.getAllProviders()) {
      if (provider.openAICompatible) {
        results.set(provider.id, await this.aiClient.testProvider(provider.id));
      } else {
        const adapter = adapterRegistry.get(provider.id);
        if (adapter) {
          try {
            const startTime = Date.now();
            await adapter.chat({
              messages: [{ role: 'user', content: 'Hi' }],
              model: provider.defaultModel,
              maxTokens: 10,
            });
            results.set(provider.id, {
              available: true,
              latencyMs: Date.now() - startTime,
            });
          } catch (error) {
            results.set(provider.id, {
              available: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        } else {
          results.set(provider.id, {
            available: false,
            error: 'No adapter available',
          });
        }
      }
    }

    return results;
  }

  /**
   * Get the provider registry
   */
  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  /**
   * Get the router for advanced routing operations
   */
  getRouter(): ProviderRouter {
    return this.router;
  }
}

// Re-export types for convenience
export type {
  Message,
  ToolDefinition,
  AIResponse,
  ProviderDefinition,
  ModelDefinition,
  RoutingConstraints,
  RoutingDecision,
};
