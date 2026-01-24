/**
 * Special Agent Johnson - Threat Detection
 *
 * "I want everyone to cooperate fully."
 *
 * Special Agent Johnson handles all threat detection responsibilities:
 * - Real-time anomaly detection
 * - Pattern analysis
 * - Signature matching
 * - Alert generation
 *
 * Phase 6 Implementation
 */

import type {
  ThreatEvent,
  ThreatLevel,
  SecurityPrincipal,
  // Future use: SecurityAuditEntry,
} from '../../types/security.js';
import type { SpecialAgent } from '../smith/agent-smith.js';

/**
 * Behavior pattern for analysis
 */
export interface BehaviorPattern {
  /** Principal ID */
  principalId: string;
  /** Action type */
  actionType: string;
  /** Resource type (optional) */
  resourceType?: string | undefined;
  /** Timestamp */
  timestamp: Date;
  /** Success or failure */
  success: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
  /** Whether an anomaly was detected */
  isAnomaly: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Anomaly type */
  type?: 'frequency' | 'timing' | 'pattern' | 'access' | 'behavioral';
  /** Description */
  description?: string;
  /** Baseline comparison */
  baseline?: {
    expected: number;
    actual: number;
    deviation: number;
  };
}

/**
 * Threat signature
 */
export interface ThreatSignature {
  /** Signature ID */
  id: string;
  /** Signature name */
  name: string;
  /** Threat type this signature detects */
  threatType: ThreatEvent['type'];
  /** Severity level */
  severity: ThreatLevel;
  /** Pattern to match */
  pattern: {
    /** Field to check */
    field: string;
    /** Match type */
    match: 'exact' | 'contains' | 'regex' | 'range';
    /** Value to match */
    value: string | number | RegExp;
  }[];
  /** Description */
  description?: string;
  /** Is signature enabled */
  enabled: boolean;
}

/**
 * Activity record for analysis
 */
export interface Activity {
  /** Activity ID */
  id: string;
  /** Principal performing the activity */
  principal?: SecurityPrincipal;
  /** Activity type */
  type: string;
  /** Target resource */
  target?: {
    type: string;
    id: string;
    path?: string;
  };
  /** Timestamp */
  timestamp: Date;
  /** Request metadata */
  request?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
  };
  /** Outcome */
  outcome: 'success' | 'failure' | 'blocked';
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Threat analysis result
 */
export interface ThreatAnalysis {
  /** Whether a threat was detected */
  threatDetected: boolean;
  /** Detected threats */
  threats: ThreatEvent[];
  /** Matched signatures */
  matchedSignatures: string[];
  /** Anomalies detected */
  anomalies: AnomalyResult[];
  /** Risk score (0-100) */
  riskScore: number;
  /** Recommendations */
  recommendations: string[];
  /** Analysis timestamp */
  timestamp: Date;
}

/**
 * Agent Johnson configuration
 */
export interface AgentJohnsonConfig {
  /** Anomaly detection threshold (0-1, default: 0.7) */
  anomalyThreshold: number;
  /** Activity window for baseline (ms, default: 1 hour) */
  baselineWindow: number;
  /** Maximum activities to store per principal (default: 1000) */
  maxActivitiesPerPrincipal: number;
  /** Enable automatic threat event creation (default: true) */
  autoCreateThreats: boolean;
  /** Minimum risk score to create threat (default: 50) */
  minRiskScoreForThreat: number;
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  anomalyThreshold: number;
  baselineWindow: number;
  maxActivitiesPerPrincipal: number;
  autoCreateThreats: boolean;
  minRiskScoreForThreat: number;
}

/**
 * Special Agent Johnson - Threat Detection Agent
 */
export class AgentJohnson implements SpecialAgent {
  readonly name = 'Johnson';
  readonly type = 'threat_detection' as const;

  private config: InternalConfig;
  private signatures: Map<string, ThreatSignature> = new Map();
  private activityHistory: Map<string, Activity[]> = new Map(); // principalId -> activities
  private activeThreats: Map<string, ThreatEvent> = new Map();
  private behaviorBaselines: Map<string, Map<string, number>> = new Map(); // principalId -> actionType -> count
  private threatIdCounter = 0;

  // Statistics
  private stats = {
    activitiesAnalyzed: 0,
    threatsDetected: 0,
    anomaliesDetected: 0,
    signatureMatches: 0,
    falsePositives: 0,
  };

  constructor(config: Partial<AgentJohnsonConfig> = {}) {
    this.config = {
      anomalyThreshold: config.anomalyThreshold ?? 0.7,
      baselineWindow: config.baselineWindow ?? 3600000, // 1 hour
      maxActivitiesPerPrincipal: config.maxActivitiesPerPrincipal ?? 1000,
      autoCreateThreats: config.autoCreateThreats ?? true,
      minRiskScoreForThreat: config.minRiskScoreForThreat ?? 50,
    };

    this.initializeDefaultSignatures();
  }

  /**
   * Analyze activity for threats
   */
  analyzeActivity(activity: Activity): ThreatAnalysis {
    this.stats.activitiesAnalyzed++;

    const threats: ThreatEvent[] = [];
    const matchedSignatures: string[] = [];
    const anomalies: AnomalyResult[] = [];
    let riskScore = 0;

    // Store activity in history
    this.recordActivity(activity);

    // Signature matching
    for (const signature of this.signatures.values()) {
      if (!signature.enabled) continue;

      if (this.matchSignature(signature, activity)) {
        matchedSignatures.push(signature.id);
        this.stats.signatureMatches++;
        riskScore += this.severityToScore(signature.severity);

        if (this.config.autoCreateThreats) {
          const threat = this.createThreatFromSignature(signature, activity);
          threats.push(threat);
          this.activeThreats.set(threat.id, threat);
          this.stats.threatsDetected++;
        }
      }
    }

    // Anomaly detection
    if (activity.principal) {
      const anomaly = this.detectAnomaly({
        principalId: activity.principal.id,
        actionType: activity.type,
        resourceType: activity.target?.type,
        timestamp: activity.timestamp,
        success: activity.outcome === 'success',
      });

      if (anomaly.isAnomaly) {
        anomalies.push(anomaly);
        this.stats.anomaliesDetected++;
        riskScore += Math.round(anomaly.confidence * 30);
      }
    }

    // Check for failed activity patterns
    if (activity.outcome === 'failure' || activity.outcome === 'blocked') {
      riskScore += 10;
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(threats, anomalies, riskScore);

    return {
      threatDetected: threats.length > 0,
      threats,
      matchedSignatures,
      anomalies,
      riskScore,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Detect anomalies in behavior
   */
  detectAnomaly(behavior: BehaviorPattern): AnomalyResult {
    // Check timing anomaly first (activities outside normal hours)
    // This doesn't require a baseline
    const hour = behavior.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      return {
        isAnomaly: true,
        confidence: 0.6,
        type: 'timing',
        description: 'Activity outside normal hours',
      };
    }

    const baseline = this.getBaseline(behavior.principalId);

    if (!baseline) {
      // No baseline yet - not an anomaly (for frequency-based detection)
      return { isAnomaly: false, confidence: 0 };
    }

    // Check frequency anomaly
    const actionCount = baseline.get(behavior.actionType) ?? 0;
    const recentCount = this.getRecentActivityCount(
      behavior.principalId,
      behavior.actionType,
      this.config.baselineWindow
    );

    // Calculate deviation
    const expectedRate = actionCount / (this.config.baselineWindow / 3600000); // per hour
    const actualRate = recentCount;
    const deviation = expectedRate > 0 ? (actualRate - expectedRate) / expectedRate : 0;

    if (Math.abs(deviation) > 2) { // More than 2x normal rate
      const confidence = Math.min(1, Math.abs(deviation) / 5);

      if (confidence >= this.config.anomalyThreshold) {
        return {
          isAnomaly: true,
          confidence,
          type: 'frequency',
          description: deviation > 0
            ? `Activity rate ${actualRate.toFixed(1)}x higher than baseline`
            : `Activity rate ${Math.abs(deviation).toFixed(1)}x lower than baseline`,
          baseline: {
            expected: expectedRate,
            actual: actualRate,
            deviation,
          },
        };
      }
    }

    return { isAnomaly: false, confidence: 0 };
  }

  /**
   * Add a threat signature
   */
  addSignature(signature: ThreatSignature): void {
    this.signatures.set(signature.id, signature);
  }

  /**
   * Remove a threat signature
   */
  removeSignature(signatureId: string): boolean {
    return this.signatures.delete(signatureId);
  }

  /**
   * Get a signature
   */
  getSignature(signatureId: string): ThreatSignature | undefined {
    return this.signatures.get(signatureId);
  }

  /**
   * Get all signatures
   */
  getAllSignatures(): ThreatSignature[] {
    return Array.from(this.signatures.values());
  }

  /**
   * Get active threats
   */
  getActiveThreats(): ThreatEvent[] {
    return Array.from(this.activeThreats.values())
      .filter(t => t.status === 'detected' || t.status === 'investigating');
  }

  /**
   * Get threat summary
   */
  getThreatSummary(): {
    total: number;
    byLevel: Record<ThreatLevel, number>;
    byType: Record<string, number>;
  } {
    const threats = this.getActiveThreats();
    const byLevel: Record<ThreatLevel, number> = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const byType: Record<string, number> = {};

    for (const threat of threats) {
      byLevel[threat.level]++;
      byType[threat.type] = (byType[threat.type] ?? 0) + 1;
    }

    return {
      total: threats.length,
      byLevel,
      byType,
    };
  }

  /**
   * Update threat status
   */
  updateThreatStatus(threatId: string, status: ThreatEvent['status']): boolean {
    const threat = this.activeThreats.get(threatId);
    if (!threat) {
      return false;
    }
    threat.status = status;
    return true;
  }

  /**
   * Mark threat as false positive
   */
  markFalsePositive(threatId: string): boolean {
    const threat = this.activeThreats.get(threatId);
    if (!threat) {
      return false;
    }
    threat.status = 'false_positive';
    this.stats.falsePositives++;
    return true;
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string } {
    const activeThreats = this.getActiveThreats().length;
    if (activeThreats > 100) {
      return { status: 'degraded', message: `High threat volume: ${activeThreats}` };
    }
    return { status: 'up' };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { activeThreats: number; enabledSignatures: number } {
    return {
      ...this.stats,
      activeThreats: this.getActiveThreats().length,
      enabledSignatures: Array.from(this.signatures.values()).filter(s => s.enabled).length,
    };
  }

  /**
   * Clear activity history
   */
  clearActivityHistory(principalId?: string): void {
    if (principalId) {
      this.activityHistory.delete(principalId);
      this.behaviorBaselines.delete(principalId);
    } else {
      this.activityHistory.clear();
      this.behaviorBaselines.clear();
    }
  }

  // ============ Private Methods ============

  private initializeDefaultSignatures(): void {
    // Brute force detection
    this.addSignature({
      id: 'sig-brute-force',
      name: 'Brute Force Attack',
      threatType: 'brute_force',
      severity: 'high',
      pattern: [
        { field: 'outcome', match: 'exact', value: 'failure' },
        { field: 'type', match: 'exact', value: 'authentication' },
      ],
      description: 'Multiple failed authentication attempts',
      enabled: true,
    });

    // SQL injection
    this.addSignature({
      id: 'sig-sql-injection',
      name: 'SQL Injection Attempt',
      threatType: 'injection',
      severity: 'critical',
      pattern: [
        { field: 'request.path', match: 'regex', value: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/i },
      ],
      description: 'SQL injection pattern detected in request',
      enabled: true,
    });

    // Unauthorized access
    this.addSignature({
      id: 'sig-unauthorized-access',
      name: 'Unauthorized Access Attempt',
      threatType: 'unauthorized_access',
      severity: 'medium',
      pattern: [
        { field: 'outcome', match: 'exact', value: 'blocked' },
        { field: 'type', match: 'exact', value: 'authorization' },
      ],
      description: 'Access to unauthorized resource',
      enabled: true,
    });

    // Suspicious user agent
    this.addSignature({
      id: 'sig-suspicious-agent',
      name: 'Suspicious User Agent',
      threatType: 'anomaly',
      severity: 'low',
      pattern: [
        { field: 'request.userAgent', match: 'regex', value: /(sqlmap|nikto|nmap)/i },
      ],
      description: 'Known attack tool user agent detected',
      enabled: true,
    });
  }

  private recordActivity(activity: Activity): void {
    if (!activity.principal) return;

    const principalId = activity.principal.id;
    let activities = this.activityHistory.get(principalId);

    if (!activities) {
      activities = [];
      this.activityHistory.set(principalId, activities);
    }

    activities.push(activity);

    // Trim to max size
    if (activities.length > this.config.maxActivitiesPerPrincipal) {
      activities.shift();
    }

    // Update baseline
    this.updateBaseline(principalId, activity.type);
  }

  private updateBaseline(principalId: string, actionType: string): void {
    let baseline = this.behaviorBaselines.get(principalId);
    if (!baseline) {
      baseline = new Map();
      this.behaviorBaselines.set(principalId, baseline);
    }

    const count = baseline.get(actionType) ?? 0;
    baseline.set(actionType, count + 1);
  }

  private getBaseline(principalId: string): Map<string, number> | undefined {
    return this.behaviorBaselines.get(principalId);
  }

  private getRecentActivityCount(
    principalId: string,
    actionType: string,
    windowMs: number
  ): number {
    const activities = this.activityHistory.get(principalId);
    if (!activities) return 0;

    const cutoff = new Date(Date.now() - windowMs);
    return activities.filter(a =>
      a.type === actionType && a.timestamp > cutoff
    ).length;
  }

  private matchSignature(signature: ThreatSignature, activity: Activity): boolean {
    // Track whether at least one pattern was actually evaluated
    let patternsEvaluated = 0;

    for (const pattern of signature.pattern) {
      const value = this.getFieldValue(activity, pattern.field);

      // If field is undefined, signature doesn't match
      // (the activity must have the field to be considered a match)
      if (value === undefined) return false;

      patternsEvaluated++;
      let matches = false;
      switch (pattern.match) {
        case 'exact':
          matches = value === pattern.value;
          break;
        case 'contains':
          matches = String(value).includes(String(pattern.value));
          break;
        case 'regex':
          matches = pattern.value instanceof RegExp
            ? pattern.value.test(String(value))
            : new RegExp(String(pattern.value)).test(String(value));
          break;
        case 'range':
          // For numeric ranges
          matches = typeof value === 'number' && typeof pattern.value === 'number'
            && value <= pattern.value;
          break;
      }

      if (!matches) return false;
    }

    // Signature only matches if at least one pattern was evaluated
    return patternsEvaluated > 0;
  }

  private getFieldValue(activity: Activity, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = activity;

    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return undefined;
      }
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  private createThreatFromSignature(signature: ThreatSignature, activity: Activity): ThreatEvent {
    const source: ThreatEvent['source'] = {};
    if (activity.principal?.id) source.principalId = activity.principal.id;
    if (activity.request?.ip) source.ip = activity.request.ip;
    if (activity.request?.userAgent) source.userAgent = activity.request.userAgent;
    source.requestId = activity.id;

    const target: ThreatEvent['target'] = {};
    if (activity.target?.type) target.resourceType = activity.target.type;
    if (activity.target?.id) target.resourceId = activity.target.id;
    const path = activity.target?.path ?? activity.request?.path;
    if (path) target.path = path;

    return {
      id: `threat-${++this.threatIdCounter}-${Date.now()}`,
      type: signature.threatType,
      level: signature.severity,
      source,
      target,
      description: signature.description ?? signature.name,
      detectedAt: new Date(),
      indicators: [signature.id],
      status: 'detected',
      recommendedActions: this.getRecommendedActions(signature.threatType, signature.severity),
    };
  }

  private getRecommendedActions(threatType: ThreatEvent['type'], severity: ThreatLevel): string[] {
    const actions: string[] = [];

    switch (threatType) {
      case 'brute_force':
        actions.push('Block source IP temporarily');
        actions.push('Review affected accounts');
        if (severity === 'high' || severity === 'critical') {
          actions.push('Force password reset for targeted accounts');
        }
        break;
      case 'injection':
        actions.push('Block request');
        actions.push('Review application input validation');
        actions.push('Scan for vulnerabilities');
        break;
      case 'unauthorized_access':
        actions.push('Review access control policies');
        actions.push('Audit principal permissions');
        break;
      case 'data_exfiltration':
        actions.push('Immediately isolate affected resources');
        actions.push('Review data access logs');
        actions.push('Notify security team');
        break;
      default:
        actions.push('Investigate activity');
        actions.push('Monitor for further anomalies');
    }

    return actions;
  }

  private generateRecommendations(
    threats: ThreatEvent[],
    anomalies: AnomalyResult[],
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 80) {
      recommendations.push('URGENT: Immediate investigation required');
    }

    if (threats.length > 0) {
      recommendations.push(`Review ${threats.length} detected threat(s)`);
    }

    if (anomalies.some(a => a.type === 'frequency')) {
      recommendations.push('Review activity frequency patterns');
    }

    if (anomalies.some(a => a.type === 'timing')) {
      recommendations.push('Verify activity timing is expected');
    }

    if (riskScore > 50 && recommendations.length === 0) {
      recommendations.push('Continue monitoring for suspicious activity');
    }

    return recommendations;
  }

  private severityToScore(severity: ThreatLevel): number {
    switch (severity) {
      case 'critical': return 50;
      case 'high': return 35;
      case 'medium': return 20;
      case 'low': return 10;
      default: return 0;
    }
  }
}

/**
 * Create Agent Johnson with default configuration
 */
export function createAgentJohnson(config?: Partial<AgentJohnsonConfig>): AgentJohnson {
  return new AgentJohnson(config);
}
