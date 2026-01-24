/**
 * The Construct - AI Orchestration Architecture
 *
 * "This is the Construct. It's our loading program."
 * — Morpheus
 *
 * Core Principle: "Code that calls AI, not AI that calls code"
 */

// Architect (Source of Truth)
export { Architect } from './architect/architect.js';
export { ContractSchema, type Contract } from './architect/schemas/contract.schema.js';

// Oracle (Judgment & Insight)
export { Oracle } from './oracle/oracle.js';
export { LevelUpSystem } from './oracle/level-up.js';

// Agents (Orchestrator)
export { ContractExecutor } from './agents/contract-executor.js';

// Sentinels (QA & Enforcement)
export { Sentinels } from './sentinels/sentinels.js';

// Programs (Workers)
export { Worker } from './programs/worker.js';

// Keymaker (Tool Adapter)
export { Keymaker } from './keymaker/keymaker.js';

// Security (Agent Smith & Team) - Phase 6
export { Seraph } from './security/seraph/seraph.js';
export { AgentSmith } from './security/smith/agent-smith.js';
export { AgentBrown } from './security/agents/brown.js';
export { AgentJones } from './security/agents/jones.js';
export { AgentJohnson } from './security/agents/johnson.js';
export { AgentThompson } from './security/agents/thompson.js';
export { AgentJackson } from './security/agents/jackson.js';

// Chaos Engineering (The Twins) - Phase 7
export { Ghost, createGhost } from './chaos/ghost/ghost.js';
export { Phantom, createPhantom } from './chaos/phantom/phantom.js';
export { Twins, createTwins } from './chaos/twins.js';

// Types
export * from './types/index.js';
