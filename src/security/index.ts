/**
 * Security Module Index
 *
 * "Never send a human to do a machine's job." — Agent Smith
 *
 * The Security Architecture for The Construct:
 * - Seraph: API Gateway Guardian
 * - Agent Smith: Security Director
 * - Special Agents: Brown (Auth), Jones (Authz), Johnson (Threats),
 *                   Thompson (Audit), Jackson (Incident Response)
 *
 * Phase 6 Implementation
 */

// Core Security Components
export * from './seraph/seraph.js';
export * from './smith/agent-smith.js';

// Special Agents
export * from './agents/index.js';
