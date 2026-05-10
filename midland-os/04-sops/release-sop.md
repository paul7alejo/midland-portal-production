# Release SOP

## Purpose

This SOP defines the bounded Phase 1 release and rehearsal process for Midland Sleep.

Phase 1 release is an admin/import/review visibility release. It is not a launch of checkout, Stripe, patient portal onboarding, patient invites, email automation, fulfilment, inventory operations, or a reporting/analytics platform.

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
11. No raw NHI is visible in admin UI, export, evidence, logs, screenshots, or API responses used for demo/release evidence.
12. Known limitations are accepted by Midland.
13. Rollback owner and escalation owner are named.

No-go if any are true:

- raw NHI appears where it should not
- unauthorized admin API access succeeds
- dry run writes records
- blocked or review-required execute writes records
- imported patient records cannot be reviewed in admin
- no owner is available for duplicate identity/equipment decisions
- release scope is being presented as checkout, fulfilment, email, patient onboarding, advanced audit, or analytics

## Pre-Release Checks

Before production release or rehearsal:

1. Confirm `git status` is clean or all changes are intentionally included.
2. Record commit hash.
3. Record environment.
4. Run `npx tsc --noEmit`.
5. Run `npm run build`.
6. Confirm required environment variables are configured for the target environment.
7. Confirm admin login route is reachable.
8. Confirm release notes list known limitations.
9. Confirm test/demo data is clearly identified.
10. Confirm no real patient data is pasted into AI tools, informal notes, or non-approved systems.

## Smoke Test Checklist

Core admin:

1. Admin login succeeds for authorised admin.
2. Unauthorized admin access redirects or returns `401` as appropriate.
3. Admin dashboard loads.
4. Admin sidebar navigation loads without broken visible routes.
5. `/admin/patients` loads.
6. `/admin/import` loads.

Privacy and safety:

1. Imported-patient NHI reveal remains disabled in the MVP.
2. Raw NHI does not appear in patient drawer.
3. Raw NHI does not appear in safe evidence outputs.
4. No fake/default mask is shown when mask data is missing.

## Admin / Import / Export Checks

Import dry run:

1. Upload or paste an approved demo CSV.
2. Run dry run.
3. Confirm validation summary appears.
4. Confirm duplicate NHI and duplicate serial checks appear.
5. Confirm dry run does not write patient records.

Blocked import:

1. Use an invalid or blocked test file.
2. Confirm execute is blocked or returns an error.
3. Confirm created count is `0`.
4. Confirm no patient records are created.

Controlled execute:

1. Use an approved clean demo file only.
2. Execute only after preflight passes.
3. Confirm import batch ID is returned when records are created.
4. Confirm created/skipped/failed summary is understandable.
5. Confirm duplicate NHI rows are skipped, not duplicated.
6. Confirm duplicate machine serial rows are skipped, not duplicated.

Admin review:

1. Open `/admin/patients`.
2. Confirm imported patient appears.
3. Open the patient drawer.
4. Confirm overview fields display.
5. Confirm machine brand, model, serial, setup date, and device ID display where imported.
6. Confirm mask details display only where imported.
7. Confirm missing mask data displays `No mask record imported`.
8. Confirm imported metadata such as batch ID and review status display where available.

Export:

1. Demonstrate imported-patient export only if the approved export exists in the target environment.
2. Confirm export is limited to safe operational fields.
3. Confirm export excludes raw NHI, encrypted NHI, and NHI hashes.
4. Store export only in approved Midland locations.
5. If export is not available, state it as a known limitation rather than manually extracting data.

## Rollback Notes

Rollback planning must be agreed before live patient migration.

At minimum, record:

- previous deployable commit
- current release commit
- person authorised to approve rollback
- person responsible for carrying out rollback
- communication contact at Midland
- evidence to capture before rollback

Rollback does not automatically undo imported patient records. If imported records need correction or removal, that must be handled through a separately approved data remediation plan.

## Escalation Notes

Escalate to Midland owner when:

- duplicate NHI requires identity decision
- duplicate machine serial requires equipment decision
- imported data conflicts with Midland source records
- review status or operational readiness is unclear
- staff are unsure whether a record should proceed to downstream operational use

Escalate to technical support when:

- admin login fails for authorised staff
- import dry run or execute returns unexpected system errors
- blocked import writes records
- imported patient is missing after a successful created result
- drawer or export displays unsafe fields
- build/typecheck fails during release preparation

## Signoff Checklist

Record signoff before release or rehearsal closeout:

- Release date/time
- Environment
- Commit hash
- Technical operator
- Midland owner
- TypeScript check result
- Build result
- Admin smoke test result
- Import dry-run result
- Controlled execute result, if performed
- Admin patient review result
- Export check result, if available
- Known limitations accepted
- Rollback owner confirmed
- Escalation owner confirmed

## Support Boundaries

Phase 1 support covers:

- admin access support
- import dry-run and controlled execute support
- imported patient list and drawer review support
- safe operational export support if enabled
- evidence and SOP clarification
- investigation of unexpected import/admin display behaviour

Phase 1 support does not cover:

- checkout or Stripe payment operations
- inventory or fulfilment operations
- patient portal onboarding
- patient invite or email campaigns
- clinical advice
- data correction decisions owned by Midland
- advanced audit dashboard operation
- analytics dashboard reporting
- backup or disaster-recovery systems not explicitly implemented

## Release Notes

For every release or rehearsal, record:

- commit hash
- date and time
- operator
- environment
- verification results
- known issues accepted for release
- scope exclusions restated to Midland
