# The Construct — Examples

**The Construct** is a reference architecture for AI orchestration where **code controls the workflow** and AI works within enforced contracts. The core principle: *"Code that calls AI, not AI that calls code."*

## How the Agentic Loop Works

```
┌─────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                       │
│                                                     │
│  1. Load Architect config (source of truth)         │
│  2. Create/load a Contract (YAML)                   │
│  3. Validate contract with Sentinels                │
│  4. Security check with Agent Smith (optional)      │
│  5. Assign task to Worker                           │
│  6. Worker calls Keymaker → AI provider             │
│  7. Sentinels validate output                       │
│  8. Oracle judges quality, awards XP                │
│  9. If quality < threshold → retry from step 5      │
│ 10. Output delivered                                │
└─────────────────────────────────────────────────────┘
```

## Examples

| # | Example | What It Shows |
|---|---------|---------------|
| 01 | [Basic Contract](./01-basic-contract/) | Architect → Contract → Sentinels → Worker |
| 02 | [Oracle & XP](./02-oracle-xp/) | Judgment, XP tracking, level-up system |
| 03 | [Multi-Provider](./03-multi-provider/) | Keymaker routing across multiple AI providers |
| 04 | [Security & Chaos](./04-security-chaos/) | Agent Smith policies + Twins chaos engineering |
| 05 | [Website Builder](./05-website-builder/) | Full agentic loop building a website |

## Quick Start

```bash
# From the repository root:
npx tsx examples/01-basic-contract/index.ts
npx tsx examples/02-oracle-xp/index.ts
npx tsx examples/03-multi-provider/index.ts
npx tsx examples/04-security-chaos/index.ts
npx tsx examples/05-website-builder/orchestrator.ts
```

All examples use mock/simulated AI responses and work without API keys. Comments in each file show how to switch to real providers.

## Configuring for Your Own Project

1. **Define your Architect config** — YAML file with rules, allowed paths, forbidden actions
2. **Write contracts** — one YAML contract per task type (see `05-website-builder/construct/contracts/`)
3. **Create agents** — TypeScript files that define task→contract mappings
4. **Build your orchestrator** — the main loop that coordinates everything

See [05-website-builder](./05-website-builder/) for a complete reference implementation.
