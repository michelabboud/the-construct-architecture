/**
 * Checklist Manager
 *
 * "There's a difference between knowing the path and walking the path." — Morpheus
 *
 * Manages workflow checklists with status tracking and verification support.
 */

import { EventEmitter } from 'events';
import {
  ChecklistState,
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistItemDef,
  ChecklistVerification,
  VerificationResult,
  WorkflowPhase,
  // Future use: CrewMember,
} from '../../types/morpheus.js';

/**
 * Checklist manager options
 */
export interface ChecklistManagerOptions {
  /** Whether to require evidence for AI-verified items */
  requireEvidence?: boolean;
  /** Default verification method */
  defaultVerification?: 'manual' | 'automated' | 'ai-verify';
}

/**
 * Checklist update event
 */
export interface ChecklistUpdateEvent {
  phaseId: string;
  itemId: string;
  previousStatus: ChecklistItemStatus;
  newStatus: ChecklistItemStatus;
  completedBy?: 'user' | 'automated' | 'ai';
  evidence?: string;
}

/**
 * ChecklistManager class
 *
 * Manages workflow checklists with status tracking and verification.
 */
export class ChecklistManager extends EventEmitter {
  private checklists: Map<string, ChecklistState> = new Map();
  private options: Required<ChecklistManagerOptions>;

  constructor(options: ChecklistManagerOptions = {}) {
    super();
    this.options = {
      requireEvidence: options.requireEvidence ?? false,
      defaultVerification: options.defaultVerification ?? 'manual',
    };
  }

  /**
   * Initialize a checklist for a phase
   */
  initializeChecklist(phase: WorkflowPhase): ChecklistState {
    const items: ChecklistItem[] = phase.checklist.map((def) =>
      this.createChecklistItem(def)
    );

    const state: ChecklistState = {
      phaseId: phase.id,
      items,
      status: 'pending',
    };

    this.checklists.set(phase.id, state);
    return state;
  }

  /**
   * Get checklist for a phase
   */
  getChecklist(phaseId: string): ChecklistState | undefined {
    return this.checklists.get(phaseId);
  }

  /**
   * Get all checklists
   */
  getAllChecklists(): Map<string, ChecklistState> {
    return new Map(this.checklists);
  }

  /**
   * Get a specific checklist item
   */
  getItem(phaseId: string, itemId: string): ChecklistItem | undefined {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return undefined;
    return checklist.items.find((item) => item.id === itemId);
  }

  /**
   * Mark a checklist item as complete
   */
  markComplete(
    phaseId: string,
    itemId: string,
    completedBy: 'user' | 'automated' | 'ai',
    evidence?: string
  ): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return false;

    // Check if evidence is required
    if (
      this.options.requireEvidence &&
      item.verification.type === 'ai-verify' &&
      !evidence
    ) {
      return false;
    }

    const previousStatus = item.status;
    item.status = 'completed';
    item.completedAt = new Date();
    item.completedBy = completedBy;
    if (evidence) {
      item.evidence = evidence;
    }

    // Update checklist status
    this.updateChecklistStatus(checklist);

    // Emit event
    this.emit('item:completed', {
      phaseId,
      itemId,
      previousStatus,
      newStatus: 'completed',
      completedBy,
      evidence,
    } as ChecklistUpdateEvent);

    return true;
  }

  /**
   * Mark a checklist item as failed
   */
  markFailed(phaseId: string, itemId: string, error: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return false;

    const previousStatus = item.status;
    item.status = 'failed';
    item.error = error;

    // Update checklist status
    this.updateChecklistStatus(checklist);

    // Emit event
    this.emit('item:failed', {
      phaseId,
      itemId,
      previousStatus,
      newStatus: 'failed',
    } as ChecklistUpdateEvent);

    return true;
  }

  /**
   * Mark a checklist item as skipped
   */
  markSkipped(phaseId: string, itemId: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return false;

    // Cannot skip required items
    if (item.required) {
      return false;
    }

    const previousStatus = item.status;
    item.status = 'skipped';

    // Update checklist status
    this.updateChecklistStatus(checklist);

    // Emit event
    this.emit('item:skipped', {
      phaseId,
      itemId,
      previousStatus,
      newStatus: 'skipped',
    } as ChecklistUpdateEvent);

    return true;
  }

  /**
   * Mark a checklist item as in progress
   */
  markInProgress(phaseId: string, itemId: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return false;

    const previousStatus = item.status;
    item.status = 'in_progress';

    // Update checklist status
    if (checklist.status === 'pending') {
      checklist.status = 'in_progress';
    }

    // Emit event
    this.emit('item:started', {
      phaseId,
      itemId,
      previousStatus,
      newStatus: 'in_progress',
    } as ChecklistUpdateEvent);

    return true;
  }

  /**
   * Reset a checklist item to pending
   */
  resetItem(phaseId: string, itemId: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return false;

    const previousStatus = item.status;
    item.status = 'pending';
    delete item.completedAt;
    delete item.completedBy;
    delete item.evidence;
    delete item.error;

    // Update checklist status
    this.updateChecklistStatus(checklist);

    // Emit event
    this.emit('item:reset', {
      phaseId,
      itemId,
      previousStatus,
      newStatus: 'pending',
    } as ChecklistUpdateEvent);

    return true;
  }

  /**
   * Check if a checklist is complete
   */
  isChecklistComplete(phaseId: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;
    return checklist.status === 'completed';
  }

  /**
   * Check if all required items are complete
   */
  areRequiredItemsComplete(phaseId: string): boolean {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return false;

    return checklist.items
      .filter((item) => item.required)
      .every((item) => item.status === 'completed');
  }

  /**
   * Get checklist progress
   */
  getProgress(phaseId: string): {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    pending: number;
    percentage: number;
  } | null {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return null;

    const total = checklist.items.length;
    const completed = checklist.items.filter((i) => i.status === 'completed').length;
    const failed = checklist.items.filter((i) => i.status === 'failed').length;
    const skipped = checklist.items.filter((i) => i.status === 'skipped').length;
    const pending = checklist.items.filter(
      (i) => i.status === 'pending' || i.status === 'in_progress'
    ).length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, failed, skipped, pending, percentage };
  }

  /**
   * Get items that need verification
   */
  getItemsNeedingVerification(phaseId: string): ChecklistItem[] {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return [];

    return checklist.items.filter(
      (item) =>
        item.status === 'pending' &&
        (item.verification.type === 'automated' || item.verification.type === 'ai-verify')
    );
  }

  /**
   * Get items by verification type
   */
  getItemsByVerificationType(
    phaseId: string,
    type: 'manual' | 'automated' | 'ai-verify'
  ): ChecklistItem[] {
    const checklist = this.checklists.get(phaseId);
    if (!checklist) return [];

    return checklist.items.filter((item) => item.verification.type === type);
  }

  /**
   * Apply verification result to a checklist item
   */
  applyVerification(
    phaseId: string,
    itemId: string,
    result: VerificationResult
  ): boolean {
    if (result.verified) {
      return this.markComplete(
        phaseId,
        itemId,
        result.method === 'manual' ? 'user' : result.method === 'automated' ? 'automated' : 'ai',
        result.evidence
      );
    } else {
      return this.markFailed(
        phaseId,
        itemId,
        result.details ?? 'Verification failed'
      );
    }
  }

  /**
   * Export checklist state for persistence
   */
  exportState(): Record<string, ChecklistState> {
    const state: Record<string, ChecklistState> = {};
    for (const [phaseId, checklist] of this.checklists) {
      state[phaseId] = { ...checklist };
    }
    return state;
  }

  /**
   * Import checklist state from persistence
   */
  importState(state: Record<string, ChecklistState>): void {
    this.checklists.clear();
    for (const [phaseId, checklist] of Object.entries(state)) {
      this.checklists.set(phaseId, checklist);
    }
  }

  /**
   * Clear all checklists
   */
  clear(): void {
    this.checklists.clear();
  }

  /**
   * Create a checklist item from a definition
   */
  private createChecklistItem(def: ChecklistItemDef): ChecklistItem {
    const verification: ChecklistVerification = {
      type: def.verification?.type ?? this.options.defaultVerification,
    };
    if (def.verification?.agent) verification.agent = def.verification.agent;
    if (def.verification?.contract) verification.contract = def.verification.contract;

    return {
      id: def.id,
      text: def.text,
      required: def.required ?? true,
      status: 'pending',
      verification,
    };
  }

  /**
   * Update checklist status based on item statuses
   */
  private updateChecklistStatus(checklist: ChecklistState): void {
    const items = checklist.items;

    // Check if all items are complete or skipped
    const allDone = items.every(
      (item) => item.status === 'completed' || item.status === 'skipped'
    );

    // Check if any required items failed
    const hasRequiredFailure = items.some(
      (item) => item.required && item.status === 'failed'
    );

    // Check if any items are in progress
    const hasInProgress = items.some((item) => item.status === 'in_progress');

    if (allDone && !hasRequiredFailure) {
      checklist.status = 'completed';
      checklist.completedAt = new Date();
    } else if (hasInProgress || items.some((i) => i.status !== 'pending')) {
      checklist.status = 'in_progress';
    } else {
      checklist.status = 'pending';
    }
  }
}

/**
 * Create a checklist manager instance
 */
export function createChecklistManager(
  options?: ChecklistManagerOptions
): ChecklistManager {
  return new ChecklistManager(options);
}
