# The Construct

> *"This is the Construct. It's our loading program. We can load anything, from clothing to equipment, weapons, training simulations... anything we need."* — Morpheus

## What Is This?

**The Construct** is a reference architecture for AI orchestration that enforces the principle:

> **"Code that calls AI, not AI that calls code"**

Deterministic code controls workflow. AI works within enforced contracts. Rules are enforced by code, not by AI's willingness to follow.

## The Problem We're Solving

1. **AI alone can't be trusted to control workflows** - Gets distracted, ignores rules, "forgets"
2. **Pure rule-based systems don't need AI** - If everything is deterministic, why have AI?
3. **CLAUDE.md approach failed** - AI ignores it, doesn't work in non-Anthropic environments
4. **Need consistency AND creativity** - Strict where needed, flexible where valuable

## Architecture Overview

```
THE ARCHITECT (Source of Truth)
     │
     ├── THE ORACLE (Judgment & Insight) ◀── exposes insights
     │         │
     │         │ informed by judgments
     ▼         ▼
THE AGENTS (Orchestrator)
     │
     ├── THE SENTINELS (QA & Enforcement) ◀── polices agents
     │
     ▼
THE PROGRAMS (Workers)
     │
     └── THE KEYMAKER (Tool Adapter / LiteLLM)
```

### Component Responsibilities

| Component | Role | Responsibility |
|-----------|------|----------------|
| **The Architect** | Source of Truth | Configurations, rules, limits, guidance. Immutable during execution. |
| **The Oracle** | Judgment & Insight | Collects feedback, manages Level-Up system (XP), exposes insights |
| **The Agents** | Orchestrator | Enforces rules, issues contracts, controls state machine |
| **The Sentinels** | QA & Enforcement | Polices agents, ensures quality, validates outputs, blocks unauthorized actions |
| **The Programs** | Workers | Execute tasks within contracts, report to Oracle |
| **The Keymaker** | Tool Adapter | Provider-agnostic tool calling via LiteLLM |

## Project Type

- **Type:** Architecture (reference implementation)
- **NOT:** Framework, Runtime, Protocol, or Platform
- It's a blueprint/pattern that others can implement

## Key Features

- **Contract-based execution** - Every task has a formal contract
- **Provider-agnostic** - Works with OpenAI, Anthropic, Google, Ollama (local), custom
- **Positive-only incentives** - XP/Level-Up system, no penalties
- **Code enforces, not AI** - Rules checked by code at every step
- **Pluggable observability** - Local files, Prometheus, DataDog, CloudWatch, etc.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Full architecture details |
| [docs/contract-schema.md](docs/contract-schema.md) | Contract YAML schema |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phase-by-phase implementation |
| [docs/reference-system.md](docs/reference-system.md) | URI-based reference system |
| [docs/level-up-system.md](docs/level-up-system.md) | XP and leveling mechanics |

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Schema Validation | **Zod** |
| AI Gateway | **LiteLLM** |
| Database | **better-sqlite3** |
| Config Format | **YAML** |
| Testing | **Jest** |

## Implementation Status

- [ ] Phase 1: Foundation (Contract schema, Architect, Sentinels basic, Worker)
- [ ] Phase 2: Oracle & Level-Up
- [ ] Phase 3: Multi-Provider (Keymaker with LiteLLM)
- [ ] Phase 4: Reference System & Full Architect
- [ ] Phase 5: Full Sentinels (QA System)

## Origin

This architecture was designed as part of the [Visual Forge MCP](https://github.com/user/visual-forge-mcp) project to solve the "AI amnesia" problem - where AI assistants ignore rules defined in CLAUDE.md and similar configuration files.

## License

MIT
