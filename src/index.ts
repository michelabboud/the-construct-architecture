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

// Types
export * from './types/index.js';
