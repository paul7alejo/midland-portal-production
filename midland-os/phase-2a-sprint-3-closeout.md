# Phase 2A Sprint 3 Closeout — Admin Notes + Account Support Proof

Date: 2026-05-20  
Branch: phase-2a-admin-ops  
Tag: phase-2a-notes-account-support-proof-2026-05-20

## Status

Complete and deployed on `phase-2a-admin-ops`.

## Completed

- Persistent admin notes on patient drawer.
- Notes stored in DynamoDB.
- Patient list filtering fixed so note records do not appear as patients.
- Owner-only note edit.
- Owner-only note delete using internal soft delete.
- DELETE confirmation required before note deletion.
- Audit-before-mutation retained for note edit/delete.
- Runtime IAM fixed with DynamoDB `UpdateItem` permission.
- Portal account activity shows note/account events.
- Activity drawer capped to latest 20 events with scroll area.
- Portal Account ↔ Patient Record linking works by MSID.

## Important Runtime Fix

Add note worked because it used DynamoDB `PutItem`.

Edit/delete failed because they used DynamoDB `UpdateItem`, and the runtime user did not initially have `UpdateItem` permission on `midland-sleep-patients`.

Fixed by attaching:

`MidlandRuntimePatientNotesUpdatePolicy`

Allowed action:

`dynamodb:UpdateItem`

Resource:

`arn:aws:dynamodb:ap-southeast-2:260203474375:table/midland-sleep-patients`

## Important Delete/Edit Fix

Delete/edit failures were not a product-policy issue.

Final working model:

- Notes are not hard-deleted.
- Delete note uses internal soft delete.
- Delete requires typing `DELETE`.
- Audit event is written before mutation.
- Staff-facing wording uses “Delete note” / “Note deletion requested,” not “soft delete.”

Technical fix:

- `getPatientNote()` returns the real DynamoDB `pk` and `sk`.
- `softDeletePatientNote()` must use the exact `note.pk` and `note.sk`.
- Do not reconstruct note keys from MSID inside the delete/update function.

## Known Limitation

Portal Account Activity currently loads activity and caps display to 20 events client-side.

This is acceptable for Phase 2A.

Later upgrade path:

- Add API-side limit.
- Add DynamoDB GSI or query path by patient MSID.
- Add full audit log filters by patient, admin, event type, and date range.

## Do Not Reopen Unless Regression Appears

Sprint 3 is complete.

Next recommended sprint:

Phase 2A Sprint 4 — Admin Review Status / Patient Worklist Control.
