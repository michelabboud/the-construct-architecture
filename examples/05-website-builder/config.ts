/**
 * Shared configuration for the Website Builder example.
 *
 * Reads CONSTRUCT_PROVIDER env var to select a provider:
 *   anthropic — uses Anthropic (needs ANTHROPIC_API_KEY)
 *   openai    — uses OpenAI (needs OPENAI_API_KEY)
 *   ollama    — uses local Ollama (needs Ollama running at localhost:11434)
 *   mock      — placeholder responses, no API key needed
 *   (not set) — auto-detect from available env vars, fall back to mock
 */

import { Keymaker, Worker } from '../../src/index.js';
import type { Sentinels } from '../../src/index.js';
import { defaultRegistry } from '../../src/keymaker/providers.js';

// Provider → default model mapping
const PROVIDER_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  ollama: 'llama3.2',
};

// Auto-detect order when CONSTRUCT_PROVIDER is not set
const AUTO_DETECT_ORDER = ['anthropic', 'openai', 'google', 'groq', 'together', 'ollama'];

interface ProviderConfig {
  provider: string;
  model: string;
}

/**
 * Determine the active provider from CONSTRUCT_PROVIDER env var
 * or auto-detect from available API keys.
 * Returns null if no provider is available (mock mode).
 */
export function getProviderConfig(): ProviderConfig | null {
  const requested = process.env.CONSTRUCT_PROVIDER?.toLowerCase();

  if (requested === 'mock') return null;

  if (requested) {
    if (!PROVIDER_MODELS[requested]) {
      console.warn(`  [Config] Unknown provider "${requested}", falling back to mock mode`);
      return null;
    }
    if (!defaultRegistry.isProviderAvailable(requested)) {
      const provider = defaultRegistry.getProvider(requested);
      const envVar = provider?.apiKeyEnvVar ?? 'API_KEY';
      console.warn(`  [Config] Provider "${requested}" selected but ${envVar} is not set, falling back to mock mode`);
      return null;
    }
    return { provider: requested, model: PROVIDER_MODELS[requested] };
  }

  // Auto-detect: try providers in order
  for (const id of AUTO_DETECT_ORDER) {
    if (defaultRegistry.isProviderAvailable(id)) {
      return { provider: id, model: PROVIDER_MODELS[id] };
    }
  }

  return null;
}

// Cache the config so all agents share the same decision
let _cachedConfig: ProviderConfig | null | undefined;
let _configResolved = false;

function resolveConfig(): ProviderConfig | null {
  if (!_configResolved) {
    _cachedConfig = getProviderConfig();
    _configResolved = true;
  }
  return _cachedConfig ?? null;
}

/**
 * Returns true if running in mock/placeholder mode (no real AI).
 */
export function isMockMode(): boolean {
  return resolveConfig() === null;
}

/**
 * Returns a human-readable label for the active provider, e.g. "anthropic (claude-sonnet-4-20250514)".
 */
export function getProviderLabel(): string {
  const config = resolveConfig();
  if (!config) return 'mock (placeholder responses)';
  return `${config.provider} (${config.model})`;
}

/**
 * Create a Worker wired to the active provider.
 * In mock mode, returns a Worker with usePlaceholder: true.
 */
export function createWorker(sentinels: Sentinels): Worker {
  const config = resolveConfig();

  if (!config) {
    return new Worker({ sentinels, usePlaceholder: true });
  }

  const keymaker = new Keymaker({
    defaultProvider: config.provider,
    defaultModel: config.model,
  });

  return new Worker({ sentinels, keymaker });
}
