# Import Smoke Test Checklist

## Purpose

This checklist verifies that the controlled CSV import workflow is functioning correctly before a controlled pilot or release. Run this checklist in the target environment using an approved test CSV. Do not use real patient data during smoke testing unless explicitly approved.

Pass all items before signing off on the go / no-go gate.

## Environment

Record before starting:

| Field | Value |
|---|---|
| Environment | |
| Import page URL | |
| Commit hash / release tag | |
| Test CSV used | |
| Tester | |
| Date | |

## Pre-Import Setup

- [ ] Admin is logged in with a named authorised account.
- [ ] Import page loads at `/admin/import`.
- [ ] Test CSV is prepared and has been reviewed — not real patient data unless explicitly approved.
- [ ] Test CSV includes at least one valid row with `enable_portal_access` set to `true`.
- [ ] Test CSV includes at least one row with a known issue (duplicate NHI, missing field, or blocked row) for error-path testing.

## CSV Upload

- [ ] Upload field accepts a `.csv` file.
- [ ] File is accepted and displayed without error.
- [ ] Unsupported file types (e.g. `.xlsx`) are rejected with a clear message.

## Dry Run — Validate

- [ ] Validate (dry run) button runs without error.
- [ ] Validate result shows row-level validation feedback.
- [ ] Duplicate NHI rows are flagged.
- [ ] Duplicate machine serial rows are flagged.
- [ ] Rows missing required fields are flagged.
- [ ] Rows with `enable_portal_access` missing or set to `false` are flagged or blocked.
- [ ] Validate writes zero records to DynamoDB — confirmed by checking admin patient list shows no new records.

## Preflight / Review

- [ ] Preflight step runs and reports ready or blocked.
- [ ] Blocked rows are listed with clear reasons.
- [ ] All rows require `enable_portal_access = true` before execute is allowed.
- [ ] Auto-clean candidate CSV is offered if formatting issues are detected.
- [ ] Execute button is disabled if preflight is not passed.

## Execute — Blocked Row Case

- [ ] Uploading a CSV with blocked rows and attempting execute produces zero record writes.
- [ ] Blocked execute result displays zero created, zero skipped, zero portal accounts created.
- [ ] No import history row is created for a fully blocked execute that writes nothing.

## Execute — Successful Clean Import

- [ ] Execute runs after preflight passes.
- [ ] Created, skipped, and failed counts are displayed in the result panel.
- [ ] Portal users created count is visible in the result panel.
- [ ] Temporary passwords are displayed in the result panel for portal users created.
- [ ] Temporary passwords are visible exactly once — they do not persist after navigation or reload.
- [ ] Execute result does not show raw NHI for any row.
- [ ] Imported patients appear in the admin patient list at `/admin/patients` after execute.

## Import History — Friendly ID

- [ ] After a successful execute, a friendly import ID is displayed in the result (format: `IMP-YYYYMMDD-NNN`).
- [ ] Import history section shows a new row for the completed batch.
- [ ] The history row displays the friendly import ID as the primary identifier.
- [ ] The history row shows the UUID batch ID in a secondary format.

## Import History — Browser-Local Persistence

- [ ] After navigating away from the import page and returning, the import history row is still present.
- [ ] After a full page reload, the import history row is still present.
- [ ] History displays `N batches · this browser` or equivalent wording to communicate local scope.
- [ ] A note or label makes clear that history is stored in this browser only.

## Batch Details Sheet

- [ ] Clicking a history row (or the view details button) opens the batch details sheet.
- [ ] Batch details sheet displays the friendly import ID as the primary title.
- [ ] Batch details sheet displays the UUID batch ID in a secondary format.
- [ ] Created, skipped, and failed counts match the execute result.
- [ ] Failed rows are listed with row number, patient name, machine serial, and reason.
- [ ] Skipped rows are listed with row number, patient name, machine serial, and reason.
- [ ] Portal users created are listed with row number, patient name, and username.
- [ ] No raw NHI appears in the batch details sheet.
- [ ] No temporary passwords appear in the batch details sheet.

## Evidence Downloads

- [ ] Batch summary CSV downloads correctly and contains safe operational fields only.
- [ ] Failed rows CSV downloads correctly if there are failed rows.
- [ ] Skipped rows CSV downloads correctly if there are skipped rows.
- [ ] Portal access summary CSV downloads correctly if portal users were created.
- [ ] None of the downloaded CSVs contain raw NHI, encrypted NHI, or NHI hashes.
- [ ] None of the downloaded CSVs contain temporary passwords.
- [ ] Downloaded filenames are descriptive and include the batch ID or friendly ID.

## Safety and Privacy

- [ ] Raw NHI does not appear in the import result panel.
- [ ] Raw NHI does not appear in the import history list.
- [ ] Raw NHI does not appear in the batch details sheet.
- [ ] Raw NHI does not appear in any downloaded evidence CSV.
- [ ] Raw NHI does not appear in browser console logs during the smoke test.
- [ ] Temporary passwords do not appear in the import history list.
- [ ] Temporary passwords do not appear in the batch details sheet.
- [ ] Temporary passwords do not appear in any downloaded evidence CSV.

## Session Expiry Handling

- [ ] If execute returns `Unauthorized`, the admin is shown a clear message or redirect to log in again.
- [ ] After re-login, the admin can return to the import page and retry the import.
- [ ] Re-login does not result in a duplicate import or missing history row.

## Pass / Fail Summary

| Section | Result | Notes |
|---|---|---|
| Pre-import setup | Pass / Fail | |
| CSV upload | Pass / Fail | |
| Dry run — validate | Pass / Fail | |
| Preflight / review | Pass / Fail | |
| Execute — blocked row case | Pass / Fail | |
| Execute — successful import | Pass / Fail | |
| Friendly import ID | Pass / Fail | |
| Browser-local persistence | Pass / Fail | |
| Batch details sheet | Pass / Fail | |
| Evidence downloads | Pass / Fail | |
| Safety and privacy | Pass / Fail | |
| Session expiry handling | Pass / Fail | |

**Overall import smoke test result:** Pass / Fail

Tester sign-off: ___________________________

Date: ___________________________
