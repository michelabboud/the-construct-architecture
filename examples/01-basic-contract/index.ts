/**
 * Example 01 — Basic Contract
 *
 * The simplest Construct pipeline:
 * Architect → Contract → Sentinels → Worker → Output
 *
 * Run: npx tsx examples/01-basic-contract/index.ts
 */

import { Architect, Sentinels, Worker } from '../../src/index.js';
import type { Contract } from '../../src/index.js';

// A minimal contract defined inline (normally loaded from YAML)
const contract: Contract = {
  contract: {
    id: 'hello-world-001',
    version: '1.0.0',
    type: 'generation',
    name: 'Hello World Generator',
    metadata: {
      created_at: new Date().toISOString(),
      created_by: 'example-runner',
      priority: 'normal',
      tags: ['example', 'hello-world'],
    },
    requirements: {
      description: 'Generate a friendly greeting message',
    },
    goals: {
      objectives: [
        'Produce a greeting that includes the users name',
        'Keep the tone friendly and professional',
      ],
      success_threshold: 7,
    },
    limitations: {
      forbidden_actions: ['file_delete', 'network_request'],
      forbidden_content: ['profanity', 'personal data'],
      constraints: ['Response must be under 280 characters'],
    },
  },
};

async function main() {
  console.log('=== Example 01: Basic Contract ===\n');

  // 1. Create the Architect (source of truth)
  const architect = new Architect();
  await architect.initialize();
  console.log('[Architect] Initialized');

  // 2. Validate the contract
  const validation = architect.validateContract(contract);
  console.log(`[Architect] Contract valid: ${validation.valid}`);
  if (!validation.valid) {
    console.error('[Architect] Validation errors:', validation.errors);
    return;
  }

  // 3. Create Sentinels (QA enforcement)
  const sentinels = new Sentinels(architect);
  console.log('[Sentinels] Ready to enforce');

  // 4. Create Worker (with usePlaceholder so no real AI calls)
  const worker = new Worker({ sentinels, usePlaceholder: true });
  console.log('[Worker] Ready with placeholder mode');

  // 5. Execute a task within the contract
  const task = {
    id: 'task-greet-001',
    type: 'generation',
    description: 'Generate a greeting for the user',
    inputs: { userName: 'Neo' },
    expectedOutput: 'A friendly greeting string',
  };

  console.log('\n[Worker] Executing task...');
  const result = await worker.execute(task, contract);

  console.log('\n--- Result ---');
  console.log(`  Success: ${result.success}`);
  console.log(`  Task ID: ${result.taskId}`);
  console.log(`  Duration: ${result.duration}ms`);
  console.log(`  Cost: $${result.cost.toFixed(4)}`);
  console.log(`  Output: ${JSON.stringify(result.output)}`);

  // 6. Validate the output with Sentinels
  const outputValidation = await sentinels.validateOutput(result.output, contract);
  console.log(`\n[Sentinels] Output valid: ${outputValidation.valid}`);
  console.log(`[Sentinels] Score: ${outputValidation.score}/10`);
  console.log(`[Sentinels] Meets threshold: ${sentinels.meetsThreshold(outputValidation, contract)}`);

  console.log('\n=== Done ===');
}

main().catch(console.error);
