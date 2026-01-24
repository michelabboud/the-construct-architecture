/**
 * Phase 4 Tests - Reference System & Full Architect
 *
 * Tests for:
 * - Reference Resolver (URI parsing, resolution, caching)
 * - Truth Loader (global + project truth, deep merge)
 * - Registry (tools, agents, services, health checks)
 * - Architect integration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  ReferenceResolver,
  extractMarkdownSections,
  type ReferenceConfig,
  type ParsedURI,
} from '../src/architect/references/reference-resolver.js';
import { TruthLoader, type Truth } from '../src/architect/truth-loader.js';
import {
  Registry,
  type ToolEntry,
  type AgentEntry,
  type ServiceEntry,
  type AgentLevel,
} from '../src/architect/registry.js';
import { Architect } from '../src/architect/architect.js';

describe('Phase 4: Reference System & Full Architect', () => {
  // ============ Reference Resolver Tests ============
  describe('ReferenceResolver', () => {
    let resolver: ReferenceResolver;

    beforeEach(() => {
      resolver = new ReferenceResolver();
    });

    describe('parseURI', () => {
      it('should parse valid guide URIs', () => {
        const result = resolver.parseURI('guide://style-guide');
        expect(result.scheme).toBe('guide');
        expect(result.path).toBe('style-guide');
        expect(result.segments).toEqual(['style-guide']);
        expect(result.raw).toBe('guide://style-guide');
      });

      it('should parse URIs with nested paths', () => {
        const result = resolver.parseURI('schema://contracts/task-contract');
        expect(result.scheme).toBe('schema');
        expect(result.path).toBe('contracts/task-contract');
        expect(result.segments).toEqual(['contracts', 'task-contract']);
      });

      it('should parse all valid schemes', () => {
        const schemes = [
          'guide', 'tool', 'mcp', 'agent', 'skill',
          'schema', 'template', 'config', 'architect', 'oracle'
        ];

        for (const scheme of schemes) {
          const result = resolver.parseURI(`${scheme}://test`);
          expect(result.scheme).toBe(scheme);
        }
      });

      it('should throw for invalid URI format', () => {
        expect(() => resolver.parseURI('invalid')).toThrow('Invalid URI format');
        expect(() => resolver.parseURI('://missing-scheme')).toThrow('Invalid URI format');
        expect(() => resolver.parseURI('scheme://')).toThrow('Invalid URI format');
      });

      it('should throw for unknown schemes', () => {
        expect(() => resolver.parseURI('unknown://path')).toThrow('Unknown URI scheme');
      });
    });

    describe('resolveTemplateVars', () => {
      it('should resolve template variables', () => {
        resolver.setTemplateVars({
          agent_id: 'agent-123',
          task_type: 'code-review',
        });

        const result = resolver.resolveTemplateVars('agents/{agent_id}/tasks/{task_type}');
        expect(result).toBe('agents/agent-123/tasks/code-review');
      });

      it('should throw for unknown template variables', () => {
        expect(() => resolver.resolveTemplateVars('path/{unknown}')).toThrow(
          'Unknown template variable'
        );
      });

      it('should handle paths without variables', () => {
        const result = resolver.resolveTemplateVars('simple/path');
        expect(result).toBe('simple/path');
      });
    });

    describe('caching', () => {
      it('should return cache statistics', () => {
        const stats = resolver.getCacheStats();
        expect(stats.size).toBe(0);
        expect(stats.ttl).toBe(60000);
      });

      it('should allow clearing cache', () => {
        resolver.clearCache();
        const stats = resolver.getCacheStats();
        expect(stats.size).toBe(0);
      });

      it('should prune cache', () => {
        const pruned = resolver.pruneCache();
        expect(pruned).toBe(0);
      });
    });

    describe('MCP tool resolution', () => {
      it('should resolve MCP tool URIs to server/tool format', async () => {
        const result = await resolver.resolve('mcp://filesystem/read-file');
        expect(result.content).toEqual({
          server: 'filesystem',
          tool: 'read-file',
        });
        expect(result.contentType).toBe('object');
      });

      it('should handle nested tool paths', async () => {
        const result = await resolver.resolve('mcp://server/path/to/tool');
        expect(result.content).toEqual({
          server: 'server',
          tool: 'path/to/tool',
        });
      });
    });

    describe('Oracle reference resolution', () => {
      it('should return oracle placeholder', async () => {
        const result = await resolver.resolve('oracle://agent/performance');
        expect(result.content).toEqual({
          type: 'oracle-ref',
          path: 'agent/performance',
          requiresOracle: true,
        });
      });
    });

    describe('validateStrict', () => {
      it('should validate references and return results', async () => {
        const refs: ReferenceConfig[] = [
          { ref: 'mcp://server/tool' },
          { ref: 'oracle://data/path' },
        ];

        const result = await resolver.validateStrict(refs);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.resolvedRefs).toHaveLength(2);
      });

      it('should report errors for invalid URIs', async () => {
        const refs: ReferenceConfig[] = [
          { ref: 'invalid-uri', enforce: 'strict' },
        ];

        const result = await resolver.validateStrict(refs);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('extractMarkdownSections', () => {
    it('should extract specified sections from markdown', () => {
      const content = `# Document

## Introduction
This is the intro.

## API Reference
This is the API ref.
More API content.

## Conclusion
The end.`;

      const result = extractMarkdownSections(content, ['api reference']);
      expect(result).toContain('## API Reference');
      expect(result).toContain('This is the API ref');
      expect(result).not.toContain('Introduction');
      expect(result).not.toContain('Conclusion');
    });

    it('should handle multiple sections', () => {
      const content = `# Doc

## First
Content 1

## Second
Content 2

## Third
Content 3`;

      const result = extractMarkdownSections(content, ['first', 'third']);
      expect(result).toContain('## First');
      expect(result).toContain('## Third');
      expect(result).not.toContain('## Second');
    });

    it('should return empty string for no matches', () => {
      const content = '## Only Section\nContent here.';
      const result = extractMarkdownSections(content, ['missing']);
      expect(result).toBe('');
    });
  });

  // ============ Truth Loader Tests ============
  describe('TruthLoader', () => {
    let loader: TruthLoader;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'truth-test-'));
      loader = new TruthLoader({
        globalTruthPath: path.join(tempDir, 'global'),
        workingDir: tempDir,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('load', () => {
      it('should return empty truth when no files exist', async () => {
        const result = await loader.load();
        expect(result.truth).toEqual({});
        expect(result.sources.global).toBeNull();
        expect(result.sources.project).toBeNull();
      });

      it('should load global truth when it exists', async () => {
        const globalDir = path.join(tempDir, 'global');
        await fs.mkdir(globalDir, { recursive: true });
        await fs.writeFile(
          path.join(globalDir, 'truth.yaml'),
          'version: "1.0.0"\npaths:\n  forbidden:\n    - pattern: "**/test/**"\n      reason: "Test rule"'
        );

        const result = await loader.load();
        expect(result.truth.version).toBe('1.0.0');
        expect(result.truth.paths?.forbidden).toHaveLength(1);
        expect(result.sources.global).toContain('truth.yaml');
      });

      it('should load project truth when it exists', async () => {
        const projectDir = path.join(tempDir, '.construct');
        await fs.mkdir(projectDir, { recursive: true });
        await fs.writeFile(
          path.join(projectDir, 'truth.yaml'),
          'custom:\n  project_name: "Test Project"'
        );

        const result = await loader.load();
        expect(result.truth.custom?.project_name).toBe('Test Project');
        expect(result.sources.project).toContain('truth.yaml');
      });

      it('should merge global and project truth', async () => {
        // Create global truth
        const globalDir = path.join(tempDir, 'global');
        await fs.mkdir(globalDir, { recursive: true });
        await fs.writeFile(
          path.join(globalDir, 'truth.yaml'),
          `version: "1.0.0"
paths:
  forbidden:
    - pattern: "**/global/**"
      reason: "Global rule"
custom:
  global_key: "global_value"`
        );

        // Create project truth
        const projectDir = path.join(tempDir, '.construct');
        await fs.mkdir(projectDir, { recursive: true });
        await fs.writeFile(
          path.join(projectDir, 'truth.yaml'),
          `paths:
  forbidden:
    - pattern: "**/project/**"
      reason: "Project rule"
custom:
  project_key: "project_value"`
        );

        const result = await loader.load();

        // Version from global (project doesn't override)
        expect(result.truth.version).toBe('1.0.0');

        // Arrays are concatenated
        expect(result.truth.paths?.forbidden).toHaveLength(2);

        // Objects are deep merged
        expect(result.truth.custom?.global_key).toBe('global_value');
        expect(result.truth.custom?.project_key).toBe('project_value');
      });
    });

    describe('get', () => {
      it('should get value by dot-notation path', async () => {
        const globalDir = path.join(tempDir, 'global');
        await fs.mkdir(globalDir, { recursive: true });
        await fs.writeFile(
          path.join(globalDir, 'truth.yaml'),
          `limits:
  cost:
    max_per_request: 0.10`
        );

        await loader.load();
        const value = await loader.get<number>('limits.cost.max_per_request');
        expect(value).toBe(0.10);
      });

      it('should return undefined for non-existent paths', async () => {
        await loader.load();
        const value = await loader.get('nonexistent.path');
        expect(value).toBeUndefined();
      });
    });

    describe('reload', () => {
      it('should reload truth from sources', async () => {
        const globalDir = path.join(tempDir, 'global');
        await fs.mkdir(globalDir, { recursive: true });
        await fs.writeFile(
          path.join(globalDir, 'truth.yaml'),
          'version: "1.0.0"'
        );

        await loader.load();
        expect((await loader.getTruth()).version).toBe('1.0.0');

        // Update the file
        await fs.writeFile(
          path.join(globalDir, 'truth.yaml'),
          'version: "2.0.0"'
        );

        await loader.reload();
        expect((await loader.getTruth()).version).toBe('2.0.0');
      });
    });

    describe('initializeGlobalTruth', () => {
      it('should create global truth directory structure', async () => {
        await loader.initializeGlobalTruth();

        const truthFile = path.join(tempDir, 'global', 'truth.yaml');
        const exists = await fs.access(truthFile).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      });
    });

    describe('initializeProjectTruth', () => {
      it('should create project truth file', async () => {
        await loader.initializeProjectTruth(tempDir);

        const truthFile = path.join(tempDir, '.construct', 'truth.yaml');
        const exists = await fs.access(truthFile).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      });
    });
  });

  // ============ Registry Tests ============
  describe('Registry', () => {
    let registry: Registry;

    beforeEach(() => {
      registry = new Registry();
    });

    describe('Tool Registration', () => {
      it('should register a tool', () => {
        const tool = registry.registerTool({
          id: 'tool-1',
          name: 'Test Tool',
          source: 'internal',
          capabilities: [{ name: 'read', description: 'Read data' }],
        });

        expect(tool.id).toBe('tool-1');
        expect(tool.type).toBe('tool');
        expect(tool.status).toBe('active');
        expect(tool.registeredAt).toBeInstanceOf(Date);
      });

      it('should get tool by ID', () => {
        registry.registerTool({
          id: 'tool-1',
          name: 'Test Tool',
          source: 'internal',
          capabilities: [],
        });

        const tool = registry.getTool('tool-1');
        expect(tool?.name).toBe('Test Tool');
      });

      it('should return undefined for unknown tool', () => {
        expect(registry.getTool('unknown')).toBeUndefined();
      });

      it('should get all tools', () => {
        registry.registerTool({ id: 't1', name: 'Tool 1', source: 'internal', capabilities: [] });
        registry.registerTool({ id: 't2', name: 'Tool 2', source: 'mcp', capabilities: [] });

        const tools = registry.getAllTools();
        expect(tools).toHaveLength(2);
      });

      it('should find tools by capability', () => {
        registry.registerTool({
          id: 't1',
          name: 'Reader',
          source: 'internal',
          capabilities: [{ name: 'read' }],
        });
        registry.registerTool({
          id: 't2',
          name: 'Writer',
          source: 'internal',
          capabilities: [{ name: 'write' }],
        });

        const readers = registry.findToolsByCapability('read');
        expect(readers).toHaveLength(1);
        expect(readers[0]?.name).toBe('Reader');
      });

      it('should find tools by source', () => {
        registry.registerTool({ id: 't1', name: 'Internal', source: 'internal', capabilities: [] });
        registry.registerTool({ id: 't2', name: 'MCP', source: 'mcp', capabilities: [] });

        const mcpTools = registry.findToolsBySource('mcp');
        expect(mcpTools).toHaveLength(1);
        expect(mcpTools[0]?.name).toBe('MCP');
      });

      it('should unregister a tool', () => {
        registry.registerTool({ id: 't1', name: 'Tool', source: 'internal', capabilities: [] });
        expect(registry.unregisterTool('t1')).toBe(true);
        expect(registry.getTool('t1')).toBeUndefined();
      });
    });

    describe('Agent Registration', () => {
      it('should register an agent', () => {
        const agent = registry.registerAgent({
          id: 'agent-1',
          name: 'Code Reviewer',
          agentType: 'code-review',
          level: 'reliable',
          skills: [{ id: 'typescript', name: 'TypeScript', level: 'advanced' }],
        });

        expect(agent.id).toBe('agent-1');
        expect(agent.type).toBe('agent');
        expect(agent.level).toBe('reliable');
      });

      it('should find agents by skill', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Agent 1',
          agentType: 'dev',
          level: 'rookie',
          skills: [{ id: 'typescript', name: 'TypeScript', level: 'basic' }],
        });
        registry.registerAgent({
          id: 'a2',
          name: 'Agent 2',
          agentType: 'qa',
          level: 'reliable',
          skills: [{ id: 'testing', name: 'Testing', level: 'expert' }],
        });

        const tsAgents = registry.findAgentsBySkill('typescript');
        expect(tsAgents).toHaveLength(1);
        expect(tsAgents[0]?.name).toBe('Agent 1');
      });

      it('should find agents by minimum level', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Rookie',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });
        registry.registerAgent({
          id: 'a2',
          name: 'Trusted',
          agentType: 'dev',
          level: 'trusted',
          skills: [],
        });
        registry.registerAgent({
          id: 'a3',
          name: 'Expert',
          agentType: 'dev',
          level: 'expert',
          skills: [],
        });

        const trustedAndAbove = registry.findAgentsByMinLevel('trusted');
        expect(trustedAndAbove).toHaveLength(2);
        expect(trustedAndAbove.map(a => a.name).sort()).toEqual(['Expert', 'Trusted']);
      });

      it('should find agents by type', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Dev 1',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });
        registry.registerAgent({
          id: 'a2',
          name: 'QA 1',
          agentType: 'qa',
          level: 'reliable',
          skills: [],
        });

        const devAgents = registry.findAgentsByType('dev');
        expect(devAgents).toHaveLength(1);
        expect(devAgents[0]?.name).toBe('Dev 1');
      });

      it('should update agent level', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });

        expect(registry.updateAgentLevel('a1', 'expert')).toBe(true);
        expect(registry.getAgent('a1')?.level).toBe('expert');
      });

      it('should add skill to agent', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });

        expect(registry.addAgentSkill('a1', {
          id: 'new-skill',
          name: 'New Skill',
          level: 'intermediate',
        })).toBe(true);

        const agent = registry.getAgent('a1');
        expect(agent?.skills).toHaveLength(1);
        expect(agent?.skills[0]?.id).toBe('new-skill');
      });

      it('should not add duplicate skills', () => {
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'rookie',
          skills: [{ id: 'skill-1', name: 'Skill', level: 'basic' }],
        });

        registry.addAgentSkill('a1', { id: 'skill-1', name: 'Skill Updated', level: 'advanced' });

        const agent = registry.getAgent('a1');
        expect(agent?.skills).toHaveLength(1);
      });
    });

    describe('Service Registration', () => {
      it('should register a service', () => {
        const service = registry.registerService({
          id: 'svc-1',
          name: 'API Service',
          serviceType: 'api',
          endpoint: 'http://localhost:3000',
          healthCheckUrl: 'http://localhost:3000/health',
          capabilities: ['rest', 'graphql'],
        });

        expect(service.id).toBe('svc-1');
        expect(service.type).toBe('service');
        expect(service.status).toBe('unknown');
      });

      it('should find services by capability', () => {
        registry.registerService({
          id: 's1',
          name: 'REST API',
          serviceType: 'api',
          capabilities: ['rest'],
        });
        registry.registerService({
          id: 's2',
          name: 'GraphQL API',
          serviceType: 'api',
          capabilities: ['graphql'],
        });

        const restServices = registry.findServicesByCapability('rest');
        expect(restServices).toHaveLength(1);
        expect(restServices[0]?.name).toBe('REST API');
      });
    });

    describe('Health Checks', () => {
      it('should return healthy for entry without health check URL', async () => {
        registry.registerTool({
          id: 't1',
          name: 'Tool',
          source: 'internal',
          capabilities: [],
        });

        const result = await registry.checkHealth('t1');
        expect(result.healthy).toBe(true);
        expect(result.id).toBe('t1');
      });

      it('should return unhealthy for unknown entry', async () => {
        const result = await registry.checkHealth('unknown');
        expect(result.healthy).toBe(false);
        expect(result.error).toBe('Entry not found');
      });
    });

    describe('Query Methods', () => {
      beforeEach(() => {
        registry.registerTool({ id: 't1', name: 'Tool', source: 'mcp', capabilities: [] });
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'trusted',
          skills: [],
        });
        registry.registerService({
          id: 's1',
          name: 'Service',
          serviceType: 'api',
          capabilities: [],
        });
      });

      it('should find all entries without filter', () => {
        const results = registry.find({});
        expect(results).toHaveLength(3);
      });

      it('should filter by type', () => {
        const tools = registry.find({ type: 'tool' });
        expect(tools).toHaveLength(1);

        const agents = registry.find({ type: 'agent' });
        expect(agents).toHaveLength(1);
      });

      it('should filter by status', () => {
        const active = registry.find({ status: 'active' });
        expect(active.length).toBeGreaterThan(0);
      });
    });

    describe('Statistics', () => {
      it('should return registry statistics', () => {
        registry.registerTool({ id: 't1', name: 'Tool 1', source: 'internal', capabilities: [] });
        registry.registerTool({ id: 't2', name: 'Tool 2', source: 'mcp', capabilities: [] });
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });
        registry.registerService({
          id: 's1',
          name: 'Service',
          serviceType: 'api',
          capabilities: [],
        });

        const stats = registry.getStats();

        expect(stats.tools.total).toBe(2);
        expect(stats.tools.active).toBe(2);
        expect(stats.tools.bySource['internal']).toBe(1);
        expect(stats.tools.bySource['mcp']).toBe(1);

        expect(stats.agents.total).toBe(1);
        expect(stats.agents.byLevel.rookie).toBe(1);

        expect(stats.services.total).toBe(1);
      });
    });

    describe('Clear', () => {
      it('should clear all registrations', () => {
        registry.registerTool({ id: 't1', name: 'Tool', source: 'internal', capabilities: [] });
        registry.registerAgent({
          id: 'a1',
          name: 'Agent',
          agentType: 'dev',
          level: 'rookie',
          skills: [],
        });

        registry.clear();

        expect(registry.getAllTools()).toHaveLength(0);
        expect(registry.getAllAgents()).toHaveLength(0);
        expect(registry.getAllServices()).toHaveLength(0);
      });
    });
  });

  // ============ Architect Integration Tests ============
  describe('Architect Integration', () => {
    let architect: Architect;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'architect-test-'));
      architect = new Architect({
        workingDir: tempDir,
        resolverConfig: {
          basePaths: {
            guide: path.join(tempDir, 'guides'),
            schema: path.join(tempDir, 'schemas'),
            config: path.join(tempDir, 'config'),
          },
        },
      });
      await architect.initialize();
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('getRegistry', () => {
      it('should return the registry instance', () => {
        const registry = architect.getRegistry();
        expect(registry).toBeInstanceOf(Registry);
      });

      it('should allow registering tools via registry', () => {
        const registry = architect.getRegistry();
        registry.registerTool({
          id: 't1',
          name: 'Test Tool',
          source: 'internal',
          capabilities: [],
        });

        expect(registry.getTool('t1')).toBeDefined();
      });
    });

    describe('getReferenceResolver', () => {
      it('should return the reference resolver instance', () => {
        const resolver = architect.getReferenceResolver();
        expect(resolver).toBeInstanceOf(ReferenceResolver);
      });
    });

    describe('getTruthLoader', () => {
      it('should return the truth loader instance', () => {
        const loader = architect.getTruthLoader();
        expect(loader).toBeInstanceOf(TruthLoader);
      });
    });

    describe('resolveReference', () => {
      it('should resolve MCP references', async () => {
        const result = await architect.resolveReference('mcp://server/tool');
        expect(result.content).toEqual({
          server: 'server',
          tool: 'tool',
        });
      });

      it('should resolve oracle references', async () => {
        const result = await architect.resolveReference('oracle://agent/stats');
        expect(result.content).toHaveProperty('type', 'oracle-ref');
      });
    });

    describe('setTemplateVars', () => {
      it('should set template variables for resolution', async () => {
        architect.setTemplateVars({ agent_id: 'test-agent' });

        // Template vars should be set on the resolver
        const resolver = architect.getReferenceResolver();
        expect(() => resolver.resolveTemplateVars('{agent_id}')).not.toThrow();
      });
    });

    describe('getLoadedTruthInfo', () => {
      it('should return loaded truth info', () => {
        const info = architect.getLoadedTruthInfo();
        expect(info).not.toBeNull();
        expect(info?.loadedAt).toBeInstanceOf(Date);
      });
    });

    describe('reload', () => {
      it('should reload truth from sources', async () => {
        // Create a truth file
        const constructDir = path.join(tempDir, '.construct');
        await fs.mkdir(constructDir, { recursive: true });
        await fs.writeFile(
          path.join(constructDir, 'truth.yaml'),
          'version: "1.0.0"'
        );

        await architect.reload();

        const truth = await architect.getTruth();
        expect(truth.version).toBe('1.0.0');
      });
    });

    describe('initializeGlobalTruth', () => {
      it('should initialize global truth directory', async () => {
        // This test validates the method exists and can be called
        await expect(architect.initializeGlobalTruth()).resolves.not.toThrow();
      });
    });

    describe('initializeProjectTruth', () => {
      it('should initialize project truth file', async () => {
        await architect.initializeProjectTruth(tempDir);

        const truthFile = path.join(tempDir, '.construct', 'truth.yaml');
        const exists = await fs.access(truthFile).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      });
    });
  });
});
