# 05 — Website Builder (Full Agentic Loop)

A comprehensive example showing how to use **every** Construct component in an agentic development loop that builds a website.

## What It Shows

```
                    ┌──────────────┐
                    │ Orchestrator │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Designer│       │ Stylist │       │Developer│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼───────┐
                    │   Reviewer   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   QA Agent   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Output    │
                    └──────────────┘
```

## Architecture

The orchestrator coordinates five specialized agents:

| Agent | Contract | Role |
|-------|----------|------|
| **Designer** | `generate-page.yaml` | Generates HTML page structure |
| **Stylist** | `generate-styles.yaml` | Creates CSS stylesheets |
| **Developer** | `generate-component.yaml` | Builds UI components |
| **Reviewer** | `review-code.yaml` | Reviews generated code |
| **QA** | `qa-check.yaml` | Quality assurance checks |

## Pipeline

1. Architect loads config and contracts
2. Agent Smith validates agent identity (security)
3. Designer, Stylist, Developer execute their contracts in parallel
4. Sentinels validate each output
5. Reviewer checks all generated code
6. QA agent runs quality checks
7. Oracle judges each agent's work, awards XP
8. If quality < threshold, the failing agents re-execute
9. Level-up checks unlock more autonomy for high-performing agents

## AI Provider Setup

By default the example runs in **mock mode** (placeholder responses, no API key needed). Set the `CONSTRUCT_PROVIDER` env var to use a real AI provider:

| `CONSTRUCT_PROVIDER` | Requirements | Notes |
|----------------------|-------------|-------|
| `mock` (default) | None | Deterministic placeholder responses |
| `anthropic` | `ANTHROPIC_API_KEY` | Claude models |
| `openai` | `OPENAI_API_KEY` | GPT models |
| `ollama` | Ollama running locally | Free, local — no API key needed |
| `groq` | `GROQ_API_KEY` | Fast inference |
| `together` | `TOGETHER_API_KEY` | Open-source models |
| `google` | `GOOGLE_API_KEY` | Gemini models |
| *(not set)* | — | Auto-detects from available env vars, falls back to mock |

### Examples

```bash
# Mock mode (default — no API key needed)
npx tsx examples/05-website-builder/orchestrator.ts

# Use Anthropic
ANTHROPIC_API_KEY=sk-ant-... CONSTRUCT_PROVIDER=anthropic npx tsx examples/05-website-builder/orchestrator.ts

# Use OpenAI
OPENAI_API_KEY=sk-... CONSTRUCT_PROVIDER=openai npx tsx examples/05-website-builder/orchestrator.ts

# Use local Ollama (must be running at localhost:11434)
CONSTRUCT_PROVIDER=ollama npx tsx examples/05-website-builder/orchestrator.ts

# Auto-detect — picks the first available provider
ANTHROPIC_API_KEY=sk-ant-... npx tsx examples/05-website-builder/orchestrator.ts
```

## Run It

```bash
npx tsx examples/05-website-builder/orchestrator.ts
```

## Files

- `orchestrator.ts` — main agentic loop
- `config.ts` — shared AI provider configuration
- `agents/designer.ts` — page generation agent
- `agents/stylist.ts` — CSS generation agent
- `agents/developer.ts` — component generation agent
- `agents/reviewer.ts` — code review agent
- `agents/qa.ts` — quality assurance agent
- `construct/architect.yaml` — Architect configuration
- `construct/contracts/*.yaml` — YAML contracts for each task
