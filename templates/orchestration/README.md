# Orchestration Templates

Templates for bootstrapping The Construct's autonomous orchestration system into any project.

## Quick Start

```bash
# From the-construct-architecture repo:
./scripts/bootstrap-orchestration.sh /path/to/your/project "My Project"
```

This creates everything you need for autonomous Claude Code sessions.

## What Gets Created

| File | Purpose |
|------|---------|
| `STATE.md` | Live session state — survives context compaction |
| `JOBS.md` | Task backlog with priority ordering |
| `CLAUDE.md` | Autonomous session protocol (appended if exists) |
| `.claude/commands/status.md` | `/project:status` — session dashboard |
| `.claude/commands/run-autonomous.md` | `/project:run-autonomous` — autonomous work loop |
| `.claude/commands/add-job.md` | `/project:add-job` — add tasks to backlog |
| `.claude/commands/recover.md` | `/project:recover` — rebuild context after compaction |
| `.claude/commands/checkpoint.md` | `/project:checkpoint` — save session state |

## How It Works

### The Autonomous Loop

```
Read STATE.md → Find next task in JOBS.md → Execute → Run quality gates → Commit → Update state → Loop
```

### Context Survival

Claude Code auto-compresses old messages when the context window fills. But it cannot touch files on disk. By writing session state to `STATE.md`, the autonomous loop can recover from any compaction event.

### Recovery

If context is lost (compaction, session restart), run `/project:recover`. It reads `STATE.md`, `JOBS.md`, checks `git log` and test health, and reconstructs full context.

### Error Handling

If a task fails 3 times, it gets logged in `STATE.md` under BLOCKED and the loop moves to the next task. No infinite retries.

## Customization

### Templates use placeholders:

- `{{PROJECT_NAME}}` — replaced with the project name
- `{{TIMESTAMP}}` — replaced with the current UTC timestamp

### Adapting quality gates:

Edit `.claude/commands/run-autonomous.md` to match your project's test/lint/typecheck commands.

### Adding custom commands:

Create new `.md` files in `.claude/commands/`. They become available as `/project:<filename>` in Claude Code.
