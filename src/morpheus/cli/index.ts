/**
 * Morpheus CLI - Command Line Interface
 *
 * "This is your last chance. After this, there is no turning back.
 *  You take the blue pill - the story ends, you wake up in your bed
 *  and believe whatever you want to believe. You take the red pill -
 *  you stay in Wonderland and I show you how deep the rabbit-hole goes." — Morpheus
 *
 * Interactive command-line interface for The Construct migration.
 */

import { createMorpheus } from '../morpheus.js';
import { createTank } from '../crew/tank.js';
import { createTrinity } from '../crew/trinity.js';
import { createApoc } from '../crew/apoc.js';
import { createSwitch } from '../crew/switch.js';
import { createReporter } from '../reporter/reporter.js';
import {
  FullAnalysis,
  MigrationPlan,
  ValidationResult,
  AIPackageInfo,
} from '../../types/morpheus.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * CLI options
 */
export interface CLIOptions {
  colors?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  format?: 'text' | 'json' | 'markdown';
}

/**
 * CLI command result
 */
export interface CLIResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

/**
 * Styled output function type
 */
export type OutputFn = (message: string) => void;

/**
 * CLI styling utilities
 */
export interface CLIStyle {
  cyan: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  red: (text: string) => string;
  bold: (text: string) => string;
  dim: (text: string) => string;
  matrix: (text: string) => string;
}

// ============================================================================
// STYLING
// ============================================================================

/**
 * ANSI color codes (works in most terminals)
 */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

/**
 * Create CLI styling utilities
 */
export function createStyle(useColors: boolean = true): CLIStyle {
  if (!useColors) {
    const noOp = (text: string) => text;
    return {
      cyan: noOp,
      green: noOp,
      yellow: noOp,
      red: noOp,
      bold: noOp,
      dim: noOp,
      matrix: noOp,
    };
  }

  return {
    cyan: (text: string) => `${COLORS.cyan}${text}${COLORS.reset}`,
    green: (text: string) => `${COLORS.green}${text}${COLORS.reset}`,
    yellow: (text: string) => `${COLORS.yellow}${text}${COLORS.reset}`,
    red: (text: string) => `${COLORS.red}${text}${COLORS.reset}`,
    bold: (text: string) => `${COLORS.bold}${text}${COLORS.reset}`,
    dim: (text: string) => `${COLORS.dim}${text}${COLORS.reset}`,
    matrix: (text: string) => `${COLORS.green}${COLORS.bold}${text}${COLORS.reset}`,
  };
}

// ============================================================================
// ASCII ART
// ============================================================================

/**
 * Morpheus ASCII banner
 */
export const MORPHEUS_BANNER = `
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   ███╗   ███╗ ██████╗ ██████╗ ██████╗ ██╗  ██╗███████╗   ║
    ║   ████╗ ████║██╔═══██╗██╔══██╗██╔══██╗██║  ██║██╔════╝   ║
    ║   ██╔████╔██║██║   ██║██████╔╝██████╔╝███████║█████╗     ║
    ║   ██║╚██╔╝██║██║   ██║██╔══██╗██╔═══╝ ██╔══██║██╔══╝     ║
    ║   ██║ ╚═╝ ██║╚██████╔╝██║  ██║██║     ██║  ██║███████╗   ║
    ║   ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝   ║
    ║                                                           ║
    ║   "Welcome to the real world."                            ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
`;

/**
 * Small Morpheus banner
 */
export const MORPHEUS_BANNER_SMALL = `
    ╔═════════════════════════════════════════╗
    ║  MORPHEUS - Migration Wizard            ║
    ║  "Welcome to the real world."           ║
    ╚═════════════════════════════════════════╝
`;

/**
 * Progress bar characters
 */
const PROGRESS = {
  filled: '█',
  empty: '░',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

// ============================================================================
// MORPHEUS CLI CLASS
// ============================================================================

/**
 * Morpheus CLI - Interactive command-line interface
 */
export class MorpheusCLI {
  private style: CLIStyle;
  private options: CLIOptions;
  private output: OutputFn;
  private spinnerIndex: number = 0;
  private spinnerInterval: ReturnType<typeof setInterval> | undefined;

  constructor(options: CLIOptions = {}, output?: OutputFn) {
    this.options = {
      colors: true,
      verbose: false,
      quiet: false,
      format: 'text',
      ...options,
    };
    this.style = createStyle(this.options.colors);
    this.output = output || console.log;
  }

  // --------------------------------------------------------------------------
  // DISPLAY METHODS
  // --------------------------------------------------------------------------

  /**
   * Display the Morpheus banner
   */
  showBanner(small: boolean = false): void {
    const banner = small ? MORPHEUS_BANNER_SMALL : MORPHEUS_BANNER;
    this.output(this.style.matrix(banner));
  }

  /**
   * Display a message from Morpheus
   */
  speak(message: string, quote?: string): void {
    this.output('');
    this.output(this.style.cyan(`    Morpheus: "${message}"`));
    if (quote) {
      this.output(this.style.dim(`              — ${quote}`));
    }
    this.output('');
  }

  /**
   * Display a section header
   */
  section(title: string): void {
    this.output('');
    this.output(this.style.bold(`══════════════════════════════════════════════════════════════`));
    this.output(this.style.bold(`  ${title}`));
    this.output(this.style.bold(`══════════════════════════════════════════════════════════════`));
    this.output('');
  }

  /**
   * Display a subsection header
   */
  subsection(title: string): void {
    this.output('');
    this.output(this.style.cyan(`── ${title} ──`));
    this.output('');
  }

  /**
   * Display an info message
   */
  info(message: string): void {
    if (!this.options.quiet) {
      this.output(this.style.cyan(`  ℹ ${message}`));
    }
  }

  /**
   * Display a success message
   */
  success(message: string): void {
    this.output(this.style.green(`  ✓ ${message}`));
  }

  /**
   * Display a warning message
   */
  warn(message: string): void {
    this.output(this.style.yellow(`  ⚠ ${message}`));
  }

  /**
   * Display an error message
   */
  error(message: string): void {
    this.output(this.style.red(`  ✗ ${message}`));
  }

  /**
   * Display verbose output
   */
  verbose(message: string): void {
    if (this.options.verbose) {
      this.output(this.style.dim(`    ${message}`));
    }
  }

  /**
   * Display a list item
   */
  listItem(text: string, indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    this.output(`${spaces}• ${text}`);
  }

  /**
   * Display a numbered list item
   */
  numberedItem(num: number, text: string, indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    this.output(`${spaces}${num}. ${text}`);
  }

  /**
   * Display a progress bar
   */
  progressBar(current: number, total: number, label?: string): void {
    const width = 40;
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = this.style.green(PROGRESS.filled.repeat(filled)) +
                this.style.dim(PROGRESS.empty.repeat(empty));

    const labelText = label ? ` ${label}` : '';
    this.output(`  [${bar}] ${percentage}%${labelText}`);
  }

  /**
   * Start a spinner
   */
  startSpinner(message: string): void {
    this.spinnerIndex = 0;
    const updateSpinner = () => {
      process.stdout.write(`\r  ${this.style.cyan(PROGRESS.spinner[this.spinnerIndex]!)} ${message}`);
      this.spinnerIndex = (this.spinnerIndex + 1) % PROGRESS.spinner.length;
    };
    updateSpinner();
    this.spinnerInterval = setInterval(updateSpinner, 80);
  }

  /**
   * Stop the spinner
   */
  stopSpinner(success: boolean = true, message?: string): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
    }
    const icon = success ? this.style.green('✓') : this.style.red('✗');
    const text = message || '';
    process.stdout.write(`\r  ${icon} ${text}\n`);
  }

  /**
   * Display a table
   */
  table(headers: string[], rows: string[][]): void {
    // Calculate column widths
    const widths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => (r[i] || '').length));
      return Math.max(h.length, maxRow);
    });

    // Header
    const headerLine = headers.map((h, i) => h.padEnd(widths[i]!)).join(' | ');
    const separator = widths.map(w => '─'.repeat(w)).join('─┼─');

    this.output(`  ${this.style.bold(headerLine)}`);
    this.output(`  ${separator}`);

    // Rows
    for (const row of rows) {
      const rowLine = row.map((c, i) => (c || '').padEnd(widths[i]!)).join(' | ');
      this.output(`  ${rowLine}`);
    }
    this.output('');
  }

  // --------------------------------------------------------------------------
  // COMMANDS
  // --------------------------------------------------------------------------

  /**
   * Analyze a project
   */
  async analyze(projectPath: string, deep: boolean = false): Promise<CLIResult> {
    this.showBanner(true);
    this.speak('Let me show you how deep the rabbit hole goes...', 'The Matrix');

    this.section('Project Analysis');

    try {
      const tank = createTank();
      const trinity = createTrinity();

      this.info(`Scanning project: ${projectPath}`);

      // Scan with Tank
      this.subsection('Scanning Files (Tank)');
      const scan = await tank.scanProject(projectPath);
      this.success(`Found ${scan.files.length} files`);
      this.verbose(`AI-related files: ${scan.statistics.aiRelatedFiles}`);

      // Analyze dependencies
      this.subsection('Dependencies');
      const deps = scan.dependencies;
      this.success(`Found ${deps.aiPackages.length} AI packages`);
      for (const pkg of deps.aiPackages) {
        this.listItem(`${pkg.name}@${pkg.version} (${pkg.provider})`);
      }

      // Deep analysis with Trinity
      if (deep) {
        this.subsection('Deep Analysis (Trinity)');
        this.info('Analyzing patterns and architecture...');

        const { patterns, antiPatterns } = await trinity.analyzePatterns(scan);

        this.success(`Found ${patterns.length} good patterns`);
        for (const p of patterns) {
          this.listItem(`${p.name}: ${p.description}`, 4);
        }

        if (antiPatterns.length > 0) {
          this.warn(`Found ${antiPatterns.length} anti-patterns`);
          for (const ap of antiPatterns) {
            this.listItem(this.style.yellow(`${ap.name} (${ap.severity}): ${ap.description}`), 4);
          }
        }
      }

      // Summary table
      this.subsection('Summary');
      this.table(
        ['Metric', 'Value'],
        [
          ['Total Files', scan.files.length.toString()],
          ['AI Files', scan.statistics.aiRelatedFiles.toString()],
          ['AI Packages', deps.aiPackages.length.toString()],
          ['TypeScript', deps.typescript ? 'Yes' : 'No'],
        ]
      );

      this.speak('You have to understand, most of these people are not ready to be unplugged.');

      return {
        success: true,
        message: 'Analysis complete',
        data: { scan, dependencies: deps },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error(`Analysis failed: ${message}`);
      return { success: false, message, errors: [message] };
    }
  }

  /**
   * Generate a migration plan
   */
  async plan(projectPath: string, projectName?: string): Promise<CLIResult> {
    this.showBanner(true);
    this.speak('I can only show you the door. You\'re the one that has to walk through it.', 'The Matrix');

    this.section('Migration Planning');

    try {
      const tank = createTank();
      const trinity = createTrinity();
      const apoc = createApoc();

      // First, analyze
      this.info('Analyzing project...');
      const scan = await tank.scanProject(projectPath);
      const deps = scan.dependencies;
      const configs = scan.configs;

      // Trinity analyzes patterns
      const { patterns, antiPatterns } = await trinity.analyzePatterns(scan);

      // Build FullAnalysis (simplified)
      const analysis: FullAnalysis = {
        project: scan,
        aiUsage: {
          providers: deps.aiPackages.map((p: AIPackageInfo) => ({
            provider: p.provider,
            package: p.name,
            version: p.version,
            locations: [],
            models: [],
            features: p.features,
            callCount: 0,
          })),
          prompts: [],
          tools: [],
          patterns,
          antiPatterns,
        },
        architecture: {
          structure: {
            hasServiceLayer: scan.files.some(f => f.relativePath.includes('service')),
            hasSeparateAIModule: scan.files.some(f => f.relativePath.includes('/ai/')),
            hasConfigFiles: configs.configFiles.length > 0,
            hasTypeDefinitions: scan.files.some(f => f.relativePath.includes('types')),
            hasTests: scan.files.some(f => f.relativePath.includes('.test.') || f.relativePath.includes('.spec.')),
            hasCentralizedErrors: scan.files.some(f => f.relativePath.includes('error')),
            hasLogging: scan.files.some(f => f.relativePath.includes('log')),
          },
          patterns: patterns.map(p => p.name),
          score: antiPatterns.length === 0 ? 80 : Math.max(40, 80 - antiPatterns.length * 10),
          recommendations: antiPatterns.map(ap => ap.remediation),
        },
        security: {
          score: configs.detectedSecrets.length === 0 ? 80 : 40,
          findings: configs.detectedSecrets.map((s, i) => ({
            id: `sec-${i}`,
            severity: 'high' as const,
            category: 'secrets',
            title: 'Detected Secret',
            description: `Secret found in ${s.file}`,
            location: { file: s.file, line: s.line, column: 0 },
            remediation: 'Use environment variables',
          })),
          hasAuthentication: false,
          hasAuthorization: false,
          hasAuditLogging: false,
          hasSecretManagement: configs.hasEnvExample,
          hasInputValidation: false,
          hasOutputSanitization: false,
        },
        quality: {
          score: 70,
          hasErrorHandling: scan.files.some(f => f.content?.includes('catch')),
          hasValidation: false,
          hasTesting: scan.files.some(f => f.relativePath.includes('.test.')),
          hasDocumentation: scan.files.some(f => f.relativePath.includes('README')),
          findings: [],
        },
        gaps: {
          missing: [],
          partial: [],
          recommendations: [],
        },
      };

      // Generate plan with Apoc
      this.subsection('Generating Plan (Apoc)');
      this.info('Creating migration strategy...');

      const plan = await apoc.generateMigrationPlan(analysis, projectName || 'Project');

      // Display plan summary
      this.subsection('Migration Plan');

      this.info(`Project: ${plan.projectName}`);
      this.info(`Phases: ${plan.phases.length}`);
      this.info(`Risks: ${plan.risks.length}`);
      this.output('');

      // Phases
      this.table(
        ['Phase', 'Name', 'Effort (hours)', 'Status'],
        plan.phases.map(p => [
          p.order.toString(),
          p.name,
          `${p.estimatedEffort.optimistic}-${p.estimatedEffort.pessimistic}`,
          'Pending',
        ])
      );

      // Estimates
      this.subsection('Effort Estimates');
      this.table(
        ['Estimate', 'Hours'],
        [
          ['Optimistic', plan.estimates.totalEffort.optimistic.toString()],
          ['Realistic', plan.estimates.totalEffort.realistic.toString()],
          ['Pessimistic', plan.estimates.totalEffort.pessimistic.toString()],
        ]
      );
      this.info(`Complexity: ${plan.estimates.complexity}`);
      this.info(`Confidence: ${Math.round(plan.estimates.confidence * 100)}%`);

      // Risks
      if (plan.risks.length > 0) {
        this.subsection('Identified Risks');
        for (const risk of plan.risks.slice(0, 5)) {
          const color = risk.impact === 'high' ? this.style.red : risk.impact === 'medium' ? this.style.yellow : this.style.dim;
          this.listItem(color(`${risk.title} (${risk.probability}/${risk.impact})`));
        }
        if (plan.risks.length > 5) {
          this.info(`... and ${plan.risks.length - 5} more`);
        }
      }

      this.speak('Believe me when I say we have a difficult time ahead of us.', 'Apoc');

      return {
        success: true,
        message: 'Plan generated successfully',
        data: plan,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error(`Planning failed: ${message}`);
      return { success: false, message, errors: [message] };
    }
  }

  /**
   * Verify a migration
   */
  async verify(planOrPath: MigrationPlan | string): Promise<CLIResult> {
    this.showBanner(true);
    this.speak('Not like this. Not like this.', 'Switch - The Matrix');

    this.section('Migration Verification');

    try {
      const switchAgent = createSwitch();

      // If path, load plan (simplified - just validate structure)
      let plan: MigrationPlan;
      if (typeof planOrPath === 'string') {
        this.error('Loading plans from files not yet implemented');
        return { success: false, message: 'Not implemented', errors: ['Loading plans from files not yet implemented'] };
      } else {
        plan = planOrPath;
      }

      this.info(`Validating plan: ${plan.projectName}`);

      // Validate the plan
      this.subsection('Plan Validation');
      const validation = await switchAgent.validateMigration(plan);

      if (validation.valid) {
        this.success('Plan is valid');
      } else {
        this.error('Plan has issues');
      }

      // Show errors
      if (validation.errors.length > 0) {
        this.subsection('Errors');
        for (const error of validation.errors) {
          this.error(`${error.code}: ${error.message}`);
        }
      }

      // Show warnings
      if (validation.warnings.length > 0) {
        this.subsection('Warnings');
        for (const warning of validation.warnings) {
          this.warn(`${warning.code}: ${warning.message}`);
        }
      }

      this.info(`Validation Score: ${validation.score}/100`);

      this.speak(validation.valid ? 'The validation is complete.' : 'There are issues that must be addressed.');

      return {
        success: validation.valid,
        message: validation.valid ? 'Validation passed' : 'Validation failed',
        data: validation,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error(`Verification failed: ${message}`);
      return { success: false, message, errors: [message] };
    }
  }

  /**
   * Show crew status
   */
  showCrewStatus(): void {
    this.showBanner(true);

    this.section('Nebuchadnezzar Crew');

    const crew = [
      { name: 'Tank', title: 'The Operator', role: 'Scans and indexes projects', status: 'Ready' },
      { name: 'Mouse', title: 'The Programmer', role: 'Generates contracts and configs', status: 'Ready' },
      { name: 'Trinity', title: 'The Expert', role: 'Deep analysis and patterns', status: 'Ready' },
      { name: 'Switch', title: 'The Skeptic', role: 'Validates and audits', status: 'Ready' },
      { name: 'Apoc', title: 'The Strategist', role: 'Plans and estimates', status: 'Ready' },
    ];

    this.table(
      ['Agent', 'Title', 'Role', 'Status'],
      crew.map(c => [c.name, c.title, c.role, this.style.green(c.status)])
    );

    this.speak('You have a good crew.');
  }

  /**
   * Generate a report
   */
  generateReport(plan: MigrationPlan, format: 'markdown' | 'html' | 'json' = 'markdown'): string {
    const reporter = createReporter();
    const report = reporter.generatePlanReport(plan, { format });
    return report.content;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Morpheus CLI instance
 */
export function createCLI(options?: CLIOptions, output?: OutputFn): MorpheusCLI {
  return new MorpheusCLI(options, output);
}
