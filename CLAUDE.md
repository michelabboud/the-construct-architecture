# CLAUDE.md - The Construct

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**The Construct** is a reference architecture for AI orchestration. The core principle is:

> **"Code that calls AI, not AI that calls code"**

Code controls the workflow. AI works within enforced contracts. Rules are enforced by code, not by AI's willingness to follow.

## Architecture Summary

```
THE ARCHITECT (Source of Truth)
     │
     ├── THE ORACLE (Judgment & Insight)
     │         │
     ▼         ▼
THE AGENTS (Orchestrator)
     │
     ├── THE SENTINELS (QA & Enforcement)
     │
     ▼
THE PROGRAMS (Workers)
     │
     └── THE KEYMAKER (Tool Adapter)
```

### Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| **Architect** | `src/architect/` | Source of truth - configs, rules, limits |
| **Oracle** | `src/oracle/` | Judgment, XP/Level-Up, insights |
| **Agents** | `src/agents/` | Orchestrator, contract executor |
| **Sentinels** | `src/sentinels/` | QA enforcement, validation |
| **Programs** | `src/programs/` | Workers, tool handlers |
| **Keymaker** | `src/keymaker/` | LiteLLM adapter |

## Project Structure

```
src/
├── index.ts                    # Main exports
├── architect/                  # Source of Truth
│   ├── architect.ts
│   ├── schemas/
│   │   ├── contract.schema.ts  # Contract validation
│   │   ├── config.schema.ts
│   │   └── rules.schema.ts
│   ├── references/
│   │   └── reference-resolver.ts
│   └── truth-loader.ts
│
├── oracle/                     # Judgment & Insight
│   ├── oracle.ts
│   ├── judgment.ts
│   ├── level-up.ts
│   └── insights.ts
│
├── agents/                     # Orchestrator
│   ├── orchestrator.ts
│   ├── contract-executor.ts
│   └── state-machine.ts
│
├── sentinels/                  # QA & Enforcement
│   ├── sentinels.ts
│   ├── validators/
│   │   ├── contract-validator.ts
│   │   ├── output-validator.ts
│   │   └── action-validator.ts
│   ├── enforcement.ts
│   └── quality-checks.ts
│
├── programs/                   # Workers
│   ├── worker.ts
│   ├── agent-runtime.ts
│   └── tool-handler.ts
│
├── keymaker/                   # Tool Adapter
│   ├── keymaker.ts
│   ├── litellm-client.ts
│   └── tool-adapters/
│
├── types/                      # TypeScript types
│   ├── contract.ts
│   ├── judgment.ts
│   ├── agent.ts
│   └── index.ts
│
└── utils/                      # Shared utilities
    ├── errors.ts
    └── logger.ts
```

## Implementation Phases

### Phase 1: Foundation (CURRENT)
- Contract schema with Zod validation
- Architect loads config, provides read-only access
- Contract executor runs simple contracts
- Sentinels validate outputs (pass/fail/score)
- Worker executes AI calls with tool support

### Phase 2: Oracle & Level-Up
- Oracle receives and judges execution results
- XP awarded for successful contracts
- Agent profiles stored and retrieved

### Phase 3: Multi-Provider (Keymaker)
- LiteLLM integration
- Tool calls work across providers
- Routing based on performance data

### Phase 4: Reference System & Full Architect
- URI references resolve correctly
- Global + project truth inheritance
- Registry for tools and services

### Phase 5: Full Sentinels (QA System)
- All tool calls validated before execution
- Forbidden paths blocked at runtime
- Output quality scored
- Escalation to human review

## Key Design Decisions

1. **Zod for schema validation** - Already proven, excellent TypeScript inference
2. **LiteLLM as AI gateway** - 100+ providers, OpenAI-compatible API
3. **YAML for contracts** - Human-readable, version-controllable
4. **SQLite for persistence** - Embedded, fast, no external dependencies
5. **Positive-only XP system** - Good work earns XP, bad work earns 0 (not negative)

## Key Files to Read First

1. `docs/architecture.md` - Full architecture details
2. `docs/contract-schema.md` - Contract YAML schema
3. `docs/implementation-plan.md` - Phase-by-phase plan
4. `JOBS.md` - Current work status (resume from here)

## Build Commands

```bash
npm run build        # Compile TypeScript
npm test             # Run tests
npm run dev          # Development mode
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Schema Validation | Zod |
| AI Gateway | LiteLLM |
| Database | better-sqlite3 |
| Config Format | YAML |
| Testing | Jest |

## Important Notes

- All rules are enforced by CODE, not by AI
- Contracts are YAML files validated with Zod
- The Architect is READ-ONLY during execution
- Oracle manages XP - no penalties, only positive rewards
- Sentinels BLOCK unauthorized actions, not just log them
