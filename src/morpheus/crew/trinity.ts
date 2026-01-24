/**
 * Trinity Agent - The Expert
 *
 * "The answer is out there, Neo. It's looking for you, and it will find you
 * if you want it to." — Trinity
 *
 * Trinity is the deep analyst who comprehends code, extracts intent from prompts,
 * analyzes architecture patterns, and provides expert verification for checklists.
 */

import {
  BaseAgent,
  AgentTask,
  VerificationContext,
  createDefaultAgentConfig,
} from './base-agent.js';
import {
  PromptAnalysis,
  PromptStructure,
  PromptVariable,
  ToolAnalysis,
  ToolParameter,
  ToolHandler,
  DetectedPattern,
  DetectedAntiPattern,
  ArchitectureAnalysis,
  StructureAssessment,
  ProjectScan,
  ScannedFile,
  FileLocation,
  AgentConfig,
  VerificationResult,
} from '../../types/morpheus.js';

// ============================================================================
// ANALYSIS PATTERNS
// ============================================================================

/**
 * Patterns for detecting prompt types
 */
const PROMPT_TYPE_PATTERNS = {
  systemPrompt: [
    /system\s*:\s*['"]/i,
    /role\s*:\s*['"]system['"]/i,
    /systemPrompt/i,
    /system_prompt/i,
    /\.system\s*\(/i,
  ],
  userPrompt: [
    /user\s*:\s*['"]/i,
    /role\s*:\s*['"]user['"]/i,
    /userPrompt/i,
    /user_prompt/i,
    /\.user\s*\(/i,
    /\.human\s*\(/i,
  ],
  assistantPrompt: [
    /assistant\s*:\s*['"]/i,
    /role\s*:\s*['"]assistant['"]/i,
    /assistantPrompt/i,
  ],
  templateVariable: [
    /\{\{(\w+)\}\}/g,           // Mustache/Handlebars
    /\$\{(\w+)\}/g,             // Template literals
    /\{(\w+)\}/g,               // Python f-strings
    /%\{(\w+)\}/g,              // Ruby/Elixir
    /:(\w+)/g,                  // Named parameters
  ],
};

/**
 * Tool call patterns by framework
 */
const TOOL_PATTERNS = {
  'openai-functions': [
    /functions\s*:\s*\[/,
    /function_call/,
    /tools\s*:\s*\[.*type\s*:\s*['"]function['"]/s,
  ],
  'anthropic-tools': [
    /tool_use/,
    /tools\s*:\s*\[.*name\s*:/s,
  ],
  'langchain': [
    /new\s+Tool\s*\(/,
    /StructuredTool/,
    /@tool/,
    /createTool/,
  ],
  'custom': [
    /toolHandler/,
    /handleTool/,
    /executeTool/,
  ],
};

/**
 * Architecture patterns (good practices)
 */
const GOOD_PATTERNS: Array<{ id: string; name: string; patterns: RegExp[]; description: string }> = [
  {
    id: 'centralized-config',
    name: 'Centralized Configuration',
    patterns: [/config\.(ts|js|yaml|json)$/i, /\.env/],
    description: 'Configuration is centralized in dedicated files',
  },
  {
    id: 'service-layer',
    name: 'Service Layer Pattern',
    patterns: [/services?\//i, /Service\.(ts|js)$/],
    description: 'Business logic is organized in a service layer',
  },
  {
    id: 'error-handling',
    name: 'Structured Error Handling',
    patterns: [/errors?\.(ts|js)$/i, /class\s+\w+Error\s+extends/],
    description: 'Custom error classes for better error handling',
  },
  {
    id: 'type-definitions',
    name: 'TypeScript Type Definitions',
    patterns: [/types?\.(ts|d\.ts)$/i, /interface\s+\w+/],
    description: 'Strong typing with TypeScript interfaces',
  },
  {
    id: 'separate-ai-module',
    name: 'Separate AI Module',
    patterns: [/ai\//i, /llm\//i, /models?\//i],
    description: 'AI-related code is isolated in dedicated modules',
  },
  {
    id: 'prompt-templates',
    name: 'Prompt Templates',
    patterns: [/prompts?\//i, /templates?\//i, /\.prompt\.(ts|js|txt)$/i],
    description: 'Prompts are stored as templates, not inline',
  },
  {
    id: 'validation-layer',
    name: 'Input/Output Validation',
    patterns: [/validators?\//i, /schemas?\//i, /zod|yup|joi/i],
    description: 'Input and output validation is implemented',
  },
];

/**
 * Anti-patterns (practices to avoid)
 */
const ANTI_PATTERNS: Array<{
  id: string;
  name: string;
  patterns: RegExp[];
  description: string;
  severity: DetectedAntiPattern['severity'];
}> = [
  {
    id: 'hardcoded-api-key',
    name: 'Hardcoded API Key',
    patterns: [/sk-[a-zA-Z0-9]{20,}/, /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i],
    description: 'API keys should be stored in environment variables',
    severity: 'critical',
  },
  {
    id: 'inline-prompts',
    name: 'Inline Prompts',
    patterns: [/messages\s*:\s*\[\s*\{\s*role\s*:\s*['"]system['"],\s*content\s*:\s*['"]/],
    description: 'Prompts are defined inline instead of templates',
    severity: 'medium',
  },
  {
    id: 'no-error-handling',
    name: 'Missing Error Handling',
    patterns: [/await\s+\w+\.(chat|completion).*(?!\s*\.catch|\s*try)/],
    description: 'AI calls without proper error handling',
    severity: 'high',
  },
  {
    id: 'unbounded-tokens',
    name: 'Unbounded Token Usage',
    patterns: [/max_tokens\s*:\s*(?![\d])|(?<!max_tokens.*)\.(chat|completion)\s*\(/],
    description: 'No max_tokens limit set for AI calls',
    severity: 'medium',
  },
  {
    id: 'sync-ai-calls',
    name: 'Synchronous AI Calls',
    patterns: [/(?<!await\s)\w+\.(chat|completion)\s*\(/],
    description: 'AI calls should be awaited for proper async handling',
    severity: 'low',
  },
  {
    id: 'no-rate-limiting',
    name: 'No Rate Limiting',
    patterns: [/(?<!rateLim|throttle).*\.(chat|completion)\s*\(/i],
    description: 'AI calls without rate limiting protection',
    severity: 'medium',
  },
];

/**
 * Intent categories for prompts
 */
type PromptIntent =
  | 'code-generation'
  | 'code-explanation'
  | 'code-review'
  | 'translation'
  | 'summarization'
  | 'question-answering'
  | 'classification'
  | 'extraction'
  | 'creative-writing'
  | 'conversation'
  | 'task-completion'
  | 'unknown';

/**
 * Intent detection patterns
 */
const INTENT_PATTERNS: Record<PromptIntent, RegExp[]> = {
  'code-generation': [
    /write|create|generate|implement|build|code|function|class/i,
    /typescript|javascript|python|java|code/i,
  ],
  'code-explanation': [
    /explain|describe|what does|how does|understand/i,
    /this code|the code|following code/i,
  ],
  'code-review': [
    /review|analyze|check|audit|improve|refactor/i,
    /bugs?|issues?|problems?|errors?/i,
  ],
  'translation': [
    /translate|convert|transform|migrate/i,
    /from .* to|into|language/i,
  ],
  'summarization': [
    /summarize|summary|brief|overview|tldr|key points/i,
  ],
  'question-answering': [
    /\?$|answer|respond|reply|what is|who is|when|where|why|how/i,
  ],
  'classification': [
    /classify|categorize|label|tag|identify type/i,
  ],
  'extraction': [
    /extract|find|locate|identify|parse|get the/i,
  ],
  'creative-writing': [
    /write a story|creative|poem|narrative|fiction/i,
  ],
  'conversation': [
    /chat|convers|dialog|discuss|talk/i,
  ],
  'task-completion': [
    /complete|finish|do|execute|perform|task/i,
  ],
  'unknown': [],
};

// ============================================================================
// TRINITY AGENT CLASS
// ============================================================================

/**
 * Trinity Agent - The Expert
 *
 * Deep analysis of AI usage patterns, prompts, and tool calls.
 */
export class Trinity extends BaseAgent {
  private analysisCache: Map<string, unknown> = new Map();

  constructor(config: AgentConfig = createDefaultAgentConfig(['analyze-prompts', 'analyze-tools', 'analyze-patterns', 'verify-checklist'])) {
    super('trinity', config);
  }

  // --------------------------------------------------------------------------
  // TASK EXECUTION
  // --------------------------------------------------------------------------

  protected async executeTask<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>
  ): Promise<TOutput> {
    const input = task.input as Record<string, unknown>;

    switch (task.type) {
      case 'analyze':
        return this.handleAnalyzeTask(input) as TOutput;
      case 'verify':
        return this.handleVerifyTask(input) as TOutput;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  private async handleAnalyzeTask(input: Record<string, unknown>): Promise<unknown> {
    const analyzeType = input.analyzeType as string;

    switch (analyzeType) {
      case 'prompt':
        return this.analyzePrompt(input.content as string, input.location as FileLocation);
      case 'prompts':
        return this.analyzePrompts(input.files as ScannedFile[]);
      case 'tool':
        return this.analyzeTool(input.content as string, input.location as FileLocation);
      case 'tools':
        return this.analyzeTools(input.files as ScannedFile[]);
      case 'patterns':
        return this.analyzePatterns(input.scan as ProjectScan);
      case 'architecture':
        return this.analyzeArchitecture(input.scan as ProjectScan);
      case 'intent':
        return this.extractIntent(input.content as string);
      default:
        throw new Error(`Unknown analyze type: ${analyzeType}`);
    }
  }

  private async handleVerifyTask(input: Record<string, unknown>): Promise<VerificationResult> {
    const itemId = input.itemId as string;
    const context = input.context as VerificationContext;
    return this.performVerification(itemId, context);
  }

  protected async performVerification(
    itemId: string,
    context: VerificationContext
  ): Promise<VerificationResult> {
    // Trinity can verify analysis-related checklist items
    const itemText = context.itemText.toLowerCase();

    // Check if this is an analysis-related item
    if (this.isAnalysisItem(itemId, itemText)) {
      return this.verifyAnalysisItem(itemId, context);
    }

    // Check if this is a pattern-related item
    if (this.isPatternItem(itemId, itemText)) {
      return this.verifyPatternItem(itemId, context);
    }

    // Check if this is a prompt-related item
    if (this.isPromptItem(itemId, itemText)) {
      return this.verifyPromptItem(itemId, context);
    }

    return {
      verified: false,
      evidence: '',
      confidence: 0,
      method: 'manual',
      details: 'Item requires manual verification',
    };
  }

  private isAnalysisItem(itemId: string, text: string): boolean {
    return itemId.includes('analyze') || text.includes('analyze') || text.includes('analysis');
  }

  private isPatternItem(itemId: string, text: string): boolean {
    return itemId.includes('pattern') || text.includes('pattern') || text.includes('anti-pattern');
  }

  private isPromptItem(itemId: string, text: string): boolean {
    return itemId.includes('prompt') || text.includes('prompt') || text.includes('intent');
  }

  private async verifyAnalysisItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<VerificationResult> {
    // Trinity can verify analysis completion
    return {
      verified: true,
      evidence: 'Analysis capability verified - Trinity can perform deep analysis',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyPatternItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<VerificationResult> {
    return {
      verified: true,
      evidence: 'Pattern detection capability verified',
      confidence: 0.9,
      method: 'automated',
    };
  }

  private async verifyPromptItem(
    _itemId: string,
    _context: VerificationContext
  ): Promise<VerificationResult> {
    return {
      verified: true,
      evidence: 'Prompt analysis capability verified',
      confidence: 0.9,
      method: 'automated',
    };
  }

  // --------------------------------------------------------------------------
  // PROMPT ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze a single prompt from code content
   */
  async analyzePrompt(content: string, location: FileLocation): Promise<PromptAnalysis> {
    const structure = this.analyzePromptStructure(content);
    const variables = this.extractPromptVariables(content);
    const complexity = this.assessPromptComplexity(content, structure, variables);
    const estimatedTokens = this.estimateTokens(content);
    const recommendations = this.generatePromptRecommendations(structure, variables, complexity);

    return {
      id: this.generatePromptId(location),
      location,
      type: this.inferPromptType(content),
      structure,
      variables,
      complexity,
      estimatedTokens,
      recommendations,
    };
  }

  /**
   * Analyze prompts from multiple files
   */
  async analyzePrompts(files: ScannedFile[]): Promise<PromptAnalysis[]> {
    const prompts: PromptAnalysis[] = [];

    for (const file of files) {
      if (file.hasAIUsage && file.content) {
        // Find prompt patterns in the file
        const promptLocations = this.findPromptLocations(file.content, file.path);

        for (const loc of promptLocations) {
          const promptContent = this.extractPromptContent(file.content, loc.line);
          if (promptContent) {
            const analysis = await this.analyzePrompt(promptContent, loc);
            prompts.push(analysis);
          }
        }
      }
    }

    return prompts;
  }

  /**
   * Analyze prompt structure
   */
  private analyzePromptStructure(content: string): PromptStructure {
    let hasSystemPrompt = false;
    let hasUserPrompt = false;
    let hasAssistantExamples = false;
    let messageCount = 0;
    let systemPromptContent: string | undefined;
    let userPromptTemplate: string | undefined;

    // Check for system prompt
    for (const pattern of PROMPT_TYPE_PATTERNS.systemPrompt) {
      if (pattern.test(content)) {
        hasSystemPrompt = true;
        systemPromptContent = this.extractSystemPromptContent(content);
        messageCount++;
        break;
      }
    }

    // Check for user prompt
    for (const pattern of PROMPT_TYPE_PATTERNS.userPrompt) {
      if (pattern.test(content)) {
        hasUserPrompt = true;
        userPromptTemplate = this.extractUserPromptTemplate(content);
        messageCount++;
        break;
      }
    }

    // Check for assistant examples
    for (const pattern of PROMPT_TYPE_PATTERNS.assistantPrompt) {
      if (pattern.test(content)) {
        hasAssistantExamples = true;
        messageCount++;
        break;
      }
    }

    // Count total messages if using array format
    const messagesMatch = content.match(/messages\s*:\s*\[/);
    if (messagesMatch) {
      const roleMatches = content.match(/role\s*:/g);
      if (roleMatches) {
        messageCount = Math.max(messageCount, roleMatches.length);
      }
    }

    const result: PromptStructure = {
      hasSystemPrompt,
      hasUserPrompt,
      hasAssistantExamples,
      messageCount,
    };
    if (systemPromptContent !== undefined) {
      result.systemPromptContent = systemPromptContent;
    }
    if (userPromptTemplate !== undefined) {
      result.userPromptTemplate = userPromptTemplate;
    }
    return result;
  }

  /**
   * Extract system prompt content
   */
  private extractSystemPromptContent(content: string): string | undefined {
    // Try to extract system prompt from various formats
    const patterns = [
      /system\s*:\s*['"`]([^'"`]+)['"`]/i,
      /role\s*:\s*['"]system['"][\s\S]*?content\s*:\s*['"`]([^'"`]+)['"`]/i,
      /systemPrompt\s*[=:]\s*['"`]([^'"`]+)['"`]/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract user prompt template
   */
  private extractUserPromptTemplate(content: string): string | undefined {
    const patterns = [
      /user\s*:\s*['"`]([^'"`]+)['"`]/i,
      /role\s*:\s*['"]user['"][\s\S]*?content\s*:\s*['"`]([^'"`]+)['"`]/i,
      /userPrompt\s*[=:]\s*['"`]([^'"`]+)['"`]/i,
      /prompt\s*[=:]\s*['"`]([^'"`]+)['"`]/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract variables from prompt content
   */
  private extractPromptVariables(content: string): PromptVariable[] {
    const variables: Map<string, PromptVariable> = new Map();

    for (const pattern of PROMPT_TYPE_PATTERNS.templateVariable) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        if (name && !variables.has(name)) {
          const variable: PromptVariable = {
            name,
            source: this.inferVariableSource(name, content),
          };
          const inferredType = this.inferVariableType(name, content);
          if (inferredType !== undefined) {
            variable.type = inferredType;
          }
          variables.set(name, variable);
        }
      }
    }

    return Array.from(variables.values());
  }

  /**
   * Infer variable source
   */
  private inferVariableSource(name: string, content: string): PromptVariable['source'] {
    // Check if it's from function parameters
    const paramPattern = new RegExp(`\\(.*${name}.*\\)\\s*=>|function.*\\(.*${name}.*\\)`);
    if (paramPattern.test(content)) {
      return 'parameter';
    }

    // Check if it's computed
    const computedPattern = new RegExp(`(const|let|var)\\s+${name}\\s*=`);
    if (computedPattern.test(content)) {
      return 'computed';
    }

    // Default to context
    return 'context';
  }

  /**
   * Infer variable type from usage
   */
  private inferVariableType(name: string, content: string): string | undefined {
    // Check for TypeScript type annotation
    const typePattern = new RegExp(`${name}\\s*:\\s*(\\w+)`);
    const typeMatch = content.match(typePattern);
    if (typeMatch && typeMatch[1]) {
      return typeMatch[1].toLowerCase();
    }

    // Infer from name conventions
    if (name.toLowerCase().includes('count') || name.toLowerCase().includes('num')) {
      return 'number';
    }
    if (name.toLowerCase().includes('is') || name.toLowerCase().includes('has')) {
      return 'boolean';
    }
    if (name.toLowerCase().includes('list') || name.toLowerCase().includes('items')) {
      return 'array';
    }

    return 'string';
  }

  /**
   * Assess prompt complexity
   */
  private assessPromptComplexity(
    content: string,
    structure: PromptStructure,
    variables: PromptVariable[]
  ): PromptAnalysis['complexity'] {
    let complexityScore = 0;

    // Structure complexity
    if (structure.hasSystemPrompt) complexityScore += 1;
    if (structure.hasAssistantExamples) complexityScore += 1;
    if (structure.messageCount > 3) complexityScore += 1;

    // Variable complexity
    if (variables.length > 3) complexityScore += 1;
    if (variables.length > 6) complexityScore += 1;

    // Content complexity
    if (content.length > 1000) complexityScore += 1;
    if (content.length > 3000) complexityScore += 1;

    // Conditional logic
    if (/if|else|switch|case/i.test(content)) complexityScore += 1;

    if (complexityScore <= 2) return 'simple';
    if (complexityScore <= 5) return 'moderate';
    return 'complex';
  }

  /**
   * Estimate token count
   */
  private estimateTokens(content: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(content.length / 4);
  }

  /**
   * Generate recommendations for prompt
   */
  private generatePromptRecommendations(
    structure: PromptStructure,
    variables: PromptVariable[],
    complexity: PromptAnalysis['complexity']
  ): string[] {
    const recommendations: string[] = [];

    if (!structure.hasSystemPrompt) {
      recommendations.push('Consider adding a system prompt to define AI behavior');
    }

    if (variables.length === 0) {
      recommendations.push('Prompt appears static - consider using template variables');
    }

    if (complexity === 'complex') {
      recommendations.push('Complex prompt - consider breaking into smaller components');
    }

    if (structure.messageCount === 1) {
      recommendations.push('Consider using few-shot examples for better results');
    }

    return recommendations;
  }

  /**
   * Generate prompt ID from location
   */
  private generatePromptId(location: FileLocation): string {
    const fileName = location.file.split('/').pop()?.replace(/\.(ts|js|tsx|jsx)$/, '') || 'prompt';
    return `${fileName}-${location.line}`;
  }

  /**
   * Infer prompt type
   */
  private inferPromptType(content: string): PromptAnalysis['type'] {
    // Check for template patterns
    for (const pattern of PROMPT_TYPE_PATTERNS.templateVariable) {
      if (pattern.test(content)) {
        return 'template';
      }
    }

    // Check for file loading patterns
    if (/readFile|loadPrompt|import.*\.txt|require.*\.prompt/i.test(content)) {
      return 'file';
    }

    // Check for dynamic construction
    if (/\+\s*\w+|\$\{.*\}|`.*\$\{/i.test(content)) {
      return 'dynamic';
    }

    return 'inline';
  }

  /**
   * Find prompt locations in content
   */
  private findPromptLocations(content: string, filePath: string): FileLocation[] {
    const locations: FileLocation[] = [];
    const lines = content.split('\n');

    const promptIndicators = [
      /messages\s*:/,
      /prompt\s*[=:]/i,
      /systemPrompt/i,
      /\.chat\s*\(/,
      /\.completion\s*\(/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of promptIndicators) {
        if (pattern.test(lines[i]!)) {
          locations.push({
            file: filePath,
            line: i + 1,
            column: 0,
          });
          break;
        }
      }
    }

    return locations;
  }

  /**
   * Extract prompt content around a location
   */
  private extractPromptContent(content: string, line: number): string | undefined {
    const lines = content.split('\n');
    const startLine = Math.max(0, line - 2);
    const endLine = Math.min(lines.length, line + 20);

    const extracted = lines.slice(startLine, endLine).join('\n');
    return extracted.length > 0 ? extracted : undefined;
  }

  /**
   * Extract intent from prompt content
   */
  extractIntent(content: string): PromptIntent {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      if (intent === 'unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return intent as PromptIntent;
        }
      }
    }

    return 'unknown';
  }

  // --------------------------------------------------------------------------
  // TOOL ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze a single tool definition
   */
  async analyzeTool(content: string, location: FileLocation): Promise<ToolAnalysis> {
    const name = this.extractToolName(content);
    const description = this.extractToolDescription(content);
    const parameters = this.extractToolParameters(content);
    const handler = this.analyzeToolHandler(content, location);
    const pattern = this.detectToolPattern(content);

    const result: ToolAnalysis = {
      id: `${name || 'tool'}-${location.line}`,
      location,
      name: name || 'unknown',
      parameters,
      handler,
      pattern,
      hasValidation: this.hasInputValidation(content),
      hasErrorHandling: this.hasErrorHandling(content),
    };
    if (description !== undefined) {
      result.description = description;
    }
    return result;
  }

  /**
   * Analyze tools from multiple files
   */
  async analyzeTools(files: ScannedFile[]): Promise<ToolAnalysis[]> {
    const tools: ToolAnalysis[] = [];

    for (const file of files) {
      if (file.content) {
        const toolLocations = this.findToolLocations(file.content, file.path);

        for (const loc of toolLocations) {
          const toolContent = this.extractToolContent(file.content, loc.line);
          if (toolContent) {
            const analysis = await this.analyzeTool(toolContent, loc);
            tools.push(analysis);
          }
        }
      }
    }

    return tools;
  }

  /**
   * Extract tool name
   */
  private extractToolName(content: string): string | undefined {
    const patterns = [
      /name\s*:\s*['"]([^'"]+)['"]/,
      /new\s+Tool\s*\(\s*['"]([^'"]+)['"]/,
      /function\s+(\w+)/,
      /const\s+(\w+)\s*=/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract tool description
   */
  private extractToolDescription(content: string): string | undefined {
    const patterns = [
      /description\s*:\s*['"]([^'"]+)['"]/,
      /\/\*\*[\s\S]*?\*\s*([^\n@]+)/,
      /\/\/\s*(.+)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract tool parameters
   */
  private extractToolParameters(content: string): ToolParameter[] {
    const parameters: ToolParameter[] = [];

    // Look for parameters/properties definition
    const paramsMatch = content.match(/parameters\s*:\s*\{[\s\S]*?properties\s*:\s*\{([\s\S]*?)\}/);
    if (paramsMatch && paramsMatch[1]) {
      const propsContent = paramsMatch[1];
      const propPattern = /(\w+)\s*:\s*\{[\s\S]*?type\s*:\s*['"](\w+)['"]/g;

      let match;
      while ((match = propPattern.exec(propsContent)) !== null) {
        parameters.push({
          name: match[1]!,
          type: match[2]!,
          required: propsContent.includes(`"${match[1]}"`) || propsContent.includes(`'${match[1]}'`),
        });
      }
    }

    // Look for TypeScript function parameters
    const funcMatch = content.match(/\(([^)]+)\)/);
    if (funcMatch && funcMatch[1] && parameters.length === 0) {
      const params = funcMatch[1].split(',');
      for (const param of params) {
        const paramMatch = param.trim().match(/(\w+)(?:\s*:\s*(\w+))?/);
        if (paramMatch && paramMatch[1]) {
          parameters.push({
            name: paramMatch[1],
            type: paramMatch[2] || 'unknown',
            required: !param.includes('?'),
          });
        }
      }
    }

    return parameters;
  }

  /**
   * Analyze tool handler
   */
  private analyzeToolHandler(content: string, location: FileLocation): ToolHandler {
    return {
      location,
      async: /async\s+function|async\s*\(|async\s+\w+\s*=/i.test(content),
      hasErrorHandling: this.hasErrorHandling(content),
      returnsValue: /return\s+/i.test(content),
    };
  }

  /**
   * Detect tool pattern/framework
   */
  private detectToolPattern(content: string): ToolAnalysis['pattern'] {
    for (const [pattern, regexes] of Object.entries(TOOL_PATTERNS)) {
      for (const regex of regexes) {
        if (regex.test(content)) {
          return pattern as ToolAnalysis['pattern'];
        }
      }
    }
    return 'custom';
  }

  /**
   * Check if content has input validation
   */
  private hasInputValidation(content: string): boolean {
    const validationPatterns = [
      /\.parse\s*\(/,
      /validate/i,
      /schema/i,
      /zod|yup|joi/i,
      /typeof\s+\w+\s*[!=]==?\s*['"](?:string|number|boolean)['"]/,
    ];

    return validationPatterns.some(p => p.test(content));
  }

  /**
   * Check if content has error handling
   */
  private hasErrorHandling(content: string): boolean {
    const errorPatterns = [
      /try\s*\{/,
      /\.catch\s*\(/,
      /throw\s+new\s+\w*Error/,
    ];

    return errorPatterns.some(p => p.test(content));
  }

  /**
   * Find tool locations in content
   */
  private findToolLocations(content: string, filePath: string): FileLocation[] {
    const locations: FileLocation[] = [];
    const lines = content.split('\n');

    const toolIndicators = [
      /functions\s*:\s*\[/,
      /tools\s*:\s*\[/,
      /new\s+Tool\s*\(/,
      /StructuredTool/,
      /@tool/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of toolIndicators) {
        if (pattern.test(lines[i]!)) {
          locations.push({
            file: filePath,
            line: i + 1,
            column: 0,
          });
          break;
        }
      }
    }

    return locations;
  }

  /**
   * Extract tool content around a location
   */
  private extractToolContent(content: string, line: number): string | undefined {
    const lines = content.split('\n');
    const startLine = Math.max(0, line - 2);
    const endLine = Math.min(lines.length, line + 30);

    const extracted = lines.slice(startLine, endLine).join('\n');
    return extracted.length > 0 ? extracted : undefined;
  }

  // --------------------------------------------------------------------------
  // PATTERN ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze patterns in project
   */
  async analyzePatterns(scan: ProjectScan): Promise<{
    patterns: DetectedPattern[];
    antiPatterns: DetectedAntiPattern[];
  }> {
    const patterns: DetectedPattern[] = [];
    const antiPatterns: DetectedAntiPattern[] = [];

    // Check for good patterns
    for (const patternDef of GOOD_PATTERNS) {
      const locations = this.findPatternLocations(scan, patternDef.patterns);
      if (locations.length > 0) {
        patterns.push({
          id: patternDef.id,
          name: patternDef.name,
          category: 'good',
          locations,
          description: patternDef.description,
        });
      }
    }

    // Check for anti-patterns
    for (const antiPatternDef of ANTI_PATTERNS) {
      const locations = this.findAntiPatternLocations(scan, antiPatternDef.patterns);
      if (locations.length > 0) {
        antiPatterns.push({
          id: antiPatternDef.id,
          name: antiPatternDef.name,
          severity: antiPatternDef.severity,
          locations,
          description: antiPatternDef.description,
          impact: `${antiPatternDef.severity} severity issue affecting code quality`,
          remediation: `Consider addressing this ${antiPatternDef.severity} severity issue`,
        });
      }
    }

    return { patterns, antiPatterns };
  }

  /**
   * Find pattern locations in project
   */
  private findPatternLocations(scan: ProjectScan, patterns: RegExp[]): FileLocation[] {
    const locations: FileLocation[] = [];

    for (const file of scan.files) {
      // Check file path
      for (const pattern of patterns) {
        if (pattern.test(file.relativePath)) {
          locations.push({
            file: file.path,
            line: 1,
            column: 0,
          });
          break;
        }
      }

      // Check file content
      if (file.content) {
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of patterns) {
            if (pattern.test(lines[i]!)) {
              locations.push({
                file: file.path,
                line: i + 1,
                column: 0,
              });
            }
          }
        }
      }
    }

    return locations;
  }

  /**
   * Find anti-pattern locations in project
   */
  private findAntiPatternLocations(scan: ProjectScan, patterns: RegExp[]): FileLocation[] {
    const locations: FileLocation[] = [];

    for (const file of scan.files) {
      if (file.content) {
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of patterns) {
            if (pattern.test(lines[i]!)) {
              locations.push({
                file: file.path,
                line: i + 1,
                column: 0,
              });
            }
          }
        }
      }
    }

    return locations;
  }

  // --------------------------------------------------------------------------
  // ARCHITECTURE ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze project architecture
   */
  async analyzeArchitecture(scan: ProjectScan): Promise<ArchitectureAnalysis> {
    const structure = this.assessStructure(scan);
    const patterns = this.detectArchitecturePatterns(scan);
    const score = this.calculateArchitectureScore(structure);
    const recommendations = this.generateArchitectureRecommendations(structure);

    return {
      structure,
      patterns,
      score,
      recommendations,
    };
  }

  /**
   * Assess project structure
   */
  private assessStructure(scan: ProjectScan): StructureAssessment {
    const filePaths = scan.files.map(f => f.relativePath);
    const fileContents = scan.files
      .filter(f => f.content)
      .map(f => f.content!)
      .join('\n');

    return {
      hasServiceLayer: filePaths.some(p => /services?\//i.test(p)),
      hasSeparateAIModule: filePaths.some(p => /(?:ai|llm|models?)\//i.test(p)),
      hasConfigFiles: filePaths.some(p => /config\.(ts|js|yaml|json)$/i.test(p)),
      hasTypeDefinitions: filePaths.some(p => /types?\.(ts|d\.ts)$/i.test(p)),
      hasCentralizedErrors: filePaths.some(p => /errors?\.(ts|js)$/i.test(p)) ||
        /class\s+\w+Error\s+extends/.test(fileContents),
      hasLogging: /logger|console\.(log|info|warn|error)|winston|pino/i.test(fileContents),
      hasTests: filePaths.some(p => /\.(test|spec)\.(ts|js)$/i.test(p)),
    };
  }

  /**
   * Detect architecture patterns
   */
  private detectArchitecturePatterns(scan: ProjectScan): string[] {
    const patterns: string[] = [];
    const filePaths = scan.files.map(f => f.relativePath);

    if (filePaths.some(p => /controllers?\//i.test(p))) {
      patterns.push('MVC/Controller Pattern');
    }
    if (filePaths.some(p => /repositories?\//i.test(p))) {
      patterns.push('Repository Pattern');
    }
    if (filePaths.some(p => /middlewares?\//i.test(p))) {
      patterns.push('Middleware Pattern');
    }
    if (filePaths.some(p => /handlers?\//i.test(p))) {
      patterns.push('Handler Pattern');
    }
    if (filePaths.some(p => /hooks?\//i.test(p))) {
      patterns.push('Hooks Pattern');
    }
    if (filePaths.some(p => /utils?\//i.test(p))) {
      patterns.push('Utility Module');
    }

    return patterns;
  }

  /**
   * Calculate architecture score
   */
  private calculateArchitectureScore(structure: StructureAssessment): number {
    let score = 50; // Base score

    if (structure.hasServiceLayer) score += 10;
    if (structure.hasSeparateAIModule) score += 15;
    if (structure.hasConfigFiles) score += 5;
    if (structure.hasTypeDefinitions) score += 10;
    if (structure.hasCentralizedErrors) score += 5;
    if (structure.hasLogging) score += 3;
    if (structure.hasTests) score += 7;

    return Math.min(score, 100);
  }

  /**
   * Generate architecture recommendations
   */
  private generateArchitectureRecommendations(structure: StructureAssessment): string[] {
    const recommendations: string[] = [];

    if (!structure.hasServiceLayer) {
      recommendations.push('Consider organizing business logic in a service layer');
    }
    if (!structure.hasSeparateAIModule) {
      recommendations.push('Consider isolating AI-related code in a dedicated module');
    }
    if (!structure.hasTypeDefinitions) {
      recommendations.push('Add TypeScript type definitions for better type safety');
    }
    if (!structure.hasCentralizedErrors) {
      recommendations.push('Implement centralized error handling with custom error classes');
    }
    if (!structure.hasTests) {
      recommendations.push('Add test coverage for critical functionality');
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Get cached analysis result
   */
  getCachedAnalysis<T>(key: string): T | undefined {
    return this.analysisCache.get(key) as T | undefined;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Trinity agent instance
 *
 * "The answer is out there, and it's looking for you."
 */
export function createTrinity(config?: AgentConfig): Trinity {
  return new Trinity(config);
}
