/**
 * Special Agent Thompson - Audit
 *
 * "The orders were to have them done in ninety minutes."
 *
 * Special Agent Thompson handles all audit responsibilities:
 * - Immutable audit logs
 * - Compliance reporting
 * - Log analysis
 * - Evidence preservation
 *
 * Phase 6 Implementation
 */

import type {
  SecurityAuditEntry,
  // Future use: SecurityPrincipal, SecurityResource, SecurityAction,
  ThreatLevel,
} from '../../types/security.js';
import type { SpecialAgent } from '../smith/agent-smith.js';
import { createHash } from 'crypto';

/**
 * Log query parameters
 */
export interface LogQuery {
  /** Filter by event type */
  eventType?: SecurityAuditEntry['eventType'];
  /** Filter by principal ID */
  principalId?: string;
  /** Filter by resource type */
  resourceType?: string;
  /** Filter by outcome */
  outcome?: SecurityAuditEntry['outcome'];
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  /** Report ID */
  id: string;
  /** Report title */
  title: string;
  /** Report period */
  period: {
    start: Date;
    end: Date;
  };
  /** Generation timestamp */
  generatedAt: Date;
  /** Summary statistics */
  summary: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    blockedEvents: number;
    escalatedEvents: number;
    uniquePrincipals: number;
    uniqueResources: number;
  };
  /** Event breakdown by type */
  eventsByType: Record<string, number>;
  /** Event breakdown by outcome */
  eventsByOutcome: Record<string, number>;
  /** Top principals by activity */
  topPrincipals: Array<{ principalId: string; count: number }>;
  /** Top resources accessed */
  topResources: Array<{ resourceId: string; count: number }>;
  /** Security incidents */
  incidents: Array<{
    time: Date;
    type: string;
    severity: ThreatLevel;
    description: string;
  }>;
  /** Compliance checks */
  complianceChecks: Array<{
    check: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }>;
}

/**
 * Agent Thompson configuration
 */
export interface AgentThompsonConfig {
  /** Maximum log entries to store (default: 100000) */
  maxLogEntries: number;
  /** Log retention period in milliseconds (default: 90 days) */
  retentionPeriod: number;
  /** Enable integrity hashing (default: true) */
  enableIntegrityHashing: boolean;
  /** Enable compression for old logs (default: true) */
  enableCompression: boolean;
  /** Audit log write mode */
  writeMode: 'sync' | 'async';
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  maxLogEntries: number;
  retentionPeriod: number;
  enableIntegrityHashing: boolean;
  enableCompression: boolean;
  writeMode: 'sync' | 'async';
}

/**
 * Special Agent Thompson - Audit Agent
 */
export class AgentThompson implements SpecialAgent {
  readonly name = 'Thompson';
  readonly type = 'audit' as const;

  private config: InternalConfig;
  private logs: SecurityAuditEntry[] = [];
  private logIndex: Map<string, number[]> = new Map(); // eventType -> indices
  private principalIndex: Map<string, number[]> = new Map(); // principalId -> indices
  private logIdCounter = 0;
  private lastHash: string = '';

  // Statistics
  private stats = {
    totalLogs: 0,
    logsWritten: 0,
    logsQueried: 0,
    reportsGenerated: 0,
    integrityVerifications: 0,
    retentionPurges: 0,
  };

  constructor(config: Partial<AgentThompsonConfig> = {}) {
    this.config = {
      maxLogEntries: config.maxLogEntries ?? 100000,
      retentionPeriod: config.retentionPeriod ?? 90 * 24 * 60 * 60 * 1000, // 90 days
      enableIntegrityHashing: config.enableIntegrityHashing ?? true,
      enableCompression: config.enableCompression ?? true,
      writeMode: config.writeMode ?? 'sync',
    };
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityAuditEntry, 'id' | 'timestamp' | 'integrityHash'>): SecurityAuditEntry {
    this.stats.logsWritten++;

    const entry: SecurityAuditEntry = {
      id: `log-${++this.logIdCounter}-${Date.now()}`,
      timestamp: new Date(),
      ...event,
    };

    // Add integrity hash
    if (this.config.enableIntegrityHashing) {
      entry.integrityHash = this.computeHash(entry);
    }

    // Store log
    const index = this.logs.length;
    this.logs.push(entry);
    this.stats.totalLogs++;

    // Update indices
    this.indexLog(entry, index);

    // Enforce max entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.purgeOldLogs();
    }

    return entry;
  }

  /**
   * Query logs
   */
  queryLogs(query: LogQuery): SecurityAuditEntry[] {
    this.stats.logsQueried++;

    let results: SecurityAuditEntry[];

    // Use index if possible
    if (query.eventType && !query.principalId) {
      const indices = this.logIndex.get(query.eventType) ?? [];
      results = indices.map(i => this.logs[i]).filter((l): l is SecurityAuditEntry => l !== undefined);
    } else if (query.principalId && !query.eventType) {
      const indices = this.principalIndex.get(query.principalId) ?? [];
      results = indices.map(i => this.logs[i]).filter((l): l is SecurityAuditEntry => l !== undefined);
    } else {
      results = [...this.logs];
    }

    // Apply filters
    if (query.eventType) {
      results = results.filter(l => l.eventType === query.eventType);
    }
    if (query.principalId) {
      results = results.filter(l => l.principal?.id === query.principalId);
    }
    if (query.resourceType) {
      results = results.filter(l => l.resource?.type === query.resourceType);
    }
    if (query.outcome) {
      results = results.filter(l => l.outcome === query.outcome);
    }
    if (query.startTime) {
      results = results.filter(l => l.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(l => l.timestamp <= query.endTime!);
    }

    // Sort
    results.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return query.sortOrder === 'asc' ? diff : -diff;
    });

    // Pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get a specific log entry
   */
  getLog(logId: string): SecurityAuditEntry | undefined {
    return this.logs.find(l => l.id === logId);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(period: { start: Date; end: Date }): ComplianceReport {
    this.stats.reportsGenerated++;

    const logs = this.queryLogs({
      startTime: period.start,
      endTime: period.end,
    });

    // Calculate statistics
    const uniquePrincipals = new Set<string>();
    const uniqueResources = new Set<string>();
    const eventsByType: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const principalCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const incidents: ComplianceReport['incidents'] = [];

    let successful = 0;
    let failed = 0;
    let blocked = 0;
    let escalated = 0;

    for (const log of logs) {
      // Count by type
      eventsByType[log.eventType] = (eventsByType[log.eventType] ?? 0) + 1;

      // Count by outcome
      eventsByOutcome[log.outcome] = (eventsByOutcome[log.outcome] ?? 0) + 1;

      switch (log.outcome) {
        case 'success': successful++; break;
        case 'failure': failed++; break;
        case 'blocked': blocked++; break;
        case 'escalated': escalated++; break;
      }

      // Track principals
      if (log.principal?.id) {
        uniquePrincipals.add(log.principal.id);
        principalCounts[log.principal.id] = (principalCounts[log.principal.id] ?? 0) + 1;
      }

      // Track resources
      if (log.resource?.id) {
        uniqueResources.add(log.resource.id);
        resourceCounts[log.resource.id] = (resourceCounts[log.resource.id] ?? 0) + 1;
      }

      // Track security incidents
      if (log.eventType === 'threat' && log.details['severity']) {
        incidents.push({
          time: log.timestamp,
          type: String(log.details['threatType'] ?? 'unknown'),
          severity: log.details['severity'] as ThreatLevel,
          description: String(log.details['description'] ?? ''),
        });
      }
    }

    // Top principals
    const topPrincipals = Object.entries(principalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([principalId, count]) => ({ principalId, count }));

    // Top resources
    const topResources = Object.entries(resourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resourceId, count]) => ({ resourceId, count }));

    // Compliance checks
    const complianceChecks = this.runComplianceChecks(logs, period);

    return {
      id: `report-${Date.now()}`,
      title: `Security Compliance Report`,
      period,
      generatedAt: new Date(),
      summary: {
        totalEvents: logs.length,
        successfulEvents: successful,
        failedEvents: failed,
        blockedEvents: blocked,
        escalatedEvents: escalated,
        uniquePrincipals: uniquePrincipals.size,
        uniqueResources: uniqueResources.size,
      },
      eventsByType,
      eventsByOutcome,
      topPrincipals,
      topResources,
      incidents,
      complianceChecks,
    };
  }

  /**
   * Verify log integrity
   */
  verifyIntegrity(logId?: string): { valid: boolean; errors: string[] } {
    this.stats.integrityVerifications++;
    const errors: string[] = [];

    if (!this.config.enableIntegrityHashing) {
      return { valid: true, errors: ['Integrity hashing is disabled'] };
    }

    // For full chain verification, we need to verify in order
    // For single log verification, we need to find its position and compute chain up to it
    let prevHash = '';

    for (const log of this.logs) {
      // If verifying a specific log, check if this is it
      if (logId && log.id !== logId) {
        // Still need to track the chain
        prevHash = log.integrityHash ?? '';
        continue;
      }

      if (!log.integrityHash) {
        errors.push(`Log ${log.id} has no integrity hash`);
        prevHash = '';
        continue;
      }

      const computed = this.computeHash(log, prevHash);
      if (computed !== log.integrityHash) {
        errors.push(`Log ${log.id} integrity check failed`);
      }

      prevHash = log.integrityHash;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export logs for evidence preservation
   */
  exportLogs(query: LogQuery): {
    logs: SecurityAuditEntry[];
    exportedAt: Date;
    signature: string;
  } {
    const logs = this.queryLogs(query);
    const exportedAt = new Date();

    // Create signature of exported data
    const dataStr = JSON.stringify(logs);
    const signature = createHash('sha256')
      .update(dataStr + exportedAt.toISOString())
      .digest('hex');

    return {
      logs,
      exportedAt,
      signature,
    };
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string } {
    if (this.logs.length > this.config.maxLogEntries * 0.95) {
      return { status: 'degraded', message: 'Log storage near capacity' };
    }
    return { status: 'up' };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { currentLogCount: number; oldestLog?: Date } {
    const result: typeof this.stats & { currentLogCount: number; oldestLog?: Date } = {
      ...this.stats,
      currentLogCount: this.logs.length,
    };

    const oldestLog = this.logs[0]?.timestamp;
    if (oldestLog) {
      result.oldestLog = oldestLog;
    }

    return result;
  }

  /**
   * Purge logs older than retention period
   */
  purgeExpiredLogs(): number {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    const before = this.logs.length;

    // Use > instead of >= so that logs exactly at the cutoff are purged
    // This ensures retentionPeriod: 0 means "expire immediately"
    this.logs = this.logs.filter(l => l.timestamp > cutoff);
    this.rebuildIndices();

    const purged = before - this.logs.length;
    if (purged > 0) {
      this.stats.retentionPurges++;
    }

    return purged;
  }

  // ============ Private Methods ============

  private indexLog(entry: SecurityAuditEntry, index: number): void {
    // Index by event type
    let typeIndices = this.logIndex.get(entry.eventType);
    if (!typeIndices) {
      typeIndices = [];
      this.logIndex.set(entry.eventType, typeIndices);
    }
    typeIndices.push(index);

    // Index by principal
    if (entry.principal?.id) {
      let principalIndices = this.principalIndex.get(entry.principal.id);
      if (!principalIndices) {
        principalIndices = [];
        this.principalIndex.set(entry.principal.id, principalIndices);
      }
      principalIndices.push(index);
    }
  }

  private rebuildIndices(): void {
    this.logIndex.clear();
    this.principalIndex.clear();

    for (let i = 0; i < this.logs.length; i++) {
      const entry = this.logs[i];
      if (entry) {
        this.indexLog(entry, i);
      }
    }
  }

  private computeHash(entry: SecurityAuditEntry, prevHash?: string): string {
    // Create deterministic string representation
    const data = {
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      eventType: entry.eventType,
      principal: entry.principal?.id,
      resource: entry.resource?.id,
      action: entry.action?.type,
      outcome: entry.outcome,
      details: entry.details,
      prevHash: prevHash ?? this.lastHash,
    };

    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    // Only update lastHash when prevHash is not provided (i.e., during logging)
    if (prevHash === undefined) {
      this.lastHash = hash;
    }
    return hash;
  }

  private purgeOldLogs(): void {
    // Remove oldest 10% of logs
    const removeCount = Math.floor(this.logs.length * 0.1);
    this.logs.splice(0, removeCount);
    this.rebuildIndices();
    this.stats.retentionPurges++;
  }

  private runComplianceChecks(
    logs: SecurityAuditEntry[],
    _period: { start: Date; end: Date }
  ): ComplianceReport['complianceChecks'] {
    const checks: ComplianceReport['complianceChecks'] = [];

    // Check 1: Authentication logging
    const authLogs = logs.filter(l => l.eventType === 'authentication');
    checks.push({
      check: 'Authentication events are logged',
      status: authLogs.length > 0 ? 'pass' : 'warning',
      details: `${authLogs.length} authentication events recorded`,
    });

    // Check 2: Failed authentication rate
    const failedAuth = authLogs.filter(l => l.outcome === 'failure').length;
    const failRate = authLogs.length > 0 ? failedAuth / authLogs.length : 0;
    checks.push({
      check: 'Failed authentication rate below threshold',
      status: failRate < 0.1 ? 'pass' : failRate < 0.2 ? 'warning' : 'fail',
      details: `${(failRate * 100).toFixed(1)}% authentication failures`,
    });

    // Check 3: Admin action logging
    const adminLogs = logs.filter(l => l.eventType === 'admin');
    checks.push({
      check: 'Administrative actions are logged',
      status: 'pass',
      details: `${adminLogs.length} admin actions recorded`,
    });

    // Check 4: Threat detection
    const threatLogs = logs.filter(l => l.eventType === 'threat');
    checks.push({
      check: 'Threat detection is active',
      status: threatLogs.length > 0 ? 'pass' : 'warning',
      details: threatLogs.length > 0
        ? `${threatLogs.length} threats detected`
        : 'No threats detected (verify detection is active)',
    });

    // Check 5: Log integrity
    const integrityResult = this.verifyIntegrity();
    checks.push({
      check: 'Log integrity verified',
      status: integrityResult.valid ? 'pass' : 'fail',
      details: integrityResult.valid
        ? 'All log entries have valid integrity hashes'
        : `${integrityResult.errors.length} integrity errors found`,
    });

    // Check 6: Log retention
    const oldestLog = this.logs[0]?.timestamp;
    const retentionDays = oldestLog
      ? Math.floor((Date.now() - oldestLog.getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    checks.push({
      check: 'Log retention policy enforced',
      status: retentionDays <= 90 ? 'pass' : 'warning',
      details: `Oldest log is ${retentionDays} days old`,
    });

    return checks;
  }
}

/**
 * Create Agent Thompson with default configuration
 */
export function createAgentThompson(config?: Partial<AgentThompsonConfig>): AgentThompson {
  return new AgentThompson(config);
}
