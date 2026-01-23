/**
 * Contract Schema - Zod validation for contracts
 *
 * Phase 1 Implementation
 */

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

// Forbidden path schema
const ForbiddenPathSchema = z.object({
  pattern: z.string(),
  reason: z.string(),
});

// Quality criteria schema
const QualityCriteriaSchema = z.object({
  weight: z.number().min(0).max(1),
  min_score: z.number().min(0).max(10),
});

// Freedom decision schema
const FreedomDecisionSchema = z.object({
  area: z.string(),
  description: z.string(),
  constraints: z.array(z.string()).optional(),
});

// Contract metadata
const MetadataSchema = z.object({
  created_at: z.string(),
  created_by: z.string(),
  workflow_id: z.string().optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']),
  tags: z.array(z.string()),
  trace_id: z.string().optional(),
});

// Contract references
const ReferencesSchema = z.object({
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
}).optional();

// Contract requirements
const RequirementsSchema = z.object({
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
});

// Contract goals
const GoalsSchema = z.object({
  description: z.string().optional(),
  objectives: z.array(z.string()),
  quality_criteria: z.record(QualityCriteriaSchema).optional(),
  success_threshold: z.number().min(0).max(10),
});

// Contract limitations
const LimitationsSchema = z.object({
  forbidden_actions: z.array(z.string()).optional(),
  forbidden_paths: z.array(ForbiddenPathSchema).optional(),
  forbidden_content: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
});

// Contract freedom
const FreedomSchema = z.object({
  decisions: z.array(FreedomDecisionSchema).optional(),
  adaptations: z.array(z.string()).optional(),
}).optional();

// Contract context
const ContextSchema = z.object({
  previous_outputs: z.array(z.object({
    node: z.string(),
    output_key: z.string(),
    path: z.string(),
  })).optional(),
  inputs: z.record(z.unknown()).optional(),
  background: z.record(z.unknown()).optional(),
}).optional();

// Contract resources
const ResourcesSchema = z.object({
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
}).optional();

// Contract limits
const LimitsSchema = z.object({
  cost: z.object({
    max_usd: z.number(),
    warn_at: z.number().optional(),
    track_by: z.enum(['contract', 'session', 'workflow']).optional(),
  }).optional(),
  time: z.object({
    max_duration_ms: z.number(),
    warn_at_ms: z.number().optional(),
  }).optional(),
  retries: z.object({
    max_attempts: z.number(),
    backoff: z.enum(['none', 'linear', 'exponential']).optional(),
    retry_on: z.array(z.string()).optional(),
  }).optional(),
  tokens: z.object({
    max_input: z.number().optional(),
    max_output: z.number().optional(),
  }).optional(),
  iterations: z.object({
    max_turns: z.number().optional(),
  }).optional(),
}).optional();

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
    metadata: MetadataSchema,

    // References
    references: ReferencesSchema,

    // Requirements
    requirements: RequirementsSchema,

    // Goals
    goals: GoalsSchema,

    // Limitations
    limitations: LimitationsSchema,

    // Freedom
    freedom: FreedomSchema,

    // Context
    context: ContextSchema,

    // Resources
    resources: ResourcesSchema,

    // Limits
    limits: LimitsSchema,
  }),
});

// Type inference
export type Contract = z.infer<typeof ContractSchema>;

// Validation error type
export interface ContractValidationError {
  path: string[];
  message: string;
  code: string;
}

// Validation result
export interface ContractValidationResult {
  valid: boolean;
  contract?: Contract;
  errors: ContractValidationError[];
}

/**
 * Validate a contract object
 */
export function validateContract(data: unknown): ContractValidationResult {
  const result = ContractSchema.safeParse(data);

  if (result.success) {
    return {
      valid: true,
      contract: result.data,
      errors: [],
    };
  }

  const errors: ContractValidationError[] = result.error.issues.map(issue => ({
    path: issue.path.map(String),
    message: issue.message,
    code: issue.code,
  }));

  return {
    valid: false,
    errors,
  };
}

/**
 * Parse and validate contract from YAML string
 */
export async function parseContract(yamlString: string): Promise<ContractValidationResult> {
  // Dynamic import yaml to avoid bundling issues
  const { parse } = await import('yaml');
  const data = parse(yamlString);
  return validateContract(data);
}
