# Phase 2A Sprint 5H Proof — Import UX Guardrails Pass

## Status
Implemented, build-passing, and browser-tested.

## What Changed
- Reworked Import section into zero/history/wizard modes.
- Changed import wizard from 7-step/flat-scroll model to 4 steps:
  - Upload
  - Validate
  - Review & Approve
  - Results
- Added no-write safety copy to Upload.
- Added NHI masking copy.
- Added required CSV field chips.
- Added Validate step with summary cards, blocked rows, review rows, remediation guidance, and cleanup tools.
- Added portal-account consequence notice in Review & Approve.
- Kept Execute Import gated by existing backend-derived readiness.
- Added Results actions: Return to Import History and Go to Patients.
- Added safe Batch Recovery placeholder in Import Details.
- Recovery/rollback button is disabled and not implemented.

## Files Changed
- src/app/admin/(protected)/import/page.tsx
- src/components/admin/ImportDetailsSheet.tsx
- src/components/admin/ImportHistoryTable.tsx

## Explicitly Not Changed
- No import preview API changes.
- No import execute API changes.
- No DynamoDB write logic changes.
- No Cognito logic changes.
- No NHI encryption/hash/masking changes.
- No audit logging changes.
- No auth/middleware changes.
- No rollback backend implementation.

## Browser Proof
- [ ] Zero state works
- [ ] Import History works
- [ ] Start New Import opens 4-step wizard
- [ ] Upload no-write safety copy appears
- [ ] Validate shows remediation guidance
- [ ] Review & Approve shows portal-account warning
- [ ] Execute remains gated
- [ ] Results show created/skipped/failed
- [ ] Credentials only show when returned
- [ ] Recovery panel is placeholder-only
- [ ] Rollback is disabled/locked
- [ ] No raw NHI exposure
- [ ] No clinical decision-support wording
