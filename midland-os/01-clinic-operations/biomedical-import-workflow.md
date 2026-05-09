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

Operational constraints:

- No Cognito accounts are created during import.
- No patient invites are sent during import.
- No patient emails are sent during import.
- No orders are created during import.
- No raw NHI is returned through the admin patient API.
- Imported records are for staff review before downstream operational use.
