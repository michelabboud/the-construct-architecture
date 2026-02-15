/**
 * Designer Agent — Generates HTML pages
 *
 * Uses the generate-page contract to produce semantic HTML5 pages.
 * In mock mode, returns realistic placeholder HTML.
 */

import type { Contract, AgentSubmission } from '../../../src/index.js';
import type { Sentinels } from '../../../src/index.js';
import { createWorker, isMockMode } from '../config.js';

export interface PageSpec {
  pageName: string;
  title: string;
  sections: string[];
  stylesheetPath: string;
}

export interface DesignerResult {
  html: string;
  pageName: string;
  submission: AgentSubmission;
}

/**
 * Run the designer agent to generate an HTML page.
 *
 * To use with real AI, pass a Worker configured with a Keymaker
 * and remove usePlaceholder from the Worker config.
 */
export async function runDesigner(
  spec: PageSpec,
  contract: Contract,
  sentinels: Sentinels,
): Promise<DesignerResult> {
  const worker = createWorker(sentinels);

  const task = {
    id: `design-${spec.pageName}-${Date.now()}`,
    type: 'generation',
    description: `Generate an HTML5 page: ${spec.title}`,
    inputs: {
      pageName: spec.pageName,
      title: spec.title,
      sections: spec.sections,
      stylesheetPath: spec.stylesheetPath,
    },
    expectedOutput: 'A complete HTML5 page with semantic markup',
    systemPrompt: [
      'You are a web designer specializing in semantic HTML5.',
      'Generate a complete, valid HTML5 page with:',
      '- Proper doctype, head, and body',
      '- Semantic elements: header, nav, main, section, footer',
      '- ARIA attributes for accessibility',
      '- Link to the provided stylesheet',
      `Sections to include: ${spec.sections.join(', ')}`,
    ].join('\n'),
  };

  const startTime = Date.now();
  const result = await worker.execute(task, contract);
  const duration = Date.now() - startTime;

  // In mock mode, use the realistic placeholder; in real mode, use AI output
  const html = !isMockMode() && typeof result.output === 'string'
    ? result.output
    : generateMockHtml(spec);

  return {
    html,
    pageName: spec.pageName,
    submission: {
      agentId: 'agent-designer',
      contractId: contract.contract.id,
      output: html,
      duration,
      cost: result.cost,
      retries: 0,
      toolsUsed: ['html_generator'],
    },
  };
}

function generateMockHtml(spec: PageSpec): string {
  const sectionsHtml = spec.sections
    .map(s => `    <section id="${s.toLowerCase().replace(/\s+/g, '-')}">\n      <h2>${s}</h2>\n      <p>Content for the ${s} section.</p>\n    </section>`)
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${spec.title}</title>
  <link rel="stylesheet" href="${spec.stylesheetPath}">
</head>
<body>
  <header role="banner">
    <nav aria-label="Main navigation">
      <ul>
        ${spec.sections.map(s => `<li><a href="#${s.toLowerCase().replace(/\s+/g, '-')}">${s}</a></li>`).join('\n        ')}
      </ul>
    </nav>
  </header>

  <main role="main">
    <h1>${spec.title}</h1>

${sectionsHtml}
  </main>

  <footer role="contentinfo">
    <p>Built with The Construct</p>
  </footer>
</body>
</html>`;
}
