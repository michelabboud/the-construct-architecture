# The Sentinels

> *"Sentinels are programmed to return to the source when a target has been destroyed or otherwise lost."*

## Overview

The **Sentinels** are the QA and enforcement layer of The Construct. They are NOT just observability/monitoring - they actively **police agents** and ensure they do their work properly.

**Important:** Sentinels can BLOCK actions, not just log them.

## Responsibilities

1. **Validate outputs** against contract requirements
2. **Block forbidden actions** (path checks, action checks)
3. **Score quality** of outputs
4. **Escalate to human review** when needed
5. **Report to observability** systems

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   THE SENTINELS                              │
│              (QA & Enforcement Layer)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  VALIDATORS                          │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  Contract   │  │   Output    │  │   Action    │  │    │
│  │  │  Validator  │  │  Validator  │  │  Validator  │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ENFORCEMENT ENGINE                      │    │
│  │                                                      │    │
│  │   • Block unauthorized actions                       │    │
│  │   • Enforce path restrictions                        │    │
│  │   • Enforce cost limits                              │    │
│  │   • Trigger escalations                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              QUALITY CHECKS                          │    │
│  │                                                      │    │
│  │   • Score outputs (0-10)                             │    │
│  │   • Check schema compliance                          │    │
│  │   • Verify deliverables                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              REPORTING                               │    │
│  │                                                      │    │
│  │   • Log all validations                              │    │
│  │   • Emit events                                      │    │
│  │   • Report to Oracle                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Validators

### Contract Validator

Validates that a contract is well-formed before execution.

```typescript
class ContractValidator {
  // Validate contract structure and references
  validate(contract: Contract): ValidationResult;

  // Check all required references exist
  validateReferences(contract: Contract): ReferenceValidation;

  // Verify limits are sensible
  validateLimits(contract: Contract): LimitsValidation;
}
```

### Output Validator

Validates outputs against contract requirements.

```typescript
class OutputValidator {
  // Validate output against schema
  validateSchema(output: any, schema: JSONSchema): SchemaValidation;

  // Check output meets contract deliverables
  validateDeliverables(output: any, contract: Contract): DeliverableValidation;

  // AI-based quality scoring (optional)
  scoreQuality(output: any, criteria: QualityCriteria): QualityScore;
}
```

### Action Validator

Validates actions before they execute.

```typescript
class ActionValidator {
  // Check if action is allowed by contract
  isActionAllowed(action: string, contract: Contract): boolean;

  // Check if path is allowed by contract
  isPathAllowed(path: string, operation: 'read' | 'write', contract: Contract): boolean;

  // Check if tool is allowed by contract
  isToolAllowed(tool: string, contract: Contract): boolean;
}
```

## Enforcement Engine

The enforcement engine actively blocks unauthorized actions.

```typescript
class EnforcementEngine {
  constructor(
    private architect: Architect,
    private validators: Validators
  ) {}

  // Check action before execution - throws if blocked
  async checkAction(action: Action, contract: Contract): Promise<void> {
    if (!this.validators.action.isActionAllowed(action.type, contract)) {
      throw new ActionBlockedError(action, 'Action not allowed by contract');
    }

    if (action.path && !this.validators.action.isPathAllowed(action.path, action.operation, contract)) {
      throw new PathBlockedError(action.path, 'Path not allowed by contract');
    }

    if (action.tool && !this.validators.action.isToolAllowed(action.tool, contract)) {
      throw new ToolBlockedError(action.tool, 'Tool not allowed by contract');
    }
  }

  // Check cost before incurring
  async checkCost(cost: number, contract: Contract): Promise<void> {
    const limit = contract.contract.limits?.cost?.max_usd;
    if (limit && cost > limit) {
      throw new CostLimitExceededError(cost, limit);
    }
  }
}
```

## Quality Checks

Quality checks score outputs and verify deliverables.

```typescript
interface QualityCheck {
  // Score output quality (0-10)
  score(output: any, criteria: QualityCriteria): number;

  // Check if score meets threshold
  meetsThreshold(score: number, threshold: number): boolean;

  // Get detailed breakdown
  getBreakdown(output: any, criteria: QualityCriteria): QualityBreakdown;
}

interface QualityBreakdown {
  overall: number;
  criteria: {
    [name: string]: {
      score: number;
      weight: number;
      feedback: string[];
    };
  };
}
```

## Validation Results

```typescript
interface ValidationResult {
  valid: boolean;
  score?: number;           // 0-10 quality score
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'critical' | 'error';
}

interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
}
```

## Usage Example

```typescript
const sentinels = new Sentinels(architect);

// Before execution: validate contract
const contractValidation = sentinels.validateContract(contract);
if (!contractValidation.valid) {
  throw new ContractValidationError(contractValidation.errors);
}

// During execution: check actions
async function executeTask(action: Action, contract: Contract) {
  // This throws if action is blocked
  await sentinels.checkAction(action, contract);

  // Execute the action
  const result = await performAction(action);

  return result;
}

// After execution: validate output
const outputValidation = await sentinels.validateOutput(output, contract);
if (!outputValidation.valid) {
  if (outputValidation.score < contract.contract.goals.success_threshold) {
    // Escalate or retry
  }
}

// Report to Oracle
await oracle.submitForJudgment({
  contractId: contract.contract.id,
  output,
  validation: outputValidation,
});
```

## Blocked Actions

When Sentinels block an action:

1. **Log the block** with full context
2. **Emit event** for observability
3. **Throw error** to stop execution
4. **Report to Oracle** for judgment

```typescript
class ActionBlockedError extends Error {
  constructor(
    public action: Action,
    public reason: string,
    public contract: Contract
  ) {
    super(`Action blocked: ${reason}`);
  }
}

// In enforcement
try {
  await sentinels.checkAction(action, contract);
  await performAction(action);
} catch (error) {
  if (error instanceof ActionBlockedError) {
    logger.warn('Action blocked', {
      action: error.action,
      reason: error.reason,
      contract: error.contract.contract.id,
    });

    // Emit event
    events.emit('tool.blocked', {
      action: error.action,
      reason: error.reason,
    });

    // Report to Oracle
    await oracle.reportBlockedAction(error);
  }
  throw error;
}
```

## Escalation

Sentinels can escalate to human review:

```typescript
interface EscalationTrigger {
  condition: string;
  threshold?: number;
  action: 'notify' | 'pause' | 'fail';
}

const escalationTriggers: EscalationTrigger[] = [
  { condition: 'score_below_threshold', threshold: 5.0, action: 'pause' },
  { condition: 'high_cost_task', threshold: 1.0, action: 'notify' },
  { condition: 'multiple_retries', threshold: 3, action: 'pause' },
  { condition: 'security_concern', action: 'fail' },
];
```

## Reporting Protocol

Sentinels report to observability systems:

```yaml
reporting:
  on_validation:
    events:
      - validation.started
      - validation.passed
      - validation.failed
    metrics:
      - validation_duration_ms
      - validation_score
      - validation_errors_count

  on_block:
    events:
      - action.blocked
      - path.blocked
      - tool.blocked
    alerts:
      - severity: warning
        channel: slack

  on_escalation:
    events:
      - escalation.triggered
    alerts:
      - severity: error
        channel: [slack, email]
```

## Configuration

```yaml
# ~/.construct/truth/sentinels.yaml
sentinels:
  validation:
    # Use agent level to determine validation rate
    use_level_based_rate: true

    # AI-based quality scoring
    ai_scoring:
      enabled: true
      model: "gemini-2.0-flash"
      max_cost_per_validation: 0.01

  enforcement:
    # Block or warn on violations
    mode: block  # block | warn

    # Actions to always block
    always_block:
      - DELETE
      - EXECUTE_SHELL

  escalation:
    # When to escalate to human
    triggers:
      - condition: score_below
        threshold: 5.0
        action: pause
      - condition: cost_above
        threshold: 1.0
        action: notify

  reporting:
    # Where to send reports
    backends:
      - type: local
        path: ~/.construct/logs/
      - type: webhook
        url: https://hooks.slack.com/xxx
```
