/**
 * Morpheus Commander - Migration Wizard Orchestrator
 *
 * "This is your last chance. After this, there is no turning back.
 *  You take the blue pill - the story ends, you wake up in your bed
 *  and believe whatever you want to believe. You take the red pill -
 *  you stay in Wonderland and I show you how deep the rabbit-hole goes." — Morpheus
 *
 * The main orchestrator that manages workflows, crew agents, and migration state.
 */

import { EventEmitter } from 'events';
import {
  Workflow,
  WorkflowPhase,
  WorkflowStep,
  WorkflowState,
  WorkflowStatus,
  WorkflowProgress,
  WorkflowEvent,
  WorkflowEventType,
  CrewMember,
  AgentResult,
  AgentError,
  ChecklistState,
  Checkpoint,
  FileBackup,
} from '../types/morpheus.js';
import { WorkflowLoader, WorkflowLoadResult, createWorkflowLoader } from './workflow/loader.js';
import { ChecklistManager, createChecklistManager } from './workflow/checklist.js';
import { WorkflowStateStore, createStateStore } from './workflow/state.js';
import { BaseAgent, AgentContext, AgentTask, ExecutionOptions } from './crew/base-agent.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// ============================================================================
// MORPHEUS TYPES
// ============================================================================

/**
 * Morpheus configuration options
 */
export interface MorpheusOptions {
  /** Path to workflows directory */
  workflowsDir?: string;
  /** Path to state database */
  statePath?: string;
  /** Whether to use in-memory state (for testing) */
  inMemoryState?: boolean;
  /** Auto-save interval for state (ms) */
  autoSaveInterval?: number;
  /** Whether to require explicit approval for changes */
  requireApproval?: boolean;
  /** Callbacks for user interaction */
  callbacks?: MorpheusCallbacks;
}

/**
 * Callbacks for user interaction
 */
export interface MorpheusCallbacks {
  /** Called when the red pill / blue pill choice is presented */
  onPillChoice?: (context: PillChoiceContext) => Promise<'red' | 'blue'>;
  /** Called when approval is needed */
  onApprovalRequest?: (context: ApprovalContext) => Promise<boolean>;
  /** Called when user input is needed */
  onUserInput?: (prompt: string, options?: UserInputOptions) => Promise<string>;
  /** Called to display progress */
  onProgress?: (progress: ProgressUpdate) => void;
  /** Called to display messages */
  onMessage?: (message: MorpheusMessage) => void;
}

/**
 * Red pill / blue pill choice context
 */
export interface PillChoiceContext {
  projectPath: string;
  workflowName: string;
  analysisPreview?: {
    aiProviders: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
    filesAffected: number;
  };
}

/**
 * Approval context
 */
export interface ApprovalContext {
  type: 'phase' | 'step' | 'file' | 'rollback';
  message: string;
  details?: Record<string, unknown>;
  changes?: FileChange[];
}

/**
 * File change for approval
 */
export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  preview?: string;
}

/**
 * User input options
 */
export interface UserInputOptions {
  type?: 'text' | 'confirm' | 'select';
  choices?: string[];
  default?: string;
}

/**
 * Progress update
 */
export interface ProgressUpdate {
  phase: string;
  step?: string;
  progress: number;
  total: number;
  message: string;
}

/**
 * Morpheus message
 */
export interface MorpheusMessage {
  level: 'info' | 'warn' | 'error' | 'success' | 'morpheus';
  text: string;
  quote?: string;
}

/**
 * Morpheus run options
 */
export interface MorpheusRunOptions {
  /** Resume from existing state */
  resume?: boolean;
  /** Start from a specific phase */
  startPhase?: string;
  /** Run in dry-run mode */
  dryRun?: boolean;
  /** Skip the pill choice */
  skipPillChoice?: boolean;
}

/**
 * Morpheus run result
 */
export interface MorpheusRunResult {
  success: boolean;
  stateId: string;
  status: WorkflowStatus;
  completedPhases: string[];
  failedPhases: string[];
  errors: AgentError[];
  duration: number;
}

// ============================================================================
// MORPHEUS COMMANDER CLASS
// ============================================================================

/**
 * Morpheus Commander
 *
 * "Remember... all I'm offering is the truth. Nothing more."
 */
export class Morpheus extends EventEmitter {
  private workflowLoader: WorkflowLoader;
  private stateStore: WorkflowStateStore;
  private checklistManager: ChecklistManager;
  private crew: Map<CrewMember, BaseAgent> = new Map();
  private options: Required<MorpheusOptions>;
  private currentWorkflow: Workflow | null = null;
  private currentState: WorkflowState | null = null;
  private initialized: boolean = false;

  // Morpheus quotes for different situations
  private static readonly QUOTES = {
    welcome: "Welcome to the real world.",
    choice: "This is your last chance. After this, there is no turning back.",
    redPill: "You take the red pill - you stay in Wonderland and I show you how deep the rabbit-hole goes.",
    bluePill: "You take the blue pill - the story ends, you wake up in your bed and believe whatever you want to believe.",
    begin: "Free your mind.",
    progress: "I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it.",
    complete: "He's beginning to believe.",
    error: "The Matrix is a system, Neo. That system is our enemy.",
    rollback: "There is a difference between knowing the path and walking the path.",
  };

  constructor(options: MorpheusOptions = {}) {
    super();
    this.options = {
      workflowsDir: options.workflowsDir ?? 'src/morpheus/workflows',
      statePath: options.statePath ?? '.morpheus/state.db',
      inMemoryState: options.inMemoryState ?? false,
      autoSaveInterval: options.autoSaveInterval ?? 5000,
      requireApproval: options.requireApproval ?? true,
      callbacks: options.callbacks ?? {},
    };

    this.workflowLoader = createWorkflowLoader({
      workflowsDir: this.options.workflowsDir,
    });

    this.stateStore = createStateStore({
      dbPath: this.options.statePath,
      inMemory: this.options.inMemoryState,
      autoSaveInterval: this.options.autoSaveInterval,
    });

    this.checklistManager = createChecklistManager({
      requireEvidence: true,
    });

    // Wire up checklist events to state persistence
    this.checklistManager.on('item:completed', (event) => {
      this.onChecklistUpdate(event);
    });
    this.checklistManager.on('item:failed', (event) => {
      this.onChecklistUpdate(event);
    });
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  /**
   * Initialize Morpheus
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.stateStore.open();
    this.initialized = true;

    this.message('morpheus', Morpheus.QUOTES.welcome);
  }

  /**
   * Shutdown Morpheus
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    await this.stateStore.close();
    this.initialized = false;
  }

  // --------------------------------------------------------------------------
  // CREW MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Register a crew member
   */
  registerAgent(agent: BaseAgent): void {
    this.crew.set(agent.id, agent);
    this.emit('crew:registered', agent.id);
  }

  /**
   * Get a crew member
   */
  getAgent(id: CrewMember): BaseAgent | undefined {
    return this.crew.get(id);
  }

  /**
   * Get all crew members
   */
  getCrew(): Map<CrewMember, BaseAgent> {
    return new Map(this.crew);
  }

  // --------------------------------------------------------------------------
  // WORKFLOW MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Load a workflow
   */
  async loadWorkflow(workflowId: string): Promise<WorkflowLoadResult> {
    return this.workflowLoader.load(workflowId);
  }

  /**
   * List available workflows
   */
  async listWorkflows(): Promise<string[]> {
    return this.workflowLoader.listWorkflows();
  }

  // --------------------------------------------------------------------------
  // MIGRATION EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Run a migration workflow
   *
   * "What you know you can't explain, but you feel it."
   */
  async run(
    workflowId: string,
    projectPath: string,
    options: MorpheusRunOptions = {}
  ): Promise<MorpheusRunResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const errors: AgentError[] = [];

    // Load workflow
    const loadResult = await this.loadWorkflow(workflowId);
    if (!loadResult.success || !loadResult.workflow) {
      return {
        success: false,
        stateId: '',
        status: 'failed',
        completedPhases: [],
        failedPhases: [],
        errors: loadResult.errors.map((e) => ({
          code: 'WORKFLOW_LOAD_ERROR',
          message: e.message,
          recoverable: false,
        })),
        duration: Date.now() - startTime,
      };
    }

    this.currentWorkflow = loadResult.workflow;

    // The Red Pill / Blue Pill Choice
    if (!options.skipPillChoice && this.options.callbacks.onPillChoice) {
      const choice = await this.presentPillChoice(projectPath);
      if (choice === 'blue') {
        this.message('morpheus', Morpheus.QUOTES.bluePill);
        return {
          success: true,
          stateId: '',
          status: 'completed',
          completedPhases: [],
          failedPhases: [],
          errors: [],
          duration: Date.now() - startTime,
        };
      }
      this.message('morpheus', Morpheus.QUOTES.redPill);
    }

    // Resume or create new state
    if (options.resume) {
      const existingState = await this.stateStore.getStateByProject(projectPath);
      if (existingState && existingState.status !== 'completed') {
        this.currentState = existingState;
        this.message('info', `Resuming migration from phase: ${existingState.currentPhase}`);
      }
    }

    if (!this.currentState) {
      this.currentState = await this.stateStore.createState(workflowId, projectPath);
    }

    this.message('morpheus', Morpheus.QUOTES.begin);

    // Initialize checklists for all phases
    for (const phase of this.currentWorkflow.phases) {
      this.checklistManager.initializeChecklist(phase);
    }

    // Determine starting phase
    const phases = this.getExecutionOrder(this.currentWorkflow.phases);
    let startIndex = 0;
    if (options.startPhase) {
      startIndex = phases.findIndex((p) => p.id === options.startPhase);
      if (startIndex === -1) startIndex = 0;
    } else if (this.currentState.currentPhase) {
      startIndex = phases.findIndex((p) => p.id === this.currentState!.currentPhase);
      if (startIndex === -1) startIndex = 0;
    }

    // Execute phases
    this.currentState.status = 'running';
    await this.stateStore.updateState(this.currentState);

    for (let i = startIndex; i < phases.length; i++) {
      const phase = phases[i]!;

      try {
        const phaseResult = await this.executePhase(phase, options.dryRun ?? false);

        if (!phaseResult.success) {
          this.currentState.progress.failedPhases.push(phase.id);
          errors.push(...(phaseResult.errors || []));

          if (this.currentWorkflow.config.rollbackOnFailure) {
            await this.rollbackToLastCheckpoint();
          }

          this.currentState.status = 'failed';
          await this.stateStore.updateState(this.currentState);

          return {
            success: false,
            stateId: this.currentState.id,
            status: 'failed',
            completedPhases: this.currentState.progress.completedPhases,
            failedPhases: this.currentState.progress.failedPhases,
            errors,
            duration: Date.now() - startTime,
          };
        }

        this.currentState.progress.completedPhases.push(phase.id);
        await this.stateStore.updateState(this.currentState);
      } catch (error) {
        errors.push({
          code: 'PHASE_EXECUTION_ERROR',
          message: (error as Error).message,
          recoverable: false,
        });

        this.currentState.status = 'failed';
        await this.stateStore.updateState(this.currentState);

        return {
          success: false,
          stateId: this.currentState.id,
          status: 'failed',
          completedPhases: this.currentState.progress.completedPhases,
          failedPhases: [...this.currentState.progress.failedPhases, phase.id],
          errors,
          duration: Date.now() - startTime,
        };
      }
    }

    // Migration complete
    this.currentState.status = 'completed';
    this.currentState.completedAt = new Date();
    await this.stateStore.updateState(this.currentState);
    await this.stateStore.addEvent(this.currentState.id, 'workflow_completed', {});

    this.message('morpheus', Morpheus.QUOTES.complete);

    return {
      success: true,
      stateId: this.currentState.id,
      status: 'completed',
      completedPhases: this.currentState.progress.completedPhases,
      failedPhases: [],
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  /**
   * Pause the current migration
   */
  async pause(): Promise<void> {
    if (!this.currentState || this.currentState.status !== 'running') {
      throw new Error('No running migration to pause');
    }

    this.currentState.status = 'paused';
    await this.stateStore.updateState(this.currentState);
    await this.stateStore.addEvent(this.currentState.id, 'workflow_paused', {});

    this.message('info', 'Migration paused. Resume with morpheus.resume()');
  }

  /**
   * Resume a paused migration
   */
  async resume(): Promise<MorpheusRunResult> {
    if (!this.currentState || this.currentState.status !== 'paused') {
      throw new Error('No paused migration to resume');
    }

    if (!this.currentWorkflow) {
      const loadResult = await this.loadWorkflow(this.currentState.workflowId);
      if (!loadResult.success || !loadResult.workflow) {
        throw new Error('Failed to reload workflow');
      }
      this.currentWorkflow = loadResult.workflow;
    }

    await this.stateStore.addEvent(this.currentState.id, 'workflow_resumed', {});

    return this.run(
      this.currentState.workflowId,
      this.currentState.projectPath,
      { resume: true }
    );
  }

  // --------------------------------------------------------------------------
  // PHASE EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Execute a single phase
   */
  private async executePhase(
    phase: WorkflowPhase,
    dryRun: boolean
  ): Promise<{ success: boolean; errors?: AgentError[] }> {
    if (!this.currentState) {
      throw new Error('No active state');
    }

    this.currentState.currentPhase = phase.id;
    await this.stateStore.updateState(this.currentState);
    await this.stateStore.addEvent(this.currentState.id, 'phase_started', {
      phaseName: phase.name,
    }, { phaseId: phase.id });

    this.progress({
      phase: phase.name,
      progress: 0,
      total: phase.steps.length,
      message: `Starting phase: ${phase.name}`,
    });

    this.message('morpheus', Morpheus.QUOTES.progress);

    const errors: AgentError[] = [];

    // Create checkpoint before phase
    if (this.currentWorkflow?.config.checkpoints && !dryRun) {
      await this.createCheckpoint(phase.id, 'start', `Before phase: ${phase.name}`);
    }

    // Execute steps
    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i]!;

      this.progress({
        phase: phase.name,
        step: step.name,
        progress: i,
        total: phase.steps.length,
        message: `Executing: ${step.name}`,
      });

      const stepResult = await this.executeStep(phase, step, dryRun);

      if (!stepResult.success) {
        errors.push(stepResult.error!);
        this.currentState.progress.failedSteps.push(`${phase.id}:${step.id}`);

        const eventOptions: { phaseId: string; stepId: string; error?: AgentError } = {
          phaseId: phase.id,
          stepId: step.id,
        };
        if (stepResult.error) eventOptions.error = stepResult.error;
        await this.stateStore.addEvent(this.currentState.id, 'step_failed', {
          stepName: step.name,
        }, eventOptions);

        // Check if we should continue or abort
        if (step.type !== 'manual') {
          await this.stateStore.addEvent(this.currentState.id, 'phase_failed', {
            phaseName: phase.name,
          }, { phaseId: phase.id });

          return { success: false, errors };
        }
      } else {
        this.currentState.progress.completedSteps.push(`${phase.id}:${step.id}`);
        await this.stateStore.addEvent(this.currentState.id, 'step_completed', {
          stepName: step.name,
        }, { phaseId: phase.id, stepId: step.id });
      }
    }

    // Request approval if configured
    if (phase.approval?.required && this.options.requireApproval) {
      const approved = await this.requestApproval({
        type: 'phase',
        message: phase.approval.message || `Approve completion of phase: ${phase.name}?`,
      });

      if (!approved) {
        await this.stateStore.addEvent(this.currentState.id, 'approval_denied', {
          phaseName: phase.name,
        }, { phaseId: phase.id });

        this.currentState.status = 'waiting_approval';
        await this.stateStore.updateState(this.currentState);

        return {
          success: false,
          errors: [{
            code: 'APPROVAL_DENIED',
            message: `Approval denied for phase: ${phase.name}`,
            recoverable: true,
          }],
        };
      }

      await this.stateStore.addEvent(this.currentState.id, 'approval_granted', {
        phaseName: phase.name,
      }, { phaseId: phase.id });
    }

    // Verify checklist
    const checklistComplete = this.checklistManager.areRequiredItemsComplete(phase.id);
    if (!checklistComplete) {
      this.message('warn', `Phase ${phase.name} checklist incomplete. Some items may need manual verification.`);
    }

    await this.stateStore.addEvent(this.currentState.id, 'phase_completed', {
      phaseName: phase.name,
    }, { phaseId: phase.id });

    return { success: true };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    phase: WorkflowPhase,
    step: WorkflowStep,
    dryRun: boolean
  ): Promise<{ success: boolean; error?: AgentError }> {
    if (!this.currentState) {
      throw new Error('No active state');
    }

    this.currentState.currentStep = step.id;
    await this.stateStore.updateState(this.currentState);

    await this.stateStore.addEvent(this.currentState.id, 'step_started', {
      stepName: step.name,
      stepType: step.type,
    }, { phaseId: phase.id, stepId: step.id });

    // Get the assigned agent
    const agentId = step.agent || phase.lead;
    if (!agentId && step.type === 'ai-assisted') {
      return {
        success: false,
        error: {
          code: 'NO_AGENT_ASSIGNED',
          message: `No agent assigned for AI-assisted step: ${step.name}`,
          recoverable: false,
        },
      };
    }

    if (agentId) {
      const agent = this.crew.get(agentId);
      if (!agent) {
        return {
          success: false,
          error: {
            code: 'AGENT_NOT_REGISTERED',
            message: `Agent ${agentId} not registered for step: ${step.name}`,
            recoverable: false,
          },
        };
      }

      if (!agent.isEnabled()) {
        return {
          success: false,
          error: {
            code: 'AGENT_DISABLED',
            message: `Agent ${agentId} is disabled`,
            recoverable: false,
          },
        };
      }

      // Set agent context
      const agentContext: AgentContext = {
        workflowStateId: this.currentState.id,
        phaseId: phase.id,
        stepId: step.id,
        projectPath: this.currentState.projectPath,
        dryRun,
      };
      if (step.contract) agentContext.contractId = step.contract;
      if (step.input) agentContext.input = step.input;
      agent.setContext(agentContext);

      // Execute the task
      const task: AgentTask = {
        id: `${phase.id}:${step.id}`,
        type: this.stepTypeToCapability(step.type),
        input: step.input ?? {},
      };
      if (step.contract) task.contract = step.contract;
      if (step.timeout) task.timeout = step.timeout;

      const execOptions: ExecutionOptions = {};
      if (step.retries !== undefined) execOptions.retries = step.retries;
      if (step.timeout !== undefined) execOptions.timeout = step.timeout;

      const result = await agent.execute(task, execOptions);

      agent.clearContext();

      if (!result.success) {
        return {
          success: false,
          error: result.error!,
        };
      }
    }

    // Handle review requirement
    if (step.review === 'required' && this.options.requireApproval) {
      const approved = await this.requestApproval({
        type: 'step',
        message: `Review and approve step: ${step.name}?`,
      });

      if (!approved) {
        return {
          success: false,
          error: {
            code: 'REVIEW_REJECTED',
            message: `Review rejected for step: ${step.name}`,
            recoverable: true,
          },
        };
      }
    }

    return { success: true };
  }

  // --------------------------------------------------------------------------
  // CHECKPOINT & ROLLBACK
  // --------------------------------------------------------------------------

  /**
   * Create a checkpoint
   */
  private async createCheckpoint(
    phaseId: string,
    stepId: string,
    description: string
  ): Promise<Checkpoint> {
    if (!this.currentState) {
      throw new Error('No active state');
    }

    // TODO: Implement file backup logic based on affected files
    const fileBackups: FileBackup[] = [];

    return this.stateStore.createCheckpoint(
      this.currentState.id,
      phaseId,
      stepId,
      description,
      fileBackups
    );
  }

  /**
   * Rollback to the last checkpoint
   */
  private async rollbackToLastCheckpoint(): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active state');
    }

    const checkpoint = await this.stateStore.getLatestCheckpoint(this.currentState.id);
    if (!checkpoint) {
      this.message('warn', 'No checkpoint available for rollback');
      return;
    }

    this.message('morpheus', Morpheus.QUOTES.rollback);

    // Request approval for rollback
    if (this.options.requireApproval) {
      const approved = await this.requestApproval({
        type: 'rollback',
        message: `Rollback to checkpoint: ${checkpoint.description}?`,
        changes: checkpoint.fileBackups.map((b) => ({
          path: b.path,
          type: 'modify' as const,
        })),
      });

      if (!approved) {
        this.message('warn', 'Rollback cancelled by user');
        return;
      }
    }

    await this.stateStore.addEvent(this.currentState.id, 'rollback_started', {
      checkpointId: checkpoint.id,
    });

    // Restore files from backup
    for (const backup of checkpoint.fileBackups) {
      if (backup.existed) {
        await writeFile(backup.path, backup.content, 'utf-8');
      } else {
        // File didn't exist before - could delete it, but safer to leave it
      }
    }

    // Update state to checkpoint position
    this.currentState.currentPhase = checkpoint.phaseId;
    this.currentState.currentStep = checkpoint.stepId;
    this.currentState.status = 'rolled_back';
    await this.stateStore.updateState(this.currentState);

    await this.stateStore.addEvent(this.currentState.id, 'rollback_completed', {
      checkpointId: checkpoint.id,
    });

    this.message('success', `Rolled back to: ${checkpoint.description}`);
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * Present the red pill / blue pill choice
   */
  private async presentPillChoice(projectPath: string): Promise<'red' | 'blue'> {
    if (!this.options.callbacks.onPillChoice) {
      return 'red'; // Default to continuing
    }

    this.message('morpheus', Morpheus.QUOTES.choice);

    const context: PillChoiceContext = {
      projectPath,
      workflowName: this.currentWorkflow?.name || 'Unknown',
    };

    return this.options.callbacks.onPillChoice(context);
  }

  /**
   * Request approval from user
   */
  private async requestApproval(context: ApprovalContext): Promise<boolean> {
    if (!this.options.callbacks.onApprovalRequest) {
      return true; // Default to approved
    }

    return this.options.callbacks.onApprovalRequest(context);
  }

  /**
   * Get execution order of phases (topological sort)
   */
  private getExecutionOrder(phases: WorkflowPhase[]): WorkflowPhase[] {
    const phaseMap = new Map(phases.map((p) => [p.id, p]));
    const visited = new Set<string>();
    const result: WorkflowPhase[] = [];

    const visit = (phaseId: string) => {
      if (visited.has(phaseId)) return;
      visited.add(phaseId);

      const phase = phaseMap.get(phaseId);
      if (!phase) return;

      for (const depId of phase.dependsOn) {
        visit(depId);
      }

      result.push(phase);
    };

    for (const phase of phases) {
      visit(phase.id);
    }

    return result;
  }

  /**
   * Convert step type to agent capability
   */
  private stepTypeToCapability(stepType: WorkflowStep['type']): 'scan' | 'analyze' | 'generate' | 'validate' | 'plan' | 'execute' {
    switch (stepType) {
      case 'automated':
        return 'execute';
      case 'ai-assisted':
        return 'analyze';
      case 'semi-automated':
        return 'generate';
      default:
        return 'execute';
    }
  }

  /**
   * Handle checklist update
   */
  private async onChecklistUpdate(event: { phaseId: string }): Promise<void> {
    if (!this.currentState) return;

    const checklist = this.checklistManager.getChecklist(event.phaseId);
    if (checklist) {
      await this.stateStore.saveChecklist(this.currentState.id, checklist);
      await this.stateStore.addEvent(this.currentState.id, 'checklist_updated', {
        phaseId: event.phaseId,
      }, { phaseId: event.phaseId });
    }
  }

  /**
   * Send a progress update
   */
  private progress(update: ProgressUpdate): void {
    this.emit('progress', update);
    this.options.callbacks.onProgress?.(update);
  }

  /**
   * Send a message
   */
  private message(level: MorpheusMessage['level'], text: string, quote?: string): void {
    const msg: MorpheusMessage = { level, text };
    if (quote) msg.quote = quote;
    this.emit('message', msg);
    this.options.callbacks.onMessage?.(msg);
  }

  // --------------------------------------------------------------------------
  // STATE ACCESS
  // --------------------------------------------------------------------------

  /**
   * Get current workflow
   */
  getCurrentWorkflow(): Workflow | null {
    return this.currentWorkflow;
  }

  /**
   * Get current state
   */
  getCurrentState(): WorkflowState | null {
    return this.currentState;
  }

  /**
   * Get checklist manager
   */
  getChecklistManager(): ChecklistManager {
    return this.checklistManager;
  }

  /**
   * Get state store
   */
  getStateStore(): WorkflowStateStore {
    return this.stateStore;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a Morpheus instance
 *
 * "I can only show you the door. You're the one that has to walk through it."
 */
export function createMorpheus(options?: MorpheusOptions): Morpheus {
  return new Morpheus(options);
}
