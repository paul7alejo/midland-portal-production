# Weekly Summary

Day 28 completed:

- Controlled real import execution added.
- Preflight gate enforced before DynamoDB writes.
- Created, skipped, and failed summaries returned after execute.
- Duplicate NHI and machine serial safety checks added.

Day 29 completed:

- Admin patients API added.
- Imported patients visible in `/admin/patients`.
- Imported patient drawer shows real imported patient, device, mask, funding, and import metadata.
- Imported NHI reveal disabled for MVP.

Day 30 started:

- Production rehearsal documentation and safety scan started.
- Midland OS v1 documentation structure created.

Day 34 completed:

- Import batch result explanation documented for Midland admin review.
- Created, skipped, and failed counts are now described in operational terms.
- Duplicate NHI, duplicate machine serial, and invalid required-field outcomes are documented with required Midland admin actions.
- Day 34 evidence docs added under `midland-os/07-outputs/phase-1/day-34-import-batch-results/`.

Day 35 completed:

- Phase 1D admin review and visibility demo script created.
- Phase 1D closeout summary created.
- Demo story uses existing Day 31 evidence and keeps dry run, controlled execute, created/skipped/failed outcomes, admin list visibility, drawer review, equipment details, no fake mask fallback, and NHI safety explicit.
- Export bridge is treated as a checkpoint to demonstrate only when present in the target environment.

Day 36 completed:

- Import SOP rewritten as a clinic-ready operational runbook.
- Source-data ownership, accepted formats, required fields, dry run, approval, execute, result definitions, duplicate handling, failed-row handling, post-import verification, evidence capture, escalation, and Phase 1 boundaries are explicit.
- Biomedical import workflow updated to match the clinic SOP.

Day 37 completed:

- Admin review SOP finalized as a clinic-ready workflow for reviewing imported patients after import.
- Patient list, drawer review, field checks, missing device handling, missing mask handling, display-only review status, export use, escalation, and scope boundaries are explicit.
- SOP states the workflow is not clinical advice and does not create patient invites or email flows.

Day 38 completed:

- Release SOP finalized as a bounded Phase 1 release/rehearsal runbook.
- Go/no-go, pre-release checks, smoke tests, admin/import/export checks, rollback/escalation, signoff, and support boundaries are explicit.
- Known limitations rewritten with Phase 1 truths, including no checkout/Stripe, no fulfilment/inventory system, no mobile app, no patient invites/accounts/emails, and no advanced audit dashboard.

Day 39 completed:

- Support model and retainer boundaries were finalized.
- Included support, exclusions, response expectations, emergency handling, bug vs feature distinction, change request process, monthly improvement cadence, AWS/hosting boundaries, and clinic staff support boundaries are now explicit.
- Retainer anchor is documented at NZD 2,300/month incl GST unless commercial terms change in writing.

Day 40 completed:

- Midland OS handover index was added.
- The handover pack now has a practical entry point describing what Phase 1 includes, what it excludes, what Midland can use immediately, and how to request changes after go-live.

Next work:

- Production rehearsal.
- Midland review of SOPs.
- Support model confirmation.
- Editable admin review status later.
