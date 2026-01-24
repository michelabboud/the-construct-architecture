# JOBS - Active Work Tracker
<!-- AI-RESUMABLE: This file is designed for AI model consumption -->
<!-- LAST_UPDATED: 2026-01-24T03:30:00Z -->
<!-- SESSION_CONTEXT: Phase 7 complete. Morpheus Migration Wizard planning in progress. -->

> **Note:** Completed jobs are archived to [`JOBS_COMPLETED.md`](JOBS_COMPLETED.md)

## ACTIVE_JOBS

### JOB:morpheus-migration-wizard
- STATUS: planning
- PRIORITY: high
- STARTED: 2026-01-24
- PLAN_DOC: docs/plans/morpheus-migration-wizard-plan.md
- DEPENDS_ON: null
- CURRENT_PHASE: Planning
- PHASES:
  - [x] Phase 8-Planning: Design & Documentation
    - [x] Core architecture design
    - [x] Workflow engine design
    - [x] Checklist system design
    - [x] Team agent design (Nebuchadnezzar Crew)
    - [x] AI contracts design
    - [x] TypeScript support design
  - [ ] Phase 8a: Foundation & Workflow Engine
  - [ ] Phase 8b: Tank Agent (The Operator)
  - [ ] Phase 8c: Mouse Agent (The Programmer)
  - [ ] Phase 8d: Trinity Agent (The Executor)
  - [ ] Phase 8e: Switch Agent (The Validator)
  - [ ] Phase 8f: Apoc Agent (The Planner)
  - [ ] Phase 8g: CLI & Reporting
  - [ ] Phase 8h: Knowledge Base
  - [ ] Phase 8i: Testing & Documentation
- BLOCKED_BY: null
- NEXT_ACTION: Review planning documents, then start Phase 8a implementation
- CONTEXT: |
    **Morpheus Migration Wizard Planning (2026-01-24):**

    Morpheus is an AI-powered migration wizard that helps projects adopt
    The Construct architecture. Key design decisions:

    1. **Built on The Construct**: Morpheus uses its own architecture
       (dogfooding) - contracts, Keymaker, Sentinels, etc.

    2. **Nebuchadnezzar Crew (Team Agents)**:
       - Tank (Operator): Scanning, indexing, loading project data
       - Mouse (Programmer): Code/contract generation
       - Trinity (Executor): AI-powered analysis and migration
       - Switch (Validator): Validation and checklist verification
       - Apoc (Planner): Migration planning and risk assessment

    3. **Flexible Workflows**: YAML-defined workflows with phases,
       steps, and checklists. Each step assigned to a team agent.

    4. **AI-Verified Checklists**: Switch can use AI to verify
       checklist completion with evidence.

    5. **TypeScript First**: Full type safety, generates types for
       contracts, understands TypeScript projects.

- ARTIFACTS:
    - created:
      - docs/plans/morpheus-migration-wizard-plan.md
      - docs/plans/morpheus-technical-spec.md
    - pending:
      - src/morpheus/ (entire module)
      - test/phase8.test.ts

### JOB:construct-phase-7-chaos
- STATUS: completed
- PRIORITY: medium
- STARTED: 2026-01-24
- COMPLETED: 2026-01-24
- PLAN_DOC: docs/implementation-plan.md
- DEPENDS_ON: JOB:construct-phase-6-security (COMPLETED)
- CURRENT_PHASE: Complete
- PHASES:
  - [x] Phase 7a: Ghost (Fault Injection)
  - [x] Phase 7b: Phantom (Penetration Testing)
  - [x] Phase 7c: Twins Coordinator
  - [x] Phase 7d: Testing (61 tests, 410 total)
- BLOCKED_BY: null
- NEXT_ACTION: Archive to JOBS_COMPLETED.md
- ARTIFACTS:
    - created:
      - src/types/chaos.ts
      - src/chaos/ghost/ghost.ts
      - src/chaos/phantom/phantom.ts
      - src/chaos/twins.ts
      - src/chaos/index.ts
      - test/phase7.test.ts

## COMPLETED_SUMMARY

All core phases complete:
- Phase 1: Foundation (74 tests)
- Phase 2: Oracle & Level-Up (145 tests)
- Phase 3: Multi-Provider Keymaker
- Phase 4: Reference System & Registry
- Phase 5: Full Sentinels QA (300 tests)
- Phase 6: Security Architecture (349 tests)
- Phase 7: Chaos Engineering (410 tests)

The Construct is now production-ready with:
- Contract-based AI orchestration
- Multi-provider support via Keymaker
- Full QA enforcement via Sentinels
- XP/Level system via Oracle
- Zero Trust security via Agent Smith
- Chaos engineering via The Twins
