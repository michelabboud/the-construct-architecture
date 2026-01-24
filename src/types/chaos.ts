/**
 * Chaos Engineering Types
 *
 * "We are getting aggravated." — The Twins
 *
 * Type definitions for The Twins (Ghost & Phantom) chaos engineering system.
 * Ghost handles fault injection; Phantom handles penetration testing.
 *
 * Phase 7 Implementation
 */

// ============ Common Types ============

/**
 * Severity levels for chaos events
 */
export type ChaosSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of a chaos operation
 */
export type ChaosStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

/**
 * Target for chaos operations
 */
export interface ChaosTarget {
  /** Target type */
  type: 'service' | 'network' | 'resource' | 'process' | 'endpoint' | 'database';
  /** Target identifier */
  id: string;
  /** Target name */
  name: string;
  /** Target host/address */
  host?: string;
  /** Target port */
  port?: number;
  /** Additional target metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Base chaos event
 */
export interface ChaosEvent {
  /** Unique event ID */
  id: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event type */
  type: string;
  /** Event severity */
  severity: ChaosSeverity;
  /** Event description */
  description: string;
  /** Target affected */
  target?: ChaosTarget;
}

// ============ Ghost Types (Fault Injection) ============

/**
 * Types of faults that Ghost can inject
 */
export type FaultType =
  | 'network_latency'
  | 'network_drop'
  | 'network_partition'
  | 'network_corruption'
  | 'resource_cpu'
  | 'resource_memory'
  | 'resource_disk'
  | 'resource_io'
  | 'process_kill'
  | 'process_hang'
  | 'process_crash'
  | 'state_corruption'
  | 'state_inconsistency'
  | 'clock_skew'
  | 'dns_failure';

/**
 * Network fault parameters
 */
export interface NetworkFaultParams {
  /** Latency to add in milliseconds */
  latencyMs?: number;
  /** Latency jitter in milliseconds */
  jitterMs?: number;
  /** Packet drop percentage (0-100) */
  dropPercent?: number;
  /** Packet corruption percentage (0-100) */
  corruptPercent?: number;
  /** Network partition targets */
  partitionFrom?: string[];
  /** Bandwidth limit in bytes/sec */
  bandwidthLimit?: number;
}

/**
 * Resource fault parameters
 */
export interface ResourceFaultParams {
  /** CPU load percentage (0-100) */
  cpuPercent?: number;
  /** Memory to consume in bytes */
  memoryBytes?: number;
  /** Disk space to consume in bytes */
  diskBytes?: number;
  /** IO operations per second limit */
  iopsLimit?: number;
  /** Number of file descriptors to consume */
  fdCount?: number;
}

/**
 * Process fault parameters
 */
export interface ProcessFaultParams {
  /** Process ID or name to target */
  processTarget: string;
  /** Signal to send (for kill) */
  signal?: number;
  /** Hang duration in milliseconds */
  hangDurationMs?: number;
  /** Crash with specific exit code */
  exitCode?: number;
}

/**
 * State fault parameters
 */
export interface StateFaultParams {
  /** State key to corrupt */
  stateKey: string;
  /** Corruption type */
  corruptionType: 'null' | 'invalid' | 'stale' | 'random';
  /** Custom corruption value */
  corruptValue?: unknown;
}

/**
 * Clock fault parameters
 */
export interface ClockFaultParams {
  /** Clock skew in milliseconds (positive = future, negative = past) */
  skewMs: number;
}

/**
 * Fault specification
 */
export interface FaultSpec {
  /** Fault type */
  type: FaultType;
  /** Target for the fault */
  target: ChaosTarget;
  /** Fault severity */
  severity: ChaosSeverity;
  /** Fault duration in milliseconds (0 = until removed) */
  durationMs: number;
  /** Fault-specific parameters */
  params: NetworkFaultParams | ResourceFaultParams | ProcessFaultParams | StateFaultParams | ClockFaultParams;
  /** Description of the fault */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Handle to an active fault
 */
export interface FaultHandle {
  /** Unique fault handle ID */
  id: string;
  /** Fault specification */
  spec: FaultSpec;
  /** When the fault was injected */
  injectedAt: Date;
  /** When the fault will expire (if duration set) */
  expiresAt?: Date;
  /** Current status */
  status: ChaosStatus;
}

/**
 * Status of an active fault
 */
export interface FaultStatus {
  /** Fault handle */
  handle: FaultHandle;
  /** Current impact metrics */
  impact: FaultImpact;
  /** Time remaining in milliseconds */
  remainingMs?: number;
  /** Error if fault failed */
  error?: string;
}

/**
 * Impact metrics from a fault
 */
export interface FaultImpact {
  /** Number of requests affected */
  requestsAffected: number;
  /** Number of errors caused */
  errorsCaused: number;
  /** Average latency increase in milliseconds */
  latencyIncreaseMs: number;
  /** Services affected */
  servicesAffected: string[];
  /** Time fault has been active */
  activeDurationMs: number;
}

/**
 * Result of a fault injection
 */
export interface FaultResult {
  /** Fault handle */
  handle: FaultHandle;
  /** Whether injection succeeded */
  success: boolean;
  /** Total impact during fault */
  totalImpact: FaultImpact;
  /** Recovery time after fault removed */
  recoveryTimeMs?: number;
  /** Observations during fault */
  observations: string[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Ghost configuration
 */
export interface GhostConfig {
  /** Enable fault injection (default: false for safety) */
  enabled: boolean;
  /** Maximum concurrent faults */
  maxConcurrentFaults: number;
  /** Maximum fault duration in milliseconds */
  maxFaultDurationMs: number;
  /** Require confirmation for high/critical severity */
  requireConfirmation: boolean;
  /** Allowed fault types */
  allowedFaultTypes: FaultType[];
  /** Blocked targets (never inject faults) */
  blockedTargets: string[];
  /** Safe mode - auto-rollback on error threshold */
  safeMode: boolean;
  /** Error threshold for safe mode rollback */
  errorThreshold: number;
}

// ============ Phantom Types (Penetration Testing) ============

/**
 * Types of security scans
 */
export type ScanType =
  | 'port_scan'
  | 'vulnerability_scan'
  | 'web_scan'
  | 'api_scan'
  | 'auth_scan'
  | 'injection_scan'
  | 'config_scan'
  | 'compliance_scan';

/**
 * Types of attacks to simulate
 */
export type AttackType =
  | 'brute_force'
  | 'sql_injection'
  | 'xss'
  | 'csrf'
  | 'path_traversal'
  | 'command_injection'
  | 'auth_bypass'
  | 'privilege_escalation'
  | 'dos_simulation'
  | 'session_hijack'
  | 'man_in_middle'
  | 'replay_attack';

/**
 * Vulnerability severity
 */
export type VulnerabilitySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Scan target specification
 */
export interface ScanTarget {
  /** Target type */
  type: 'host' | 'service' | 'endpoint' | 'application';
  /** Target address/URL */
  address: string;
  /** Port range for port scans */
  portRange?: { start: number; end: number };
  /** Authentication for authenticated scans */
  auth?: {
    type: 'basic' | 'bearer' | 'api_key';
    credentials: string;
  };
  /** Specific paths to scan */
  paths?: string[];
  /** Headers to include */
  headers?: Record<string, string>;
}

/**
 * Scan configuration
 */
export interface ScanConfig {
  /** Scan types to perform */
  scanTypes: ScanType[];
  /** Scan intensity (1-10) */
  intensity: number;
  /** Timeout per target in milliseconds */
  timeoutMs: number;
  /** Maximum concurrent scans */
  concurrency: number;
  /** Follow redirects */
  followRedirects: boolean;
  /** Include safe checks only */
  safeMode: boolean;
}

/**
 * Discovered vulnerability
 */
export interface Vulnerability {
  /** Unique vulnerability ID */
  id: string;
  /** Vulnerability name/title */
  name: string;
  /** Detailed description */
  description: string;
  /** Severity level */
  severity: VulnerabilitySeverity;
  /** CVSS score (0-10) */
  cvssScore?: number;
  /** CVE identifier if known */
  cveId?: string;
  /** CWE identifier if known */
  cweId?: string;
  /** Affected target */
  target: ScanTarget;
  /** Location (URL, file path, etc.) */
  location: string;
  /** Evidence/proof */
  evidence?: string;
  /** Remediation advice */
  remediation: string;
  /** References */
  references?: string[];
}

/**
 * Scan result
 */
export interface ScanResult {
  /** Scan ID */
  id: string;
  /** Scan target */
  target: ScanTarget;
  /** Scan types performed */
  scanTypes: ScanType[];
  /** Scan start time */
  startedAt: Date;
  /** Scan end time */
  completedAt: Date;
  /** Scan status */
  status: 'completed' | 'partial' | 'failed';
  /** Discovered vulnerabilities */
  vulnerabilities: Vulnerability[];
  /** Open ports discovered */
  openPorts?: number[];
  /** Services discovered */
  services?: { port: number; service: string; version?: string }[];
  /** Scan statistics */
  stats: {
    requestsMade: number;
    responsesReceived: number;
    errorsEncountered: number;
    timeElapsedMs: number;
  };
  /** Errors during scan */
  errors: string[];
}

/**
 * Attack specification
 */
export interface AttackSpec {
  /** Attack type */
  type: AttackType;
  /** Attack target */
  target: ScanTarget;
  /** Attack intensity (1-10) */
  intensity: number;
  /** Attack duration in milliseconds */
  durationMs: number;
  /** Attack-specific parameters */
  params: Record<string, unknown>;
  /** Description */
  description?: string;
}

/**
 * Attack result
 */
export interface AttackResult {
  /** Attack ID */
  id: string;
  /** Attack specification */
  spec: AttackSpec;
  /** Attack start time */
  startedAt: Date;
  /** Attack end time */
  completedAt: Date;
  /** Whether attack succeeded (found vulnerability) */
  succeeded: boolean;
  /** Attack blocked by security */
  blocked: boolean;
  /** Blocking mechanism if blocked */
  blockedBy?: string;
  /** Vulnerabilities exploited */
  exploitedVulnerabilities: Vulnerability[];
  /** Attack evidence */
  evidence: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Penetration test report
 */
export interface PenTestReport {
  /** Report ID */
  id: string;
  /** Report title */
  title: string;
  /** Report generated at */
  generatedAt: Date;
  /** Test period */
  period: {
    start: Date;
    end: Date;
  };
  /** Executive summary */
  executiveSummary: string;
  /** Targets tested */
  targets: ScanTarget[];
  /** All scan results */
  scanResults: ScanResult[];
  /** All attack results */
  attackResults: AttackResult[];
  /** Vulnerability summary by severity */
  vulnerabilitySummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  /** Top vulnerabilities */
  topVulnerabilities: Vulnerability[];
  /** Overall risk score (0-100) */
  riskScore: number;
  /** Risk rating */
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  /** Prioritized recommendations */
  recommendations: {
    priority: 'immediate' | 'short_term' | 'long_term';
    recommendation: string;
    relatedVulnerabilities: string[];
  }[];
  /** Compliance status */
  compliance?: {
    framework: string;
    status: 'compliant' | 'non_compliant' | 'partial';
    findings: string[];
  }[];
}

/**
 * Phantom configuration
 */
export interface PhantomConfig {
  /** Enable penetration testing (default: false for safety) */
  enabled: boolean;
  /** Safe mode - non-destructive tests only */
  safeMode: boolean;
  /** Maximum scan intensity */
  maxIntensity: number;
  /** Allowed scan types */
  allowedScanTypes: ScanType[];
  /** Allowed attack types */
  allowedAttackTypes: AttackType[];
  /** Blocked targets (never scan/attack) */
  blockedTargets: string[];
  /** Rate limit (requests per second) */
  rateLimit: number;
  /** Require confirmation for attacks */
  requireConfirmation: boolean;
}

// ============ Twins Types (Coordinator) ============

/**
 * Chaos scenario step
 */
export interface ChaosStep {
  /** Step ID */
  id: string;
  /** Step name */
  name: string;
  /** Step type */
  type: 'fault' | 'scan' | 'attack' | 'wait' | 'checkpoint';
  /** Step specification */
  spec: FaultSpec | ScanConfig | AttackSpec | { durationMs: number } | { validation: string };
  /** Dependencies (steps that must complete first) */
  dependsOn?: string[];
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Continue on failure */
  continueOnFailure?: boolean;
}

/**
 * Chaos scenario
 */
export interface ChaosScenario {
  /** Scenario ID */
  id: string;
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Scenario type */
  type: 'resilience' | 'security' | 'combined';
  /** Target system */
  targetSystem: string;
  /** Scenario steps */
  steps: ChaosStep[];
  /** Success criteria */
  successCriteria: {
    maxErrorRate: number;
    maxLatencyMs: number;
    minAvailability: number;
    securityChecks: string[];
  };
  /** Rollback plan */
  rollbackPlan: {
    automatic: boolean;
    steps: string[];
  };
  /** Schedule (cron expression) */
  schedule?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Step result
 */
export interface StepResult {
  /** Step ID */
  stepId: string;
  /** Step name */
  stepName: string;
  /** Step type */
  type: ChaosStep['type'];
  /** Step status */
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  /** Start time */
  startedAt: Date;
  /** End time */
  completedAt: Date;
  /** Duration in milliseconds */
  durationMs: number;
  /** Step-specific result */
  result: FaultResult | ScanResult | AttackResult | { waited: number } | { validated: boolean };
  /** Error if failed */
  error?: string;
}

/**
 * Scenario result
 */
export interface ScenarioResult {
  /** Scenario ID */
  scenarioId: string;
  /** Scenario name */
  scenarioName: string;
  /** Execution ID */
  executionId: string;
  /** Start time */
  startedAt: Date;
  /** End time */
  completedAt: Date;
  /** Overall status */
  status: 'passed' | 'failed' | 'partial' | 'aborted';
  /** Step results */
  stepResults: StepResult[];
  /** Success criteria evaluation */
  criteriaEvaluation: {
    criterion: string;
    passed: boolean;
    actual: number | string;
    expected: number | string;
  }[];
  /** Resilience metrics */
  resilienceMetrics: ResilienceMetrics;
  /** Was rollback triggered */
  rollbackTriggered: boolean;
  /** Rollback success */
  rollbackSuccess?: boolean;
  /** Observations */
  observations: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Resilience metrics
 */
export interface ResilienceMetrics {
  /** Overall resilience score (0-100) */
  overallScore: number;
  /** Fault tolerance score (0-100) */
  faultTolerance: number;
  /** Recovery speed score (0-100) */
  recoverySpeed: number;
  /** Security posture score (0-100) */
  securityPosture: number;
  /** Availability during chaos (percentage) */
  availabilityDuringChaos: number;
  /** Average recovery time in milliseconds */
  meanTimeToRecovery: number;
  /** Error rate during chaos (percentage) */
  errorRateDuringChaos: number;
  /** Latency increase during chaos (percentage) */
  latencyIncreaseDuringChaos: number;
  /** Number of faults survived */
  faultsSurvived: number;
  /** Number of faults that caused failures */
  faultsCausedFailures: number;
  /** Number of attacks blocked */
  attacksBlocked: number;
  /** Number of attacks succeeded */
  attacksSucceeded: number;
  /** Vulnerabilities found */
  vulnerabilitiesFound: number;
  /** Time period measured */
  measurementPeriod: {
    start: Date;
    end: Date;
  };
}

/**
 * Twins configuration
 */
export interface TwinsConfig {
  /** Enable chaos engineering (default: false for safety) */
  enabled: boolean;
  /** Ghost configuration */
  ghost: GhostConfig;
  /** Phantom configuration */
  phantom: PhantomConfig;
  /** Require Agent Smith approval */
  requireSmithApproval: boolean;
  /** Emergency stop enabled */
  emergencyStopEnabled: boolean;
  /** Auto-rollback on critical failure */
  autoRollback: boolean;
  /** Maximum scenario duration in milliseconds */
  maxScenarioDurationMs: number;
  /** Notification channels */
  notificationChannels: string[];
  /** Blocked time windows (no chaos during these times) */
  blockedTimeWindows?: {
    start: string; // HH:mm
    end: string;   // HH:mm
    days?: number[]; // 0-6 (Sunday-Saturday)
  }[];
}

/**
 * Twins status
 */
export interface TwinsStatus {
  /** Whether chaos is currently running */
  chaosActive: boolean;
  /** Ghost status */
  ghostStatus: {
    enabled: boolean;
    activeFaults: number;
    faultsInjectedTotal: number;
  };
  /** Phantom status */
  phantomStatus: {
    enabled: boolean;
    activeScans: number;
    scansCompletedTotal: number;
  };
  /** Current scenario if running */
  currentScenario?: {
    id: string;
    name: string;
    progress: number;
    currentStep: string;
  };
  /** Last scenario result */
  lastScenarioResult?: {
    id: string;
    name: string;
    status: ScenarioResult['status'];
    completedAt: Date;
  };
  /** Overall resilience score */
  resilienceScore: number;
  /** Health status */
  health: 'healthy' | 'degraded' | 'critical';
}
