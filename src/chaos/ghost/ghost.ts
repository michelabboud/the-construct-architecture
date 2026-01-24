/**
 * Ghost - Fault Injection System
 *
 * "We are getting aggravated. Yes, we are." — The Twins
 *
 * Ghost is one of The Twins, responsible for fault injection and
 * chaos engineering. It can simulate various failure modes to test
 * system resilience.
 *
 * Fault Types:
 * - Network: latency, packet drops, partitions, corruption
 * - Resource: CPU, memory, disk, IO exhaustion
 * - Process: kills, hangs, crashes
 * - State: corruption, inconsistency
 * - Time: clock skew
 *
 * Phase 7 Implementation
 */

import type {
  FaultType,
  FaultSpec,
  FaultHandle,
  FaultStatus,
  FaultResult,
  FaultImpact,
  GhostConfig,
  NetworkFaultParams,
  ResourceFaultParams,
  ProcessFaultParams,
  StateFaultParams,
  ClockFaultParams,
  ChaosStatus,
  ChaosSeverity,
} from '../../types/chaos.js';

/**
 * Default Ghost configuration
 */
const DEFAULT_CONFIG: GhostConfig = {
  enabled: false, // Disabled by default for safety
  maxConcurrentFaults: 5,
  maxFaultDurationMs: 300000, // 5 minutes
  requireConfirmation: true,
  allowedFaultTypes: [
    'network_latency',
    'network_drop',
    'resource_cpu',
    'resource_memory',
    'process_hang',
  ],
  blockedTargets: ['production', 'database-primary', 'auth-service'],
  safeMode: true,
  errorThreshold: 50, // 50% error rate triggers rollback
};

/**
 * Ghost - Fault Injection System
 *
 * Injects controlled faults into the system to test resilience.
 * Operates under strict safety controls and requires explicit enablement.
 */
export class Ghost {
  private config: GhostConfig;
  private activeFaults: Map<string, FaultHandle> = new Map();
  private faultHistory: FaultResult[] = [];
  private faultIdCounter = 0;
  private impactTrackers: Map<string, FaultImpact> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // Statistics
  private stats = {
    faultsInjected: 0,
    faultsRemoved: 0,
    faultsExpired: 0,
    faultsFailed: 0,
    totalImpact: {
      requestsAffected: 0,
      errorsCaused: 0,
      latencyAddedMs: 0,
    },
    safetyTriggered: 0,
  };

  constructor(config: Partial<GhostConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Inject a fault into the system
   */
  async injectFault(spec: FaultSpec, confirmed = false): Promise<FaultHandle> {
    // Safety checks
    this.validateFaultInjection(spec, confirmed);

    const id = `fault-${++this.faultIdCounter}-${Date.now()}`;
    const now = new Date();

    const handle: FaultHandle = {
      id,
      spec,
      injectedAt: now,
      status: 'pending',
    };

    // Set expiration if duration specified
    if (spec.durationMs > 0) {
      handle.expiresAt = new Date(now.getTime() + spec.durationMs);
    }

    // Initialize impact tracker
    this.impactTrackers.set(id, {
      requestsAffected: 0,
      errorsCaused: 0,
      latencyIncreaseMs: 0,
      servicesAffected: [],
      activeDurationMs: 0,
    });

    // Execute the fault injection
    try {
      await this.executeFaultInjection(handle);
      handle.status = 'active';
      this.activeFaults.set(id, handle);
      this.stats.faultsInjected++;

      // Set up expiration timer if needed
      if (spec.durationMs > 0) {
        const timer = setTimeout(() => {
          this.expireFault(id);
        }, spec.durationMs);
        this.timers.set(id, timer);
      }

      // Set up safety monitoring
      if (this.config.safeMode) {
        this.monitorFaultSafety(id);
      }
    } catch (error) {
      handle.status = 'failed';
      this.stats.faultsFailed++;
      throw error;
    }

    return handle;
  }

  /**
   * Remove an active fault
   */
  async removeFault(handleOrId: FaultHandle | string): Promise<FaultResult> {
    const id = typeof handleOrId === 'string' ? handleOrId : handleOrId.id;
    const handle = this.activeFaults.get(id);

    if (!handle) {
      throw new Error(`Fault not found: ${id}`);
    }

    // Clear expiration timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    // Execute fault removal
    const removedAt = new Date();
    try {
      await this.executeFaultRemoval(handle);
      handle.status = 'completed';
    } catch (error) {
      handle.status = 'failed';
      throw error;
    }

    // Get final impact
    const impact = this.impactTrackers.get(id) ?? this.createEmptyImpact();
    impact.activeDurationMs = removedAt.getTime() - handle.injectedAt.getTime();

    // Create result
    const result: FaultResult = {
      handle,
      success: true,
      totalImpact: impact,
      observations: this.collectObservations(handle, impact),
      errors: [],
    };

    // Clean up
    this.activeFaults.delete(id);
    this.impactTrackers.delete(id);
    this.faultHistory.push(result);
    this.stats.faultsRemoved++;

    // Update total stats
    this.stats.totalImpact.requestsAffected += impact.requestsAffected;
    this.stats.totalImpact.errorsCaused += impact.errorsCaused;
    this.stats.totalImpact.latencyAddedMs += impact.latencyIncreaseMs;

    return result;
  }

  /**
   * Get all active faults
   */
  getActiveFaults(): FaultStatus[] {
    const now = Date.now();
    const statuses: FaultStatus[] = [];

    for (const [id, handle] of this.activeFaults) {
      const impact = this.impactTrackers.get(id) ?? this.createEmptyImpact();
      impact.activeDurationMs = now - handle.injectedAt.getTime();

      const status: FaultStatus = {
        handle,
        impact,
      };

      if (handle.expiresAt) {
        status.remainingMs = Math.max(0, handle.expiresAt.getTime() - now);
      }

      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Get a specific fault status
   */
  getFaultStatus(id: string): FaultStatus | undefined {
    const handle = this.activeFaults.get(id);
    if (!handle) return undefined;

    const impact = this.impactTrackers.get(id) ?? this.createEmptyImpact();
    impact.activeDurationMs = Date.now() - handle.injectedAt.getTime();

    const status: FaultStatus = { handle, impact };
    if (handle.expiresAt) {
      status.remainingMs = Math.max(0, handle.expiresAt.getTime() - Date.now());
    }

    return status;
  }

  /**
   * Emergency stop - remove all active faults
   */
  async emergencyStop(): Promise<FaultResult[]> {
    const results: FaultResult[] = [];

    for (const id of this.activeFaults.keys()) {
      try {
        const result = await this.removeFault(id);
        results.push(result);
      } catch (error) {
        // Log but continue removing other faults
        console.error(`Failed to remove fault ${id}:`, error);
      }
    }

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    return results;
  }

  /**
   * Record impact from a fault
   */
  recordImpact(
    faultId: string,
    impact: Partial<FaultImpact>
  ): void {
    const tracker = this.impactTrackers.get(faultId);
    if (!tracker) return;

    if (impact.requestsAffected) {
      tracker.requestsAffected += impact.requestsAffected;
    }
    if (impact.errorsCaused) {
      tracker.errorsCaused += impact.errorsCaused;
    }
    if (impact.latencyIncreaseMs) {
      tracker.latencyIncreaseMs = Math.max(tracker.latencyIncreaseMs, impact.latencyIncreaseMs);
    }
    if (impact.servicesAffected) {
      for (const service of impact.servicesAffected) {
        if (!tracker.servicesAffected.includes(service)) {
          tracker.servicesAffected.push(service);
        }
      }
    }
  }

  /**
   * Get fault history
   */
  getFaultHistory(): FaultResult[] {
    return [...this.faultHistory];
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Check if a fault type is allowed
   */
  isFaultTypeAllowed(type: FaultType): boolean {
    return this.config.allowedFaultTypes.includes(type);
  }

  /**
   * Check if a target is blocked
   */
  isTargetBlocked(targetId: string): boolean {
    return this.config.blockedTargets.some(
      blocked => targetId.includes(blocked) || blocked.includes(targetId)
    );
  }

  /**
   * Enable Ghost (requires explicit call)
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable Ghost and remove all faults
   */
  async disable(): Promise<void> {
    await this.emergencyStop();
    this.config.enabled = false;
  }

  /**
   * Check if Ghost is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get configuration
   */
  getConfig(): GhostConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GhostConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============ Private Methods ============

  private validateFaultInjection(spec: FaultSpec, confirmed: boolean): void {
    // Check if enabled
    if (!this.config.enabled) {
      throw new Error('Ghost is disabled. Call enable() first.');
    }

    // Check fault type
    if (!this.isFaultTypeAllowed(spec.type)) {
      throw new Error(`Fault type not allowed: ${spec.type}`);
    }

    // Check target
    if (this.isTargetBlocked(spec.target.id)) {
      throw new Error(`Target is blocked: ${spec.target.id}`);
    }

    // Check concurrent faults
    if (this.activeFaults.size >= this.config.maxConcurrentFaults) {
      throw new Error(`Maximum concurrent faults reached: ${this.config.maxConcurrentFaults}`);
    }

    // Check duration
    if (spec.durationMs > this.config.maxFaultDurationMs) {
      throw new Error(
        `Fault duration exceeds maximum: ${spec.durationMs}ms > ${this.config.maxFaultDurationMs}ms`
      );
    }

    // Check confirmation for high severity
    if (this.config.requireConfirmation && !confirmed) {
      if (spec.severity === 'high' || spec.severity === 'critical') {
        throw new Error(
          `High/critical severity faults require confirmation. Pass confirmed=true to proceed.`
        );
      }
    }
  }

  private async executeFaultInjection(handle: FaultHandle): Promise<void> {
    const { spec } = handle;

    // In a real implementation, this would actually inject the fault
    // For now, we simulate the fault injection
    switch (spec.type) {
      case 'network_latency':
      case 'network_drop':
      case 'network_partition':
      case 'network_corruption':
        await this.injectNetworkFault(handle, spec.params as NetworkFaultParams);
        break;

      case 'resource_cpu':
      case 'resource_memory':
      case 'resource_disk':
      case 'resource_io':
        await this.injectResourceFault(handle, spec.params as ResourceFaultParams);
        break;

      case 'process_kill':
      case 'process_hang':
      case 'process_crash':
        await this.injectProcessFault(handle, spec.params as ProcessFaultParams);
        break;

      case 'state_corruption':
      case 'state_inconsistency':
        await this.injectStateFault(handle, spec.params as StateFaultParams);
        break;

      case 'clock_skew':
        await this.injectClockFault(handle, spec.params as ClockFaultParams);
        break;

      case 'dns_failure':
        await this.injectDnsFault(handle);
        break;

      default:
        throw new Error(`Unknown fault type: ${spec.type}`);
    }
  }

  private async injectNetworkFault(handle: FaultHandle, params: NetworkFaultParams): Promise<void> {
    // Simulate network fault injection
    console.log(`[GHOST] Injecting network fault: ${handle.spec.type} on ${handle.spec.target.id}`);
    if (params.latencyMs) {
      console.log(`[GHOST]   Latency: ${params.latencyMs}ms (jitter: ${params.jitterMs ?? 0}ms)`);
    }
    if (params.dropPercent) {
      console.log(`[GHOST]   Drop rate: ${params.dropPercent}%`);
    }
    if (params.partitionFrom) {
      console.log(`[GHOST]   Partition from: ${params.partitionFrom.join(', ')}`);
    }
  }

  private async injectResourceFault(handle: FaultHandle, params: ResourceFaultParams): Promise<void> {
    console.log(`[GHOST] Injecting resource fault: ${handle.spec.type} on ${handle.spec.target.id}`);
    if (params.cpuPercent) {
      console.log(`[GHOST]   CPU load: ${params.cpuPercent}%`);
    }
    if (params.memoryBytes) {
      console.log(`[GHOST]   Memory consumption: ${Math.round(params.memoryBytes / 1024 / 1024)}MB`);
    }
  }

  private async injectProcessFault(handle: FaultHandle, params: ProcessFaultParams): Promise<void> {
    console.log(`[GHOST] Injecting process fault: ${handle.spec.type} on ${handle.spec.target.id}`);
    console.log(`[GHOST]   Process target: ${params.processTarget}`);
    if (params.hangDurationMs) {
      console.log(`[GHOST]   Hang duration: ${params.hangDurationMs}ms`);
    }
  }

  private async injectStateFault(handle: FaultHandle, params: StateFaultParams): Promise<void> {
    console.log(`[GHOST] Injecting state fault: ${handle.spec.type} on ${handle.spec.target.id}`);
    console.log(`[GHOST]   State key: ${params.stateKey}`);
    console.log(`[GHOST]   Corruption type: ${params.corruptionType}`);
  }

  private async injectClockFault(handle: FaultHandle, params: ClockFaultParams): Promise<void> {
    console.log(`[GHOST] Injecting clock fault on ${handle.spec.target.id}`);
    console.log(`[GHOST]   Clock skew: ${params.skewMs}ms`);
  }

  private async injectDnsFault(handle: FaultHandle): Promise<void> {
    console.log(`[GHOST] Injecting DNS fault on ${handle.spec.target.id}`);
  }

  private async executeFaultRemoval(handle: FaultHandle): Promise<void> {
    console.log(`[GHOST] Removing fault: ${handle.spec.type} from ${handle.spec.target.id}`);
    // In a real implementation, this would actually remove the fault
  }

  private async expireFault(id: string): Promise<void> {
    const handle = this.activeFaults.get(id);
    if (!handle) return;

    try {
      await this.removeFault(id);
      this.stats.faultsExpired++;
    } catch (error) {
      console.error(`Failed to expire fault ${id}:`, error);
    }
  }

  private monitorFaultSafety(id: string): void {
    // In safe mode, monitor the fault and auto-rollback if error threshold exceeded
    const checkInterval = setInterval(() => {
      const impact = this.impactTrackers.get(id);
      if (!impact) {
        clearInterval(checkInterval);
        return;
      }

      // Calculate error rate
      if (impact.requestsAffected > 0) {
        const errorRate = (impact.errorsCaused / impact.requestsAffected) * 100;
        if (errorRate > this.config.errorThreshold) {
          console.log(`[GHOST] Safety triggered: Error rate ${errorRate.toFixed(1)}% exceeds threshold ${this.config.errorThreshold}%`);
          this.stats.safetyTriggered++;
          this.removeFault(id).catch(console.error);
          clearInterval(checkInterval);
        }
      }
    }, 1000);

    // Clean up interval when fault is removed
    const originalTimer = this.timers.get(id);
    if (originalTimer) {
      // Wrap the original timer behavior
      clearTimeout(originalTimer);
      const handle = this.activeFaults.get(id);
      if (handle?.spec.durationMs) {
        const newTimer = setTimeout(() => {
          clearInterval(checkInterval);
          this.expireFault(id);
        }, handle.spec.durationMs);
        this.timers.set(id, newTimer);
      }
    }
  }

  private collectObservations(handle: FaultHandle, impact: FaultImpact): string[] {
    const observations: string[] = [];

    observations.push(`Fault type: ${handle.spec.type}`);
    observations.push(`Target: ${handle.spec.target.id}`);
    observations.push(`Duration: ${impact.activeDurationMs}ms`);

    if (impact.requestsAffected > 0) {
      observations.push(`Requests affected: ${impact.requestsAffected}`);
    }
    if (impact.errorsCaused > 0) {
      const errorRate = ((impact.errorsCaused / impact.requestsAffected) * 100).toFixed(1);
      observations.push(`Errors caused: ${impact.errorsCaused} (${errorRate}%)`);
    }
    if (impact.latencyIncreaseMs > 0) {
      observations.push(`Max latency increase: ${impact.latencyIncreaseMs}ms`);
    }
    if (impact.servicesAffected.length > 0) {
      observations.push(`Services affected: ${impact.servicesAffected.join(', ')}`);
    }

    return observations;
  }

  private createEmptyImpact(): FaultImpact {
    return {
      requestsAffected: 0,
      errorsCaused: 0,
      latencyIncreaseMs: 0,
      servicesAffected: [],
      activeDurationMs: 0,
    };
  }
}

/**
 * Create Ghost with default configuration
 */
export function createGhost(config?: Partial<GhostConfig>): Ghost {
  return new Ghost(config);
}
