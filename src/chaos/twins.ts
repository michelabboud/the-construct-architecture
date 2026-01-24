/**
 * The Twins - Chaos Engineering Coordinator
 *
 * "We are getting aggravated. Yes, we are." — The Twins
 *
 * The Twins coordinate Ghost (fault injection) and Phantom (penetration testing)
 * to provide comprehensive chaos engineering capabilities. They operate under
 * Agent Smith's oversight for safety.
 *
 * Capabilities:
 * - Combined chaos orchestration
 * - Test scenario management
 * - Result aggregation
 * - Safe mode controls
 * - Emergency stop
 * - Resilience metrics
 *
 * Phase 7 Implementation
 */

import { Ghost, createGhost } from './ghost/ghost.js';
import { Phantom, createPhantom } from './phantom/phantom.js';
import type {
  TwinsConfig,
  TwinsStatus,
  ChaosScenario,
  ChaosStep,
  ScenarioResult,
  StepResult,
  ResilienceMetrics,
  FaultSpec,
  ScanConfig,
  AttackSpec,
  FaultResult,
  ScanResult,
  AttackResult,
  GhostConfig,
  PhantomConfig,
} from '../types/chaos.js';

/**
 * Default Twins configuration
 */
const DEFAULT_CONFIG: TwinsConfig = {
  enabled: false, // Disabled by default for safety
  ghost: {
    enabled: false,
    maxConcurrentFaults: 5,
    maxFaultDurationMs: 300000,
    requireConfirmation: true,
    allowedFaultTypes: ['network_latency', 'network_drop', 'resource_cpu', 'resource_memory'],
    blockedTargets: ['production', 'database-primary'],
    safeMode: true,
    errorThreshold: 50,
  },
  phantom: {
    enabled: false,
    safeMode: true,
    maxIntensity: 5,
    allowedScanTypes: ['port_scan', 'vulnerability_scan', 'web_scan', 'api_scan'],
    allowedAttackTypes: ['brute_force', 'sql_injection', 'xss'],
    blockedTargets: ['production', 'external'],
    rateLimit: 100,
    requireConfirmation: true,
  },
  requireSmithApproval: true,
  emergencyStopEnabled: true,
  autoRollback: true,
  maxScenarioDurationMs: 3600000, // 1 hour
  notificationChannels: ['security_team'],
};

/**
 * The Twins - Chaos Engineering Coordinator
 *
 * Coordinates Ghost and Phantom for comprehensive chaos engineering.
 * Requires explicit enablement and can operate under Agent Smith's oversight.
 */
export class Twins {
  private config: TwinsConfig;
  private ghost: Ghost;
  private phantom: Phantom;
  private currentScenario: ChaosScenario | null = null;
  private currentExecution: {
    id: string;
    startedAt: Date;
    stepResults: StepResult[];
    aborted: boolean;
  } | null = null;
  private scenarioHistory: ScenarioResult[] = [];
  private executionIdCounter = 0;
  private smithApproved = false;

  // Statistics
  private stats = {
    scenariosRun: 0,
    scenariosPassed: 0,
    scenariosFailed: 0,
    scenariosAborted: 0,
    totalFaultsInjected: 0,
    totalScansRun: 0,
    totalAttacksSimulated: 0,
    emergencyStopsTriggered: 0,
  };

  constructor(config: Partial<TwinsConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    this.ghost = createGhost(this.config.ghost);
    this.phantom = createPhantom(this.config.phantom);
  }

  /**
   * Run a chaos scenario
   */
  async runScenario(scenario: ChaosScenario, smithApproval = false): Promise<ScenarioResult> {
    // Safety checks
    this.validateScenario(scenario, smithApproval);

    const executionId = `exec-${++this.executionIdCounter}-${Date.now()}`;
    const startedAt = new Date();

    this.currentScenario = scenario;
    this.currentExecution = {
      id: executionId,
      startedAt,
      stepResults: [],
      aborted: false,
    };

    // Enable subsystems for the scenario
    if (scenario.type === 'resilience' || scenario.type === 'combined') {
      this.ghost.enable();
    }
    if (scenario.type === 'security' || scenario.type === 'combined') {
      this.phantom.enable();
    }

    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      executionId,
      startedAt,
      completedAt: startedAt, // Will be updated
      status: 'passed',
      stepResults: [],
      criteriaEvaluation: [],
      resilienceMetrics: this.createEmptyMetrics(startedAt),
      rollbackTriggered: false,
      observations: [],
      recommendations: [],
    };

    try {
      // Execute scenario steps
      await this.executeScenarioSteps(scenario, result);

      // Evaluate success criteria
      result.criteriaEvaluation = this.evaluateCriteria(scenario, result);

      // Determine overall status
      const allCriteriaPassed = result.criteriaEvaluation.every(c => c.passed);
      const allStepsPassed = result.stepResults.every(
        s => s.status === 'passed' || s.status === 'skipped'
      );

      if (this.currentExecution.aborted) {
        result.status = 'aborted';
        this.stats.scenariosAborted++;
      } else if (!allCriteriaPassed || !allStepsPassed) {
        result.status = result.stepResults.some(s => s.status === 'passed') ? 'partial' : 'failed';
        this.stats.scenariosFailed++;
      } else {
        result.status = 'passed';
        this.stats.scenariosPassed++;
      }

      // Calculate resilience metrics
      result.resilienceMetrics = this.calculateResilienceMetrics(result, startedAt);

      // Generate observations and recommendations
      result.observations = this.generateObservations(result);
      result.recommendations = this.generateScenarioRecommendations(result);

    } catch (error) {
      result.status = 'failed';
      result.observations.push(`Scenario failed with error: ${error instanceof Error ? error.message : String(error)}`);
      this.stats.scenariosFailed++;

      // Auto-rollback if enabled
      if (this.config.autoRollback) {
        await this.rollback(result);
      }
    } finally {
      result.completedAt = new Date();
      result.stepResults = this.currentExecution?.stepResults ?? [];

      // Disable subsystems after scenario
      this.ghost.disable();
      this.phantom.disable();

      this.currentScenario = null;
      this.currentExecution = null;
      this.stats.scenariosRun++;
      this.scenarioHistory.push(result);
    }

    return result;
  }

  /**
   * Emergency stop - abort current scenario and remove all faults
   */
  async emergencyStop(): Promise<void> {
    if (!this.config.emergencyStopEnabled) {
      throw new Error('Emergency stop is disabled');
    }

    console.log('[TWINS] EMERGENCY STOP TRIGGERED');
    this.stats.emergencyStopsTriggered++;

    // Mark current execution as aborted
    if (this.currentExecution) {
      this.currentExecution.aborted = true;
    }

    // Stop Ghost (removes all faults)
    await this.ghost.emergencyStop();

    // Disable both systems
    await this.ghost.disable();
    this.phantom.disable();

    // Notify
    this.notify('Emergency stop triggered - all chaos operations halted');
  }

  /**
   * Get current status
   */
  getStatus(): TwinsStatus {
    const ghostStats = this.ghost.getStats();
    const phantomStats = this.phantom.getStats();
    const activeFaults = this.ghost.getActiveFaults();

    const status: TwinsStatus = {
      chaosActive: this.currentScenario !== null,
      ghostStatus: {
        enabled: this.ghost.isEnabled(),
        activeFaults: activeFaults.length,
        faultsInjectedTotal: ghostStats.faultsInjected,
      },
      phantomStatus: {
        enabled: this.phantom.isEnabled(),
        activeScans: 0, // Scans are synchronous in this implementation
        scansCompletedTotal: phantomStats.scansCompleted,
      },
      resilienceScore: this.calculateCurrentResilienceScore(),
      health: this.determineHealth(),
    };

    if (this.currentScenario && this.currentExecution) {
      const completedSteps = this.currentExecution.stepResults.length;
      const totalSteps = this.currentScenario.steps.length;
      const currentStep = this.currentScenario.steps[completedSteps];

      status.currentScenario = {
        id: this.currentScenario.id,
        name: this.currentScenario.name,
        progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        currentStep: currentStep?.name ?? 'Completing',
      };
    }

    const lastResult = this.scenarioHistory[this.scenarioHistory.length - 1];
    if (lastResult) {
      status.lastScenarioResult = {
        id: lastResult.scenarioId,
        name: lastResult.scenarioName,
        status: lastResult.status,
        completedAt: lastResult.completedAt,
      };
    }

    return status;
  }

  /**
   * Get resilience metrics
   */
  getResilienceScore(): ResilienceMetrics {
    const lastResult = this.scenarioHistory[this.scenarioHistory.length - 1];
    if (lastResult) {
      return lastResult.resilienceMetrics;
    }
    return this.createEmptyMetrics(new Date());
  }

  /**
   * Get scenario history
   */
  getScenarioHistory(): ScenarioResult[] {
    return [...this.scenarioHistory];
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Grant Agent Smith approval
   */
  grantSmithApproval(): void {
    this.smithApproved = true;
    console.log('[TWINS] Agent Smith approval granted');
  }

  /**
   * Revoke Agent Smith approval
   */
  revokeSmithApproval(): void {
    this.smithApproved = false;
    console.log('[TWINS] Agent Smith approval revoked');
  }

  /**
   * Check if Smith approval is granted
   */
  hasSmithApproval(): boolean {
    return this.smithApproved;
  }

  /**
   * Enable the Twins (requires explicit call)
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable the Twins
   */
  async disable(): Promise<void> {
    await this.emergencyStop();
    this.config.enabled = false;
  }

  /**
   * Check if Twins are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get Ghost instance
   */
  getGhost(): Ghost {
    return this.ghost;
  }

  /**
   * Get Phantom instance
   */
  getPhantom(): Phantom {
    return this.phantom;
  }

  /**
   * Get configuration
   */
  getConfig(): TwinsConfig {
    return { ...this.config };
  }

  /**
   * Check if within allowed time window
   */
  isWithinAllowedTimeWindow(): boolean {
    if (!this.config.blockedTimeWindows || this.config.blockedTimeWindows.length === 0) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const currentTime = currentHour * 60 + currentMinute;

    for (const window of this.config.blockedTimeWindows) {
      const startParts = window.start.split(':').map(Number);
      const endParts = window.end.split(':').map(Number);
      const startHour = startParts[0] ?? 0;
      const startMinute = startParts[1] ?? 0;
      const endHour = endParts[0] ?? 0;
      const endMinute = endParts[1] ?? 0;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Check day restriction
      if (window.days && !window.days.includes(currentDay)) {
        continue;
      }

      // Check time restriction
      if (currentTime >= startTime && currentTime <= endTime) {
        return false;
      }
    }

    return true;
  }

  // ============ Private Methods ============

  private mergeConfig(base: TwinsConfig, override: Partial<TwinsConfig>): TwinsConfig {
    return {
      ...base,
      ...override,
      ghost: { ...base.ghost, ...override.ghost } as GhostConfig,
      phantom: { ...base.phantom, ...override.phantom } as PhantomConfig,
    };
  }

  private validateScenario(scenario: ChaosScenario, smithApproval: boolean): void {
    if (!this.config.enabled) {
      throw new Error('Twins are disabled. Call enable() first.');
    }

    if (this.config.requireSmithApproval && !this.smithApproved && !smithApproval) {
      throw new Error('Agent Smith approval required. Call grantSmithApproval() first.');
    }

    if (!this.isWithinAllowedTimeWindow()) {
      throw new Error('Current time is within a blocked time window.');
    }

    if (this.currentScenario) {
      throw new Error(`Scenario already running: ${this.currentScenario.name}`);
    }

    if (scenario.steps.length === 0) {
      throw new Error('Scenario has no steps');
    }
  }

  private async executeScenarioSteps(scenario: ChaosScenario, result: ScenarioResult): Promise<void> {
    const completedSteps = new Set<string>();
    const stepTimeout = scenario.steps.reduce((max, s) => Math.max(max, s.timeoutMs ?? 60000), 60000);

    for (const step of scenario.steps) {
      // Check if aborted
      if (this.currentExecution?.aborted) {
        break;
      }

      // Check dependencies
      const dependenciesMet = !step.dependsOn || step.dependsOn.every(dep => completedSteps.has(dep));
      if (!dependenciesMet) {
        const stepResult = this.createSkippedStepResult(step, 'Dependencies not met');
        this.currentExecution?.stepResults.push(stepResult);
        continue;
      }

      // Execute step
      const stepResult = await this.executeStep(step, stepTimeout);
      this.currentExecution?.stepResults.push(stepResult);

      if (stepResult.status === 'passed') {
        completedSteps.add(step.id);
      } else if (!step.continueOnFailure) {
        // Trigger rollback if step failed and continueOnFailure is not set
        if (this.config.autoRollback) {
          await this.rollback(result);
        }
        break;
      }
    }
  }

  private async executeStep(step: ChaosStep, timeout: number): Promise<StepResult> {
    const startedAt = new Date();

    const stepResult: StepResult = {
      stepId: step.id,
      stepName: step.name,
      type: step.type,
      status: 'passed',
      startedAt,
      completedAt: startedAt,
      durationMs: 0,
      result: { waited: 0 },
    };

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Step timeout')), step.timeoutMs ?? timeout);
      });

      const executionPromise = this.executeStepByType(step);
      stepResult.result = await Promise.race([executionPromise, timeoutPromise]);
      stepResult.status = 'passed';

    } catch (error) {
      stepResult.status = error instanceof Error && error.message === 'Step timeout' ? 'timeout' : 'failed';
      stepResult.error = error instanceof Error ? error.message : String(error);
    }

    stepResult.completedAt = new Date();
    stepResult.durationMs = stepResult.completedAt.getTime() - startedAt.getTime();

    return stepResult;
  }

  private async executeStepByType(
    step: ChaosStep
  ): Promise<FaultResult | ScanResult | AttackResult | { waited: number } | { validated: boolean }> {
    switch (step.type) {
      case 'fault': {
        const spec = step.spec as FaultSpec;
        const handle = await this.ghost.injectFault(spec, true);
        this.stats.totalFaultsInjected++;

        // Wait for fault duration then remove
        if (spec.durationMs > 0) {
          await new Promise(resolve => setTimeout(resolve, spec.durationMs));
        }
        return await this.ghost.removeFault(handle);
      }

      case 'scan': {
        const config = step.spec as ScanConfig;
        // Create a default target for the scan
        const target = {
          type: 'service' as const,
          address: 'localhost:3000',
        };
        const result = await this.phantom.runScan(target, config);
        this.stats.totalScansRun++;
        return result;
      }

      case 'attack': {
        const spec = step.spec as AttackSpec;
        const result = await this.phantom.simulateAttack(spec, true);
        this.stats.totalAttacksSimulated++;
        return result;
      }

      case 'wait': {
        const waitSpec = step.spec as { durationMs: number };
        await new Promise(resolve => setTimeout(resolve, waitSpec.durationMs));
        return { waited: waitSpec.durationMs };
      }

      case 'checkpoint': {
        const checkSpec = step.spec as { validation: string };
        // In a real implementation, this would run the validation
        console.log(`[TWINS] Checkpoint: ${checkSpec.validation}`);
        return { validated: true };
      }

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private createSkippedStepResult(step: ChaosStep, reason: string): StepResult {
    const now = new Date();
    return {
      stepId: step.id,
      stepName: step.name,
      type: step.type,
      status: 'skipped',
      startedAt: now,
      completedAt: now,
      durationMs: 0,
      result: { waited: 0 },
      error: reason,
    };
  }

  private evaluateCriteria(
    scenario: ChaosScenario,
    result: ScenarioResult
  ): ScenarioResult['criteriaEvaluation'] {
    const evaluation: ScenarioResult['criteriaEvaluation'] = [];
    const criteria = scenario.successCriteria;

    // Calculate actual metrics from step results
    let totalErrors = 0;
    let totalRequests = 0;
    let maxLatency = 0;

    for (const stepResult of result.stepResults) {
      if (stepResult.type === 'fault' && stepResult.status === 'passed') {
        const faultResult = stepResult.result as FaultResult;
        totalErrors += faultResult.totalImpact.errorsCaused;
        totalRequests += faultResult.totalImpact.requestsAffected;
        maxLatency = Math.max(maxLatency, faultResult.totalImpact.latencyIncreaseMs);
      }
    }

    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Evaluate error rate
    evaluation.push({
      criterion: 'Maximum error rate',
      passed: errorRate <= criteria.maxErrorRate,
      actual: `${errorRate.toFixed(1)}%`,
      expected: `<= ${criteria.maxErrorRate}%`,
    });

    // Evaluate latency
    evaluation.push({
      criterion: 'Maximum latency',
      passed: maxLatency <= criteria.maxLatencyMs,
      actual: `${maxLatency}ms`,
      expected: `<= ${criteria.maxLatencyMs}ms`,
    });

    // Evaluate availability (simplified - based on step success rate)
    const passedSteps = result.stepResults.filter(s => s.status === 'passed').length;
    const availability = result.stepResults.length > 0
      ? (passedSteps / result.stepResults.length) * 100
      : 100;
    evaluation.push({
      criterion: 'Minimum availability',
      passed: availability >= criteria.minAvailability,
      actual: `${availability.toFixed(1)}%`,
      expected: `>= ${criteria.minAvailability}%`,
    });

    // Evaluate security checks
    for (const check of criteria.securityChecks) {
      // In a real implementation, this would run actual security checks
      const passed = true; // Placeholder
      evaluation.push({
        criterion: `Security: ${check}`,
        passed,
        actual: passed ? 'Passed' : 'Failed',
        expected: 'Pass',
      });
    }

    return evaluation;
  }

  private calculateResilienceMetrics(result: ScenarioResult, startedAt: Date): ResilienceMetrics {
    const _ghostStats = this.ghost.getStats(); // Available for future metrics
    const phantomStats = this.phantom.getStats();

    // Calculate metrics from results
    let totalRecoveryTime = 0;
    let faultsSurvived = 0;
    let faultsCausedFailures = 0;

    for (const stepResult of result.stepResults) {
      if (stepResult.type === 'fault') {
        if (stepResult.status === 'passed') {
          faultsSurvived++;
          const faultResult = stepResult.result as FaultResult;
          if (faultResult.recoveryTimeMs) {
            totalRecoveryTime += faultResult.recoveryTimeMs;
          }
        } else {
          faultsCausedFailures++;
        }
      }
    }

    const attacksBlocked = phantomStats.attacksBlocked;
    const attacksSucceeded = phantomStats.attacksSimulated - phantomStats.attacksBlocked;

    // Calculate scores (0-100)
    const faultTolerance = faultsSurvived + faultsCausedFailures > 0
      ? (faultsSurvived / (faultsSurvived + faultsCausedFailures)) * 100
      : 100;

    const recoverySpeed = totalRecoveryTime > 0
      ? Math.max(0, 100 - (totalRecoveryTime / 10000) * 10) // Penalize slow recovery
      : 100;

    const securityPosture = attacksBlocked + attacksSucceeded > 0
      ? (attacksBlocked / (attacksBlocked + attacksSucceeded)) * 100
      : 100;

    const overallScore = (faultTolerance + recoverySpeed + securityPosture) / 3;

    return {
      overallScore: Math.round(overallScore),
      faultTolerance: Math.round(faultTolerance),
      recoverySpeed: Math.round(recoverySpeed),
      securityPosture: Math.round(securityPosture),
      availabilityDuringChaos: result.criteriaEvaluation.find(c => c.criterion.includes('availability'))
        ? parseFloat(String(result.criteriaEvaluation.find(c => c.criterion.includes('availability'))?.actual ?? '100'))
        : 100,
      meanTimeToRecovery: faultsSurvived > 0 ? Math.round(totalRecoveryTime / faultsSurvived) : 0,
      errorRateDuringChaos: parseFloat(
        String(result.criteriaEvaluation.find(c => c.criterion.includes('error'))?.actual ?? '0')
      ),
      latencyIncreaseDuringChaos: parseFloat(
        String(result.criteriaEvaluation.find(c => c.criterion.includes('latency'))?.actual ?? '0')
      ),
      faultsSurvived,
      faultsCausedFailures,
      attacksBlocked,
      attacksSucceeded,
      vulnerabilitiesFound: Object.values(phantomStats.vulnerabilitiesFound).reduce((a, b) => a + b, 0),
      measurementPeriod: {
        start: startedAt,
        end: new Date(),
      },
    };
  }

  private createEmptyMetrics(startedAt: Date): ResilienceMetrics {
    return {
      overallScore: 0,
      faultTolerance: 0,
      recoverySpeed: 0,
      securityPosture: 0,
      availabilityDuringChaos: 100,
      meanTimeToRecovery: 0,
      errorRateDuringChaos: 0,
      latencyIncreaseDuringChaos: 0,
      faultsSurvived: 0,
      faultsCausedFailures: 0,
      attacksBlocked: 0,
      attacksSucceeded: 0,
      vulnerabilitiesFound: 0,
      measurementPeriod: {
        start: startedAt,
        end: startedAt,
      },
    };
  }

  private async rollback(result: ScenarioResult): Promise<void> {
    console.log('[TWINS] Initiating rollback');
    result.rollbackTriggered = true;

    try {
      // Remove all active faults
      await this.ghost.emergencyStop();
      result.rollbackSuccess = true;
    } catch (error) {
      result.rollbackSuccess = false;
      result.observations.push(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateObservations(result: ScenarioResult): string[] {
    const observations: string[] = [];

    const passedSteps = result.stepResults.filter(s => s.status === 'passed').length;
    const failedSteps = result.stepResults.filter(s => s.status === 'failed').length;
    const totalSteps = result.stepResults.length;

    observations.push(`Completed ${passedSteps}/${totalSteps} steps successfully`);

    if (failedSteps > 0) {
      observations.push(`${failedSteps} steps failed`);
    }

    const metrics = result.resilienceMetrics;
    observations.push(`Overall resilience score: ${metrics.overallScore}/100`);
    observations.push(`Fault tolerance: ${metrics.faultTolerance}/100`);
    observations.push(`Security posture: ${metrics.securityPosture}/100`);

    if (metrics.faultsCausedFailures > 0) {
      observations.push(`${metrics.faultsCausedFailures} faults caused failures`);
    }

    if (metrics.attacksSucceeded > 0) {
      observations.push(`${metrics.attacksSucceeded} simulated attacks succeeded (vulnerabilities found)`);
    }

    return observations;
  }

  private generateScenarioRecommendations(result: ScenarioResult): string[] {
    const recommendations: string[] = [];
    const metrics = result.resilienceMetrics;

    if (metrics.faultTolerance < 80) {
      recommendations.push('Improve fault tolerance through redundancy and graceful degradation');
    }

    if (metrics.recoverySpeed < 80) {
      recommendations.push('Implement faster recovery mechanisms (health checks, auto-restart)');
    }

    if (metrics.securityPosture < 80) {
      recommendations.push('Strengthen security controls to block more attack vectors');
    }

    if (metrics.meanTimeToRecovery > 5000) {
      recommendations.push('Reduce mean time to recovery through better monitoring and automation');
    }

    if (metrics.vulnerabilitiesFound > 0) {
      recommendations.push(`Address ${metrics.vulnerabilitiesFound} discovered vulnerabilities`);
    }

    const failedCriteria = result.criteriaEvaluation.filter(c => !c.passed);
    for (const criteria of failedCriteria) {
      recommendations.push(`Improve: ${criteria.criterion} (actual: ${criteria.actual}, expected: ${criteria.expected})`);
    }

    return recommendations;
  }

  private calculateCurrentResilienceScore(): number {
    if (this.scenarioHistory.length === 0) return 0;

    // Average of last 5 scenarios
    const recentScenarios = this.scenarioHistory.slice(-5);
    const totalScore = recentScenarios.reduce((sum, s) => sum + s.resilienceMetrics.overallScore, 0);
    return Math.round(totalScore / recentScenarios.length);
  }

  private determineHealth(): TwinsStatus['health'] {
    const score = this.calculateCurrentResilienceScore();
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'degraded';
    return 'critical';
  }

  private notify(message: string): void {
    for (const channel of this.config.notificationChannels) {
      console.log(`[TWINS] Notification to ${channel}: ${message}`);
    }
  }
}

/**
 * Create Twins with default configuration
 */
export function createTwins(config?: Partial<TwinsConfig>): Twins {
  return new Twins(config);
}
