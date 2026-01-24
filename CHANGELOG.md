# Changelog

All notable changes to The Construct Architecture project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-25

### Changed - Dependencies & Code Quality

#### Dependency Upgrades
- **Zod** 3.x → 4.3.6
  - Breaking change: `.error.errors` renamed to `.error.issues`
  - Updated 2 files: `workflow/loader.ts`, `validators/output-validator.ts`
- **ESLint** 8.x → 9.39.2
  - Migrated to flat config format (`eslint.config.js`)
  - Removed deprecated `.eslintrc` style config
- **typescript-eslint** 6.x → 8.53.1
  - Parser and plugin updated together
- **@types/node** 20.x → 25.x

#### Code Quality
- Fixed all 71 ESLint warnings → 0
  - Commented unused imports with `// Future use:` annotations
  - Prefixed unused parameters with underscore (`_param`)
  - Wrapped case block declarations in braces
- Enforced zero-warning policy: `--max-warnings 0`
  - Warnings now fail the lint command
  - Prevents silent accumulation of technical debt

### Files Modified
- 29 source files across architect, chaos, keymaker, morpheus, oracle, security, and sentinels modules
- New: `eslint.config.js` (ESLint 9 flat config)

## [1.0.0] - 2026-01-24

### 🎉 Production Release

The Construct Architecture is now production-ready with **927 passing tests**.

### Added - Phase 8: Morpheus Migration Wizard

Complete AI-powered migration wizard to help projects migrate to The Construct architecture.

#### Phase 8a: Foundation & Workflow Engine (68 tests)
- **Core Types** (`src/types/morpheus.ts`)
  - Comprehensive TypeScript types for migration workflow
  - Project scanning, analysis, and planning types
  - Workflow, checklist, and state types
- **Workflow System** (`src/morpheus/workflow/`)
  - YAML workflow loader with Zod validation
  - Checklist manager with progress tracking
  - SQLite state persistence for session recovery
- **Morpheus Commander** (`src/morpheus/morpheus.ts`)
  - Main orchestrator for the migration crew
  - Red pill / blue pill choice feature
  - Agent registration and workflow management

#### Phase 8b: Tank Agent - The Operator (47 tests)
- **Project Scanner** (`src/morpheus/crew/tank.ts`)
  - File system scanning with statistics
  - Dependency analysis with AI package detection
  - Configuration scanning with secret detection
  - Import/export extraction
- **Tank Contracts**: scan-project, index-ai-usage, map-dependencies

#### Phase 8c: Mouse Agent - The Designer (65 tests)
- **Code Generator** (`src/morpheus/crew/mouse.ts`)
  - Contract generation from PromptAnalysis
  - Config generation (Architect, Keymaker, Sentinels, Oracle, Smith)
  - TypeScript type generation with Zod schemas
  - Template expansion system ({{var}}, #each, #if, #unless)
  - Scaffolding generation
- **Mouse Contracts**: generate-contract, generate-config, generate-migration, generate-types

#### Phase 8d: Trinity Agent - The Expert (57 tests)
- **Deep Analyzer** (`src/morpheus/crew/trinity.ts`)
  - Prompt analysis (structure, variables, complexity, tokens)
  - Intent extraction (code-generation, review, translation, etc.)
  - Tool analysis (OpenAI/Anthropic/LangChain patterns)
  - Pattern detection (good patterns, anti-patterns)
  - Architecture analysis with scoring
  - AI-powered checklist verification
- **Trinity Contracts**: analyze-prompts, analyze-tools, analyze-patterns, verify-checklist

#### Phase 8e: Switch Agent - The Skeptic (60 tests)
- **Validator** (`src/morpheus/crew/switch.ts`)
  - Contract validation (ID format, version, type, objectives)
  - Config validation (required sections, YAML syntax, security)
  - Migration validation (phases, tasks, rollback, risks)
  - Change auditing (security issues, debug code, sensitive files)
  - Risk-based recommendations (approve/review/reject)
- **Switch Contracts**: validate-contract, validate-migration, audit-changes

#### Phase 8f: Apoc Agent - The Strategist (81 tests)
- **Migration Planner** (`src/morpheus/crew/apoc.ts`)
  - Migration plan generation from FullAnalysis
  - Risk identification (common + analysis-based risks)
  - Risk mitigation with strategies
  - Phase generation for Construct components
  - Task generation with steps and verification
  - Three-point effort estimation (optimistic, realistic, pessimistic)
  - Rollback plan generation
  - Gap analysis between current and target state
- **Apoc Contracts**: generate-plan, assess-risks, estimate-effort

#### Phase 8g: CLI & Reporter (63 tests)
- **Reporter Module** (`src/morpheus/reporter/`)
  - Markdown format with proper headers
  - HTML format with CSS themes (matrix, dark, light)
  - JSON format for programmatic use
  - Migration plan, analysis, validation, and progress reports
- **CLI Module** (`src/morpheus/cli/`)
  - Matrix-themed colorful ANSI output
  - ASCII art banners (large and small)
  - Progress bars and spinners
  - Verbose and quiet modes
  - Crew status display

#### Phase 8h: Knowledge Base (51 tests)
- **Pattern Library** (`src/morpheus/knowledge/patterns.ts`)
  - 15+ patterns across 8 categories
  - Categories: prompt, tool, architecture, error-handling, security, testing, performance, migration
- **Anti-Pattern Library** (`src/morpheus/knowledge/anti-patterns.ts`)
  - 14+ anti-patterns across 6 categories
  - Detection rules with regex/ast/semantic patterns
  - Severity levels (critical, high, medium, low)
- **Best Practices Library** (`src/morpheus/knowledge/best-practices.ts`)
  - 20+ best practices across 7 categories
  - Priority levels (must-have, should-have, nice-to-have)
  - Checklists for each practice
- **Construct Architecture Knowledge** (`src/morpheus/knowledge/construct.ts`)
  - 7 component definitions
  - Migration paths and ordering
  - Dependency validation

#### Phase 8i: Testing & Documentation (25 tests)
- **Integration Tests** (`test/phase8.test.ts`)
  - Crew coordination tests
  - Workflow integration tests
  - Knowledge-guided migration tests
  - Report generation tests
  - CLI integration tests
  - End-to-end migration scenarios
  - Morpheus Commander tests
- **Documentation**
  - `docs/morpheus.md` - Comprehensive API documentation
  - `GUIDE.md` - Complete guide with Matrix theme
  - Updated `README.md` with images and features

### Added - Phase 7: Chaos Engineering - The Twins (61 tests)
- **Ghost - Fault Injection** (`src/chaos/ghost/`)
  - Network failure simulation
  - Latency injection
  - Resource exhaustion tests
  - Provider failure simulation
- **Phantom - Penetration Testing** (`src/chaos/phantom/`)
  - Prompt injection detection
  - Authorization bypass testing
  - Input validation testing
  - Security boundary testing
- **Twins Coordinator** (`src/chaos/twins.ts`)
  - Orchestrates Ghost and Phantom
  - Chaos experiment scheduling
  - Results aggregation

### Added - Phase 6: Security Architecture - Agent Smith (49 tests)
- **Agent Smith** (`src/smith/`)
  - Zero Trust security model
  - Identity verification
  - Authorization enforcement
  - Continuous monitoring
  - Threat detection
  - Security event logging
- **Security Types** (`src/types/security.ts`)
  - Comprehensive security type definitions
  - Identity, authorization, and audit types

### Added - Phase 5: Full Sentinels QA (51 tests)
- **Enhanced Validation** (`src/sentinels/`)
  - All tool calls validated before execution
  - Forbidden paths blocked at runtime
  - Output quality scoring with detailed metrics
  - Escalation to human review for low scores
- **Quality Checks** (`src/sentinels/quality-checks.ts`)
  - Content quality validation
  - Format compliance checking
  - Security content scanning
  - Performance threshold enforcement

### Added - Phase 4: Reference System & Registry
- **Reference Resolver** (`src/architect/references/reference-resolver.ts`)
  - URI-based reference system with 10 schemes
  - Template variable substitution
  - Caching with configurable TTL
- **Truth Loader** (`src/architect/truth-loader.ts`)
  - Global truth loading from `~/.construct/truth/truth.yaml`
  - Project truth loading from `.construct/truth.yaml`
  - Deep merge with inheritance
- **Registry** (`src/architect/registry.ts`)
  - Tool, agent, and service registration
  - Query methods for filtering
- **Tests**: 62 Phase 4 tests

### Added - Phase 3: Multi-Provider Keymaker
- **Provider Registry** (`src/keymaker/providers.ts`)
  - 6 providers: OpenAI, Anthropic, Google Gemini, Groq, Together, Ollama
  - 18+ model definitions with pricing and capabilities
- **Unified AI Client** (`src/keymaker/ai-client.ts`)
  - OpenAI SDK wrapper for compatible providers
- **Tool Adapters** (`src/keymaker/tool-adapters/`)
  - Anthropic and Google Gemini native adapters
- **Provider Router** (`src/keymaker/router.ts`)
  - Performance-based routing with Oracle integration
- **Tests**: 42 Phase 3 tests

### Added - Phase 2: Oracle & Level-Up
- **Database Layer** (`src/database/`)
  - sql.js (pure JS SQLite) for persistence
- **Oracle** (`src/oracle/`)
  - Judgment system
  - XP award calculation
  - Achievement tracking
  - Specialization tracking
- **Tests**: 71 Phase 2 tests

### Added - Phase 1: Foundation
- **Contract Schema** with Zod validation
- **Architect** - Source of truth, config loading
- **Contract Executor** - Simple contract execution
- **Sentinels** - Output validation
- **Worker** - Task execution
- **Tests**: 74 Phase 1 tests

### Documentation
- `GUIDE.md` - Comprehensive guide with Matrix theme
- `README.md` - Updated with images and full documentation
- `docs/morpheus.md` - Migration wizard documentation
- `docs/architecture.md` - Full architecture details
- `docs/security-architecture.md` - Security with Agent Smith
- `docs/contract-schema.md` - Contract YAML schema
- `docs/level-up-system.md` - XP and leveling mechanics

### Brand Assets
- `docs/images/logo.webp` - The Construct logo
- `docs/images/cover-system.webp` - System overview
- `docs/images/cover-architect.webp` - Architect component
- `docs/images/cover-code-flow.webp` - Execution flow

## [0.1.0] - 2026-01-23

### Added
- Initial project structure
- Documentation (architecture.md, contract-schema.md, reference-system.md)
- TypeScript configuration with strict mode
- Jest testing setup
