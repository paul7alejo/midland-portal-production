# Decision Log

## Day 28

- Controlled execute import was added behind the preflight gate.
- Execute import writes only when preflight state is passed.
- Duplicate NHI and duplicate machine serial checks were added before writing imported records.
- Import does not create Cognito users, patient invites, emails, orders, or fulfilment tasks.

## Day 29

- Admin patients API was added with sanitized responses.
- Imported patients became visible in the admin patient list and drawer.
- Imported patient detail uses real imported device and mask data.
- Imported records without mask data show `No mask record imported`.
- Imported NHI reveal is disabled in the MVP.

## Day 34

- Import batch results were documented as evidence/admin visibility rather than a new reporting system.
- Midland admin explanation now centers on batch ID, created count, skipped count, failed count, duplicate NHI outcome, duplicate machine serial outcome, and invalid required-field outcome.
- Failed and skipped rows require Midland admin source-data correction, identity review, equipment review, or escalation before retry.
- No backend workflow, schema, analytics dashboard, or patient-facing behavior was added.

<<<<<<< HEAD
## Day 36

- Import SOP was finalized as a clinic-ready operational runbook.
- Midland remains owner of source-data accuracy, identity decisions, equipment conflict decisions, and approval of corrected retry files.
- Phase 1 import boundaries remain explicit: no patient accounts, emails, invites, orders, fulfilment tasks, inventory movements, or clinical decisioning.
- No backend changes or UI redesign were introduced for the SOP finalization.
=======
## Day 37

- Admin review SOP was finalized as an operational process for reviewing imported patients after import.
- Review status remains documented as display-only unless a separate approved workflow exists.
- Missing device and mask data must be reviewed against Midland source records; no default mask or inferred equipment should be invented.
- Export is documented as safe operational review only when available, with raw NHI, encrypted NHI, and NHI hashes excluded.
- The review workflow is explicitly not clinical advice and does not create invites, emails, patient accounts, orders, fulfilment tasks, or inventory movements.
