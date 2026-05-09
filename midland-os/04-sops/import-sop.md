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

- Created rows
- Skipped rows
- Failed rows
- Import batch ID

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
