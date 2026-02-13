Add a new job to JOBS.md.

The user's input after the command is the job description. If no input was provided, ask for it.

Steps:
1. Read `JOBS.md`
2. Find the NEXT_UP section
3. Determine the next available number in the list
4. Add the new job as `N. [ ] <description>` at the appropriate position
   - If the user specified priority (e.g., "high priority" or "do this first"), place it near the top
   - Otherwise, append to the end of the NEXT_UP list
5. Write the updated `JOBS.md`
6. Confirm: "Added job #N: <description>"
