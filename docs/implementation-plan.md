# Implementation Plan

> *"Free your mind."* — Morpheus

## Overview

This document outlines the phase-by-phase implementation plan for The Construct architecture.

## Project Structure

```
src/
├── index.ts                    # Main exports
├── architect/                  # Source of Truth
│   ├── architect.ts
│   ├── schemas/
│   │   ├── contract.schema.ts  # Contract validation (Zod)
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
│       ├── openai-tools.ts
│       └── anthropic-tools.ts
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

---

## Phase 1: Foundation (MVP)

**Goal:** Prove contract-based execution works with a single workflow.

### Files to Create

#### 1. Contract Schema (`src/architect/schemas/contract.schema.ts`)
- Zod schema for contract validation
- Basic contract structure: id, type, requirements, goals, limitations, freedom
- Validation functions with error formatting

```typescript
// Key exports
export const ContractSchema = z.object({...});
export type Contract = z.infer<typeof ContractSchema>;
export function validateContract(data: unknown): Contract;
```

#### 2. The Architect (Minimal) (`src/architect/architect.ts`)
- Load configuration from YAML files
- Provide read-only access to truth
- Validate contracts against rules

```typescript
// Key exports
export class Architect {
  constructor(configPath: string);
  getConfig<T>(path: string): T;
  isActionAllowed(action: string): boolean;
  isPathAllowed(path: string, op: 'read' | 'write'): boolean;
  validateContract(contract: Contract): ValidationResult;
}
```

#### 3. Contract Executor (`src/agents/contract-executor.ts`)
- Parse contract YAML
- Execute requirements in order
- Track progress and report to Oracle

```typescript
// Key exports
export class ContractExecutor {
  constructor(architect: Architect, sentinels: Sentinels);
  async execute(contract: Contract): Promise<ExecutionResult>;
}
```

#### 4. The Sentinels (Basic) (`src/sentinels/sentinels.ts`)
- Validate outputs against contract requirements
- Block forbidden actions (path checks)
- Return pass/fail with score

```typescript
// Key exports
export class Sentinels {
  constructor(architect: Architect);
  validateOutput(output: any, contract: Contract): ValidationResult;
  isActionAllowed(action: string, contract: Contract): boolean;
  isPathAllowed(path: string, contract: Contract): boolean;
}
```

#### 5. Worker Runtime (`src/programs/worker.ts`)
- Execute a single AI call with contract context
- Report outcome to Sentinels for validation

```typescript
// Key exports
export class Worker {
  constructor(sentinels: Sentinels);
  async execute(task: Task, contract: Contract): Promise<TaskResult>;
}
```

#### 6. Basic Types (`src/types/`)
- Contract, Judgment, AgentProfile types

### Phase 1 Deliverables

- [ ] Contract schema with Zod validation
- [ ] Architect loads config, provides read-only access
- [ ] Contract executor runs simple contracts
- [ ] Sentinels validate outputs (pass/fail/score)
- [ ] Worker executes AI calls with tool support
- [ ] Test: Execute image generation contract end-to-end

### Phase 1 Test Scenario

```yaml
# test/fixtures/test-contract.yaml
contract:
  id: "test-001"
  type: "image_generation"
  name: "Test Image Generation"

  requirements:
    description: "Generate a simple test image"
    deliverables:
      - type: image
        format: png
        save_to: "~/test-output/"

  goals:
    success_threshold: 6.0

  limitations:
    forbidden_paths:
      - pattern: "**/src/**"

  limits:
    cost:
      max_usd: 0.10
    retries:
      max_attempts: 2
```

---

## Phase 2: Oracle & Level-Up

**Goal:** Add judgment system and positive-only rewards.

### Files to Create

#### 1. The Oracle (`src/oracle/oracle.ts`)
- Receive execution results
- Render judgment (approved/needs_revision/rejected)
- Store judgment history

#### 2. Level-Up System (`src/oracle/level-up.ts`)
- XP tracking per agent/provider/model
- Level thresholds: Rookie → Reliable → Trusted → Expert
- Positive-only: good work earns XP, bad work earns 0

#### 3. Agent Profiles (`src/oracle/agent-profiles.ts`)
- SQLite storage for agent performance
- Track: totalTasks, successRate, avgScore, XP, level
- Specializations per task type

### Phase 2 Deliverables

- [ ] Oracle receives and judges execution results
- [ ] XP awarded for successful contracts
- [ ] Agent profiles stored and retrieved
- [ ] Level determines validation frequency
- [ ] Test: Run 10 contracts, verify XP accumulation

---

## Phase 3: Multi-Provider (Keymaker)

**Goal:** Provider-agnostic execution via LiteLLM.

### Files to Create

#### 1. LiteLLM Client (`src/keymaker/litellm-client.ts`)
- Unified API for multiple providers
- Support: OpenAI, Anthropic, Google, Ollama (local)
- Automatic fallback on failure

#### 2. Tool Adapters (`src/keymaker/tool-adapters/`)
- Convert tool definitions to provider format
- Handle tool call responses
- Support providers without native tool calling

#### 3. Provider Routing (`src/keymaker/router.ts`)
- Route based on Oracle performance data
- Cost-quality optimization
- Respect contract model requirements

### Phase 3 Deliverables

- [ ] LiteLLM integration working
- [ ] Tool calls work across providers
- [ ] Fallback when provider fails
- [ ] Routing based on performance data
- [ ] Test: Same contract executes on 3+ providers

---

## Phase 4: Reference System & Full Architect

**Goal:** Complete source of truth with URI references.

### Files to Create

#### 1. Reference Resolver (`src/architect/references/reference-resolver.ts`)
- Resolve URIs: guide://, tool://, schema://, config://, etc.
- Load markdown guides on demand
- Cache resolved references

#### 2. Truth Loader (`src/architect/truth-loader.ts`)
- Load from `~/.construct/truth/` (global)
- Merge with project `.construct/truth.yaml`
- Inheritance: project extends global

#### 3. Registry (`src/architect/registry.ts`)
- Register tools, agents, services
- Capability discovery
- Health checks

### Phase 4 Deliverables

- [ ] Reference URIs resolve correctly
- [ ] Global + project truth inheritance
- [ ] Registry for tools and services
- [ ] Test: Contract with guide:// reference enforced

---

## Phase 5: Full Sentinels (QA System)

**Goal:** Complete quality assurance and enforcement.

### Files to Create

#### 1. Action Validator (`src/sentinels/validators/action-validator.ts`)
- Intercept all tool calls
- Check against contract limitations
- Block unauthorized actions

#### 2. Output Validator (`src/sentinels/validators/output-validator.ts`)
- Validate outputs against schema
- AI-based quality scoring (optional)
- Severity levels: critical/warning/info

#### 3. Enforcement Engine (`src/sentinels/enforcement.ts`)
- Real-time action blocking
- Logging of all validations
- Escalation to human review

### Phase 5 Deliverables

- [ ] All tool calls validated before execution
- [ ] Forbidden paths blocked at runtime
- [ ] Output quality scored
- [ ] Escalation triggers human review
- [ ] Test: Blocked action logged and reported

---

## Technology Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Schema Validation | **Zod** | Excellent TypeScript inference |
| AI Gateway | **LiteLLM** | 100+ providers, OpenAI-compatible |
| Database | **better-sqlite3** | Embedded, fast, no external deps |
| Config Format | **YAML** | Human-readable contracts |
| Testing | **Jest** | Standard, well-supported |

---

## Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "yaml": "^2.3.0",
    "better-sqlite3": "^9.0.0",
    "litellm": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/better-sqlite3": "^7.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Contract executes end-to-end
- [ ] Sentinels validate output and return score
- [ ] Forbidden path is blocked
- [ ] All tests pass

### Prototype Complete When:
- [ ] Multi-provider execution works
- [ ] Agent levels up from Rookie to Reliable
- [ ] Oracle recommends routing changes
- [ ] Reference URIs resolve
- [ ] Ready for extraction to standalone package

---

## Verification Plan

### Unit Tests
```bash
npm test
```

### Integration Test
```bash
npx tsx test/integration/contract-execution.test.ts
```

### Manual Verification
1. Create test contract YAML
2. Execute via ContractExecutor
3. Verify output in expected location
4. Check Sentinel validation results
5. Verify XP awarded in agent profile
