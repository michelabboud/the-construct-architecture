/**
 * Google Gemini Tool Adapter
 *
 * Converts tool definitions and responses between standard format
 * and Google's Gemini API format.
 *
 * Note: This adapter makes HTTP requests directly since Gemini's
 * API format differs from OpenAI.
 */

import type {
  ToolAdapter,
  AdapterRequest,
  AdapterResponse,
} from './index.js';
import type { ToolDefinition, ToolCallResult, Message } from '../ai-client.js';

/**
 * Gemini content part
 */
interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

/**
 * Gemini content block
 */
interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * Gemini tool format
 */
interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  }>;
}

/**
 * Gemini API response
 */
interface GeminiResponse {
  candidates: Array<{
    content: GeminiContent;
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Google Gemini Tool Adapter
 */
export class GoogleAdapter implements ToolAdapter {
  readonly providerId = 'google';
  private apiKey: string;
  private baseURL: string;

  constructor(config: { apiKey?: string; baseURL?: string } = {}) {
    this.apiKey = config.apiKey ?? process.env['GOOGLE_API_KEY'] ?? '';
    this.baseURL = config.baseURL ?? 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Convert standard tool definitions to Gemini format
   */
  convertToolDefinitions(tools: ToolDefinition[]): GeminiTool {
    return {
      functionDeclarations: tools.map(tool => {
        const params: {
          type: 'object';
          properties: Record<string, unknown>;
          required?: string[];
        } = {
          type: 'object',
          properties: tool.parameters.properties,
        };
        if (tool.parameters.required) {
          params.required = tool.parameters.required;
        }
        return {
          name: tool.name,
          description: tool.description,
          parameters: params,
        };
      }),
    };
  }

  /**
   * Convert Gemini function calls to standard format
   */
  convertToolCalls(parts: GeminiPart[]): ToolCallResult[] {
    return parts
      .filter((part): part is GeminiPart & { functionCall: NonNullable<GeminiPart['functionCall']> } =>
        !!part.functionCall
      )
      .map((part, index) => ({
        id: `call_${index}_${Date.now()}`,
        type: 'function' as const,
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args),
        },
      }));
  }

  /**
   * Convert standard messages to Gemini format
   */
  convertMessages(messages: Message[]): { systemInstruction?: GeminiContent; contents: GeminiContent[] } {
    let systemInstruction: GeminiContent | undefined;
    const contents: GeminiContent[] = [];

    // Track pending tool calls for matching with tool results
    const pendingToolCalls: Map<string, { name: string }> = new Map();

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini uses systemInstruction
        systemInstruction = {
          role: 'user',
          parts: [{ text: msg.content }],
        };
        continue;
      }

      if (msg.role === 'tool') {
        // Find the tool name from pending calls
        const toolInfo = pendingToolCalls.get(msg.tool_call_id!);
        if (toolInfo) {
          // Tool results are part of user content in Gemini
          const lastContent = contents[contents.length - 1];
          if (lastContent?.role === 'user') {
            lastContent.parts.push({
              functionResponse: {
                name: toolInfo.name,
                response: { result: msg.content },
              },
            });
          } else {
            contents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: toolInfo.name,
                  response: { result: msg.content },
                },
              }],
            });
          }
          pendingToolCalls.delete(msg.tool_call_id!);
        }
        continue;
      }

      if (msg.role === 'assistant') {
        const parts: GeminiPart[] = [];

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments),
              },
            });
            // Track for matching with tool results
            pendingToolCalls.set(tc.id, { name: tc.function.name });
          }
        }

        if (parts.length > 0) {
          contents.push({ role: 'model', parts });
        }
        continue;
      }

      // User message
      contents.push({
        role: 'user',
        parts: [{ text: msg.content }],
      });
    }

    const result: { systemInstruction?: GeminiContent; contents: GeminiContent[] } = { contents };
    if (systemInstruction) {
      result.systemInstruction = systemInstruction;
    }
    return result;
  }

  /**
   * Make a chat completion request to Gemini
   */
  async chat(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    const { systemInstruction, contents } = this.convertMessages(request.messages);

    const body: Record<string, unknown> = {
      contents,
    };

    if (systemInstruction) {
      body['systemInstruction'] = systemInstruction;
    }

    // Generation config
    const generationConfig: Record<string, unknown> = {};
    if (request.maxTokens !== undefined) {
      generationConfig['maxOutputTokens'] = request.maxTokens;
    }
    if (request.temperature !== undefined) {
      generationConfig['temperature'] = request.temperature;
    }
    if (Object.keys(generationConfig).length > 0) {
      body['generationConfig'] = generationConfig;
    }

    // Tools
    if (request.tools && request.tools.length > 0) {
      body['tools'] = [this.convertToolDefinitions(request.tools)];

      if (request.toolChoice) {
        if (request.toolChoice === 'auto') {
          body['toolConfig'] = { functionCallingConfig: { mode: 'AUTO' } };
        } else if (request.toolChoice === 'none') {
          body['toolConfig'] = { functionCallingConfig: { mode: 'NONE' } };
        } else if (request.toolChoice === 'required') {
          body['toolConfig'] = { functionCallingConfig: { mode: 'ANY' } };
        } else if (typeof request.toolChoice === 'object') {
          body['toolConfig'] = {
            functionCallingConfig: {
              mode: 'ANY',
              allowedFunctionNames: [request.toolChoice.name],
            },
          };
        }
      }
    }

    const modelPath = `models/${request.model}:generateContent`;
    const url = `${this.baseURL}/${modelPath}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} ${error}`);
    }

    const data = await response.json() as GeminiResponse;

    const candidate = data.candidates[0];
    if (!candidate) {
      throw new Error('No response from Gemini');
    }

    // Extract text content
    let textContent: string | null = null;
    const textParts = candidate.content.parts.filter(p => p.text);
    if (textParts.length > 0) {
      textContent = textParts.map(p => p.text ?? '').join('');
    }

    // Extract tool calls
    const toolCalls = this.convertToolCalls(candidate.content.parts);

    // Map finish reason
    let finishReason: AdapterResponse['finishReason'] = null;
    switch (candidate.finishReason) {
      case 'STOP':
        finishReason = toolCalls.length > 0 ? 'tool_calls' : 'stop';
        break;
      case 'MAX_TOKENS':
        finishReason = 'length';
        break;
      case 'SAFETY':
      case 'RECITATION':
        finishReason = 'content_filter';
        break;
    }

    const result: AdapterResponse = {
      content: textContent,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason,
    };

    if (toolCalls.length > 0) {
      result.toolCalls = toolCalls;
    }

    return result;
  }
}
