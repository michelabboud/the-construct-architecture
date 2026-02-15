/**
 * Example 02 — Oracle & XP System
 *
 * Adds Oracle judgment, XP tracking, and level-up to the basic pipeline.
 * Worker output → Oracle judges → XP awarded → Level-up check
 *
 * Run: npx tsx examples/02-oracle-xp/index.ts
 */

import { Architect, Sentinels, Worker, Oracle } from '../../src/index.js';
import { DatabaseConnection } from '../../src/oracle/database.js';
import type { Contract, AgentSubmission } from '../../src/index.js';

// Contract for a code generation task
const contract: Contract = {
  contract: {
    id: 'code-gen-001',
    version: '1.0.0',
    type: 'code_generation',
    name: 'TypeScript Function Generator',
    metadata: {
      created_at: new Date().toISOString(),
      created_by: 'example-runner',
      priority: 'high',
      tags: ['code', 'typescript'],
    },
    requirements: {
      description: 'Generate a TypeScript utility function',
    },
    goals: {
      objectives: [
        'Produce a working TypeScript function',
        'Include JSDoc comments',
        'Handle edge cases',
      ],
      quality_criteria: {
        accuracy: { weight: 0.4, min_score: 7 },
        completeness: { weight: 0.3, min_score: 6 },
        consistency: { weight: 0.3, min_score: 6 },
      },
      success_threshold: 7,
    },
    limitations: {
      forbidden_actions: ['file_delete'],
      constraints: ['Must be valid TypeScript', 'No external dependencies'],
    },
  },
};

async function main() {
  console.log('=== Example 02: Oracle & XP System ===\n');

  // 1. Setup infrastructure
  const architect = new Architect();
  await architect.initialize();

  const sentinels = new Sentinels(architect);
  const worker = new Worker({ sentinels, usePlaceholder: true });

  // 2. Setup Oracle with in-memory database
  const db = new DatabaseConnection(':memory:');
  await db.open();
  const oracle = new Oracle({ db, autoSave: false });
  console.log('[Oracle] Ready with in-memory database');

  // 3. Create/get agent profile
  const agentId = 'agent-gpt4-coder';
  const profile = await oracle.getOrCreateProfile(agentId, 'openai', 'gpt-4');
  console.log(`[Oracle] Agent profile: ${profile.id} (Level: ${profile.level}, XP: ${profile.xp})`);

  // 4. Execute multiple tasks and have Oracle judge each one
  const tasks = [
    { id: 'task-001', desc: 'Generate a debounce function' },
    { id: 'task-002', desc: 'Generate a deep clone function' },
    { id: 'task-003', desc: 'Generate a retry with backoff function' },
  ];

  for (const t of tasks) {
    console.log(`\n--- Task: ${t.desc} ---`);

    // Execute
    const task = {
      id: t.id,
      type: 'code_generation',
      description: t.desc,
      inputs: { language: 'typescript' },
      expectedOutput: 'A TypeScript function',
    };

    const result = await worker.execute(task, contract);
    console.log(`[Worker] Success: ${result.success}, Duration: ${result.duration}ms`);

    // Validate output
    const validation = await sentinels.validateOutput(result.output, contract);
    console.log(`[Sentinels] Score: ${validation.score}/10`);

    // Submit to Oracle for judgment
    const submission: AgentSubmission = {
      agentId,
      contractId: contract.contract.id,
      output: result.output,
      duration: result.duration,
      cost: result.cost,
      retries: 0,
      toolsUsed: ['placeholder'],
    };

    const judgment = await oracle.submitForJudgment(submission, contract, {
      valid: validation.valid,
      score: validation.score,
      errors: validation.errors,
    });

    console.log(`[Oracle] Verdict: ${judgment.verdict}`);
    console.log(`[Oracle] Score: ${judgment.score}/10`);
    console.log(`[Oracle] XP awarded: ${judgment.xpAwarded}`);
    if (judgment.achievementsUnlocked.length > 0) {
      console.log(`[Oracle] Achievements: ${judgment.achievementsUnlocked.join(', ')}`);
    }
  }

  // 5. Check final agent profile
  const finalProfile = await oracle.getProfile(agentId);
  if (finalProfile) {
    console.log('\n--- Final Agent Profile ---');
    console.log(`  Level: ${finalProfile.level}`);
    console.log(`  XP: ${finalProfile.xp}`);
    console.log(`  Total tasks: ${finalProfile.stats.totalTasks}`);
    console.log(`  Avg score: ${finalProfile.stats.averageScore.toFixed(1)}`);
    console.log(`  Achievements: ${finalProfile.achievements.length}`);
  }

  // 6. Show top agents leaderboard
  const topAgents = await oracle.getTopAgents(5);
  console.log('\n--- Leaderboard ---');
  topAgents.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.id} — Level: ${a.level}, XP: ${a.xp}`);
  });

  // 7. Show level-up thresholds
  const levelUp = oracle.getLevelUpSystem();
  console.log('\n--- Level Thresholds ---');
  console.log(`  Rookie: 0 XP`);
  console.log(`  Reliable: 100 XP`);
  console.log(`  Trusted: 500 XP`);
  console.log(`  Expert: 2000 XP`);

  await db.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
