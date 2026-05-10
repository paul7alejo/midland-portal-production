# surgical-task-template.md
# Copy this template for every Claude Code / Codex coding task
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz

---

## Template

```text
Objective:
[One sentence. What is being built or fixed?]

Context:
Midland Sleep portal. Phase 1B. Current slice: [1C / 1D / 1E / 1F].
Reference: midland-os/00-core-context/claude-context-pack/
           MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
Do not expand scope. Surgical edits only.

Allowed files:
- [list exact file paths]

Forbidden files:
- src/app/portal/checkout/
- src/app/portal/shop/
- src/phase2/
- auth / middleware (unless explicitly in scope)
- Cognito logic (unless explicitly in scope)
- DynamoDB logic (unless explicitly in scope)
- patient portal routes (unless explicitly in scope)
- any file not in the Allowed list above

Requirements:
- [specific, numbered, testable]

UI/UX behavior:
- [what the user sees and does]

Data rules:
- no real patient data (demo accounts only)
- no raw NHI in any log or API response
- no fake/generated fallback data
- safeLog() only for patient data
- export: NHI excluded by default, audit PutItem before file generation

Edge cases:
- empty state: [what to show]
- loading state: [what to show]
- error state: [what to show]
- missing data (machine/mask/NHI): show "Not recorded" — never fake data

Acceptance criteria:
- [ ] [testable item]
- [ ] [testable item]

Verification:
  npx tsc --noEmit
  npm run build (if routes or UI changed)

After completion, respond with:
  Files changed:
  Verification result:
  Risks / notes:
  Next step:
```

---

## Anti-Drift Instruction

Add this to every prompt when you want to prevent scope creep:

```text
Do not implement anything outside the requested task.
If you discover a related issue, document it under Risks/Next
instead of fixing it.
```

---

## Token-Saving Rules

```text
1. Start every session with Section B (status snapshot) only.
2. Reference local files instead of pasting huge docs.
3. Ask for one task at a time.
4. Require: npx tsc --noEmit
5. Ask for concise output: files changed / verification / risks / next step
6. Stop after the next action.
```
