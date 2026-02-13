Create a checkpoint of the current session state.

## Steps

1. **Read STATE.md** for current state
2. **Gather status:**
   - Run `git status --short` for working tree status
   - Run `git diff --stat` for uncommitted changes
   - Run `npm test -- --silent 2>&1 | tail -5` for test health
3. **Update STATE.md** with:
   - Current timestamp in LAST_UPDATED
   - Test results in CONTEXT_NOTES
   - Any uncommitted changes noted in CONTEXT_NOTES
4. **If there are uncommitted changes and all tests pass:**
   - Ask the user if they want to commit now
   - If yes, create a commit with a descriptive message
5. **Confirm:** "Checkpoint saved at (timestamp). Tests: N passed. Git: clean/N uncommitted files."
