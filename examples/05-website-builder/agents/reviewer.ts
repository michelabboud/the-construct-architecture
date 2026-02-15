/**
 * Reviewer Agent — Reviews generated code
 *
 * Uses the review-code contract to check quality, security, and best practices.
 * In mock mode, produces a realistic review report.
 */

import type { Contract, AgentSubmission } from '../../../src/index.js';
import type { Sentinels } from '../../../src/index.js';
import { createWorker } from '../config.js';

export interface ReviewInput {
  files: { name: string; content: string }[];
}

export interface ReviewIssue {
  file: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export interface ReviewerResult {
  passed: boolean;
  score: number;
  issues: ReviewIssue[];
  summary: string;
  submission: AgentSubmission;
}

/**
 * Run the reviewer agent to review generated code.
 */
export async function runReviewer(
  input: ReviewInput,
  contract: Contract,
  sentinels: Sentinels,
): Promise<ReviewerResult> {
  const worker = createWorker(sentinels);

  const task = {
    id: `review-${Date.now()}`,
    type: 'review',
    description: `Review ${input.files.length} generated files`,
    inputs: {
      files: input.files.map(f => f.name),
      fileContents: input.files,
    },
    expectedOutput: 'A structured review report with issues and score',
    systemPrompt: [
      'You are a senior code reviewer specializing in web technologies.',
      'Review the provided files for:',
      '1. HTML validity and semantic correctness',
      '2. CSS best practices (no !important, proper custom properties)',
      '3. Accessibility (ARIA attributes, semantic elements)',
      '4. Security (no inline scripts, no eval, no document.write)',
      'Categorize each issue by severity: error, warning, info.',
      'Provide a fix suggestion for each issue.',
    ].join('\n'),
  };

  const startTime = Date.now();
  const result = await worker.execute(task, contract);
  const duration = Date.now() - startTime;

  // In real mode, try to parse AI's structured response; fall back to deterministic checks
  const review = parseReviewOutput(result.output) ?? generateMockReview(input);

  return {
    ...review,
    submission: {
      agentId: 'agent-reviewer',
      contractId: contract.contract.id,
      output: review,
      duration,
      cost: result.cost,
      retries: 0,
      toolsUsed: ['code_review'],
    },
  };
}

/** Try to parse structured JSON from an AI response. Returns null if unparseable. */
function parseReviewOutput(output: unknown): Omit<ReviewerResult, 'submission'> | null {
  if (typeof output !== 'string') return null;
  try {
    const parsed = JSON.parse(output);
    if (typeof parsed.passed === 'boolean' && typeof parsed.score === 'number' && Array.isArray(parsed.issues)) {
      return {
        passed: parsed.passed,
        score: parsed.score,
        issues: parsed.issues,
        summary: parsed.summary ?? '',
      };
    }
  } catch { /* not JSON, fall through */ }
  return null;
}

function generateMockReview(input: ReviewInput): Omit<ReviewerResult, 'submission'> {
  const issues: ReviewIssue[] = [];

  for (const file of input.files) {
    // Check for common issues
    if (file.content.includes('!important')) {
      issues.push({
        file: file.name,
        severity: 'warning',
        message: 'Found !important declaration',
        suggestion: 'Use more specific selectors instead of !important',
      });
    }

    if (file.name.endsWith('.html') && !file.content.includes('lang=')) {
      issues.push({
        file: file.name,
        severity: 'warning',
        message: 'Missing lang attribute on <html> element',
        suggestion: 'Add lang="en" (or appropriate language) to the <html> tag',
      });
    }

    if (file.name.endsWith('.html') && !file.content.includes('meta name="viewport"')) {
      issues.push({
        file: file.name,
        severity: 'info',
        message: 'Consider adding viewport meta tag for mobile responsiveness',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const score = Math.max(5, 10 - errorCount * 2 - issues.length * 0.5);
  const passed = errorCount === 0 && score >= 7;

  return {
    passed,
    score: Math.round(score * 10) / 10,
    issues,
    summary: passed
      ? `Review passed with ${issues.length} minor issue(s). Code quality is good.`
      : `Review found ${errorCount} error(s) and ${issues.length - errorCount} warning(s). Revisions needed.`,
  };
}
