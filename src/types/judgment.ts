/**
 * Judgment types for The Oracle
 */

export type Verdict = 'approved' | 'needs_revision' | 'rejected' | 'escalated';

export interface Compliance {
  metRequirements: boolean;
  followedLimitations: boolean;
  schemaValid: boolean;
}

export interface QualityScores {
  accuracy: number;     // 0-10
  completeness: number; // 0-10
  consistency: number;  // 0-10
}

export interface Judgment {
  verdict: Verdict;
  score: number;        // 0-10
  compliance: Compliance;
  quality: QualityScores;
  feedback: string[];
  xpAwarded: number;
  achievementsUnlocked: string[];
}

export interface JudgmentRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  workflowId: string;
  nodeId: string;

  agent: {
    id: string;
    provider: string;
    model: string;
    role: 'worker' | 'validator' | 'monitor';
    level: string;
    xp: number;
  };

  contract: {
    id: string;
    type: string;
    requirements: string[];
    limitations: string[];
  };

  evidence: {
    output: unknown;
    outputPath?: string;
    duration: number;
    tokenUsage: {
      input: number;
      output: number;
    };
    cost: number;
    retries: number;
    toolsUsed: string[];
  };

  judgment: Judgment;
}

export interface AgentSubmission {
  agentId: string;
  contractId: string;
  output: unknown;
  outputPath?: string;
  duration: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
  cost: number;
  retries?: number;
  toolsUsed?: string[];
}

export interface Evaluation {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

export interface QualityScore {
  overall: number;
  criteria: Record<string, {
    score: number;
    weight: number;
    feedback: string[];
  }>;
}
