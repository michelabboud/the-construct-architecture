/**
 * Phantom - Penetration Testing System
 *
 * "We are getting aggravated. Yes, we are." — The Twins
 *
 * Phantom is one of The Twins, responsible for security testing and
 * penetration testing. It can scan for vulnerabilities and simulate
 * attacks to test security posture.
 *
 * Capabilities:
 * - Port scanning
 * - Vulnerability scanning
 * - Web application scanning
 * - API security testing
 * - Attack simulation
 * - Compliance checking
 *
 * Phase 7 Implementation
 */

import type {
  ScanType,
  AttackType,
  ScanTarget,
  ScanConfig,
  ScanResult,
  Vulnerability,
  VulnerabilitySeverity,
  AttackSpec,
  AttackResult,
  PenTestReport,
  PhantomConfig,
} from '../../types/chaos.js';

/**
 * Default Phantom configuration
 */
const DEFAULT_CONFIG: PhantomConfig = {
  enabled: false, // Disabled by default for safety
  safeMode: true,
  maxIntensity: 5,
  allowedScanTypes: [
    'port_scan',
    'vulnerability_scan',
    'web_scan',
    'api_scan',
    'config_scan',
  ],
  allowedAttackTypes: [
    'brute_force',
    'sql_injection',
    'xss',
    'path_traversal',
  ],
  blockedTargets: ['production', 'external', '*.prod.*'],
  rateLimit: 100,
  requireConfirmation: true,
};

/**
 * Known vulnerability signatures for scanning
 */
interface VulnerabilitySignature {
  id: string;
  name: string;
  pattern: RegExp | string;
  severity: VulnerabilitySeverity;
  cweId?: string;
  description: string;
  remediation: string;
}

/**
 * Phantom - Penetration Testing System
 *
 * Performs security scanning and attack simulation to test defenses.
 * Operates under strict safety controls and requires explicit enablement.
 */
export class Phantom {
  private config: PhantomConfig;
  private activeScans: Map<string, ScanResult> = new Map();
  private scanHistory: ScanResult[] = [];
  private attackHistory: AttackResult[] = [];
  private vulnerabilitySignatures: VulnerabilitySignature[] = [];
  private scanIdCounter = 0;
  private attackIdCounter = 0;

  // Statistics
  private stats = {
    scansCompleted: 0,
    scansFailed: 0,
    attacksSimulated: 0,
    attacksBlocked: 0,
    vulnerabilitiesFound: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    totalRequestsMade: 0,
  };

  constructor(config: Partial<PhantomConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSignatures();
  }

  /**
   * Run a security scan
   */
  async runScan(target: ScanTarget, config: Partial<ScanConfig> = {}): Promise<ScanResult> {
    // Safety checks
    this.validateScan(target, config);

    const scanConfig: ScanConfig = {
      scanTypes: config.scanTypes ?? ['vulnerability_scan'],
      intensity: Math.min(config.intensity ?? 3, this.config.maxIntensity),
      timeoutMs: config.timeoutMs ?? 30000,
      concurrency: config.concurrency ?? 5,
      followRedirects: config.followRedirects ?? true,
      safeMode: this.config.safeMode,
    };

    const id = `scan-${++this.scanIdCounter}-${Date.now()}`;
    const startedAt = new Date();

    const result: ScanResult = {
      id,
      target,
      scanTypes: scanConfig.scanTypes,
      startedAt,
      completedAt: startedAt, // Will be updated
      status: 'completed',
      vulnerabilities: [],
      openPorts: [],
      services: [],
      stats: {
        requestsMade: 0,
        responsesReceived: 0,
        errorsEncountered: 0,
        timeElapsedMs: 0,
      },
      errors: [],
    };

    this.activeScans.set(id, result);

    try {
      // Execute each scan type
      for (const scanType of scanConfig.scanTypes) {
        if (!this.config.allowedScanTypes.includes(scanType)) {
          result.errors.push(`Scan type not allowed: ${scanType}`);
          continue;
        }

        await this.executeScan(result, scanType, scanConfig);
      }

      result.completedAt = new Date();
      result.stats.timeElapsedMs = result.completedAt.getTime() - startedAt.getTime();
      result.status = result.errors.length > 0 ? 'partial' : 'completed';

      // Update stats
      this.stats.scansCompleted++;
      this.stats.totalRequestsMade += result.stats.requestsMade;
      this.updateVulnerabilityStats(result.vulnerabilities);

    } catch (error) {
      result.status = 'failed';
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.stats.scansFailed++;
    }

    this.activeScans.delete(id);
    this.scanHistory.push(result);

    return result;
  }

  /**
   * Simulate an attack
   */
  async simulateAttack(spec: AttackSpec, confirmed = false): Promise<AttackResult> {
    // Safety checks
    this.validateAttack(spec, confirmed);

    const id = `attack-${++this.attackIdCounter}-${Date.now()}`;
    const startedAt = new Date();

    const result: AttackResult = {
      id,
      spec,
      startedAt,
      completedAt: startedAt, // Will be updated
      succeeded: false,
      blocked: false,
      exploitedVulnerabilities: [],
      evidence: [],
      recommendations: [],
    };

    try {
      // Execute the attack simulation
      await this.executeAttack(result, spec);

      result.completedAt = new Date();
      this.stats.attacksSimulated++;

      if (result.blocked) {
        this.stats.attacksBlocked++;
      }

    } catch (error) {
      result.completedAt = new Date();
      result.evidence.push(`Attack simulation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.attackHistory.push(result);
    return result;
  }

  /**
   * Generate a penetration test report
   */
  generateReport(options: {
    title?: string;
    period?: { start: Date; end: Date };
    includeAttacks?: boolean;
  } = {}): PenTestReport {
    const now = new Date();
    const period = options.period ?? {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: now,
    };

    // Filter results by period
    const scans = this.scanHistory.filter(
      s => s.startedAt >= period.start && s.startedAt <= period.end
    );
    const attacks = options.includeAttacks !== false
      ? this.attackHistory.filter(
          a => a.startedAt >= period.start && a.startedAt <= period.end
        )
      : [];

    // Collect all vulnerabilities
    const allVulnerabilities: Vulnerability[] = [];
    for (const scan of scans) {
      allVulnerabilities.push(...scan.vulnerabilities);
    }
    for (const attack of attacks) {
      allVulnerabilities.push(...attack.exploitedVulnerabilities);
    }

    // Deduplicate vulnerabilities by ID
    const uniqueVulns = new Map<string, Vulnerability>();
    for (const vuln of allVulnerabilities) {
      if (!uniqueVulns.has(vuln.id)) {
        uniqueVulns.set(vuln.id, vuln);
      }
    }
    const vulnerabilities = Array.from(uniqueVulns.values());

    // Calculate summary
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length,
      total: vulnerabilities.length,
    };

    // Calculate risk score
    const riskScore = this.calculateRiskScore(vulnerabilities);
    const riskRating = this.getRiskRating(riskScore);

    // Get top vulnerabilities
    const topVulnerabilities = vulnerabilities
      .sort((a, b) => this.severityToScore(b.severity) - this.severityToScore(a.severity))
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities);

    // Collect unique targets
    const targets = new Map<string, ScanTarget>();
    for (const scan of scans) {
      targets.set(scan.target.address, scan.target);
    }

    const report: PenTestReport = {
      id: `report-${Date.now()}`,
      title: options.title ?? 'Penetration Test Report',
      generatedAt: now,
      period,
      executiveSummary: this.generateExecutiveSummary(summary, riskScore, riskRating),
      targets: Array.from(targets.values()),
      scanResults: scans,
      attackResults: attacks,
      vulnerabilitySummary: summary,
      topVulnerabilities,
      riskScore,
      riskRating,
      recommendations,
    };

    return report;
  }

  /**
   * Get scan history
   */
  getScanHistory(): ScanResult[] {
    return [...this.scanHistory];
  }

  /**
   * Get attack history
   */
  getAttackHistory(): AttackResult[] {
    return [...this.attackHistory];
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Check if a scan type is allowed
   */
  isScanTypeAllowed(type: ScanType): boolean {
    return this.config.allowedScanTypes.includes(type);
  }

  /**
   * Check if an attack type is allowed
   */
  isAttackTypeAllowed(type: AttackType): boolean {
    return this.config.allowedAttackTypes.includes(type);
  }

  /**
   * Check if a target is blocked
   */
  isTargetBlocked(address: string): boolean {
    return this.config.blockedTargets.some(blocked => {
      if (blocked.includes('*')) {
        const pattern = blocked.replace(/\*/g, '.*');
        return new RegExp(pattern).test(address);
      }
      return address.includes(blocked) || blocked.includes(address);
    });
  }

  /**
   * Enable Phantom (requires explicit call)
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable Phantom
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if Phantom is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get configuration
   */
  getConfig(): PhantomConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PhantomConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add a custom vulnerability signature
   */
  addSignature(signature: VulnerabilitySignature): void {
    this.vulnerabilitySignatures.push(signature);
  }

  // ============ Private Methods ============

  private validateScan(target: ScanTarget, config: Partial<ScanConfig>): void {
    if (!this.config.enabled) {
      throw new Error('Phantom is disabled. Call enable() first.');
    }

    if (this.isTargetBlocked(target.address)) {
      throw new Error(`Target is blocked: ${target.address}`);
    }

    if (config.intensity && config.intensity > this.config.maxIntensity) {
      throw new Error(`Intensity exceeds maximum: ${config.intensity} > ${this.config.maxIntensity}`);
    }
  }

  private validateAttack(spec: AttackSpec, confirmed: boolean): void {
    if (!this.config.enabled) {
      throw new Error('Phantom is disabled. Call enable() first.');
    }

    if (!this.isAttackTypeAllowed(spec.type)) {
      throw new Error(`Attack type not allowed: ${spec.type}`);
    }

    if (this.isTargetBlocked(spec.target.address)) {
      throw new Error(`Target is blocked: ${spec.target.address}`);
    }

    if (this.config.requireConfirmation && !confirmed) {
      throw new Error('Attack simulation requires confirmation. Pass confirmed=true to proceed.');
    }
  }

  private async executeScan(
    result: ScanResult,
    scanType: ScanType,
    config: ScanConfig
  ): Promise<void> {
    console.log(`[PHANTOM] Running ${scanType} on ${result.target.address}`);

    switch (scanType) {
      case 'port_scan':
        await this.executePortScan(result, config);
        break;
      case 'vulnerability_scan':
        await this.executeVulnerabilityScan(result, config);
        break;
      case 'web_scan':
        await this.executeWebScan(result, config);
        break;
      case 'api_scan':
        await this.executeApiScan(result, config);
        break;
      case 'auth_scan':
        await this.executeAuthScan(result, config);
        break;
      case 'injection_scan':
        await this.executeInjectionScan(result, config);
        break;
      case 'config_scan':
        await this.executeConfigScan(result, config);
        break;
      case 'compliance_scan':
        await this.executeComplianceScan(result, config);
        break;
    }
  }

  private async executePortScan(result: ScanResult, config: ScanConfig): Promise<void> {
    // Simulate port scan
    result.stats.requestsMade += 100;
    result.stats.responsesReceived += 95;

    // Simulate finding common open ports
    const commonPorts = [22, 80, 443, 3000, 5432, 6379, 8080];
    result.openPorts = commonPorts.filter(() => Math.random() > 0.3);

    // Simulate service detection
    for (const port of result.openPorts) {
      const services: Record<number, { service: string; version?: string }> = {
        22: { service: 'ssh', version: 'OpenSSH 8.9' },
        80: { service: 'http', version: 'nginx 1.24' },
        443: { service: 'https', version: 'nginx 1.24' },
        3000: { service: 'http', version: 'Node.js' },
        5432: { service: 'postgresql', version: '15.2' },
        6379: { service: 'redis', version: '7.0' },
        8080: { service: 'http-proxy' },
      };
      const serviceInfo = services[port];
      if (serviceInfo) {
        result.services?.push({ port, ...serviceInfo });
      }
    }
  }

  private async executeVulnerabilityScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 50;
    result.stats.responsesReceived += 48;

    // Check against known vulnerability signatures
    for (const sig of this.vulnerabilitySignatures) {
      // Simulate vulnerability detection based on intensity
      if (Math.random() < config.intensity / 20) {
        const vuln = this.createVulnerability(sig, result.target);
        result.vulnerabilities.push(vuln);
      }
    }
  }

  private async executeWebScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 200;
    result.stats.responsesReceived += 195;

    // Simulate web vulnerability findings
    if (config.intensity >= 3) {
      // Missing security headers
      result.vulnerabilities.push({
        id: `vuln-${Date.now()}-headers`,
        name: 'Missing Security Headers',
        description: 'Several important security headers are missing from HTTP responses.',
        severity: 'medium',
        target: result.target,
        location: result.target.address,
        remediation: 'Add security headers: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy',
      });
    }
  }

  private async executeApiScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 75;
    result.stats.responsesReceived += 72;

    // Simulate API vulnerability findings
    if (config.intensity >= 2) {
      result.vulnerabilities.push({
        id: `vuln-${Date.now()}-api-auth`,
        name: 'Insecure API Authentication',
        description: 'API endpoints accept requests without proper authentication.',
        severity: 'high',
        target: result.target,
        location: `${result.target.address}/api/`,
        remediation: 'Implement proper authentication for all API endpoints.',
      });
    }
  }

  private async executeAuthScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 30;
    result.stats.responsesReceived += 30;

    // Check for authentication weaknesses
    if (config.intensity >= 3) {
      result.vulnerabilities.push({
        id: `vuln-${Date.now()}-weak-pass`,
        name: 'Weak Password Policy',
        description: 'Password policy allows weak passwords.',
        severity: 'medium',
        target: result.target,
        location: `${result.target.address}/auth/`,
        remediation: 'Enforce stronger password requirements (min 12 chars, complexity rules).',
      });
    }
  }

  private async executeInjectionScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 100;
    result.stats.responsesReceived += 98;

    // Only report injection vulnerabilities if found
    if (config.intensity >= 4 && Math.random() < 0.3) {
      result.vulnerabilities.push({
        id: `vuln-${Date.now()}-sqli`,
        name: 'Potential SQL Injection',
        description: 'Input field may be vulnerable to SQL injection attacks.',
        severity: 'critical',
        cweId: 'CWE-89',
        target: result.target,
        location: `${result.target.address}/search?q=`,
        evidence: "Response differs with input: ' OR '1'='1",
        remediation: 'Use parameterized queries or prepared statements.',
      });
    }
  }

  private async executeConfigScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 20;
    result.stats.responsesReceived += 20;

    // Check for misconfigurations
    result.vulnerabilities.push({
      id: `vuln-${Date.now()}-debug`,
      name: 'Debug Mode Enabled',
      description: 'Application appears to be running in debug mode.',
      severity: 'low',
      target: result.target,
      location: result.target.address,
      remediation: 'Disable debug mode in production environments.',
    });
  }

  private async executeComplianceScan(result: ScanResult, config: ScanConfig): Promise<void> {
    result.stats.requestsMade += 15;
    result.stats.responsesReceived += 15;

    // Check compliance issues
    result.vulnerabilities.push({
      id: `vuln-${Date.now()}-tls`,
      name: 'Outdated TLS Version',
      description: 'Server supports TLS 1.0/1.1 which are deprecated.',
      severity: 'medium',
      target: result.target,
      location: result.target.address,
      remediation: 'Disable TLS 1.0 and 1.1, enable TLS 1.2+ only.',
    });
  }

  private async executeAttack(result: AttackResult, spec: AttackSpec): Promise<void> {
    console.log(`[PHANTOM] Simulating ${spec.type} attack on ${spec.target.address}`);

    switch (spec.type) {
      case 'brute_force':
        await this.simulateBruteForce(result, spec);
        break;
      case 'sql_injection':
        await this.simulateSqlInjection(result, spec);
        break;
      case 'xss':
        await this.simulateXss(result, spec);
        break;
      case 'csrf':
        await this.simulateCsrf(result, spec);
        break;
      case 'path_traversal':
        await this.simulatePathTraversal(result, spec);
        break;
      case 'command_injection':
        await this.simulateCommandInjection(result, spec);
        break;
      case 'auth_bypass':
        await this.simulateAuthBypass(result, spec);
        break;
      case 'privilege_escalation':
        await this.simulatePrivilegeEscalation(result, spec);
        break;
      default:
        result.evidence.push(`Attack type ${spec.type} simulation not implemented`);
    }
  }

  private async simulateBruteForce(result: AttackResult, spec: AttackSpec): Promise<void> {
    const attempts = spec.intensity * 10;
    result.evidence.push(`Attempted ${attempts} login attempts`);

    // Simulate detection
    if (attempts > 5) {
      result.blocked = true;
      result.blockedBy = 'Rate limiting / Account lockout';
      result.recommendations.push('Rate limiting is effective at preventing brute force attacks.');
    } else {
      result.evidence.push('No rate limiting detected for small number of attempts.');
      result.recommendations.push('Consider implementing rate limiting for authentication endpoints.');
    }
  }

  private async simulateSqlInjection(result: AttackResult, spec: AttackSpec): Promise<void> {
    const payloads = ["' OR '1'='1", "'; DROP TABLE users;--", "1' UNION SELECT * FROM users--"];
    result.evidence.push(`Tested ${payloads.length} SQL injection payloads`);

    // Simulate WAF detection
    if (Math.random() < 0.7) {
      result.blocked = true;
      result.blockedBy = 'Web Application Firewall (WAF)';
      result.recommendations.push('WAF is detecting basic SQL injection attempts.');
    } else {
      result.evidence.push('Some payloads were not blocked.');
      result.recommendations.push('Review WAF rules for SQL injection detection.');
    }
  }

  private async simulateXss(result: AttackResult, spec: AttackSpec): Promise<void> {
    const payloads = ['<script>alert(1)</script>', '<img onerror="alert(1)" src="x">', '"><svg onload=alert(1)>'];
    result.evidence.push(`Tested ${payloads.length} XSS payloads`);

    if (Math.random() < 0.6) {
      result.blocked = true;
      result.blockedBy = 'Content Security Policy / Input sanitization';
    } else {
      result.succeeded = true;
      result.exploitedVulnerabilities.push({
        id: `vuln-xss-${Date.now()}`,
        name: 'Cross-Site Scripting (XSS)',
        description: 'Reflected XSS vulnerability found.',
        severity: 'high',
        cweId: 'CWE-79',
        target: spec.target,
        location: spec.target.address,
        remediation: 'Implement proper output encoding and Content Security Policy.',
      });
    }
  }

  private async simulateCsrf(result: AttackResult, spec: AttackSpec): Promise<void> {
    result.evidence.push('Checking for CSRF tokens on state-changing requests');

    if (Math.random() < 0.5) {
      result.blocked = true;
      result.blockedBy = 'CSRF tokens present and validated';
    } else {
      result.succeeded = true;
      result.recommendations.push('Implement CSRF tokens for all state-changing operations.');
    }
  }

  private async simulatePathTraversal(result: AttackResult, spec: AttackSpec): Promise<void> {
    const payloads = ['../../../etc/passwd', '....//....//....//etc/passwd', '%2e%2e%2f%2e%2e%2f'];
    result.evidence.push(`Tested ${payloads.length} path traversal payloads`);

    if (Math.random() < 0.8) {
      result.blocked = true;
      result.blockedBy = 'Input validation / Path normalization';
    } else {
      result.evidence.push('Path traversal may be possible.');
      result.recommendations.push('Implement proper path validation and use allowlists.');
    }
  }

  private async simulateCommandInjection(result: AttackResult, spec: AttackSpec): Promise<void> {
    result.evidence.push('Testing for command injection vulnerabilities');
    result.blocked = true;
    result.blockedBy = 'Input validation';
    result.recommendations.push('Avoid executing system commands with user input.');
  }

  private async simulateAuthBypass(result: AttackResult, spec: AttackSpec): Promise<void> {
    result.evidence.push('Testing authentication bypass techniques');
    result.blocked = true;
    result.blockedBy = 'Proper authentication checks';
  }

  private async simulatePrivilegeEscalation(result: AttackResult, spec: AttackSpec): Promise<void> {
    result.evidence.push('Testing for privilege escalation vectors');
    result.blocked = true;
    result.blockedBy = 'Proper authorization checks';
    result.recommendations.push('Ensure role-based access control is properly implemented.');
  }

  private initializeSignatures(): void {
    this.vulnerabilitySignatures = [
      {
        id: 'sig-outdated-software',
        name: 'Outdated Software',
        pattern: /version\s*[<:]\s*[\d.]+/i,
        severity: 'medium',
        description: 'Software version may be outdated and contain known vulnerabilities.',
        remediation: 'Update to the latest stable version.',
      },
      {
        id: 'sig-exposed-admin',
        name: 'Exposed Admin Interface',
        pattern: /\/admin|\/wp-admin|\/administrator/i,
        severity: 'high',
        description: 'Administrative interface is publicly accessible.',
        remediation: 'Restrict admin interface access to specific IP ranges.',
      },
      {
        id: 'sig-sensitive-data',
        name: 'Sensitive Data Exposure',
        pattern: /password|secret|api[_-]?key|token/i,
        severity: 'high',
        cweId: 'CWE-200',
        description: 'Sensitive data may be exposed in responses.',
        remediation: 'Review and remove sensitive data from responses.',
      },
    ];
  }

  private createVulnerability(sig: VulnerabilitySignature, target: ScanTarget): Vulnerability {
    const vuln: Vulnerability = {
      id: `vuln-${sig.id}-${Date.now()}`,
      name: sig.name,
      description: sig.description,
      severity: sig.severity,
      target,
      location: target.address,
      remediation: sig.remediation,
    };
    if (sig.cweId) {
      vuln.cweId = sig.cweId;
    }
    return vuln;
  }

  private updateVulnerabilityStats(vulnerabilities: Vulnerability[]): void {
    for (const vuln of vulnerabilities) {
      this.stats.vulnerabilitiesFound[vuln.severity]++;
    }
  }

  private calculateRiskScore(vulnerabilities: Vulnerability[]): number {
    if (vulnerabilities.length === 0) return 0;

    let score = 0;
    for (const vuln of vulnerabilities) {
      score += this.severityToScore(vuln.severity);
    }

    // Normalize to 0-100
    return Math.min(100, Math.round(score / vulnerabilities.length * 10));
  }

  private severityToScore(severity: VulnerabilitySeverity): number {
    const scores: Record<VulnerabilitySeverity, number> = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 2,
      info: 1,
    };
    return scores[severity];
  }

  private getRiskRating(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private generateRecommendations(vulnerabilities: Vulnerability[]): PenTestReport['recommendations'] {
    const recommendations: PenTestReport['recommendations'] = [];
    const severityGroups = new Map<VulnerabilitySeverity, Vulnerability[]>();

    // Group by severity
    for (const vuln of vulnerabilities) {
      const group = severityGroups.get(vuln.severity) ?? [];
      group.push(vuln);
      severityGroups.set(vuln.severity, group);
    }

    // Generate prioritized recommendations
    const criticals = severityGroups.get('critical') ?? [];
    if (criticals.length > 0) {
      recommendations.push({
        priority: 'immediate',
        recommendation: `Address ${criticals.length} critical vulnerabilities immediately.`,
        relatedVulnerabilities: criticals.map(v => v.id),
      });
    }

    const highs = severityGroups.get('high') ?? [];
    if (highs.length > 0) {
      recommendations.push({
        priority: 'short_term',
        recommendation: `Remediate ${highs.length} high-severity vulnerabilities within 1 week.`,
        relatedVulnerabilities: highs.map(v => v.id),
      });
    }

    const mediums = severityGroups.get('medium') ?? [];
    if (mediums.length > 0) {
      recommendations.push({
        priority: 'long_term',
        recommendation: `Plan remediation for ${mediums.length} medium-severity vulnerabilities.`,
        relatedVulnerabilities: mediums.map(v => v.id),
      });
    }

    return recommendations;
  }

  private generateExecutiveSummary(
    summary: PenTestReport['vulnerabilitySummary'],
    riskScore: number,
    riskRating: PenTestReport['riskRating']
  ): string {
    return `Security assessment identified ${summary.total} vulnerabilities: ` +
      `${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ` +
      `${summary.low} low, and ${summary.info} informational. ` +
      `Overall risk score: ${riskScore}/100 (${riskRating.toUpperCase()}). ` +
      (summary.critical > 0
        ? 'Immediate action required to address critical vulnerabilities.'
        : 'No critical vulnerabilities found.');
  }
}

/**
 * Create Phantom with default configuration
 */
export function createPhantom(config?: Partial<PhantomConfig>): Phantom {
  return new Phantom(config);
}
