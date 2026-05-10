# Phase 1D Demo Script - Admin Review + Visibility

## Demo Purpose

Show Midland that Phase 1D has a controlled admin review and visibility flow for imported patient records.

This demo is operational, not analytical. It proves that staff can validate an import, execute only when safe, see created/skipped/failed outcomes, review imported patient records, inspect machine and mask details, and understand the current safety boundaries.

Use demo data only. Do not use real patient data.

## Evidence Used

This script is based on existing Phase 1 evidence:

- `midland-os/07-outputs/phase-1/day-31-rehearsal/day-31-closeout-summary.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/admin-import-page-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/clean-dry-run-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/clean-execute-api-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/duplicate-nhi-api-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/duplicate-serial-api-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/admin-list-and-drawer-notes.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/no-mask-evidence-notes.md`

Day 31 rehearsal result: PASS.

## Opening Talk Track

Today we are showing the admin import review path, not a patient-facing workflow and not a reporting dashboard.

The important safety point is that dry run validates and preflights the file without writing records. Production writes only happen through the controlled execute path, and only when preflight passes.

Import does not create patient portal accounts, Cognito users, invites, emails, orders, fulfilment tasks, or inventory movements.

## Demo Steps

### 1. Open Admin Import

Navigate to `/admin/import`.

Show:

- Import Patients page is visible.
- Preview-only and real-import boundary messaging is visible.
- CSV preview, validation, duplicate review, preflight manifest, approval checklist, and evidence pack areas are visible.

Evidence anchor:

- Day 31 admin import page evidence passed.

Talk track:

The import page is the control point. It lets staff review data quality before patient records are changed.

### 2. Dry-Run Validation

Run or describe the clean demo CSV dry run.

Show or state:

- Dry run validates required fields.
- Dry run checks duplicate NHI risk.
- Dry run checks duplicate machine serial risk.
- Dry run computes preflight readiness.
- Dry run does not create or update patient records.

Evidence anchor:

- Day 31 clean demo patient CSV dry-run passed.
- No patient records were created during the dry-run evidence step.

Talk track:

This is safe preflight. It gives Midland a chance to fix invalid rows or duplicate risks before any write is attempted.

### 3. Controlled Execute Import

Use the Day 31 clean execute evidence.

Show or state:

- Clean execute returned HTTP 200.
- Created count was 1.
- The demo patient record was created.
- Execute was controlled by preflight.

Evidence anchor:

- Day 31 clean execute returned HTTP 200 and created 1 demo patient record.

Talk track:

This is the controlled write point. It is not automatic and it is not connected to patient emails, invites, orders, or fulfilment.

### 4. Created / Skipped / Failed Summary

Explain batch outcomes using the proven Day 31 cases.

Use these examples:

| Scenario | Proven result | Meaning for Midland |
| --- | --- | --- |
| Clean execute | Created 1, skipped 0, failed 0 | One imported admin record was created for review. |
| Blocked execute | HTTP 400, created 0 | Preflight did not pass, so no records were created. |
| Duplicate NHI | Created 0, skipped 1, failed 0 | Matching NHI was protected; admin must identity-review before retry. |
| Duplicate serial | Created 0, skipped 1, failed 0 | Matching machine serial was protected; admin must equipment-review before retry. |

Talk track:

Created means the row became an imported admin record. Skipped means the row was valid-looking but a safety check found an existing patient or device conflict. Failed means the row requires correction or separate review before retry.

Failed or skipped rows require Midland admin action. They are not to be forced through unchanged.

### 5. Imported Patient Visible In Admin List

Navigate to `/admin/patients`.

Show:

- Imported demo patient appears in the admin patient list.
- Review status is visible.
- Import metadata is available through the imported record flow.

Evidence anchor:

- Day 31 imported demo patient appeared in the admin patient list.

Talk track:

Once imported, the record is visible to admin staff for review. This is staff visibility, not patient portal activation.

### 6. Patient Drawer

Open the imported patient drawer.

Show:

- Overview tab opens successfully.
- Patient summary fields are displayed.
- Segment shows Imported.
- Import batch ID is visible where available.
- Review status is visible.

Evidence anchor:

- Day 31 patient drawer opened successfully.
- Import batch ID was visible.

Talk track:

The drawer gives staff enough operational context to review the imported patient without exposing raw NHI.

### 7. Machine / Device Details

Open the Equipment tab.

Show:

- Machine brand and model.
- Machine serial.
- Device details where available.
- Mask details where imported.

Evidence anchor:

- Day 31 equipment tab displayed machine and mask details.

Talk track:

The imported equipment data is visible for review. This is important for confirming machine assignment before downstream operational use.

### 8. No Fake Mask Fallback

Use the no-mask evidence.

Show or state:

- If no mask was imported, the drawer displays `No mask record imported`.
- The system does not invent a default mask.

Evidence anchor:

- Day 31 no-mask patient displayed `No mask record imported` with no fake fallback.

Talk track:

Missing mask data stays missing. Midland staff can see that a record needs follow-up rather than relying on a false default.

### 9. No Raw NHI Exposure

Open or describe the NHI tab for imported records.

Show or state:

- Raw NHI is not exposed in the admin imported patient drawer.
- The NHI tab states that NHI is stored securely and admin reveal is not enabled in the MVP.

Evidence anchor:

- Day 31 NHI tab did not expose raw NHI.

Talk track:

Imported records remain NHI-safe in the admin UI. NHI is not shown for imported admin review in this MVP.

### 10. Export Bridge Checkpoint

Show the imported-patient export bridge if it is present in the demo environment.

Expected demo if present:

- Admin can export imported patient operational fields.
- Export is limited to safe operational fields such as name, MSID / portal ID, phone, funding, machine details, mask details, import batch ID, review status, and imported timestamp.
- Export must not include raw NHI, encrypted NHI, or NHI hashes.

If the export bridge is not present in the demo environment, state this as a limitation rather than faking it:

```text
The admin review flow is demoable end-to-end. Imported-patient export remains a management visibility checkpoint unless enabled in this environment. It must remain limited to safe operational fields and must not expose NHI.
```

Talk track:

This is a management/reporting convenience, not a finance system, analytics dashboard, or backend workflow.

## Known Limitations To State

- Import writes are not transactional yet.
- Test records currently exist in DynamoDB.
- Admin review status is display-only.
- Imported-patient NHI reveal is not available in the admin MVP.
- Import does not create Cognito patient accounts.
- Import does not send patient invites or emails.
- Import does not create orders or fulfilment work.
- Import does not perform inventory movements.
- Spreadsheet handling is limited to the agreed Phase 1 import shape.
- Export bridge should be demonstrated only if present in the target environment; otherwise it remains a follow-up visibility item.

## Close

Phase 1D is demoable as an admin review and visibility milestone.

The proven flow is:

1. Dry-run validation and preflight without writes.
2. Controlled execute import only after preflight passes.
3. Created/skipped/failed result explanation.
4. Imported patient visible in admin list.
5. Patient drawer review.
6. Machine and mask visibility.
7. No fake mask fallback.
8. No raw NHI exposure.
9. Export bridge checkpoint where enabled.
10. Known limitations stated clearly.

