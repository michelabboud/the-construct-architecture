/**
 * Unified AI Client - Provider-agnostic AI interface
 *
 * Uses the OpenAI SDK to communicate with multiple providers.
 * Supports OpenAI-compatible APIs directly and adapters for others.
 */

import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';
import {
  ProviderRegistry,
  defaultRegistry,
  type ProviderDefinition,
  type ModelDefinition,
} from './providers.js';

/**
 * Message types for chat completion
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallResult[];
}

/**
 * Tool definition for AI calls
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool call result from AI
 */
export interface ToolCallResult {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Request configuration
 */
export interface AIRequest {
  messages: Message[];
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  responseFormat?: { type: 'text' | 'json_object' };
}

/**
 * Response from AI
 */
export interface AIResponse {
  content: string | null;
  toolCalls?: ToolCallResult[];
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
}

/**
 * AI Client configuration
 */
export interface AIClientConfig {
  registry?: ProviderRegistry;
  defaultProvider?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * AI Client Error
 */
export class AIClientError extends Error {
  constructor(
    message: string,
    public provider: string,
    public model: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

/**
 * Unified AI Client
 *
 * Provides a consistent interface for calling multiple AI providers.
 */
export class AIClient {
  private registry: ProviderRegistry;
  private clients: Map<string, OpenAI> = new Map();
  private defaultProvider: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: AIClientConfig = {}) {
    this.registry = config.registry ?? defaultRegistry;
    this.defaultProvider = config.defaultProvider ?? 'openai';
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';
    this.timeout = config.timeout ?? 60000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  /**
   * Get or create an OpenAI client for a provider
   */
  private getClient(providerId: string): OpenAI {
    // Check cache
    let client = this.clients.get(providerId);
    if (client) return client;

    const provider = this.registry.getProvider(providerId);
    if (!provider) {
      throw new AIClientError(
        `Unknown provider: ${providerId}`,
        providerId,
        ''
      );
    }

    if (!provider.openAICompatible) {
      throw new AIClientError(
        `Provider ${providerId} is not OpenAI-compatible. Use an adapter.`,
        providerId,
        ''
      );
    }

    const apiKey = this.registry.getApiKey(providerId);
    const baseURL = this.registry.getBaseURL(providerId);

    // Create client
    client = new OpenAI({
      apiKey: apiKey ?? 'ollama', // Ollama doesn't need a key
      baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
    });

    this.clients.set(providerId, client);
    return client;
  }

  /**
   * Convert internal message format to OpenAI format
   */
  private convertMessages(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          content: msg.content,
          tool_call_id: msg.tool_call_id!,
        };
      }

      if (msg.role === 'assistant' && msg.tool_calls) {
        return {
          role: 'assistant' as const,
          content: msg.content,
          tool_calls: msg.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }

      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      };
    });
  }

  /**
   * Convert tool definitions to OpenAI format
   */
  private convertTools(tools: ToolDefinition[]): ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Send a chat completion request
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    const providerId = request.provider ?? this.defaultProvider;
    const modelId = request.model ?? this.defaultModel;

    const provider = this.registry.getProvider(providerId);
    if (!provider) {
      throw new AIClientError(`Unknown provider: ${providerId}`, providerId, modelId);
    }

    const model = this.registry.getModel(providerId, modelId);

    const client = this.getClient(providerId);

    try {
      const openaiMessages = this.convertMessages(request.messages);

      // Build completion params conditionally for exactOptionalPropertyTypes
      const completionParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: modelId,
        messages: openaiMessages,
      };

      if (request.maxTokens !== undefined) {
        completionParams.max_tokens = request.maxTokens;
      }
      if (request.temperature !== undefined) {
        completionParams.temperature = request.temperature;
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        completionParams.tools = this.convertTools(request.tools);
        if (request.toolChoice) {
          completionParams.tool_choice = request.toolChoice as ChatCompletionToolChoiceOption;
        }
      }

      // Add response format if requested
      if (request.responseFormat) {
        completionParams.response_format = request.responseFormat;
      }

      const response = await client.chat.completions.create(completionParams);

      const choice = response.choices[0];
      const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      // Calculate cost
      const cost = model
        ? this.registry.estimateCost(providerId, modelId, usage.prompt_tokens, usage.completion_tokens)
        : 0;

      // Build result conditionally
      const result: AIResponse = {
        content: choice?.message.content ?? null,
        model: response.model,
        provider: providerId,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
        finishReason: choice?.finish_reason ?? null,
      };

      // Extract tool calls if present (only function type)
      if (choice?.message.tool_calls) {
        result.toolCalls = choice.message.tool_calls
          .filter((tc): tc is OpenAI.Chat.Completions.ChatCompletionMessageToolCall & { type: 'function' } =>
            tc.type === 'function'
          )
          .map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }));
      }

      return result;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AIClientError(
          `API error from ${providerId}: ${error.message}`,
          providerId,
          modelId,
          error
        );
      }
      throw new AIClientError(
        `Error calling ${providerId}: ${error instanceof Error ? error.message : String(error)}`,
        providerId,
        modelId,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Simple text generation helper
   */
  async generate(
    prompt: string,
    options: Omit<AIRequest, 'messages'> = {}
  ): Promise<AIResponse> {
    return this.chat({
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
  }

  /**
   * Generate with system prompt
   */
  async generateWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options: Omit<AIRequest, 'messages'> = {}
  ): Promise<AIResponse> {
    return this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...options,
    });
  }

  /**
   * Check if a provider is available and working
   */
  async testProvider(providerId: string): Promise<{ available: boolean; error?: string; latencyMs?: number }> {
    const provider = this.registry.getProvider(providerId);
    if (!provider) {
      return { available: false, error: 'Unknown provider' };
    }

    if (!provider.openAICompatible) {
      return { available: false, error: 'Provider requires adapter (not OpenAI-compatible)' };
    }

    if (!this.registry.isProviderAvailable(providerId)) {
      return { available: false, error: 'API key not configured' };
    }

    const startTime = Date.now();

    try {
      await this.generate('Hi', {
        provider: providerId,
        model: provider.defaultModel,
        maxTokens: 10,
      });

      return {
        available: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the registry for advanced operations
   */
  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(providerId: string): void {
    this.defaultProvider = providerId;
  }

  /**
   * Set default model
   */
  setDefaultModel(modelId: string): void {
    this.defaultModel = modelId;
  }
}

/**
 * Default AI client instance
 */
export const defaultAIClient = new AIClient();
