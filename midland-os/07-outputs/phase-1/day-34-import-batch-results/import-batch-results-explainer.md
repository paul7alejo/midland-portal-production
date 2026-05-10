# Day 34 Import Batch Results Explainer

## Purpose

This note explains import batch results in plain operational language for Midland admin review. It is evidence and admin visibility only. It is not an analytics dashboard and does not introduce a new backend workflow.

## Where the Result Comes From

The controlled import execute endpoint returns a batch result after an admin import attempt. The result is safe to explain using aggregate counts and row-level operational reasons.

The result includes:

- Import batch ID
- Created count
- Skipped count
- Failed count
- Created row summaries
- Skipped row summaries
- Failed row summaries

Raw NHI must not be copied into this evidence pack. NHI should be discussed only as a duplicate outcome, row reference, or masked value where the UI/export already masks it.

## How to Read the Result

| Result field | Meaning | Midland admin action |
| --- | --- | --- |
| Import batch ID | Unique identifier for the successful import attempt. It is null when preflight blocks the import before records are created. | Record this ID in the admin review notes for the batch. Use it when asking technical support to investigate a batch. |
| Created count | Number of patient rows that were written as imported admin records. | Review the created patients in the admin patient register and confirm device, mask, funding, and contact details. |
| Skipped count | Number of valid-looking rows not written because a safety check found an existing patient or device conflict. | Review the skipped row reason. Confirm whether the source row is a duplicate, an existing Midland patient/device, or a data entry issue. |
| Failed count | Number of rows that could not be written or were blocked as invalid. | Correct source data or escalate unclear issues to the nominated Midland owner before retrying. |

## Required Outcome Categories

### Duplicate NHI Outcome

Expected safe outcome:

- The row is skipped.
- No second patient is created for the matching NHI.
- The result reason is `Patient with matching NHI already exists`.

What Midland admin must do:

1. Compare the source spreadsheet row with the existing patient record using approved Midland systems.
2. Decide whether the upload row is a duplicate, a legitimate update request, or a source-data error.
3. Do not re-import the row unchanged.
4. If a correction is needed, prepare a corrected import file or raise the patient for separate admin review.

### Duplicate Machine Serial Outcome

Expected safe outcome:

- The row is skipped.
- No second device record is created for the same machine serial.
- The result reason is `Device with matching serial number already exists`.

What Midland admin must do:

1. Confirm the serial number against the source spreadsheet and device record.
2. Decide whether the source row references an existing device, has a typo, or needs a separate equipment review.
3. Do not create a replacement device from the import batch.
4. Correct the source data before retrying if the serial was wrong.

### Invalid or Missing Required Field Outcome

Expected safe outcome:

- The batch is blocked before import if preflight does not pass.
- Invalid rows appear as failed rows or preflight validation errors.
- No patient records are created for invalid rows.

What Midland admin must do:

1. Fix missing required fields in the source spreadsheet.
2. Correct invalid formats before retrying.
3. Keep row numbers from the error report so the source owner can find the issue quickly.
4. Re-run preflight before any execute attempt.

## Batch Explanation Template

Use this wording when summarising a batch to Midland:

```text
Import batch [batch ID or "blocked before batch creation"] processed [total] source row(s).

Created: [created count]
Skipped: [skipped count]
Failed: [failed count]

Duplicate NHI outcome: [none / skipped rows require identity review]
Duplicate serial outcome: [none / skipped rows require equipment review]
Invalid or missing required fields: [none / failed rows require source CSV correction]

Admin action required:
- [specific correction or review action]
```

## Day 34 Scope Boundary

This documentation makes the existing import result easier to explain. It does not add:

- A reporting dashboard
- Bulk edit
- Clinical decisioning
- Patient invites
- Email workflows
- Inventory or fulfilment logic
- New data model fields

