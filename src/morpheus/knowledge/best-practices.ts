/**
 * Morpheus Knowledge Base - Best Practices
 *
 * "Free your mind." — Morpheus
 *
 * Best practices for AI development and migration.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Best practice category
 */
export type BestPracticeCategory =
  | 'architecture'
  | 'security'
  | 'reliability'
  | 'performance'
  | 'testing'
  | 'operations'
  | 'migration';

/**
 * Implementation priority
 */
export type Priority = 'must-have' | 'should-have' | 'nice-to-have';

/**
 * A best practice entry
 */
export interface BestPractice {
  id: string;
  title: string;
  category: BestPracticeCategory;
  priority: Priority;
  description: string;
  rationale: string;
  guidelines: string[];
  checklist: ChecklistItem[];
  resources: Resource[];
  constructComponent?: string;
}

/**
 * Checklist item for implementing the practice
 */
export interface ChecklistItem {
  item: string;
  required: boolean;
}

/**
 * External resource reference
 */
export interface Resource {
  title: string;
  type: 'documentation' | 'article' | 'video' | 'tool';
  url?: string;
  description: string;
}

// ============================================================================
// ARCHITECTURE BEST PRACTICES
// ============================================================================

const ARCHITECTURE_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'separate-ai-layer',
    title: 'Separate AI into Dedicated Layer',
    category: 'architecture',
    priority: 'must-have',
    description: 'Create a dedicated layer for all AI interactions, separate from business logic.',
    rationale: 'Separation makes AI code easier to test, modify, and monitor. It enables consistent patterns across the codebase and simplifies provider switching.',
    guidelines: [
      'Create a dedicated /ai or /services/ai directory',
      'Define clear interfaces for AI operations',
      'Keep business logic free of direct AI SDK imports',
      'Use dependency injection for AI services',
      'Centralize prompt management in the AI layer',
    ],
    checklist: [
      { item: 'AI layer directory created', required: true },
      { item: 'Common interface defined', required: true },
      { item: 'No direct SDK imports outside AI layer', required: true },
      { item: 'Dependency injection configured', required: false },
    ],
    resources: [
      {
        title: 'Clean Architecture for AI Applications',
        type: 'article',
        description: 'Guide to structuring AI applications with clean architecture principles',
      },
    ],
    constructComponent: 'Programs',
  },
  {
    id: 'abstract-provider',
    title: 'Abstract AI Provider Behind Interface',
    category: 'architecture',
    priority: 'should-have',
    description: 'Define a common interface that all AI providers implement.',
    rationale: 'Abstraction enables provider switching, A/B testing between providers, and fallback mechanisms. It also makes testing easier with mock implementations.',
    guidelines: [
      'Define a minimal common interface for your use cases',
      'Create adapter classes for each provider',
      'Handle provider-specific features gracefully',
      'Consider using LiteLLM or similar for multi-provider support',
      'Document provider-specific capabilities',
    ],
    checklist: [
      { item: 'Common interface defined', required: true },
      { item: 'Primary provider adapter implemented', required: true },
      { item: 'At least one fallback provider configured', required: false },
      { item: 'Provider capabilities documented', required: false },
    ],
    resources: [
      {
        title: 'LiteLLM',
        type: 'tool',
        url: 'https://github.com/BerriAI/litellm',
        description: 'Call 100+ LLMs using the OpenAI format',
      },
    ],
    constructComponent: 'Keymaker',
  },
  {
    id: 'externalize-prompts',
    title: 'Externalize Prompts from Code',
    category: 'architecture',
    priority: 'should-have',
    description: 'Store prompts in separate files rather than inline in code.',
    rationale: 'External prompts are easier to version, test, and modify without code changes. They can be managed by non-developers and support A/B testing.',
    guidelines: [
      'Use YAML or Markdown files for prompt storage',
      'Support template variables for dynamic content',
      'Version control prompts alongside code',
      'Consider a prompt management system for production',
      'Include metadata like version, author, and purpose',
    ],
    checklist: [
      { item: 'Prompts directory created', required: true },
      { item: 'Prompt loading mechanism implemented', required: true },
      { item: 'Template variable support added', required: true },
      { item: 'Prompt versioning in place', required: false },
    ],
    resources: [
      {
        title: 'Prompt Engineering Guide',
        type: 'documentation',
        description: 'Comprehensive guide to prompt engineering best practices',
      },
    ],
    constructComponent: 'Architect',
  },
  {
    id: 'define-contracts',
    title: 'Define Contracts for AI Operations',
    category: 'architecture',
    priority: 'should-have',
    description: 'Create explicit contracts defining inputs, outputs, and constraints for each AI operation.',
    rationale: 'Contracts make AI behavior explicit and testable. They enable validation, monitoring, and documentation of AI capabilities.',
    guidelines: [
      'Define input schema with Zod or JSON Schema',
      'Define expected output schema',
      'Specify constraints (max tokens, timeout, etc.)',
      'Document the intended use case',
      'Include example inputs and outputs',
    ],
    checklist: [
      { item: 'Contract schema defined', required: true },
      { item: 'Input validation implemented', required: true },
      { item: 'Output validation implemented', required: true },
      { item: 'Contracts documented', required: false },
    ],
    resources: [
      {
        title: 'The Construct Contract Schema',
        type: 'documentation',
        description: 'Contract schema specification for AI operations',
      },
    ],
    constructComponent: 'Architect',
  },
];

// ============================================================================
// SECURITY BEST PRACTICES
// ============================================================================

const SECURITY_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'secure-credentials',
    title: 'Secure API Credentials',
    category: 'security',
    priority: 'must-have',
    description: 'Store API keys securely using environment variables or secret managers.',
    rationale: 'Hardcoded credentials can be leaked through version control, logs, or error messages. Secure storage protects against unauthorized API access.',
    guidelines: [
      'Use environment variables for local development',
      'Use secret managers (AWS Secrets Manager, Vault) for production',
      'Never commit .env files to version control',
      'Rotate credentials regularly',
      'Use different credentials per environment',
      'Monitor for credential exposure',
    ],
    checklist: [
      { item: '.env added to .gitignore', required: true },
      { item: 'Environment variables used for credentials', required: true },
      { item: 'No hardcoded credentials in code', required: true },
      { item: 'Secret manager configured for production', required: false },
      { item: 'Credential rotation schedule defined', required: false },
    ],
    resources: [
      {
        title: 'OWASP Secrets Management Cheat Sheet',
        type: 'documentation',
        description: 'Best practices for managing secrets in applications',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'sanitize-inputs',
    title: 'Sanitize User Inputs',
    category: 'security',
    priority: 'must-have',
    description: 'Sanitize all user inputs before including them in prompts.',
    rationale: 'Unsanitized inputs can lead to prompt injection attacks where users override system instructions or extract sensitive information.',
    guidelines: [
      'Remove or escape potential instruction patterns',
      'Use clear delimiters between instructions and user content',
      'Limit input length to prevent context overflow',
      'Validate input against expected format',
      'Log suspicious inputs for review',
    ],
    checklist: [
      { item: 'Input sanitization function created', required: true },
      { item: 'Delimiters used in prompts', required: true },
      { item: 'Input length limits enforced', required: true },
      { item: 'Suspicious input logging enabled', required: false },
    ],
    resources: [
      {
        title: 'Prompt Injection Prevention',
        type: 'article',
        description: 'Techniques to prevent prompt injection attacks',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'validate-outputs',
    title: 'Validate AI Outputs',
    category: 'security',
    priority: 'must-have',
    description: 'Validate all AI outputs before using them in your application.',
    rationale: 'AI outputs may contain harmful content, invalid data, or unexpected formats. Validation ensures safety and reliability.',
    guidelines: [
      'Define expected output schemas',
      'Validate against schema before use',
      'Check for forbidden content patterns',
      'Sanitize before displaying in UI',
      'Handle validation failures gracefully',
    ],
    checklist: [
      { item: 'Output schemas defined', required: true },
      { item: 'Schema validation implemented', required: true },
      { item: 'Content policy checks added', required: true },
      { item: 'UI sanitization in place', required: false },
    ],
    resources: [
      {
        title: 'Zod Schema Validation',
        type: 'tool',
        url: 'https://github.com/colinhacks/zod',
        description: 'TypeScript-first schema validation library',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'tool-permissions',
    title: 'Implement Tool Permissions',
    category: 'security',
    priority: 'should-have',
    description: 'Control which tools AI can access based on context and permissions.',
    rationale: 'Unrestricted tool access increases risk. Permission systems limit potential damage from misuse or attacks.',
    guidelines: [
      'Define permission levels for tools',
      'Filter available tools based on user/context',
      'Validate tool arguments before execution',
      'Log all tool executions for audit',
      'Implement rate limiting per tool',
    ],
    checklist: [
      { item: 'Tool permission system designed', required: true },
      { item: 'Context-based tool filtering implemented', required: true },
      { item: 'Tool argument validation in place', required: true },
      { item: 'Tool execution logging enabled', required: false },
    ],
    resources: [
      {
        title: 'Principle of Least Privilege',
        type: 'documentation',
        description: 'Security principle for access control',
      },
    ],
    constructComponent: 'Sentinels',
  },
];

// ============================================================================
// RELIABILITY BEST PRACTICES
// ============================================================================

const RELIABILITY_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'error-handling',
    title: 'Implement Comprehensive Error Handling',
    category: 'reliability',
    priority: 'must-have',
    description: 'Handle all AI API errors gracefully with appropriate recovery strategies.',
    rationale: 'AI APIs can fail for various reasons. Proper error handling ensures application stability and good user experience.',
    guidelines: [
      'Wrap all AI calls in try-catch blocks',
      'Categorize errors (retryable vs non-retryable)',
      'Implement retry logic with exponential backoff',
      'Provide meaningful error messages to users',
      'Log errors with sufficient context for debugging',
    ],
    checklist: [
      { item: 'All AI calls wrapped in try-catch', required: true },
      { item: 'Error categorization implemented', required: true },
      { item: 'Retry logic with backoff added', required: true },
      { item: 'User-friendly error messages defined', required: true },
      { item: 'Error logging configured', required: true },
    ],
    resources: [
      {
        title: 'Handling API Errors',
        type: 'documentation',
        description: 'Best practices for handling API errors in production',
      },
    ],
    constructComponent: 'Programs',
  },
  {
    id: 'timeout-configuration',
    title: 'Configure Appropriate Timeouts',
    category: 'reliability',
    priority: 'must-have',
    description: 'Set timeouts for all AI API calls to prevent hanging requests.',
    rationale: 'Without timeouts, failed requests can hang indefinitely, exhausting resources and degrading user experience.',
    guidelines: [
      'Set reasonable timeout values (15-60 seconds typical)',
      'Use shorter timeouts for interactive operations',
      'Implement AbortController for cancellation',
      'Handle timeout errors specifically',
      'Consider streaming for long operations',
    ],
    checklist: [
      { item: 'Default timeout configured', required: true },
      { item: 'Timeout values appropriate for use case', required: true },
      { item: 'Timeout error handling implemented', required: true },
      { item: 'Request cancellation supported', required: false },
    ],
    resources: [
      {
        title: 'AbortController API',
        type: 'documentation',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
        description: 'Web API for aborting fetch requests',
      },
    ],
    constructComponent: 'Keymaker',
  },
  {
    id: 'fallback-strategy',
    title: 'Implement Fallback Strategies',
    category: 'reliability',
    priority: 'should-have',
    description: 'Define fallback behavior when primary AI service fails.',
    rationale: 'Fallbacks ensure some level of service even during outages. Users get partial functionality instead of complete failure.',
    guidelines: [
      'Configure at least one fallback provider',
      'Consider cached responses as fallback',
      'Define graceful degradation behavior',
      'Notify users when using degraded mode',
      'Monitor fallback usage for alerting',
    ],
    checklist: [
      { item: 'Fallback provider configured', required: false },
      { item: 'Response caching implemented', required: false },
      { item: 'Graceful degradation defined', required: true },
      { item: 'Degraded mode indication for users', required: false },
    ],
    resources: [
      {
        title: 'Circuit Breaker Pattern',
        type: 'article',
        description: 'Pattern for handling failures in distributed systems',
      },
    ],
    constructComponent: 'Keymaker',
  },
  {
    id: 'rate-limit-handling',
    title: 'Handle Rate Limits Gracefully',
    category: 'reliability',
    priority: 'should-have',
    description: 'Properly handle rate limit errors and implement request throttling.',
    rationale: 'Rate limits protect providers and ensure fair usage. Proper handling prevents cascade failures and maintains service quality.',
    guidelines: [
      'Detect rate limit errors (429 status)',
      'Respect Retry-After headers',
      'Implement token bucket or leaky bucket rate limiting',
      'Queue requests when approaching limits',
      'Monitor usage against limits',
    ],
    checklist: [
      { item: 'Rate limit error detection implemented', required: true },
      { item: 'Retry-After header respected', required: true },
      { item: 'Client-side rate limiting added', required: false },
      { item: 'Usage monitoring in place', required: false },
    ],
    resources: [
      {
        title: 'Rate Limiting Best Practices',
        type: 'article',
        description: 'Strategies for handling API rate limits',
      },
    ],
    constructComponent: 'Keymaker',
  },
];

// ============================================================================
// PERFORMANCE BEST PRACTICES
// ============================================================================

const PERFORMANCE_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'response-caching',
    title: 'Cache AI Responses',
    category: 'performance',
    priority: 'should-have',
    description: 'Cache responses for deterministic or frequently repeated prompts.',
    rationale: 'Caching reduces API costs, improves response times, and provides consistent results for repeated requests.',
    guidelines: [
      'Cache responses for temperature=0 requests',
      'Use semantic similarity for cache lookups',
      'Set appropriate TTL for cached responses',
      'Consider embedding-based similarity cache',
      'Clear cache on prompt updates',
    ],
    checklist: [
      { item: 'Caching mechanism implemented', required: true },
      { item: 'Cache key strategy defined', required: true },
      { item: 'TTL configuration in place', required: true },
      { item: 'Cache invalidation strategy defined', required: true },
    ],
    resources: [
      {
        title: 'Semantic Caching for LLMs',
        type: 'article',
        description: 'Techniques for intelligent LLM response caching',
      },
    ],
    constructComponent: 'Keymaker',
  },
  {
    id: 'context-optimization',
    title: 'Optimize Context Size',
    category: 'performance',
    priority: 'should-have',
    description: 'Minimize prompt size while maintaining quality.',
    rationale: 'Smaller prompts are faster and cheaper. Optimized context improves model focus and response quality.',
    guidelines: [
      'Use RAG for large documents instead of full inclusion',
      'Summarize long conversation histories',
      'Extract only relevant sections for context',
      'Count tokens before sending requests',
      'Use efficient prompt formats',
    ],
    checklist: [
      { item: 'Token counting implemented', required: true },
      { item: 'Context pruning strategy defined', required: true },
      { item: 'RAG system for large documents', required: false },
      { item: 'Conversation summarization for long chats', required: false },
    ],
    resources: [
      {
        title: 'RAG Architecture',
        type: 'documentation',
        description: 'Retrieval-Augmented Generation patterns',
      },
    ],
    constructComponent: 'Programs',
  },
  {
    id: 'streaming-responses',
    title: 'Use Streaming for Long Responses',
    category: 'performance',
    priority: 'nice-to-have',
    description: 'Stream AI responses for better perceived performance.',
    rationale: 'Streaming provides immediate feedback to users and improves perceived performance, especially for long responses.',
    guidelines: [
      'Enable streaming for user-facing responses',
      'Handle stream errors gracefully',
      'Buffer tokens for batch processing if needed',
      'Support stream cancellation',
      'Show typing indicators during streaming',
    ],
    checklist: [
      { item: 'Streaming enabled for UI responses', required: false },
      { item: 'Stream error handling implemented', required: false },
      { item: 'Stream cancellation supported', required: false },
      { item: 'UI feedback during streaming', required: false },
    ],
    resources: [
      {
        title: 'Server-Sent Events',
        type: 'documentation',
        description: 'Protocol for streaming server responses',
      },
    ],
    constructComponent: 'Programs',
  },
  {
    id: 'model-selection',
    title: 'Select Appropriate Models',
    category: 'performance',
    priority: 'should-have',
    description: 'Use the right model for each task based on complexity and requirements.',
    rationale: 'Different models have different strengths and costs. Matching model to task optimizes both performance and cost.',
    guidelines: [
      'Use smaller models for simple tasks',
      'Reserve large models for complex reasoning',
      'Consider fine-tuned models for specific domains',
      'Benchmark models for your specific use cases',
      'Monitor model performance over time',
    ],
    checklist: [
      { item: 'Model selection criteria defined', required: true },
      { item: 'Models benchmarked for use cases', required: false },
      { item: 'Model routing logic implemented', required: false },
      { item: 'Performance monitoring in place', required: false },
    ],
    resources: [
      {
        title: 'LLM Benchmarks',
        type: 'documentation',
        description: 'Comparison of LLM capabilities and performance',
      },
    ],
    constructComponent: 'Keymaker',
  },
];

// ============================================================================
// TESTING BEST PRACTICES
// ============================================================================

const TESTING_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'mock-ai-calls',
    title: 'Mock AI Calls in Unit Tests',
    category: 'testing',
    priority: 'must-have',
    description: 'Use mocks instead of real AI calls in unit and integration tests.',
    rationale: 'Mocking makes tests fast, deterministic, and independent of external services. It also reduces API costs during development.',
    guidelines: [
      'Create mock implementations of AI interfaces',
      'Use recorded responses for realistic mocking',
      'Test error scenarios with mock failures',
      'Verify prompts are constructed correctly',
      'Reserve real API calls for E2E tests only',
    ],
    checklist: [
      { item: 'Mock AI client created', required: true },
      { item: 'All unit tests use mocks', required: true },
      { item: 'Error scenario tests included', required: true },
      { item: 'Prompt construction tests added', required: true },
    ],
    resources: [
      {
        title: 'Jest Mocking',
        type: 'documentation',
        url: 'https://jestjs.io/docs/mock-functions',
        description: 'Jest documentation on mocking functions',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'test-prompts',
    title: 'Test Prompts with Evaluation Suites',
    category: 'testing',
    priority: 'should-have',
    description: 'Create automated tests to evaluate prompt effectiveness.',
    rationale: 'Prompt testing catches regressions and enables confident iteration. Evaluation metrics provide objective measures of quality.',
    guidelines: [
      'Define test cases with expected outputs',
      'Use evaluation frameworks for scoring',
      'Track prompt performance over time',
      'Test edge cases and adversarial inputs',
      'Compare prompt versions quantitatively',
    ],
    checklist: [
      { item: 'Test cases defined for prompts', required: true },
      { item: 'Evaluation metrics selected', required: true },
      { item: 'Automated prompt tests running', required: false },
      { item: 'Performance tracking dashboard', required: false },
    ],
    resources: [
      {
        title: 'LLM Evaluation Frameworks',
        type: 'tool',
        description: 'Tools for evaluating LLM outputs systematically',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'integration-tests',
    title: 'Write Integration Tests for AI Workflows',
    category: 'testing',
    priority: 'should-have',
    description: 'Test complete AI workflows including multi-step operations.',
    rationale: 'Integration tests catch issues in the interaction between components. They verify the system works end-to-end.',
    guidelines: [
      'Test complete user scenarios',
      'Include multi-turn conversations',
      'Test tool calling workflows',
      'Verify error recovery across steps',
      'Test with realistic data volumes',
    ],
    checklist: [
      { item: 'Key workflows identified', required: true },
      { item: 'Integration tests written', required: true },
      { item: 'Multi-step scenarios covered', required: false },
      { item: 'Error recovery tested', required: false },
    ],
    resources: [
      {
        title: 'Integration Testing Patterns',
        type: 'article',
        description: 'Patterns for effective integration testing',
      },
    ],
    constructComponent: 'Sentinels',
  },
];

// ============================================================================
// OPERATIONS BEST PRACTICES
// ============================================================================

const OPERATIONS_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'cost-monitoring',
    title: 'Monitor AI Costs',
    category: 'operations',
    priority: 'must-have',
    description: 'Track token usage and costs for all AI operations.',
    rationale: 'Cost monitoring prevents budget overruns and helps identify optimization opportunities.',
    guidelines: [
      'Log token usage for every request',
      'Calculate costs using provider pricing',
      'Set up cost alerts and budgets',
      'Track costs by feature and user',
      'Review costs weekly',
    ],
    checklist: [
      { item: 'Token usage logging implemented', required: true },
      { item: 'Cost calculation in place', required: true },
      { item: 'Cost alerts configured', required: true },
      { item: 'Cost attribution by feature', required: false },
      { item: 'Regular cost review process', required: false },
    ],
    resources: [
      {
        title: 'OpenAI Usage Dashboard',
        type: 'tool',
        url: 'https://platform.openai.com/usage',
        description: 'OpenAI usage and cost tracking',
      },
    ],
    constructComponent: 'Oracle',
  },
  {
    id: 'observability',
    title: 'Implement AI Observability',
    category: 'operations',
    priority: 'should-have',
    description: 'Monitor AI system health, performance, and quality.',
    rationale: 'Observability enables quick issue detection and resolution. It provides insights for continuous improvement.',
    guidelines: [
      'Log all AI requests and responses',
      'Track latency and error rates',
      'Monitor output quality metrics',
      'Set up alerting for anomalies',
      'Create dashboards for key metrics',
    ],
    checklist: [
      { item: 'Request/response logging enabled', required: true },
      { item: 'Latency monitoring in place', required: true },
      { item: 'Error rate tracking configured', required: true },
      { item: 'Quality metrics defined', required: false },
      { item: 'Alerting rules configured', required: false },
    ],
    resources: [
      {
        title: 'LLM Observability',
        type: 'article',
        description: 'Best practices for monitoring LLM applications',
      },
    ],
    constructComponent: 'Oracle',
  },
  {
    id: 'prompt-versioning',
    title: 'Version Control Prompts',
    category: 'operations',
    priority: 'should-have',
    description: 'Track prompt versions and enable rollback.',
    rationale: 'Versioning enables safe prompt iteration and quick rollback when issues arise.',
    guidelines: [
      'Store prompts in version control',
      'Tag prompt versions in production',
      'Track which version produced each response',
      'Enable quick rollback to previous versions',
      'Document prompt changes',
    ],
    checklist: [
      { item: 'Prompts in version control', required: true },
      { item: 'Version tagging implemented', required: true },
      { item: 'Version tracking in logs', required: false },
      { item: 'Rollback capability tested', required: false },
    ],
    resources: [
      {
        title: 'Prompt Version Control',
        type: 'article',
        description: 'Strategies for managing prompt versions',
      },
    ],
    constructComponent: 'Architect',
  },
];

// ============================================================================
// MIGRATION BEST PRACTICES
// ============================================================================

const MIGRATION_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'incremental-migration',
    title: 'Migrate Incrementally',
    category: 'migration',
    priority: 'must-have',
    description: 'Migrate AI code in small, testable increments rather than all at once.',
    rationale: 'Incremental migration reduces risk, enables validation at each step, and maintains system stability throughout.',
    guidelines: [
      'Start with low-risk, isolated components',
      'Migrate one AI operation at a time',
      'Validate each migration before proceeding',
      'Maintain rollback capability',
      'Run old and new systems in parallel initially',
    ],
    checklist: [
      { item: 'Migration phases defined', required: true },
      { item: 'Validation criteria for each phase', required: true },
      { item: 'Rollback plan documented', required: true },
      { item: 'Parallel running capability', required: false },
    ],
    resources: [
      {
        title: 'Strangler Fig Pattern',
        type: 'article',
        description: 'Pattern for incremental legacy system replacement',
      },
    ],
    constructComponent: 'Agents',
  },
  {
    id: 'behavior-preservation',
    title: 'Preserve Existing Behavior',
    category: 'migration',
    priority: 'must-have',
    description: 'Ensure migrated code produces equivalent results to the original.',
    rationale: 'Behavior preservation ensures users see no degradation. It validates that migration is correct.',
    guidelines: [
      'Document current behavior before migration',
      'Create test cases from existing behavior',
      'Compare outputs between old and new systems',
      'Handle edge cases explicitly',
      'Monitor for behavioral drift',
    ],
    checklist: [
      { item: 'Current behavior documented', required: true },
      { item: 'Behavior tests created', required: true },
      { item: 'Output comparison mechanism', required: true },
      { item: 'Edge cases identified and tested', required: false },
    ],
    resources: [
      {
        title: 'Characterization Testing',
        type: 'article',
        description: 'Testing technique for preserving legacy behavior',
      },
    ],
    constructComponent: 'Sentinels',
  },
  {
    id: 'feature-flags',
    title: 'Use Feature Flags for Migration',
    category: 'migration',
    priority: 'should-have',
    description: 'Control migration rollout with feature flags.',
    rationale: 'Feature flags enable gradual rollout, quick rollback, and A/B testing between old and new systems.',
    guidelines: [
      'Wrap migrated code in feature flags',
      'Roll out to small percentage initially',
      'Monitor metrics during rollout',
      'Enable quick disable without deployment',
      'Remove flags after successful migration',
    ],
    checklist: [
      { item: 'Feature flag system in place', required: true },
      { item: 'Migration flags defined', required: true },
      { item: 'Rollout plan documented', required: true },
      { item: 'Monitoring during rollout', required: false },
    ],
    resources: [
      {
        title: 'Feature Flags Best Practices',
        type: 'article',
        description: 'Strategies for effective feature flag usage',
      },
    ],
    constructComponent: 'Agents',
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All best practices
 */
export const BEST_PRACTICES: BestPractice[] = [
  ...ARCHITECTURE_BEST_PRACTICES,
  ...SECURITY_BEST_PRACTICES,
  ...RELIABILITY_BEST_PRACTICES,
  ...PERFORMANCE_BEST_PRACTICES,
  ...TESTING_BEST_PRACTICES,
  ...OPERATIONS_BEST_PRACTICES,
  ...MIGRATION_BEST_PRACTICES,
];

/**
 * Get best practices by category
 */
export function getBestPracticesByCategory(category: BestPracticeCategory): BestPractice[] {
  return BEST_PRACTICES.filter(bp => bp.category === category);
}

/**
 * Get best practices by priority
 */
export function getBestPracticesByPriority(priority: Priority): BestPractice[] {
  return BEST_PRACTICES.filter(bp => bp.priority === priority);
}

/**
 * Get best practice by ID
 */
export function getBestPracticeById(id: string): BestPractice | undefined {
  return BEST_PRACTICES.find(bp => bp.id === id);
}

/**
 * Get best practices for a Construct component
 */
export function getBestPracticesForComponent(component: string): BestPractice[] {
  return BEST_PRACTICES.filter(bp => bp.constructComponent === component);
}

/**
 * Get migration checklist
 */
export function getMigrationChecklist(): Array<{ practice: BestPractice; items: ChecklistItem[] }> {
  const migrationPractices = getBestPracticesByCategory('migration');
  return migrationPractices.map(bp => ({
    practice: bp,
    items: bp.checklist,
  }));
}

/**
 * Search best practices
 */
export function searchBestPractices(query: string): BestPractice[] {
  const lowerQuery = query.toLowerCase();
  return BEST_PRACTICES.filter(
    bp =>
      bp.title.toLowerCase().includes(lowerQuery) ||
      bp.description.toLowerCase().includes(lowerQuery) ||
      bp.guidelines.some(g => g.toLowerCase().includes(lowerQuery))
  );
}
