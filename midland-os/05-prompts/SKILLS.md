# SKILLS — Reusable Prompt Modules

> Index of skills used in Claude Code sessions for the Midland portal.
> Full skill prompts live in the repo at `.claude/skills/<name>/SKILL.md`.
> Trigger them inline by referencing `/<skill-name>` in your prompt.

## Build skills (Phase 1B core)

```text
/plan                 produce a day-or-week plan for a slice (use this Skill 1)
/portal-component     build a patient-portal Next.js component
/admin-view           build an admin page or table view
/admin-dashboard      build the admin dashboard scaffolding
/new-component        bootstrap a new component file (Tailwind + shadcn)
/frontend-design      apply brand + UI/UX standards to a layout
/equipment-alerts     work on equipment alert / safety check UX
/fix-wallet           ad-hoc wallet/entitlement bug repair
```

## Discipline skills (always-on)

```text
/verify              run npx tsc --noEmit + npm run build, summarize result
/commit              produce a tight commit message (conventional commits)
/cicd-check          confirm Amplify env + GitHub Actions configuration
/debug               surgical bug-hunt, no scope expansion
/techdebt            triage tech debt items into the backlog
/rename-credits      remove "credits" / "points" terminology where it lingers
```

## Security & compliance skills

```text
/vibesec             quick security pass on a diff or feature
/nhi-audit           NHI handling audit (encryption, masking, logging, exports)
/sanitize            sanitise inputs / outputs / logs for PII
/varlock             confirm env-var handling is correct (no secrets in repo)
/entitlement-check   verify entitlement Layer 1 logic is YES/NO not $$$
```

## Operations skills

```text
/demo-ready         confirm demo accounts work and a demo flow is clean
/track-event        add audit-log event with action / reason / metadata
```

## NEW for v3.1 — Admin Data Operations

```text
/admin-export       implement or modify an export endpoint (Skill 10 — Export Hygiene)
/backup             implement or modify backup logic (Skill 11 — Backup Discipline)
/aws-status         implement or modify the AWS State Visibility panel
```

## Discipline rules (every skill)

```text
- Surgical edits only
- Allowed / forbidden files in every prompt
- Verification: npx tsc --noEmit
- End with: Files changed / Verification / Risks / Next
- No console.log of patient data
- safeLog and maskNHI are mandatory in patient-data paths
- audit row PutItem BEFORE sensitive actions
- no portal-driven delete or restore (Rule 17)
- NHI excluded from exports by default (Rule 16)
```

## How to use a skill in a prompt

```text
Objective: [one sentence]
Context: Midland portal Phase 1B, slice [1C/1D/1D-x/1E/1F]
Skill: /admin-export
Allowed files:
  src/app/api/admin/exports/imported-patients/route.ts
  src/lib/export/imported-patients.ts
Forbidden files: auth, middleware, DynamoDB clients
Requirements: ...
Acceptance criteria: ...
Verification: npx tsc --noEmit
```
