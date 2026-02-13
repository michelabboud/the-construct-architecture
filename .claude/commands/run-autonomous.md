Enter autonomous work mode. Each task is governed by quality gates: typecheck + tests + lint must pass.

## Protocol

1. Read `STATE.md` to understand current position
2. Read `JOBS.md` to find the next unchecked task in NEXT_UP or ACTIVE_JOBS
3. If no tasks exist, ask the user what to work on and stop

### For each task:

a. Update `STATE.md` CURRENT_TASK with what you're working on
b. Move the task from NEXT_UP to ACTIVE_JOBS in `JOBS.md` (if not already there)
c. **Implement the task:**
   - For research/exploration: use Task tool with `subagent_type=Explore`
   - For implementation: write code, keeping changes focused and minimal
   - For test writing: use Task tool with `subagent_type=qa-testing-expert`
d. **Run quality gates:**
   ```
   npm run typecheck && npm test -- --silent && npm run lint
   ```
e. **If gates pass:**
   - Commit the change with a descriptive message
   - Update `STATE.md` (move task to COMPLETED_THIS_SESSION, clear CURRENT_TASK)
   - Mark the task as `[x]` in `JOBS.md` NEXT_UP
f. **If gates fail:**
   - Fix the issue and re-run gates
   - After 3 failures on the same issue, log it in `STATE.md` BLOCKED and move to next task

4. After completing a task, immediately start the next one
5. Continue until NEXT_UP is empty or the user interrupts

## Key Rules

- Always typecheck + test + lint before committing
- Delegate large implementations to sub-agents using the Task tool
- Keep commits small and focused (one task per commit)
- Update state files after EVERY task, not just at the end
- Never force-push, never skip hooks
