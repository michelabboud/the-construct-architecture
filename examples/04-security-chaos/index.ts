/**
 * Example 04 — Security & Chaos Engineering
 *
 * Agent Smith enforces security policies.
 * The Twins (Ghost + Phantom) run chaos engineering scenarios.
 *
 * Run: npx tsx examples/04-security-chaos/index.ts
 */

import { AgentSmith, Twins } from '../../src/index.js';
import type {
  SecurityPrincipal,
  SecurityResource,
  SecurityAction,
  ChaosScenario,
} from '../../src/index.js';

async function main() {
  console.log('=== Example 04: Security & Chaos Engineering ===\n');

  // ========== PART 1: Agent Smith (Security) ==========
  console.log('--- Part 1: Agent Smith ---\n');

  // 1. Create Agent Smith with Zero Trust config
  const smith = new AgentSmith({
    securityConfig: {
      zeroTrust: true,
      defaultDeny: true,
      requireAuthentication: true,
      threatSensitivity: 'medium',
    },
    autoResponse: true,
    policyMode: 'first_match',
  });
  console.log('[Smith] Security Director initialized');

  // 2. Add a custom security policy
  smith.addPolicy({
    id: 'allow-trusted-agents',
    name: 'Allow Trusted Agents',
    description: 'Trusted agents can execute contracts',
    effect: 'allow',
    priority: 100,
    conditions: {
      principals: {
        roles: ['trusted-agent', 'admin'],
      },
      actions: {
        operations: ['execute', 'read'],
      },
    },
    enabled: true,
  });
  console.log('[Smith] Custom policy added');

  // 3. Test policy enforcement — trusted agent
  const trustedAgent: SecurityPrincipal = {
    id: 'agent-001',
    type: 'agent',
    name: 'GPT-4 Worker',
    roles: ['trusted-agent'],
    attributes: { level: 'trusted', provider: 'openai' },
    authMetadata: {
      method: 'api_key',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      issuer: 'construct',
    },
  };

  const contractResource: SecurityResource = {
    type: 'contract',
    id: 'contract-gen-001',
    path: '/contracts/generate-page.yaml',
    attributes: { priority: 'high' },
  };

  const executeAction: SecurityAction = {
    type: 'contract_execution',
    operation: 'execute',
  };

  const decision1 = smith.enforcePolicy(trustedAgent, contractResource, executeAction);
  console.log(`[Smith] Trusted agent execute: ${decision1.allowed ? 'ALLOWED' : 'DENIED'} (${decision1.reason})`);

  // 4. Test policy enforcement — unknown agent (should be denied)
  const unknownAgent: SecurityPrincipal = {
    id: 'agent-rogue',
    type: 'agent',
    name: 'Unknown Agent',
    roles: [],
    attributes: {},
  };

  const decision2 = smith.enforcePolicy(unknownAgent, contractResource, executeAction);
  console.log(`[Smith] Unknown agent execute: ${decision2.allowed ? 'ALLOWED' : 'DENIED'} (${decision2.reason})`);

  // 5. Handle a threat
  const threat = {
    id: `threat-${Date.now()}`,
    type: 'unauthorized_access' as const,
    level: 'high' as const,
    source: { principalId: 'agent-rogue' },
    target: { resourceType: 'contract', resourceId: 'contract-gen-001' },
    description: 'Unauthorized agent attempted to execute a contract',
    detectedAt: new Date(),
    indicators: ['no_role_assigned', 'unknown_identity'],
    status: 'detected' as const,
    recommendedActions: ['block_principal', 'investigate'],
  };
  const response = await smith.handleThreat(threat);
  console.log(`[Smith] Threat handled: ${response.id} (success: ${response.success})`);
  console.log(`[Smith] Response: ${response.summary}`);

  // 6. Get security status
  const status = smith.getSecurityStatus();
  console.log(`[Smith] Health: ${status.health}`);
  console.log(`[Smith] Active threats: ${status.activeThreats}`);
  console.log(`[Smith] Components: ${status.components.length}`);

  // ========== PART 2: The Twins (Chaos Engineering) ==========
  console.log('\n--- Part 2: The Twins ---\n');

  // 7. Create Twins with safe defaults
  const twins = new Twins({
    enabled: true,
    ghost: {
      enabled: true,
      maxConcurrentFaults: 3,
      maxFaultDurationMs: 60000,
      requireConfirmation: false, // Disabled for demo
      allowedFaultTypes: ['network_latency', 'network_drop'],
      blockedTargets: ['production'],
      safeMode: true,
      errorThreshold: 50,
    },
    phantom: {
      enabled: true,
      safeMode: true,
      maxIntensity: 3,
      allowedScanTypes: ['port_scan', 'vulnerability_scan'],
      allowedAttackTypes: ['sql_injection', 'xss'],
      blockedTargets: ['production'],
      rateLimit: 50,
      requireConfirmation: false, // Disabled for demo
    },
    requireSmithApproval: false, // Disabled for demo
    emergencyStopEnabled: true,
    autoRollback: true,
    maxScenarioDurationMs: 120000,
    notificationChannels: ['security_team'],
  });
  console.log('[Twins] Chaos Engineering initialized');

  // 8. Define a chaos scenario
  const scenario: ChaosScenario = {
    id: 'scenario-resilience-001',
    name: 'Basic Resilience Test',
    description: 'Test system resilience under network latency',
    type: 'resilience',
    targetSystem: 'construct-api',
    steps: [
      {
        id: 'step-1',
        name: 'Inject Network Latency',
        type: 'fault',
        spec: {
          type: 'network_latency',
          target: {
            type: 'service',
            id: 'api-gateway',
            name: 'API Gateway',
          },
          severity: 'medium',
          durationMs: 5000,
          params: {
            latencyMs: 500,
            jitterMs: 100,
          },
        },
        timeoutMs: 10000,
        continueOnFailure: true,
      },
      {
        id: 'step-2',
        name: 'Verify Recovery',
        type: 'checkpoint',
        spec: {
          validation: 'service_healthy',
        },
        dependsOn: ['step-1'],
        timeoutMs: 15000,
      },
    ],
    successCriteria: {
      maxErrorRate: 10,
      maxLatencyMs: 2000,
      minAvailability: 95,
      securityChecks: ['no_data_loss', 'no_unauthorized_access'],
    },
    rollbackPlan: {
      automatic: true,
      steps: ['Remove all injected faults', 'Verify service health', 'Notify team'],
    },
  };

  // 9. Run the scenario
  console.log(`[Twins] Running scenario: ${scenario.name}`);
  try {
    const result = await twins.runScenario(scenario, true); // smithApproval = true
    console.log(`[Twins] Scenario status: ${result.status}`);
    console.log(`[Twins] Steps completed: ${result.stepResults.length}`);
    console.log(`[Twins] Resilience score: ${result.resilienceMetrics.overallScore}/100`);
    console.log(`[Twins] Fault tolerance: ${result.resilienceMetrics.faultTolerance}/100`);
    console.log(`[Twins] Recovery speed: ${result.resilienceMetrics.recoverySpeed}/100`);

    if (result.observations.length > 0) {
      console.log('[Twins] Observations:');
      result.observations.forEach(o => console.log(`  - ${o}`));
    }
    if (result.recommendations.length > 0) {
      console.log('[Twins] Recommendations:');
      result.recommendations.forEach(r => console.log(`  - ${r}`));
    }
  } catch (error) {
    console.log(`[Twins] Scenario error: ${(error as Error).message}`);
  }

  // 10. Get Twins status
  const twinsStatus = twins.getStatus();
  console.log(`\n[Twins] Chaos active: ${twinsStatus.chaosActive}`);
  console.log(`[Twins] Overall resilience: ${twinsStatus.resilienceScore}/100`);
  console.log(`[Twins] Health: ${twinsStatus.health}`);

  console.log('\n=== Done ===');
}

main().catch(console.error);
