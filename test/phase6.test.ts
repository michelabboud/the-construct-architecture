/**
 * Phase 6 Tests - Security Architecture
 *
 * "Never send a human to do a machine's job." — Agent Smith
 *
 * Tests for:
 * - Seraph (API Gateway)
 * - Agent Smith (Security Director)
 * - Agent Brown (Authentication)
 * - Agent Jones (Authorization)
 * - Agent Johnson (Threat Detection)
 * - Agent Thompson (Audit)
 * - Agent Jackson (Incident Response)
 */

import {
  Seraph,
  createSeraph,
  type SecurityRequest,
} from '../src/security/seraph/seraph.js';

import {
  AgentSmith,
  createAgentSmith,
} from '../src/security/smith/agent-smith.js';

import {
  AgentBrown,
  createAgentBrown,
} from '../src/security/agents/brown.js';

import {
  AgentJones,
  createAgentJones,
} from '../src/security/agents/jones.js';

import {
  AgentJohnson,
  createAgentJohnson,
  type Activity,
} from '../src/security/agents/johnson.js';

import {
  AgentThompson,
  createAgentThompson,
} from '../src/security/agents/thompson.js';

import {
  AgentJackson,
  createAgentJackson,
} from '../src/security/agents/jackson.js';

import type {
  SecurityPrincipal,
  SecurityResource,
  SecurityAction,
  ThreatEvent,
  SecurityIncident,
} from '../src/types/security.js';

// Helper to create test request
function createTestRequest(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: `req-${Date.now()}`,
    timestamp: new Date(),
    method: 'GET',
    path: '/api/test',
    headers: {},
    metadata: {},
    ...overrides,
  };
}

// Helper to create test principal
function createTestPrincipal(overrides: Partial<SecurityPrincipal> = {}): SecurityPrincipal {
  return {
    id: `principal-${Date.now()}`,
    type: 'agent',
    name: 'Test Agent',
    roles: ['user'],
    attributes: {},
    ...overrides,
  };
}

// Helper to create test resource
function createTestResource(overrides: Partial<SecurityResource> = {}): SecurityResource {
  return {
    type: 'api',
    id: `resource-${Date.now()}`,
    attributes: {},
    ...overrides,
  };
}

// Helper to create test action
function createTestAction(overrides: Partial<SecurityAction> = {}): SecurityAction {
  return {
    type: 'api_call',
    operation: 'read',
    ...overrides,
  };
}

// ============ Seraph Tests ============

describe('Seraph (API Gateway)', () => {
  let seraph: Seraph;

  beforeEach(() => {
    seraph = createSeraph();
  });

  describe('Request Validation', () => {
    it('should allow valid requests', async () => {
      const request = createTestRequest();
      const response = await seraph.processRequest(request);

      expect(response.allowed).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should block requests with blocked paths', async () => {
      seraph = createSeraph({ blockedPaths: ['/admin/*'] });
      const request = createTestRequest({ path: '/admin/users' });
      const response = await seraph.processRequest(request);

      expect(response.allowed).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should block requests with invalid methods', async () => {
      seraph = createSeraph({ allowedMethods: ['GET', 'POST'] });
      const request = createTestRequest({ method: 'DELETE' });
      const result = await seraph.validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'INVALID_METHOD',
      }));
    });

    it('should detect SQL injection attempts', async () => {
      const request = createTestRequest({
        path: "/api/users?id=1' OR '1'='1",
      });
      const result = await seraph.validateRequest(request);

      expect(result.threatLevel).not.toBe('none');
    });

    it('should detect path traversal attempts', async () => {
      const request = createTestRequest({
        path: '/api/../../../etc/passwd',
      });
      const result = await seraph.validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'PATH_TRAVERSAL_DETECTED',
      }));
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', () => {
      const request = createTestRequest({ ip: '192.168.1.1' });
      const result = seraph.checkRateLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
    });

    it('should block requests over rate limit', async () => {
      seraph = createSeraph({
        rateLimitConfig: { maxRequests: 3, windowMs: 60000, keyBy: 'ip', onLimit: 'block' },
      });

      const request = createTestRequest({ ip: '192.168.1.1' });

      // Make 3 requests (should be allowed)
      for (let i = 0; i < 3; i++) {
        await seraph.processRequest(request);
      }

      // 4th request should be rate limited
      const response = await seraph.processRequest(request);
      expect(response.allowed).toBe(false);
      expect(response.status).toBe(429);
    });
  });

  describe('IP Blocking', () => {
    it('should block blocked IPs', async () => {
      seraph.blockIP('192.168.1.100', 60000, 'Test block');

      const request = createTestRequest({ ip: '192.168.1.100' });
      const response = await seraph.processRequest(request);

      expect(response.allowed).toBe(false);
      expect(response.errorCode).toBe('IP_BLOCKED');
    });

    it('should allow unblocking IPs', async () => {
      seraph.blockIP('192.168.1.100', 60000, 'Test block');
      seraph.unblockIP('192.168.1.100');

      const request = createTestRequest({ ip: '192.168.1.100' });
      const response = await seraph.processRequest(request);

      expect(response.allowed).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track request statistics', async () => {
      await seraph.processRequest(createTestRequest());
      await seraph.processRequest(createTestRequest());

      const stats = seraph.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.validRequests).toBe(2);
    });
  });
});

// ============ Agent Smith Tests ============

describe('Agent Smith (Security Director)', () => {
  let smith: AgentSmith;

  beforeEach(() => {
    smith = createAgentSmith();
  });

  describe('Policy Enforcement', () => {
    it('should allow system principals full access', () => {
      const principal = createTestPrincipal({ type: 'system' });
      const resource = createTestResource();
      const action = createTestAction({ operation: 'admin' });

      const decision = smith.enforcePolicy(principal, resource, action);

      expect(decision.allowed).toBe(true);
    });

    it('should deny unauthenticated access by default', () => {
      const principal = createTestPrincipal({ type: 'user' });
      const resource = createTestResource();
      const action = createTestAction();

      const decision = smith.enforcePolicy(principal, resource, action);

      expect(decision.allowed).toBe(false);
    });

    it('should add and evaluate custom policies', () => {
      smith.addPolicy({
        id: 'test-allow',
        name: 'Test Allow Policy',
        effect: 'allow',
        priority: 900,
        conditions: {
          principals: { roles: ['admin'] },
        },
        enabled: true,
      });

      const principal = createTestPrincipal({
        roles: ['admin'],
        authMetadata: { method: 'jwt', issuedAt: new Date() },
      });
      const resource = createTestResource();
      const action = createTestAction();

      const decision = smith.enforcePolicy(principal, resource, action);

      expect(decision.allowed).toBe(true);
      expect(decision.evaluatedPolicies).toContain('test-allow');
    });
  });

  describe('Threat Handling', () => {
    it('should handle threats and create responses', async () => {
      const threat: ThreatEvent = {
        id: 'threat-1',
        type: 'brute_force',
        level: 'high',
        source: { ip: '10.0.0.1' },
        target: {},
        description: 'Multiple failed login attempts',
        detectedAt: new Date(),
        indicators: [],
        status: 'detected',
        recommendedActions: [],
      };

      const response = await smith.handleThreat(threat);

      expect(response.threatId).toBe('threat-1');
      expect(response.actions.length).toBeGreaterThan(0);
    });

    it('should create incidents for high severity threats', async () => {
      const threat: ThreatEvent = {
        id: 'threat-critical',
        type: 'injection',
        level: 'critical',
        source: { ip: '10.0.0.2' },
        target: { resourceId: 'db-1' },
        description: 'SQL injection attack',
        detectedAt: new Date(),
        indicators: [],
        status: 'detected',
        recommendedActions: [],
      };

      await smith.handleThreat(threat);

      const incidents = smith.getAllIncidents();
      expect(incidents.length).toBeGreaterThan(0);
    });
  });

  describe('Special Agent Registration', () => {
    it('should register and retrieve Special Agents', () => {
      const brown = createAgentBrown();
      smith.registerAgent(brown);

      const agents = smith.getSpecialAgents();
      expect(agents).toContainEqual(expect.objectContaining({ name: 'Brown' }));
    });
  });

  describe('Security Status', () => {
    it('should report overall security status', () => {
      const status = smith.getSecurityStatus();

      expect(status.health).toBeDefined();
      expect(['healthy', 'degraded', 'critical']).toContain(status.health);
      expect(status.components).toBeInstanceOf(Array);
    });
  });
});

// ============ Agent Brown Tests ============

describe('Agent Brown (Authentication)', () => {
  let brown: AgentBrown;

  beforeEach(() => {
    brown = createAgentBrown();
  });

  describe('API Key Authentication', () => {
    it('should authenticate valid API keys', async () => {
      const principal = createTestPrincipal();
      brown.registerPrincipal(principal);
      const apiKey = brown.registerApiKey(principal.id, 'Test Key');

      const result = await brown.authenticate({ type: 'api_key', apiKey });

      expect(result.authenticated).toBe(true);
      expect(result.principal?.id).toBe(principal.id);
    });

    it('should reject invalid API keys', async () => {
      const result = await brown.authenticate({ type: 'api_key', apiKey: 'invalid-key' });

      expect(result.authenticated).toBe(false);
      expect(result.errorCode).toBe('invalid_credentials');
    });

    it('should reject revoked API keys', async () => {
      const principal = createTestPrincipal();
      brown.registerPrincipal(principal);
      const apiKey = brown.registerApiKey(principal.id, 'Test Key');
      brown.revokeApiKey(apiKey);

      const result = await brown.authenticate({ type: 'api_key', apiKey });

      expect(result.authenticated).toBe(false);
      expect(result.errorCode).toBe('revoked');
    });
  });

  describe('Session Management', () => {
    it('should create sessions', () => {
      const session = brown.createSession('user-1');

      expect(session.id).toBeDefined();
      expect(session.principalId).toBe('user-1');
      expect(session.active).toBe(true);
    });

    it('should revoke sessions', () => {
      const session = brown.createSession('user-1');
      brown.revokeSession(session.id);

      const retrieved = brown.getSession(session.id);
      expect(retrieved?.active).toBe(false);
    });

    it('should limit sessions per principal', () => {
      brown = createAgentBrown({ maxSessionsPerPrincipal: 2 });

      brown.createSession('user-1');
      brown.createSession('user-1');
      brown.createSession('user-1'); // Should revoke oldest

      const stats = brown.getStats();
      expect(stats.activeSessions).toBe(2);
    });
  });

  describe('Lockout Protection', () => {
    it('should lock out after too many failed attempts', async () => {
      brown = createAgentBrown({ maxFailedAttempts: 3 });

      for (let i = 0; i < 3; i++) {
        await brown.authenticate({ type: 'api_key', apiKey: 'bad-key' });
      }

      const result = await brown.authenticate({ type: 'api_key', apiKey: 'bad-key' });
      expect(result.errorCode).toBe('revoked');
    });
  });
});

// ============ Agent Jones Tests ============

describe('Agent Jones (Authorization)', () => {
  let jones: AgentJones;

  beforeEach(() => {
    jones = createAgentJones();
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin role full access', () => {
      const principal = createTestPrincipal({ roles: ['admin'] });
      const resource = createTestResource();
      const action = createTestAction({ operation: 'admin' });

      const result = jones.authorize(principal, resource, action);

      expect(result.authorized).toBe(true);
    });

    it('should deny unauthorized roles', () => {
      const principal = createTestPrincipal({ roles: ['guest'] });
      const resource = createTestResource();
      const action = createTestAction({ operation: 'delete' });

      const result = jones.authorize(principal, resource, action);

      expect(result.authorized).toBe(false);
    });
  });

  describe('Access Control Lists', () => {
    it('should allow access via ACL entries', () => {
      const principal = createTestPrincipal({ roles: [] });
      const resource = createTestResource({ id: 'special-resource' });
      const action = createTestAction({ operation: 'read' });

      jones.addAccessControlEntry({
        principalId: principal.id,
        resourcePattern: 'special-resource',
        operations: ['read'],
        effect: 'allow',
      });

      const result = jones.authorize(principal, resource, action);

      expect(result.authorized).toBe(true);
    });

    it('should deny via ACL explicit deny', () => {
      const principal = createTestPrincipal({ roles: ['admin'] });
      const resource = createTestResource({ id: 'protected-resource' });
      const action = createTestAction({ operation: 'read' });

      jones.addAccessControlEntry({
        principalId: principal.id,
        resourcePattern: 'protected-resource',
        operations: ['read'],
        effect: 'deny',
      });

      const result = jones.authorize(principal, resource, action);

      expect(result.authorized).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    it('should check specific permissions', () => {
      const hasReadAll = jones.checkPermission('user-1', 'read:*');
      expect(hasReadAll).toBe(false); // No roles for this principal
    });
  });

  describe('Caching', () => {
    it('should cache authorization results', () => {
      const principal = createTestPrincipal({ roles: ['admin'] });
      const resource = createTestResource();
      const action = createTestAction();

      // First call
      jones.authorize(principal, resource, action);
      // Second call (should hit cache)
      jones.authorize(principal, resource, action);

      const stats = jones.getStats();
      expect(stats.cacheHits).toBe(1);
    });
  });
});

// ============ Agent Johnson Tests ============

describe('Agent Johnson (Threat Detection)', () => {
  let johnson: AgentJohnson;

  beforeEach(() => {
    johnson = createAgentJohnson();
  });

  describe('Activity Analysis', () => {
    it('should analyze activities without detecting threats for normal activity', () => {
      const activity: Activity = {
        id: 'activity-1',
        type: 'api_call',
        timestamp: new Date(),
        outcome: 'success',
      };

      const analysis = johnson.analyzeActivity(activity);

      expect(analysis.threatDetected).toBe(false);
      expect(analysis.riskScore).toBeLessThan(50);
    });

    it('should detect threats matching signatures', () => {
      const activity: Activity = {
        id: 'activity-2',
        type: 'authentication',
        timestamp: new Date(),
        outcome: 'failure',
      };

      const analysis = johnson.analyzeActivity(activity);

      expect(analysis.threatDetected).toBe(true);
      expect(analysis.matchedSignatures).toContain('sig-brute-force');
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect timing anomalies', () => {
      const lateNight = new Date();
      lateNight.setHours(3); // 3 AM

      const result = johnson.detectAnomaly({
        principalId: 'user-1',
        actionType: 'api_call',
        timestamp: lateNight,
        success: true,
      });

      expect(result.isAnomaly).toBe(true);
      expect(result.type).toBe('timing');
    });
  });

  describe('Signature Management', () => {
    it('should add and use custom signatures', () => {
      johnson.addSignature({
        id: 'custom-sig',
        name: 'Custom Threat',
        threatType: 'policy_violation',
        severity: 'medium',
        pattern: [{ field: 'type', match: 'exact', value: 'forbidden_action' }],
        enabled: true,
      });

      const activity: Activity = {
        id: 'activity-3',
        type: 'forbidden_action',
        timestamp: new Date(),
        outcome: 'blocked',
      };

      const analysis = johnson.analyzeActivity(activity);

      expect(analysis.matchedSignatures).toContain('custom-sig');
    });
  });

  describe('Threat Management', () => {
    it('should track active threats', () => {
      const activity: Activity = {
        id: 'activity-4',
        type: 'authentication',
        timestamp: new Date(),
        outcome: 'failure',
      };

      johnson.analyzeActivity(activity);

      const threats = johnson.getActiveThreats();
      expect(threats.length).toBeGreaterThan(0);
    });

    it('should mark threats as false positive', () => {
      const activity: Activity = {
        id: 'activity-5',
        type: 'authentication',
        timestamp: new Date(),
        outcome: 'failure',
      };

      const analysis = johnson.analyzeActivity(activity);
      const threatId = analysis.threats[0]?.id;

      if (threatId) {
        johnson.markFalsePositive(threatId);
        const stats = johnson.getStats();
        expect(stats.falsePositives).toBe(1);
      }
    });
  });
});

// ============ Agent Thompson Tests ============

describe('Agent Thompson (Audit)', () => {
  let thompson: AgentThompson;

  beforeEach(() => {
    thompson = createAgentThompson();
  });

  describe('Event Logging', () => {
    it('should log security events', () => {
      const entry = thompson.logEvent({
        eventType: 'authentication',
        outcome: 'success',
        details: { method: 'api_key' },
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.integrityHash).toBeDefined();
    });

    it('should query logs by event type', () => {
      thompson.logEvent({ eventType: 'authentication', outcome: 'success', details: {} });
      thompson.logEvent({ eventType: 'authorization', outcome: 'success', details: {} });
      thompson.logEvent({ eventType: 'authentication', outcome: 'failure', details: {} });

      const authLogs = thompson.queryLogs({ eventType: 'authentication' });

      expect(authLogs.length).toBe(2);
    });

    it('should query logs by time range', () => {
      const past = new Date(Date.now() - 3600000);
      const now = new Date();

      thompson.logEvent({ eventType: 'authentication', outcome: 'success', details: {} });

      const logs = thompson.queryLogs({ startTime: past, endTime: now });

      expect(logs.length).toBe(1);
    });
  });

  describe('Integrity Verification', () => {
    it('should verify log integrity', () => {
      thompson.logEvent({ eventType: 'authentication', outcome: 'success', details: {} });
      thompson.logEvent({ eventType: 'authorization', outcome: 'success', details: {} });

      const result = thompson.verifyIntegrity();

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance reports', () => {
      // Log some events
      thompson.logEvent({ eventType: 'authentication', outcome: 'success', details: {} });
      thompson.logEvent({ eventType: 'authentication', outcome: 'failure', details: {} });
      thompson.logEvent({ eventType: 'authorization', outcome: 'success', details: {} });

      const period = {
        start: new Date(Date.now() - 3600000),
        end: new Date(),
      };

      const report = thompson.generateComplianceReport(period);

      expect(report.summary.totalEvents).toBe(3);
      expect(report.complianceChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Log Retention', () => {
    it('should purge expired logs', () => {
      thompson = createAgentThompson({ retentionPeriod: 0 }); // Immediate expiration

      thompson.logEvent({ eventType: 'authentication', outcome: 'success', details: {} });

      const purged = thompson.purgeExpiredLogs();

      expect(purged).toBe(1);
    });
  });
});

// ============ Agent Jackson Tests ============

describe('Agent Jackson (Incident Response)', () => {
  let jackson: AgentJackson;

  beforeEach(() => {
    jackson = createAgentJackson();
  });

  describe('Incident Response', () => {
    it('should create response plans for incidents', async () => {
      const incident: SecurityIncident = {
        id: 'incident-1',
        severity: 'high',
        title: 'Unauthorized access detected',
        description: 'Multiple unauthorized access attempts',
        threatEvents: ['threat-1'],
        affectedResources: [{ type: 'api', id: 'api-1', attributes: {} }],
        timeline: [{ timestamp: new Date(), event: 'Incident created' }],
        status: 'open',
        assignedTo: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const plan = await jackson.respondToIncident(incident);

      expect(plan.id).toBeDefined();
      expect(plan.incidentId).toBe('incident-1');
      expect(plan.actions.length).toBeGreaterThan(0);
    });
  });

  describe('Threat Containment', () => {
    it('should contain threats', async () => {
      const threat: ThreatEvent = {
        id: 'threat-2',
        type: 'brute_force',
        level: 'high',
        source: { ip: '10.0.0.5', principalId: 'attacker-1' },
        target: { resourceId: 'login-api' },
        description: 'Brute force attack',
        detectedAt: new Date(),
        indicators: [],
        status: 'detected',
        recommendedActions: [],
      };

      const result = await jackson.containThreat(threat);

      expect(result.success).toBe(true);
      expect(result.actions.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery', () => {
    it('should initiate recovery plans', async () => {
      const incident: SecurityIncident = {
        id: 'incident-2',
        severity: 'medium',
        title: 'Service disruption',
        description: 'Service was disrupted',
        threatEvents: [],
        affectedResources: [{ type: 'service', id: 'service-1', attributes: {} }],
        timeline: [{ timestamp: new Date(), event: 'Incident created' }],
        status: 'containing',
        assignedTo: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const status = await jackson.initiateRecovery(incident);

      expect(status.status).toBe('in_progress');
      expect(status.totalSteps).toBeGreaterThan(0);
    });
  });

  describe('Post-Incident Analysis', () => {
    it('should generate post-incident analysis', () => {
      const incident: SecurityIncident = {
        id: 'incident-3',
        severity: 'critical',
        title: 'Data breach',
        description: 'Potential data exfiltration detected',
        threatEvents: ['threat-3'],
        affectedResources: [{ type: 'database', id: 'db-1', attributes: {} }],
        timeline: [
          { timestamp: new Date(Date.now() - 3600000), event: 'Incident detected' },
          { timestamp: new Date(), event: 'Incident contained' },
        ],
        status: 'closed',
        assignedTo: ['security-team'],
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(),
        resolution: {
          summary: 'Incident resolved',
          rootCause: 'Misconfigured access control',
          closedAt: new Date(),
          closedBy: 'admin',
        },
      };

      const analysis = jackson.generateAnalysis(incident);

      expect(analysis.incidentId).toBe('incident-3');
      expect(analysis.summary.severity).toBe('critical');
      expect(analysis.rootCause?.identified).toBe(true);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });
});

// ============ Integration Tests ============

describe('Security Integration', () => {
  let smith: AgentSmith;
  let brown: AgentBrown;
  let jones: AgentJones;
  let johnson: AgentJohnson;
  let thompson: AgentThompson;
  let jackson: AgentJackson;

  beforeEach(() => {
    smith = createAgentSmith();
    brown = createAgentBrown();
    jones = createAgentJones();
    johnson = createAgentJohnson();
    thompson = createAgentThompson();
    jackson = createAgentJackson();

    // Register all agents with Smith
    smith.registerAgent(brown);
    smith.registerAgent(jones);
    smith.registerAgent(johnson);
    smith.registerAgent(thompson);
    smith.registerAgent(jackson);
  });

  it('should have all Special Agents registered', () => {
    const agents = smith.getSpecialAgents();
    expect(agents.length).toBe(5);
  });

  it('should report healthy status with all agents', () => {
    const status = smith.getSecurityStatus();
    expect(status.health).toBe('healthy');
    expect(status.components.length).toBeGreaterThan(1);
  });

  it('should handle full security workflow', async () => {
    // 1. Authenticate
    const principal = createTestPrincipal();
    brown.registerPrincipal(principal);
    const apiKey = brown.registerApiKey(principal.id, 'Test Key');
    const authResult = await brown.authenticate({ type: 'api_key', apiKey });

    expect(authResult.authenticated).toBe(true);
    expect(authResult.principal).toBeDefined();
    const authenticatedPrincipal = authResult.principal!;

    // 2. Log authentication event
    thompson.logEvent({
      eventType: 'authentication',
      principal: authenticatedPrincipal,
      outcome: 'success',
      details: { method: 'api_key' },
    });

    // 3. Authorize access
    const resource = createTestResource();
    const action = createTestAction();
    const authzResult = jones.authorize(authenticatedPrincipal, resource, action);

    // 4. Log authorization event
    thompson.logEvent({
      eventType: 'authorization',
      principal: authenticatedPrincipal,
      resource,
      action,
      outcome: authzResult.authorized ? 'success' : 'blocked',
      details: { reason: authzResult.reason },
    });

    // 5. Verify audit trail
    const logs = thompson.queryLogs({});
    expect(logs.length).toBe(2);
  });
});
