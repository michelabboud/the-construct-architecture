/**
 * Agent types for The Construct
 */

export type AgentLevel = 'rookie' | 'reliable' | 'trusted' | 'expert';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  awardedAt: Date;
}

export interface Specialization {
  taskType: string;
  xp: number;
  level: AgentLevel;
  tasksCompleted: number;
  avgScore: number;
  bestScore: number;
  currentStreak: number;
}

export interface AgentStats {
  totalTasks: number;
  totalXpEarned: number;
  totalCostIncurred: number;
  averageScore: number;
  successRate: number;
}

export interface AgentProfile {
  id: string;
  provider: string;
  model: string;

  // Overall standing
  xp: number;
  level: AgentLevel;

  // Per-task-type specializations
  specializations: Record<string, Specialization>;

  // Achievements
  achievements: Achievement[];

  // Lifetime stats
  stats: AgentStats;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRanking {
  rank: number;
  agentId: string;
  provider: string;
  model: string;
  xp: number;
  level: AgentLevel;
  avgScore: number;
  successRate: number;
}

export interface LevelUpResult {
  agentId: string;
  previousLevel: AgentLevel;
  newLevel: AgentLevel;
  totalXp: number;
  timestamp: Date;
}

// XP event types
export type XPEventType =
  | 'task_completed'
  | 'first_try_success'
  | 'score_above_8'
  | 'score_above_9'
  | 'perfect_score'
  | 'under_budget'
  | 'fast_completion'
  | 'streak_5'
  | 'streak_10'
  | 'streak_25';

export interface XPEvent {
  type: XPEventType;
  agentId: string;
  contractId: string;
  taskType: string;
  score?: number;
  cost?: number;
  duration?: number;
}

export interface XPAward {
  agentId: string;
  event: XPEventType;
  xpAwarded: number;
  totalXp: number;
  levelUp?: LevelUpResult;
  achievementsUnlocked?: Achievement[];
}

// Level thresholds
export const LEVEL_THRESHOLDS: Record<AgentLevel, number> = {
  rookie: 0,
  reliable: 100,
  trusted: 500,
  expert: 2000,
};

// XP rewards
export const XP_REWARDS: Record<XPEventType, number> = {
  task_completed: 10,
  first_try_success: 5,
  score_above_8: 15,
  score_above_9: 25,
  perfect_score: 50,
  under_budget: 10,
  fast_completion: 5,
  streak_5: 25,
  streak_10: 50,
  streak_25: 100,
};

// Level privileges
export interface LevelPrivileges {
  validationRate: number;       // 0-1, percentage of outputs validated
  maxTaskComplexity: 'simple' | 'medium' | 'complex' | 'any';
  maxRetries: number | 'unlimited';
  canSelfCorrect: boolean;
  canMentor?: boolean;
}

export const LEVEL_PRIVILEGES: Record<AgentLevel, LevelPrivileges> = {
  rookie: {
    validationRate: 1.0,        // 100% validation
    maxTaskComplexity: 'simple',
    maxRetries: 3,
    canSelfCorrect: false,
  },
  reliable: {
    validationRate: 0.2,        // 20% spot checks
    maxTaskComplexity: 'medium',
    maxRetries: 5,
    canSelfCorrect: false,
  },
  trusted: {
    validationRate: 0.05,       // 5% audit
    maxTaskComplexity: 'complex',
    maxRetries: 10,
    canSelfCorrect: true,
  },
  expert: {
    validationRate: 0.0,        // On request only
    maxTaskComplexity: 'any',
    maxRetries: 'unlimited',
    canSelfCorrect: true,
    canMentor: true,
  },
};
