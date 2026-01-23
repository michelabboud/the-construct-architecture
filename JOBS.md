# JOBS - Active Work Tracker
<!-- AI-RESUMABLE: This file is designed for AI model consumption -->
<!-- LAST_UPDATED: 2026-01-23T20:00:00Z -->
<!-- SESSION_CONTEXT: Phase 2 Oracle & Level-Up complete - 145 tests passing -->

> **Note:** Completed jobs are archived to [`JOBS_COMPLETED.md`](JOBS_COMPLETED.md)

## ACTIVE_JOBS

### JOB:construct-phase-1-implementation
- STATUS: in_progress
- PRIORITY: high
- STARTED: 2026-01-23
- PLAN_DOC: docs/implementation-plan.md
- CURRENT_PHASE: 2 (Complete)
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
  - [ ] Phase 3: Multi-Provider / Keymaker (PENDING)
  - [ ] Phase 4: Reference System & Full Architect (PENDING)
  - [ ] Phase 5: Full Sentinels / QA System (PENDING)
- BLOCKED_BY: null
- NEXT_ACTION: Begin Phase 3 - Keymaker / Multi-Provider AI integration
- CONTEXT: |
    **Session Progress (2026-01-23):**

    **Phase 1 (Complete):**
    - Fixed package.json (removed litellm, better-sqlite3 deferred to Phase 2)
    - Implemented minimatch-based pattern matching for Architect & Sentinels
    - Created comprehensive test suites

    **Phase 2 (Complete):**
    - Installed sql.js (pure JS SQLite, works with Node 24)
    - Created src/oracle/database.ts with SQLite wrapper
    - Created src/oracle/agent-profile-store.ts for persistence
    - Rewrote src/oracle/oracle.ts with full judgment logic:
      - Verdict determination (approved/needs_revision/rejected)
      - XP calculation with bonuses (score, speed, budget, streaks)
      - Achievement tracking
      - Compliance assessment
      - Quality scoring
    - Integrated Oracle with ContractExecutor
    - Created comprehensive tests:
      - test/level-up.test.ts (20 tests)
      - test/agent-profile-store.test.ts (17 tests)
      - test/oracle.test.ts (21 tests)
      - test/integration/oracle-integration.test.ts (13 tests)
    - All 145 tests passing

    **Core Principle:** "Code that calls AI, not AI that calls code"

    **Architecture Components Status:**
    - The Architect: ✅ Working (minimatch patterns, contract validation)
    - The Oracle: ✅ Working (judgment, XP, achievements, persistence)
    - The Agents: ✅ ContractExecutor with Oracle integration
    - The Sentinels: ✅ Working (action/path/tool blocking, output validation)
    - The Programs: ✅ Worker working (placeholder execution)
    - The Keymaker: ⏳ Phase 3

    **Technology Stack:**
    - Zod for schema validation ✅
    - minimatch for glob patterns ✅
    - Jest for testing ✅
    - YAML parsing ✅
    - sql.js for SQLite ✅
    - LiteLLM client (Phase 3)

- ARTIFACTS:
    - created:
      - docs/architecture.md
      - docs/contract-schema.md
      - docs/implementation-plan.md
      - docs/reference-system.md
      - docs/level-up-system.md
      - README.md
      - CLAUDE.md
      - jest.config.js
      - test/contract.schema.test.ts
      - test/architect.test.ts
      - test/sentinels.test.ts
      - test/integration/contract-execution.test.ts
      - test/fixtures/valid-contract.yaml
      - test/fixtures/invalid-contract.yaml
      - src/oracle/database.ts (Phase 2)
      - src/oracle/agent-profile-store.ts (Phase 2)
      - test/level-up.test.ts (Phase 2)
      - test/agent-profile-store.test.ts (Phase 2)
      - test/oracle.test.ts (Phase 2)
      - test/integration/oracle-integration.test.ts (Phase 2)
    - modified:
      - package.json (added sql.js, @types/sql.js)
      - src/architect/architect.ts (minimatch integration)
      - src/sentinels/sentinels.ts (minimatch integration)
      - src/oracle/level-up.ts (TypeScript fixes)
      - src/oracle/oracle.ts (full implementation)
      - src/agents/contract-executor.ts (Oracle integration)
    - pending:
      - Phase 3: Keymaker AI integration with LiteLLM
