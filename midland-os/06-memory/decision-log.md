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

## Phase 1 Operating Decisions

- Phase 1 import does not create Cognito patient accounts.
- Patient invite and patient email flows are not to be introduced before June 30 unless separately approved.
- Import/audit writes must remain PutItem-only for Phase 1 safety. Do not add update/upsert behaviour without a separate design decision.
- Missing imported mask data must display as missing. Do not add a fake/default mask fallback.
- Imported patient API responses must not return raw NHI.
- Checkout, inventory/fulfilment, and mobile app work are deferred beyond Phase 1.
