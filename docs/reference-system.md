# Unified Reference System

> *"I know because I must know. It is my purpose."* — The Keymaker

## Overview

The Construct uses a URI-based reference system to link contracts to documentation, tools, schemas, and other resources. This provides a consistent way to reference anything in the system.

## URI Schemes

| Scheme | Purpose | Example |
|--------|---------|---------|
| `guide://` | Markdown documentation | `guide://project/style-guide.md` |
| `tool://` | Internal tools | `tool://quality-inspector` |
| `mcp://` | MCP server tools | `mcp://visual-forge/generate_image` |
| `agent://` | Agent types | `agent://worker` |
| `skill://` | Agent skills | `skill://image-generation` |
| `schema://` | JSON schemas | `schema://outputs/image-output` |
| `template://` | Prompt/contract templates | `template://prompts/character-illustration` |
| `config://` | Configuration values | `config://providers/gemini` |
| `architect://` | Source of Truth paths | `architect://rules/paths` |
| `oracle://` | Oracle data | `oracle://agent-profile/{agent_id}` |

## Enforcement Levels

References can be enforced at two levels:

### Strict
- Violation = task failure
- Contract cannot proceed if reference requirements not met
- Used for critical requirements

```yaml
references:
  guides:
    must_follow:
      - ref: "guide://project/security-policy.md"
        enforce: strict
```

### Advisory
- Violation = warning only
- Contract proceeds but logs warning
- Used for best practices

```yaml
references:
  guides:
    must_follow:
      - ref: "guide://project/style-guide.md"
        enforce: advisory
```

## Reference Resolution

### Path Resolution

References are resolved relative to configured base paths:

```yaml
# ~/.construct/truth/paths.yaml
reference_paths:
  guide: "~/.construct/guides/"
  schema: "~/.construct/schemas/"
  template: "~/.construct/templates/"
  config: "~/.construct/config/"
```

### Resolution Process

1. Parse URI scheme and path
2. Look up base path for scheme
3. Resolve full path
4. Load and cache content
5. Return resolved reference

```typescript
// Example
const resolver = new ReferenceResolver(architect);

// Resolves to: ~/.construct/guides/project/style-guide.md
const guide = await resolver.resolve('guide://project/style-guide.md');
```

## Reference Types

### Guide References

Markdown documentation that agents must follow.

```yaml
references:
  guides:
    must_follow:
      - ref: "guide://project/coding-standards.md"
        enforce: strict
        sections: ["naming", "formatting"]  # Optional: specific sections
```

### Tool References

Tools that the contract requires or forbids.

```yaml
references:
  tools:
    mcp:
      - ref: "mcp://visual-forge/generate_image"
        required: true
    internal:
      - ref: "tool://quality-inspector"
        required: false
```

### Agent References

Agent types and their minimum levels.

```yaml
references:
  agents:
    types:
      - ref: "agent://worker"
        min_level: reliable
      - ref: "agent://validator"
        min_level: trusted
    skills:
      - ref: "skill://image-generation"
```

### Schema References

JSON schemas for input/output validation.

```yaml
references:
  schemas:
    input:
      - ref: "schema://contracts/image-input"
    output:
      - ref: "schema://outputs/image-output"
```

### Config References

Configuration values from the Architect.

```yaml
references:
  config:
    - ref: "config://providers/gemini"
    - ref: "config://limits/costs"
```

### Architect References

Direct references to Architect truth.

```yaml
references:
  architect:
    - ref: "architect://rules/paths"
    - ref: "architect://limits/costs"
```

### Oracle References

References to Oracle data (with templating).

```yaml
references:
  oracle:
    - ref: "oracle://agent-profile/{agent_id}"
    - ref: "oracle://performance/{task_type}"
```

## Template Variables

References support template variables:

```yaml
ref: "oracle://agent-profile/{agent_id}"
```

Variables are resolved at runtime:
- `{agent_id}` - Current agent ID
- `{task_type}` - Contract task type
- `{project_id}` - Current project ID
- `{workflow_id}` - Current workflow ID

## Reference Caching

Resolved references are cached for performance:

```typescript
class ReferenceResolver {
  private cache: Map<string, ResolvedReference>;
  private ttl: number = 60000; // 1 minute default

  async resolve(uri: string): Promise<ResolvedReference> {
    const cached = this.cache.get(uri);
    if (cached && !this.isExpired(cached)) {
      return cached.value;
    }

    const resolved = await this.load(uri);
    this.cache.set(uri, { value: resolved, timestamp: Date.now() });
    return resolved;
  }
}
```

## Implementation

### ReferenceResolver Class

```typescript
export class ReferenceResolver {
  constructor(private architect: Architect) {}

  // Resolve a single reference
  async resolve(uri: string): Promise<ResolvedReference>;

  // Resolve all references in a contract
  async resolveAll(contract: Contract): Promise<ResolvedReferences>;

  // Check if all strict references are satisfied
  async validateStrict(contract: Contract): Promise<ValidationResult>;

  // Get advisory warnings
  async getAdvisoryWarnings(contract: Contract): Promise<Warning[]>;
}
```

### ResolvedReference Type

```typescript
interface ResolvedReference {
  uri: string;
  scheme: string;
  path: string;
  content: any;
  enforce: 'strict' | 'advisory';
  resolvedAt: Date;
}
```

## Example Usage

### In a Contract

```yaml
contract:
  id: "img-gen-001"
  type: "image_generation"

  references:
    guides:
      must_follow:
        - ref: "guide://visual-forge/character-consistency.md"
          enforce: strict
          sections: ["rules", "examples"]

    tools:
      mcp:
        - ref: "mcp://visual-forge/generate_with_consistency"
          required: true
        - ref: "mcp://visual-forge/list_characters"
          required: false

    schemas:
      output:
        - ref: "schema://outputs/generated-image"

    config:
      - ref: "config://providers/gemini"
```

### In Code

```typescript
const resolver = new ReferenceResolver(architect);

// Validate all strict references before execution
const validation = await resolver.validateStrict(contract);
if (!validation.valid) {
  throw new ContractValidationError(validation.errors);
}

// Get advisory warnings
const warnings = await resolver.getAdvisoryWarnings(contract);
warnings.forEach(w => logger.warn(w.message));

// Resolve a specific reference
const guide = await resolver.resolve('guide://visual-forge/character-consistency.md');
console.log(guide.content);
```
