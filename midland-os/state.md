# Midland Sleep Portal — Execution State

**Last updated:** 2026-05-18
**Production branch:** `main` at commit `751e864`

---

## Current production status

`main` is deployed and proven. All features below are live.

---

## Proven and frozen features

### Phase 1 — Import engine
- CSV preview/execute flow
- Duplicate NHI and machine serial blocking (preview and execute)
- Execute duplicate safety (DynamoDB conditional writes)
- Generated portal access (Cognito user + temp password) on import
- Cognito temp password login works end-to-end
- Admin patient list and record drawer
- NHI hidden in all admin and patient UI (MVP)

### Phase 2A — Portal Accounts
- `/admin/portal-accounts` page with KPI cards, search, filter, accounts table
- Reset password workflow (modal → audit → `AdminSetUserPassword`)
- Unlock account workflow (modal → audit → `AdminEnableUser`)
- Audit-before-action safeguard implemented and fail-closed
- Reset password audit **runtime-proven in DynamoDB**
- Unlock audit **runtime-proven in DynamoDB** (`ADMIN_ACCOUNT_UNLOCK_ATTEMPT` confirmed present with `patient_msid`, `admin_id`, `admin_email`, `org_id`, `result=attempted`, no raw NHI)
- Locked-account badge on sidebar (reactive, module-level pub/sub)

### Import Operations redesign
- `/admin/import` redesigned as Import Operations
- History view is default landing when batches exist
- Zero state with Start New Import CTA when no batches
- Back to Import History path from wizard
- `ImportHistoryTable` and `ImportDetailsSheet` components
- All Phase 1 import backend logic preserved intact — no changes

---

## Current active slice

**None.** Phase 2A is closed. Packaging and handover mode.

---

## Immediate next task

Evidence and handover pack:
1. Capture screenshots: Portal Accounts on main, unlock proof, import redesign
2. Capture CLI proof outputs for audit rows
3. Update Midland OS docs with Portal Accounts status, audit-before-action rule, proof notes, known limitations, support boundaries
4. Produce a demo script / handover summary

---

## Frozen scope — do not touch

- Phase 1 import engine logic (unless a real production bug is found)
- Auth / session / middleware
- Cognito admin logic (beyond genuine bug fixes)
- DynamoDB schema (beyond genuine bug fixes)
- Checkout / cart / payments
- Inventory backend
- Patient invites / email flows
- Patient portal pages (beyond genuine bug fixes)
- Portal Accounts reset/unlock (do not expand unless a real bug appears)

---

## Next planned stages (not started)

After packaging is complete:
- Tightly scoped next admin workflow improvement (display-only preferred)
- All future tasks must follow the structured prompt format:
  Objective / Context / Allowed files / Forbidden files / Exact requirements / UI/UX behavior / Data rules / Edge cases / Acceptance criteria / Verification

---

## Key rules

- Next UI work is **display-only** unless fixing a real production bug
- No backend/auth/Cognito/import-engine changes without a real, identified bug
- Audit-before-action is the required pattern for all future admin account actions
- No raw NHI in any request, response, log, or UI surface

---

## Verification commands

```bash
npx tsc --noEmit       # must pass clean
npm run build          # must complete without errors
```
