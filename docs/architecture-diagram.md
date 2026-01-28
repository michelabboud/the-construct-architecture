# The Construct - Architecture Diagram

> Reference architecture for AI orchestration that enforces deterministic control over AI systems.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           THE CONSTRUCT ARCHITECTURE                            │
│                      "Code that calls AI, not AI that calls code"               │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    REQUEST
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              THE ARCHITECT                                      │
│                            (Source of Truth)                                    │
│                                                                                 │
│   • Configurations    • Rules & Limits    • Contracts (YAML)    • Guidance      │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  │                  ▼
┌────────────────────────┐          │         ┌────────────────────────┐
│      THE ORACLE        │          │         │      AGENT SMITH       │
│   (Judgment & XP)      │          │         │      (Security)        │
│                        │          │         │                        │
│  • Feedback loops      │          │         │  • Zero Trust auth     │
│  • XP awards           │◀────────┤         │  • Threat detection    │
│  • Level-up system     │          │         │  • Verification        │
│  • Pattern insights    │          │         │  • Access control      │
└───────────┬────────────┘          │         └───────────┬────────────┘
            │                       │                     │
            │ judges                │ inherits            │ protects
            │                       │                     │
            ▼                       ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               THE AGENTS                                        │
│                             (Orchestrator)                                      │
│                                                                                 │
│          • Enforces rules at every step    • Issues & manages contracts         │
│          • Coordinates all components      • Controls execution flow            │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│    THE SENTINELS     │  │     THE PROGRAMS     │  │      THE TWINS       │
│   (QA Enforcement)   │  │      (Workers)       │  │  (Chaos Engineering) │
│                      │  │                      │  │                      │
│  • Validates output  │  │  • Execute tasks     │  │  GHOST: Fault inject │
│  • Blocks violations │  │  • Within contracts  │  │  PHANTOM: Pen test   │
│  • Quality scoring   │  │  • Bounded by rules  │  │  • Resilience tests  │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────────────────┘
           │                         │
           │ validates               │ executes
           │                         │
           └────────────┬────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              THE KEYMAKER                                       │
│                            (Tool Adapter)                                       │
│                                                                                 │
│                    Provider-Agnostic AI Calls via LiteLLM                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  OpenAI  │ │Anthropic │ │  Google  │ │  Ollama  │ │  Azure   │ │  100+... │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
                                    ▼
                                RESPONSE
                          (Validated & Scored)


┌─────────────────────────────────────────────────────────────────────────────────┐
│                          EXECUTION FLOW (Linear)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Request ──▶ Architect ──▶ Smith ──▶ Agents ──▶ Keymaker ──▶ Sentinels ──▶  │
│             (rules)      (auth)    (orchestrate) (AI call)   (validate)         │
│                                                                                 │
│         ──▶ Oracle ──▶ Response                                                │
│            (judge)    (enforced)                                                │
│                                                                                 │
│  ⚡ Every step enforced by CODE — AI cannot skip, ignore, or bypass            │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MORPHEUS - MIGRATION WIZARD                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                         "I'm trying to free your mind"                          │
│                                                                                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐      │
│   │  TANK   │──▶│ TRINITY │───▶│  MOUSE  │──▶│  APOC    │───▶│ SWITCH  │      │
│   │Operator │    │ Expert  │    │Designer │    │Strategist│    │ Skeptic │      │
│   └─────────┘    └─────────┘    └─────────┘    └──────────┘    └─────────┘      │
│      Scan          Analyze       Generate        Plan          Validate         │
│     Project        Patterns      Contracts      Migration      Everything       │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONTRACT EXAMPLE (YAML)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   id: my-app/hello-world          │   limitations:                              │
│   name: Hello World Generator     │     forbidden_actions:                      │
│   version: "1.0.0"                │       - Use profanity                       │
│   type: completion                │       - Be rude                             │
│                                   │     constraints:                            │
│   prompts:                        │       - Keep response under 100 words       │
│     system: You are a friendly... │                                             │
│     user: Say hello to {{name}}   │   limits:                                   │
│                                   │     time: { max_duration_ms: 10000 }        │
│                                                                                 │
│   ⚡ Rules enforced by CODE, not by asking AI nicely                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Summary

| Component | Matrix Character | Role |
|-----------|------------------|------|
| **Architect** | The Architect | Source of truth - configs, rules, limits |
| **Oracle** | The Oracle | Judgment, XP system, insights |
| **Agents** | Agent programs | Orchestration, contract execution |
| **Sentinels** | Sentinels | QA enforcement, validation |
| **Programs** | Programs | Workers that execute tasks |
| **Keymaker** | The Keymaker | Provider-agnostic AI adapter (LiteLLM) |
| **Smith** | Agent Smith | Zero Trust security |
| **Twins** | The Twins | Chaos engineering (Ghost & Phantom) |
| **Morpheus** | Morpheus | Migration wizard with crew |

## Key Principle

> **Traditional:** "AI, please follow these rules" → AI ignores them
>
> **The Construct:** Code enforces rules → AI works within boundaries
