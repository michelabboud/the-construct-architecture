# 04 — Security & Chaos Engineering

Demonstrates Agent Smith (security policies) and The Twins (chaos engineering).

## What It Shows

```
Agent Smith → Policy enforcement → Threat detection
The Twins → Fault injection (Ghost) → Pen testing (Phantom) → Resilience metrics
```

## Run It

```bash
npx tsx examples/04-security-chaos/index.ts
```

## Key Concepts

- **Agent Smith** — security director; enforces Zero Trust policies
- **Seraph** — API gateway guardian; validates and sanitizes requests
- **Ghost** — fault injection system (latency, drops, resource pressure)
- **Phantom** — penetration testing system (scans, attack simulation)
- **Twins** — coordinates Ghost and Phantom for chaos scenarios
