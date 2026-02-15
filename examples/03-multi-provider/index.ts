/**
 * Example 03 — Multi-Provider Keymaker
 *
 * Demonstrates configuring multiple AI providers with routing and fallback.
 * Keymaker → Router picks provider → Generate → Fallback on failure
 *
 * Run: npx tsx examples/03-multi-provider/index.ts
 *
 * To use with real AI providers, set environment variables:
 *   OPENAI_API_KEY=sk-...
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import { Keymaker } from '../../src/index.js';
import type { Contract } from '../../src/index.js';

// Contract that specifies allowed models and cost limits
const contract: Contract = {
  contract: {
    id: 'multi-provider-001',
    version: '1.0.0',
    type: 'generation',
    name: 'Multi-Provider Generation',
    metadata: {
      created_at: new Date().toISOString(),
      created_by: 'example-runner',
      priority: 'normal',
      tags: ['multi-provider', 'keymaker'],
    },
    requirements: {
      description: 'Generate content using the best available provider',
    },
    goals: {
      objectives: ['Produce high-quality content'],
      success_threshold: 7,
    },
    limitations: {
      constraints: ['Stay within cost budget'],
    },
    resources: {
      models: {
        allowed: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
        preferred: 'claude-3-sonnet',
        forbidden: ['gpt-3.5-turbo-instruct'],
      },
    },
    limits: {
      cost: {
        max_usd: 0.50,
        warn_at: 0.25,
        track_by: 'contract',
      },
      tokens: {
        max_input: 4000,
        max_output: 2000,
      },
      retries: {
        max_attempts: 3,
        backoff: 'exponential',
        retry_on: ['rate_limit', 'timeout', 'server_error'],
      },
    },
  },
};

async function main() {
  console.log('=== Example 03: Multi-Provider Keymaker ===\n');

  // 1. Create Keymaker with default config
  //    In production, providers are auto-detected from API keys in environment
  const keymaker = new Keymaker({
    defaultProvider: 'openai',
    defaultModel: 'gpt-3.5-turbo',
    timeout: 30000,
    maxRetries: 3,
  });
  console.log('[Keymaker] Initialized');

  // 2. Show registered providers
  const providers = keymaker.getProviders();
  console.log(`[Keymaker] Registered providers: ${providers.length}`);
  providers.forEach(p => {
    console.log(`  - ${p.id}: ${p.models?.length ?? 0} models`);
  });

  // 3. Extract routing constraints from contract
  const constraints = keymaker.getConstraintsFromContract(contract);
  console.log('\n[Keymaker] Contract routing constraints:');
  console.log(`  Model: ${constraints.model ?? 'any'}`);
  console.log(`  Max cost/request: $${constraints.maxCostPerRequest ?? 'unlimited'}`);
  console.log(`  Prefer local: ${constraints.preferLocal ?? false}`);
  console.log(`  Prefer cheapest: ${constraints.preferCheapest ?? false}`);

  // 4. Test provider availability
  console.log('\n[Keymaker] Testing provider availability...');
  const availability = await keymaker.testAllProviders();
  availability.forEach((result, providerId) => {
    console.log(`  ${providerId}: ${result.available ? 'available' : 'unavailable'} ${result.error ? `(${result.error})` : ''}`);
  });

  // 5. Demonstrate generation with fallback
  //    This will fail gracefully without API keys, showing the fallback mechanism
  console.log('\n[Keymaker] Attempting generation with fallback...');
  try {
    const response = await keymaker.generateWithFallback(
      'Explain the concept of dependency injection in 2 sentences.',
      { maxTokens: 200 },
    );
    console.log(`  Provider: ${response.provider}`);
    console.log(`  Model: ${response.model}`);
    console.log(`  Tokens: ${response.tokenUsage.input}in / ${response.tokenUsage.output}out`);
    console.log(`  Cost: $${response.cost.toFixed(4)}`);
    console.log(`  Attempts: ${response.attempts}`);
    console.log(`  Response: ${response.content}`);
  } catch (error) {
    // Expected when no API keys are configured
    console.log('  (No API keys configured — this is expected in demo mode)');
    console.log(`  Error: ${(error as Error).message}`);
  }

  // 6. Show how chat works (would need API key to actually work)
  console.log('\n[Keymaker] Chat example (structure only):');
  const messages = [
    { role: 'system' as const, content: 'You are a helpful coding assistant.' },
    { role: 'user' as const, content: 'What is a monad?' },
  ];
  console.log('  Messages:', JSON.stringify(messages, null, 2));
  console.log('  (Would call keymaker.chat(messages) with a valid API key)');

  console.log('\n=== Done ===');
}

main().catch(console.error);
