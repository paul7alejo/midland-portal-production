# Day 34 Admin Action Summary

## What Midland Can Now Explain

Midland can explain an import batch using four operational facts:

- Which batch was attempted or created
- How many rows were created
- How many rows were skipped
- How many rows failed

The admin explanation should then state why skipped or failed rows need follow-up:

- Duplicate NHI means the row must be identity-reviewed before any retry.
- Duplicate machine serial means the device assignment must be equipment-reviewed before any retry.
- Missing or invalid required fields mean the source spreadsheet must be corrected before any retry.

## Safe Evidence Sources

Use these sources:

- Admin import result summary
- Import manifest CSV with masked NHI
- Import error report CSV with masked NHI
- Import risk report CSV
- Import approval checklist CSV
- Admin evidence pack CSV

Do not use:

- Raw NHI in tickets, notes, AI tools, or informal documents
- Encrypted NHI values
- NHI hashes
- Browser or server console logs containing patient data

## What Failed Rows Require From Midland Admin

Failed rows are not technical noise. They require an explicit Midland data-owner decision.

For each failed or skipped row, Midland admin should record:

1. Source row number.
2. Patient name or masked identifier available in the admin evidence.
3. Reason shown by the import result.
4. Whether the issue is source-data correction, duplicate identity review, duplicate device review, or escalation.
5. Whether a corrected import file will be prepared.

## Plain-English Outcome Examples

Clean batch:

- Created count is greater than zero.
- Skipped count is zero.
- Failed count is zero.
- Midland reviews created imported patients in the admin patient register.

Duplicate NHI batch:

- Created count may be zero or lower than source row count.
- Skipped count includes rows where an existing patient matched the NHI.
- Midland reviews identity before retrying those rows.

Duplicate serial batch:

- Created count may be zero or lower than source row count.
- Skipped count includes rows where an existing device matched the machine serial.
- Midland reviews equipment assignment before retrying those rows.

Invalid required-field batch:

- Import should be blocked before records are created when preflight fails.
- Failed rows require source CSV correction.
- Midland re-runs preflight after correction.

