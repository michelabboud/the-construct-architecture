/**
 * Special Agent Jackson - Incident Response
 *
 * "I think we can handle one little girl."
 *
 * Special Agent Jackson handles all incident response responsibilities:
 * - Automated response orchestration
 * - Containment procedures
 * - Recovery coordination
 * - Post-incident analysis
 *
 * Phase 6 Implementation
 */

import type {
  SecurityIncident,
  ThreatEvent,
  ThreatLevel,
  ContainmentAction,
  RecoveryPlan,
  // Future use: SecurityResource,
} from '../../types/security.js';
import type { SpecialAgent } from '../smith/agent-smith.js';

/**
 * Response plan
 */
export interface ResponsePlan {
  /** Plan ID */
  id: string;
  /** Incident ID */
  incidentId: string;
  /** Plan priority */
  priority: 'immediate' | 'high' | 'medium' | 'low';
  /** Planned actions */
  actions: PlannedAction[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Plan status */
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  /** Creation timestamp */
  createdAt: Date;
  /** Execution start time */
  startedAt?: Date;
  /** Completion time */
  completedAt?: Date;
}

/**
 * Planned action
 */
export interface PlannedAction {
  /** Action ID */
  id: string;
  /** Action type */
  type: ContainmentAction['type'] | 'investigate' | 'notify' | 'backup' | 'restore';
  /** Action description */
  description: string;
  /** Target of the action */
  target: string;
  /** Action priority order */
  order: number;
  /** Status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  /** Result details */
  result?: {
    success: boolean;
    message: string;
    timestamp: Date;
  };
  /** Dependencies (other action IDs that must complete first) */
  dependsOn?: string[];
}

/**
 * Containment result
 */
export interface ContainmentResult {
  /** Whether containment was successful */
  success: boolean;
  /** Containment actions executed */
  actions: ContainmentAction[];
  /** Timestamp */
  timestamp: Date;
  /** Summary */
  summary: string;
  /** Remaining risks */
  remainingRisks: string[];
}

/**
 * Recovery status
 */
export interface RecoveryStatus {
  /** Recovery plan ID */
  planId: string;
  /** Incident ID */
  incidentId: string;
  /** Overall status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Progress percentage */
  progress: number;
  /** Current step */
  currentStep?: string;
  /** Completed steps */
  completedSteps: number;
  /** Total steps */
  totalSteps: number;
  /** Estimated time remaining in minutes */
  estimatedTimeRemaining?: number;
  /** Last update timestamp */
  lastUpdate: Date;
}

/**
 * Post-incident analysis
 */
export interface PostIncidentAnalysis {
  /** Incident ID */
  incidentId: string;
  /** Analysis timestamp */
  timestamp: Date;
  /** Incident summary */
  summary: {
    type: string;
    severity: ThreatLevel;
    duration: number; // minutes
    affectedResources: number;
  };
  /** Root cause analysis */
  rootCause?: {
    identified: boolean;
    description?: string;
    factors: string[];
  };
  /** Timeline of events */
  timeline: Array<{
    time: Date;
    event: string;
    actor?: string;
  }>;
  /** Impact assessment */
  impact: {
    dataCompromised: boolean;
    serviceDisruption: boolean;
    financialImpact?: number;
    reputationalImpact: 'none' | 'low' | 'medium' | 'high';
  };
  /** Lessons learned */
  lessonsLearned: string[];
  /** Recommended improvements */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    category: 'process' | 'technology' | 'training' | 'policy';
  }>;
}

/**
 * Agent Jackson configuration
 */
export interface AgentJacksonConfig {
  /** Enable automatic containment (default: true) */
  autoContainment: boolean;
  /** Maximum concurrent response plans (default: 10) */
  maxConcurrentPlans: number;
  /** Default response timeout in minutes (default: 60) */
  defaultTimeoutMinutes: number;
  /** Enable notifications (default: true) */
  enableNotifications: boolean;
  /** Notification channels */
  notificationChannels?: string[];
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  autoContainment: boolean;
  maxConcurrentPlans: number;
  defaultTimeoutMinutes: number;
  enableNotifications: boolean;
  notificationChannels: string[];
}

/**
 * Special Agent Jackson - Incident Response Agent
 */
export class AgentJackson implements SpecialAgent {
  readonly name = 'Jackson';
  readonly type = 'incident_response' as const;

  private config: InternalConfig;
  private responsePlans: Map<string, ResponsePlan> = new Map();
  private recoveryPlans: Map<string, RecoveryPlan> = new Map();
  private containmentHistory: Map<string, ContainmentAction[]> = new Map(); // threatId -> actions
  private analyses: Map<string, PostIncidentAnalysis> = new Map();
  private planIdCounter = 0;

  // Statistics
  private stats = {
    incidentsResponded: 0,
    threatsContained: 0,
    recoveriesCompleted: 0,
    analysesGenerated: 0,
    averageResponseTime: 0,
  };

  constructor(config: Partial<AgentJacksonConfig> = {}) {
    this.config = {
      autoContainment: config.autoContainment ?? true,
      maxConcurrentPlans: config.maxConcurrentPlans ?? 10,
      defaultTimeoutMinutes: config.defaultTimeoutMinutes ?? 60,
      enableNotifications: config.enableNotifications ?? true,
      notificationChannels: config.notificationChannels ?? ['security_team'],
    };
  }

  /**
   * Respond to an incident
   */
  async respondToIncident(incident: SecurityIncident): Promise<ResponsePlan> {
    this.stats.incidentsResponded++;

    const plan = this.createResponsePlan(incident);
    this.responsePlans.set(plan.id, plan);

    if (this.config.autoContainment) {
      // Execute the plan automatically
      await this.executePlan(plan.id);
    }

    return plan;
  }

  /**
   * Contain a threat
   */
  async containThreat(threat: ThreatEvent): Promise<ContainmentResult> {
    const startTime = Date.now();
    const actions: ContainmentAction[] = [];
    const remainingRisks: string[] = [];

    // Determine containment actions based on threat type
    const plannedActions = this.planContainmentActions(threat);

    for (const planned of plannedActions) {
      const action = await this.executeContainmentAction(planned, threat);
      actions.push(action);

      if (!action.success) {
        remainingRisks.push(`Failed to ${planned.type}: ${planned.target}`);
      }
    }

    // Store containment history
    this.containmentHistory.set(threat.id, actions);

    const success = actions.every(a => a.success);
    if (success) {
      this.stats.threatsContained++;
    }

    // Update response time statistics
    const responseTime = (Date.now() - startTime) / 60000; // minutes
    this.updateAverageResponseTime(responseTime);

    return {
      success,
      actions,
      timestamp: new Date(),
      summary: success
        ? `Threat ${threat.id} successfully contained with ${actions.length} action(s)`
        : `Partial containment of threat ${threat.id}: ${actions.filter(a => a.success).length}/${actions.length} actions successful`,
      remainingRisks,
    };
  }

  /**
   * Initiate recovery for an incident
   */
  async initiateRecovery(incident: SecurityIncident): Promise<RecoveryStatus> {
    const plan = this.createRecoveryPlan(incident);
    this.recoveryPlans.set(plan.id, plan);

    // Start recovery execution
    this.executeRecoveryPlan(plan.id);

    const result: RecoveryStatus = {
      planId: plan.id,
      incidentId: incident.id,
      status: 'in_progress',
      progress: 0,
      completedSteps: 0,
      totalSteps: plan.steps.length,
      estimatedTimeRemaining: plan.steps.length * 5, // Estimate 5 min per step
      lastUpdate: new Date(),
    };

    const currentStep = plan.steps[0]?.description;
    if (currentStep) {
      result.currentStep = currentStep;
    }

    return result;
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus(planId: string): RecoveryStatus | undefined {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) return undefined;

    const completedSteps = plan.steps.filter(s => s.status === 'completed').length;
    const currentStepObj = plan.steps.find(s => s.status === 'in_progress');

    const result: RecoveryStatus = {
      planId: plan.id,
      incidentId: plan.incidentId,
      status: plan.status,
      progress: Math.round((completedSteps / plan.steps.length) * 100),
      completedSteps,
      totalSteps: plan.steps.length,
      lastUpdate: new Date(),
    };

    if (currentStepObj?.description) {
      result.currentStep = currentStepObj.description;
    }

    return result;
  }

  /**
   * Generate post-incident analysis
   */
  generateAnalysis(incident: SecurityIncident): PostIncidentAnalysis {
    this.stats.analysesGenerated++;

    const duration = incident.resolution?.closedAt
      ? (incident.resolution.closedAt.getTime() - incident.createdAt.getTime()) / 60000
      : (Date.now() - incident.createdAt.getTime()) / 60000;

    const rootCause: PostIncidentAnalysis['rootCause'] = {
      identified: !!incident.resolution?.rootCause,
      factors: this.identifyContributingFactors(incident),
    };
    if (incident.resolution?.rootCause) {
      rootCause.description = incident.resolution.rootCause;
    }

    // Map timeline entries to the correct format
    const timeline: PostIncidentAnalysis['timeline'] = incident.timeline.map(entry => {
      const mapped: PostIncidentAnalysis['timeline'][0] = {
        time: entry.timestamp,
        event: entry.event,
      };
      if (entry.actor) {
        mapped.actor = entry.actor;
      }
      return mapped;
    });

    const analysis: PostIncidentAnalysis = {
      incidentId: incident.id,
      timestamp: new Date(),
      summary: {
        type: incident.title,
        severity: incident.severity,
        duration: Math.round(duration),
        affectedResources: incident.affectedResources.length,
      },
      rootCause,
      timeline,
      impact: this.assessImpact(incident),
      lessonsLearned: this.identifyLessons(incident),
      recommendations: this.generateRecommendations(incident),
    };

    this.analyses.set(incident.id, analysis);
    return analysis;
  }

  /**
   * Get response plan
   */
  getResponsePlan(planId: string): ResponsePlan | undefined {
    return this.responsePlans.get(planId);
  }

  /**
   * Get all active response plans
   */
  getActiveResponsePlans(): ResponsePlan[] {
    return Array.from(this.responsePlans.values())
      .filter(p => p.status === 'pending' || p.status === 'executing');
  }

  /**
   * Cancel a response plan
   */
  cancelPlan(planId: string): boolean {
    const plan = this.responsePlans.get(planId);
    if (!plan || plan.status === 'completed' || plan.status === 'cancelled') {
      return false;
    }
    plan.status = 'cancelled';
    return true;
  }

  /**
   * Get containment history for a threat
   */
  getContainmentHistory(threatId: string): ContainmentAction[] {
    return this.containmentHistory.get(threatId) ?? [];
  }

  /**
   * Get post-incident analysis
   */
  getAnalysis(incidentId: string): PostIncidentAnalysis | undefined {
    return this.analyses.get(incidentId);
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string } {
    const activePlans = this.getActiveResponsePlans().length;
    if (activePlans >= this.config.maxConcurrentPlans) {
      return { status: 'degraded', message: 'At maximum capacity for response plans' };
    }
    return { status: 'up' };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { activeResponsePlans: number; activeRecoveries: number } {
    return {
      ...this.stats,
      activeResponsePlans: this.getActiveResponsePlans().length,
      activeRecoveries: Array.from(this.recoveryPlans.values())
        .filter(p => p.status === 'in_progress').length,
    };
  }

  // ============ Private Methods ============

  private createResponsePlan(incident: SecurityIncident): ResponsePlan {
    const actions = this.planResponseActions(incident);

    return {
      id: `response-${++this.planIdCounter}-${Date.now()}`,
      incidentId: incident.id,
      priority: this.determinePriority(incident.severity),
      actions,
      estimatedDuration: this.estimateDuration(actions),
      status: 'pending',
      createdAt: new Date(),
    };
  }

  private planResponseActions(incident: SecurityIncident): PlannedAction[] {
    const actions: PlannedAction[] = [];
    let order = 0;

    // Always start with notification
    if (this.config.enableNotifications) {
      actions.push({
        id: `action-${++order}`,
        type: 'notify',
        description: 'Notify security team',
        target: this.config.notificationChannels.join(','),
        order,
        status: 'pending',
      });
    }

    // Investigation step
    actions.push({
      id: `action-${++order}`,
      type: 'investigate',
      description: 'Gather initial evidence and scope',
      target: incident.id,
      order,
      status: 'pending',
    });

    // Containment based on severity
    if (incident.severity === 'high' || incident.severity === 'critical') {
      // Immediate containment
      for (const resource of incident.affectedResources) {
        actions.push({
          id: `action-${++order}`,
          type: 'isolate',
          description: `Isolate affected resource: ${resource.id}`,
          target: resource.id,
          order,
          status: 'pending',
        });
      }
    }

    // Backup affected resources
    for (const resource of incident.affectedResources) {
      actions.push({
        id: `action-${++order}`,
        type: 'backup',
        description: `Backup resource: ${resource.id}`,
        target: resource.id,
        order,
        status: 'pending',
        dependsOn: actions
          .filter(a => a.type === 'isolate' && a.target === resource.id)
          .map(a => a.id),
      });
    }

    return actions;
  }

  private async executePlan(planId: string): Promise<void> {
    const plan = this.responsePlans.get(planId);
    if (!plan) return;

    plan.status = 'executing';
    plan.startedAt = new Date();

    for (const action of plan.actions.sort((a, b) => a.order - b.order)) {
      // Check dependencies
      if (action.dependsOn) {
        const depsComplete = action.dependsOn.every(depId => {
          const dep = plan.actions.find(a => a.id === depId);
          return dep?.status === 'completed';
        });
        if (!depsComplete) {
          action.status = 'skipped';
          continue;
        }
      }

      action.status = 'in_progress';

      try {
        // Execute action (simplified)
        await this.executeAction(action);
        action.status = 'completed';
        action.result = {
          success: true,
          message: `Action ${action.type} completed successfully`,
          timestamp: new Date(),
        };
      } catch (error) {
        action.status = 'failed';
        action.result = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        };
      }
    }

    const allSuccess = plan.actions.every(a => a.status === 'completed' || a.status === 'skipped');
    plan.status = allSuccess ? 'completed' : 'failed';
    plan.completedAt = new Date();
  }

  private async executeAction(action: PlannedAction): Promise<void> {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 10));

    // In a real implementation, this would dispatch to appropriate handlers
    switch (action.type) {
      case 'notify':
        console.log(`[NOTIFICATION] ${action.description} to ${action.target}`);
        break;
      case 'investigate':
        console.log(`[INVESTIGATE] ${action.description}`);
        break;
      case 'isolate':
        console.log(`[ISOLATE] ${action.description}`);
        break;
      case 'backup':
        console.log(`[BACKUP] ${action.description}`);
        break;
      case 'restore':
        console.log(`[RESTORE] ${action.description}`);
        break;
    }
  }

  private planContainmentActions(threat: ThreatEvent): Array<{ type: ContainmentAction['type']; target: string; reason: string; durationMs: number }> {
    const actions: Array<{ type: ContainmentAction['type']; target: string; reason: string; durationMs: number }> = [];

    // Block source
    if (threat.source.ip) {
      actions.push({
        type: 'block_ip',
        target: threat.source.ip,
        reason: `Blocking IP due to ${threat.type}`,
        durationMs: threat.level === 'critical' ? 86400000 : 3600000, // 24h or 1h
      });
    }

    if (threat.source.principalId) {
      if (threat.level === 'high' || threat.level === 'critical') {
        actions.push({
          type: 'block_principal',
          target: threat.source.principalId,
          reason: `Blocking principal due to ${threat.type}`,
          durationMs: 3600000, // 1 hour
        });
      }

      actions.push({
        type: 'revoke_session',
        target: threat.source.principalId,
        reason: 'Session revoked for security',
        durationMs: 0,
      });
    }

    // Protect target
    if (threat.target.resourceId && threat.level === 'critical') {
      actions.push({
        type: 'disable_resource',
        target: threat.target.resourceId,
        reason: 'Resource disabled pending investigation',
        durationMs: 0,
      });
    }

    // Always alert
    actions.push({
      type: 'alert',
      target: 'security_team',
      reason: `${threat.level.toUpperCase()} threat: ${threat.description}`,
      durationMs: 0,
    });

    return actions;
  }

  private async executeContainmentAction(
    planned: { type: ContainmentAction['type']; target: string; reason: string; durationMs: number },
    _threat: ThreatEvent
  ): Promise<ContainmentAction> {
    // In a real implementation, this would integrate with Seraph and Agent Smith
    console.log(`[CONTAINMENT] ${planned.type}: ${planned.target} - ${planned.reason}`);

    return {
      ...planned,
      executedAt: new Date(),
      success: true, // Simplified - would have actual execution logic
    };
  }

  private createRecoveryPlan(incident: SecurityIncident): RecoveryPlan {
    const steps: RecoveryPlan['steps'] = [];
    let order = 0;

    // Assessment step
    steps.push({
      order: ++order,
      description: 'Assess current system state',
      status: 'pending',
    });

    // Verification step
    steps.push({
      order: ++order,
      description: 'Verify threat is fully contained',
      status: 'pending',
    });

    // Recovery steps for each affected resource
    for (const resource of incident.affectedResources) {
      steps.push({
        order: ++order,
        description: `Restore resource: ${resource.id}`,
        status: 'pending',
      });
    }

    // Validation step
    steps.push({
      order: ++order,
      description: 'Validate system integrity',
      status: 'pending',
    });

    // Monitoring step
    steps.push({
      order: order + 1,
      description: 'Enable enhanced monitoring',
      status: 'pending',
    });

    return {
      id: `recovery-${Date.now()}`,
      incidentId: incident.id,
      steps,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  private async executeRecoveryPlan(planId: string): Promise<void> {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) return;

    plan.status = 'in_progress';

    for (const step of plan.steps.sort((a, b) => a.order - b.order)) {
      step.status = 'in_progress';
      step.startedAt = new Date();

      try {
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 10));
        step.status = 'completed';
        step.completedAt = new Date();
      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        plan.status = 'failed';
        return;
      }
    }

    plan.status = 'completed';
    plan.completedAt = new Date();
    this.stats.recoveriesCompleted++;
  }

  private determinePriority(severity: ThreatLevel): ResponsePlan['priority'] {
    switch (severity) {
      case 'critical': return 'immediate';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private estimateDuration(actions: PlannedAction[]): number {
    // Estimate 5 minutes per action
    return actions.length * 5;
  }

  private updateAverageResponseTime(newTime: number): void {
    const total = this.stats.incidentsResponded;
    const current = this.stats.averageResponseTime;
    this.stats.averageResponseTime = (current * (total - 1) + newTime) / total;
  }

  private identifyContributingFactors(incident: SecurityIncident): string[] {
    const factors: string[] = [];

    // Analyze incident for common factors
    if (incident.description.toLowerCase().includes('unauthorized')) {
      factors.push('Insufficient access controls');
    }
    if (incident.description.toLowerCase().includes('brute force')) {
      factors.push('Weak rate limiting');
      factors.push('Lack of account lockout');
    }
    if (incident.description.toLowerCase().includes('injection')) {
      factors.push('Insufficient input validation');
    }
    if (incident.affectedResources.length > 3) {
      factors.push('Inadequate network segmentation');
    }

    if (factors.length === 0) {
      factors.push('Under investigation');
    }

    return factors;
  }

  private assessImpact(incident: SecurityIncident): PostIncidentAnalysis['impact'] {
    return {
      dataCompromised: incident.description.toLowerCase().includes('data') ||
        incident.description.toLowerCase().includes('exfiltration'),
      serviceDisruption: incident.affectedResources.length > 0,
      reputationalImpact: incident.severity === 'critical' ? 'high' :
        incident.severity === 'high' ? 'medium' : 'low',
    };
  }

  private identifyLessons(incident: SecurityIncident): string[] {
    const lessons: string[] = [];

    // Generate lessons based on incident
    lessons.push('Review and update incident response procedures');

    if (incident.severity === 'critical' || incident.severity === 'high') {
      lessons.push('Improve early detection mechanisms');
      lessons.push('Conduct security awareness training');
    }

    if (incident.affectedResources.length > 1) {
      lessons.push('Review blast radius and segmentation');
    }

    lessons.push('Document findings for future reference');

    return lessons;
  }

  private generateRecommendations(incident: SecurityIncident): PostIncidentAnalysis['recommendations'] {
    const recommendations: PostIncidentAnalysis['recommendations'] = [];

    recommendations.push({
      priority: 'high',
      description: 'Review and strengthen access controls',
      category: 'technology',
    });

    recommendations.push({
      priority: 'medium',
      description: 'Update incident response playbook',
      category: 'process',
    });

    recommendations.push({
      priority: 'medium',
      description: 'Conduct post-incident security training',
      category: 'training',
    });

    if (incident.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        description: 'Implement additional monitoring and alerting',
        category: 'technology',
      });
    }

    return recommendations;
  }
}

/**
 * Create Agent Jackson with default configuration
 */
export function createAgentJackson(config?: Partial<AgentJacksonConfig>): AgentJackson {
  return new AgentJackson(config);
}
