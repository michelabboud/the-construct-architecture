/**
 * Tool Adapters - Convert tool definitions between provider formats
 *
 * Different AI providers have slightly different formats for tool definitions
 * and tool call responses. These adapters handle the conversion.
 */

import type { ToolDefinition, ToolCallResult, Message } from '../ai-client.js';

/**
 * Base interface for tool adapters
 */
export interface ToolAdapter {
  /**
   * Provider ID this adapter handles
   */
  readonly providerId: string;

  /**
   * Convert tool definitions to provider format
   */
  convertToolDefinitions(tools: ToolDefinition[]): unknown;

  /**
   * Convert provider tool call response to standard format
   */
  convertToolCalls(response: unknown): ToolCallResult[];

  /**
   * Convert messages to provider format
   */
  convertMessages(messages: Message[]): unknown;

  /**
   * Make a chat completion request using provider-specific API
   */
  chat(request: AdapterRequest): Promise<AdapterResponse>;
}

/**
 * Adapter request (standardized)
 */
export interface AdapterRequest {
  messages: Message[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { name: string };
}

/**
 * Adapter response (standardized)
 */
export interface AdapterResponse {
  content: string | null;
  toolCalls?: ToolCallResult[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

/**
 * Registry for tool adapters
 */
class ToolAdapterRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();

  /**
   * Register an adapter
   */
  register(adapter: ToolAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  /**
   * Get adapter for a provider
   */
  get(providerId: string): ToolAdapter | undefined {
    return this.adapters.get(providerId);
  }

  /**
   * Check if adapter exists for provider
   */
  has(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  /**
   * Get all registered adapters
   */
  getAll(): ToolAdapter[] {
    return Array.from(this.adapters.values());
  }
}

/**
 * Global adapter registry
 */
export const adapterRegistry = new ToolAdapterRegistry();

// Re-export adapters
export { AnthropicAdapter } from './anthropic-adapter.js';
export { GoogleAdapter } from './google-adapter.js';
