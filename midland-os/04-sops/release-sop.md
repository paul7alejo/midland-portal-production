# Release SOP

## Purpose

This SOP defines the bounded release and rehearsal process for Midland Sleep, covering Phase 1 and Phase 2A.

The current release scope is an admin/import/review visibility release with portal account creation on import, portal account management (reset and unlock), and browser-local import history. It is not a launch of checkout, Stripe, patient portal onboarding, patient invites, email automation, fulfilment, inventory operations, or a reporting/analytics platform.

## Go / No-Go Checklist

Go only when all are true:

1. Release scope is understood by Midland and technical support.
2. No unresolved blocker exists in import, admin login, imported patient list, or patient drawer review.
3. TypeScript check passes.
4. Production build passes.
5. Admin authentication smoke test passes.
6. Import dry run validates/preflights without writing records.
7. Blocked import execute writes no records.
8. Clean controlled import execute behaves as expected in the approved rehearsal context.
9. Imported patient appears in the admin list.
10. Imported patient drawer opens and shows expected imported data.
11. No raw NHI is visible in admin UI, export, evidence, logs, screenshots, or release evidence.
12. Known limitations are accepted by Midland.
13. Rollback owner and escalation owner are named.

No-go if raw NHI appears where it should not, unauthorized admin API access succeeds, dry run writes records, blocked execute writes records, imported records cannot be reviewed, or release scope is being presented as checkout, fulfilment, patient onboarding, advanced audit, or analytics.

## Pre-Release Checks

1. Confirm `git status` is clean or all changes are intentionally included.
2. Record commit hash and environment.
3. Run `npx tsc --noEmit`.
4. Run `npm run build`.
5. Confirm admin login route is reachable.
6. Confirm release notes list known limitations.
7. Confirm test/demo data is clearly identified.
8. Confirm no real patient data is pasted into AI tools or non-approved systems.

## Smoke Test Checklist

Core admin:

1. Admin login succeeds for authorised admin.
2. Unauthorized admin access redirects or returns `401` as appropriate.
3. Admin dashboard loads.
4. `/admin/patients` loads.
5. `/admin/import` loads.

Privacy and safety:

1. Imported-patient NHI reveal remains disabled in the MVP.
2. Raw NHI does not appear in patient drawer.
3. Raw NHI does not appear in safe evidence outputs.
4. No fake/default mask is shown when mask data is missing.

## Admin / Import / Export Checks

Import:

1. Dry run validates without writing records.
2. Duplicate NHI and duplicate serial checks appear.
3. Blocked execute creates `0` records.
4. Controlled execute is only performed after preflight passes.
5. Created/skipped/failed summary is understandable.
6. Portal accounts created count is visible in the execute results.
7. Temporary passwords are shown once in the results panel and not stored in import history.
8. Import history appears after execute with a friendly import ID (for example, `IMP-20260525-001`).
9. Batch detail sheet opens from import history and shows safe operational metadata.
10. Browser-local history limitation is acknowledged: history does not persist after browser data is cleared or on other devices.

Admin review:

1. Imported patient appears in `/admin/patients`.
2. Patient drawer opens.
3. Machine brand, model, serial, setup date, and device ID display where imported.
4. Mask details display only where imported.
5. Missing mask data displays `No mask record imported`.
6. Import batch ID and review status display where available.

Export:

1. Demonstrate imported-patient export only if the approved export exists in the target environment.
2. Confirm export is limited to safe operational fields.
3. Confirm export excludes raw NHI, encrypted NHI, and NHI hashes.
4. If export is not available, state it as a known limitation rather than manually extracting data.

## Rollback and Escalation

Rollback planning must be agreed before live patient migration. Record previous deployable commit, current release commit, rollback approver, rollback operator, Midland communication contact, and evidence to capture before rollback.

Rollback does not automatically undo imported patient records. Imported-record correction or removal requires a separately approved data remediation plan.

Escalate to Midland owner for identity, machine serial, funding, source-data, or operational readiness decisions.

Escalate to technical support for admin login failures, unexpected import errors, unsafe field display, missing created records, or failed build/typecheck.

## Explicit Exclusions

The following are not included in the current release scope and must not be presented as delivered:

- checkout, Stripe, or payment capture of any kind
- inventory or fulfilment system operations
- patient invites or patient-facing email automation
- mobile app workflows
- clinical decision support or clinical advice
- advanced audit or reporting dashboards
- backend-persistent import history shared across devices or admin users
- automated rollback execution of imported records
- after-hours emergency SLA support unless separately contracted
- legal, privacy, or clinical sign-off on imported patient data

## Signoff Checklist

Record:

- release date/time
- environment
- commit hash
- technical operator
- Midland owner
- TypeScript check result
- build result
- admin smoke test result
- import dry-run result
- controlled execute result, if performed
- admin patient review result
- export check result, if available
- known limitations accepted
- rollback owner confirmed
- escalation owner confirmed
