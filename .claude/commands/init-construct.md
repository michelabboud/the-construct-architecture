Initialize The Construct's autonomous orchestration system in a TARGET project.

This command bootstraps the full state management and autonomous workflow system into another project directory. It is NOT for the-construct-architecture itself — it's for OTHER projects that want to use this workflow.

The user should provide the target project path. If not provided, ask for it.

## Steps

1. **Determine target path and project name**
   - Ask the user if not provided
   - Default project name: directory name of the target path

2. **Create STATE.md** in the target project root:
   ```markdown
   # STATE - Live Session State
   <!-- AI-RESUMABLE: Read this file at the start of every response -->
   <!-- LAST_UPDATED: (current timestamp) -->

   ## CURRENT_TASK
   None

   ## COMPLETED_THIS_SESSION
   (empty)

   ## BLOCKED
   (empty)

   ## CONTEXT_NOTES
   - Project: <project name>
   - Initialized: (current date)

   ## DECISIONS_LOG
   (empty)
   ```

3. **Create JOBS.md** in the target project root:
   ```markdown
   # JOBS - Active Work Tracker
   <!-- AI-RESUMABLE: This file is designed for AI model consumption -->
   <!-- LAST_UPDATED: (current timestamp) -->

   ## ACTIVE_JOBS
   *No active jobs.*

   ## NEXT_UP
   <!-- Priority-ordered backlog. Move items to ACTIVE_JOBS when starting. -->

   ## RECENT_COMPLETED
   (empty)
   ```

4. **Create `.claude/commands/` directory** in the target project with:
   - Copy `status.md` from `/home/michel/projects/the-construct-architecture/.claude/commands/status.md`
   - Copy `run-autonomous.md` from `/home/michel/projects/the-construct-architecture/.claude/commands/run-autonomous.md`
   - Copy `add-job.md` from `/home/michel/projects/the-construct-architecture/.claude/commands/add-job.md`
   - Copy `recover.md` from `/home/michel/projects/the-construct-architecture/.claude/commands/recover.md`
   - Copy `checkpoint.md` from `/home/michel/projects/the-construct-architecture/.claude/commands/checkpoint.md`

5. **Add autonomous protocol to CLAUDE.md** in the target project:
   - If CLAUDE.md exists, append the autonomous session protocol section
   - If it doesn't exist, create a new CLAUDE.md with the project name and the protocol
   - The protocol section to add is the "Autonomous Session Protocol" section from `/home/michel/projects/the-construct-architecture/CLAUDE.md`

6. **Print summary** of what was created and next steps:
   - List all files created
   - Suggest: "Add initial jobs to JOBS.md, then run /project:run-autonomous"
