/**
 * Contract types
 */

export interface ContractIdentity {
  id: string;
  version: string;
  type: string;
  name: string;
  extends?: string;
}

export interface ContractMetadata {
  created_at: string;
  created_by: string;
  workflow_id?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  tags: string[];
  trace_id?: string;
}

export interface Reference {
  ref: string;
  enforce?: 'strict' | 'advisory';
  sections?: string[];
  required?: boolean;
  min_level?: string;
}

export interface ContractReferences {
  guides?: {
    must_follow?: Reference[];
  };
  tools?: {
    mcp?: Reference[];
    internal?: Reference[];
  };
  agents?: {
    types?: Reference[];
    skills?: Reference[];
  };
  schemas?: {
    input?: Reference[];
    output?: Reference[];
  };
  config?: Reference[];
  architect?: Reference[];
  oracle?: Reference[];
}

export interface ToolRequirement {
  tool: string;
  reason?: string;
  min_calls?: number;
}

export interface ContractRequirements {
  description: string;
  tools?: {
    must_use?: ToolRequirement[];
    must_use_in_order?: Array<{ step: number; tool: string }>;
  };
  agents?: {
    must_involve?: Array<{
      agent_type: string;
      role: string;
      min_level?: string;
    }>;
    must_validate_with?: Array<{
      validator: string;
      min_score: number;
      on_fail: 'retry' | 'escalate' | 'fail';
    }>;
  };
  deliverables?: Array<{
    type: string;
    format?: string;
    min_width?: number;
    min_height?: number;
    save_to: string;
  }>;
}

export interface ContractGoals {
  description?: string;
  objectives: string[];
  quality_criteria?: Record<string, { weight: number; min_score: number }>;
  success_threshold: number;
}

export interface ContractLimitations {
  forbidden_actions?: string[];
  forbidden_paths?: Array<{ pattern: string; reason: string }>;
  forbidden_content?: string[];
  constraints?: string[];
}

export interface ContractFreedom {
  decisions?: Array<{
    area: string;
    description: string;
    constraints?: string[];
  }>;
  adaptations?: string[];
}

export interface ContractContext {
  previous_outputs?: Array<{
    node: string;
    output_key: string;
    path: string;
  }>;
  inputs?: Record<string, unknown>;
  background?: Record<string, unknown>;
}

export interface ContractResources {
  models?: {
    allowed: string[];
    preferred?: string;
    forbidden?: string[];
  };
  tools?: {
    allowed?: string[];
    required?: string[];
    forbidden?: string[];
  };
}

export interface ContractLimits {
  cost?: {
    max_usd: number;
    warn_at?: number;
    track_by?: 'contract' | 'session' | 'workflow';
  };
  time?: {
    max_duration_ms: number;
    warn_at_ms?: number;
  };
  retries?: {
    max_attempts: number;
    backoff?: 'none' | 'linear' | 'exponential';
    retry_on?: string[];
  };
  tokens?: {
    max_input?: number;
    max_output?: number;
  };
  iterations?: {
    max_turns?: number;
  };
}

export interface ContractDefinition {
  id: string;
  version: string;
  type: string;
  name: string;
  extends?: string;
  metadata: ContractMetadata;
  references?: ContractReferences;
  requirements: ContractRequirements;
  goals: ContractGoals;
  limitations: ContractLimitations;
  freedom?: ContractFreedom;
  context?: ContractContext;
  resources?: ContractResources;
  limits?: ContractLimits;
}

export interface Contract {
  contract: ContractDefinition;
}
