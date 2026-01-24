/**
 * Phase 7 Tests - Chaos Engineering (The Twins)
 *
 * "We are getting aggravated. Yes, we are." — The Twins
 *
 * Tests for:
 * - Ghost (Fault Injection)
 * - Phantom (Penetration Testing)
 * - Twins (Chaos Coordinator)
 */

import {
  Ghost,
  createGhost,
} from '../src/chaos/ghost/ghost.js';

import {
  Phantom,
  createPhantom,
} from '../src/chaos/phantom/phantom.js';

import {
  Twins,
  createTwins,
} from '../src/chaos/twins.js';

import type {
  FaultSpec,
  FaultType,
  ChaosTarget,
  ScanTarget,
  AttackSpec,
  ChaosScenario,
  GhostConfig,
  PhantomConfig,
} from '../src/types/chaos.js';

// ============ Test Helpers ============

function createTestTarget(overrides: Partial<ChaosTarget> = {}): ChaosTarget {
  return {
    type: 'service',
    id: `test-service-${Date.now()}`,
    name: 'Test Service',
    host: 'localhost',
    port: 3000,
    ...overrides,
  };
}

function createTestFaultSpec(overrides: Partial<FaultSpec> = {}): FaultSpec {
  return {
    type: 'network_latency',
    target: createTestTarget(),
    severity: 'low',
    durationMs: 1000,
    params: { latencyMs: 100 },
    description: 'Test fault',
    ...overrides,
  };
}

function createTestScanTarget(overrides: Partial<ScanTarget> = {}): ScanTarget {
  return {
    type: 'service',
    address: 'http://localhost:3000',
    ...overrides,
  };
}

function createTestAttackSpec(overrides: Partial<AttackSpec> = {}): AttackSpec {
  return {
    type: 'brute_force',
    target: createTestScanTarget(),
    intensity: 3,
    durationMs: 1000,
    params: {},
    description: 'Test attack',
    ...overrides,
  };
}

function createTestScenario(overrides: Partial<ChaosScenario> = {}): ChaosScenario {
  return {
    id: `scenario-${Date.now()}`,
    name: 'Test Scenario',
    description: 'Test chaos scenario',
    type: 'resilience',
    targetSystem: 'test-system',
    steps: [
      {
        id: 'step-1',
        name: 'Wait Step',
        type: 'wait',
        spec: { durationMs: 100 },
      },
    ],
    successCriteria: {
      maxErrorRate: 10,
      maxLatencyMs: 1000,
      minAvailability: 95,
      securityChecks: [],
    },
    rollbackPlan: {
      automatic: true,
      steps: ['Remove all faults'],
    },
    ...overrides,
  };
}

// ============ Ghost Tests ============

describe('Ghost (Fault Injection)', () => {
  let ghost: Ghost;

  beforeEach(() => {
    ghost = createGhost();
  });

  afterEach(async () => {
    if (ghost.isEnabled()) {
      await ghost.disable();
    }
  });

  describe('Initialization', () => {
    it('should create Ghost with default configuration', () => {
      expect(ghost).toBeInstanceOf(Ghost);
      expect(ghost.isEnabled()).toBe(false);
    });

    it('should create Ghost with custom configuration', () => {
      const customGhost = createGhost({
        maxConcurrentFaults: 10,
        safeMode: false,
      });
      const config = customGhost.getConfig();
      expect(config.maxConcurrentFaults).toBe(10);
      expect(config.safeMode).toBe(false);
    });
  });

  describe('Safety Controls', () => {
    it('should not allow fault injection when disabled', async () => {
      const spec = createTestFaultSpec();
      await expect(ghost.injectFault(spec)).rejects.toThrow('Ghost is disabled');
    });

    it('should block injection of disallowed fault types', async () => {
      ghost.enable();
      const spec = createTestFaultSpec({ type: 'state_corruption' as FaultType });
      await expect(ghost.injectFault(spec)).rejects.toThrow('Fault type not allowed');
    });

    it('should block injection on blocked targets', async () => {
      ghost.enable();
      const spec = createTestFaultSpec({
        target: createTestTarget({ id: 'production-service' }),
      });
      await expect(ghost.injectFault(spec)).rejects.toThrow('Target is blocked');
    });

    it('should require confirmation for high severity faults', async () => {
      ghost.enable();
      const spec = createTestFaultSpec({ severity: 'high' });
      await expect(ghost.injectFault(spec)).rejects.toThrow('require confirmation');
    });

    it('should allow high severity faults with confirmation', async () => {
      ghost.enable();
      const spec = createTestFaultSpec({ severity: 'high' });
      const handle = await ghost.injectFault(spec, true);
      expect(handle.status).toBe('active');
      await ghost.removeFault(handle);
    });
  });

  describe('Fault Injection', () => {
    beforeEach(() => {
      ghost.enable();
    });

    it('should inject a network latency fault', async () => {
      const spec = createTestFaultSpec({
        type: 'network_latency',
        params: { latencyMs: 200, jitterMs: 50 },
      });

      const handle = await ghost.injectFault(spec);

      expect(handle.id).toBeDefined();
      expect(handle.status).toBe('active');
      expect(handle.spec).toEqual(spec);

      await ghost.removeFault(handle);
    });

    it('should inject a network drop fault', async () => {
      const spec = createTestFaultSpec({
        type: 'network_drop',
        params: { dropPercent: 10 },
      });

      const handle = await ghost.injectFault(spec);
      expect(handle.status).toBe('active');
      await ghost.removeFault(handle);
    });

    it('should inject a CPU resource fault', async () => {
      const spec = createTestFaultSpec({
        type: 'resource_cpu',
        params: { cpuPercent: 50 },
      });

      const handle = await ghost.injectFault(spec);
      expect(handle.status).toBe('active');
      await ghost.removeFault(handle);
    });

    it('should inject a memory resource fault', async () => {
      const spec = createTestFaultSpec({
        type: 'resource_memory',
        params: { memoryBytes: 1024 * 1024 * 100 }, // 100MB
      });

      const handle = await ghost.injectFault(spec);
      expect(handle.status).toBe('active');
      await ghost.removeFault(handle);
    });

    it('should set expiration time for timed faults', async () => {
      const spec = createTestFaultSpec({ durationMs: 5000 });

      const handle = await ghost.injectFault(spec);

      expect(handle.expiresAt).toBeDefined();
      expect(handle.expiresAt!.getTime()).toBeGreaterThan(handle.injectedAt.getTime());

      await ghost.removeFault(handle);
    });
  });

  describe('Fault Management', () => {
    beforeEach(() => {
      ghost.enable();
    });

    it('should list active faults', async () => {
      const spec1 = createTestFaultSpec();
      const spec2 = createTestFaultSpec({ type: 'network_drop', params: { dropPercent: 5 } });

      const handle1 = await ghost.injectFault(spec1);
      const handle2 = await ghost.injectFault(spec2);

      const activeFaults = ghost.getActiveFaults();
      expect(activeFaults.length).toBe(2);

      await ghost.removeFault(handle1);
      await ghost.removeFault(handle2);
    });

    it('should get specific fault status', async () => {
      const spec = createTestFaultSpec();
      const handle = await ghost.injectFault(spec);

      const status = ghost.getFaultStatus(handle.id);
      expect(status).toBeDefined();
      expect(status?.handle.id).toBe(handle.id);

      await ghost.removeFault(handle);
    });

    it('should remove a fault and return result', async () => {
      const spec = createTestFaultSpec();
      const handle = await ghost.injectFault(spec);

      const result = await ghost.removeFault(handle);

      expect(result.success).toBe(true);
      expect(result.handle.status).toBe('completed');
      expect(result.observations.length).toBeGreaterThan(0);
    });

    it('should track fault impact', async () => {
      const spec = createTestFaultSpec();
      const handle = await ghost.injectFault(spec);

      ghost.recordImpact(handle.id, {
        requestsAffected: 100,
        errorsCaused: 5,
        latencyIncreaseMs: 150,
        servicesAffected: ['api', 'web'],
      });

      const status = ghost.getFaultStatus(handle.id);
      expect(status?.impact.requestsAffected).toBe(100);
      expect(status?.impact.errorsCaused).toBe(5);

      await ghost.removeFault(handle);
    });
  });

  describe('Emergency Stop', () => {
    beforeEach(() => {
      ghost.enable();
    });

    it('should remove all active faults on emergency stop', async () => {
      const spec1 = createTestFaultSpec();
      const spec2 = createTestFaultSpec({ type: 'network_drop', params: { dropPercent: 5 } });

      await ghost.injectFault(spec1);
      await ghost.injectFault(spec2);

      expect(ghost.getActiveFaults().length).toBe(2);

      const results = await ghost.emergencyStop();

      expect(results.length).toBe(2);
      expect(ghost.getActiveFaults().length).toBe(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      ghost.enable();
    });

    it('should track injection statistics', async () => {
      const spec = createTestFaultSpec();
      const handle = await ghost.injectFault(spec);
      await ghost.removeFault(handle);

      const stats = ghost.getStats();
      expect(stats.faultsInjected).toBe(1);
      expect(stats.faultsRemoved).toBe(1);
    });

    it('should track fault history', async () => {
      const spec = createTestFaultSpec();
      const handle = await ghost.injectFault(spec);
      await ghost.removeFault(handle);

      const history = ghost.getFaultHistory();
      expect(history.length).toBe(1);
      expect(history[0]!.handle.id).toBe(handle.id);
    });
  });
});

// ============ Phantom Tests ============

describe('Phantom (Penetration Testing)', () => {
  let phantom: Phantom;

  beforeEach(() => {
    phantom = createPhantom();
  });

  describe('Initialization', () => {
    it('should create Phantom with default configuration', () => {
      expect(phantom).toBeInstanceOf(Phantom);
      expect(phantom.isEnabled()).toBe(false);
    });

    it('should create Phantom with custom configuration', () => {
      const customPhantom = createPhantom({
        maxIntensity: 8,
        safeMode: false,
      });
      const config = customPhantom.getConfig();
      expect(config.maxIntensity).toBe(8);
      expect(config.safeMode).toBe(false);
    });
  });

  describe('Safety Controls', () => {
    it('should not allow scanning when disabled', async () => {
      const target = createTestScanTarget();
      await expect(phantom.runScan(target)).rejects.toThrow('Phantom is disabled');
    });

    it('should block scanning of blocked targets', async () => {
      phantom.enable();
      const target = createTestScanTarget({ address: 'http://production.example.com' });
      await expect(phantom.runScan(target)).rejects.toThrow('Target is blocked');
    });

    it('should require confirmation for attack simulation', async () => {
      phantom.enable();
      const spec = createTestAttackSpec();
      await expect(phantom.simulateAttack(spec)).rejects.toThrow('requires confirmation');
    });
  });

  describe('Security Scanning', () => {
    beforeEach(() => {
      phantom.enable();
    });

    it('should run a port scan', async () => {
      const target = createTestScanTarget();
      const result = await phantom.runScan(target, {
        scanTypes: ['port_scan'],
        intensity: 3,
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.scanTypes).toContain('port_scan');
      expect(result.stats.requestsMade).toBeGreaterThan(0);
    });

    it('should run a vulnerability scan', async () => {
      const target = createTestScanTarget();
      const result = await phantom.runScan(target, {
        scanTypes: ['vulnerability_scan'],
        intensity: 5,
      });

      expect(result.status).toBe('completed');
      // May or may not find vulnerabilities depending on random simulation
    });

    it('should run a web scan', async () => {
      const target = createTestScanTarget();
      const result = await phantom.runScan(target, {
        scanTypes: ['web_scan'],
        intensity: 3,
      });

      expect(result.status).toBe('completed');
      expect(result.vulnerabilities.length).toBeGreaterThan(0); // Should find missing headers
    });

    it('should run multiple scan types', async () => {
      const target = createTestScanTarget();
      const result = await phantom.runScan(target, {
        scanTypes: ['port_scan', 'vulnerability_scan', 'config_scan'],
        intensity: 3,
      });

      expect(result.scanTypes.length).toBe(3);
      expect(result.stats.requestsMade).toBeGreaterThan(0);
    });

    it('should respect max intensity limit', async () => {
      const target = createTestScanTarget();
      await expect(
        phantom.runScan(target, { scanTypes: ['port_scan'], intensity: 20 })
      ).rejects.toThrow('Intensity exceeds maximum');
    });
  });

  describe('Attack Simulation', () => {
    beforeEach(() => {
      phantom.enable();
    });

    it('should simulate a brute force attack', async () => {
      const spec = createTestAttackSpec({ type: 'brute_force' });
      const result = await phantom.simulateAttack(spec, true);

      expect(result.id).toBeDefined();
      expect(result.evidence.length).toBeGreaterThan(0);
      // Should be blocked by rate limiting
      expect(result.blocked).toBe(true);
    });

    it('should simulate a SQL injection attack', async () => {
      const spec = createTestAttackSpec({ type: 'sql_injection' });
      const result = await phantom.simulateAttack(spec, true);

      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should simulate an XSS attack', async () => {
      const spec = createTestAttackSpec({ type: 'xss' });
      const result = await phantom.simulateAttack(spec, true);

      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should block disallowed attack types', async () => {
      phantom.updateConfig({ allowedAttackTypes: ['brute_force'] });
      const spec = createTestAttackSpec({ type: 'command_injection' });
      await expect(phantom.simulateAttack(spec, true)).rejects.toThrow('Attack type not allowed');
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      phantom.enable();
    });

    it('should generate a penetration test report', async () => {
      // Run some scans first
      const target = createTestScanTarget();
      await phantom.runScan(target, { scanTypes: ['web_scan'], intensity: 3 });
      await phantom.runScan(target, { scanTypes: ['config_scan'], intensity: 3 });

      const report = phantom.generateReport({ title: 'Test Report' });

      expect(report.id).toBeDefined();
      expect(report.title).toBe('Test Report');
      expect(report.scanResults.length).toBe(2);
      expect(report.vulnerabilitySummary.total).toBeGreaterThan(0);
      expect(report.riskScore).toBeGreaterThanOrEqual(0);
      expect(report.executiveSummary).toBeDefined();
    });

    it('should include attack results in report', async () => {
      const target = createTestScanTarget();
      await phantom.runScan(target, { scanTypes: ['port_scan'], intensity: 2 });

      const spec = createTestAttackSpec();
      await phantom.simulateAttack(spec, true);

      const report = phantom.generateReport({ includeAttacks: true });

      expect(report.attackResults.length).toBe(1);
    });

    it('should generate prioritized recommendations', async () => {
      const target = createTestScanTarget();
      await phantom.runScan(target, { scanTypes: ['web_scan', 'api_scan'], intensity: 4 });

      const report = phantom.generateReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0]!.priority).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      phantom.enable();
    });

    it('should track scan statistics', async () => {
      const target = createTestScanTarget();
      await phantom.runScan(target, { scanTypes: ['port_scan'], intensity: 2 });

      const stats = phantom.getStats();
      expect(stats.scansCompleted).toBe(1);
      expect(stats.totalRequestsMade).toBeGreaterThan(0);
    });

    it('should track vulnerability counts by severity', async () => {
      const target = createTestScanTarget();
      await phantom.runScan(target, { scanTypes: ['web_scan', 'config_scan'], intensity: 3 });

      const stats = phantom.getStats();
      const totalVulns = Object.values(stats.vulnerabilitiesFound).reduce((a, b) => a + b, 0);
      expect(totalVulns).toBeGreaterThan(0);
    });
  });
});

// ============ Twins Tests ============

describe('Twins (Chaos Coordinator)', () => {
  let twins: Twins;

  beforeEach(() => {
    twins = createTwins();
  });

  afterEach(async () => {
    if (twins.isEnabled()) {
      await twins.disable();
    }
  });

  describe('Initialization', () => {
    it('should create Twins with default configuration', () => {
      expect(twins).toBeInstanceOf(Twins);
      expect(twins.isEnabled()).toBe(false);
    });

    it('should provide access to Ghost and Phantom', () => {
      expect(twins.getGhost()).toBeInstanceOf(Ghost);
      expect(twins.getPhantom()).toBeInstanceOf(Phantom);
    });
  });

  describe('Safety Controls', () => {
    it('should not run scenarios when disabled', async () => {
      const scenario = createTestScenario();
      await expect(twins.runScenario(scenario)).rejects.toThrow('Twins are disabled');
    });

    it('should require Smith approval by default', async () => {
      twins.enable();
      const scenario = createTestScenario();
      await expect(twins.runScenario(scenario)).rejects.toThrow('Agent Smith approval required');
    });

    it('should allow scenarios with Smith approval', async () => {
      twins.enable();
      twins.grantSmithApproval();
      const scenario = createTestScenario();
      const result = await twins.runScenario(scenario);
      expect(result.status).toBeDefined();
    });

    it('should allow scenarios with inline approval', async () => {
      twins.enable();
      const scenario = createTestScenario();
      const result = await twins.runScenario(scenario, true);
      expect(result.status).toBeDefined();
    });
  });

  describe('Scenario Execution', () => {
    beforeEach(() => {
      twins.enable();
      twins.grantSmithApproval();
    });

    it('should execute a simple wait scenario', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'wait-1', name: 'Wait', type: 'wait', spec: { durationMs: 50 } },
        ],
      });

      const result = await twins.runScenario(scenario);

      expect(result.status).toBe('passed');
      expect(result.stepResults.length).toBe(1);
      expect(result.stepResults[0]!.status).toBe('passed');
    });

    it('should execute multiple steps in order', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'step-1', name: 'Wait 1', type: 'wait', spec: { durationMs: 50 } },
          { id: 'step-2', name: 'Wait 2', type: 'wait', spec: { durationMs: 50 } },
          { id: 'step-3', name: 'Wait 3', type: 'wait', spec: { durationMs: 50 } },
        ],
      });

      const result = await twins.runScenario(scenario);

      expect(result.stepResults.length).toBe(3);
      expect(result.stepResults.every(s => s.status === 'passed')).toBe(true);
    });

    it('should respect step dependencies', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'step-1', name: 'First', type: 'wait', spec: { durationMs: 50 } },
          { id: 'step-2', name: 'Second', type: 'wait', spec: { durationMs: 50 }, dependsOn: ['step-1'] },
        ],
      });

      const result = await twins.runScenario(scenario);

      expect(result.stepResults.length).toBe(2);
      expect(result.stepResults[0]!.stepId).toBe('step-1');
      expect(result.stepResults[1]!.stepId).toBe('step-2');
    });

    it('should skip steps with unmet dependencies', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'step-2', name: 'Second', type: 'wait', spec: { durationMs: 50 }, dependsOn: ['step-1'] },
        ],
      });

      const result = await twins.runScenario(scenario);

      expect(result.stepResults[0]!.status).toBe('skipped');
    });

    it('should execute checkpoint steps', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'checkpoint', name: 'Validate', type: 'checkpoint', spec: { validation: 'system healthy' } },
        ],
      });

      const result = await twins.runScenario(scenario);

      expect(result.stepResults[0]!.status).toBe('passed');
    });
  });

  describe('Criteria Evaluation', () => {
    beforeEach(() => {
      twins.enable();
      twins.grantSmithApproval();
    });

    it('should evaluate success criteria', async () => {
      const scenario = createTestScenario({
        successCriteria: {
          maxErrorRate: 10,
          maxLatencyMs: 500,
          minAvailability: 90,
          securityChecks: ['auth_check'],
        },
      });

      const result = await twins.runScenario(scenario);

      expect(result.criteriaEvaluation.length).toBeGreaterThan(0);
      expect(result.criteriaEvaluation.every(c => c.criterion !== undefined)).toBe(true);
    });

    it('should calculate resilience metrics', async () => {
      const scenario = createTestScenario();
      const result = await twins.runScenario(scenario);

      expect(result.resilienceMetrics).toBeDefined();
      expect(result.resilienceMetrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.resilienceMetrics.measurementPeriod).toBeDefined();
    });
  });

  describe('Status and Monitoring', () => {
    beforeEach(() => {
      twins.enable();
      twins.grantSmithApproval();
    });

    it('should provide current status', () => {
      const status = twins.getStatus();

      expect(status.chaosActive).toBe(false);
      expect(status.ghostStatus).toBeDefined();
      expect(status.phantomStatus).toBeDefined();
      expect(status.health).toBeDefined();
    });

    it('should show active scenario during execution', async () => {
      const scenario = createTestScenario({
        steps: [
          { id: 'wait', name: 'Long Wait', type: 'wait', spec: { durationMs: 100 } },
        ],
      });

      const promise = twins.runScenario(scenario);

      // Check status while running (may be quick)
      await new Promise(resolve => setTimeout(resolve, 10));

      await promise;
    });

    it('should track scenario history', async () => {
      const scenario = createTestScenario();
      await twins.runScenario(scenario);

      const history = twins.getScenarioHistory();
      expect(history.length).toBe(1);
    });
  });

  describe('Emergency Stop', () => {
    beforeEach(() => {
      twins.enable();
      twins.grantSmithApproval();
    });

    it('should stop all chaos operations on emergency', async () => {
      await twins.emergencyStop();

      const status = twins.getStatus();
      expect(status.ghostStatus.enabled).toBe(false);
      expect(status.phantomStatus.enabled).toBe(false);
    });

    it('should track emergency stop in statistics', async () => {
      await twins.emergencyStop();

      const stats = twins.getStats();
      expect(stats.emergencyStopsTriggered).toBe(1);
    });
  });

  describe('Time Window Restrictions', () => {
    it('should check time window restrictions', () => {
      const twinsWithWindows = createTwins({
        blockedTimeWindows: [
          { start: '00:00', end: '06:00' }, // Block midnight to 6am
        ],
      });

      // The method exists and can be called
      const result = twinsWithWindows.isWithinAllowedTimeWindow();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      twins.enable();
      twins.grantSmithApproval();
    });

    it('should track scenario statistics', async () => {
      const scenario = createTestScenario();
      await twins.runScenario(scenario);

      const stats = twins.getStats();
      expect(stats.scenariosRun).toBe(1);
      expect(stats.scenariosPassed).toBe(1);
    });

    it('should get resilience score', async () => {
      const scenario = createTestScenario();
      await twins.runScenario(scenario);

      const metrics = twins.getResilienceScore();
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============ Integration Tests ============

describe('Chaos Engineering Integration', () => {
  it('should coordinate Ghost and Phantom through Twins', async () => {
    const twins = createTwins();
    twins.enable();
    twins.grantSmithApproval();

    const scenario: ChaosScenario = {
      id: 'integration-test',
      name: 'Integration Test Scenario',
      description: 'Tests Ghost and Phantom coordination',
      type: 'combined',
      targetSystem: 'test-system',
      steps: [
        {
          id: 'wait-1',
          name: 'Initial Wait',
          type: 'wait',
          spec: { durationMs: 50 },
        },
        {
          id: 'checkpoint-1',
          name: 'System Check',
          type: 'checkpoint',
          spec: { validation: 'system ready' },
        },
      ],
      successCriteria: {
        maxErrorRate: 20,
        maxLatencyMs: 2000,
        minAvailability: 80,
        securityChecks: [],
      },
      rollbackPlan: {
        automatic: true,
        steps: ['Cleanup'],
      },
    };

    const result = await twins.runScenario(scenario);

    expect(result.status).toBe('passed');
    expect(result.stepResults.length).toBe(2);
    expect(result.resilienceMetrics.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.observations.length).toBeGreaterThan(0);

    await twins.disable();
  });

  it('should generate comprehensive status report', async () => {
    const twins = createTwins();
    twins.enable();
    twins.grantSmithApproval();

    // Run a scenario
    const scenario = createTestScenario();
    await twins.runScenario(scenario);

    // Get comprehensive status
    const status = twins.getStatus();
    const stats = twins.getStats();
    const metrics = twins.getResilienceScore();

    expect(status.lastScenarioResult).toBeDefined();
    expect(stats.scenariosRun).toBe(1);
    expect(metrics.measurementPeriod).toBeDefined();

    await twins.disable();
  });
});
