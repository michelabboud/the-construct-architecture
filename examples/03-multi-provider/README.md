# 03 — Multi-Provider Keymaker

Demonstrates the Keymaker routing AI requests across multiple providers with fallback.

## What It Shows

```
Keymaker → Router picks provider → Generate → Fallback on failure → Result
```

## Run It

```bash
npx tsx examples/03-multi-provider/index.ts
```

## Key Concepts

- **Keymaker** — multi-provider AI gateway (OpenAI, Anthropic, Ollama, etc.)
- **Provider Registry** — register multiple providers with models and costs
- **Router** — picks the best provider based on contract constraints
- **Fallback** — automatically retries with a different provider on failure
