# Phase 2A Sprint 4 Closeout — Admin Review and Outreach Worklist

Date: 2026-05-21  
Branch: phase-2a-admin-ops

## Status

Complete and deployed on `phase-2a-admin-ops`.

## Completed

- Patient review status control in PatientDrawer.
- Review action moved to the top Review Cues card.
- Recent Patient Activity added to PatientDrawer.
- Activity capped to latest 20 events with Audit Log link.
- Patient worklist simplified.
- Notes support Cmd/Ctrl + Enter to add.
- Needs outreach flag added.
- Needs Outreach KPI updates.
- Needs outreach badge appears on patient row.
- KPI cards now act as worklist selectors:
  - Total Patients
  - Pending Review
  - Needs Outreach
- Default worklist remains Pending Review.
- All mode shows all patient records.
- Pending Review mode shows review queue.
- Needs Outreach mode shows follow-up queue.

## Important Runtime Lesson

Admin note edit/delete failed because create used DynamoDB PutItem, while edit/delete used DynamoDB UpdateItem. Runtime IAM required UpdateItem permission on `midland-sleep-patients`.

Policy added:

`MidlandRuntimePatientNotesUpdatePolicy`

## Known Limitations

- Safety Checks Due and Eligible Now are still KPI cards only, not real worklists yet.
- Needs Outreach is a simple flag only. No assignments, due dates, call logging, SMS, email, or templates yet.
- Activity is capped for drawer UX; full investigation belongs in Audit Log.
- FilterPanel chips can still combine with worklist modes and may show zero rows in edge cases.

## Next Recommended Sprint

Phase 2A Sprint 5 — Safety Check / Clinical Admin Caution Workflow.

Do not build messaging or SMS yet.
