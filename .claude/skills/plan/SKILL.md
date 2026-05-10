# /plan
Produce a day-or-week plan for a Phase 1B slice.
## When to use
Start of session, start of day/week, after scope change.
## Output
```
Day [N] — [Title] [MUST|STRETCH]
Slice: [1C|1D|1D-x|1E|1F]
[ ] task 1
[ ] task 2
Verification: npx tsc --noEmit
Evidence: /midland-os/07-outputs/phase-1/
```
## Rules
- Reference PHASE-1B-EXECUTION-TRACKER.md
- One day at a time unless asked for a week
- MUST before STRETCH
- End with: next single action
- No scope expansion beyond the named slice
