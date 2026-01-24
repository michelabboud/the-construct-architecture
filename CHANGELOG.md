# Changelog

All notable changes to The Construct Architecture project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 4: Reference System & Full Architect
- **Reference Resolver** (`src/architect/references/reference-resolver.ts`)
  - URI-based reference system with 10 schemes: guide, tool, mcp, agent, skill, schema, template, config, architect, oracle
  - Template variable substitution (`{agent_id}`, `{task_type}`, etc.)
  - Caching with configurable TTL
  - Strict vs advisory enforcement modes
  - Markdown section extraction utility
- **Truth Loader** (`src/architect/truth-loader.ts`)
  - Global truth loading from `~/.construct/truth/truth.yaml`
  - Project truth loading from `.construct/truth.yaml`
  - Deep merge with inheritance (arrays concatenate, objects merge)
  - Dot-notation path access for config values
  - Initialization methods for global and project truth
- **Registry** (`src/architect/registry.ts`)
  - Tool registration with capabilities
  - Agent registration with skills and levels (rookie, reliable, trusted, expert)
  - Service registration with health checks
  - Query methods for capability, skill, and level filtering
  - Statistics and monitoring
- **Architect Integration**
  - `validateContractFull()` for contract reference validation
  - `resolveReference()` for URI resolution
  - `setTemplateVars()` for template variables
  - `getRegistry()`, `getReferenceResolver()`, `getTruthLoader()` accessors
  - `reload()` for truth reloading
- **Tests**: 62 new Phase 4 tests (249 total)

### Added - Phase 3: Multi-Provider / Keymaker
- **Provider Registry** (`src/keymaker/providers.ts`)
  - 6 providers: OpenAI, Anthropic, Google Gemini, Groq, Together, Ollama
  - 18+ model definitions with pricing, capabilities, and context windows
- **Unified AI Client** (`src/keymaker/ai-client.ts`)
  - OpenAI SDK wrapper for compatible providers
  - Message conversion and tool handling
- **Tool Adapters** (`src/keymaker/tool-adapters/`)
  - Anthropic adapter for native API
  - Google Gemini adapter for native API
- **Provider Router** (`src/keymaker/router.ts`)
  - Oracle integration for performance-based routing
  - Cost, latency, and capability-based scoring
  - Fallback execution with multiple attempts
- **Keymaker Class** (`src/keymaker/keymaker.ts`)
  - `generate()`, `chat()`, `executeWithTools()` methods
  - Contract constraint extraction
  - Provider testing
- **Worker Integration** (`src/programs/worker.ts`)
  - Keymaker integration for real AI calls
  - Contract-based prompt building
  - Tool execution support
- **Tests**: 42 new Phase 3 tests (187 total at end of Phase 3)

### Added - Phase 2: Oracle & Level-Up
- **Database Layer** (`src/database/`)
  - sql.js (pure JS SQLite) for persistence
  - AgentProfileStore for agent data
- **Oracle** (`src/oracle/`)
  - Judgment system (approved, needs_revision, rejected)
  - XP award calculation with bonuses
  - Achievement tracking
  - Specialization tracking per task type
- **Integration**
  - ContractExecutor with Oracle integration
- **Tests**: 71 new Phase 2 tests (145 total at end of Phase 2)

### Added - Phase 1: Foundation
- **Contract Schema** (`src/architect/schemas/contract.schema.ts`)
  - Zod validation for contracts
  - TypeScript type inference
- **Architect** (`src/architect/architect.ts`)
  - Config loading with read-only access
  - Path and action validation
  - Pattern matching with minimatch
- **Contract Executor** (`src/agents/contract-executor.ts`)
  - Simple contract execution
- **Sentinels** (`src/sentinels/`)
  - Output validation (pass/fail/score)
  - Action and path blocking
- **Worker** (`src/programs/worker.ts`)
  - Task execution (placeholder for Phase 3)
- **Tests**: 74 Phase 1 tests

## [0.1.0] - 2026-01-23

### Added
- Initial project structure
- Documentation (architecture.md, contract-schema.md, reference-system.md)
- TypeScript configuration with strict mode
- Jest testing setup
