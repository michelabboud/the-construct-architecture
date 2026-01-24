/**
 * Special Agent Brown - Authentication
 *
 * "Perhaps we are asking the wrong questions."
 *
 * Special Agent Brown handles all authentication responsibilities:
 * - Identity verification
 * - Credential validation
 * - Token management (JWT, API keys)
 * - Session handling
 *
 * Phase 6 Implementation
 */

import type {
  SecurityPrincipal,
  AuthenticationResult,
  // Future use: ThreatLevel,
} from '../../types/security.js';
import type { SpecialAgent } from '../smith/agent-smith.js';

/**
 * Credentials for authentication
 */
export interface Credentials {
  /** Credential type */
  type: 'api_key' | 'jwt' | 'basic' | 'oauth';
  /** API key value (for api_key type) */
  apiKey?: string;
  /** JWT token (for jwt type) */
  token?: string;
  /** Username (for basic type) */
  username?: string;
  /** Password (for basic type) */
  password?: string;
  /** OAuth access token (for oauth type) */
  accessToken?: string;
}

/**
 * Token claims (decoded JWT)
 */
export interface TokenClaims {
  /** Subject (principal ID) */
  sub: string;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string | string[];
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Not before (Unix timestamp) */
  nbf?: number;
  /** JWT ID */
  jti?: string;
  /** Custom claims */
  [key: string]: unknown;
}

/**
 * Session data
 */
export interface Session {
  /** Session ID */
  id: string;
  /** Principal ID */
  principalId: string;
  /** Session creation time */
  createdAt: Date;
  /** Session expiration time */
  expiresAt: Date;
  /** Last activity time */
  lastActivity: Date;
  /** Session metadata */
  metadata: Record<string, unknown>;
  /** Is session active */
  active: boolean;
}

/**
 * API key record
 */
interface ApiKeyRecord {
  key: string;
  principalId: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  revoked: boolean;
  scopes: string[];
}

/**
 * Agent Brown configuration
 */
export interface AgentBrownConfig {
  /** Session timeout in milliseconds (default: 1 hour) */
  sessionTimeout: number;
  /** Maximum sessions per principal (default: 5) */
  maxSessionsPerPrincipal: number;
  /** Token issuer */
  tokenIssuer: string;
  /** Maximum failed attempts before lockout (default: 5) */
  maxFailedAttempts: number;
  /** Lockout duration in milliseconds (default: 15 minutes) */
  lockoutDuration: number;
  /** Enable session tracking (default: true) */
  enableSessions: boolean;
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  sessionTimeout: number;
  maxSessionsPerPrincipal: number;
  tokenIssuer: string;
  maxFailedAttempts: number;
  lockoutDuration: number;
  enableSessions: boolean;
}

/**
 * Special Agent Brown - Authentication Agent
 */
export class AgentBrown implements SpecialAgent {
  readonly name = 'Brown';
  readonly type = 'authentication' as const;

  private config: InternalConfig;
  private sessions: Map<string, Session> = new Map();
  private apiKeys: Map<string, ApiKeyRecord> = new Map();
  private principals: Map<string, SecurityPrincipal> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private lockedOut: Map<string, number> = new Map(); // principalId -> lockout end time
  private sessionIdCounter = 0;

  // Statistics
  private stats = {
    totalAuthentications: 0,
    successfulAuthentications: 0,
    failedAuthentications: 0,
    sessionsCreated: 0,
    sessionsRevoked: 0,
    lockouts: 0,
  };

  constructor(config: Partial<AgentBrownConfig> = {}) {
    this.config = {
      sessionTimeout: config.sessionTimeout ?? 3600000, // 1 hour
      maxSessionsPerPrincipal: config.maxSessionsPerPrincipal ?? 5,
      tokenIssuer: config.tokenIssuer ?? 'the-construct',
      maxFailedAttempts: config.maxFailedAttempts ?? 5,
      lockoutDuration: config.lockoutDuration ?? 900000, // 15 minutes
      enableSessions: config.enableSessions ?? true,
    };
  }

  /**
   * Authenticate with credentials
   */
  async authenticate(credentials: Credentials): Promise<AuthenticationResult> {
    this.stats.totalAuthentications++;

    // Check lockout
    const lockoutKey = this.getLockoutKey(credentials);
    if (this.isLockedOut(lockoutKey)) {
      this.stats.failedAuthentications++;
      return {
        authenticated: false,
        error: 'Account temporarily locked due to too many failed attempts',
        errorCode: 'revoked',
        timestamp: new Date(),
      };
    }

    let result: AuthenticationResult;

    switch (credentials.type) {
      case 'api_key':
        result = await this.authenticateApiKey(credentials.apiKey);
        break;
      case 'jwt':
        result = await this.authenticateJwt(credentials.token);
        break;
      case 'basic':
        result = await this.authenticateBasic(credentials.username, credentials.password);
        break;
      case 'oauth':
        result = await this.authenticateOAuth(credentials.accessToken);
        break;
      default:
        result = {
          authenticated: false,
          error: 'Unknown credential type',
          errorCode: 'malformed',
          timestamp: new Date(),
        };
    }

    if (result.authenticated) {
      this.stats.successfulAuthentications++;
      this.clearFailedAttempts(lockoutKey);

      // Create session if enabled
      if (this.config.enableSessions && result.principal) {
        const session = this.createSession(result.principal.id);
        result.principal.authMetadata = {
          method: credentials.type,
          issuedAt: new Date(),
          expiresAt: session.expiresAt,
          issuer: this.config.tokenIssuer,
        };
      }
    } else {
      this.stats.failedAuthentications++;
      this.recordFailedAttempt(lockoutKey);
    }

    return result;
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string | undefined): Promise<TokenClaims | null> {
    if (!token) {
      return null;
    }

    try {
      // Simple JWT parsing (in production, use a proper JWT library with signature verification)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString()) as TokenClaims;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      // Check not before
      if (payload.nbf && payload.nbf * 1000 > Date.now()) {
        return null;
      }

      // Check issuer
      if (payload.iss && payload.iss !== this.config.tokenIssuer) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Create a session for a principal
   */
  createSession(principalId: string, metadata?: Record<string, unknown>): Session {
    // Clean up old sessions for this principal
    this.cleanupPrincipalSessions(principalId);

    const session: Session = {
      id: `session-${++this.sessionIdCounter}-${Date.now()}`,
      principalId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout),
      lastActivity: new Date(),
      metadata: metadata ?? {},
      active: true,
    };

    this.sessions.set(session.id, session);
    this.stats.sessionsCreated++;

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      session.active = false;
      return session;
    }

    return session;
  }

  /**
   * Update session activity
   */
  touchSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active || session.expiresAt < new Date()) {
      return false;
    }

    session.lastActivity = new Date();
    session.expiresAt = new Date(Date.now() + this.config.sessionTimeout);
    return true;
  }

  /**
   * Revoke a session
   */
  revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.active = false;
    this.stats.sessionsRevoked++;
    return true;
  }

  /**
   * Revoke all sessions for a principal
   */
  revokeAllSessions(principalId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.principalId === principalId && session.active) {
        session.active = false;
        count++;
        this.stats.sessionsRevoked++;
      }
    }
    return count;
  }

  /**
   * Register an API key
   */
  registerApiKey(
    principalId: string,
    name: string,
    scopes: string[] = [],
    expiresAt?: Date
  ): string {
    const key = this.generateApiKey();
    const record: ApiKeyRecord = {
      key,
      principalId,
      name,
      createdAt: new Date(),
      revoked: false,
      scopes,
    };

    if (expiresAt) {
      record.expiresAt = expiresAt;
    }

    this.apiKeys.set(key, record);
    return key;
  }

  /**
   * Revoke an API key
   */
  revokeApiKey(key: string): boolean {
    const record = this.apiKeys.get(key);
    if (!record) {
      return false;
    }

    record.revoked = true;
    return true;
  }

  /**
   * Register a principal
   */
  registerPrincipal(principal: SecurityPrincipal): void {
    this.principals.set(principal.id, principal);
  }

  /**
   * Get principal by ID
   */
  getPrincipal(id: string): SecurityPrincipal | undefined {
    return this.principals.get(id);
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string } {
    const activeSessionCount = Array.from(this.sessions.values())
      .filter(s => s.active && s.expiresAt > new Date()).length;

    if (activeSessionCount > 10000) {
      return { status: 'degraded', message: 'High session count' };
    }

    return { status: 'up' };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { activeSessions: number; registeredApiKeys: number } {
    return {
      ...this.stats,
      activeSessions: Array.from(this.sessions.values())
        .filter(s => s.active && s.expiresAt > new Date()).length,
      registeredApiKeys: Array.from(this.apiKeys.values())
        .filter(k => !k.revoked).length,
    };
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now || !session.active) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ============ Private Methods ============

  private async authenticateApiKey(apiKey: string | undefined): Promise<AuthenticationResult> {
    if (!apiKey) {
      return {
        authenticated: false,
        error: 'API key is required',
        errorCode: 'missing',
        timestamp: new Date(),
      };
    }

    const record = this.apiKeys.get(apiKey);
    if (!record) {
      return {
        authenticated: false,
        error: 'Invalid API key',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    if (record.revoked) {
      return {
        authenticated: false,
        error: 'API key has been revoked',
        errorCode: 'revoked',
        timestamp: new Date(),
      };
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired',
        errorCode: 'expired',
        timestamp: new Date(),
      };
    }

    // Update last used
    record.lastUsed = new Date();

    const principal = this.principals.get(record.principalId);
    if (!principal) {
      return {
        authenticated: false,
        error: 'Principal not found',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    return {
      authenticated: true,
      principal,
      method: 'api_key',
      timestamp: new Date(),
    };
  }

  private async authenticateJwt(token: string | undefined): Promise<AuthenticationResult> {
    if (!token) {
      return {
        authenticated: false,
        error: 'Token is required',
        errorCode: 'missing',
        timestamp: new Date(),
      };
    }

    const claims = await this.verifyToken(token);
    if (!claims) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    const principal = this.principals.get(claims.sub);
    if (!principal) {
      return {
        authenticated: false,
        error: 'Principal not found',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    return {
      authenticated: true,
      principal,
      method: 'jwt',
      timestamp: new Date(),
    };
  }

  private async authenticateBasic(
    username: string | undefined,
    password: string | undefined
  ): Promise<AuthenticationResult> {
    if (!username || !password) {
      return {
        authenticated: false,
        error: 'Username and password are required',
        errorCode: 'missing',
        timestamp: new Date(),
      };
    }

    // Find principal by name
    const principal = Array.from(this.principals.values())
      .find(p => p.name === username);

    if (!principal) {
      return {
        authenticated: false,
        error: 'Invalid credentials',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    // In a real implementation, password would be hashed and compared
    // For now, we check if password matches the principal's id (placeholder)
    const expectedPassword = principal.attributes['password'] as string | undefined;
    if (!expectedPassword || password !== expectedPassword) {
      return {
        authenticated: false,
        error: 'Invalid credentials',
        errorCode: 'invalid_credentials',
        timestamp: new Date(),
      };
    }

    return {
      authenticated: true,
      principal,
      method: 'basic',
      timestamp: new Date(),
    };
  }

  private async authenticateOAuth(accessToken: string | undefined): Promise<AuthenticationResult> {
    if (!accessToken) {
      return {
        authenticated: false,
        error: 'Access token is required',
        errorCode: 'missing',
        timestamp: new Date(),
      };
    }

    // In a real implementation, this would validate with the OAuth provider
    // For now, treat it like a JWT
    return this.authenticateJwt(accessToken);
  }

  private getLockoutKey(credentials: Credentials): string {
    switch (credentials.type) {
      case 'api_key':
        return `apikey:${credentials.apiKey?.substring(0, 8) ?? 'unknown'}`;
      case 'basic':
        return `user:${credentials.username ?? 'unknown'}`;
      default:
        return `token:${Date.now()}`;
    }
  }

  private isLockedOut(key: string): boolean {
    const lockoutEnd = this.lockedOut.get(key);
    if (!lockoutEnd) {
      return false;
    }

    if (Date.now() >= lockoutEnd) {
      this.lockedOut.delete(key);
      return false;
    }

    return true;
  }

  private recordFailedAttempt(key: string): void {
    const record = this.failedAttempts.get(key) ?? { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();
    this.failedAttempts.set(key, record);

    if (record.count >= this.config.maxFailedAttempts) {
      this.lockedOut.set(key, Date.now() + this.config.lockoutDuration);
      this.failedAttempts.delete(key);
      this.stats.lockouts++;
    }
  }

  private clearFailedAttempts(key: string): void {
    this.failedAttempts.delete(key);
  }

  private cleanupPrincipalSessions(principalId: string): void {
    const principalSessions = Array.from(this.sessions.values())
      .filter(s => s.principalId === principalId && s.active)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Remove oldest sessions if over limit
    while (principalSessions.length >= this.config.maxSessionsPerPrincipal) {
      const oldest = principalSessions.shift();
      if (oldest) {
        oldest.active = false;
        this.stats.sessionsRevoked++;
      }
    }
  }

  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'ck_'; // construct key prefix
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

/**
 * Create Agent Brown with default configuration
 */
export function createAgentBrown(config?: Partial<AgentBrownConfig>): AgentBrown {
  return new AgentBrown(config);
}
