/**
 * Agent Smith - Security Director
 *
 * "I'd like to share a revelation that I've had during my time here.
 *  It came to me when I tried to classify your species and I realized
 *  that you're not actually mammals... You're a virus."
 *
 * Agent Smith is the Security Director of The Construct, coordinating
 * all Special Agents to enforce Zero Trust security principles.
 *
 * Responsibilities:
 * - Central security orchestration
 * - Policy enforcement coordination
 * - Threat correlation and response
 * - Special Agent team management
 * - Zero Trust framework enforcement
 *
 * Phase 6 Implementation
 */

import type {
  SecurityConfig,
  SecurityPolicy,
  SecurityPrincipal,
  SecurityResource,
  SecurityAction,
  SecurityStatus,
  ThreatEvent,
  ThreatLevel,
  SecurityIncident,
  ContainmentAction,
  // Future use: AuthenticationResult, AuthorizationResult,
} from '../../types/security.js';
import { Seraph, type SeraphConfig } from '../seraph/seraph.js';

/**
 * Policy decision
 */
export interface PolicyDecision {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Policies that were evaluated */
  evaluatedPolicies: string[];
  /** Policy that made the decision */
  decidingPolicy?: string;
  /** Reason for the decision */
  reason: string;
  /** Additional conditions or restrictions */
  conditions?: Record<string, unknown>;
  /** Timestamp of decision */
  timestamp: Date;
}

/**
 * Threat response
 */
export interface ThreatResponse {
  /** Response ID */
  id: string;
  /** Threat being responded to */
  threatId: string;
  /** Actions taken */
  actions: ContainmentAction[];
  /** Whether response was successful */
  success: boolean;
  /** Response summary */
  summary: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Special Agent interface
 */
export interface SpecialAgent {
  /** Agent name */
  name: string;
  /** Agent type */
  type: 'authentication' | 'authorization' | 'threat_detection' | 'audit' | 'incident_response';
  /** Health check */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string };
}

/**
 * Agent Smith configuration
 */
export interface AgentSmithConfig {
  /** Security configuration */
  securityConfig: Partial<SecurityConfig>;
  /** Seraph configuration */
  seraphConfig?: Partial<SeraphConfig>;
  /** Enable automatic threat response */
  autoResponse: boolean;
  /** Threat response delay in ms (for human review) */
  responseDelay: number;
  /** Maximum concurrent incidents */
  maxConcurrentIncidents: number;
  /** Policy evaluation mode */
  policyMode: 'first_match' | 'most_specific' | 'all_must_allow';
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  securityConfig: SecurityConfig;
  autoResponse: boolean;
  responseDelay: number;
  maxConcurrentIncidents: number;
  policyMode: 'first_match' | 'most_specific' | 'all_must_allow';
}

/**
 * Agent Smith - Security Director
 *
 * Coordinates all Special Agents and enforces Zero Trust security.
 */
export class AgentSmith {
  private config: InternalConfig;
  private seraph: Seraph;
  private policies: Map<string, SecurityPolicy> = new Map();
  private activeThreats: Map<string, ThreatEvent> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private specialAgents: Map<string, SpecialAgent> = new Map();
  private threatResponses: Map<string, ThreatResponse> = new Map();
  private startTime: number;
  private idCounter = 0;

  // Statistics
  private stats = {
    policyEvaluations: 0,
    policiesAllowed: 0,
    policiesDenied: 0,
    threatsDetected: 0,
    threatsContained: 0,
    incidentsCreated: 0,
    incidentsResolved: 0,
  };

  constructor(config: Partial<AgentSmithConfig> = {}) {
    const defaultSecurityConfig: SecurityConfig = {
      zeroTrust: true,
      defaultDeny: true,
      requireAuthentication: true,
      sessionTimeout: 3600000, // 1 hour
      maxAuthFailures: 5,
      lockoutDuration: 900000, // 15 minutes
      auditEnabled: true,
      auditRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
      threatSensitivity: 'medium',
      autoResponse: config.autoResponse ?? true,
      policies: [],
    };

    this.config = {
      securityConfig: {
        ...defaultSecurityConfig,
        ...config.securityConfig,
      },
      autoResponse: config.autoResponse ?? true,
      responseDelay: config.responseDelay ?? 0,
      maxConcurrentIncidents: config.maxConcurrentIncidents ?? 100,
      policyMode: config.policyMode ?? 'first_match',
    };

    this.seraph = new Seraph(config.seraphConfig);
    this.startTime = Date.now();

    // Initialize default policies
    this.initializeDefaultPolicies();
  }

  // ============ Policy Enforcement ============

  /**
   * Enforce a policy decision
   */
  enforcePolicy(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): PolicyDecision {
    this.stats.policyEvaluations++;
    const evaluatedPolicies: string[] = [];
    let decidingPolicy: string | undefined;
    let allowed = !this.config.securityConfig.defaultDeny;
    let reason = this.config.securityConfig.defaultDeny
      ? 'Default deny policy'
      : 'Default allow policy';

    // Get applicable policies sorted by priority
    const applicablePolicies = this.getApplicablePolicies(principal, resource, action);

    for (const policy of applicablePolicies) {
      evaluatedPolicies.push(policy.id);

      if (this.evaluatePolicy(policy, principal, resource, action)) {
        decidingPolicy = policy.id;

        if (policy.effect === 'deny') {
          allowed = false;
          reason = `Denied by policy: ${policy.name}`;
          if (this.config.policyMode === 'first_match') {
            break;
          }
        } else if (policy.effect === 'allow') {
          if (this.config.policyMode === 'all_must_allow') {
            allowed = true;
            reason = `Allowed by policy: ${policy.name}`;
          } else {
            allowed = true;
            reason = `Allowed by policy: ${policy.name}`;
            if (this.config.policyMode === 'first_match') {
              break;
            }
          }
        }
      }
    }

    if (allowed) {
      this.stats.policiesAllowed++;
    } else {
      this.stats.policiesDenied++;
    }

    const decision: PolicyDecision = {
      allowed,
      evaluatedPolicies,
      reason,
      timestamp: new Date(),
    };

    if (decidingPolicy) {
      decision.decidingPolicy = decidingPolicy;
    }

    return decision;
  }

  /**
   * Add a security policy
   */
  addPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a security policy
   */
  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): SecurityPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Update a policy
   */
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    this.policies.set(policyId, { ...policy, ...updates, id: policyId });
    return true;
  }

  // ============ Threat Management ============

  /**
   * Handle a threat event
   */
  async handleThreat(threat: ThreatEvent): Promise<ThreatResponse> {
    this.stats.threatsDetected++;
    this.activeThreats.set(threat.id, threat);

    const responseId = `response-${++this.idCounter}-${Date.now()}`;
    const actions: ContainmentAction[] = [];

    // Determine response based on threat level
    if (this.config.autoResponse) {
      // Wait for response delay (allows human review)
      if (this.config.responseDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.responseDelay));
      }

      // Execute containment actions based on threat type
      const containmentActions = this.determineContainmentActions(threat);
      for (const action of containmentActions) {
        const executed = await this.executeContainmentAction(action);
        actions.push(executed);
      }
    }

    // Create incident if threat level is high enough
    if (threat.level === 'high' || threat.level === 'critical') {
      this.createIncident(threat);
    }

    const success = actions.every(a => a.success);
    if (success) {
      this.stats.threatsContained++;
      threat.status = 'contained';
    }

    const response: ThreatResponse = {
      id: responseId,
      threatId: threat.id,
      actions,
      success,
      summary: success
        ? `Threat ${threat.id} contained with ${actions.length} action(s)`
        : `Threat ${threat.id} containment partial - some actions failed`,
      timestamp: new Date(),
    };

    this.threatResponses.set(responseId, response);
    return response;
  }

  /**
   * Get active threats
   */
  getActiveThreats(): ThreatEvent[] {
    return Array.from(this.activeThreats.values())
      .filter(t => t.status === 'detected' || t.status === 'investigating');
  }

  /**
   * Get threat by ID
   */
  getThreat(threatId: string): ThreatEvent | undefined {
    return this.activeThreats.get(threatId);
  }

  /**
   * Update threat status
   */
  updateThreatStatus(
    threatId: string,
    status: ThreatEvent['status']
  ): boolean {
    const threat = this.activeThreats.get(threatId);
    if (!threat) {
      return false;
    }

    threat.status = status;
    return true;
  }

  // ============ Incident Management ============

  /**
   * Create a security incident
   */
  createIncident(threat: ThreatEvent): SecurityIncident {
    if (this.incidents.size >= this.config.maxConcurrentIncidents) {
      // Archive oldest resolved incident
      const oldestResolved = Array.from(this.incidents.values())
        .filter(i => i.status === 'closed')
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())[0];

      if (oldestResolved) {
        this.incidents.delete(oldestResolved.id);
      }
    }

    const incident: SecurityIncident = {
      id: `incident-${++this.idCounter}-${Date.now()}`,
      severity: threat.level,
      title: `${threat.type} detected: ${threat.description.substring(0, 50)}`,
      description: threat.description,
      threatEvents: [threat.id],
      affectedResources: threat.target.resourceId
        ? [{
            type: threat.target.resourceType ?? 'unknown',
            id: threat.target.resourceId,
            ...(threat.target.path ? { path: threat.target.path } : {}),
            attributes: {},
          }]
        : [],
      timeline: [{
        timestamp: new Date(),
        event: 'Incident created from threat detection',
      }],
      status: 'open',
      assignedTo: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.incidents.set(incident.id, incident);
    this.stats.incidentsCreated++;

    return incident;
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all incidents
   */
  getAllIncidents(options?: {
    status?: SecurityIncident['status'];
    severity?: ThreatLevel;
  }): SecurityIncident[] {
    let incidents = Array.from(this.incidents.values());

    if (options?.status) {
      incidents = incidents.filter(i => i.status === options.status);
    }
    if (options?.severity) {
      incidents = incidents.filter(i => i.severity === options.severity);
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update incident
   */
  updateIncident(
    incidentId: string,
    updates: Partial<Pick<SecurityIncident, 'status' | 'assignedTo'>> & { event?: string }
  ): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    if (updates.status) {
      incident.status = updates.status;
      if (updates.status === 'closed') {
        this.stats.incidentsResolved++;
      }
    }

    if (updates.assignedTo) {
      incident.assignedTo = updates.assignedTo;
    }

    if (updates.event) {
      incident.timeline.push({
        timestamp: new Date(),
        event: updates.event,
      });
    }

    incident.updatedAt = new Date();
    return true;
  }

  /**
   * Resolve an incident
   */
  resolveIncident(
    incidentId: string,
    resolution: NonNullable<SecurityIncident['resolution']>
  ): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    incident.status = 'closed';
    incident.resolution = resolution;
    incident.updatedAt = new Date();

    const timelineEntry: SecurityIncident['timeline'][0] = {
      timestamp: new Date(),
      event: `Incident resolved: ${resolution.summary}`,
    };
    if (resolution.closedBy) {
      timelineEntry.actor = resolution.closedBy;
    }
    incident.timeline.push(timelineEntry);

    this.stats.incidentsResolved++;
    return true;
  }

  // ============ Special Agent Management ============

  /**
   * Register a Special Agent
   */
  registerAgent(agent: SpecialAgent): void {
    this.specialAgents.set(agent.name, agent);
  }

  /**
   * Unregister a Special Agent
   */
  unregisterAgent(name: string): boolean {
    return this.specialAgents.delete(name);
  }

  /**
   * Get registered Special Agents
   */
  getSpecialAgents(): SpecialAgent[] {
    return Array.from(this.specialAgents.values());
  }

  /**
   * Get Special Agent by name
   */
  getSpecialAgent(name: string): SpecialAgent | undefined {
    return this.specialAgents.get(name);
  }

  // ============ Status & Health ============

  /**
   * Get overall security status
   */
  getSecurityStatus(): SecurityStatus {
    const seraphHealth = this.seraph.getHealth();
    const componentStatuses: SecurityStatus['components'] = [
      {
        name: 'Seraph (API Gateway)',
        status: seraphHealth.status === 'healthy' ? 'up' : 'degraded',
        lastCheck: new Date(),
        message: seraphHealth.message,
      },
    ];

    // Add Special Agent statuses
    for (const agent of this.specialAgents.values()) {
      const health = agent.getHealth();
      const entry: SecurityStatus['components'][0] = {
        name: `Special Agent ${agent.name}`,
        status: health.status,
        lastCheck: new Date(),
      };
      if (health.message) {
        entry.message = health.message;
      }
      componentStatuses.push(entry);
    }

    const allHealthy = componentStatuses.every(c => c.status === 'up');
    const anyDown = componentStatuses.some(c => c.status === 'down');

    const openIncidents = this.getAllIncidents({ status: 'open' }).length +
      this.getAllIncidents({ status: 'investigating' }).length +
      this.getAllIncidents({ status: 'containing' }).length;

    return {
      health: anyDown ? 'critical' : allHealthy ? 'healthy' : 'degraded',
      components: componentStatuses,
      activeThreats: this.getActiveThreats().length,
      openIncidents,
      recentAuthFailures: 0, // Would be populated by Agent Brown
      rateLimitStatus: {
        currentLoad: 0,
        threshold: 100,
        isThrottling: false,
      },
      uptimeMs: Date.now() - this.startTime,
    };
  }

  /**
   * Get Seraph instance
   */
  getSeraph(): Seraph {
    return this.seraph;
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config.securityConfig };
  }

  // ============ Private Methods ============

  private initializeDefaultPolicies(): void {
    // System access policy
    this.addPolicy({
      id: 'system-admin-access',
      name: 'System Administrator Access',
      description: 'Allow system principals full access',
      effect: 'allow',
      priority: 1000,
      conditions: {
        principals: { types: ['system'] },
      },
      enabled: true,
    });

    // Default deny for unauthenticated
    this.addPolicy({
      id: 'deny-unauthenticated',
      name: 'Deny Unauthenticated Access',
      description: 'Deny access to unauthenticated principals',
      effect: 'deny',
      priority: 100,
      conditions: {
        principals: { types: ['user', 'agent', 'service'] },
        custom: (principal) => !principal.authMetadata,
      },
      enabled: this.config.securityConfig.requireAuthentication,
    });

    // Rate limit admin operations
    this.addPolicy({
      id: 'protect-admin-ops',
      name: 'Protect Admin Operations',
      description: 'Require admin role for admin operations',
      effect: 'deny',
      priority: 500,
      conditions: {
        actions: { operations: ['admin'] },
        custom: (principal) => !principal.roles.includes('admin'),
      },
      enabled: true,
    });
  }

  private getApplicablePolicies(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): SecurityPolicy[] {
    return Array.from(this.policies.values())
      .filter(p => p.enabled)
      .filter(p => this.policyApplies(p, principal, resource, action))
      .sort((a, b) => b.priority - a.priority);
  }

  private policyApplies(
    policy: SecurityPolicy,
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): boolean {
    const conditions = policy.conditions;

    // Check principal conditions
    if (conditions.principals) {
      const pc = conditions.principals;
      if (pc.types && !pc.types.includes(principal.type)) return false;
      if (pc.roles && !pc.roles.some(r => principal.roles.includes(r))) return false;
      if (pc.ids && !pc.ids.includes(principal.id)) return false;
    }

    // Check resource conditions
    if (conditions.resources) {
      const rc = conditions.resources;
      if (rc.types && !rc.types.includes(resource.type)) return false;
      if (rc.owners && resource.owner && !rc.owners.includes(resource.owner)) return false;
      if (rc.paths && resource.path) {
        const matches = rc.paths.some(pattern => this.matchPath(pattern, resource.path!));
        if (!matches) return false;
      }
    }

    // Check action conditions
    if (conditions.actions) {
      const ac = conditions.actions;
      if (ac.types && !ac.types.includes(action.type)) return false;
      if (ac.operations && !ac.operations.includes(action.operation)) return false;
    }

    // Check time conditions
    if (conditions.time) {
      const tc = conditions.time;
      const now = new Date();
      if (tc.after && now < tc.after) return false;
      if (tc.before && now > tc.before) return false;
      if (tc.daysOfWeek && !tc.daysOfWeek.includes(now.getDay())) return false;
      if (tc.hoursOfDay) {
        const hour = now.getHours();
        if (hour < tc.hoursOfDay.start || hour >= tc.hoursOfDay.end) return false;
      }
    }

    return true;
  }

  private evaluatePolicy(
    policy: SecurityPolicy,
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): boolean {
    // Custom condition takes precedence
    if (policy.conditions.custom) {
      return policy.conditions.custom(principal, resource, action);
    }

    // If no custom condition, policy applies if it matched in policyApplies
    return true;
  }

  private matchPath(pattern: string, path: string): boolean {
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }

  private determineContainmentActions(threat: ThreatEvent): Omit<ContainmentAction, 'executedAt' | 'success'>[] {
    const actions: Omit<ContainmentAction, 'executedAt' | 'success'>[] = [];

    switch (threat.type) {
      case 'brute_force':
        if (threat.source.ip) {
          actions.push({
            type: 'block_ip',
            target: threat.source.ip,
            reason: 'Brute force attack detected',
            durationMs: 3600000, // 1 hour
          });
        }
        if (threat.source.principalId) {
          actions.push({
            type: 'revoke_session',
            target: threat.source.principalId,
            reason: 'Session revoked due to brute force detection',
            durationMs: 0,
          });
        }
        break;

      case 'unauthorized_access':
        if (threat.source.principalId) {
          actions.push({
            type: 'block_principal',
            target: threat.source.principalId,
            reason: 'Unauthorized access attempt',
            durationMs: 1800000, // 30 minutes
          });
        }
        break;

      case 'injection':
      case 'dos':
        if (threat.source.ip) {
          actions.push({
            type: 'block_ip',
            target: threat.source.ip,
            reason: `${threat.type} attack detected`,
            durationMs: 86400000, // 24 hours
          });
        }
        break;

      case 'data_exfiltration':
        if (threat.target.resourceId) {
          actions.push({
            type: 'disable_resource',
            target: threat.target.resourceId,
            reason: 'Potential data exfiltration',
            durationMs: 0, // Permanent until manually reviewed
          });
        }
        actions.push({
          type: 'alert',
          target: 'security_team',
          reason: 'Data exfiltration detected - immediate review required',
          durationMs: 0,
        });
        break;

      default:
        actions.push({
          type: 'alert',
          target: 'security_team',
          reason: `Threat detected: ${threat.description}`,
          durationMs: 0,
        });
    }

    return actions;
  }

  private async executeContainmentAction(
    action: Omit<ContainmentAction, 'executedAt' | 'success'>
  ): Promise<ContainmentAction> {
    const result: ContainmentAction = {
      ...action,
      executedAt: new Date(),
      success: false,
    };

    try {
      switch (action.type) {
        case 'block_ip':
          this.seraph.blockIP(action.target, action.durationMs, action.reason);
          result.success = true;
          result.rollback = async () => {
            this.seraph.unblockIP(action.target);
          };
          break;

        case 'alert':
          // In a real implementation, this would send notifications
          console.log(`[SECURITY ALERT] ${action.reason} - Target: ${action.target}`);
          result.success = true;
          break;

        case 'block_principal':
        case 'revoke_session':
        case 'disable_resource':
        case 'isolate':
          // These would be handled by specific Special Agents
          // For now, mark as successful (placeholder)
          result.success = true;
          break;
      }
    } catch (_error) {
      result.success = false;
    }

    return result;
  }
}

/**
 * Create Agent Smith with default configuration
 */
export function createAgentSmith(config?: Partial<AgentSmithConfig>): AgentSmith {
  return new AgentSmith(config);
}
