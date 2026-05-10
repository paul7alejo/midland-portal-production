# Known Limitations

> What is NOT working perfectly in Phase 1B. Honest, public-facing.
> Updated at every milestone. Read alongside the support model.

## Data and import

```text
[KL-001] Import writes are not transactional yet.
         Effect:  partial batch can be in DynamoDB if process is interrupted mid-batch
         Mitigation: per-row outcomes returned, audit row written, batch ID present
                     for retry. Restart from same batch ID is idempotent at row level.
         Plan:    full transactional import = Phase 2 backlog item

[KL-002] Test records remain in DynamoDB.
         Effect:  approximately N test/demo records in production tables
         Mitigation: clearly tagged with org_id and is_test flag where present;
                     filtered out of admin views by default
         Plan:    cleanup before Day 50 go-live (manual, AWS console)

[KL-003] Imported patient NHI reveal is disabled in the imported drawer in MVP.
         Effect:  admins cannot reveal NHI on freshly-imported patients until they
                  appear in the standard patient view
         Mitigation: deliberate — reduces NHI exposure surface on day-of-import
         Plan:    revisit after 30 days of operational use
```

## Patient access

```text
[KL-004] No Cognito patient accounts created during import.
         Effect:  imported patients cannot log in until provisioned via Midland's
                  existing process (or manual creation by staff)
         Mitigation: aligns with HIPC posture; avoids accidental credential creation
         Plan:    Phase 2 — patient invitation flow

[KL-005] No patient invite/email flow.
         Effect:  patients are not notified of portal access automatically
         Mitigation: Midland communicates portal access through existing channels
         Plan:    Phase 2

[KL-006] No order/fulfilment workflow.
         Effect:  reorder requests are recorded, but fulfilment is via Midland's
                  existing phone/supplier process
         Mitigation: order_type ENTITLEMENT records the request faithfully;
                     admin sees the request in the orders table
         Plan:    Phase 4 — fulfilment + supplier integration
```

## Admin

```text
[KL-007] Admin review status is display-only if mutation is not safely wired.
         Effect:  admin can SEE status but may not change it from drawer in v0.30
         Mitigation: documented in admin-review-workflow.md; mutation work is
                     scoped for Day 32 polish if safe
         Plan:    Day 32 polish if it can be done without risk; otherwise Phase 2

[KL-008] No inventory integration.
         Effect:  portal does not know stock levels of any item
         Mitigation: out of Phase 1B scope by design
         Plan:    Phase 4
```

## UI

```text
[KL-009] Drawer formatting needs polish (timestamps, phone, device IDs).
         Effect:  cosmetic only
         Mitigation: queued for Day 32
         Plan:    Day 32

[KL-010] Older-patient readability not yet audited.
         Effect:  font sizes, contrast, tap targets may not be optimal
         Mitigation: 1F sprint (Days 46–49) is stretch; backlog if dropped
         Plan:    1F if runway holds; otherwise Phase 1.5 polish post go-live
```

## System

```text
[KL-011] No portal-driven restore or delete (by design — Rule 17).
         Effect:  restore requires AWS console access
         Mitigation: documented in deployment-runbook.md and release-sop.md;
                     dual-control via IAM
         Plan:    not exposed in any phase — operational policy

[KL-012] Backup smoke test currently manual.
         Effect:  PITR / on-demand / weekly snapshot are verified manually pre-release
         Mitigation: smoke test step in release-sop.md (Rule 18)
         Plan:    automate via CI workflow Year 2

[KL-013] Single-region (ap-southeast-2). No DR region.
         Effect:  if Sydney region has a sustained outage, portal is offline
         Mitigation: PITR + S3 backups allow restore to a fresh region in
                     emergency; DynamoDB Global Tables not yet enabled
         Plan:    multi-region DR is a Phase 6 / multi-clinic architecture decision
```

## Compliance

```text
[KL-014] HIPC compliance items remain 🟡 until evidence captured.
         Effect:  rules are designed-for-compliance; full sign-off requires
                  Privacy Officer review of evidence pack
         Mitigation: tracking doc at docs/compliance/HIPC-2020-compliance-report.md
         Plan:    Day 50 go-live readiness includes Privacy Officer sign-off

[KL-015] Internal email policy required for M365 (if Midland confirms).
         Effect:  requires written policy that NHI / clinical data never enters
                  Midland email; backup tool required for 10-year retention
         Mitigation: Midland-side responsibility (HIPC Rule 12)
         Plan:    confirm with Midland before go-live
```

## How to use this list

```text
- Append new limitations as they are discovered, with KL-NNN id.
- Never remove an entry. If it is resolved, add a "Resolved" note with the date
  and the release version that resolved it.
- This file is shared with Midland at handover. Honesty here builds trust.
```
