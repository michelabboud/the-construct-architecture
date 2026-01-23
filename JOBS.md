# JOBS - Active Work Tracker
<!-- AI-RESUMABLE: This file is designed for AI model consumption -->
<!-- LAST_UPDATED: 2026-01-23T21:00:00Z -->
<!-- SESSION_CONTEXT: Phase 3 Multi-Provider / Keymaker complete - 187 tests passing -->

> **Note:** Completed jobs are archived to [`JOBS_COMPLETED.md`](JOBS_COMPLETED.md)

## ACTIVE_JOBS

### JOB:construct-phase-1-implementation
- STATUS: in_progress
- PRIORITY: high
- STARTED: 2026-01-23
- PLAN_DOC: docs/implementation-plan.md
- CURRENT_PHASE: 3 (Complete)
- PHASES:
  - [x] Phase 1: Foundation (COMPLETED)
    - [x] Contract schema with Zod validation
    - [x] Architect loads config, provides read-only access
    - [x] Contract executor runs simple contracts
    - [x] Sentinels validate outputs (pass/fail/score)
    - [x] Worker executes tasks (placeholder, real AI in Phase 3)
    - [x] Test: 74 tests passing
  - [x] Phase 2: Oracle & Level-Up (COMPLETED)
    - [x] Database layer with sql.js (pure JS SQLite)
    - [x] AgentProfileStore for persistence
    - [x] Oracle judgment system (approved/needs_revision/rejected)
    - [x] XP award calculation with bonuses
    - [x] Achievement tracking
    - [x] Specialization tracking per task type
    - [x] Oracle integrated with ContractExecutor
    - [x] Test: 145 tests passing
  - [x] Phase 3: Multi-Provider / Keymaker (COMPLETED)
    - [x] Provider registry with OpenAI, Anthropic, Google, Groq, Together, Ollama
    - [x] Unified AI client using OpenAI SDK for compatible providers
    - [x] Tool adapters for Anthropic and Google Gemini
    - [x] Provider router with Oracle integration for performance-based routing
    - [x] Keymaker class with generate, chat, executeWithTools
    - [x] Worker integrated with Keymaker for real AI calls
    - [x] Cost estimation and tracking
    - [x] Fallback execution with multiple provider attempts
    - [x] Test: 187 tests passing
  - [ ] Phase 4: Reference System & Full Architect (PENDING)
  - [ ] Phase 5: Full Sentinels / QA System (PENDING)
- BLOCKED_BY: null
- NEXT_ACTION: Begin Phase 4 - Reference System & Full Architect
- CONTEXT: |
    **Session Progress (2026-01-23):**

    **Phase 1 (Complete):**
    - Fixed package.json (removed litellm, better-sqlite3 deferred to Phase 2)
    - Implemented minimatch-based pattern matching for Architect & Sentinels
    - Created comprehensive test suites

    **Phase 2 (Complete):**
    - Installed sql.js (pure JS SQLite, works with Node 24)
    - Created database layer and AgentProfileStore
    - Full Oracle judgment implementation
    - All 145 tests passing

    **Phase 3 (Complete):**
    - Discovered litellm is Python-only, implemented custom solution
    - Created provider registry (src/keymaker/providers.ts)
      - 6 providers: OpenAI, Anthropic, Google, Groq, Together, Ollama
      - Model definitions with pricing, capabilities, context windows
    - Created unified AI client (src/keymaker/ai-client.ts)
      - OpenAI SDK wrapper for compatible providers
      - Message conversion, tool handling
    - Created tool adapters (src/keymaker/tool-adapters/)
      - Anthropic adapter with direct HTTP requests
      - Google Gemini adapter with direct HTTP requests
    - Created provider router (src/keymaker/router.ts)
      - Oracle integration for performance-based routing
      - Cost, latency, and capability-based scoring
      - Fallback execution with multiple attempts
    - Updated Keymaker class (src/keymaker/keymaker.ts)
      - generate(), chat(), executeWithTools()
      - Contract constraint extraction
      - Provider testing
    - Updated Worker (src/programs/worker.ts)
      - Integrated with Keymaker
      - Builds prompts from contracts
      - Supports tool execution
    - Fixed many exactOptionalPropertyTypes issues
    - All 187 tests passing

    **Core Principle:** "Code that calls AI, not AI that calls code"

    **Architecture Components Status:**
    - The Architect: ✅ Working (minimatch patterns, contract validation)
    - The Oracle: ✅ Working (judgment, XP, achievements, persistence)
    - The Agents: ✅ ContractExecutor with Oracle integration
    - The Sentinels: ✅ Working (action/path/tool blocking, output validation)
    - The Programs: ✅ Worker with Keymaker integration
    - The Keymaker: ✅ Working (multi-provider, routing, tools)

    **Technology Stack:**
    - Zod for schema validation ✅
    - minimatch for glob patterns ✅
    - Jest for testing ✅
    - YAML parsing ✅
    - sql.js for SQLite ✅
    - OpenAI SDK for AI gateway ✅

- ARTIFACTS:
    - created:
      - src/keymaker/providers.ts (Phase 3)
      - src/keymaker/ai-client.ts (Phase 3)
      - src/keymaker/router.ts (Phase 3)
      - src/keymaker/tool-adapters/index.ts (Phase 3)
      - src/keymaker/tool-adapters/anthropic-adapter.ts (Phase 3)
      - src/keymaker/tool-adapters/google-adapter.ts (Phase 3)
      - test/keymaker.test.ts (Phase 3)
    - modified:
      - src/keymaker/keymaker.ts (full implementation)
      - src/programs/worker.ts (Keymaker integration)
      - package.json (added openai SDK)
    - pending:
      - Phase 4: Reference System & Full Architect
      - Phase 5: Full Sentinels / QA System
