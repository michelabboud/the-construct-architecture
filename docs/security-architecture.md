# The Construct - Security Architecture

> *"The Matrix has you."* — But not on our watch.

## Security by Design

Security in The Construct is not an afterthought—it's embedded from day one. Agent Smith and his team ensure that every component, every interaction, and every piece of data is protected.

---

## Core Security Principles

### 1. Zero Trust
```
┌─────────────────────────────────────────────────────────┐
│                    ZERO TRUST MODEL                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║              NEVER TRUST, ALWAYS VERIFY            ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                         │
│  • Verify explicitly (identity, device, location)       │
│  • Use least privilege access                           │
│  • Assume breach at all times                           │
│  • Verify every request, every time                     │
│                                                         │
│  Traditional: Trust but verify                          │
│  Zero Trust: Never trust, always verify                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Defense in Depth
```
                    ┌─────────────────┐
                    │   PERIMETER     │ ◄── Seraph (Gateway)
                    │    (Layer 1)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   IDENTITY      │ ◄── Agent Brown
                    │    (Layer 2)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    ACCESS       │ ◄── Agent Jones
                    │    (Layer 3)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   DETECTION     │ ◄── Agent Johnson
                    │    (Layer 4)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ENFORCEMENT    │ ◄── Sentinels
                    │    (Layer 5)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     AUDIT       │ ◄── Agent Thompson
                    │    (Layer 6)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    RESPONSE     │ ◄── Agent Jackson
                    │    (Layer 7)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   RESILIENCE    │ ◄── The Twins
                    │    (Layer 8)    │
                    └─────────────────┘
```

### 3. Assume Breach

We design as if attackers are already inside:

- **Segment everything:** Limit blast radius
- **Monitor everything:** Detect anomalies fast
- **Log everything:** Enable forensics
- **Test everything:** Continuous validation via chaos engineering

---

## Security Team Structure

```
                    ┌─────────────────────────────────────┐
                    │           AGENT SMITH               │
                    │     Chief Security Orchestrator     │
                    └──────────────────┬──────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│  PREVENTION   │             │  DETECTION    │             │   RESPONSE    │
└───────┬───────┘             └───────┬───────┘             └───────┬───────┘
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│ Agent Brown   │             │ Agent Johnson │             │ Agent Jackson │
│ Authentication│             │ Threat Detect │             │ Inc. Response │
├───────────────┤             ├───────────────┤             ├───────────────┤
│ Agent Jones   │             │ Agent Thompson│             │  The Twins    │
│ Authorization │             │ Audit/Comply  │             │ Chaos Testing │
├───────────────┤             └───────────────┘             └───────────────┘
│    Seraph     │
│  API Gateway  │
└───────────────┘
```

---

## Security Components Detail

### Seraph - API Gateway (Zero Trust Entry Point)

```
                         EXTERNAL WORLD
                              │
                              ▼
                    ┌─────────────────┐
                    │                 │
                    │     SERAPH      │
                    │   API Gateway   │
                    │                 │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │  Auth   │        │  Rate   │        │  Input  │
    │  Check  │        │  Limit  │        │Validate │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   VALIDATED     │
                    │    REQUEST      │
                    └─────────────────┘
```

**Security Features:**
- TLS 1.3 termination with mTLS support
- JWT/API key validation
- Request rate limiting per identity
- Input validation and sanitization
- SQL injection / XSS protection
- Request size limits
- Geographic restrictions
- IP allowlisting/blocklisting

### Agent Brown - Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT BROWN                                 │
│                  Authentication Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Request ──► Extract ──► Validate ──► MFA? ──► Create ──► OK   │
│              Credentials   Token        │       Session          │
│                              │          │                        │
│                              ▼          ▼                        │
│                           Invalid    Challenge                   │
│                              │          │                        │
│                              ▼          ▼                        │
│                           REJECT    Verify MFA                   │
│                                        │                        │
│                                     ┌──┴──┐                     │
│                                     │     │                      │
│                                    OK   FAIL                     │
│                                     │     │                      │
│                                Continue  REJECT                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Supported Auth Methods:**
| Method | Description | Use Case |
|--------|-------------|----------|
| JWT | JSON Web Tokens | API access |
| API Key | Static keys with rotation | Service-to-service |
| OAuth 2.0 | Delegated authorization | Third-party apps |
| mTLS | Mutual TLS certificates | High-security services |
| MFA | Multi-factor (TOTP, WebAuthn) | Sensitive operations |

### Agent Jones - Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT JONES                               │
│                    Authorization Engine                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌───────────────────┐                        │
│                    │  Identity + Action │                        │
│                    │    + Resource      │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              │               │               │                   │
│              ▼               ▼               ▼                   │
│        ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│        │  RBAC   │     │  ABAC   │     │Contract │              │
│        │  Check  │     │  Check  │     │  Check  │              │
│        └────┬────┘     └────┬────┘     └────┬────┘              │
│              │               │               │                   │
│              └───────────────┼───────────────┘                  │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  ALLOW / DENY   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**RBAC Roles:**
```yaml
roles:
  admin:
    permissions: ["*"]
    description: Full system access

  developer:
    permissions:
      - contracts:create
      - contracts:read
      - contracts:execute
      - agents:read
      - agents:configure
      - results:read
    description: Create and run contracts

  operator:
    permissions:
      - contracts:read
      - contracts:execute
      - agents:read
      - results:read
      - monitoring:read
    description: Operate existing contracts

  viewer:
    permissions:
      - contracts:read
      - agents:read
      - results:read
    description: Read-only access

  agent:
    permissions:
      - tools:execute
      - outputs:write
      - self:read
    description: AI agent permissions
```

### Agent Johnson - Threat Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT JOHNSON                               │
│                   Threat Detection Engine                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                   Activity Stream                    │      │
│    └─────────────────────────┬───────────────────────────┘      │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐         │
│   │  Pattern  │       │  Anomaly  │       │   Rate    │         │
│   │  Matching │       │ Detection │       │  Analysis │         │
│   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘         │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                             ▼                                    │
│                   ┌─────────────────┐                           │
│                   │ Threat Scoring  │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│    ┌─────────┐       ┌─────────┐       ┌─────────┐              │
│    │  ALLOW  │       │  ALERT  │       │  BLOCK  │              │
│    │(Score<3)│       │(Score<7)│       │(Score≥7)│              │
│    └─────────┘       └─────────┘       └─────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Threat Patterns:**
| Pattern | Detection Method | Score | Action |
|---------|------------------|-------|--------|
| Brute Force | 5+ failed auths in 60s | 8 | Block + Alert |
| SQL Injection | Regex pattern match | 9 | Block + Alert |
| XSS Attempt | Script tag detection | 7 | Block |
| Privilege Escalation | Role change sequence | 9 | Block + Alert |
| Data Exfiltration | Unusual data volume | 6 | Alert |
| Credential Stuffing | Multiple user attempts | 7 | Block |

### Agent Thompson - Audit & Compliance

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT THOMPSON                               │
│                   Audit & Compliance                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │   All Events    │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│    ┌────────────────────────────────────────────────────┐       │
│    │              IMMUTABLE AUDIT LOG                    │       │
│    │  ┌──────┬──────┬──────┬──────┬──────┬──────┐      │       │
│    │  │Event1│Event2│Event3│Event4│Event5│......│      │       │
│    │  │ hash │◄─────│◄─────│◄─────│◄─────│      │      │       │
│    │  └──────┴──────┴──────┴──────┴──────┴──────┘      │       │
│    │         (Blockchain-style hash chain)              │       │
│    └────────────────────────────────────────────────────┘       │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐         │
│   │ Compliance│       │ Forensic  │       │ Retention │         │
│   │  Reports  │       │  Queries  │       │  Policies │         │
│   └───────────┘       └───────────┘       └───────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Audit Log Entry:**
```typescript
interface AuditEntry {
  // Unique identifier
  id: string;
  timestamp: Date;

  // Actor (who)
  actor: {
    type: 'neo' | 'agent' | 'system' | 'admin';
    id: string;
    ip?: string;
    sessionId?: string;
  };

  // Action (what)
  action: {
    category: 'auth' | 'authz' | 'data' | 'config' | 'security';
    type: string;
    description: string;
  };

  // Resource (on what)
  resource: {
    type: string;
    id: string;
    path?: string;
  };

  // Outcome
  result: {
    status: 'success' | 'failure' | 'error';
    reason?: string;
  };

  // Integrity chain
  previousHash: string;
  hash: string;
}
```

### Agent Jackson - Incident Response

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT JACKSON                               │
│                   Incident Response Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│   │ PREPARE  │──►│  DETECT  │──►│ ANALYZE  │──►│ CONTAIN  │    │
│   └──────────┘   └──────────┘   └──────────┘   └────┬─────┘    │
│                                                      │          │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐        │          │
│   │ IMPROVE  │◄──│ RECOVER  │◄──│ERADICATE │◄───────┘          │
│   └──────────┘   └──────────┘   └──────────┘                    │
│                                                                  │
│   Severity Levels:                                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ P1 CRITICAL │ Active breach, data loss       │ < 15 min │   │
│   │ P2 HIGH     │ Potential breach, exploits     │ < 1 hour │   │
│   │ P3 MEDIUM   │ Policy violation, anomalies    │ < 4 hours│   │
│   │ P4 LOW      │ Minor issues, investigation    │ < 24 hrs │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Twins - Chaos Engineering

```
┌─────────────────────────────────────────────────────────────────┐
│                         THE TWINS                                │
│              Chaos Engineering & Penetration Testing             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────┐   ┌─────────────────────────┐     │
│   │         GHOST           │   │        PHANTOM          │     │
│   │     Fault Injection     │   │   Penetration Testing   │     │
│   ├─────────────────────────┤   ├─────────────────────────┤     │
│   │ • Network Chaos         │   │ • Attack Simulation     │     │
│   │   - Latency injection   │   │   - Brute force         │     │
│   │   - Packet loss         │   │   - Injection attacks   │     │
│   │   - Network partition   │   │   - Privilege escalation│     │
│   │                         │   │                         │     │
│   │ • Resource Chaos        │   │ • Vulnerability Scan    │     │
│   │   - CPU exhaustion      │   │   - CVE checking        │     │
│   │   - Memory pressure     │   │   - Misconfiguration    │     │
│   │   - Disk filling        │   │   - Dependency audit    │     │
│   │                         │   │                         │     │
│   │ • Service Chaos         │   │ • Social Engineering    │     │
│   │   - Process killing     │   │   - Phishing simulation │     │
│   │   - Restart loops       │   │   - Credential testing  │     │
│   │   - Degradation         │   │                         │     │
│   └─────────────────────────┘   └─────────────────────────┘     │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   CHAOS EXPERIMENT                       │   │
│   │  1. Define Hypothesis: "System recovers in < 30s"       │   │
│   │  2. Inject Fault: Kill primary service                  │   │
│   │  3. Observe: Monitor metrics and behavior               │   │
│   │  4. Validate: Check against hypothesis                  │   │
│   │  5. Learn: Document findings and improve                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE SECURITY FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                 NEO (Developer)
                                      │
                                      │ Request
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SERAPH                                         │
│                            (API Gateway)                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   TLS    │─►│  Rate    │─►│  Input   │─►│  Route   │─►│ Forward  │      │
│  │Terminate │  │  Limit   │  │ Validate │  │ Decide   │  │ Request  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AGENT BROWN                                      │
│                           (Authentication)                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Extract  │─►│ Validate │─►│   MFA    │─►│ Create   │                     │
│  │  Token   │  │  Token   │  │  Check   │  │ Session  │                     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ Identity
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AGENT JONES                                      │
│                           (Authorization)                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │   RBAC   │─►│   ABAC   │─►│ Contract │─►│  Grant   │                     │
│  │  Check   │  │  Check   │  │  Check   │  │  Access  │                     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ Authorized Request
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AGENT JOHNSON                                     │
│                          (Threat Detection)                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Pattern  │─►│ Anomaly  │─►│  Score   │─►│  Allow/  │                     │
│  │  Match   │  │ Detect   │  │ Threat   │  │  Block   │                     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ Clean Request
                                    ▼
                    ┌───────────────────────────────┐
                    │           THE AGENTS          │
                    │     (Contract Execution)      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SENTINELS                                        │
│                            (Enforcement)                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  Action  │─►│  Output  │─►│  Audit   │─►│  Report  │                     │
│  │ Validate │  │ Validate │  │   Log    │  │  Result  │                     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT THOMPSON                                     │
│                              (Audit)                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                     IMMUTABLE AUDIT LOG                           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                             Response to NEO
```

---

## Security Configuration

### Security Policy Schema

```yaml
# .construct/security.yaml
security:
  # Zero Trust settings
  zero_trust:
    enabled: true
    verify_every_request: true
    default_deny: true

  # Authentication
  authentication:
    methods:
      - jwt
      - api_key
      - mtls
    mfa:
      required_for:
        - admin_actions
        - sensitive_data
        - production_deploy
    session:
      timeout_minutes: 60
      max_concurrent: 5

  # Authorization
  authorization:
    model: rbac_with_abac
    default_role: viewer
    privilege_escalation:
      requires_approval: true
      notify: [security_team]

  # Rate limiting
  rate_limits:
    default:
      requests_per_minute: 100
      burst: 20
    by_role:
      admin: { rpm: 500, burst: 100 }
      developer: { rpm: 200, burst: 50 }
      agent: { rpm: 1000, burst: 200 }

  # Threat detection
  threat_detection:
    brute_force:
      threshold: 5
      window_seconds: 60
      block_duration_minutes: 15
    injection:
      patterns:
        - sql_injection
        - xss
        - command_injection
      action: block_and_alert

  # Audit
  audit:
    log_level: all
    retention_days: 90
    integrity_check: blockchain_hash
    export_format: json

  # Chaos testing (only in non-production)
  chaos:
    enabled_environments:
      - development
      - staging
    schedule:
      fault_injection: "0 2 * * *"  # Daily at 2 AM
      pen_test: "0 3 * * 0"         # Weekly Sunday 3 AM
```

---

## Security Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT SMITH - SECURITY DASHBOARD                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THREAT LEVEL: ██████░░░░ MODERATE          Last Updated: 2026-01-24 15:30  │
│                                                                              │
│  ┌─────────────────────────────────────┬─────────────────────────────────┐  │
│  │          TODAY'S METRICS            │        ACTIVE THREATS           │  │
│  ├─────────────────────────────────────┼─────────────────────────────────┤  │
│  │  Requests:          1,247,893       │  Critical:    0                 │  │
│  │  Blocked:              2,341 (0.2%) │  High:        2                 │  │
│  │  Auth Failures:          847        │  Medium:      5                 │  │
│  │  Anomalies:               23        │  Low:        12                 │  │
│  └─────────────────────────────────────┴─────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────┬─────────────────────────────────┐  │
│  │         AGENT STATUS                │       RECENT INCIDENTS          │  │
│  ├─────────────────────────────────────┼─────────────────────────────────┤  │
│  │  Brown (Auth):      ✓ HEALTHY       │  • Brute force blocked (14:23) │  │
│  │  Jones (Authz):     ✓ HEALTHY       │  • Rate limit triggered (14:10)│  │
│  │  Johnson (Detect):  ✓ HEALTHY       │  • SQL injection blocked (13:45)│  │
│  │  Thompson (Audit):  ✓ HEALTHY       │  • Anomaly investigated (12:30)│  │
│  │  Jackson (Response):✓ HEALTHY       │                                 │  │
│  │  Seraph (Gateway):  ✓ HEALTHY       │                                 │  │
│  │  The Twins (Chaos): ✓ READY         │                                 │  │
│  └─────────────────────────────────────┴─────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    COMPLIANCE STATUS                                 │    │
│  │  SOC2: ██████████ 100%  │  GDPR: █████████░ 94%  │  ISO27001: ████████░ 89%  │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps: Implementation

See [Implementation Plan - Phase 6](./implementation-plan.md#phase-6-security-architecture) for detailed implementation steps.

**Phase 6a:** Agent Smith + Seraph (Core security framework)
**Phase 6b:** Agent Brown, Jones, Johnson, Thompson, Jackson
**Phase 6c:** The Twins (Chaos Engineering)
