/**
 * Security Type Definitions for The Construct
 *
 * "Never send a human to do a machine's job." — Agent Smith
 *
 * Phase 6 Implementation
 */

/**
 * Security principal (who is making the request)
 */
export interface SecurityPrincipal {
  /** Unique identifier for the principal */
  id: string;
  /** Type of principal */
  type: 'agent' | 'user' | 'service' | 'system';
  /** Display name */
  name: string;
  /** Roles assigned to this principal */
  roles: string[];
  /** Additional attributes for ABAC */
  attributes: Record<string, string | number | boolean>;
  /** Authentication metadata */
  authMetadata?: {
    method: 'api_key' | 'jwt' | 'mtls' | 'internal' | 'basic' | 'oauth';
    issuedAt: Date;
    expiresAt?: Date;
    issuer?: string;
  };
}

/**
 * Resource being accessed
 */
export interface SecurityResource {
  /** Resource type (e.g., 'contract', 'file', 'api') */
  type: string;
  /** Resource identifier */
  id: string;
  /** Resource path or location */
  path?: string;
  /** Owner of the resource */
  owner?: string;
  /** Resource attributes for ABAC */
  attributes: Record<string, string | number | boolean>;
}

/**
 * Security action being performed
 */
export interface SecurityAction {
  /** Action type */
  type: string;
  /** Operation (CRUD-like) */
  operation: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';
  /** Additional action context */
  context?: Record<string, unknown>;
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  /** Whether authentication succeeded */
  authenticated: boolean;
  /** The authenticated principal (if successful) */
  principal?: SecurityPrincipal;
  /** Error message (if failed) */
  error?: string;
  /** Error code */
  errorCode?: 'invalid_credentials' | 'expired' | 'revoked' | 'malformed' | 'missing';
  /** Authentication method used */
  method?: string;
  /** Time of authentication */
  timestamp: Date;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  /** Whether action is authorized */
  authorized: boolean;
  /** Principal making the request */
  principal: SecurityPrincipal;
  /** Resource being accessed */
  resource: SecurityResource;
  /** Action being performed */
  action: SecurityAction;
  /** Reason for decision */
  reason?: string;
  /** Policies that matched */
  matchedPolicies: string[];
  /** Time of authorization check */
  timestamp: Date;
}

/**
 * Security policy
 */
export interface SecurityPolicy {
  /** Policy identifier */
  id: string;
  /** Policy name */
  name: string;
  /** Policy description */
  description?: string;
  /** Effect of the policy */
  effect: 'allow' | 'deny';
  /** Priority (higher = evaluated first) */
  priority: number;
  /** Conditions for when policy applies */
  conditions: {
    /** Principal conditions */
    principals?: {
      types?: string[];
      roles?: string[];
      ids?: string[];
      attributes?: Record<string, string | number | boolean>;
    };
    /** Resource conditions */
    resources?: {
      types?: string[];
      paths?: string[];
      owners?: string[];
      attributes?: Record<string, string | number | boolean>;
    };
    /** Action conditions */
    actions?: {
      types?: string[];
      operations?: SecurityAction['operation'][];
    };
    /** Time-based conditions */
    time?: {
      after?: Date;
      before?: Date;
      daysOfWeek?: number[];
      hoursOfDay?: { start: number; end: number };
    };
    /** Custom condition function */
    custom?: (principal: SecurityPrincipal, resource: SecurityResource, action: SecurityAction) => boolean;
  };
  /** Whether policy is enabled */
  enabled: boolean;
}

/**
 * Threat level
 */
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Threat event
 */
export interface ThreatEvent {
  /** Unique event ID */
  id: string;
  /** Threat type */
  type: 'brute_force' | 'injection' | 'dos' | 'unauthorized_access' | 'data_exfiltration' | 'anomaly' | 'policy_violation';
  /** Threat level */
  level: ThreatLevel;
  /** Source of the threat */
  source: {
    principalId?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  /** Target of the threat */
  target: {
    resourceType?: string;
    resourceId?: string;
    path?: string;
  };
  /** Description of the threat */
  description: string;
  /** Detection timestamp */
  detectedAt: Date;
  /** Indicators of compromise */
  indicators: string[];
  /** Current status */
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
  /** Recommended actions */
  recommendedActions: string[];
}

/**
 * Security incident
 */
export interface SecurityIncident {
  /** Unique incident ID */
  id: string;
  /** Incident severity */
  severity: ThreatLevel;
  /** Incident title */
  title: string;
  /** Detailed description */
  description: string;
  /** Related threat events */
  threatEvents: string[];
  /** Affected resources */
  affectedResources: SecurityResource[];
  /** Timeline of events */
  timeline: {
    timestamp: Date;
    event: string;
    actor?: string;
  }[];
  /** Current status */
  status: 'open' | 'investigating' | 'containing' | 'recovering' | 'closed';
  /** Assigned responders */
  assignedTo: string[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Resolution details */
  resolution?: {
    summary: string;
    rootCause?: string;
    preventiveMeasures?: string[];
    closedAt: Date;
    closedBy: string;
  };
}

/**
 * Audit log entry
 */
export interface SecurityAuditEntry {
  /** Unique entry ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Event type */
  eventType: 'authentication' | 'authorization' | 'access' | 'modification' | 'deletion' | 'threat' | 'admin' | 'system';
  /** Principal involved */
  principal?: SecurityPrincipal;
  /** Resource involved */
  resource?: SecurityResource;
  /** Action performed */
  action?: SecurityAction;
  /** Outcome */
  outcome: 'success' | 'failure' | 'blocked' | 'escalated';
  /** Additional details */
  details: Record<string, unknown>;
  /** Request metadata */
  request?: {
    id: string;
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
  };
  /** Hash for integrity verification */
  integrityHash?: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key to use for rate limiting */
  keyBy: 'ip' | 'principal' | 'api_key' | 'custom';
  /** Custom key function */
  keyFn?: (request: SecurityRequest) => string;
  /** Skip rate limiting for these principals */
  skipFor?: string[];
  /** Response when rate limited */
  onLimit?: 'block' | 'throttle' | 'warn';
}

/**
 * Security request
 */
export interface SecurityRequest {
  /** Request ID */
  id: string;
  /** Request timestamp */
  timestamp: Date;
  /** HTTP method (if applicable) */
  method?: string;
  /** Request path */
  path: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (parsed) */
  body?: unknown;
  /** Source IP */
  ip?: string;
  /** User agent */
  userAgent?: string;
  /** Authenticated principal (set after authentication) */
  principal?: SecurityPrincipal;
  /** Request metadata */
  metadata: Record<string, unknown>;
}

/**
 * Security response
 */
export interface SecurityResponse {
  /** Request ID */
  requestId: string;
  /** Response timestamp */
  timestamp: Date;
  /** HTTP status code equivalent */
  status: number;
  /** Response allowed */
  allowed: boolean;
  /** Error message (if not allowed) */
  error?: string;
  /** Error code */
  errorCode?: string;
  /** Warnings */
  warnings: string[];
  /** Security headers to add */
  securityHeaders: Record<string, string>;
  /** Audit trail ID */
  auditId: string;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable Zero Trust mode (default: true) */
  zeroTrust: boolean;
  /** Default deny policy (default: true) */
  defaultDeny: boolean;
  /** Require authentication for all requests */
  requireAuthentication: boolean;
  /** Rate limiting configuration */
  rateLimiting?: RateLimitConfig;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Maximum failed authentication attempts */
  maxAuthFailures: number;
  /** Lockout duration after max failures (ms) */
  lockoutDuration: number;
  /** Enable audit logging */
  auditEnabled: boolean;
  /** Audit log retention period (ms) */
  auditRetention: number;
  /** Threat detection sensitivity */
  threatSensitivity: ThreatLevel;
  /** Enable automatic incident response */
  autoResponse: boolean;
  /** Security policies */
  policies: SecurityPolicy[];
}

/**
 * Security status
 */
export interface SecurityStatus {
  /** Overall health */
  health: 'healthy' | 'degraded' | 'critical';
  /** Component statuses */
  components: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    lastCheck: Date;
    message?: string;
  }[];
  /** Active threats */
  activeThreats: number;
  /** Open incidents */
  openIncidents: number;
  /** Recent authentication failures */
  recentAuthFailures: number;
  /** Rate limit status */
  rateLimitStatus: {
    currentLoad: number;
    threshold: number;
    isThrottling: boolean;
  };
  /** Last security scan */
  lastSecurityScan?: Date;
  /** Uptime */
  uptimeMs: number;
}

/**
 * Containment action
 */
export interface ContainmentAction {
  /** Action type */
  type: 'block_principal' | 'block_ip' | 'revoke_session' | 'disable_resource' | 'isolate' | 'alert';
  /** Target of the action */
  target: string;
  /** Reason for action */
  reason: string;
  /** Duration in milliseconds (0 = permanent) */
  durationMs: number;
  /** Executed timestamp */
  executedAt: Date;
  /** Whether action was successful */
  success: boolean;
  /** Rollback function */
  rollback?: () => Promise<void>;
}

/**
 * Recovery plan
 */
export interface RecoveryPlan {
  /** Plan ID */
  id: string;
  /** Related incident ID */
  incidentId: string;
  /** Plan steps */
  steps: {
    order: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  }[];
  /** Overall status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Creation timestamp */
  createdAt: Date;
  /** Completion timestamp */
  completedAt?: Date;
}
