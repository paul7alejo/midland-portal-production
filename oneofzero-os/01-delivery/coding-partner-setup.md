# Coding Partner Setup

> Detailed how-to for running Claude Code or Codex sessions productively.

## Default plan

```text
Primary coding:        Claude Code or Codex
Planning/scope:        ChatGPT
Research:              Perplexity
Optional routing:      OpenRouter only for non-sensitive scaffolding (NEVER prod)
```

## Codex — when to reach for it

```text
- local repo inspection
- surgical TypeScript fixes
- running typecheck/build
- small refactors
- test/debug cycles
- "show me where this is defined"
```

Codex prompt template:

```text
You are working inside the Midland Sleep portal repo.
Use /midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
as the primary context (Sections 1, 2, 6, 9, and the relevant feature section).

Do not touch forbidden files.
Run npx tsc --noEmit and npm run build.
Return: files changed, verification, risks, next step.

Today's task:
[paste exact task]
```

## Claude Code — when to reach for it

```text
- file-scoped implementation
- UI polish
- admin table/drawer work
- route/API work (only when explicitly scoped)
- documentation generation
- security/compliance/entitlement logic (Sonnet/Opus tier)
- refactors that need cross-file reasoning
```

Claude Code prompt template:

```text
Objective:
[one sentence]

Context:
Reference midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
Phase 1B, slice [1C/1D/1D-x/1E/1F].

Allowed files:
[list]

Forbidden files:
- auth, middleware, Cognito logic, DynamoDB logic unless explicitly allowed
- checkout/cart/shop, inventory, email/invite flows
- patient portal unless explicitly allowed

Requirements:
[list]

Data rules:
- no real patient data
- no raw NHI logs
- no fake fallback data

Edge cases:
[list]

Acceptance criteria:
[list]

Verification:
  npx tsc --noEmit

After completion respond with:
  Files changed:
  Verification result:
  Risks / notes:
  Next step:
```

## Token saving rules

```text
1. Start every session with the smallest current status (Section 2 only).
2. Reference local docs by path; don't paste large content.
3. Ask for one task only.
4. Use allowed/forbidden files.
5. Require: npx tsc --noEmit
6. Ask for concise output: files / verification / risks / next.
7. Stop after the next action.
8. Anti-drift command: "Do not implement anything outside the requested
   task. If you discover a related issue, document it under Risks/Next
   instead of fixing it."
```

## Common patterns

### Pattern A — small fix in 1 file

```text
"Fix the timestamp formatting in src/components/admin/PatientDrawer.tsx
 line 47 to render NZ-local readable date. Allowed files: that one file.
 Forbidden: anything else. Verification: npx tsc --noEmit."
```

### Pattern B — new component

```text
"Create src/components/admin/AwsStatusPanel.tsx — read-only panel showing
 record counts per table from /api/admin/aws-status. Allowed files:
 the new file + src/app/admin/aws-status/page.tsx for the import.
 Forbidden: any new API endpoints, any new types beyond local.
 Verification: npx tsc --noEmit + npm run build."
```

### Pattern C — multi-file feature slice

```text
Break into 3 prompts. Each prompt is one allowed-files block. Sequential.
Don't try to do all three in one Claude Code turn.
```

## When to abandon a session

```text
- if the model is hallucinating file paths that don't exist → kill it, restart
- if it's making changes you didn't ask for → kill it, restart, tighten allowed files
- if it's writing 200+ lines of "explanation" before code → kill it, ask for code only
- if it has been running 20+ minutes on one task → break the task smaller
```
