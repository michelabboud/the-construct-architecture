/**
 * Provider Registry - Configuration for AI providers
 *
 * Defines supported providers, their models, capabilities, and pricing.
 * Used by the Keymaker for routing and cost estimation.
 */

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  chat: boolean;
  tools: boolean;
  vision: boolean;
  streaming: boolean;
  json_mode: boolean;
}

/**
 * Model pricing per 1M tokens
 */
export interface ModelPricing {
  input: number;  // USD per 1M input tokens
  output: number; // USD per 1M output tokens
}

/**
 * Model definition
 */
export interface ModelDefinition {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  pricing: ModelPricing;
  capabilities: ProviderCapabilities;
}

/**
 * Provider definition
 */
export interface ProviderDefinition {
  id: string;
  name: string;
  baseURL: string;
  apiKeyEnvVar: string;
  models: ModelDefinition[];
  defaultModel: string;
  openAICompatible: boolean;
}

/**
 * OpenAI Provider
 */
export const OPENAI_PROVIDER: ProviderDefinition = {
  id: 'openai',
  name: 'OpenAI',
  baseURL: 'https://api.openai.com/v1',
  apiKeyEnvVar: 'OPENAI_API_KEY',
  openAICompatible: true,
  defaultModel: 'gpt-4o',
  models: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      maxOutput: 16384,
      pricing: { input: 2.50, output: 10.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      contextWindow: 128000,
      maxOutput: 16384,
      pricing: { input: 0.15, output: 0.60 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      contextWindow: 128000,
      maxOutput: 4096,
      pricing: { input: 10.00, output: 30.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      contextWindow: 16385,
      maxOutput: 4096,
      pricing: { input: 0.50, output: 1.50 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
  ],
};

/**
 * Anthropic Provider
 */
export const ANTHROPIC_PROVIDER: ProviderDefinition = {
  id: 'anthropic',
  name: 'Anthropic',
  baseURL: 'https://api.anthropic.com/v1',
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  openAICompatible: false, // Requires adapter
  defaultModel: 'claude-sonnet-4-20250514',
  models: [
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      contextWindow: 200000,
      maxOutput: 64000,
      pricing: { input: 3.00, output: 15.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: false },
    },
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      contextWindow: 200000,
      maxOutput: 32000,
      pricing: { input: 15.00, output: 75.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: false },
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      contextWindow: 200000,
      maxOutput: 8192,
      pricing: { input: 0.80, output: 4.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: false },
    },
  ],
};

/**
 * Google Gemini Provider
 */
export const GOOGLE_PROVIDER: ProviderDefinition = {
  id: 'google',
  name: 'Google AI',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  apiKeyEnvVar: 'GOOGLE_API_KEY',
  openAICompatible: false, // Requires adapter
  defaultModel: 'gemini-2.0-flash',
  models: [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      contextWindow: 1000000,
      maxOutput: 8192,
      pricing: { input: 0.10, output: 0.40 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      contextWindow: 2000000,
      maxOutput: 8192,
      pricing: { input: 1.25, output: 5.00 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      contextWindow: 1000000,
      maxOutput: 8192,
      pricing: { input: 0.075, output: 0.30 },
      capabilities: { chat: true, tools: true, vision: true, streaming: true, json_mode: true },
    },
  ],
};

/**
 * Groq Provider (OpenAI-compatible)
 */
export const GROQ_PROVIDER: ProviderDefinition = {
  id: 'groq',
  name: 'Groq',
  baseURL: 'https://api.groq.com/openai/v1',
  apiKeyEnvVar: 'GROQ_API_KEY',
  openAICompatible: true,
  defaultModel: 'llama-3.3-70b-versatile',
  models: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      contextWindow: 128000,
      maxOutput: 32768,
      pricing: { input: 0.59, output: 0.79 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B',
      contextWindow: 128000,
      maxOutput: 8192,
      pricing: { input: 0.05, output: 0.08 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      contextWindow: 32768,
      maxOutput: 32768,
      pricing: { input: 0.24, output: 0.24 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
  ],
};

/**
 * Together AI Provider (OpenAI-compatible)
 */
export const TOGETHER_PROVIDER: ProviderDefinition = {
  id: 'together',
  name: 'Together AI',
  baseURL: 'https://api.together.xyz/v1',
  apiKeyEnvVar: 'TOGETHER_API_KEY',
  openAICompatible: true,
  defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  models: [
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      name: 'Llama 3.3 70B Turbo',
      contextWindow: 128000,
      maxOutput: 4096,
      pricing: { input: 0.88, output: 0.88 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      name: 'Qwen 2.5 72B',
      contextWindow: 32768,
      maxOutput: 4096,
      pricing: { input: 1.20, output: 1.20 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'deepseek-ai/DeepSeek-V3',
      name: 'DeepSeek V3',
      contextWindow: 64000,
      maxOutput: 8192,
      pricing: { input: 0.90, output: 0.90 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
  ],
};

/**
 * Ollama Provider (Local, OpenAI-compatible)
 */
export const OLLAMA_PROVIDER: ProviderDefinition = {
  id: 'ollama',
  name: 'Ollama (Local)',
  baseURL: 'http://localhost:11434/v1',
  apiKeyEnvVar: 'OLLAMA_API_KEY', // Usually not required for local
  openAICompatible: true,
  defaultModel: 'llama3.2',
  models: [
    {
      id: 'llama3.2',
      name: 'Llama 3.2',
      contextWindow: 128000,
      maxOutput: 4096,
      pricing: { input: 0, output: 0 }, // Free (local)
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'qwen2.5:72b',
      name: 'Qwen 2.5 72B',
      contextWindow: 32768,
      maxOutput: 4096,
      pricing: { input: 0, output: 0 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
    {
      id: 'deepseek-r1:70b',
      name: 'DeepSeek R1 70B',
      contextWindow: 64000,
      maxOutput: 8192,
      pricing: { input: 0, output: 0 },
      capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
    },
  ],
};

/**
 * All registered providers
 */
export const PROVIDERS: Record<string, ProviderDefinition> = {
  openai: OPENAI_PROVIDER,
  anthropic: ANTHROPIC_PROVIDER,
  google: GOOGLE_PROVIDER,
  groq: GROQ_PROVIDER,
  together: TOGETHER_PROVIDER,
  ollama: OLLAMA_PROVIDER,
};

/**
 * Provider Registry - Manages provider configuration and lookup
 */
export class ProviderRegistry {
  private providers: Map<string, ProviderDefinition> = new Map();
  private customBaseURLs: Map<string, string> = new Map();

  constructor() {
    // Register default providers
    for (const [id, provider] of Object.entries(PROVIDERS)) {
      this.providers.set(id, provider);
    }
  }

  /**
   * Get a provider by ID
   */
  getProvider(id: string): ProviderDefinition | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderDefinition[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get OpenAI-compatible providers
   */
  getOpenAICompatibleProviders(): ProviderDefinition[] {
    return this.getAllProviders().filter(p => p.openAICompatible);
  }

  /**
   * Get a model definition
   */
  getModel(providerId: string, modelId: string): ModelDefinition | undefined {
    const provider = this.getProvider(providerId);
    return provider?.models.find(m => m.id === modelId);
  }

  /**
   * Find provider by model ID
   */
  findProviderByModel(modelId: string): ProviderDefinition | undefined {
    for (const provider of this.providers.values()) {
      if (provider.models.some(m => m.id === modelId)) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get the effective base URL for a provider
   */
  getBaseURL(providerId: string): string | undefined {
    // Check for custom override first
    const custom = this.customBaseURLs.get(providerId);
    if (custom) return custom;

    const provider = this.getProvider(providerId);
    return provider?.baseURL;
  }

  /**
   * Set a custom base URL for a provider
   */
  setCustomBaseURL(providerId: string, baseURL: string): void {
    this.customBaseURLs.set(providerId, baseURL);
  }

  /**
   * Get the API key for a provider from environment
   */
  getApiKey(providerId: string): string | undefined {
    const provider = this.getProvider(providerId);
    if (!provider) return undefined;
    return process.env[provider.apiKeyEnvVar];
  }

  /**
   * Check if a provider is available (has API key)
   */
  isProviderAvailable(providerId: string): boolean {
    // Ollama doesn't require API key
    if (providerId === 'ollama') return true;
    return !!this.getApiKey(providerId);
  }

  /**
   * Get available providers (those with API keys configured)
   */
  getAvailableProviders(): ProviderDefinition[] {
    return this.getAllProviders().filter(p => this.isProviderAvailable(p.id));
  }

  /**
   * Calculate estimated cost for a request
   */
  estimateCost(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModel(providerId, modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Register a custom provider
   */
  registerProvider(provider: ProviderDefinition): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get providers that support a specific capability
   */
  getProvidersWithCapability(capability: keyof ProviderCapabilities): ProviderDefinition[] {
    return this.getAllProviders().filter(p =>
      p.models.some(m => m.capabilities[capability])
    );
  }

  /**
   * Get cheapest model for a capability
   */
  getCheapestModel(capability: keyof ProviderCapabilities): { provider: ProviderDefinition; model: ModelDefinition } | undefined {
    let cheapest: { provider: ProviderDefinition; model: ModelDefinition; cost: number } | undefined;

    for (const provider of this.getAvailableProviders()) {
      for (const model of provider.models) {
        if (model.capabilities[capability]) {
          const avgCost = (model.pricing.input + model.pricing.output) / 2;
          if (!cheapest || avgCost < cheapest.cost) {
            cheapest = { provider, model, cost: avgCost };
          }
        }
      }
    }

    return cheapest ? { provider: cheapest.provider, model: cheapest.model } : undefined;
  }
}

/**
 * Default registry instance
 */
export const defaultRegistry = new ProviderRegistry();
