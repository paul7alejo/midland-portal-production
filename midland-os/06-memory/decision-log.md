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

## Day 36

- Import SOP was finalized as a clinic-ready operational runbook.
- Midland remains owner of source-data accuracy, identity decisions, equipment conflict decisions, and approval of corrected retry files.
- Phase 1 import boundaries remain explicit: no patient accounts, emails, invites, orders, fulfilment tasks, inventory movements, or clinical decisioning.
- No backend changes or UI redesign were introduced for the SOP finalization.

## Day 37

- Admin review SOP was finalized as an operational process for reviewing imported patients after import.
- Review status remains documented as display-only unless a separate approved workflow exists.
- Missing device and mask data must be reviewed against Midland source records; no default mask or inferred equipment should be invented.
- Export is documented as safe operational review only when available, with raw NHI, encrypted NHI, and NHI hashes excluded.
- The review workflow is explicitly not clinical advice and does not create invites, emails, patient accounts, orders, fulfilment tasks, or inventory movements.

## Day 38

- Phase 1 release language was finalized as honest and bounded.
- Release SOP now requires go/no-go, pre-release, smoke, admin/import/export, rollback, escalation, signoff, and support-boundary checks.
- Known limitations explicitly state no checkout/Stripe, no inventory/fulfilment system, no mobile app, no patient invites/accounts/emails, and no advanced audit dashboard.
- Phase 1 remains an admin/import/review visibility release, not a fake analytics, audit, backup, finance, fulfilment, or patient onboarding system.

## Day 39

- Support model was formalized as a bounded post-go-live operating agreement, not unlimited support.
- Included monthly support, excluded work, response expectations, emergency handling, bug vs feature distinction, change request handling, monthly improvement cadence, AWS/hosting boundaries, and clinic staff support boundaries were documented.
- Retainer anchor is NZD 2,300/month incl GST unless commercial terms change in writing.
- Support remains operational and technical in scope, not clinical, payroll, finance-system, or general-business administration support.

## Day 40

- Midland OS handover index was added as the main entry point for handover.
- Handover documentation now explains what Midland OS v1 is, what Phase 1 includes and excludes, where to find key SOPs and workflows, how to request changes, and what happens after go-live.
- Midland OS v1 is explicitly positioned as an operating/documentation layer around the portal, not a separate AI product.

## Day 41

- Risks, decisions, learnings, and weekly summary were cleaned up into a clearer operating memory layer.
- The Phase 1 operating truths were locked in one place: no Cognito patient accounts from import, no patient invite/email flow before June 30, PutItem-only import/audit rule, no fake mask fallback, no raw NHI returned from imported patient APIs, and checkout/inventory/mobile deferred.
- Day 41 did not add product scope or new backend behavior; it improved continuity and handover quality.

## Day 42

- Midland OS v1 handover pack was finalized as a coherent, navigable Phase 1 operating layer.
- HANDOVER-INDEX, release SOP, known limitations, support model, and closeout summary were tightened for handover quality and honest scope control.
- Phase 1 capability is now stated clearly as usable now for admin/import/review/export operations, with future scope required for checkout, inventory, advanced audit, patient invites, and broader expansion.
- Day 42 added no new backend or patient-facing product scope; it finalized the handover layer.
