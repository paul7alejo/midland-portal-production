# Biomedical Import Workflow

The biomedical import workflow converts an approved Midland clinic CSV or biomedical spreadsheet export into controlled imported patient records for admin review.

## Clinic Flow

1. Midland prepares or approves the source file.
2. Admin confirms the file matches the agreed CSV shape.
3. Admin runs dry run.
4. System validates required fields and row formats without writing records.
5. System checks duplicate NHI and duplicate machine serial values.
6. System computes preflight state.
7. Midland admin reviews warnings, invalid rows, and evidence outputs.
8. Admin executes import only when preflight passes and Midland approval is clear.
9. System returns import batch ID plus created, skipped, and failed row summaries.
10. Admin reviews imported patients in `/admin/patients`.

## Batch Result Meaning

- Import batch ID identifies the execute attempt. If preflight blocks execution, no batch ID is created.
- Created means rows written as imported admin records.
- Skipped means rows not written because a safety check found a duplicate patient NHI or duplicate machine serial.
- Failed means rows that require source correction, technical review, or Midland owner escalation before retry.
- Duplicate NHI rows require Midland identity review.
- Duplicate machine serial rows require Midland equipment review.
- Invalid or missing required fields require source spreadsheet correction.

## Post-Import Admin Review

After execute, staff should confirm:

- imported patients appear in `/admin/patients`
- imported patient drawer opens
- machine brand, model, and serial display correctly
- mask details display only when imported
- missing mask data displays `No mask record imported`
- raw NHI is not exposed
- import batch ID and review status are visible where available

## Operational Constraints

- No Cognito accounts are created during import.
- No patient invites are sent during import.
- No patient emails are sent during import.
- No orders are created during import.
- No fulfilment tasks are created during import.
- No inventory movements are performed during import.
- No raw NHI is returned through the admin patient API.
- Imported records are for staff review before downstream operational use.
- Import result evidence should use aggregate counts, row numbers, masked NHI where already provided, and operational reasons only.
