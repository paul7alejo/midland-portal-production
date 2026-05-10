# Biomedical Import Workflow

The biomedical import workflow converts a clinic CSV or biomedical spreadsheet export into controlled imported patient records for admin review.

Workflow:

1. CSV / biomedical spreadsheet is prepared.
2. Admin runs dry run.
3. System validates required fields and row formats.
4. System checks duplicate NHI and duplicate machine serial values in the upload.
5. System computes preflight state.
6. Admin executes import only when preflight passes.
7. System returns created, skipped, and failed row summaries.
8. Admin reviews imported patients in `/admin/patients`.

Batch result explanation:

- The import batch ID identifies a successful execute attempt. If preflight blocks execution, no batch ID is created.
- Created count means rows written as imported admin records.
- Skipped count means rows not written because a safety check found a duplicate patient NHI or duplicate machine serial.
- Failed count means rows that require source correction or technical review before retry.
- Duplicate NHI rows require Midland identity review.
- Duplicate machine serial rows require Midland equipment review.
- Invalid or missing required fields require source spreadsheet correction.

Operational constraints:

- No Cognito accounts are created during import.
- No patient invites are sent during import.
- No patient emails are sent during import.
- No orders are created during import.
- No raw NHI is returned through the admin patient API.
- Imported records are for staff review before downstream operational use.
- Import result evidence should use aggregate counts, row numbers, masked NHI where already provided, and operational reasons only.
