# Contributing to The Construct

> *"I can only show you the door. You're the one that has to walk through it."* — Morpheus

First off, thank you for considering contributing to The Construct! This is a community project and we welcome contributions of all kinds.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Questions?](#questions)

## Code of Conduct

This project follows a simple code of conduct: **be kind, be respectful, be helpful**.

- Treat everyone with respect
- Be patient with newcomers
- Assume good intentions
- Focus on constructive feedback

## How Can I Contribute?

### Reporting Bugs

Found a bug? Please open an issue with:

1. **Clear title** describing the problem
2. **Steps to reproduce** the issue
3. **Expected behavior** vs. actual behavior
4. **Environment details** (Node version, OS, etc.)
5. **Code samples** if applicable

### Suggesting Features

Have an idea? We'd love to hear it! Open an issue with:

1. **Clear description** of the feature
2. **Use case** - why would this be useful?
3. **Proposed implementation** (optional but helpful)
4. **Alternatives considered** (if any)

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos and grammar
- Add examples and tutorials
- Clarify confusing sections
- Translate to other languages

### Contributing Code

Ready to code? Here's what we need help with:

- Bug fixes
- New features
- Performance improvements
- Test coverage
- Refactoring

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Getting Started

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/the-construct-architecture.git
cd the-construct-architecture

# Add upstream remote
git remote add upstream https://github.com/michelabboud/the-construct-architecture.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify setup
npm test
```

### Project Structure

```
the-construct-architecture/
├── src/
│   ├── architect/          # Source of Truth
│   ├── oracle/             # Judgment & XP system
│   ├── agents/             # Orchestration
│   ├── sentinels/          # QA & Validation
│   ├── programs/           # Workers
│   ├── keymaker/           # Provider adapter
│   ├── smith/              # Security
│   ├── chaos/              # Chaos engineering
│   ├── morpheus/           # Migration wizard
│   └── types/              # TypeScript types
├── test/                   # Test files
├── docs/                   # Documentation
└── GUIDE.md               # Complete guide
```

## Pull Request Process

### Before Submitting

1. **Create an issue first** for significant changes
2. **Fork and branch** from `main`
3. **Follow style guidelines** (see below)
4. **Write/update tests** for your changes
5. **Update documentation** if needed
6. **Run all tests** locally

### Branch Naming

Use descriptive branch names:

```
feature/add-new-provider
fix/oracle-xp-calculation
docs/improve-quickstart
refactor/keymaker-types
```

### Commit Messages

Write clear, concise commit messages:

```
feat: Add support for Azure OpenAI provider

- Add AzureProvider class to keymaker
- Update provider registry with Azure models
- Add configuration options for Azure endpoints
- Include tests for Azure provider

Closes #123
```

**Commit types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Adding tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Submitting the PR

1. **Push your branch** to your fork
2. **Open a PR** against `main`
3. **Fill out the PR template**
4. **Link related issues**
5. **Wait for review**

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged
- Celebrate! You're now a contributor!

## Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use enums for fixed sets of values

```typescript
// Good
interface ContractConfig {
  id: string;
  version: string;
  type: ContractType;
}

// Avoid
const config: any = { ... };
```

### Code Style

- Use 2-space indentation
- Use single quotes for strings
- Add trailing commas
- Use semicolons

```typescript
// Good
const config = {
  name: 'my-config',
  version: '1.0.0',
};

// Avoid
const config = {
  name: "my-config",
  version: "1.0.0"
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `contract-executor.ts` |
| Classes | PascalCase | `ContractExecutor` |
| Functions | camelCase | `executeContract` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `ContractConfig` |

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for public APIs

```typescript
/**
 * Execute a contract with the given input.
 *
 * @param contractId - The unique contract identifier
 * @param input - The input data for the contract
 * @returns The execution result
 * @throws ContractNotFoundError if contract doesn't exist
 */
async function execute(contractId: string, input: unknown): Promise<Result> {
  // ...
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="architect"

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests

- Place tests in `test/` directory
- Name test files `*.test.ts`
- Use descriptive test names
- Test both success and failure cases

```typescript
describe('Architect', () => {
  describe('loadConfig', () => {
    it('should load valid YAML config', async () => {
      const architect = createArchitect({ configPath: './test/fixtures/valid.yaml' });
      await expect(architect.load()).resolves.not.toThrow();
    });

    it('should throw on invalid config', async () => {
      const architect = createArchitect({ configPath: './test/fixtures/invalid.yaml' });
      await expect(architect.load()).rejects.toThrow('Invalid config');
    });
  });
});
```

### Test Coverage

We aim for high test coverage. Currently: **927 tests passing**.

When adding features:
- Add unit tests for new functions
- Add integration tests for new features
- Don't decrease existing coverage

## Documentation

### Updating Docs

- Keep README.md concise
- Add details to GUIDE.md
- Update docs/ for specific topics
- Include code examples

### Documentation Style

- Use clear, simple language
- Include practical examples
- Link to related documentation
- Keep the Matrix theme fun but not overwhelming

## Questions?

- **GitHub Issues:** For bugs and features
- **Discussions:** For questions and ideas

---

## Recognition

All contributors will be recognized in our documentation. Significant contributors may be added to the AUTHORS file.

---

> *"You have to understand, most of these people are not ready to be unplugged. And many of them are so inert, so hopelessly dependent on the system that they will fight to protect it."*
>
> But not you. You're here. You're ready to contribute.
>
> **Welcome to the real world.**

---

**Thank you for contributing to The Construct!**

*"There is no spoon."* — Spoon Boy
