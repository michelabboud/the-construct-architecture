# Level-Up System

> *"There is no spoon."* — The Spoon Boy

## Overview

The Oracle manages a positive-only XP and leveling system. Agents earn XP for good work. Bad work earns 0 XP, not negative XP.

**Key Principle:** Positive reinforcement only. No penalties.

## Agent Levels

| Level | XP Required | Description |
|-------|-------------|-------------|
| **Rookie** | 0 | New agent, untested |
| **Reliable** | 100 | Proven performer |
| **Trusted** | 500 | Consistent excellence |
| **Expert** | 2000 | Top-tier performance |

## XP Rewards

### Task Completion

| Event | XP Awarded |
|-------|------------|
| Task completed | +10 |
| First-try success (no retries) | +5 |

### Quality Bonuses

| Event | XP Awarded |
|-------|------------|
| Score above 8.0 | +15 |
| Score above 9.0 | +25 |
| Perfect score (10.0) | +50 |

### Efficiency Bonuses

| Event | XP Awarded |
|-------|------------|
| Under budget (cost < estimate) | +10 |
| Fast completion | +5 |

### Streak Bonuses

| Streak | XP Awarded |
|--------|------------|
| 5 consecutive successes | +25 |
| 10 consecutive successes | +50 |
| 25 consecutive successes | +100 |

### Failure (NO PENALTIES)

| Event | XP Awarded |
|-------|------------|
| Task failed | 0 |
| Needed retries | 0 |
| Over budget | 0 |
| Low quality score | 0 |

## Level Privileges

### Rookie (Level 1)
- 100% validation rate (every output checked)
- Simple tasks only
- Max 3 retries
- Cannot self-correct

### Reliable (Level 2)
- 20% validation rate (spot checks)
- Medium complexity tasks
- Max 5 retries
- Cannot self-correct

### Trusted (Level 3)
- 5% validation rate (audit)
- Complex tasks allowed
- Max 10 retries
- Can self-correct on failures

### Expert (Level 4)
- On-request validation only
- Any task complexity
- Unlimited retries
- Can self-correct
- Can mentor (outputs used as examples)

## Agent Profile

```typescript
interface AgentProfile {
  id: string;
  provider: string;          // e.g., "openai", "anthropic"
  model: string;             // e.g., "gpt-4o", "claude-3-opus"

  // Overall standing
  xp: number;
  level: 'rookie' | 'reliable' | 'trusted' | 'expert';

  // Per-task-type specializations
  specializations: {
    [taskType: string]: {
      xp: number;
      level: string;
      tasksCompleted: number;
      avgScore: number;
      bestScore: number;
      currentStreak: number;
    };
  };

  // Achievements
  achievements: Achievement[];

  // Lifetime stats
  stats: {
    totalTasks: number;
    totalXpEarned: number;
    totalCostIncurred: number;
    averageScore: number;
    successRate: number;
  };
}
```

## Specializations

Agents can specialize in specific task types:

```typescript
// Example: gemini-2.0-flash specialization profile
{
  id: "gemini-2.0-flash",
  provider: "google",
  model: "gemini-2.0-flash",
  xp: 450,
  level: "reliable",

  specializations: {
    "image_generation": {
      xp: 280,
      level: "trusted",        // Higher level for this specialty!
      tasksCompleted: 45,
      avgScore: 8.2,
      bestScore: 9.5,
      currentStreak: 12
    },
    "text_analysis": {
      xp: 170,
      level: "reliable",
      tasksCompleted: 22,
      avgScore: 7.8,
      bestScore: 9.0,
      currentStreak: 5
    }
  }
}
```

## Achievements

Agents can unlock achievements:

| Achievement | Condition | Bonus XP |
|-------------|-----------|----------|
| First Steps | Complete first task | +10 |
| Perfectionist | Score 10.0 | +50 |
| Streak Master | 25 consecutive successes | +100 |
| Speed Demon | Complete 10 tasks under time | +50 |
| Budget Hero | Complete 20 tasks under budget | +75 |
| Specialist | Reach Trusted in any specialty | +100 |
| Expert | Reach Expert level | +200 |

## Oracle API

```typescript
interface LevelUpSystem {
  // Get agent profile
  getProfile(agentId: string): AgentProfile;

  // Award XP for an event
  awardXP(agentId: string, event: XPEvent): XPAward;

  // Check and process level up
  checkLevelUp(agentId: string): LevelUpResult | null;

  // Get validation rate for agent
  getValidationRate(agentId: string, taskType?: string): number;

  // Get leaderboard
  getLeaderboard(options?: {
    taskType?: string;
    limit?: number;
  }): AgentRanking[];

  // Check achievements
  checkAchievements(agentId: string): Achievement[];
}
```

## XP Award Process

1. Task completes
2. Oracle evaluates output
3. Calculate base XP (task completion)
4. Add quality bonuses (score-based)
5. Add efficiency bonuses (time/cost)
6. Check and add streak bonus
7. Award total XP
8. Check for level up
9. Check for achievements
10. Update profile

```typescript
// Example
const result = await oracle.submitForJudgment({
  agentId: "gemini-2.0-flash",
  contractId: "img-gen-001",
  output: generatedImage,
  duration: 5000,
  cost: 0.05
});

// result.xpAwarded = 35 (10 base + 15 quality + 10 under budget)
// result.levelUp = { from: "rookie", to: "reliable" }
// result.achievements = [{ name: "Budget Hero", xp: 75 }]
```

## Validation Rate by Level

The Sentinels use agent level to determine how often to validate:

```typescript
function getValidationRate(agent: AgentProfile): number {
  switch (agent.level) {
    case 'rookie':  return 1.0;   // 100% - validate everything
    case 'reliable': return 0.2;  // 20% - spot checks
    case 'trusted':  return 0.05; // 5% - occasional audit
    case 'expert':   return 0.0;  // 0% - only on request
  }
}

// In Sentinels
async validateOutput(output: any, agent: AgentProfile): Promise<ValidationResult> {
  const rate = this.getValidationRate(agent);
  const shouldValidate = Math.random() < rate;

  if (!shouldValidate) {
    return { validated: false, reason: 'skipped_by_level' };
  }

  return this.performValidation(output);
}
```

## Storage

Agent profiles are stored in SQLite:

```sql
CREATE TABLE agent_profiles (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  level TEXT DEFAULT 'rookie',
  total_tasks INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  average_score REAL DEFAULT 0,
  success_rate REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specializations (
  agent_id TEXT,
  task_type TEXT,
  xp INTEGER DEFAULT 0,
  level TEXT DEFAULT 'rookie',
  tasks_completed INTEGER DEFAULT 0,
  avg_score REAL DEFAULT 0,
  best_score REAL DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  PRIMARY KEY (agent_id, task_type),
  FOREIGN KEY (agent_id) REFERENCES agent_profiles(id)
);

CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT,
  achievement TEXT,
  awarded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agent_profiles(id)
);

CREATE TABLE xp_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT,
  event TEXT,
  xp_awarded INTEGER,
  contract_id TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agent_profiles(id)
);
```

## Why Positive-Only?

**No penalties because:**

1. **AI models don't learn from session to session** - Penalizing doesn't train them
2. **Positive reinforcement is sufficient** - Good work gets rewarded, bad work doesn't
3. **Simpler to reason about** - No complex penalty calculations
4. **Fairer to new models** - Don't punish early failures while learning
5. **Encourages experimentation** - No fear of penalty for trying new approaches

**The goal is to identify which models/providers are good at what, not to punish failures.**
