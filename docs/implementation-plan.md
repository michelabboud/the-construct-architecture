# Implementation Plan

> *"Free your mind."* — Morpheus

## Overview

This document outlines the phase-by-phase implementation plan for The Construct architecture.

## Project Structure

```
src/
├── index.ts                    # Main exports
├── architect/                  # Source of Truth (The Architect)
│   ├── architect.ts
│   ├── schemas/
│   │   ├── contract.schema.ts  # Contract validation (Zod)
│   │   ├── config.schema.ts
│   │   └── rules.schema.ts
│   ├── references/
│   │   └── reference-resolver.ts
│   ├── registry.ts
│   └── truth-loader.ts
│
├── oracle/                     # Judgment & Insight (The Oracle)
│   ├── oracle.ts
│   ├── database.ts
│   ├── agent-profile-store.ts
│   └── insights.ts
│
├── agents/                     # Orchestrator (The Agents)
│   ├── orchestrator.ts
│   ├── contract-executor.ts
│   └── state-machine.ts
│
├── sentinels/                  # QA & Enforcement (The Sentinels)
│   ├── sentinels.ts
│   ├── validators/
│   │   ├── action-validator.ts
│   │   └── output-validator.ts
│   └── enforcement.ts
│
├── programs/                   # Workers (The Programs)
│   ├── worker.ts
│   ├── agent-runtime.ts
│   └── tool-handler.ts
│
├── keymaker/                   # AI Gateway (The Keymaker)
│   ├── keymaker.ts
│   ├── providers/
│   │   ├── registry.ts
│   │   ├── router.ts
│   │   └── unified-client.ts
│   └── tool-adapters/
│       ├── anthropic-adapter.ts
│       └── gemini-adapter.ts
│
├── security/                   # Security (Agent Smith & Team) [Phase 6]
│   ├── smith/                  # Security Director
│   │   └── agent-smith.ts
│   ├── seraph/                 # API Gateway
│   │   └── seraph.ts
│   └── agents/                 # Security Agents
│       ├── brown.ts            # Authentication
│       ├── jones.ts            # Authorization
│       ├── johnson.ts          # Threat Detection
│       ├── thompson.ts         # Audit
│       └── jackson.ts          # Incident Response
│
├── chaos/                      # Chaos Engineering (The Twins) [Phase 7]
│   ├── twins.ts                # Coordinator
│   ├── ghost/                  # Fault Injection
│   │   └── ghost.ts
│   └── phantom/                # Penetration Testing
│       └── phantom.ts
│
├── types/                      # TypeScript types
│   ├── contract.ts
│   ├── judgment.ts
│   ├── security.ts             # [Phase 6]
│   ├── chaos.ts                # [Phase 7]
│   └── index.ts
│
└── utils/                      # Shared utilities
    ├── errors.ts
    └── logger.ts
```

---

## Phase 1: Foundation (MVP) ✅ COMPLETED

**Goal:** Prove contract-based execution works with a single workflow.

**Status:** 74 tests passing

### Files Created

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

- [x] Contract schema with Zod validation
- [x] Architect loads config, provides read-only access
- [x] Contract executor runs simple contracts
- [x] Sentinels validate outputs (pass/fail/score)
- [x] Worker executes tasks (placeholder, real AI in Phase 3)
- [x] Test: 74 tests passing

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

## Phase 2: Oracle & Level-Up ✅ COMPLETED

**Goal:** Add judgment system and positive-only rewards.

**Status:** 145 tests passing (71 new tests)

### Files Created

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

- [x] Database layer with sql.js (pure JS SQLite)
- [x] AgentProfileStore for persistence
- [x] Oracle judgment system (approved/needs_revision/rejected)
- [x] XP award calculation with bonuses
- [x] Achievement tracking
- [x] Specialization tracking per task type
- [x] Oracle integrated with ContractExecutor
- [x] Test: 145 tests passing

---

## Phase 3: Multi-Provider (Keymaker) ✅ COMPLETED

**Goal:** Provider-agnostic execution via OpenAI SDK (unified interface).

**Status:** 187 tests passing (42 new tests)

### Files Created

#### 1. Provider Registry (`src/keymaker/providers/`)
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

- [x] Provider registry with OpenAI, Anthropic, Google, Groq, Together, Ollama
- [x] Unified AI client using OpenAI SDK for compatible providers
- [x] Tool adapters for Anthropic and Google Gemini
- [x] Provider router with Oracle integration for performance-based routing
- [x] Keymaker class with generate, chat, executeWithTools
- [x] Worker integrated with Keymaker for real AI calls
- [x] Cost estimation and tracking
- [x] Fallback execution with multiple provider attempts
- [x] Test: 187 tests passing

---

## Phase 4: Reference System & Full Architect ✅ COMPLETED

**Goal:** Complete source of truth with URI references.

**Status:** 249 tests passing (62 new tests)

### Files Created

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

- [x] Reference Resolver with URI-based references (guide://, tool://, mcp://, schema://, etc.)
- [x] Template variable substitution ({agent_id}, {task_type}, etc.)
- [x] Cache with TTL for resolved references
- [x] Truth Loader for global (~/.construct/truth/) and project (.construct/truth.yaml) configs
- [x] Deep merge for truth inheritance (project extends global)
- [x] Registry for tools, agents, and services
- [x] Health checks for registered services
- [x] Capability and skill-based discovery
- [x] Architect integration with all Phase 4 components
- [x] Full contract reference validation (validateContractFull)
- [x] Test: 249 tests passing (62 new Phase 4 tests)

---

## Phase 5: Full Sentinels (QA System) ✅ COMPLETED

**Goal:** Complete quality assurance and enforcement.

**Status:** 300 tests passing (51 new tests)

### Files Created

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

- [x] ActionValidator: Tool call interception & validation
- [x] OutputValidator: Schema validation, quality scoring, deliverables
- [x] EnforcementEngine: Real-time action blocking & escalation
- [x] Audit logging for all validations
- [x] Custom policy support
- [x] Escalation system with handlers
- [x] Compliance report generation
- [x] Sentinels integration with Phase 5 components
- [x] Test: 300 tests passing (51 new Phase 5 tests)

---

## Phase 6: Security Architecture (Agent Smith & Team)

**Goal:** Implement Security by Design with Zero Trust and Defense in Depth.

> *"Never send a human to do a machine's job."* — Agent Smith

### Overview

Agent Smith leads the security infrastructure, ensuring all components follow Zero Trust principles. His team of specialized agents provides comprehensive security coverage.

### Files to Create

#### 6a. Seraph - API Gateway (`src/security/seraph/`)
- Request validation and sanitization
- Rate limiting and throttling
- TLS/mTLS termination
- Request routing to security agents

```typescript
export class Seraph {
  constructor(config: SeraphConfig);
  async validateRequest(request: Request): Promise<ValidationResult>;
  async route(request: Request): Promise<Response>;
}
```

#### 6b. Agent Smith - Security Director (`src/security/smith/`)
- Central security orchestration
- Policy enforcement coordination
- Threat correlation and response
- Security team management

```typescript
export class AgentSmith {
  constructor(config: SecurityConfig);
  async enforcePolicy(action: Action): Promise<PolicyDecision>;
  async handleThreat(threat: ThreatEvent): Promise<ResponseAction>;
  getSecurityStatus(): SecurityStatus;
}
```

#### 6c. Agent Brown - Authentication (`src/security/agents/brown.ts`)
- Identity verification
- Credential validation
- Token management (JWT, API keys)
- Session handling

```typescript
export class AgentBrown {
  async authenticate(credentials: Credentials): Promise<AuthResult>;
  async verifyToken(token: string): Promise<TokenClaims>;
  async revokeSession(sessionId: string): Promise<void>;
}
```

#### 6d. Agent Jones - Authorization (`src/security/agents/jones.ts`)
- RBAC/ABAC enforcement
- Permission evaluation
- Resource access control
- Policy caching

```typescript
export class AgentJones {
  async authorize(subject: Subject, action: Action, resource: Resource): Promise<AuthzResult>;
  async checkPermission(agentId: string, permission: string): Promise<boolean>;
}
```

#### 6e. Agent Johnson - Threat Detection (`src/security/agents/johnson.ts`)
- Real-time anomaly detection
- Pattern analysis
- Signature matching
- Alert generation

```typescript
export class AgentJohnson {
  async analyzeActivity(activity: Activity): Promise<ThreatAnalysis>;
  async detectAnomaly(behavior: BehaviorPattern): Promise<AnomalyResult>;
  getActiveThreats(): ThreatSummary[];
}
```

#### 6f. Agent Thompson - Audit (`src/security/agents/thompson.ts`)
- Immutable audit logs
- Compliance reporting
- Log analysis
- Evidence preservation

```typescript
export class AgentThompson {
  async logEvent(event: SecurityEvent): Promise<void>;
  async queryLogs(query: LogQuery): Promise<AuditLog[]>;
  async generateComplianceReport(period: DateRange): Promise<ComplianceReport>;
}
```

#### 6g. Agent Jackson - Incident Response (`src/security/agents/jackson.ts`)
- Automated response orchestration
- Containment procedures
- Recovery coordination
- Post-incident analysis

```typescript
export class AgentJackson {
  async respondToIncident(incident: Incident): Promise<ResponsePlan>;
  async containThreat(threat: ThreatEvent): Promise<ContainmentResult>;
  async initiateRecovery(incident: Incident): Promise<RecoveryStatus>;
}
```

### Phase 6 Sub-Phases

#### Phase 6a: Foundation (Agent Smith + Seraph)
- [ ] Seraph API gateway with request validation
- [ ] Agent Smith security director
- [ ] Zero Trust policy framework
- [ ] Basic authentication integration

#### Phase 6b: Security Agents
- [ ] Agent Brown (Authentication)
- [ ] Agent Jones (Authorization)
- [ ] Agent Johnson (Threat Detection)
- [ ] Agent Thompson (Audit)
- [ ] Agent Jackson (Incident Response)

#### Phase 6c: Integration
- [ ] Security middleware for all components
- [ ] Architect security policy enforcement
- [ ] Sentinels security validation
- [ ] Oracle security metrics

### Phase 6 Deliverables

- [ ] Zero Trust architecture implementation
- [ ] Complete authentication/authorization chain
- [ ] Real-time threat detection
- [ ] Immutable audit logging
- [ ] Incident response automation
- [ ] Security integration with all existing components
- [ ] Test: Security test suite

---

## Phase 7: Chaos Engineering (The Twins)

**Goal:** Validate system resilience through controlled chaos.

> *"We are getting aggravated."* — The Twins

### Overview

The Twins (Ghost and Phantom) implement chaos engineering to test system resilience. Ghost handles fault injection; Phantom handles penetration testing.

### Files to Create

#### 7a. Ghost - Fault Injection (`src/chaos/ghost/`)
- Network chaos (latency, drops, partitions)
- Resource exhaustion
- Process failures
- State corruption

```typescript
export class Ghost {
  constructor(config: ChaosConfig);
  async injectFault(fault: FaultSpec): Promise<FaultHandle>;
  async removeFault(handle: FaultHandle): Promise<void>;
  getActiveFaults(): FaultStatus[];
}
```

#### 7b. Phantom - Penetration Testing (`src/chaos/phantom/`)
- Security probing
- Attack simulation
- Vulnerability scanning
- Red team automation

```typescript
export class Phantom {
  constructor(config: PenTestConfig);
  async runScan(target: Target): Promise<ScanResult>;
  async simulateAttack(attack: AttackSpec): Promise<AttackResult>;
  async generateReport(): Promise<PenTestReport>;
}
```

#### 7c. Twins Coordinator (`src/chaos/twins.ts`)
- Combined chaos orchestration
- Test scenario management
- Result aggregation
- Safe mode controls

```typescript
export class Twins {
  constructor(ghost: Ghost, phantom: Phantom);
  async runScenario(scenario: ChaosScenario): Promise<ScenarioResult>;
  async emergencyStop(): Promise<void>;
  getResilienceScore(): ResilienceMetrics;
}
```

### Phase 7 Sub-Phases

#### Phase 7a: Ghost (Fault Injection)
- [ ] Network chaos implementation
- [ ] Resource exhaustion simulation
- [ ] Process failure injection
- [ ] State corruption testing

#### Phase 7b: Phantom (Penetration Testing)
- [ ] Security scanner framework
- [ ] Attack simulation library
- [ ] Vulnerability assessment
- [ ] Reporting system

#### Phase 7c: Integration
- [ ] Twins coordination
- [ ] Agent Smith integration
- [ ] Pre-production test pipeline
- [ ] Resilience metrics

### Phase 7 Deliverables

- [ ] Complete fault injection framework
- [ ] Automated penetration testing
- [ ] Resilience scoring system
- [ ] Pre-production chaos pipeline
- [ ] Integration with security (Agent Smith oversight)
- [ ] Test: Chaos engineering test suite

---

## Technology Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Schema Validation | **Zod** | Excellent TypeScript inference |
| AI Gateway | **OpenAI SDK** | Unified interface, most providers compatible |
| Database | **sql.js** | Pure JS SQLite, browser/Node compatible |
| Config Format | **YAML** | Human-readable contracts |
| Pattern Matching | **minimatch** | Glob patterns for path validation |
| Testing | **Jest** | Standard, well-supported |

---

## Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "yaml": "^2.3.0",
    "sql.js": "^1.11.0",
    "openai": "^4.0.0",
    "minimatch": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

---

## Success Criteria

### Phase 1-5 (Core Framework) ✅ COMPLETED
- [x] Contract executes end-to-end
- [x] Sentinels validate output and return score
- [x] Forbidden path is blocked
- [x] Multi-provider execution works
- [x] Agent levels up from Rookie to Reliable
- [x] Oracle recommends routing changes
- [x] Reference URIs resolve
- [x] Full QA enforcement system
- [x] 300 tests passing

### Phase 6 Complete When:
- [ ] Zero Trust policy framework operational
- [ ] All security agents functional
- [ ] Authentication/Authorization chain working
- [ ] Threat detection active
- [ ] Audit logging immutable
- [ ] Incident response automated
- [ ] Security tests passing

### Phase 7 Complete When:
- [ ] Fault injection framework operational
- [ ] Penetration testing automated
- [ ] Resilience metrics calculated
- [ ] Pre-production chaos pipeline working
- [ ] Agent Smith oversight integrated
- [ ] Chaos engineering tests passing

### Production Ready When:
- [ ] All phases complete
- [ ] Security architecture validated
- [ ] Chaos engineering passing
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
