# Import SOP

## Purpose

This SOP describes the controlled import process for Midland Sleep biomedical CSV data.

## Responsible Roles

The CSV should be prepared by an authorised Midland staff member or agreed operations contact who understands the biomedical source data. Technical support may assist with format issues, but clinical and data ownership decisions remain with Midland.

## Pre-Import Checklist

Before import:

1. Confirm the CSV source and export date.
2. Confirm the file contains only the intended patient cohort.
3. Confirm required columns are present.
4. Confirm no real patient data is pasted into AI tools or external debugging systems.
5. Confirm the operator understands that import does not create patient accounts, emails, invitations, orders, or fulfilment tasks.

## Dry Run

1. Open the admin import workflow.
2. Upload or paste the CSV.
3. Run dry run.
4. Review validation errors.
5. Review duplicate NHI warnings.
6. Review duplicate machine serial warnings.
7. Review contact warnings.
8. Confirm the preflight state.

## Execute

Execute only if preflight has passed.

After execution, review:

- Import batch ID
- Created count
- Skipped count
- Failed count
- Created row summaries
- Skipped row reasons
- Failed row reasons

Use the import batch ID as the reference for the review. If the batch was blocked before execution, record that the import batch ID was not created because preflight did not pass.

## Explaining Batch Results

When explaining an import batch to Midland, use this structure:

1. State the import batch ID, or state that no batch ID was created because the import was blocked.
2. State created, skipped, and failed counts.
3. State whether duplicate NHI checks passed or produced skipped rows.
4. State whether duplicate machine serial checks passed or produced skipped rows.
5. State whether invalid or missing required fields blocked rows.
6. List the admin action required before retrying any skipped or failed row.

Duplicate NHI outcome:

- If a matching NHI already exists, the row must be skipped.
- Midland admin must confirm whether this is a true duplicate, a source-data error, or a patient record that needs separate review.
- Do not retry the row unchanged.

Duplicate machine serial outcome:

- If a matching machine serial already exists, the row must be skipped.
- Midland admin must confirm whether this is an existing device, a source-data typo, or an equipment assignment issue.
- Do not create a duplicate device through import.

Invalid or missing required field outcome:

- Missing or invalid required fields must be corrected in the source spreadsheet.
- Keep row numbers from the error report so the source owner can fix the correct rows.
- Re-run preflight after correction.

## Duplicate or Failed Rows

Do not force duplicate or failed rows through the system.

For duplicate or failed rows:

1. Record the row number and summary.
2. Check the source spreadsheet.
3. Confirm whether the issue is a duplicate, source-data error, or existing patient/device conflict.
4. Escalate unclear identity, clinical, or data quality issues to the nominated Midland owner.
5. Prepare a corrected import file if needed.

## What Not To Do

- Do not import when preflight is blocked or review-required.
- Do not manually create Cognito accounts for imported patients as part of this workflow.
- Do not send patient invitations from import.
- Do not send patient emails from import.
- Do not create orders from import.
- Do not paste raw NHI into AI tools, tickets, or non-approved systems.
