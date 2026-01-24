/**
 * Registry - Tool, Agent, and Service Registration
 *
 * Provides a central registry for discovering and managing
 * tools, agents, and services in The Construct.
 *
 * Phase 4 Implementation
 */

/**
 * Registration status
 */
export type RegistrationStatus = 'active' | 'inactive' | 'error' | 'unknown';

/**
 * Base registration entry
 */
export interface RegistryEntry {
  id: string;
  name: string;
  description?: string;
  version?: string;
  status: RegistrationStatus;
  registeredAt: Date;
  lastChecked?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Tool capability
 */
export interface ToolCapability {
  name: string;
  description?: string;
  parameters?: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
  returnType?: string;
}

/**
 * Tool registration
 */
export interface ToolEntry extends RegistryEntry {
  type: 'tool';
  source: 'internal' | 'mcp' | 'external';
  capabilities: ToolCapability[];
  endpoint?: string;
  mcpServer?: string;
}

/**
 * Agent skill
 */
export interface AgentSkill {
  id: string;
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Agent level
 */
export type AgentLevel = 'rookie' | 'reliable' | 'trusted' | 'expert';

/**
 * Agent registration
 */
export interface AgentEntry extends RegistryEntry {
  type: 'agent';
  agentType: string;
  level: AgentLevel;
  skills: AgentSkill[];
  provider?: string;
  model?: string;
}

/**
 * Service registration
 */
export interface ServiceEntry extends RegistryEntry {
  type: 'service';
  serviceType: string;
  endpoint?: string;
  healthCheckUrl?: string;
  capabilities: string[];
}

/**
 * All entry types
 */
export type AnyRegistryEntry = ToolEntry | AgentEntry | ServiceEntry;

/**
 * Health check result
 */
export interface HealthCheckResult {
  id: string;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: Date;
}

/**
 * Query options for finding entries
 */
export interface QueryOptions {
  type?: 'tool' | 'agent' | 'service';
  status?: RegistrationStatus;
  capability?: string;
  skill?: string;
  level?: AgentLevel;
  source?: 'internal' | 'mcp' | 'external';
}

/**
 * Registry configuration
 */
export interface RegistryConfig {
  /** Auto health check interval in ms (0 = disabled) */
  healthCheckInterval?: number;
  /** Timeout for health checks in ms */
  healthCheckTimeout?: number;
}

/**
 * Registry - Central registration for tools, agents, and services
 */
export class Registry {
  private tools: Map<string, ToolEntry> = new Map();
  private agents: Map<string, AgentEntry> = new Map();
  private services: Map<string, ServiceEntry> = new Map();
  private healthCheckInterval: number;
  private healthCheckTimeout: number;
  private healthCheckTimer: ReturnType<typeof setInterval> | undefined;

  constructor(config: RegistryConfig = {}) {
    this.healthCheckInterval = config.healthCheckInterval ?? 0;
    this.healthCheckTimeout = config.healthCheckTimeout ?? 5000;
  }

  /**
   * Start automatic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval <= 0) return;
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(
      () => this.checkAllHealth(),
      this.healthCheckInterval
    );
  }

  /**
   * Stop automatic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  // ============ Tool Registration ============

  /**
   * Register a tool
   */
  registerTool(tool: Omit<ToolEntry, 'type' | 'status' | 'registeredAt'>): ToolEntry {
    const entry: ToolEntry = {
      ...tool,
      type: 'tool',
      status: 'active',
      registeredAt: new Date(),
    };

    this.tools.set(tool.id, entry);
    return entry;
  }

  /**
   * Get a tool by ID
   */
  getTool(id: string): ToolEntry | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all tools
   */
  getAllTools(): ToolEntry[] {
    return Array.from(this.tools.values());
  }

  /**
   * Find tools by capability
   */
  findToolsByCapability(capabilityName: string): ToolEntry[] {
    return this.getAllTools().filter(tool =>
      tool.capabilities.some(cap => cap.name === capabilityName)
    );
  }

  /**
   * Find tools by source
   */
  findToolsBySource(source: ToolEntry['source']): ToolEntry[] {
    return this.getAllTools().filter(tool => tool.source === source);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(id: string): boolean {
    return this.tools.delete(id);
  }

  // ============ Agent Registration ============

  /**
   * Register an agent
   */
  registerAgent(agent: Omit<AgentEntry, 'type' | 'status' | 'registeredAt'>): AgentEntry {
    const entry: AgentEntry = {
      ...agent,
      type: 'agent',
      status: 'active',
      registeredAt: new Date(),
    };

    this.agents.set(agent.id, entry);
    return entry;
  }

  /**
   * Get an agent by ID
   */
  getAgent(id: string): AgentEntry | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by skill
   */
  findAgentsBySkill(skillId: string): AgentEntry[] {
    return this.getAllAgents().filter(agent =>
      agent.skills.some(skill => skill.id === skillId)
    );
  }

  /**
   * Find agents by minimum level
   */
  findAgentsByMinLevel(minLevel: AgentLevel): AgentEntry[] {
    const levelOrder: AgentLevel[] = ['rookie', 'reliable', 'trusted', 'expert'];
    const minIndex = levelOrder.indexOf(minLevel);

    return this.getAllAgents().filter(agent => {
      const agentIndex = levelOrder.indexOf(agent.level);
      return agentIndex >= minIndex;
    });
  }

  /**
   * Find agents by type
   */
  findAgentsByType(agentType: string): AgentEntry[] {
    return this.getAllAgents().filter(agent => agent.agentType === agentType);
  }

  /**
   * Update agent level
   */
  updateAgentLevel(id: string, level: AgentLevel): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;

    agent.level = level;
    return true;
  }

  /**
   * Add skill to agent
   */
  addAgentSkill(id: string, skill: AgentSkill): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;

    // Avoid duplicates
    if (!agent.skills.some(s => s.id === skill.id)) {
      agent.skills.push(skill);
    }
    return true;
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  // ============ Service Registration ============

  /**
   * Register a service
   */
  registerService(service: Omit<ServiceEntry, 'type' | 'status' | 'registeredAt'>): ServiceEntry {
    const entry: ServiceEntry = {
      ...service,
      type: 'service',
      status: 'unknown',
      registeredAt: new Date(),
    };

    this.services.set(service.id, entry);
    return entry;
  }

  /**
   * Get a service by ID
   */
  getService(id: string): ServiceEntry | undefined {
    return this.services.get(id);
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceEntry[] {
    return Array.from(this.services.values());
  }

  /**
   * Find services by capability
   */
  findServicesByCapability(capability: string): ServiceEntry[] {
    return this.getAllServices().filter(service =>
      service.capabilities.includes(capability)
    );
  }

  /**
   * Unregister a service
   */
  unregisterService(id: string): boolean {
    return this.services.delete(id);
  }

  // ============ Health Checks ============

  /**
   * Check health of a specific entry
   */
  async checkHealth(id: string): Promise<HealthCheckResult> {
    const entry = this.tools.get(id) ?? this.agents.get(id) ?? this.services.get(id);

    if (!entry) {
      return {
        id,
        healthy: false,
        error: 'Entry not found',
        checkedAt: new Date(),
      };
    }

    // For services with health check URL
    if (entry.type === 'service' && entry.healthCheckUrl) {
      return this.performHealthCheck(entry);
    }

    // For tools with endpoints
    if (entry.type === 'tool' && entry.endpoint) {
      return this.performHealthCheck(entry as ToolEntry);
    }

    // No health check available - assume healthy if registered
    entry.lastChecked = new Date();
    return {
      id,
      healthy: entry.status === 'active',
      checkedAt: new Date(),
    };
  }

  /**
   * Check health of all entries
   */
  async checkAllHealth(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [id] of this.services) {
      results.push(await this.checkHealth(id));
    }

    for (const [id] of this.tools) {
      results.push(await this.checkHealth(id));
    }

    return results;
  }

  /**
   * Perform actual health check for entries with endpoints
   */
  private async performHealthCheck(
    entry: ServiceEntry | ToolEntry
  ): Promise<HealthCheckResult> {
    const url = entry.type === 'service' ? entry.healthCheckUrl : entry.endpoint;

    if (!url) {
      return {
        id: entry.id,
        healthy: true,
        checkedAt: new Date(),
      };
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.healthCheckTimeout
      );

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      const healthy = response.ok;

      entry.status = healthy ? 'active' : 'error';
      entry.lastChecked = new Date();

      return {
        id: entry.id,
        healthy,
        latencyMs,
        checkedAt: new Date(),
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      entry.status = 'error';
      entry.lastChecked = new Date();

      return {
        id: entry.id,
        healthy: false,
        latencyMs: Date.now() - startTime,
        error,
        checkedAt: new Date(),
      };
    }
  }

  // ============ Query Methods ============

  /**
   * Find entries matching query options
   */
  find(options: QueryOptions): AnyRegistryEntry[] {
    let results: AnyRegistryEntry[] = [];

    // Collect from appropriate maps
    if (!options.type || options.type === 'tool') {
      results = results.concat(this.getAllTools());
    }
    if (!options.type || options.type === 'agent') {
      results = results.concat(this.getAllAgents());
    }
    if (!options.type || options.type === 'service') {
      results = results.concat(this.getAllServices());
    }

    // Filter by status
    if (options.status) {
      results = results.filter(e => e.status === options.status);
    }

    // Filter by capability (tools and services)
    if (options.capability) {
      results = results.filter(e => {
        if (e.type === 'tool') {
          return e.capabilities.some(c => c.name === options.capability);
        }
        if (e.type === 'service') {
          return e.capabilities.includes(options.capability!);
        }
        return false;
      });
    }

    // Filter by skill (agents only)
    if (options.skill) {
      results = results.filter(e => {
        if (e.type === 'agent') {
          return e.skills.some(s => s.id === options.skill);
        }
        return false;
      });
    }

    // Filter by level (agents only)
    if (options.level) {
      const levelOrder: AgentLevel[] = ['rookie', 'reliable', 'trusted', 'expert'];
      const minIndex = levelOrder.indexOf(options.level);

      results = results.filter(e => {
        if (e.type === 'agent') {
          const agentIndex = levelOrder.indexOf(e.level);
          return agentIndex >= minIndex;
        }
        return true;
      });
    }

    // Filter by source (tools only)
    if (options.source) {
      results = results.filter(e => {
        if (e.type === 'tool') {
          return e.source === options.source;
        }
        return false;
      });
    }

    return results;
  }

  // ============ Statistics ============

  /**
   * Get registry statistics
   */
  getStats(): {
    tools: { total: number; active: number; bySource: Record<string, number> };
    agents: { total: number; byLevel: Record<AgentLevel, number> };
    services: { total: number; healthy: number };
  } {
    const tools = this.getAllTools();
    const agents = this.getAllAgents();
    const services = this.getAllServices();

    const toolsBySource: Record<string, number> = {};
    for (const tool of tools) {
      toolsBySource[tool.source] = (toolsBySource[tool.source] ?? 0) + 1;
    }

    const agentsByLevel: Record<AgentLevel, number> = {
      rookie: 0,
      reliable: 0,
      trusted: 0,
      expert: 0,
    };
    for (const agent of agents) {
      agentsByLevel[agent.level]++;
    }

    return {
      tools: {
        total: tools.length,
        active: tools.filter(t => t.status === 'active').length,
        bySource: toolsBySource,
      },
      agents: {
        total: agents.length,
        byLevel: agentsByLevel,
      },
      services: {
        total: services.length,
        healthy: services.filter(s => s.status === 'active').length,
      },
    };
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.tools.clear();
    this.agents.clear();
    this.services.clear();
  }
}

/**
 * Default registry instance
 */
export const defaultRegistry = new Registry();
