# Patient Lifecycle

> What happens to a patient record from first arrival to (eventual) Phase 2 reorder.
> Phase 1B covers steps 1–4. Steps 5–7 are explicitly out of Phase 1B scope.

## Step 1 — Onboarded at Midland (off-portal)

```text
- Sleep study, consultation, prescription
- Machine and mask supplied
- Record kept in ALTER and/or Midland's spreadsheet
- NHI collected (Midland's responsibility)
- This step is OUT of OneOfZero's scope
```

## Step 2 — Imported via portal (Phase 1B in scope)

```text
- Midland exports batch from ALTER / spreadsheet
- OneOfZero validates + imports via controlled import workflow
- DynamoDB record created (patient + device + mask + entitlement)
- Audit row written
- See: 01-clinic-operations/biomedical-import-workflow.md
```

## Step 3 — Reviewed by admin (Phase 1B in scope)

```text
- Admin opens patient list, reviews imported batch
- Drawer review per record
- Status set to Reviewed / Action needed / Escalated
- See: 01-clinic-operations/admin-review-workflow.md
```

## Step 4 — Visible to patient (Phase 1B in scope, post Cognito provisioning)

```text
NOTE: Phase 1B does NOT auto-create patient Cognito accounts during import.
      Patients are provisioned via existing Midland process; portal access
      becomes available once Cognito patient user exists.

When the patient logs in:
  - dashboard shows their machine, mask, entitlement YES/NO
  - they can submit a reorder request (server-side, not order placement)
  - they can update their own contact details
  - they can reveal their own NHI for 30s in Profile (audit logged)
  - they can Download My Data (HIPC Rule 6, 5/day rate limit)
```

## Step 5 — Reorder (Phase 1B partial — request only)

```text
PHASE 1B   patient submits a reorder REQUEST → admin approves → Midland phones supplier
PHASE 2+   automated supplier integration, status updates, fulfilment tracking
```

## Step 6 — Optional purchase (Phase 2 — DORMANT in 1B)

```text
PHASE 2 ONLY   shop, Stripe checkout, Patient Price 10% off CPAP machines
PHASE 1B       /portal/shop and /portal/checkout return 404 in production
               code lives in src/phase2/, not imported
```

## Step 7 — Long-term retention (Phase 5 — out of scope)

```text
Future: reminders, education, reorder nudges, support pathways.
Not Phase 1B. Do not build email automation.
```

## Termination / departure

```text
Patient leaves clinic   record marked inactive, retained per NZ Health Act (10 years)
Patient deceased        record marked, retained per NZ Health Act (10 years)
Patient requests deletion (HIPC) → escalate to Midland Privacy Officer; technical
                        deletion via AWS console only, IAM-protected, audit logged
```

## What this is NOT

```text
- a clinical pathway (Midland owns clinical decisions)
- a reminder / outreach system (Phase 5)
- a marketing journey (never)
- an automated upsell sequence (never)
```
