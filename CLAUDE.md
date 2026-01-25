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

## Implementation Status

All phases complete. See `CHANGELOG.md` for full details.

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | Foundation (Architect, Sentinels, Worker) | ✅ Complete |
| 2 | Oracle & Level-Up | ✅ Complete |
| 3 | Multi-Provider Keymaker | ✅ Complete |
| 4 | Reference System & Registry | ✅ Complete |
| 5 | Full Sentinels QA | ✅ Complete |
| 6 | Security (Agent Smith) | ✅ Complete |
| 7 | Chaos Engineering (Twins) | ✅ Complete |
| 8 | Morpheus Migration Wizard | ✅ Complete |

## Key Design Decisions

1. **Zod for schema validation** - Already proven, excellent TypeScript inference
2. **LiteLLM as AI gateway** - 100+ providers, OpenAI-compatible API
3. **YAML for contracts** - Human-readable, version-controllable
4. **SQLite for persistence** - Embedded, fast, no external dependencies
5. **Positive-only XP system** - Good work earns XP, bad work earns 0 (not negative)

## Key Files to Read First

1. `docs/architecture.md` - Full architecture details
2. `docs/contract-schema.md` - Contract YAML schema
3. `CHANGELOG.md` - Version history and features
4. `JOBS.md` - Current work status (resume from here)

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Schema Validation | Zod 4.x |
| AI Gateway | OpenAI SDK (multi-provider) |
| Database | sql.js (SQLite in JS) |
| Config Format | YAML |
| Testing | Jest |
| Linting | ESLint 9 (flat config) |

## Build Commands

```bash
npm run build        # Compile TypeScript
npm test             # Run tests
npm run lint         # Lint (zero warnings enforced)
npm run typecheck    # Type check without emit
```

## Code Quality Rules

- **Zero lint warnings** - `--max-warnings 0` is enforced
- **Unused imports** - Comment with `// Future use:` or remove
- **Unused parameters** - Prefix with underscore (`_param`)
- **Case declarations** - Wrap in braces `case 'x': { ... }`

## Branch Protection

The `main` branch is protected:

| Rule | Setting |
|------|---------|
| Require PRs | Yes (for external contributors) |
| Required approvals | 1 |
| Dismiss stale reviews | Yes |
| Owner bypass | Yes (can push directly) |

**Contributors** must submit PRs. **Owner + Claude Code** can push directly.

## Important Notes

- All rules are enforced by CODE, not by AI
- Contracts are YAML files validated with Zod
- The Architect is READ-ONLY during execution
- Oracle manages XP - no penalties, only positive rewards
- Sentinels BLOCK unauthorized actions, not just log them
