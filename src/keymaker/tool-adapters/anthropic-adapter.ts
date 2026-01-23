/**
 * Anthropic Tool Adapter
 *
 * Converts tool definitions and responses between standard format
 * and Anthropic's Claude API format.
 *
 * Note: This adapter makes HTTP requests directly since Anthropic's
 * API is not fully OpenAI-compatible.
 */

import type {
  ToolAdapter,
  AdapterRequest,
  AdapterResponse,
} from './index.js';
import type { ToolDefinition, ToolCallResult, Message } from '../ai-client.js';

/**
 * Anthropic message format
 */
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

/**
 * Anthropic content block
 */
interface AnthropicContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

/**
 * Anthropic tool format
 */
interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Anthropic API response
 */
interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic Tool Adapter
 */
export class AnthropicAdapter implements ToolAdapter {
  readonly providerId = 'anthropic';
  private apiKey: string;
  private baseURL: string;

  constructor(config: { apiKey?: string; baseURL?: string } = {}) {
    this.apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'] ?? '';
    this.baseURL = config.baseURL ?? 'https://api.anthropic.com';
  }

  /**
   * Convert standard tool definitions to Anthropic format
   */
  convertToolDefinitions(tools: ToolDefinition[]): AnthropicTool[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required ?? [],
      },
    }));
  }

  /**
   * Convert Anthropic tool use blocks to standard format
   */
  convertToolCalls(content: AnthropicContentBlock[]): ToolCallResult[] {
    return content
      .filter((block): block is AnthropicContentBlock & { type: 'tool_use'; id: string; name: string } =>
        block.type === 'tool_use' && !!block.id && !!block.name
      )
      .map(block => ({
        id: block.id,
        type: 'function' as const,
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input ?? {}),
        },
      }));
  }

  /**
   * Convert standard messages to Anthropic format
   */
  convertMessages(messages: Message[]): { system?: string; messages: AnthropicMessage[] } {
    let systemPrompt: string | undefined;
    const anthropicMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Anthropic handles system prompt separately
        systemPrompt = msg.content;
        continue;
      }

      if (msg.role === 'tool') {
        // Tool results need to be part of a user message
        const lastMsg = anthropicMessages[anthropicMessages.length - 1];
        if (lastMsg?.role === 'user' && Array.isArray(lastMsg.content)) {
          lastMsg.content.push({
            type: 'tool_result',
            tool_use_id: msg.tool_call_id!,
            content: msg.content,
          });
        } else {
          anthropicMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: msg.tool_call_id!,
              content: msg.content,
            }],
          });
        }
        continue;
      }

      if (msg.role === 'assistant' && msg.tool_calls) {
        // Assistant message with tool calls
        const content: AnthropicContentBlock[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          });
        }
        anthropicMessages.push({ role: 'assistant', content });
        continue;
      }

      // Regular message
      anthropicMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    const result: { system?: string; messages: AnthropicMessage[] } = { messages: anthropicMessages };
    if (systemPrompt) {
      result.system = systemPrompt;
    }
    return result;
  }

  /**
   * Make a chat completion request to Anthropic
   */
  async chat(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const { system, messages } = this.convertMessages(request.messages);

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (system) {
      body['system'] = system;
    }

    if (request.temperature !== undefined) {
      body['temperature'] = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      body['tools'] = this.convertToolDefinitions(request.tools);

      if (request.toolChoice) {
        if (request.toolChoice === 'auto') {
          body['tool_choice'] = { type: 'auto' };
        } else if (request.toolChoice === 'none') {
          // Anthropic doesn't have 'none', we just don't send tools
          delete body['tools'];
        } else if (request.toolChoice === 'required') {
          body['tool_choice'] = { type: 'any' };
        } else if (typeof request.toolChoice === 'object') {
          body['tool_choice'] = { type: 'tool', name: request.toolChoice.name };
        }
      }
    }

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json() as AnthropicResponse;

    // Extract text content
    let textContent: string | null = null;
    const textBlocks = data.content.filter(b => b.type === 'text');
    if (textBlocks.length > 0) {
      textContent = textBlocks.map(b => b.text ?? '').join('');
    }

    // Extract tool calls
    const toolCalls = this.convertToolCalls(data.content);

    // Map stop reason
    let finishReason: AdapterResponse['finishReason'] = null;
    switch (data.stop_reason) {
      case 'end_turn':
        finishReason = 'stop';
        break;
      case 'max_tokens':
        finishReason = 'length';
        break;
      case 'tool_use':
        finishReason = 'tool_calls';
        break;
    }

    const result: AdapterResponse = {
      content: textContent,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason,
    };

    if (toolCalls.length > 0) {
      result.toolCalls = toolCalls;
    }

    return result;
  }
}
