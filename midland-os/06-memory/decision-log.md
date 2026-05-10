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

## Day 39

- Support model was finalized as bounded monthly support, not unlimited development or vague emergency cover.
- Retainer anchor is NZD 2,300/month including GST unless commercial terms change in writing.
- Bug fixes for agreed workflows, import/admin guidance, release checks, and minor maintenance are included within bounded monthly capacity.
- New features, checkout/Stripe, inventory/fulfilment, patient invites/emails, Cognito/account changes, advanced dashboards, clinical decisions, after-hours SLA, and major infrastructure work require separate scope.
