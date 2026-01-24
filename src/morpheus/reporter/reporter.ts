/**
 * Morpheus Reporter - Migration Report Generator
 *
 * "Throughout human history, we have been dependent on machines to survive.
 *  Fate, it seems, is not without a sense of irony." — Morpheus
 *
 * Generates comprehensive migration reports in multiple formats.
 */

import {
  MigrationPlan,
  MigrationPhase,
  MigrationTask,
  MigrationRisk,
  RiskMitigation,
  MigrationEstimates,
  FullAnalysis,
  ValidationResult,
  AuditReport,
  GapAnalysis,
  CurrentStateSummary,
  TargetStateSummary,
} from '../../types/morpheus.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Report format options
 */
export type ReportFormat = 'markdown' | 'html' | 'json';

/**
 * Report section types
 */
export type ReportSection =
  | 'summary'
  | 'analysis'
  | 'risks'
  | 'phases'
  | 'tasks'
  | 'estimates'
  | 'validation'
  | 'recommendations';

/**
 * Report options
 */
export interface ReportOptions {
  format: ReportFormat;
  title?: string;
  sections?: ReportSection[];
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
  theme?: 'light' | 'dark' | 'matrix';
}

/**
 * Report data - can be various inputs
 */
export interface ReportData {
  plan?: MigrationPlan;
  analysis?: FullAnalysis;
  validation?: ValidationResult;
  audit?: AuditReport;
  progress?: ProgressData;
}

/**
 * Progress data for reports
 */
export interface ProgressData {
  totalPhases: number;
  completedPhases: number;
  currentPhase?: string;
  totalTasks: number;
  completedTasks: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
}

/**
 * Generated report
 */
export interface GeneratedReport {
  format: ReportFormat;
  content: string;
  generatedAt: Date;
  sections: ReportSection[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// REPORTER CLASS
// ============================================================================

/**
 * Morpheus Reporter - Generates migration reports
 */
export class Reporter {
  private defaultOptions: ReportOptions = {
    format: 'markdown',
    sections: ['summary', 'analysis', 'risks', 'phases', 'estimates', 'recommendations'],
    includeTimestamps: true,
    includeMetadata: true,
    theme: 'matrix',
  };

  /**
   * Generate a report from the provided data
   */
  generate(data: ReportData, options?: Partial<ReportOptions>): GeneratedReport {
    const opts = { ...this.defaultOptions, ...options };
    const sections = opts.sections || this.defaultOptions.sections!;

    let content: string;

    switch (opts.format) {
      case 'markdown':
        content = this.generateMarkdown(data, opts, sections);
        break;
      case 'html':
        content = this.generateHtml(data, opts, sections);
        break;
      case 'json':
        content = this.generateJson(data, opts, sections);
        break;
      default:
        throw new Error(`Unsupported format: ${opts.format}`);
    }

    const result: GeneratedReport = {
      format: opts.format,
      content,
      generatedAt: new Date(),
      sections,
    };
    if (opts.includeMetadata) {
      result.metadata = this.extractMetadata(data);
    }
    return result;
  }

  /**
   * Generate a migration plan report
   */
  generatePlanReport(plan: MigrationPlan, options?: Partial<ReportOptions>): GeneratedReport {
    return this.generate({ plan }, {
      ...options,
      title: options?.title || `Migration Plan: ${plan.projectName}`,
      sections: options?.sections || ['summary', 'risks', 'phases', 'tasks', 'estimates', 'recommendations'],
    });
  }

  /**
   * Generate an analysis report
   */
  generateAnalysisReport(analysis: FullAnalysis, options?: Partial<ReportOptions>): GeneratedReport {
    return this.generate({ analysis }, {
      ...options,
      title: options?.title || 'Project Analysis Report',
      sections: options?.sections || ['summary', 'analysis', 'recommendations'],
    });
  }

  /**
   * Generate a validation report
   */
  generateValidationReport(validation: ValidationResult, options?: Partial<ReportOptions>): GeneratedReport {
    return this.generate({ validation }, {
      ...options,
      title: options?.title || 'Validation Report',
      sections: options?.sections || ['summary', 'validation', 'recommendations'],
    });
  }

  /**
   * Generate a progress report
   */
  generateProgressReport(plan: MigrationPlan, progress: ProgressData, options?: Partial<ReportOptions>): GeneratedReport {
    return this.generate({ plan, progress }, {
      ...options,
      title: options?.title || 'Migration Progress Report',
      sections: options?.sections || ['summary', 'phases', 'tasks'],
    });
  }

  // --------------------------------------------------------------------------
  // MARKDOWN GENERATION
  // --------------------------------------------------------------------------

  private generateMarkdown(data: ReportData, options: ReportOptions, sections: ReportSection[]): string {
    const lines: string[] = [];

    // Title
    lines.push(`# ${options.title || 'Migration Report'}`);
    lines.push('');

    if (options.includeTimestamps) {
      lines.push(`> Generated: ${new Date().toISOString()}`);
      lines.push('');
    }

    // Generate each section
    for (const section of sections) {
      const sectionContent = this.generateMarkdownSection(section, data);
      if (sectionContent) {
        lines.push(sectionContent);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateMarkdownSection(section: ReportSection, data: ReportData): string {
    switch (section) {
      case 'summary':
        return this.generateMarkdownSummary(data);
      case 'analysis':
        return this.generateMarkdownAnalysis(data);
      case 'risks':
        return this.generateMarkdownRisks(data);
      case 'phases':
        return this.generateMarkdownPhases(data);
      case 'tasks':
        return this.generateMarkdownTasks(data);
      case 'estimates':
        return this.generateMarkdownEstimates(data);
      case 'validation':
        return this.generateMarkdownValidation(data);
      case 'recommendations':
        return this.generateMarkdownRecommendations(data);
      default:
        return '';
    }
  }

  private generateMarkdownSummary(data: ReportData): string {
    const lines: string[] = ['## Summary', ''];

    if (data.plan) {
      lines.push(`**Project:** ${data.plan.projectName}`);
      lines.push(`**Generated:** ${data.plan.generatedAt.toISOString()}`);
      lines.push(`**Morpheus Version:** ${data.plan.morpheusVersion}`);
      lines.push('');

      // Current state
      if (data.plan.currentState) {
        lines.push('### Current State');
        lines.push('');
        lines.push(`- **AI Providers:** ${data.plan.currentState.aiProviders.join(', ') || 'None detected'}`);
        lines.push(`- **Prompts:** ${data.plan.currentState.promptCount}`);
        lines.push(`- **Tools:** ${data.plan.currentState.toolCount}`);
        lines.push(`- **Architecture Score:** ${data.plan.currentState.architectureScore}/100`);
        lines.push(`- **Security Score:** ${data.plan.currentState.securityScore}/100`);
        lines.push(`- **Quality Score:** ${data.plan.currentState.qualityScore}/100`);
        lines.push('');

        if (data.plan.currentState.keyFindings.length > 0) {
          lines.push('**Key Findings:**');
          for (const finding of data.plan.currentState.keyFindings) {
            lines.push(`- ${finding}`);
          }
          lines.push('');
        }
      }

      // Target state
      if (data.plan.targetState) {
        lines.push('### Target State');
        lines.push('');
        lines.push(`- **Architecture:** ${data.plan.targetState.architecture}`);
        lines.push(`- **Components:** ${data.plan.targetState.components.join(', ')}`);
        lines.push('');

        if (data.plan.targetState.benefits.length > 0) {
          lines.push('**Benefits:**');
          for (const benefit of data.plan.targetState.benefits) {
            lines.push(`- ${benefit}`);
          }
          lines.push('');
        }
      }
    }

    if (data.progress) {
      lines.push('### Progress');
      lines.push('');
      const percentage = Math.round((data.progress.completedPhases / data.progress.totalPhases) * 100);
      lines.push(`- **Phases:** ${data.progress.completedPhases}/${data.progress.totalPhases} (${percentage}%)`);
      lines.push(`- **Tasks:** ${data.progress.completedTasks}/${data.progress.totalTasks}`);
      if (data.progress.currentPhase) {
        lines.push(`- **Current Phase:** ${data.progress.currentPhase}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateMarkdownAnalysis(data: ReportData): string {
    if (!data.analysis) return '';

    const lines: string[] = ['## Analysis', ''];

    // AI Usage
    lines.push('### AI Usage');
    lines.push('');
    lines.push(`- **Providers:** ${data.analysis.aiUsage.providers.length}`);
    lines.push(`- **Prompts:** ${data.analysis.aiUsage.prompts.length}`);
    lines.push(`- **Tools:** ${data.analysis.aiUsage.tools.length}`);
    lines.push(`- **Patterns:** ${data.analysis.aiUsage.patterns.length}`);
    lines.push(`- **Anti-patterns:** ${data.analysis.aiUsage.antiPatterns.length}`);
    lines.push('');

    // Anti-patterns
    if (data.analysis.aiUsage.antiPatterns.length > 0) {
      lines.push('### Anti-patterns Detected');
      lines.push('');
      lines.push('| Pattern | Severity | Description |');
      lines.push('|---------|----------|-------------|');
      for (const ap of data.analysis.aiUsage.antiPatterns) {
        lines.push(`| ${ap.name} | ${ap.severity} | ${ap.description} |`);
      }
      lines.push('');
    }

    // Architecture
    lines.push('### Architecture');
    lines.push('');
    lines.push(`- **Score:** ${data.analysis.architecture.score}/100`);
    lines.push(`- **Service Layer:** ${data.analysis.architecture.structure.hasServiceLayer ? 'Yes' : 'No'}`);
    lines.push(`- **Separate AI Module:** ${data.analysis.architecture.structure.hasSeparateAIModule ? 'Yes' : 'No'}`);
    lines.push(`- **Type Definitions:** ${data.analysis.architecture.structure.hasTypeDefinitions ? 'Yes' : 'No'}`);
    lines.push(`- **Tests:** ${data.analysis.architecture.structure.hasTests ? 'Yes' : 'No'}`);
    lines.push('');

    // Security
    lines.push('### Security');
    lines.push('');
    lines.push(`- **Score:** ${data.analysis.security.score}/100`);
    lines.push(`- **Findings:** ${data.analysis.security.findings.length}`);
    lines.push('');

    return lines.join('\n');
  }

  private generateMarkdownRisks(data: ReportData): string {
    if (!data.plan?.risks || data.plan.risks.length === 0) return '';

    const lines: string[] = ['## Risks', ''];

    lines.push('| ID | Risk | Probability | Impact | Category |');
    lines.push('|----|------|-------------|--------|----------|');

    for (const risk of data.plan.risks) {
      lines.push(`| ${risk.id} | ${risk.title} | ${risk.probability} | ${risk.impact} | ${risk.category} |`);
    }
    lines.push('');

    // Mitigations
    if (data.plan.mitigations && data.plan.mitigations.length > 0) {
      lines.push('### Mitigations');
      lines.push('');
      for (const mitigation of data.plan.mitigations) {
        const risk = data.plan.risks.find(r => r.id === mitigation.riskId);
        lines.push(`#### ${risk?.title || mitigation.riskId}`);
        lines.push('');
        lines.push(`**Strategy:** ${mitigation.strategy}`);
        lines.push('');
        lines.push('**Actions:**');
        for (const action of mitigation.actions) {
          lines.push(`- ${action}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateMarkdownPhases(data: ReportData): string {
    if (!data.plan?.phases || data.plan.phases.length === 0) return '';

    const lines: string[] = ['## Migration Phases', ''];

    for (const phase of data.plan.phases) {
      const status = data.progress ? this.getPhaseStatus(phase, data.progress) : '';
      lines.push(`### Phase ${phase.order}: ${phase.name} ${status}`);
      lines.push('');
      lines.push(phase.description);
      lines.push('');

      if (phase.goals.length > 0) {
        lines.push('**Goals:**');
        for (const goal of phase.goals) {
          lines.push(`- ${goal}`);
        }
        lines.push('');
      }

      if (phase.dependsOn.length > 0) {
        lines.push(`**Depends on:** ${phase.dependsOn.join(', ')}`);
        lines.push('');
      }

      lines.push(`**Estimated Effort:** ${phase.estimatedEffort.optimistic}-${phase.estimatedEffort.pessimistic} ${phase.estimatedEffort.unit} (realistic: ${phase.estimatedEffort.realistic})`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateMarkdownTasks(data: ReportData): string {
    if (!data.plan?.phases) return '';

    const lines: string[] = ['## Tasks', ''];

    for (const phase of data.plan.phases) {
      lines.push(`### ${phase.name} Tasks`);
      lines.push('');

      if (phase.tasks.length === 0) {
        lines.push('_No tasks defined_');
        lines.push('');
        continue;
      }

      for (const task of phase.tasks) {
        lines.push(`#### ${task.id}: ${task.name}`);
        lines.push('');
        lines.push(task.description);
        lines.push('');
        lines.push(`- **Type:** ${task.type}`);
        lines.push(`- **Automatable:** ${task.automatable ? 'Yes' : 'No'}`);

        if (task.affectedFiles.length > 0) {
          lines.push(`- **Affected Files:** ${task.affectedFiles.slice(0, 5).join(', ')}${task.affectedFiles.length > 5 ? '...' : ''}`);
        }
        lines.push('');

        if (task.steps.length > 0) {
          lines.push('**Steps:**');
          for (const step of task.steps) {
            const cmd = step.command ? ` (\`${step.command}\`)` : '';
            lines.push(`${step.order}. ${step.description}${cmd}`);
          }
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  private generateMarkdownEstimates(data: ReportData): string {
    if (!data.plan?.estimates) return '';

    const lines: string[] = ['## Effort Estimates', ''];
    const est = data.plan.estimates;

    lines.push('### Total Effort');
    lines.push('');
    lines.push(`| Estimate | Hours |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Optimistic | ${est.totalEffort.optimistic} |`);
    lines.push(`| Realistic | ${est.totalEffort.realistic} |`);
    lines.push(`| Pessimistic | ${est.totalEffort.pessimistic} |`);
    lines.push('');

    lines.push(`**Complexity:** ${est.complexity}`);
    lines.push(`**Confidence:** ${Math.round(est.confidence * 100)}%`);
    lines.push('');

    if (est.assumptions.length > 0) {
      lines.push('### Assumptions');
      lines.push('');
      for (const assumption of est.assumptions) {
        lines.push(`- ${assumption}`);
      }
      lines.push('');
    }

    // Phase breakdown
    lines.push('### Phase Breakdown');
    lines.push('');
    lines.push('| Phase | Optimistic | Realistic | Pessimistic |');
    lines.push('|-------|------------|-----------|-------------|');
    for (const [phaseId, effort] of Object.entries(est.phaseEfforts)) {
      lines.push(`| ${phaseId} | ${effort.optimistic}h | ${effort.realistic}h | ${effort.pessimistic}h |`);
    }
    lines.push('');

    return lines.join('\n');
  }

  private generateMarkdownValidation(data: ReportData): string {
    if (!data.validation) return '';

    const lines: string[] = ['## Validation Results', ''];

    lines.push(`**Status:** ${data.validation.valid ? 'PASSED' : 'FAILED'}`);
    lines.push(`**Score:** ${data.validation.score}/100`);
    lines.push('');

    if (data.validation.errors.length > 0) {
      lines.push('### Errors');
      lines.push('');
      for (const error of data.validation.errors) {
        lines.push(`- **${error.code}:** ${error.message}`);
        if (error.location) {
          lines.push(`  - Location: ${error.location}`);
        }
      }
      lines.push('');
    }

    if (data.validation.warnings.length > 0) {
      lines.push('### Warnings');
      lines.push('');
      for (const warning of data.validation.warnings) {
        lines.push(`- **${warning.code}:** ${warning.message}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateMarkdownRecommendations(data: ReportData): string {
    const lines: string[] = ['## Recommendations', ''];

    // From gap analysis
    if (data.plan?.gapAnalysis?.recommendations) {
      for (const rec of data.plan.gapAnalysis.recommendations) {
        lines.push(`### ${rec.priority}. ${rec.title}`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
        lines.push(`- **Effort:** ${rec.effort}`);
        lines.push(`- **Benefit:** ${rec.benefit}`);
        lines.push('');
      }
    }

    // From analysis
    if (data.analysis?.architecture.recommendations) {
      lines.push('### Architecture Recommendations');
      lines.push('');
      for (const rec of data.analysis.architecture.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // HTML GENERATION
  // --------------------------------------------------------------------------

  private generateHtml(data: ReportData, options: ReportOptions, sections: ReportSection[]): string {
    const theme = this.getHtmlTheme(options.theme || 'matrix');
    const markdown = this.generateMarkdown(data, { ...options, format: 'markdown' }, sections);

    // Simple markdown to HTML conversion
    const htmlContent = this.markdownToHtml(markdown);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(options.title || 'Migration Report')}</title>
  <style>
    ${theme}
    body {
      font-family: 'Courier New', monospace;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    h1 { border-bottom: 2px solid var(--accent); padding-bottom: 0.5rem; }
    h2 { border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; margin-top: 2rem; }
    h3 { margin-top: 1.5rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.5rem; text-align: left; }
    th { background: var(--header-bg); }
    code { background: var(--code-bg); padding: 0.2rem 0.4rem; border-radius: 3px; }
    pre { background: var(--code-bg); padding: 1rem; overflow-x: auto; }
    blockquote { border-left: 3px solid var(--accent); margin-left: 0; padding-left: 1rem; opacity: 0.8; }
    ul, ol { padding-left: 1.5rem; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
  }

  private getHtmlTheme(theme: 'light' | 'dark' | 'matrix'): string {
    switch (theme) {
      case 'matrix':
        return `
          :root {
            --bg: #0d0d0d;
            --text: #00ff00;
            --accent: #00ff00;
            --border: #003300;
            --header-bg: #001100;
            --code-bg: #001a00;
          }
          body { background: var(--bg); color: var(--text); }
        `;
      case 'dark':
        return `
          :root {
            --bg: #1a1a2e;
            --text: #eee;
            --accent: #00d4ff;
            --border: #333;
            --header-bg: #252540;
            --code-bg: #2a2a45;
          }
          body { background: var(--bg); color: var(--text); }
        `;
      case 'light':
      default:
        return `
          :root {
            --bg: #fff;
            --text: #333;
            --accent: #0066cc;
            --border: #ddd;
            --header-bg: #f5f5f5;
            --code-bg: #f8f8f8;
          }
          body { background: var(--bg); color: var(--text); }
        `;
    }
  }

  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Escape HTML
    html = this.escapeHtml(html);

    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Tables (simple)
    const tableRegex = /\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match, header, body) => {
      const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('<li>1.')) {
        return `<ol>${match}</ol>`;
      }
      return `<ul>${match}</ul>`;
    });

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');

    return html;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }

  // --------------------------------------------------------------------------
  // JSON GENERATION
  // --------------------------------------------------------------------------

  private generateJson(data: ReportData, options: ReportOptions, sections: ReportSection[]): string {
    const report: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      format: 'json',
      title: options.title || 'Migration Report',
      sections: sections,
    };

    if (options.includeMetadata) {
      report.metadata = this.extractMetadata(data);
    }

    // Include requested sections
    if (sections.includes('summary')) {
      report.summary = this.extractSummary(data);
    }

    if (sections.includes('analysis') && data.analysis) {
      report.analysis = {
        project: data.analysis.project,
        aiUsage: data.analysis.aiUsage,
        architecture: data.analysis.architecture,
        security: data.analysis.security,
        quality: data.analysis.quality,
      };
    }

    if (sections.includes('risks') && data.plan) {
      report.risks = data.plan.risks;
      report.mitigations = data.plan.mitigations;
    }

    if (sections.includes('phases') && data.plan) {
      report.phases = data.plan.phases;
    }

    if (sections.includes('tasks') && data.plan) {
      report.tasks = data.plan.phases.flatMap(p => p.tasks);
    }

    if (sections.includes('estimates') && data.plan) {
      report.estimates = data.plan.estimates;
    }

    if (sections.includes('validation') && data.validation) {
      report.validation = data.validation;
    }

    if (sections.includes('recommendations')) {
      report.recommendations = this.extractRecommendations(data);
    }

    if (data.progress) {
      report.progress = data.progress;
    }

    return JSON.stringify(report, null, 2);
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private extractMetadata(data: ReportData): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (data.plan) {
      metadata.planId = data.plan.id;
      metadata.projectName = data.plan.projectName;
      metadata.morpheusVersion = data.plan.morpheusVersion;
      metadata.generatedAt = data.plan.generatedAt;
    }

    if (data.analysis) {
      metadata.projectPath = data.analysis.project.rootPath;
      metadata.scannedAt = data.analysis.project.scannedAt;
    }

    return metadata;
  }

  private extractSummary(data: ReportData): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    if (data.plan) {
      summary.projectName = data.plan.projectName;
      summary.currentState = data.plan.currentState;
      summary.targetState = data.plan.targetState;
      summary.phaseCount = data.plan.phases.length;
      summary.riskCount = data.plan.risks.length;
      summary.totalEffort = data.plan.estimates.totalEffort;
      summary.complexity = data.plan.estimates.complexity;
    }

    if (data.progress) {
      summary.progress = data.progress;
    }

    return summary;
  }

  private extractRecommendations(data: ReportData): string[] {
    const recommendations: string[] = [];

    if (data.plan?.gapAnalysis?.recommendations) {
      for (const rec of data.plan.gapAnalysis.recommendations) {
        recommendations.push(`${rec.priority}. ${rec.title}: ${rec.description}`);
      }
    }

    if (data.analysis?.architecture.recommendations) {
      recommendations.push(...data.analysis.architecture.recommendations);
    }

    return recommendations;
  }

  private getPhaseStatus(phase: MigrationPhase, progress: ProgressData): string {
    if (progress.completedPhases >= phase.order) {
      return '[COMPLETE]';
    }
    if (progress.currentPhase === phase.id || progress.currentPhase === phase.name) {
      return '[IN PROGRESS]';
    }
    return '[PENDING]';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Reporter instance
 */
export function createReporter(): Reporter {
  return new Reporter();
}
