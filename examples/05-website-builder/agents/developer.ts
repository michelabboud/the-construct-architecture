/**
 * Developer Agent — Builds UI components
 *
 * Uses the generate-component contract to produce reusable HTML components.
 * In mock mode, returns realistic placeholder components.
 */

import type { Contract, AgentSubmission } from '../../../src/index.js';
import type { Sentinels } from '../../../src/index.js';
import { createWorker, isMockMode } from '../config.js';

export interface ComponentSpec {
  componentName: string;
  description: string;
  props: Record<string, string>;
}

export interface DeveloperResult {
  html: string;
  componentName: string;
  submission: AgentSubmission;
}

/**
 * Run the developer agent to generate a UI component.
 */
export async function runDeveloper(
  spec: ComponentSpec,
  contract: Contract,
  sentinels: Sentinels,
): Promise<DeveloperResult> {
  const worker = createWorker(sentinels);

  const propsDescription = Object.entries(spec.props)
    .map(([name, type]) => `${name}: ${type}`)
    .join(', ');

  const task = {
    id: `component-${spec.componentName}-${Date.now()}`,
    type: 'code_generation',
    description: `Generate UI component: ${spec.componentName}`,
    inputs: {
      componentName: spec.componentName,
      description: spec.description,
      props: spec.props,
    },
    expectedOutput: 'An HTML component snippet using BEM naming',
    systemPrompt: [
      'You are a frontend developer specializing in reusable UI components.',
      'Generate a self-contained HTML component with:',
      '- BEM naming convention for CSS classes',
      '- ARIA attributes for accessibility',
      '- A usage comment at the top',
      `Component: ${spec.componentName}`,
      `Description: ${spec.description}`,
      `Props: ${propsDescription}`,
    ].join('\n'),
  };

  const startTime = Date.now();
  const result = await worker.execute(task, contract);
  const duration = Date.now() - startTime;

  const html = !isMockMode() && typeof result.output === 'string'
    ? result.output
    : generateMockComponent(spec);

  return {
    html,
    componentName: spec.componentName,
    submission: {
      agentId: 'agent-developer',
      contractId: contract.contract.id,
      output: html,
      duration,
      cost: result.cost,
      retries: 0,
      toolsUsed: ['component_generator'],
    },
  };
}

function generateMockComponent(spec: ComponentSpec): string {
  const blockName = spec.componentName.toLowerCase().replace(/\s+/g, '-');

  return `<!-- Component: ${spec.componentName} -->
<!-- Usage: Include this snippet where the ${spec.componentName} should appear -->
<!-- Props: ${Object.entries(spec.props).map(([k, v]) => `${k} (${v})`).join(', ')} -->

<div class="${blockName}" role="region" aria-label="${spec.componentName}">
  <div class="${blockName}__header">
    <h3 class="${blockName}__title">${spec.componentName}</h3>
  </div>
  <div class="${blockName}__body">
    <p class="${blockName}__description">${spec.description}</p>
  </div>
  <div class="${blockName}__footer">
    <button class="${blockName}__action" type="button" aria-label="Primary action">
      Get Started
    </button>
  </div>
</div>`;
}
