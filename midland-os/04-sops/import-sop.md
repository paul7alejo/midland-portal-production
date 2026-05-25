# Import SOP

## Purpose

This SOP describes the clinic-ready process for importing Midland Sleep biomedical patient data into the admin review workflow.

The import workflow is for controlled staff review of imported patient, machine, mask, contact, and funding information. It is not a patient onboarding workflow and it is not an order, fulfilment, email, or inventory workflow.

## Ownership of Source Data

Midland owns the source data and the clinical/data-quality decisions behind it.

The source file must be prepared or approved by an authorised Midland staff member or agreed operations contact who understands the biomedical source system. Technical support may help with file format and import tooling, but Midland remains responsible for:

- confirming the intended patient cohort
- confirming source-data accuracy
- resolving identity conflicts
- resolving equipment serial conflicts
- approving any corrected retry file

## Accepted File Formats

Accepted for Phase 1:

- CSV using the agreed Midland patient import columns
- biomedical spreadsheet export converted to the agreed CSV shape before import

Not accepted:

- screenshots
- PDFs
- ad hoc pasted tables with missing headers
- files with columns renamed outside the agreed import shape
- files containing patients outside the agreed cohort

## Required Fields Checklist

Before dry run, confirm the source file includes the agreed import headers:

- `full_name`
- `nhi`
- `date_of_birth`
- `email`
- `phone`
- `address`
- `machine_brand`
- `machine_model`
- `machine_serial`
- `machine_setup_date`
- `mask_brand`
- `mask_model`
- `mask_size`
- `funded_by`
- `enable_portal_access`

Rows missing required identity, contact, or machine fields must be corrected before execute. `enable_portal_access` must be `true` for all rows — rows where it is `false` or missing are blocked before execute. Optional mask fields may be blank only when Midland is intentionally importing no mask record for that patient. The admin drawer must then show `No mask record imported`; staff must not assume a default mask.

## Pre-Import Checklist

Before using the admin import workflow:

1. Confirm the CSV source system and export date.
2. Confirm the file contains only the intended patient cohort.
3. Confirm the file uses the accepted CSV format.
4. Confirm required columns are present.
5. Confirm no real patient data has been pasted into AI tools, informal notes, or non-approved systems.
6. Confirm the operator understands import scope:
   - portal accounts are created for rows where `enable_portal_access` is `true`
   - temporary passwords are shown once at import time and are not stored — they must be captured immediately
   - no patient invites are sent
   - no patient emails are triggered automatically
   - no orders or fulfilment tasks are created
   - no inventory movements are performed
7. Confirm the nominated Midland owner is available for duplicate or failed-row decisions.

## Dry Run Process

Dry run validates and preflights the file without writing patient records.

1. Open the admin import workflow.
2. Upload or paste the CSV.
3. Run dry run.
4. Review validation errors.
5. Review duplicate NHI warnings.
6. Review duplicate machine serial warnings.
7. Review shared contact warnings.
8. Review the preflight state.
9. Download or save available evidence files when needed.

Do not execute import if preflight is blocked or review-required.

## Approval Process

Before execute, Midland admin must confirm:

1. Invalid rows are corrected or removed.
2. Duplicate NHI groups are resolved or removed.
3. Duplicate machine serial groups are resolved or removed.
4. Shared contact warnings have been reviewed.
5. The preflight state has passed.
6. The file is still the intended source file.
7. The Midland owner approves execution for this batch.

Approval means the batch can be executed into imported admin records for staff review. It does not approve patient portal activation, emails, orders, or fulfilment.

## Execute Process

Execute only if preflight has passed.

After execution, record:

- friendly import ID (for example, `IMP-20260525-001`) shown in the import history
- internal import batch ID (UUID) shown in the results panel
- created count
- skipped count
- failed count
- portal accounts created count
- temporary passwords — copy these immediately; they are shown once and cannot be retrieved later
- skipped row reasons
- failed row reasons
- date/time of execution
- admin operator

Use the friendly import ID as the human reference and the internal batch ID for technical tracing. If execution is blocked before records are created, record that no import batch ID was created because preflight did not pass.

After navigating away from the results screen, the import appears in the Import History view with a clickable batch row. Import history is browser-local only — open the batch detail sheet and download evidence CSVs before clearing browser data or switching devices.

## Result Definitions

Created:

- The source row was written as an imported admin patient record.
- The record still requires staff review before downstream operational use.

Skipped:

- The row was not written because a safety check found an existing patient or device conflict.
- Common reasons include duplicate NHI or duplicate machine serial.
- Skipped rows must not be forced through unchanged.

Failed:

- The row was invalid, incomplete, or could not be safely imported.
- Failed rows require source correction, technical review, or Midland owner escalation before retry.

## Duplicate NHI Handling

If a matching NHI already exists:

- the row must be skipped
- no second patient should be created for the same NHI
- Midland admin must review the identity conflict in approved Midland systems

Admin action:

1. Record the row number and skipped reason.
2. Compare the source row with the existing patient record.
3. Decide whether the row is a true duplicate, a source-data error, or a separate patient needing escalation.
4. Do not retry the row unchanged.
5. Prepare a corrected file only after the Midland owner decision is clear.

## Duplicate Serial Handling

If a matching machine serial already exists:

- the row must be skipped
- no second device record should be created for the same serial
- Midland admin must review the equipment assignment

Admin action:

1. Record the row number and skipped reason.
2. Check the machine serial against the source spreadsheet and existing device record.
3. Decide whether the row references an existing device, contains a typo, or needs a separate equipment review.
4. Do not create a duplicate device through import.
5. Correct the source file before retry if the serial was wrong.

## Failed-Row Handling

Failed rows require active Midland admin follow-up.

For each failed row, record:

1. Source row number.
2. Patient name or masked identifier available in the evidence output.
3. Failure reason.
4. Required correction.
5. Owner of the correction.
6. Whether the row will be retried, excluded, or escalated.

Common failed-row actions:

- add missing required fields
- correct invalid formats
- correct machine serial or setup date
- correct funding source
- remove rows outside the intended cohort
- escalate unclear identity or clinical data-quality issues

## Post-Import Verification

After a successful execute:

1. Open `/admin/patients`.
2. Confirm imported patients appear in the admin list.
3. Open at least one imported patient drawer from the batch.
4. Confirm overview details are readable.
5. Confirm machine brand, model, and serial display correctly.
6. Confirm mask details display only when imported.
7. Confirm missing mask data displays `No mask record imported`.
8. Confirm import batch ID and review status are visible where available.
9. Confirm raw NHI is not exposed.
10. Record any rows needing admin follow-up.

## Evidence Capture

For each batch, retain the available admin evidence appropriate to the batch:

- source file name and export date
- dry-run/preflight result
- friendly import ID and internal batch ID, if created
- created/skipped/failed and portal accounts created counts
- temporary passwords captured at import time (handle according to Midland security policy)
- skipped row reasons
- failed row reasons
- masked-NHI manifest or error report where available
- approval checklist or sign-off notes
- post-import verification notes
- batch summary CSV, failed rows CSV, skipped rows CSV, and portal access summary CSV downloaded from the import history detail sheet

Import history is stored in this browser only. Download batch evidence CSVs and retain them externally before clearing browser data or switching to a different device. Do not store raw NHI in tickets, AI tools, informal notes, or non-approved systems. Do not copy encrypted NHI or NHI hashes into evidence packs.

## Escalation Path

Escalate to the nominated Midland owner when:

- a duplicate NHI could represent an identity conflict
- a duplicate machine serial could represent an equipment assignment conflict
- required source data is missing and cannot be corrected by the operator
- the row appears clinically ambiguous
- the operator is unsure whether to retry, exclude, or correct a row

Escalate to technical support when:

- the accepted CSV format appears to be rejected incorrectly
- dry run or execute returns an unexpected system error
- an imported record appears in the wrong admin state
- evidence outputs are unavailable or inconsistent with the displayed result

## Phase 1 Boundaries

The Phase 1 import workflow does not:

- create Cognito patient accounts
- create patient portal access
- send patient invitations
- send patient emails
- create orders
- create fulfilment tasks
- perform inventory movements
- perform clinical decisioning
- replace Midland source-data ownership

Imported records are admin-visible records for staff review only.

## What Not To Do

- Do not execute when preflight is blocked or review-required.
- Do not force duplicate or failed rows through unchanged.
- Do not manually create patient accounts as part of import.
- Do not send patient invitations from import.
- Do not send patient emails from import.
- Do not create orders from import.
- Do not assume a default mask when mask data is missing.
- Do not paste raw NHI into AI tools, tickets, or non-approved systems.
