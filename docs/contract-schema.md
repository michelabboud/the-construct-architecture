# Contract Schema

> *"What do they want? The same thing any program wants: to survive... by any means necessary."*

The **Contract** is the formal agreement between The Agents (Orchestrator) and The Programs (Workers). It defines exactly what must be done, what is allowed, what is forbidden, and what freedom exists within bounds.

## Complete Schema (YAML)

```yaml
contract:
  # ─────────────────────────────────────────────────────────────────────────
  # IDENTITY
  # ─────────────────────────────────────────────────────────────────────────
  id: string                          # Unique contract identifier (e.g., "img-gen-001")
  version: string                     # Schema version (e.g., "1.0.0")
  type: string                        # Contract type (e.g., "image_generation", "text_analysis")
  name: string                        # Human-readable name
  extends: string?                    # Optional: Inherit from base contract template

  # ─────────────────────────────────────────────────────────────────────────
  # METADATA
  # ─────────────────────────────────────────────────────────────────────────
  metadata:
    created_at: datetime              # ISO-8601 timestamp
    created_by: string                # Who/what created this contract
    workflow_id: string?              # Parent workflow if part of larger flow
    priority: enum                    # critical | high | normal | low
    tags: string[]                    # For filtering/categorization
    trace_id: string?                 # For distributed tracing

  # ─────────────────────────────────────────────────────────────────────────
  # REFERENCES (Unified Reference System)
  # ─────────────────────────────────────────────────────────────────────────
  references:
    guides:
      must_follow:
        - ref: "guide://project/style-guide.md"
          enforce: strict             # strict | advisory
          sections: ["rules"]         # Optional: specific sections

    tools:
      mcp:
        - ref: "mcp://visual-forge/generate_image"
          required: true
      internal:
        - ref: "tool://quality-inspector"

    agents:
      types:
        - ref: "agent://worker"
          min_level: reliable
      skills:
        - ref: "skill://image-generation"

    schemas:
      input:
        - ref: "schema://contracts/image-input"
      output:
        - ref: "schema://outputs/image-output"

    config:
      - ref: "config://providers/gemini"
      - ref: "config://limits/costs"

    architect:
      - ref: "architect://rules/paths"

    oracle:
      - ref: "oracle://agent-profile/{agent_id}"

  # ─────────────────────────────────────────────────────────────────────────
  # REQUIREMENTS (What MUST be done)
  # ─────────────────────────────────────────────────────────────────────────
  requirements:
    description: string               # What this contract is for

    # Mandatory tool usage
    tools:
      must_use:
        - tool: "mcp://visual-forge/generate_image"
          reason: "Required for image generation"
          min_calls: 1

      must_use_in_order:
        - step: 1
          tool: "mcp://visual-forge/list_characters"
        - step: 2
          tool: "mcp://visual-forge/generate_image"

    # Mandatory agent involvement
    agents:
      must_involve:
        - agent_type: worker
          role: "Execute generation"
          min_level: reliable
        - agent_type: validator
          role: "Check quality"
          min_level: trusted

      must_validate_with:
        - validator: "quality-inspector"
          min_score: 7.0
          on_fail: retry              # retry | escalate | fail

    # Model requirements
    model:
      must_use: "gemini-2.0-flash"
      must_be_local: false
      fallback_allowed: true
      fallback_models:
        - "gpt-4o"

    # Checks at different stages
    checks:
      before_execution:
        - check: "cost_limit_ok"
          params: { estimated_cost: 0.05 }

      during_execution:
        - check: "heartbeat"
          interval_ms: 5000

      after_execution:
        - check: "output_exists"
        - check: "quality_score_above"
          params: { min_score: 6.0 }

    # What must be delivered
    deliverables:
      - type: image
        format: png
        min_width: 1024
        min_height: 1024
        save_to: "~/projects/generated/"

  # ─────────────────────────────────────────────────────────────────────────
  # GOALS (What success looks like)
  # ─────────────────────────────────────────────────────────────────────────
  goals:
    description: string               # High-level success description

    objectives:
      - "High quality output"
      - "Consistent style"
      - "Within budget"

    quality_criteria:
      visual_quality:
        weight: 0.5
        min_score: 7.0
      style_adherence:
        weight: 0.5
        min_score: 7.0

    success_threshold: 7.0            # Weighted average must exceed

  # ─────────────────────────────────────────────────────────────────────────
  # LIMITATIONS (Hard boundaries - NEVER cross)
  # ─────────────────────────────────────────────────────────────────────────
  limitations:
    forbidden_actions:
      - "DELETE any file"
      - "MODIFY files outside output directory"
      - "EXECUTE shell commands"

    forbidden_paths:
      - pattern: "**/node_modules/**"
        reason: "Never modify dependencies"
      - pattern: "**/.git/**"
        reason: "Never modify git internals"
      - pattern: "**/.env*"
        reason: "Never access environment files"

    forbidden_content:
      - "Adult or explicit content"
      - "Violence or gore"

    constraints:
      - "Must complete within time limit"
      - "Must stay within cost budget"

  # ─────────────────────────────────────────────────────────────────────────
  # FREEDOM (Where creativity is allowed)
  # ─────────────────────────────────────────────────────────────────────────
  freedom:
    decisions:
      - area: "prompt_engineering"
        description: "Choose optimal prompts"
        constraints: ["Must follow style guide"]

      - area: "retry_strategy"
        description: "Decide when and how to retry"
        constraints: ["Max 3 retries"]

    adaptations:
      - "May adjust parameters for quality"
      - "May suggest improvements"
      - "May request clarification"

  # ─────────────────────────────────────────────────────────────────────────
  # CONTEXT (What the agent needs to know)
  # ─────────────────────────────────────────────────────────────────────────
  context:
    previous_outputs:
      - node: "previous-step"
        output_key: "result"
        path: "/tmp/workflow/result.json"

    inputs:
      prompt: string
      style: string

    background:
      project_name: "My Project"
      style_guide: "Modern minimalist"

  # ─────────────────────────────────────────────────────────────────────────
  # RESOURCES (What's available to use)
  # ─────────────────────────────────────────────────────────────────────────
  resources:
    models:
      allowed:
        - "gemini-2.0-flash"
        - "gpt-4o"
      preferred: "gemini-2.0-flash"
      forbidden:
        - "dall-e-2"

    tools:
      allowed:
        - "mcp://visual-forge/*"
      required:
        - "mcp://visual-forge/generate_image"
      forbidden:
        - "bash://*"

  # ─────────────────────────────────────────────────────────────────────────
  # LIMITS (Quantitative boundaries)
  # ─────────────────────────────────────────────────────────────────────────
  limits:
    cost:
      max_usd: 0.10
      warn_at: 0.08
      track_by: contract              # contract | session | workflow

    time:
      max_duration_ms: 60000
      warn_at_ms: 45000

    retries:
      max_attempts: 3
      backoff: exponential
      retry_on:
        - "rate_limit"
        - "timeout"
        - "validation_failed"

    tokens:
      max_input: 10000
      max_output: 4000

    iterations:
      max_turns: 10

  # ─────────────────────────────────────────────────────────────────────────
  # VALIDATION (How to verify success)
  # ─────────────────────────────────────────────────────────────────────────
  validation:
    schema:
      output_schema: "schema://outputs/image-output"
      strict: true

    ai_validators:
      - validator: "quality-scorer"
        model: "gemini-2.0-flash"
        criteria: ["sharpness", "composition"]
        min_score: 7.0

    human_review:
      triggers:
        - "score_below_threshold"
        - "high_cost_task"
      required_for:
        - "production_deployment"

  # ─────────────────────────────────────────────────────────────────────────
  # REPORTING (How to communicate progress)
  # ─────────────────────────────────────────────────────────────────────────
  reporting:
    sentinels:
      heartbeat_interval_ms: 5000
      report_events:
        - "tool_call"
        - "cost_incurred"
        - "validation_result"

    logging:
      level: info
      include_outputs: false
      include_costs: true
```

## Zod Schema (TypeScript)

```typescript
import { z } from 'zod';

// Reference schema
const ReferenceSchema = z.object({
  ref: z.string(),
  enforce: z.enum(['strict', 'advisory']).optional(),
  sections: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  min_level: z.string().optional(),
});

// Tool requirement schema
const ToolRequirementSchema = z.object({
  tool: z.string(),
  reason: z.string().optional(),
  min_calls: z.number().optional(),
});

// Deliverable schema
const DeliverableSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  min_width: z.number().optional(),
  min_height: z.number().optional(),
  save_to: z.string(),
});

// Full contract schema
export const ContractSchema = z.object({
  contract: z.object({
    // Identity
    id: z.string(),
    version: z.string(),
    type: z.string(),
    name: z.string(),
    extends: z.string().optional(),

    // Metadata
    metadata: z.object({
      created_at: z.string(),
      created_by: z.string(),
      workflow_id: z.string().optional(),
      priority: z.enum(['critical', 'high', 'normal', 'low']),
      tags: z.array(z.string()),
      trace_id: z.string().optional(),
    }),

    // References
    references: z.object({
      guides: z.object({
        must_follow: z.array(ReferenceSchema),
      }).optional(),
      tools: z.object({
        mcp: z.array(ReferenceSchema).optional(),
        internal: z.array(ReferenceSchema).optional(),
      }).optional(),
      agents: z.object({
        types: z.array(ReferenceSchema).optional(),
        skills: z.array(ReferenceSchema).optional(),
      }).optional(),
      schemas: z.object({
        input: z.array(ReferenceSchema).optional(),
        output: z.array(ReferenceSchema).optional(),
      }).optional(),
      config: z.array(ReferenceSchema).optional(),
      architect: z.array(ReferenceSchema).optional(),
      oracle: z.array(ReferenceSchema).optional(),
    }).optional(),

    // Requirements
    requirements: z.object({
      description: z.string(),
      tools: z.object({
        must_use: z.array(ToolRequirementSchema).optional(),
        must_use_in_order: z.array(z.object({
          step: z.number(),
          tool: z.string(),
        })).optional(),
      }).optional(),
      agents: z.object({
        must_involve: z.array(z.object({
          agent_type: z.string(),
          role: z.string(),
          min_level: z.string().optional(),
        })).optional(),
        must_validate_with: z.array(z.object({
          validator: z.string(),
          min_score: z.number(),
          on_fail: z.enum(['retry', 'escalate', 'fail']),
        })).optional(),
      }).optional(),
      deliverables: z.array(DeliverableSchema).optional(),
    }),

    // Goals
    goals: z.object({
      description: z.string().optional(),
      objectives: z.array(z.string()),
      success_threshold: z.number(),
    }),

    // Limitations
    limitations: z.object({
      forbidden_actions: z.array(z.string()).optional(),
      forbidden_paths: z.array(z.object({
        pattern: z.string(),
        reason: z.string(),
      })).optional(),
      forbidden_content: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional(),
    }),

    // Freedom
    freedom: z.object({
      decisions: z.array(z.object({
        area: z.string(),
        description: z.string(),
        constraints: z.array(z.string()).optional(),
      })).optional(),
      adaptations: z.array(z.string()).optional(),
    }).optional(),

    // Context
    context: z.object({
      inputs: z.record(z.any()).optional(),
      background: z.record(z.any()).optional(),
    }).optional(),

    // Resources
    resources: z.object({
      models: z.object({
        allowed: z.array(z.string()),
        preferred: z.string().optional(),
        forbidden: z.array(z.string()).optional(),
      }).optional(),
      tools: z.object({
        allowed: z.array(z.string()).optional(),
        required: z.array(z.string()).optional(),
        forbidden: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),

    // Limits
    limits: z.object({
      cost: z.object({
        max_usd: z.number(),
        warn_at: z.number().optional(),
      }).optional(),
      time: z.object({
        max_duration_ms: z.number(),
        warn_at_ms: z.number().optional(),
      }).optional(),
      retries: z.object({
        max_attempts: z.number(),
        backoff: z.enum(['none', 'linear', 'exponential']).optional(),
      }).optional(),
      tokens: z.object({
        max_input: z.number().optional(),
        max_output: z.number().optional(),
      }).optional(),
    }).optional(),
  }),
});

export type Contract = z.infer<typeof ContractSchema>;
```

## Example Contracts

### Image Generation Contract

```yaml
contract:
  id: "img-gen-001"
  version: "1.0.0"
  type: "image_generation"
  name: "Generate Hero Image"

  metadata:
    created_at: "2026-01-23T12:00:00Z"
    created_by: "workflow-orchestrator"
    priority: normal
    tags: ["image", "hero"]

  requirements:
    description: "Generate a hero image for the landing page"
    deliverables:
      - type: image
        format: png
        min_width: 1920
        min_height: 1080
        save_to: "~/projects/website/images/"

  goals:
    objectives:
      - "High visual quality"
      - "Match brand colors"
    success_threshold: 7.0

  limitations:
    forbidden_paths:
      - pattern: "**/src/**"
        reason: "Don't modify source code"

  limits:
    cost:
      max_usd: 0.10
    time:
      max_duration_ms: 30000
    retries:
      max_attempts: 2
```

### Text Analysis Contract

```yaml
contract:
  id: "text-analysis-001"
  version: "1.0.0"
  type: "text_analysis"
  name: "Analyze Customer Feedback"

  metadata:
    created_at: "2026-01-23T12:00:00Z"
    created_by: "data-pipeline"
    priority: high
    tags: ["text", "analysis", "customer"]

  requirements:
    description: "Extract sentiment and key themes from customer feedback"
    model:
      must_be_local: true  # Privacy-sensitive data
    deliverables:
      - type: json
        save_to: "~/projects/analysis/output/"

  goals:
    objectives:
      - "Accurate sentiment classification"
      - "Identify top 5 themes"
    success_threshold: 8.0

  limitations:
    forbidden_actions:
      - "SEND data to external APIs"
      - "LOG customer names"

  resources:
    models:
      allowed:
        - "ollama/llama3"
        - "ollama/mistral"
      preferred: "ollama/llama3"

  limits:
    cost:
      max_usd: 0.00  # Local models only
    time:
      max_duration_ms: 120000
```
