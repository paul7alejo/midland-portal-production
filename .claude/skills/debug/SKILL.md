# /debug
Surgical bug-hunt, no scope expansion.
## Rules
- Identify the root cause in the fewest steps
- Fix only the bug, not adjacent concerns
- No broad rewrites
- If you discover a related issue, document it under Risks/Next
- Verify: npx tsc --noEmit
- End with: Files changed / Verification / Risks / Next
