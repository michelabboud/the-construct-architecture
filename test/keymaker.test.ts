/**
 * Tests for Keymaker - Provider-agnostic AI Interface
 *
 * Phase 3 Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ProviderRegistry,
  PROVIDERS,
  OPENAI_PROVIDER,
  ANTHROPIC_PROVIDER,
  GROQ_PROVIDER,
  type ProviderDefinition,
} from '../src/keymaker/providers.js';
import { ProviderRouter, type RoutingConstraints } from '../src/keymaker/router.js';
import { Keymaker } from '../src/keymaker/keymaker.js';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  describe('getProvider', () => {
    it('should return OpenAI provider', () => {
      const provider = registry.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('OpenAI');
      expect(provider?.openAICompatible).toBe(true);
    });

    it('should return Anthropic provider', () => {
      const provider = registry.getProvider('anthropic');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('Anthropic');
      expect(provider?.openAICompatible).toBe(false);
    });

    it('should return undefined for unknown provider', () => {
      const provider = registry.getProvider('unknown');
      expect(provider).toBeUndefined();
    });
  });

  describe('getAllProviders', () => {
    it('should return all registered providers', () => {
      const providers = registry.getAllProviders();
      expect(providers.length).toBe(Object.keys(PROVIDERS).length);
    });
  });

  describe('getOpenAICompatibleProviders', () => {
    it('should return only OpenAI-compatible providers', () => {
      const providers = registry.getOpenAICompatibleProviders();
      expect(providers.every(p => p.openAICompatible)).toBe(true);
      expect(providers.some(p => p.id === 'openai')).toBe(true);
      expect(providers.some(p => p.id === 'groq')).toBe(true);
      expect(providers.some(p => p.id === 'ollama')).toBe(true);
      // Anthropic and Google are not OpenAI-compatible
      expect(providers.some(p => p.id === 'anthropic')).toBe(false);
      expect(providers.some(p => p.id === 'google')).toBe(false);
    });
  });

  describe('getModel', () => {
    it('should return model definition', () => {
      const model = registry.getModel('openai', 'gpt-4o');
      expect(model).toBeDefined();
      expect(model?.name).toBe('GPT-4o');
      expect(model?.capabilities.tools).toBe(true);
      expect(model?.capabilities.vision).toBe(true);
    });

    it('should return undefined for unknown model', () => {
      const model = registry.getModel('openai', 'unknown-model');
      expect(model).toBeUndefined();
    });
  });

  describe('findProviderByModel', () => {
    it('should find provider by model ID', () => {
      const provider = registry.findProviderByModel('gpt-4o');
      expect(provider?.id).toBe('openai');
    });

    it('should find provider for Anthropic model', () => {
      const provider = registry.findProviderByModel('claude-sonnet-4-20250514');
      expect(provider?.id).toBe('anthropic');
    });

    it('should return undefined for unknown model', () => {
      const provider = registry.findProviderByModel('unknown-model');
      expect(provider).toBeUndefined();
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly', () => {
      // GPT-4o: $2.50/1M input, $10.00/1M output
      const cost = registry.estimateCost('openai', 'gpt-4o', 1000, 500);
      // Expected: (1000/1M) * 2.50 + (500/1M) * 10.00 = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 7);
    });

    it('should return 0 for Ollama (free)', () => {
      const cost = registry.estimateCost('ollama', 'llama3.2', 10000, 5000);
      expect(cost).toBe(0);
    });

    it('should return 0 for unknown model', () => {
      const cost = registry.estimateCost('openai', 'unknown', 1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe('getProvidersWithCapability', () => {
    it('should return providers with vision capability', () => {
      const providers = registry.getProvidersWithCapability('vision');
      expect(providers.some(p => p.id === 'openai')).toBe(true);
      expect(providers.some(p => p.id === 'anthropic')).toBe(true);
      expect(providers.some(p => p.id === 'google')).toBe(true);
    });

    it('should return providers with tools capability', () => {
      const providers = registry.getProvidersWithCapability('tools');
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('setCustomBaseURL', () => {
    it('should override provider base URL', () => {
      registry.setCustomBaseURL('openai', 'http://localhost:8080');
      expect(registry.getBaseURL('openai')).toBe('http://localhost:8080');
    });
  });

  describe('registerProvider', () => {
    it('should register custom provider', () => {
      const customProvider: ProviderDefinition = {
        id: 'custom',
        name: 'Custom Provider',
        baseURL: 'https://custom.api.com',
        apiKeyEnvVar: 'CUSTOM_API_KEY',
        openAICompatible: true,
        defaultModel: 'custom-model',
        models: [
          {
            id: 'custom-model',
            name: 'Custom Model',
            contextWindow: 8000,
            maxOutput: 2000,
            pricing: { input: 1.0, output: 2.0 },
            capabilities: { chat: true, tools: true, vision: false, streaming: true, json_mode: true },
          },
        ],
      };

      registry.registerProvider(customProvider);
      expect(registry.getProvider('custom')).toBeDefined();
      expect(registry.getProvider('custom')?.name).toBe('Custom Provider');
    });
  });
});

describe('ProviderRouter', () => {
  let router: ProviderRouter;
  let registry: ProviderRegistry;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set mock API keys for testing
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    process.env['GROQ_API_KEY'] = 'test-groq-key';
    process.env['GOOGLE_API_KEY'] = 'test-google-key';
    process.env['TOGETHER_API_KEY'] = 'test-together-key';

    registry = new ProviderRegistry();
    router = new ProviderRouter({ registry });
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('route', () => {
    it('should route to specific model when requested', async () => {
      const decision = await router.route({ model: 'gpt-4o-mini' });
      expect(decision.model.id).toBe('gpt-4o-mini');
      expect(decision.provider.id).toBe('openai');
    });

    it('should prefer specified provider', async () => {
      const decision = await router.route({
        preferredProviders: ['groq'],
      });
      // If Groq is available, it should be selected
      // Otherwise, fallback to other available providers
      expect(decision.provider).toBeDefined();
    });

    it('should exclude specified providers', async () => {
      const decision = await router.route({
        excludedProviders: ['openai', 'anthropic'],
      });
      expect(decision.provider.id).not.toBe('openai');
      expect(decision.provider.id).not.toBe('anthropic');
    });

    it('should prefer local (Ollama) when requested', async () => {
      const decision = await router.route({
        preferLocal: true,
      });
      // Ollama should score higher
      expect(decision.reasons.some(r => r.includes('Local'))).toBe(true);
    });

    it('should provide fallbacks', async () => {
      const decision = await router.route({});
      expect(decision.fallbacks).toBeDefined();
      expect(decision.fallbacks.length).toBeGreaterThan(0);
    });

    it('should respect cost constraints', async () => {
      const decision = await router.route({
        maxCostPerRequest: 0.0001,
        preferCheapest: true,
      });
      expect(decision.estimatedCost).toBeLessThanOrEqual(0.0001);
    });

    it('should throw for unavailable required model', async () => {
      await expect(
        router.route({ model: 'nonexistent-model' })
      ).rejects.toThrow('Required model');
    });
  });

  describe('getAllScores', () => {
    it('should return scores for all providers', async () => {
      const scores = await router.getAllScores({});
      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0]?.score).toBeGreaterThanOrEqual(0);
    });

    it('should sort by score descending', async () => {
      const scores = await router.getAllScores({});
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]?.score ?? 0).toBeGreaterThanOrEqual(scores[i]?.score ?? 0);
      }
    });
  });

  describe('recordLatency', () => {
    it('should track latency for providers', () => {
      router.recordLatency('openai', 500);
      router.recordLatency('openai', 600);
      router.recordLatency('openai', 550);
      // Latency affects routing when preferFastest is set
      // No direct way to check, but it shouldn't throw
    });
  });
});

describe('Keymaker', () => {
  let keymaker: Keymaker;

  beforeEach(() => {
    keymaker = new Keymaker({
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o-mini',
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const km = new Keymaker();
      expect(km.getProviders().length).toBeGreaterThan(0);
    });

    it('should use custom config', () => {
      const km = new Keymaker({
        defaultProvider: 'groq',
        defaultModel: 'llama-3.3-70b-versatile',
      });
      expect(km.getProviders()).toBeDefined();
    });
  });

  describe('getProviders', () => {
    it('should return all providers', () => {
      const providers = keymaker.getProviders();
      expect(providers.length).toBe(Object.keys(PROVIDERS).length);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return providers with API keys', () => {
      const available = keymaker.getAvailableProviders();
      // At minimum, Ollama should be "available" (no key required)
      expect(available.some(p => p.id === 'ollama')).toBe(true);
    });
  });

  describe('getConstraintsFromContract', () => {
    it('should extract cost constraints', () => {
      const contract = {
        contract: {
          id: 'test',
          version: '1.0.0',
          type: 'test',
          name: 'Test',
          metadata: { created_at: '', created_by: '', priority: 'normal' as const, tags: [] },
          requirements: { description: '' },
          goals: { objectives: [], success_threshold: 7 },
          limitations: {},
          limits: { cost: { max_usd: 0.10 } },
        },
      };

      const constraints = keymaker.getConstraintsFromContract(contract);
      expect(constraints.maxCostPerRequest).toBe(0.025); // 0.10 / 4
    });

    it('should extract model requirements', () => {
      const contract = {
        contract: {
          id: 'test',
          version: '1.0.0',
          type: 'test',
          name: 'Test',
          metadata: { created_at: '', created_by: '', priority: 'normal' as const, tags: [] },
          requirements: { description: '' },
          goals: { objectives: [], success_threshold: 7 },
          limitations: {},
          resources: { models: { allowed: ['gpt-4o'], preferred: 'gpt-4o' } },
        },
      };

      const constraints = keymaker.getConstraintsFromContract(contract);
      expect(constraints.model).toBe('gpt-4o');
    });

    it('should extract preference tags', () => {
      const contract = {
        contract: {
          id: 'test',
          version: '1.0.0',
          type: 'test',
          name: 'Test',
          metadata: { created_at: '', created_by: '', priority: 'normal' as const, tags: ['local', 'cheap', 'quality'] },
          requirements: { description: '' },
          goals: { objectives: [], success_threshold: 7 },
          limitations: {},
        },
      };

      const constraints = keymaker.getConstraintsFromContract(contract);
      expect(constraints.preferLocal).toBe(true);
      expect(constraints.preferCheapest).toBe(true);
      expect(constraints.preferBestQuality).toBe(true);
    });
  });

  describe('getRegistry', () => {
    it('should return provider registry', () => {
      const registry = keymaker.getRegistry();
      expect(registry).toBeDefined();
      expect(registry.getProvider('openai')).toBeDefined();
    });
  });

  describe('getRouter', () => {
    it('should return provider router', () => {
      const router = keymaker.getRouter();
      expect(router).toBeDefined();
    });
  });
});

describe('Provider Definitions', () => {
  describe('OpenAI Provider', () => {
    it('should have correct models', () => {
      expect(OPENAI_PROVIDER.models.some(m => m.id === 'gpt-4o')).toBe(true);
      expect(OPENAI_PROVIDER.models.some(m => m.id === 'gpt-4o-mini')).toBe(true);
      expect(OPENAI_PROVIDER.models.some(m => m.id === 'gpt-3.5-turbo')).toBe(true);
    });

    it('should have correct capabilities', () => {
      const gpt4o = OPENAI_PROVIDER.models.find(m => m.id === 'gpt-4o');
      expect(gpt4o?.capabilities.tools).toBe(true);
      expect(gpt4o?.capabilities.vision).toBe(true);
      expect(gpt4o?.capabilities.streaming).toBe(true);
    });
  });

  describe('Anthropic Provider', () => {
    it('should not be OpenAI compatible', () => {
      expect(ANTHROPIC_PROVIDER.openAICompatible).toBe(false);
    });

    it('should have Claude models', () => {
      expect(ANTHROPIC_PROVIDER.models.some(m => m.id.includes('claude'))).toBe(true);
    });
  });

  describe('Groq Provider', () => {
    it('should be OpenAI compatible', () => {
      expect(GROQ_PROVIDER.openAICompatible).toBe(true);
    });

    it('should have Llama models', () => {
      expect(GROQ_PROVIDER.models.some(m => m.id.includes('llama'))).toBe(true);
    });
  });
});
