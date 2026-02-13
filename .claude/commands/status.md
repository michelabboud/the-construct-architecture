Read STATE.md and JOBS.md. Provide a concise summary:

1. **Current task** (from STATE.md CURRENT_TASK)
2. **Completed this session** (from STATE.md COMPLETED_THIS_SESSION)
3. **Blocked items** (from STATE.md BLOCKED)
4. **Next tasks** (from JOBS.md NEXT_UP — show unchecked items)
5. **Test health**: run `npm test -- --silent 2>&1 | tail -3` and report pass/fail counts
6. **Git status**: run `git status --short` and report any uncommitted changes

Format as a brief dashboard, not a wall of text.
