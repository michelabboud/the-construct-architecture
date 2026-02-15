# Autonomous Orchestration Improvement Prompt for The Construct

> **How to use:** Open Claude Code in the `the-construct-architecture` repo and paste this entire prompt. Execute phase by phase — approve each phase before moving to the next. Alternatively: `claude -p "$(cat AUTONOMOUS-ORCHESTRATION-PROMPT.md)"`

---

## Context

You are working on **The Construct** (`/home/michel/projects/the-construct-architecture`), a reference architecture for AI orchestration. The project has:

- **63 source files** across 8 completed phases (Architect, Oracle, Agents, Sentinels, Programs, Keymaker, Agent Smith, Twins, Morpheus)
- **681 tests passing** (7 suites fail due to a TS typo in `src/architect/references/reference-resolver.ts:499` — `_currentSection` should be `__currentSection`)
- **Tech stack:** TypeScript, Zod 4.x, OpenAI SDK, sql.js, YAML, Jest, ESLint 9
- **Existing CLAUDE.md** with full project documentation
- **JOBS.md** with AI-resumable format
- **Global Claude settings** at `~/.claude/settings.json` with hooks, PostHog plugin, status line

The goal is to make this project capable of **long-running autonomous Claude Code sessions** and **easy bootstrapping onto new projects**.

---

## Phase 0: Fix the Existing TS Error (5 min)

Before anything else, fix the build:

1. Open `src/architect/references/reference-resolver.ts`
2. Line 499: Change `_currentSection` to `__currentSection` (matching the declaration at line 486)
3. Run `npm run typecheck` to verify
4. Run `npm test` to confirm all 681+ tests pass and 0 suites fail
5. Commit: `fix: correct variable name in reference-resolver.ts`

---

## Phase 1: State Management Files (30 min)

Create file-based state that survives context compaction. Claude Code auto-compresses old messages but cannot touch files on disk.

### 1a. Create `STATE.md`

Create `STATE.md` in the project root. This is the **live session state** that Claude Code reads at the start of every turn.

```markdown
# STATE - Live Session State
<!-- AI-RESUMABLE: Read this file at the start of every response -->
<!-- LAST_UPDATED: (timestamp) -->

## CURRENT_TASK
None

## COMPLETED_THIS_SESSION
(empty)

## BLOCKED
(empty)

## CONTEXT_NOTES
- All 8 phases complete, 681+ tests passing
- Branch: main
- Last release: v1.0.1

## DECISIONS_LOG
(empty — record architectural decisions here as they're made)
```

### 1b. Update CLAUDE.md with State Protocol

Add this section to `CLAUDE.md` after the "Important Notes" section:

```markdown
## Autonomous Session Protocol

### State Management
- **Read `STATE.md` at the start of every response** to recover context
- **Update `STATE.md` after completing each task** with what was done
- **Update `JOBS.md`** when starting or completing jobs
- State files are the source of truth for session continuity — they survive context compaction

### Work Loop
1. Read `STATE.md` → understand current position
2. Read `JOBS.md` → find next task
3. Execute task (typecheck + test after every code change)
4. Update `STATE.md` with results
5. Update `JOBS.md` to mark completion
6. Loop to step 1

### Quality Gates (MUST pass before any commit)
- `npm run typecheck` → zero errors
- `npm test` → all tests pass
- `npm run lint` → zero warnings

### Sub-Agent Patterns
- Use Task tool with `subagent_type=Explore` for codebase research
- Use Task tool with `subagent_type=qa-testing-expert` for test generation
- Use Task tool with `subagent_type=nodejs-typescript-backend-expert` for implementation
- Keep the main session as an orchestrator — delegate heavy implementation to sub-agents
- Never let the main context window fill with large code reads — delegate to sub-agents

### Error Recovery
- If a task fails 3 times, log it in `STATE.md` under BLOCKED with the error
- Move to the next task and come back later
- Never brute-force retry the same approach
```

### 1c. Update JOBS.md Format

Add a `NEXT_UP` section to `JOBS.md` between `ACTIVE_JOBS` and `RECENT_COMPLETED`:

```markdown
## NEXT_UP
<!-- Priority-ordered backlog. Move items to ACTIVE_JOBS when starting. -->

1. [ ] Fix TS error in reference-resolver.ts (Phase 0)
2. [ ] (future items go here)
```

---

## Phase 2: Project-Level Claude Configuration (20 min)

Create a `.claude/` directory at the project root to hold project-specific Claude Code settings.

### 2a. Create `.claude/settings.json`

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(*.key)",
      "Write(.env*)",
      "Write(./production.*)"
    ]
  }
}
```

### 2b. Create `.claude/commands/` Directory

Create reusable slash commands that work in any Claude Code session:

#### `.claude/commands/status.md`
```markdown
Read STATE.md and JOBS.md. Provide a concise summary:
1. Current task (from STATE.md CURRENT_TASK)
2. What's been done this session (from STATE.md COMPLETED_THIS_SESSION)
3. What's blocked (from STATE.md BLOCKED)
4. Next tasks (from JOBS.md NEXT_UP)
5. Test status: run `npm test -- --silent 2>&1 | tail -3` and report pass/fail counts
```

#### `.claude/commands/run-autonomous.md`
```markdown
Enter autonomous work mode. Follow this protocol:

1. Read STATE.md to understand current position
2. Read JOBS.md to find the next task in NEXT_UP or ACTIVE_JOBS
3. If no tasks exist, ask the user what to work on
4. For each task:
   a. Move it from NEXT_UP to ACTIVE_JOBS in JOBS.md
   b. Update STATE.md CURRENT_TASK
   c. Implement the task
   d. Run quality gates: `npm run typecheck && npm test && npm run lint`
   e. If gates pass: update STATE.md and JOBS.md, commit the change
   f. If gates fail: fix issues, re-run gates. After 3 failures, log in STATE.md BLOCKED
5. After completing a task, immediately start the next one
6. Continue until NEXT_UP is empty or the user interrupts

Key rules:
- Always typecheck + test + lint before committing
- Delegate large implementations to sub-agents using the Task tool
- Keep commits small and focused (one task per commit)
- Update state files after EVERY task, not just at the end
```

#### `.claude/commands/add-job.md`
```markdown
Add a new job to JOBS.md. Usage: /add-job <description>

1. Read JOBS.md
2. Add the job to the NEXT_UP section with the next available number
3. If the user provided priority info, place it at the appropriate position
4. Write JOBS.md
5. Confirm the job was added
```

#### `.claude/commands/init-construct.md`
```markdown
Initialize The Construct orchestration system in the CURRENT project (not in the-construct-architecture itself — this is for OTHER projects that want to use this workflow).

Steps:
1. Create STATE.md with the template from the-construct-architecture
2. Create JOBS.md with the AI-resumable format
3. Create .claude/commands/ directory with status.md, run-autonomous.md, and add-job.md (copy from the-construct-architecture templates)
4. Add autonomous session protocol to the project's CLAUDE.md (create if it doesn't exist)
5. Verify the setup by reading all created files
6. Print a summary of what was created

Template locations (read from the-construct-architecture repo):
- STATE.md template: /home/michel/projects/the-construct-architecture/STATE.md
- JOBS.md template: /home/michel/projects/the-construct-architecture/JOBS.md
- Commands: /home/michel/projects/the-construct-architecture/.claude/commands/
```

---

## Phase 3: Resilience Patterns (20 min)

### 3a. Create `.claude/commands/recover.md`

```markdown
Recovery protocol for when context has been compacted or the session seems lost:

1. Read STATE.md — this is the ground truth for where we are
2. Read JOBS.md — this shows the full work history and what's next
3. Run `git log --oneline -10` to see recent commits
4. Run `git diff --stat` to see any uncommitted changes
5. Run `npm test -- --silent 2>&1 | tail -5` to check test health
6. Provide a recovery summary:
   - Where we are
   - What was last completed
   - What's in progress or blocked
   - Recommended next action
7. Update STATE.md CONTEXT_NOTES with recovery timestamp
```

### 3b. Create `.claude/commands/checkpoint.md`

```markdown
Create a checkpoint of the current session state:

1. Read STATE.md
2. Run `git status` and `git diff --stat`
3. Run `npm test -- --silent 2>&1 | tail -5`
4. Update STATE.md with:
   - Current timestamp in LAST_UPDATED
   - Test results in CONTEXT_NOTES
   - Any uncommitted changes noted
5. If there are uncommitted changes and tests pass, ask if the user wants to commit
6. Confirm checkpoint was saved
```

---

## Phase 4: Hooks for Quality Enforcement (15 min)

Create a project-level pre-commit hook that enforces quality gates through code (matching The Construct's philosophy).

### 4a. Create `.claude/hooks/pre-commit-check.sh`

Wait — Claude Code hooks are different from git hooks. Create both:

#### Git pre-commit hook: Create `scripts/pre-commit.sh`

```bash
#!/bin/bash
echo "Running quality gates..."

echo "→ TypeCheck..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "✗ TypeCheck failed. Fix errors before committing."
    exit 1
fi

echo "→ Tests..."
npm test -- --silent
if [ $? -ne 0 ]; then
    echo "✗ Tests failed. Fix failures before committing."
    exit 1
fi

echo "→ Lint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "✗ Lint failed. Fix warnings before committing."
    exit 1
fi

echo "✓ All quality gates passed."
```

Then install it: `cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`

**Important:** This is a local git hook, not committed to the repo. Add a `scripts/setup-hooks.sh` that installs it:

```bash
#!/bin/bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Git hooks installed."
```

---

## Phase 5: New Project Bootstrapping Template (30 min)

Create a `templates/` directory with everything needed to bootstrap The Construct's orchestration on a new project.

### 5a. Create `templates/orchestration/`

```
templates/orchestration/
├── STATE.md.template        # State file template with placeholders
├── JOBS.md.template          # Jobs file template
├── CLAUDE.md.template        # CLAUDE.md with autonomous protocol
├── commands/
│   ├── status.md             # /status command
│   ├── run-autonomous.md     # /run-autonomous command
│   ├── add-job.md            # /add-job command
│   ├── recover.md            # /recover command
│   └── checkpoint.md         # /checkpoint command
└── README.md                 # How to use the templates
```

### 5b. Template Content

Each `.template` file should use `{{PROJECT_NAME}}`, `{{TIMESTAMP}}`, `{{DESCRIPTION}}` as placeholders.

The `templates/orchestration/README.md` should explain:
1. What each file does
2. How to bootstrap: copy templates, replace placeholders, set up hooks
3. How the autonomous loop works
4. How state recovery works
5. Customization options

### 5c. Create a Bootstrap Script

Create `scripts/bootstrap-orchestration.sh`:

```bash
#!/bin/bash
# Bootstrap The Construct orchestration system into a project
# Usage: ./bootstrap-orchestration.sh /path/to/project "Project Name"

TARGET_DIR="${1:-.}"
PROJECT_NAME="${2:-My Project}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEMPLATE_DIR="$(dirname "$0")/../templates/orchestration"

echo "Bootstrapping orchestration for: $PROJECT_NAME"
echo "Target: $TARGET_DIR"

# Create directories
mkdir -p "$TARGET_DIR/.claude/commands"

# Copy and substitute templates
for template in STATE.md.template JOBS.md.template; do
    output="${template%.template}"
    sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
        -e "s/{{TIMESTAMP}}/$TIMESTAMP/g" \
        "$TEMPLATE_DIR/$template" > "$TARGET_DIR/$output"
    echo "  Created $output"
done

# Copy commands
cp "$TEMPLATE_DIR/commands/"*.md "$TARGET_DIR/.claude/commands/"
echo "  Created .claude/commands/"

# Append to or create CLAUDE.md
if [ -f "$TARGET_DIR/CLAUDE.md" ]; then
    echo "" >> "$TARGET_DIR/CLAUDE.md"
    cat "$TEMPLATE_DIR/CLAUDE.md.template" >> "$TARGET_DIR/CLAUDE.md"
    echo "  Appended autonomous protocol to existing CLAUDE.md"
else
    sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
        "$TEMPLATE_DIR/CLAUDE.md.template" > "$TARGET_DIR/CLAUDE.md"
    echo "  Created CLAUDE.md"
fi

echo ""
echo "Done! Orchestration bootstrapped."
echo "Next steps:"
echo "  1. Review STATE.md and JOBS.md"
echo "  2. Add initial jobs to JOBS.md NEXT_UP section"
echo "  3. Open Claude Code and run /run-autonomous"
```

---

## Phase 6: Wire The Construct's Own Systems (Optional, 45 min)

This is the meta-layer: use The Construct's own contract and Sentinel systems to govern the development workflow.

### 6a. Create a Development Contract

Create `construct/contracts/dev-task.yaml`:

```yaml
id: construct/dev-task
name: Development Task Execution
version: "1.0.0"
type: tool

metadata:
  created_at: "2026-02-13"
  priority: normal
  tags:
    - development
    - autonomous

requirements:
  description: |
    Execute a development task within The Construct codebase.
    All changes must pass quality gates before being considered complete.

goals:
  description: Complete the development task with passing quality gates
  objectives:
    - All tests pass after changes
    - TypeCheck passes with zero errors
    - Lint passes with zero warnings
    - Changes are focused and minimal
  success_threshold: 8

limitations:
  forbidden_actions:
    - Modify files outside src/ and test/ without explicit approval
    - Skip quality gates
    - Force push to main
    - Delete test files
    - Introduce any type assertions
  constraints:
    - One logical change per commit
    - Must update STATE.md after completion
    - Must update JOBS.md after completion

quality:
  criteria:
    - name: tests_pass
      weight: 0.3
      threshold: 10
    - name: type_safety
      weight: 0.3
      threshold: 9
    - name: lint_clean
      weight: 0.2
      threshold: 10
    - name: minimal_changes
      weight: 0.2
      threshold: 8
```

### 6b. Use the Contract in the Autonomous Loop

Update `.claude/commands/run-autonomous.md` to reference the contract:

Add this note at the top:
```
Each task is governed by the `construct/dev-task.yaml` contract.
Success criteria: all tests pass, typecheck clean, lint clean, minimal focused changes.
```

---

## Execution Order

| Phase | Description | Depends On | Estimated Effort |
|-------|-------------|------------|-----------------|
| 0 | Fix TS error | Nothing | 5 min |
| 1 | State management files | Phase 0 | 30 min |
| 2 | Project-level Claude config & commands | Phase 1 | 20 min |
| 3 | Resilience patterns | Phase 2 | 20 min |
| 4 | Quality hooks | Phase 0 | 15 min |
| 5 | New project templates | Phases 1-3 | 30 min |
| 6 | Wire The Construct's own systems | Phase 5 (optional) | 45 min |

**Total: ~2.5 hours for Phases 0-5, ~3 hours with Phase 6**

---

## Verification Checklist

After all phases, verify:

- [ ] `npm run typecheck` — zero errors
- [ ] `npm test` — all tests pass, zero suite failures
- [ ] `npm run lint` — zero warnings
- [ ] `STATE.md` exists and is readable
- [ ] `JOBS.md` has NEXT_UP section
- [ ] `.claude/commands/status.md` works via `/project:status`
- [ ] `.claude/commands/run-autonomous.md` works via `/project:run-autonomous`
- [ ] `.claude/commands/recover.md` works via `/project:recover`
- [ ] `templates/orchestration/` directory exists with all templates
- [ ] `scripts/bootstrap-orchestration.sh` is executable
- [ ] Git pre-commit hook runs quality gates
- [ ] Session recovery works: close Claude Code, reopen, run `/project:recover` — it should reconstruct context from STATE.md

---

## Success Criteria

The system is working when:

1. **Longevity:** You can run `/project:run-autonomous` and it processes multiple tasks without losing context, even after auto-compaction
2. **Recovery:** After closing and reopening Claude Code, `/project:recover` fully restores context
3. **Bootstrapping:** Running `scripts/bootstrap-orchestration.sh /path/to/new-project "My App"` sets up the full orchestration system
4. **Quality:** No commit can be made without passing typecheck + tests + lint
5. **Self-documenting:** STATE.md always reflects the current truth of the session
