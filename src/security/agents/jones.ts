/**
 * Special Agent Jones - Authorization
 *
 * "Only human."
 *
 * Special Agent Jones handles all authorization responsibilities:
 * - RBAC/ABAC enforcement
 * - Permission evaluation
 * - Resource access control
 * - Policy caching
 *
 * Phase 6 Implementation
 */

import type {
  SecurityPrincipal,
  SecurityResource,
  SecurityAction,
  AuthorizationResult,
  // Future use: SecurityPolicy,
} from '../../types/security.js';
import type { SpecialAgent } from '../smith/agent-smith.js';

/**
 * Permission definition
 */
export interface Permission {
  /** Permission ID */
  id: string;
  /** Permission name */
  name: string;
  /** Description */
  description?: string;
  /** Resource type this permission applies to */
  resourceType: string;
  /** Operations allowed */
  operations: SecurityAction['operation'][];
  /** Conditions for permission to apply */
  conditions?: Record<string, unknown>;
}

/**
 * Role definition
 */
export interface Role {
  /** Role ID */
  id: string;
  /** Role name */
  name: string;
  /** Description */
  description?: string;
  /** Permissions granted by this role */
  permissions: string[];
  /** Parent roles (for inheritance) */
  inherits?: string[];
  /** Priority (higher = evaluated first) */
  priority: number;
}

/**
 * Access control entry
 */
export interface AccessControlEntry {
  /** Principal ID or '*' for all */
  principalId: string;
  /** Resource ID or pattern */
  resourcePattern: string;
  /** Allowed operations */
  operations: SecurityAction['operation'][];
  /** Effect */
  effect: 'allow' | 'deny';
  /** Conditions */
  conditions?: Record<string, unknown>;
}

/**
 * Agent Jones configuration
 */
export interface AgentJonesConfig {
  /** Default policy (allow or deny when no rules match) */
  defaultPolicy: 'allow' | 'deny';
  /** Enable permission caching (default: true) */
  enableCache: boolean;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL: number;
  /** Maximum cache entries (default: 10000) */
  maxCacheEntries: number;
  /** Enable audit logging of authorization decisions (default: true) */
  auditDecisions: boolean;
}

/**
 * Internal config with defaults
 */
interface InternalConfig {
  defaultPolicy: 'allow' | 'deny';
  enableCache: boolean;
  cacheTTL: number;
  maxCacheEntries: number;
  auditDecisions: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry {
  result: AuthorizationResult;
  timestamp: number;
}

/**
 * Special Agent Jones - Authorization Agent
 */
export class AgentJones implements SpecialAgent {
  readonly name = 'Jones';
  readonly type = 'authorization' as const;

  private config: InternalConfig;
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private accessControl: AccessControlEntry[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private decisionLog: AuthorizationResult[] = [];

  // Statistics
  private stats = {
    totalAuthorizations: 0,
    allowed: 0,
    denied: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(config: Partial<AgentJonesConfig> = {}) {
    this.config = {
      defaultPolicy: config.defaultPolicy ?? 'deny',
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 300000, // 5 minutes
      maxCacheEntries: config.maxCacheEntries ?? 10000,
      auditDecisions: config.auditDecisions ?? true,
    };

    this.initializeDefaultRoles();
  }

  /**
   * Authorize an action
   */
  authorize(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): AuthorizationResult {
    this.stats.totalAuthorizations++;

    // Check cache
    if (this.config.enableCache) {
      const cached = this.checkCache(principal, resource, action);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    const matchedPolicies: string[] = [];
    let authorized = this.config.defaultPolicy === 'allow';
    let reason = `Default ${this.config.defaultPolicy} policy`;

    // Check role-based permissions
    const roleResult = this.checkRolePermissions(principal, resource, action);
    if (roleResult.decided) {
      authorized = roleResult.allowed;
      reason = roleResult.reason;
      matchedPolicies.push(...roleResult.matchedRoles);
    }

    // Check access control entries (can override roles)
    const aclResult = this.checkAccessControl(principal, resource, action);
    if (aclResult.decided) {
      // Explicit deny always wins
      if (!aclResult.allowed) {
        authorized = false;
        reason = aclResult.reason;
      } else if (!roleResult.decided || aclResult.allowed) {
        authorized = aclResult.allowed;
        reason = aclResult.reason;
      }
      matchedPolicies.push('ACL');
    }

    if (authorized) {
      this.stats.allowed++;
    } else {
      this.stats.denied++;
    }

    const result: AuthorizationResult = {
      authorized,
      principal,
      resource,
      action,
      reason,
      matchedPolicies,
      timestamp: new Date(),
    };

    // Cache result
    if (this.config.enableCache) {
      this.cacheResult(principal, resource, action, result);
    }

    // Log decision
    if (this.config.auditDecisions) {
      this.decisionLog.push(result);
      // Keep only last 1000 decisions in memory
      if (this.decisionLog.length > 1000) {
        this.decisionLog.shift();
      }
    }

    return result;
  }

  /**
   * Check if principal has a specific permission
   */
  checkPermission(principalId: string, permissionId: string): boolean {
    // Get principal's roles
    const principalRoles = this.getPrincipalRoles(principalId);

    // Check if any role has the permission
    for (const roleId of principalRoles) {
      const role = this.roles.get(roleId);
      if (role && this.roleHasPermission(role, permissionId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add a role
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
    this.invalidateCache();
  }

  /**
   * Get a role
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Remove a role
   */
  removeRole(roleId: string): boolean {
    const result = this.roles.delete(roleId);
    if (result) {
      this.invalidateCache();
    }
    return result;
  }

  /**
   * Add a permission
   */
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
    this.invalidateCache();
  }

  /**
   * Get a permission
   */
  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  /**
   * Remove a permission
   */
  removePermission(permissionId: string): boolean {
    const result = this.permissions.delete(permissionId);
    if (result) {
      this.invalidateCache();
    }
    return result;
  }

  /**
   * Add access control entry
   */
  addAccessControlEntry(entry: AccessControlEntry): void {
    this.accessControl.push(entry);
    this.invalidateCache();
  }

  /**
   * Remove access control entries for a principal
   */
  removeAccessControlEntries(principalId: string): number {
    const before = this.accessControl.length;
    this.accessControl = this.accessControl.filter(e => e.principalId !== principalId);
    const removed = before - this.accessControl.length;
    if (removed > 0) {
      this.invalidateCache();
    }
    return removed;
  }

  /**
   * Get all roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get recent authorization decisions
   */
  getRecentDecisions(limit: number = 100): AuthorizationResult[] {
    return this.decisionLog.slice(-limit);
  }

  /**
   * Get health status
   */
  getHealth(): { status: 'up' | 'down' | 'degraded'; message?: string } {
    if (this.cache.size > this.config.maxCacheEntries * 0.9) {
      return { status: 'degraded', message: 'Cache near capacity' };
    }
    return { status: 'up' };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { cacheSize: number; roleCount: number; permissionCount: number } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      roleCount: this.roles.size,
      permissionCount: this.permissions.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============ Private Methods ============

  private initializeDefaultRoles(): void {
    // Admin role - full access
    this.addRole({
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*'],
      priority: 1000,
    });

    // User role - basic access
    this.addRole({
      id: 'user',
      name: 'User',
      description: 'Basic user access',
      permissions: ['read:*', 'execute:own'],
      priority: 100,
    });

    // Guest role - minimal access
    this.addRole({
      id: 'guest',
      name: 'Guest',
      description: 'Read-only access to public resources',
      permissions: ['read:public'],
      priority: 10,
    });

    // Default permissions
    this.addPermission({
      id: 'read:*',
      name: 'Read All',
      resourceType: '*',
      operations: ['read'],
    });

    this.addPermission({
      id: 'read:public',
      name: 'Read Public',
      resourceType: '*',
      operations: ['read'],
      conditions: { visibility: 'public' },
    });

    this.addPermission({
      id: 'execute:own',
      name: 'Execute Own',
      resourceType: '*',
      operations: ['execute'],
      conditions: { ownerMatch: true },
    });
  }

  private checkRolePermissions(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): { decided: boolean; allowed: boolean; reason: string; matchedRoles: string[] } {
    const matchedRoles: string[] = [];
    let allowed = false;
    let decided = false;

    // Get all roles for the principal (including inherited)
    const allRoles = this.getExpandedRoles(principal.roles);

    // Sort by priority (highest first)
    const sortedRoles = allRoles.sort((a, b) => b.priority - a.priority);

    for (const role of sortedRoles) {
      for (const permissionId of role.permissions) {
        // Check wildcard permission
        if (permissionId === '*') {
          matchedRoles.push(role.id);
          return {
            decided: true,
            allowed: true,
            reason: `Role ${role.name} grants full access`,
            matchedRoles,
          };
        }

        const permission = this.permissions.get(permissionId);
        if (permission && this.permissionMatches(permission, resource, action)) {
          // Check permission conditions
          if (this.checkPermissionConditions(permission, principal, resource)) {
            matchedRoles.push(role.id);
            allowed = true;
            decided = true;
          }
        }
      }
    }

    return {
      decided,
      allowed,
      reason: decided
        ? `Allowed by role permissions`
        : 'No matching role permissions',
      matchedRoles,
    };
  }

  private checkAccessControl(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): { decided: boolean; allowed: boolean; reason: string } {
    // Check for explicit deny first
    for (const entry of this.accessControl) {
      if (entry.effect === 'deny' && this.aclEntryMatches(entry, principal, resource, action)) {
        return {
          decided: true,
          allowed: false,
          reason: `Denied by ACL for ${entry.resourcePattern}`,
        };
      }
    }

    // Check for explicit allow
    for (const entry of this.accessControl) {
      if (entry.effect === 'allow' && this.aclEntryMatches(entry, principal, resource, action)) {
        return {
          decided: true,
          allowed: true,
          reason: `Allowed by ACL for ${entry.resourcePattern}`,
        };
      }
    }

    return { decided: false, allowed: false, reason: 'No matching ACL entries' };
  }

  private aclEntryMatches(
    entry: AccessControlEntry,
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): boolean {
    // Check principal match
    if (entry.principalId !== '*' && entry.principalId !== principal.id) {
      return false;
    }

    // Check resource pattern match
    if (!this.matchPattern(entry.resourcePattern, resource.id)) {
      return false;
    }

    // Check operation match
    if (!entry.operations.includes(action.operation)) {
      return false;
    }

    return true;
  }

  private permissionMatches(
    permission: Permission,
    resource: SecurityResource,
    action: SecurityAction
  ): boolean {
    // Check resource type
    if (permission.resourceType !== '*' && permission.resourceType !== resource.type) {
      return false;
    }

    // Check operation
    if (!permission.operations.includes(action.operation)) {
      return false;
    }

    return true;
  }

  private checkPermissionConditions(
    permission: Permission,
    principal: SecurityPrincipal,
    resource: SecurityResource
  ): boolean {
    if (!permission.conditions) {
      return true;
    }

    // Check visibility condition
    if (permission.conditions['visibility']) {
      const resourceVisibility = resource.attributes['visibility'];
      if (resourceVisibility !== permission.conditions['visibility']) {
        return false;
      }
    }

    // Check owner match condition
    if (permission.conditions['ownerMatch']) {
      if (resource.owner !== principal.id) {
        return false;
      }
    }

    return true;
  }

  private getExpandedRoles(roleIds: string[]): Role[] {
    const result: Role[] = [];
    const visited = new Set<string>();

    const expand = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const role = this.roles.get(id);
      if (!role) return;

      result.push(role);

      // Expand inherited roles
      if (role.inherits) {
        for (const inheritedId of role.inherits) {
          expand(inheritedId);
        }
      }
    };

    for (const id of roleIds) {
      expand(id);
    }

    return result;
  }

  private roleHasPermission(role: Role, permissionId: string): boolean {
    // Direct permission
    if (role.permissions.includes(permissionId) || role.permissions.includes('*')) {
      return true;
    }

    // Check inherited roles
    if (role.inherits) {
      for (const inheritedId of role.inherits) {
        const inherited = this.roles.get(inheritedId);
        if (inherited && this.roleHasPermission(inherited, permissionId)) {
          return true;
        }
      }
    }

    return false;
  }

  private getPrincipalRoles(_principalId: string): string[] {
    // In a real implementation, this would look up the principal's roles from a store
    // For now, return empty (would need integration with Agent Brown)
    return [];
  }

  private matchPattern(pattern: string, value: string): boolean {
    if (pattern === '*') return true;

    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(value);
  }

  private getCacheKey(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): string {
    return `${principal.id}:${resource.type}:${resource.id}:${action.operation}`;
  }

  private checkCache(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction
  ): AuthorizationResult | null {
    const key = this.getCacheKey(principal, resource, action);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  private cacheResult(
    principal: SecurityPrincipal,
    resource: SecurityResource,
    action: SecurityAction,
    result: AuthorizationResult
  ): void {
    const key = this.getCacheKey(principal, resource, action);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.config.maxCacheEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { result, timestamp: Date.now() });
  }

  private invalidateCache(): void {
    this.cache.clear();
  }
}

/**
 * Create Agent Jones with default configuration
 */
export function createAgentJones(config?: Partial<AgentJonesConfig>): AgentJones {
  return new AgentJones(config);
}
