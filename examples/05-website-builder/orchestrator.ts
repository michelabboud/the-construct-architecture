/**
 * Website Builder Orchestrator — Full Agentic Loop
 *
 * Demonstrates every Construct component working together:
 *
 *   Architect → Agent Smith → Agents → Worker → Keymaker → Sentinels → Oracle
 *
 * The orchestrator:
 * 1. Reads a website spec (pages, components, style)
 * 2. Loads contracts for each task type
 * 3. Security-checks agent identity with Agent Smith
 * 4. Assigns agents (designer, stylist, developer) to execute contracts
 * 5. Validates all output with Sentinels
 * 6. Reviews code with the reviewer agent
 * 7. Runs QA checks
 * 8. Oracle judges each agent's work and awards XP
 * 9. If quality < threshold, re-executes with feedback
 * 10. Level-up unlocks more autonomy for trusted agents
 *
 * Run: npx tsx examples/05-website-builder/orchestrator.ts
 *
 * Provider selection via CONSTRUCT_PROVIDER env var:
 *   anthropic — uses Anthropic (needs ANTHROPIC_API_KEY)
 *   openai    — uses OpenAI (needs OPENAI_API_KEY)
 *   ollama    — uses local Ollama (needs Ollama running)
 *   mock      — placeholder responses, no API key needed (default)
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

import {
  Architect,
  Sentinels,
  Oracle,
  AgentSmith,
} from '../../src/index.js';
import { DatabaseConnection } from '../../src/oracle/database.js';
import type { Contract, AgentSubmission } from '../../src/index.js';
import type { SecurityPrincipal, SecurityResource, SecurityAction } from '../../src/index.js';

import { runDesigner } from './agents/designer.js';
import { runStylist } from './agents/stylist.js';
import { runDeveloper } from './agents/developer.js';
import { runReviewer } from './agents/reviewer.js';
import { runQA } from './agents/qa.js';
import { getProviderLabel } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============ Website Specification ============

interface WebsiteSpec {
  name: string;
  pages: { name: string; title: string; sections: string[] }[];
  components: { name: string; description: string; props: Record<string, string> }[];
  style: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    darkMode: boolean;
  };
}

const websiteSpec: WebsiteSpec = {
  name: 'construct-demo-site',
  pages: [
    {
      name: 'index',
      title: 'Welcome to The Construct',
      sections: ['Hero', 'Features', 'How It Works', 'Contact'],
    },
    {
      name: 'about',
      title: 'About The Construct',
      sections: ['Mission', 'Architecture', 'Team'],
    },
  ],
  components: [
    {
      name: 'Feature Card',
      description: 'A card displaying a feature with icon, title, and description',
      props: { icon: 'string', title: 'string', description: 'string' },
    },
    {
      name: 'CTA Button',
      description: 'A call-to-action button with customizable text and style',
      props: { text: 'string', href: 'string', variant: 'primary | secondary' },
    },
  ],
  style: {
    primaryColor: '#2d5016',
    secondaryColor: '#8bc34a',
    fontFamily: "'Inter', system-ui, sans-serif",
    darkMode: true,
  },
};

// ============ Contract Loader ============

async function loadContract(contractName: string): Promise<Contract> {
  const contractPath = resolve(__dirname, 'construct', 'contracts', `${contractName}.yaml`);
  const content = await readFile(contractPath, 'utf-8');
  return parseYaml(content) as Contract;
}

// ============ Security Helpers ============

function createAgentPrincipal(agentId: string, role: string): SecurityPrincipal {
  return {
    id: agentId,
    type: 'agent',
    name: agentId,
    roles: [role],
    attributes: { level: 'rookie', automated: true },
    authMetadata: {
      method: 'api_key',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      issuer: 'construct-orchestrator',
    },
  };
}

function checkAgentAccess(
  smith: AgentSmith,
  agentId: string,
  role: string,
  contractId: string,
): boolean {
  const principal = createAgentPrincipal(agentId, role);
  const resource: SecurityResource = {
    type: 'contract',
    id: contractId,
    attributes: {},
  };
  const action: SecurityAction = {
    type: 'contract_execution',
    operation: 'execute',
  };

  const decision = smith.enforcePolicy(principal, resource, action);
  return decision.allowed;
}

// ============ Main Orchestrator ============

async function orchestrate() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     The Construct — Website Builder Example      ║');
  console.log('║     Full Agentic Loop Demonstration              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  console.log(`  AI Provider: ${getProviderLabel()}\n`);

  // ── Step 1: Initialize infrastructure ──
  console.log('Step 1: Initializing infrastructure...\n');

  const architect = new Architect();
  await architect.initialize();
  console.log('  [Architect] Initialized (source of truth)');

  const sentinels = new Sentinels(architect);
  console.log('  [Sentinels] Ready (QA enforcement)');

  const db = new DatabaseConnection(':memory:');
  await db.open();
  const oracle = new Oracle({ db, autoSave: false });
  console.log('  [Oracle] Ready (judgment & XP)');

  const smith = new AgentSmith({
    securityConfig: { zeroTrust: true, defaultDeny: true },
    autoResponse: true,
    policyMode: 'first_match',
  });
  // Allow our agents to execute contracts
  smith.addPolicy({
    id: 'allow-builder-agents',
    name: 'Allow Builder Agents',
    effect: 'allow',
    priority: 100,
    conditions: {
      principals: { roles: ['builder-agent'] },
      actions: { operations: ['execute'] },
    },
    enabled: true,
  });
  console.log('  [Smith] Security Director ready');

  // ── Step 2: Load contracts ──
  console.log('\nStep 2: Loading contracts...\n');

  const contracts = {
    page: await loadContract('generate-page'),
    styles: await loadContract('generate-styles'),
    component: await loadContract('generate-component'),
    review: await loadContract('review-code'),
    qa: await loadContract('qa-check'),
  };

  // Validate each contract with the Architect
  for (const [name, contract] of Object.entries(contracts)) {
    const validation = architect.validateContract(contract);
    console.log(`  [Architect] ${name}: ${validation.valid ? 'valid' : 'INVALID'}`);
    if (!validation.valid) {
      console.error(`    Errors:`, validation.errors);
    }
  }

  // ── Step 3: Security check agents ──
  console.log('\nStep 3: Security-checking agent identities...\n');

  const agentIds = ['agent-designer', 'agent-stylist', 'agent-developer', 'agent-reviewer', 'agent-qa'];
  for (const agentId of agentIds) {
    const allowed = checkAgentAccess(smith, agentId, 'builder-agent', 'generate-page-001');
    console.log(`  [Smith] ${agentId}: ${allowed ? 'AUTHORIZED' : 'DENIED'}`);
  }

  // ── Step 4: Create agent profiles in Oracle ──
  console.log('\nStep 4: Registering agents with Oracle...\n');

  for (const agentId of agentIds) {
    const profile = await oracle.getOrCreateProfile(agentId, 'mock', 'placeholder');
    console.log(`  [Oracle] ${agentId}: Level=${profile.level}, XP=${profile.xp}`);
  }

  // ── Step 5: Execute generation contracts ──
  console.log('\nStep 5: Executing generation contracts...\n');

  // Track all generated files for review and QA
  const generatedFiles: { name: string; content: string }[] = [];

  // 5a. Generate styles first (pages reference the stylesheet)
  console.log('  --- Generating Styles ---');
  const stylistResult = await runStylist(websiteSpec.style, contracts.styles, sentinels);
  generatedFiles.push({ name: 'styles.css', content: stylistResult.css });
  console.log(`  [Stylist] Generated styles.css (${stylistResult.css.length} chars)`);

  // 5b. Generate pages (can run in parallel in production)
  console.log('\n  --- Generating Pages ---');
  for (const page of websiteSpec.pages) {
    const designerResult = await runDesigner(
      {
        pageName: page.name,
        title: page.title,
        sections: page.sections,
        stylesheetPath: 'styles.css',
      },
      contracts.page,
      sentinels,
    );
    generatedFiles.push({ name: `${page.name}.html`, content: designerResult.html });
    console.log(`  [Designer] Generated ${page.name}.html (${designerResult.html.length} chars)`);
  }

  // 5c. Generate components
  console.log('\n  --- Generating Components ---');
  for (const component of websiteSpec.components) {
    const devResult = await runDeveloper(
      {
        componentName: component.name,
        description: component.description,
        props: component.props,
      },
      contracts.component,
      sentinels,
    );
    const fileName = `components/${component.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    generatedFiles.push({ name: fileName, content: devResult.html });
    console.log(`  [Developer] Generated ${fileName} (${devResult.html.length} chars)`);
  }

  // ── Step 6: Validate outputs with Sentinels ──
  console.log('\nStep 6: Validating outputs with Sentinels...\n');

  for (const file of generatedFiles) {
    const contract = file.name.endsWith('.css') ? contracts.styles : contracts.page;
    const validation = await sentinels.validateOutput(file.content, contract);
    const meetsThreshold = sentinels.meetsThreshold(validation, contract);
    console.log(`  [Sentinels] ${file.name}: score=${validation.score}/10 threshold=${meetsThreshold ? 'MET' : 'BELOW'}`);
  }

  // ── Step 7: Code review ──
  console.log('\nStep 7: Running code review...\n');

  const reviewResult = await runReviewer(
    { files: generatedFiles },
    contracts.review,
    sentinels,
  );

  console.log(`  [Reviewer] Passed: ${reviewResult.passed}`);
  console.log(`  [Reviewer] Score: ${reviewResult.score}/10`);
  console.log(`  [Reviewer] Summary: ${reviewResult.summary}`);
  if (reviewResult.issues.length > 0) {
    console.log(`  [Reviewer] Issues:`);
    for (const issue of reviewResult.issues) {
      console.log(`    ${issue.severity.toUpperCase()}: ${issue.file} — ${issue.message}`);
      console.log(`      Fix: ${issue.suggestion}`);
    }
  }

  // ── Step 8: QA checks ──
  console.log('\nStep 8: Running QA checks...\n');

  const qaResult = await runQA(
    {
      files: generatedFiles,
      pages: websiteSpec.pages.map(p => p.name),
    },
    contracts.qa,
    sentinels,
  );

  console.log(`  [QA] Passed: ${qaResult.passed}`);
  console.log(`  [QA] Score: ${qaResult.score}/10`);
  for (const check of qaResult.checks) {
    console.log(`    ${check.passed ? 'PASS' : 'FAIL'}: ${check.name} — ${check.details}`);
  }

  // ── Step 9: Oracle judges all agents ──
  console.log('\nStep 9: Oracle judging agent performance...\n');

  // Collect all submissions for judgment
  const submissions: AgentSubmission[] = [
    stylistResult.submission,
    ...websiteSpec.pages.map((_p, i) => ({
      agentId: 'agent-designer',
      contractId: contracts.page.contract.id,
      output: generatedFiles[i + 1]?.content ?? '',
      duration: 100,
      cost: 0.01,
      retries: 0,
      toolsUsed: ['html_generator'],
    })),
    ...websiteSpec.components.map((_c, i) => ({
      agentId: 'agent-developer',
      contractId: contracts.component.contract.id,
      output: generatedFiles[websiteSpec.pages.length + 1 + i]?.content ?? '',
      duration: 80,
      cost: 0.005,
      retries: 0,
      toolsUsed: ['component_generator'],
    })),
    reviewResult.submission,
    qaResult.submission,
  ];

  for (const submission of submissions) {
    const contract = submission.contractId.includes('page') ? contracts.page
      : submission.contractId.includes('styles') ? contracts.styles
      : submission.contractId.includes('component') ? contracts.component
      : submission.contractId.includes('review') ? contracts.review
      : contracts.qa;

    const validation = await sentinels.validateOutput(submission.output, contract);

    const judgment = await oracle.submitForJudgment(submission, contract, {
      valid: validation.valid,
      score: validation.score,
      errors: validation.errors,
    });

    console.log(`  [Oracle] ${submission.agentId}: verdict=${judgment.verdict}, score=${judgment.score}/10, xp=+${judgment.xpAwarded}`);
    if (judgment.achievementsUnlocked.length > 0) {
      console.log(`           Achievements: ${judgment.achievementsUnlocked.join(', ')}`);
    }
  }

  // ── Step 10: Final leaderboard and level-up check ──
  console.log('\nStep 10: Agent leaderboard & level-up...\n');

  const topAgents = await oracle.getTopAgents(10);
  console.log('  ┌────────────────────────┬─────────┬──────┬────────┐');
  console.log('  │ Agent                  │ Level   │ XP   │ Tasks  │');
  console.log('  ├────────────────────────┼─────────┼──────┼────────┤');
  for (const agent of topAgents) {
    const name = agent.id.padEnd(22);
    const level = agent.level.padEnd(7);
    const xp = String(agent.xp).padStart(4);
    const tasks = String(agent.stats.totalTasks).padStart(5);
    console.log(`  │ ${name} │ ${level} │ ${xp} │ ${tasks}  │`);
  }
  console.log('  └────────────────────────┴─────────┴──────┴────────┘');

  // ── Summary ──
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                   Summary                        ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Pages generated:     ${websiteSpec.pages.length}                          ║`);
  console.log(`║  Components built:    ${websiteSpec.components.length}                          ║`);
  console.log(`║  Stylesheets created: 1                          ║`);
  console.log(`║  Total files:         ${generatedFiles.length}                          ║`);
  console.log(`║  Review passed:       ${reviewResult.passed ? 'Yes' : 'No'}                        ║`);
  console.log(`║  QA passed:           ${qaResult.passed ? 'Yes' : 'No'}                        ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  await db.close();
  console.log('\nDone. In production, files would be written to output/');
}

// Run the orchestrator
orchestrate().catch(console.error);
