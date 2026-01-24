/**
 * Seraph - API Gateway Guardian
 *
 * "You do not truly know someone until you fight them."
 *
 * Seraph guards the entrance to The Construct's security infrastructure.
 * All requests must pass through Seraph before reaching any other component.
 *
 * Responsibilities:
 * - Request validation and sanitization
 * - Rate limiting and throttling
 * - Input validation
 * - Request routing to security agents
 * - Initial threat screening
 *
 * Phase 6 Implementation
 */

import type {
  SecurityRequest,
  SecurityResponse,
  SecurityPrincipal,
  RateLimitConfig,
  ThreatLevel,
} from '../../types/security.js';

// Re-export types for convenience
export type { SecurityRequest, SecurityResponse } from '../../types/security.js';

/**
 * Seraph configuration
 */
export interface SeraphConfig {
  /** Enable request validation (default: true) */
  validateRequests: boolean;
  /** Enable rate limiting (default: true) */
  enableRateLimiting: boolean;
  /** Rate limit configuration */
  rateLimitConfig?: RateLimitConfig;
  /** Maximum request body size in bytes (default: 1MB) */
  maxBodySize: number;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeout: number;
  /** Allowed HTTP methods */
  allowedMethods: string[];
  /** Blocked paths (patterns) */
  blockedPaths: string[];
  /** Required headers */
  requiredHeaders: string[];
  /** Enable input sanitization (default: true) */
  sanitizeInput: boolean;
  /** Threat sensitivity level */
  threatSensitivity: ThreatLevel;
  /** Custom validators */
  customValidators?: RequestValidator[];
}

/**
 * Request validation result
 */
export interface RequestValidationResult {
  /** Whether the request is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Warnings (non-blocking) */
  warnings: string[];
  /** Sanitized request (if sanitization enabled) */
  sanitizedRequest?: SecurityRequest;
  /** Detected threat level */
  threatLevel: ThreatLevel;
  /** Validation timestamp */
  timestamp: Date;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field that caused the error */
  field?: string;
  /** Severity */
  severity: 'error' | 'critical';
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Current request count in window */
  current: number;
  /** Maximum allowed in window */
  limit: number;
  /** Time until window resets (ms) */
  resetIn: number;
  /** Retry after (seconds) - only if blocked */
  retryAfter?: number;
}

/**
 * Custom request validator interface
 */
export interface RequestValidator {
  /** Validator name */
  name: string;
  /** Validate a request */
  validate(request: SecurityRequest): Promise<{ valid: boolean; error?: string }>;
}

/**
 * Rate limit window entry
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Internal config with defaults applied
 */
interface InternalSeraphConfig {
  validateRequests: boolean;
  enableRateLimiting: boolean;
  rateLimitConfig: RateLimitConfig;
  maxBodySize: number;
  requestTimeout: number;
  allowedMethods: string[];
  blockedPaths: string[];
  requiredHeaders: string[];
  sanitizeInput: boolean;
  threatSensitivity: ThreatLevel;
  customValidators: RequestValidator[];
}

/**
 * Seraph - The API Gateway Guardian
 */
export class Seraph {
  private config: InternalSeraphConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private blockedIPs: Map<string, { until: number; reason: string }> = new Map();
  private requestIdCounter = 0;
  private startTime: number;

  // Statistics
  private stats = {
    totalRequests: 0,
    validRequests: 0,
    blockedRequests: 0,
    rateLimitedRequests: 0,
    sanitizedRequests: 0,
    threatDetections: 0,
  };

  constructor(config: Partial<SeraphConfig> = {}) {
    this.config = {
      validateRequests: config.validateRequests ?? true,
      enableRateLimiting: config.enableRateLimiting ?? true,
      rateLimitConfig: config.rateLimitConfig ?? {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        keyBy: 'ip',
        onLimit: 'block',
      },
      maxBodySize: config.maxBodySize ?? 1024 * 1024, // 1MB
      requestTimeout: config.requestTimeout ?? 30000,
      allowedMethods: config.allowedMethods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      blockedPaths: config.blockedPaths ?? [],
      requiredHeaders: config.requiredHeaders ?? [],
      sanitizeInput: config.sanitizeInput ?? true,
      threatSensitivity: config.threatSensitivity ?? 'medium',
      customValidators: config.customValidators ?? [],
    };
    this.startTime = Date.now();
  }

  /**
   * Process an incoming request
   * Main entry point for all requests
   */
  async processRequest(request: SecurityRequest): Promise<SecurityResponse> {
    this.stats.totalRequests++;
    const auditId = `audit-${++this.requestIdCounter}-${Date.now()}`;

    // Check if IP is blocked
    if (request.ip) {
      const blocked = this.blockedIPs.get(request.ip);
      if (blocked && blocked.until > Date.now()) {
        this.stats.blockedRequests++;
        return this.createBlockedResponse(request.id, auditId, 'IP temporarily blocked', 'IP_BLOCKED');
      }
    }

    // Rate limiting check
    if (this.config.enableRateLimiting) {
      const rateLimitResult = this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        this.stats.rateLimitedRequests++;
        return this.createRateLimitedResponse(request.id, auditId, rateLimitResult);
      }
    }

    // Validate request
    if (this.config.validateRequests) {
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        this.stats.blockedRequests++;
        return this.createValidationFailedResponse(request.id, auditId, validationResult);
      }

      // Use sanitized request if available
      if (validationResult.sanitizedRequest) {
        request = validationResult.sanitizedRequest;
        this.stats.sanitizedRequests++;
      }

      // Track threat detections
      if (validationResult.threatLevel !== 'none') {
        this.stats.threatDetections++;
      }
    }

    this.stats.validRequests++;

    return {
      requestId: request.id,
      timestamp: new Date(),
      status: 200,
      allowed: true,
      warnings: [],
      securityHeaders: this.getSecurityHeaders(),
      auditId,
    };
  }

  /**
   * Validate a request
   */
  async validateRequest(request: SecurityRequest): Promise<RequestValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let threatLevel: ThreatLevel = 'none';

    // Method validation
    if (request.method && !this.config.allowedMethods.includes(request.method.toUpperCase())) {
      errors.push({
        code: 'INVALID_METHOD',
        message: `Method ${request.method} is not allowed`,
        field: 'method',
        severity: 'error',
      });
    }

    // Path validation
    if (this.isBlockedPath(request.path)) {
      errors.push({
        code: 'BLOCKED_PATH',
        message: `Path ${request.path} is blocked`,
        field: 'path',
        severity: 'critical',
      });
      threatLevel = this.elevateThreatlevel(threatLevel, 'medium');
    }

    // Required headers check
    for (const header of this.config.requiredHeaders) {
      if (!request.headers[header.toLowerCase()]) {
        errors.push({
          code: 'MISSING_HEADER',
          message: `Required header ${header} is missing`,
          field: `headers.${header}`,
          severity: 'error',
        });
      }
    }

    // Body size check
    if (request.body) {
      const bodySize = JSON.stringify(request.body).length;
      if (bodySize > this.config.maxBodySize) {
        errors.push({
          code: 'BODY_TOO_LARGE',
          message: `Request body exceeds maximum size of ${this.config.maxBodySize} bytes`,
          field: 'body',
          severity: 'error',
        });
      }
    }

    // Threat detection in request
    const threatResult = this.detectThreats(request);
    threatLevel = this.elevateThreatlevel(threatLevel, threatResult.level);
    errors.push(...threatResult.errors);
    warnings.push(...threatResult.warnings);

    // Custom validators
    for (const validator of this.config.customValidators) {
      try {
        const result = await validator.validate(request);
        if (!result.valid) {
          errors.push({
            code: 'CUSTOM_VALIDATION_FAILED',
            message: result.error ?? `Validator ${validator.name} failed`,
            severity: 'error',
          });
        }
      } catch (error) {
        warnings.push(`Validator ${validator.name} threw an error: ${error}`);
      }
    }

    // Sanitize request if enabled and no critical errors
    let sanitizedRequest: SecurityRequest | undefined;
    if (this.config.sanitizeInput && !errors.some(e => e.severity === 'critical')) {
      sanitizedRequest = this.sanitizeRequest(request);
    }

    const result: RequestValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      threatLevel,
      timestamp: new Date(),
    };

    if (sanitizedRequest) {
      result.sanitizedRequest = sanitizedRequest;
    }

    return result;
  }

  /**
   * Check rate limit for a request
   */
  checkRateLimit(request: SecurityRequest): RateLimitResult {
    const key = this.getRateLimitKey(request);
    const now = Date.now();
    const windowMs = this.config.rateLimitConfig.windowMs;
    const maxRequests = this.config.rateLimitConfig.maxRequests;

    // Check if principal should skip rate limiting
    if (request.principal && this.config.rateLimitConfig.skipFor?.includes(request.principal.id)) {
      return {
        allowed: true,
        current: 0,
        limit: maxRequests,
        resetIn: 0,
      };
    }

    let entry = this.rateLimitStore.get(key);

    // Check if window has expired
    if (!entry || (now - entry.windowStart) >= windowMs) {
      entry = { count: 1, windowStart: now };
      this.rateLimitStore.set(key, entry);
      return {
        allowed: true,
        current: 1,
        limit: maxRequests,
        resetIn: windowMs,
      };
    }

    // Increment counter
    entry.count++;
    const resetIn = windowMs - (now - entry.windowStart);

    if (entry.count > maxRequests) {
      return {
        allowed: false,
        current: entry.count,
        limit: maxRequests,
        resetIn,
        retryAfter: Math.ceil(resetIn / 1000),
      };
    }

    return {
      allowed: true,
      current: entry.count,
      limit: maxRequests,
      resetIn,
    };
  }

  /**
   * Block an IP address
   */
  blockIP(ip: string, durationMs: number, reason: string): void {
    this.blockedIPs.set(ip, {
      until: Date.now() + durationMs,
      reason,
    });
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): boolean {
    return this.blockedIPs.delete(ip);
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): Array<{ ip: string; until: Date; reason: string }> {
    const result: Array<{ ip: string; until: Date; reason: string }> = [];
    const now = Date.now();

    for (const [ip, info] of this.blockedIPs) {
      if (info.until > now) {
        result.push({ ip, until: new Date(info.until), reason: info.reason });
      }
    }

    return result;
  }

  /**
   * Clear expired entries from rate limit store
   */
  cleanupRateLimits(): number {
    const now = Date.now();
    const windowMs = this.config.rateLimitConfig.windowMs;
    let cleaned = 0;

    for (const [key, entry] of this.rateLimitStore) {
      if ((now - entry.windowStart) >= windowMs) {
        this.rateLimitStore.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear expired IP blocks
   */
  cleanupBlockedIPs(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, info] of this.blockedIPs) {
      if (info.until <= now) {
        this.blockedIPs.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { uptimeMs: number } {
    return {
      ...this.stats,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      validRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      sanitizedRequests: 0,
      threatDetections: 0,
    };
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'healthy' | 'degraded'; message: string } {
    const blockRate = this.stats.totalRequests > 0
      ? this.stats.blockedRequests / this.stats.totalRequests
      : 0;

    if (blockRate > 0.5) {
      return { status: 'degraded', message: 'High block rate detected' };
    }

    return { status: 'healthy', message: 'Operating normally' };
  }

  // ============ Private Methods ============

  private isBlockedPath(path: string): boolean {
    for (const pattern of this.config.blockedPaths) {
      if (this.matchPattern(pattern, path)) {
        return true;
      }
    }
    return false;
  }

  private matchPattern(pattern: string, path: string): boolean {
    // Simple glob-like matching
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }

  private detectThreats(request: SecurityRequest): {
    level: ThreatLevel;
    errors: ValidationError[];
    warnings: string[];
  } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let level: ThreatLevel = 'none';

    // Check for common injection patterns
    const bodyStr = request.body ? JSON.stringify(request.body) : '';
    const pathAndBody = request.path + bodyStr;

    // SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
      /('|")\s*(OR|AND)\s*('|"|\d)/i,
      /;\s*--/,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(pathAndBody)) {
        if (this.shouldBlock('medium')) {
          errors.push({
            code: 'SQL_INJECTION_DETECTED',
            message: 'Potential SQL injection detected',
            severity: 'critical',
          });
          level = this.elevateThreatlevel(level, 'high');
        } else {
          warnings.push('Potential SQL injection pattern detected');
          level = this.elevateThreatlevel(level, 'medium');
        }
        break;
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(pathAndBody)) {
        if (this.shouldBlock('medium')) {
          errors.push({
            code: 'XSS_DETECTED',
            message: 'Potential XSS attack detected',
            severity: 'critical',
          });
          level = this.elevateThreatlevel(level, 'high');
        } else {
          warnings.push('Potential XSS pattern detected');
          level = this.elevateThreatlevel(level, 'medium');
        }
        break;
      }
    }

    // Path traversal
    if (/\.\.\/|\.\.\\/.test(request.path)) {
      errors.push({
        code: 'PATH_TRAVERSAL_DETECTED',
        message: 'Path traversal attempt detected',
        severity: 'critical',
      });
      level = this.elevateThreatlevel(level, 'high');
    }

    // Suspicious headers
    const userAgent = request.userAgent ?? request.headers['user-agent'] ?? '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      warnings.push('Suspicious user agent detected');
      level = this.elevateThreatlevel(level, 'low');
    }

    return { level, errors, warnings };
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /^$/,  // Empty user agent
    ];

    return suspiciousPatterns.some(p => p.test(userAgent));
  }

  private shouldBlock(level: ThreatLevel): boolean {
    const levels: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
    const configIndex = levels.indexOf(this.config.threatSensitivity);
    const threatIndex = levels.indexOf(level);
    return threatIndex >= configIndex;
  }

  private elevateThreatlevel(current: ThreatLevel, detected: ThreatLevel): ThreatLevel {
    const levels: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const detectedIndex = levels.indexOf(detected);
    return levels[Math.max(currentIndex, detectedIndex)] ?? 'none';
  }

  private sanitizeRequest(request: SecurityRequest): SecurityRequest {
    return {
      ...request,
      path: this.sanitizeString(request.path),
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([k, v]) => [k.toLowerCase(), this.sanitizeString(v)])
      ),
      body: request.body ? this.sanitizeObject(request.body) : undefined,
      metadata: this.sanitizeObject(request.metadata) as Record<string, unknown>,
    };
  }

  private sanitizeString(value: string): string {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[this.sanitizeString(key)] = this.sanitizeObject(value);
      }
      return result;
    }

    return obj;
  }

  private getRateLimitKey(request: SecurityRequest): string {
    switch (this.config.rateLimitConfig.keyBy) {
      case 'ip':
        return request.ip ?? 'unknown';
      case 'principal':
        return request.principal?.id ?? request.ip ?? 'unknown';
      case 'api_key':
        return request.headers['x-api-key'] ?? request.ip ?? 'unknown';
      case 'custom':
        if (this.config.rateLimitConfig.keyFn) {
          return this.config.rateLimitConfig.keyFn(request);
        }
        return request.ip ?? 'unknown';
      default:
        return request.ip ?? 'unknown';
    }
  }

  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  private createBlockedResponse(
    requestId: string,
    auditId: string,
    error: string,
    errorCode: string
  ): SecurityResponse {
    return {
      requestId,
      timestamp: new Date(),
      status: 403,
      allowed: false,
      error,
      errorCode,
      warnings: [],
      securityHeaders: this.getSecurityHeaders(),
      auditId,
    };
  }

  private createRateLimitedResponse(
    requestId: string,
    auditId: string,
    rateLimitResult: RateLimitResult
  ): SecurityResponse {
    return {
      requestId,
      timestamp: new Date(),
      status: 429,
      allowed: false,
      error: 'Rate limit exceeded',
      errorCode: 'RATE_LIMITED',
      warnings: [],
      securityHeaders: {
        ...this.getSecurityHeaders(),
        'Retry-After': String(rateLimitResult.retryAfter ?? 60),
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetIn / 1000)),
      },
      auditId,
    };
  }

  private createValidationFailedResponse(
    requestId: string,
    auditId: string,
    validationResult: RequestValidationResult
  ): SecurityResponse {
    const criticalError = validationResult.errors.find(e => e.severity === 'critical');
    const firstError = validationResult.errors[0];

    return {
      requestId,
      timestamp: new Date(),
      status: criticalError ? 403 : 400,
      allowed: false,
      error: firstError?.message ?? 'Validation failed',
      errorCode: firstError?.code ?? 'VALIDATION_FAILED',
      warnings: validationResult.warnings,
      securityHeaders: this.getSecurityHeaders(),
      auditId,
    };
  }
}

/**
 * Create Seraph with default configuration
 */
export function createSeraph(config?: Partial<SeraphConfig>): Seraph {
  return new Seraph(config);
}
