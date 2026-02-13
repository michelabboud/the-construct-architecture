Recovery protocol for when context has been compacted or the session seems lost.

## Steps

1. **Read STATE.md** — this is the ground truth for where we are
2. **Read JOBS.md** — this shows the full work history and what's next
3. **Check git state:**
   - Run `git log --oneline -10` to see recent commits
   - Run `git diff --stat` to see any uncommitted changes
   - Run `git status --short` to see working tree status
4. **Check test health** by running the project's test suite
5. **Provide a recovery summary:**
   - Where we are (current task from STATE.md)
   - What was last completed (from STATE.md and git log)
   - What's in progress or blocked
   - Test status (pass/fail counts)
   - Any uncommitted work
   - Recommended next action
6. **Update STATE.md** CONTEXT_NOTES with recovery timestamp and test results

After recovery, you are ready to continue working. If the user says "continue", resume from the next unchecked task in JOBS.md.
