# known-limitations.md
# Honest list of what Phase 1B does NOT do
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz
# This file is for staff, demos, and internal reference — not patient-facing

---

## Why This File Exists

A known limitation documented is better than a surprise at go-live.
This file is the honest boundary between "what works" and "what is deferred."
Share relevant sections with Midland staff during training.

---

## Import Limitations

```
[ ] Import writes are NOT transactional
    If a write fails partway through a batch, earlier records remain.
    Mitigation: dry-run first; review created/skipped/failed summary carefully.

[ ] Test records may exist in production DynamoDB tables
    Must be audited and removed before real data migration.

[ ] Not all spreadsheet column formats are accepted
    Only the documented column set (see import-sop.md) is supported.
    Unmapped columns are ignored silently.

[ ] No automated ALTER / Biomedical sync
    Import is a one-time controlled process, not a live sync.
    Data must be re-exported from ALTER for each future batch.

[ ] No unlimited import volume guarantee
    Phase 1 is designed for 50–100 record rehearsals + the production migration.
    Very large batches (1,000+ rows) have not been load-tested.
```

---

## Patient Data Limitations

```
[ ] No Cognito patient accounts created during import
    Patients imported in Phase 1B cannot log in until admin-initiated
    Cognito accounts are created separately (Phase 2 workflow).

[ ] No patient invite or welcome email flow
    No automated email is sent to imported patients.

[ ] Imported patient NHI reveal is admin-only in MVP
    Patient self-reveal of NHI in /portal/profile requires
    the admin-initiated account creation flow (not in 1B import).

[ ] Missing mask data shows "Not recorded"
    If a patient has no mask record in the import, the admin drawer
    shows "Not recorded". No fake/default mask is generated.
    Staff must follow up with Biomedical or Midland records.
```

---

## Admin Portal Limitations

```
[ ] Admin review status may be display-only
    Review status (pending / reviewed) is shown but write-back
    may not be fully wired in the initial release.

[ ] No advanced analytics or BI dashboard
    Phase 1 provides CSV exports. A full reporting dashboard
    with charts, trends, and utilisation graphs is Phase 2+.

[ ] No order fulfilment workflow
    Admin can see reorder requests but no fulfilment pipeline,
    dispatch confirmation, or tracking is included in Phase 1B.

[ ] No inventory or stock management
    No SKUs, stock levels, or supplier integration in Phase 1B.
```

---

## Commerce + Payment Limitations

```
[ ] No shop or checkout in Phase 1B production
    Shop and checkout routes return 404.
    Stripe is not deployed in production.
    Phase 2 activation: Month 12 contract review.

[ ] No water chamber or hose sales (clinical safety rule)
    These items are excluded from any future shop by design.
```

---

## Mobile + UX Limitations

```
[ ] No native mobile app
    The portal is mobile-responsive in the browser.
    A PWA or native app is Phase M1/M2 (post Phase 4).

[ ] 1F patient visual clarity is stretch only
    Full older-patient readability polish may not be in the initial
    June 30 release. Core contrast and font size requirements will be met.
```

---

## Compliance / Legal Limitations

```
[ ] Not a clinical tool
    The portal does not provide medical advice, clinical assessment,
    or compliance with clinical device regulations.

[ ] Not a legal or compliance certification
    OneOfZero has designed for HIPC 2020 alignment but does not
    certify compliance. Privacy Officer sign-off is required.

[ ] M365 data residency pending confirmation
    Midland must confirm AU data residency for M365 and implement
    an internal policy preventing patient NHI/clinical data in email.
```

---

## Infrastructure Limitations

```
[ ] No restore or delete from portal
    DynamoDB restore and record deletion must be done via AWS console.
    This is a deliberate safety constraint (Rule 17).

[ ] Single region (ap-southeast-2)
    No multi-region redundancy in Phase 1.
    SLA: AWS Amplify + DynamoDB standard availability.

[ ] Terraform / IaC not implemented
    Infrastructure is managed via AWS console and Amplify console.
    Terraform planned for months 5–6 post-launch.
```

---

## Version

Last updated: May 10, 2026 (v3.1)
Next review: at every release SOP checkpoint
