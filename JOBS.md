# JOBS - Active Work Tracker
<!-- AI-RESUMABLE: This file is designed for AI model consumption -->
<!-- LAST_UPDATED: 2026-01-23T17:00:00Z -->
<!-- SESSION_CONTEXT: Handoff from visual-forge-mcp, ready for Phase 1 implementation -->

> **Note:** Completed jobs are archived to [`JOBS_COMPLETED.md`](JOBS_COMPLETED.md)

## ACTIVE_JOBS

### JOB:construct-phase-1-implementation
- STATUS: pending
- PRIORITY: high
- STARTED: 2026-01-23
- PLAN_DOC: docs/implementation-plan.md
- CURRENT_PHASE: 1
- PHASES:
  - [ ] Phase 1: Foundation (IN_PROGRESS) <-- CURRENT
    - [ ] Contract schema with Zod validation
    - [ ] Architect loads config, provides read-only access
    - [ ] Contract executor runs simple contracts
    - [ ] Sentinels validate outputs (pass/fail/score)
    - [ ] Worker executes AI calls with tool support
    - [ ] Test: Execute image generation contract end-to-end
  - [ ] Phase 2: Oracle & Level-Up (PENDING)
  - [ ] Phase 3: Multi-Provider / Keymaker (PENDING)
  - [ ] Phase 4: Reference System & Full Architect (PENDING)
  - [ ] Phase 5: Full Sentinels / QA System (PENDING)
- BLOCKED_BY: null
- NEXT_ACTION: Create contract.schema.ts with Zod validation
- CONTEXT: |
    **Origin:** Brainstormed in visual-forge-mcp project
    **Problem:** AI amnesia - CLAUDE.md approach doesn't work, AI ignores rules
    **Solution:** Code-driven orchestration with AI working within contracts

    **Core Principle:** "Code that calls AI, not AI that calls code"

    **Architecture Components:**
    - The Architect: Source of Truth (configs, rules, limits)
    - The Oracle: Judgment & Insight (XP, levels, feedback)
    - The Agents: Orchestrator (enforces rules, executes contracts)
    - The Sentinels: QA & Enforcement (validates, blocks unauthorized)
    - The Programs: Workers (execute within contracts)
    - The Keymaker: Tool Adapter (LiteLLM, provider-agnostic)

    **Key Documents:**
    - docs/architecture.md - Full architecture details
    - docs/contract-schema.md - Complete contract YAML schema
    - docs/implementation-plan.md - Phase-by-phase plan
    - docs/reference-system.md - URI-based references
    - docs/level-up-system.md - XP mechanics

    **Technology Stack:**
    - Zod for schema validation
    - LiteLLM for AI gateway
    - better-sqlite3 for persistence
    - YAML for contracts
    - Jest for testing

    **Phase 1 Files to Create:**
    1. src/architect/schemas/contract.schema.ts
    2. src/architect/architect.ts
    3. src/agents/contract-executor.ts
    4. src/sentinels/sentinels.ts
    5. src/programs/worker.ts
    6. src/types/*.ts

- ARTIFACTS:
    - created:
      - docs/architecture.md
      - docs/contract-schema.md
      - docs/implementation-plan.md
      - docs/reference-system.md
      - docs/level-up-system.md
      - README.md
      - CLAUDE.md
    - modified: []
    - pending:
      - src/architect/schemas/contract.schema.ts
      - src/architect/architect.ts
      - src/agents/contract-executor.ts
      - src/sentinels/sentinels.ts
      - src/programs/worker.ts
      - src/types/contract.ts
      - src/types/judgment.ts
      - src/types/agent.ts
      - test/contract.test.ts
