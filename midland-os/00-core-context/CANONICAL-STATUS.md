# CANONICAL STATUS — Midland Sleep Portal

> Single source of truth across Claude Code, Codex, ChatGPT, and Perplexity.
> When tools disagree, this file wins.
> Update this file when status changes. Do not let it drift.

---

## STATUS SNAPSHOT

```text
Date:                    May 22, 2026
Phase:                   Phase 2A — Admin Operations
Branch:                  phase-2a-admin-ops
Latest pushed commit:    aa589a9  chore: add staging release gates and environment banner
Repo state:              Feature-validation / WIP — NOT clean release state
Release discipline:      Added (staging banner + midland-os/04-sops/release-gates.md)
Staging branch:          Exists
Sprint 5B:               Safety check detail fields — restored, NOT yet committed
```

---

## WORKING TREE — Sprint 5B WIP (uncommitted)

Six files modified, not staged:

```text
M  src/app/api/admin/patients/activity/route.ts
M  src/app/api/admin/patients/route.ts
M  src/app/api/admin/patients/safety/route.ts
M  src/components/admin/PatientDrawer.tsx
M  src/lib/aws/audit.ts
M  src/lib/aws/dynamodb.ts
```

These implement Sprint 5B: safety check detail fields (reason, severity, due date, assigned-to, resolved note). Do not commit other files alongside these six.

---

## IMMEDIATE NEXT STEPS

### 1. Validation commands

```bash
git status --short
git diff --stat
npx tsc --noEmit
npm run build
```

All four must pass before browser testing.

### 2. Sprint 5B browser smoke test

Work through this list in order against a running local or staging instance:

```text
[ ] Open /admin/patients — Patients page loads, KPI cards visible
[ ] Open patient drawer for an imported patient
[ ] Mark safety check required — badge appears, patient enters Safety Checks Due worklist
[ ] Edit details: add a reason (text field)
[ ] Set severity chip: Low / Medium / High
[ ] Add a due date
[ ] Add an assigned-to name
[ ] Click Save details
[ ] Refresh drawer — confirm all four detail fields persisted
[ ] Safety Checks Due KPI count still correct
[ ] Open Activity tab — entry reads "Admin caution details updated" (not clinical language)
[ ] Open Admin Caution section — click Clear safety check
[ ] Add a resolution note (optional)
[ ] Confirm clear — patient leaves Safety Checks Due worklist
[ ] Activity tab — entry reads "Admin caution status updated"
[ ] No raw NHI visible anywhere during testing
[ ] No clinical decision language in any UI element
```

### 3. Commit (only after all checks pass)

```bash
git add \
  src/app/api/admin/patients/activity/route.ts \
  src/app/api/admin/patients/route.ts \
  src/app/api/admin/patients/safety/route.ts \
  src/components/admin/PatientDrawer.tsx \
  src/lib/aws/audit.ts \
  src/lib/aws/dynamodb.ts
git commit -m "feat: add safety check detail fields"
```

---

## RELEASE LADDER

```
Local → Feature/Dev Branch → Staging → Controlled Pilot Release → Production
```

Full gate detail: `midland-os/04-sops/release-gates.md`

---

## PHASE 2A SPRINT COMPLETION STATUS

| Sprint | Feature | Status |
|---|---|---|
| 4B | Review status worklist filter | ✅ Pushed |
| 4C | Needs Outreach flag | ✅ Pushed |
| 4D | Clickable KPI worklist cards | ✅ Pushed |
| 5A | Safety check flag + worklist | ✅ Pushed (871ca76) |
| **5B** | **Safety check detail fields** | **🟡 WIP — not committed** |
| Release Gates | Staging banner + release-gates.md | ✅ Pushed (aa589a9) |

---

## HERMES — INTERNAL AGENT GUIDANCE

Hermes is for OneOfZero / Midland build operations only.

**Approved Hermes agents:**
- Release Gate Agent
- Sprint Memory Agent
- Claude Prompt Generator Agent
- Audit / Security Review Agent
- Handover / Docs Agent

**Hermes must NOT be used yet for:**
- Patient messaging or outreach automation
- Clinical triage or CPAP advice
- Automated safety escalation
- Direct DynamoDB writes
- Direct Cognito changes
- Autonomous production deploys

---

## NON-NEGOTIABLES

- NHI is never a credential
- NHI excluded by default in every export (Rule 16)
- Audit append-only — PutItem only (no UpdateItem, no DeleteItem on audit table)
- No portal-driven delete or restore (Rule 17)
- Admin notes: owner-only edit and soft-delete, enforced server-side
- Admin caution / safety check: admin operational flag only — not clinical decision support
- Real patient data never enters AI tools
- Demo accounts only in prompts and docs

---

## LAST UPDATED

```text
Date:       May 22, 2026
Updated by: Paul Alejo
Reason:     Phase 2A Sprint 5B WIP state — safety check detail fields pending commit
```
