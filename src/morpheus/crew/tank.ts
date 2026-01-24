/**
 * Tank Agent - The Operator
 *
 * "I know what you're thinking, because right now I'm thinking the same thing." — Tank
 *
 * Tank is the operator who scans and analyzes projects, detects AI usage,
 * and provides the intelligence needed for migration planning.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import { existsSync } from 'fs';
import {
  BaseAgent,
  AgentTask,
  VerificationContext,
  createDefaultAgentConfig,
} from './base-agent.js';
import {
  ProjectScan,
  ScannedFile,
  FileLanguage,
  ImportStatement,
  ExportStatement,
  DependencyScan,
  AIPackageInfo,
  AIProvider,
  AIFeature,
  PackageInfo,
  ConfigScan,
  SecretDetection,
  ScanStatistics,
  AgentConfig,
  VerificationResult,
} from '../../types/morpheus.js';

// ============================================================================
// AI PACKAGE DETECTION
// ============================================================================

/**
 * Known AI packages and their providers
 */
const AI_PACKAGES: Record<string, { provider: AIProvider; features: AIFeature[] }> = {
  // OpenAI
  'openai': { provider: 'openai', features: ['chat', 'completion', 'embeddings', 'vision', 'audio', 'tools'] },
  '@azure/openai': { provider: 'azure', features: ['chat', 'completion', 'embeddings'] },

  // Anthropic
  '@anthropic-ai/sdk': { provider: 'anthropic', features: ['chat', 'tools', 'vision'] },

  // Google
  '@google/generative-ai': { provider: 'google', features: ['chat', 'embeddings', 'vision'] },
  '@google-cloud/aiplatform': { provider: 'google', features: ['chat', 'embeddings'] },

  // Cohere
  'cohere-ai': { provider: 'cohere', features: ['chat', 'embeddings'] },

  // Mistral
  '@mistralai/mistralai': { provider: 'mistral', features: ['chat', 'embeddings'] },

  // LangChain
  'langchain': { provider: 'langchain', features: ['chat', 'agents', 'tools', 'embeddings'] },
  '@langchain/core': { provider: 'langchain', features: ['chat', 'agents', 'tools'] },
  '@langchain/openai': { provider: 'langchain', features: ['chat', 'tools'] },
  '@langchain/anthropic': { provider: 'langchain', features: ['chat', 'tools'] },
  '@langchain/community': { provider: 'langchain', features: ['agents', 'tools'] },

  // LlamaIndex
  'llamaindex': { provider: 'llamaindex', features: ['chat', 'agents', 'tools', 'embeddings'] },
};

/**
 * Patterns that indicate AI usage in code
 */
const AI_USAGE_PATTERNS = [
  /openai/i,
  /anthropic/i,
  /claude/i,
  /gpt-[34]/i,
  /chatgpt/i,
  /langchain/i,
  /llamaindex/i,
  /\.chat\s*\(/,
  /\.completion[s]?\s*\(/,
  /\.embed[dings]?\s*\(/,
  /createChatCompletion/,
  /ChatOpenAI/,
  /ChatAnthropic/,
];

/**
 * Secret patterns
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; type: SecretDetection['type'] }> = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, type: 'api_key' },
  { pattern: /OPENAI_API_KEY\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'api_key' },
  { pattern: /ANTHROPIC_API_KEY\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'api_key' },
  { pattern: /API_KEY\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'api_key' },
  { pattern: /password\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'password' },
  { pattern: /secret\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'credential' },
  { pattern: /token\s*[=:]\s*['"]?([^'"}\s]+)/gi, type: 'token' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/g, type: 'token' },
];

// ============================================================================
// TANK AGENT CLASS
// ============================================================================

/**
 * Tank Agent - The Operator
 *
 * Scans and analyzes projects to provide intelligence for migration.
 */
export class Tank extends BaseAgent {
  private scanCache: Map<string, ProjectScan> = new Map();

  constructor(config: AgentConfig = createDefaultAgentConfig(['scan-project', 'analyze-dependencies', 'detect-ai-usage'])) {
    super('tank', config);
  }

  // --------------------------------------------------------------------------
  // TASK EXECUTION
  // --------------------------------------------------------------------------

  protected async executeTask<TInput, TOutput>(
    task: AgentTask<TInput, TOutput>
  ): Promise<TOutput> {
    const input = task.input as Record<string, unknown>;
    const projectPath = (input.projectPath as string) || this.context?.projectPath;

    if (!projectPath) {
      throw new Error('Project path is required');
    }

    switch (task.type) {
      case 'scan':
        return this.scanProject(projectPath, input) as TOutput;
      case 'analyze':
        return this.analyzeDependencies(projectPath) as TOutput;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  protected async performVerification(
    itemId: string,
    context: VerificationContext
  ): Promise<VerificationResult> {
    // Tank can verify scan-related checklist items
    if (itemId.includes('scan') || itemId.includes('dependencies')) {
      try {
        const scan = await this.scanProject(context.projectPath, {});
        return {
          verified: true,
          evidence: `Scanned ${scan.statistics.totalFiles} files, found ${scan.statistics.aiRelatedFiles} AI-related files`,
          confidence: 1.0,
          method: 'automated',
        };
      } catch (error) {
        return {
          verified: false,
          evidence: '',
          confidence: 0,
          method: 'automated',
          details: `Scan failed: ${(error as Error).message}`,
        };
      }
    }

    return {
      verified: false,
      evidence: '',
      confidence: 0,
      method: 'manual',
      details: 'Item requires manual verification',
    };
  }

  // --------------------------------------------------------------------------
  // PROJECT SCANNING
  // --------------------------------------------------------------------------

  /**
   * Scan a project and return comprehensive analysis
   */
  async scanProject(
    projectPath: string,
    options: {
      useCache?: boolean;
      includeNodeModules?: boolean;
      maxFileSize?: number;
    } = {}
  ): Promise<ProjectScan> {
    const cacheKey = projectPath;
    if (options.useCache !== false && this.scanCache.has(cacheKey)) {
      return this.scanCache.get(cacheKey)!;
    }

    const startTime = Date.now();
    const maxFileSize = options.maxFileSize ?? 1024 * 1024; // 1MB default

    // Scan files
    const files = await this.scanFiles(projectPath, {
      includeNodeModules: options.includeNodeModules ?? false,
      maxFileSize,
    });

    // Scan dependencies
    const dependencies = await this.analyzeDependencies(projectPath);

    // Scan configs
    const configs = await this.scanConfigs(projectPath);

    // Calculate statistics
    const statistics = this.calculateStatistics(files, Date.now() - startTime);

    const scan: ProjectScan = {
      rootPath: projectPath,
      scannedAt: new Date(),
      files,
      dependencies,
      configs,
      statistics,
    };

    this.scanCache.set(cacheKey, scan);
    return scan;
  }

  /**
   * Scan all relevant files in a project
   */
  private async scanFiles(
    rootPath: string,
    options: { includeNodeModules: boolean; maxFileSize: number }
  ): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];
    const ignoreDirs = options.includeNodeModules
      ? ['.git', 'dist', 'build', 'coverage', '.next', '.nuxt']
      : ['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt'];

    const scanDir = async (dirPath: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(dirPath, { withFileTypes: true });
      } catch {
        return; // Skip unreadable directories
      }

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          const scannedFile = await this.scanFile(fullPath, rootPath, options.maxFileSize);
          if (scannedFile) {
            files.push(scannedFile);
          }
        }
      }
    };

    await scanDir(rootPath);
    return files;
  }

  /**
   * Scan a single file
   */
  private async scanFile(
    filePath: string,
    rootPath: string,
    maxFileSize: number
  ): Promise<ScannedFile | null> {
    const ext = extname(filePath).toLowerCase();
    const language = this.getLanguage(ext);

    if (language === 'other' && !['.env', '.gitignore', '.npmrc'].includes(ext)) {
      // Skip non-relevant files unless they're config files
      if (!basename(filePath).startsWith('.') && !filePath.includes('rc')) {
        return null;
      }
    }

    try {
      const stats = await stat(filePath);
      if (stats.size > maxFileSize) {
        return null;
      }

      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const imports = this.extractImports(content, language);
      const exports = this.extractExports(content, language);
      const hasAIUsage = this.detectAIUsage(content, imports);

      return {
        path: filePath,
        relativePath: relative(rootPath, filePath),
        language,
        size: stats.size,
        lines: lines.length,
        imports,
        exports,
        hasAIUsage,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get language from file extension
   */
  private getLanguage(ext: string): FileLanguage {
    switch (ext) {
      case '.ts':
      case '.tsx':
      case '.mts':
      case '.cts':
        return 'typescript';
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.json':
        return 'json';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.md':
      case '.mdx':
        return 'markdown';
      default:
        return 'other';
    }
  }

  /**
   * Extract import statements from code
   */
  private extractImports(content: string, language: FileLanguage): ImportStatement[] {
    if (language !== 'typescript' && language !== 'javascript') {
      return [];
    }

    const imports: ImportStatement[] = [];

    // ES6 imports
    const esImportRegex = /import\s+(?:(\*\s+as\s+\w+)|(\{[^}]+\})|(\w+))?\s*(?:,\s*(?:(\{[^}]+\})|(\w+)))?\s*from\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = esImportRegex.exec(content)) !== null) {
      const source = match[6]!;
      const isNamespace = !!match[1];
      const namedImports = match[2] || match[4];
      const defaultImport = match[3] || match[5];

      const specifiers: string[] = [];
      if (namedImports) {
        const names = namedImports.replace(/[{}]/g, '').split(',').map((s) => s.trim().split(/\s+as\s+/)[0]!);
        specifiers.push(...names.filter(Boolean));
      }
      if (defaultImport) {
        specifiers.push(defaultImport);
      }

      const lineNum = content.substring(0, match.index).split('\n').length;

      imports.push({
        source,
        specifiers,
        isDefault: !!defaultImport && !namedImports,
        isNamespace,
        line: lineNum,
      });
    }

    // CommonJS requires
    const requireRegex = /(?:const|let|var)\s+(?:(\{[^}]+\})|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = requireRegex.exec(content)) !== null) {
      const namedImports = match[1];
      const defaultImport = match[2];
      const source = match[3]!;

      const specifiers: string[] = [];
      if (namedImports) {
        const names = namedImports.replace(/[{}]/g, '').split(',').map((s) => s.trim());
        specifiers.push(...names.filter(Boolean));
      }
      if (defaultImport) {
        specifiers.push(defaultImport);
      }

      const lineNum = content.substring(0, match.index).split('\n').length;

      imports.push({
        source,
        specifiers,
        isDefault: !!defaultImport && !namedImports,
        isNamespace: false,
        line: lineNum,
      });
    }

    return imports;
  }

  /**
   * Extract export statements from code
   */
  private extractExports(content: string, language: FileLanguage): ExportStatement[] {
    if (language !== 'typescript' && language !== 'javascript') {
      return [];
    }

    const exports: ExportStatement[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:(?:const|let|var|function|class|interface|type|enum)\s+(\w+)|(\{[^}]+\}))/g;
    let match;

    while ((match = namedExportRegex.exec(content)) !== null) {
      const singleExport = match[1];
      const multiExports = match[2];
      const lineNum = content.substring(0, match.index).split('\n').length;

      if (singleExport) {
        exports.push({
          name: singleExport,
          isDefault: false,
          line: lineNum,
        });
      }

      if (multiExports) {
        const names = multiExports.replace(/[{}]/g, '').split(',').map((s) => s.trim().split(/\s+as\s+/).pop()!);
        for (const name of names.filter(Boolean)) {
          exports.push({
            name,
            isDefault: false,
            line: lineNum,
          });
        }
      }
    }

    // Default exports
    const defaultExportRegex = /export\s+default\s+(?:(?:class|function)\s+)?(\w+)?/g;

    while ((match = defaultExportRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      exports.push({
        name: match[1] || 'default',
        isDefault: true,
        line: lineNum,
      });
    }

    return exports;
  }

  /**
   * Detect AI usage in file content
   */
  private detectAIUsage(content: string, imports: ImportStatement[]): boolean {
    // Check imports for AI packages
    for (const imp of imports) {
      if (AI_PACKAGES[imp.source]) {
        return true;
      }
    }

    // Check content for AI patterns
    for (const pattern of AI_USAGE_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // DEPENDENCY ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze project dependencies
   */
  async analyzeDependencies(projectPath: string): Promise<DependencyScan> {
    const packageJsonPath = join(projectPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return {
        packageManager: 'npm',
        packageJson: {},
        lockfilePresent: false,
        typescript: false,
        aiPackages: [],
        relatedPackages: [],
      };
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    // Detect package manager
    const packageManager = this.detectPackageManager(projectPath);

    // Check for lockfile
    const lockfilePresent = this.hasLockfile(projectPath, packageManager);

    // Check for TypeScript
    const typescript = this.hasTypeScript(projectPath, packageJson);

    // Get tsconfig if exists
    let tsConfig: Record<string, unknown> | undefined;
    const tsconfigPath = join(projectPath, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
      try {
        tsConfig = JSON.parse(await readFile(tsconfigPath, 'utf-8'));
      } catch {
        // Invalid tsconfig
      }
    }

    // Detect AI packages
    const aiPackages = this.detectAIPackages(packageJson);

    // Detect related packages (testing, linting, etc.)
    const relatedPackages = this.detectRelatedPackages(packageJson);

    // Detect Node version
    const nodeVersion = (packageJson.engines as Record<string, string> | undefined)?.node;

    // Build result object, conditionally including optional properties
    const result: DependencyScan = {
      packageManager,
      packageJson,
      lockfilePresent,
      typescript,
      aiPackages,
      relatedPackages,
    };

    // Only add optional properties if they have values
    if (nodeVersion) {
      result.nodeVersion = nodeVersion;
    }
    if (tsConfig) {
      result.tsConfig = tsConfig;
    }

    return result;
  }

  /**
   * Detect package manager
   */
  private detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' {
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  /**
   * Check for lockfile
   */
  private hasLockfile(projectPath: string, packageManager: 'npm' | 'yarn' | 'pnpm'): boolean {
    switch (packageManager) {
      case 'pnpm':
        return existsSync(join(projectPath, 'pnpm-lock.yaml'));
      case 'yarn':
        return existsSync(join(projectPath, 'yarn.lock'));
      default:
        return existsSync(join(projectPath, 'package-lock.json'));
    }
  }

  /**
   * Check for TypeScript
   */
  private hasTypeScript(projectPath: string, packageJson: Record<string, unknown>): boolean {
    // Check for tsconfig
    if (existsSync(join(projectPath, 'tsconfig.json'))) {
      return true;
    }

    // Check for typescript in dependencies
    const dependencies = packageJson.dependencies as Record<string, string> | undefined;
    const devDependencies = packageJson.devDependencies as Record<string, string> | undefined;
    const deps = { ...dependencies, ...devDependencies };
    return 'typescript' in deps;
  }

  /**
   * Detect AI packages in dependencies
   */
  private detectAIPackages(packageJson: Record<string, unknown>): AIPackageInfo[] {
    const deps = {
      ...(packageJson.dependencies as Record<string, string> | undefined),
      ...(packageJson.devDependencies as Record<string, string> | undefined),
    };

    const aiPackages: AIPackageInfo[] = [];

    for (const [name, version] of Object.entries(deps)) {
      const aiInfo = AI_PACKAGES[name];
      if (aiInfo) {
        aiPackages.push({
          name,
          version: version || 'unknown',
          provider: aiInfo.provider,
          features: aiInfo.features,
        });
      }
    }

    return aiPackages;
  }

  /**
   * Detect related packages (testing, linting, etc.)
   */
  private detectRelatedPackages(packageJson: Record<string, unknown>): PackageInfo[] {
    const deps = {
      ...(packageJson.dependencies as Record<string, string> | undefined),
      ...(packageJson.devDependencies as Record<string, string> | undefined),
    };

    const relatedPatterns = [
      'jest', 'mocha', 'vitest', 'ava', // Testing
      'eslint', 'prettier', 'biome', // Linting
      'zod', 'yup', 'joi', // Validation
      'express', 'fastify', 'hono', 'koa', // Web frameworks
      'react', 'vue', 'svelte', 'angular', // UI frameworks
      'next', 'nuxt', 'remix', 'astro', // Meta frameworks
    ];

    const related: PackageInfo[] = [];

    for (const [name, version] of Object.entries(deps)) {
      if (relatedPatterns.some((p) => name.includes(p))) {
        related.push({
          name,
          version: version || 'unknown',
        });
      }
    }

    return related;
  }

  // --------------------------------------------------------------------------
  // CONFIG SCANNING
  // --------------------------------------------------------------------------

  /**
   * Scan for configuration files
   */
  async scanConfigs(projectPath: string): Promise<ConfigScan> {
    const envFiles: string[] = [];
    const configFiles: string[] = [];
    let hasEnvExample = false;
    const detectedSecrets: SecretDetection[] = [];

    // Common config file patterns
    const configPatterns = [
      '.env', '.env.local', '.env.development', '.env.production',
      '.env.example', '.env.sample', '.env.template',
      'config.json', 'config.yaml', 'config.yml',
      '.config.js', '.config.ts',
    ];

    // Scan root directory for config files
    try {
      const entries = await readdir(projectPath);

      for (const entry of entries) {
        const lower = entry.toLowerCase();

        if (lower.startsWith('.env')) {
          envFiles.push(entry);
          if (lower.includes('example') || lower.includes('sample') || lower.includes('template')) {
            hasEnvExample = true;
          } else {
            // Scan for secrets in non-example env files
            const secrets = await this.scanFileForSecrets(join(projectPath, entry));
            detectedSecrets.push(...secrets);
          }
        } else if (configPatterns.some((p) => lower.includes(p.toLowerCase()))) {
          configFiles.push(entry);
        }
      }
    } catch {
      // Directory not readable
    }

    return {
      envFiles,
      configFiles,
      hasEnvExample,
      detectedSecrets,
    };
  }

  /**
   * Scan a file for secrets
   */
  private async scanFileForSecrets(filePath: string): Promise<SecretDetection[]> {
    const secrets: SecretDetection[] = [];

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        for (const { pattern, type } of SECRET_PATTERNS) {
          pattern.lastIndex = 0; // Reset regex
          if (pattern.test(line)) {
            secrets.push({
              file: filePath,
              line: i + 1,
              type,
              pattern: pattern.source,
              redacted: true,
            });
          }
        }
      }
    } catch {
      // File not readable
    }

    return secrets;
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  /**
   * Calculate scan statistics
   */
  private calculateStatistics(files: ScannedFile[], scanDuration: number): ScanStatistics {
    const languageBreakdown: Record<FileLanguage, number> = {
      typescript: 0,
      javascript: 0,
      json: 0,
      yaml: 0,
      markdown: 0,
      other: 0,
    };

    let totalLines = 0;
    let aiRelatedFiles = 0;

    for (const file of files) {
      languageBreakdown[file.language]++;
      totalLines += file.lines;
      if (file.hasAIUsage) {
        aiRelatedFiles++;
      }
    }

    return {
      totalFiles: files.length,
      totalLines,
      languageBreakdown,
      aiRelatedFiles,
      scanDuration,
    };
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  /**
   * Clear the scan cache
   */
  clearCache(): void {
    this.scanCache.clear();
  }

  /**
   * Get cached scan for a project
   */
  getCachedScan(projectPath: string): ProjectScan | undefined {
    return this.scanCache.get(projectPath);
  }

  /**
   * Get files with AI usage from a scan
   */
  getAIRelatedFiles(scan: ProjectScan): ScannedFile[] {
    return scan.files.filter((f) => f.hasAIUsage);
  }

  /**
   * Get files by language from a scan
   */
  getFilesByLanguage(scan: ProjectScan, language: FileLanguage): ScannedFile[] {
    return scan.files.filter((f) => f.language === language);
  }

  /**
   * Check if project has a specific AI provider
   */
  hasAIProvider(scan: ProjectScan, provider: AIProvider): boolean {
    return scan.dependencies.aiPackages.some((p) => p.provider === provider);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Tank agent instance
 *
 * "I know what you're thinking, because right now I'm thinking the same thing."
 */
export function createTank(config?: AgentConfig): Tank {
  return new Tank(config);
}
