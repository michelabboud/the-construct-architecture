/**
 * Morpheus Crew - Nebuchadnezzar Team Agents
 *
 * "I'm trying to free your mind. But I can only show you the door.
 *  You're the one that has to walk through it." — Morpheus
 *
 * Exports all crew-related functionality.
 */

// Base agent
export {
  BaseAgent,
  AgentCapability,
  AgentContext,
  AgentTask,
  AgentStatus,
  ExecutionOptions,
  VerificationContext,
  AgentExecutionError,
  CrewRole,
  CREW_ROLES,
  createDefaultAgentConfig,
  isValidCrewMember,
  getCrewMemberByName,
  getAllCrewMembers,
} from './base-agent.js';

// Tank - The Operator (Scanner)
export { Tank, createTank } from './tank.js';

// Mouse - The Programmer (Generator)
export { Mouse, createMouse } from './mouse.js';

// Trinity - The Expert (Analyzer)
export { Trinity, createTrinity } from './trinity.js';

// Switch - The Skeptic (Validator)
export { Switch, createSwitch } from './switch.js';

// Apoc - The Strategist (Planner)
export { Apoc, createApoc } from './apoc.js';

// Re-export types from main types
export type {
  CrewMember,
  AgentResult,
  AgentError,
  AgentConfig,
  CrewConfig,
} from '../../types/morpheus.js';
