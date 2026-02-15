# 01 — Basic Contract

The simplest possible Construct example: load an Architect, create a contract, validate with Sentinels, and execute with a Worker.

## What It Shows

```
Architect (config) → Contract (YAML) → Sentinels (validate) → Worker (execute)
```

## Run It

```bash
npx tsx examples/01-basic-contract/index.ts
```

## Key Concepts

- **Architect** — source of truth; loads config and validates contracts
- **Contract** — a structured YAML object defining what an agent must do, its limits, and quality goals
- **Sentinels** — enforce rules; validate outputs against contract requirements
- **Worker** — executes tasks within contract boundaries
