# Day 49 Stakeholder Demo and Handover Walkthrough

## Purpose

This walkthrough prepares a live Phase 1 stakeholder demo for Midland Sleep.

It is documentation and demo-prep only. It does not expand product scope, add new features, or claim that later product phases are complete.

Use demo data only. Do not use real patient data during the walkthrough.

## Demo Positioning

Phase 1 proves that Midland has a working portal foundation and a controlled admin/import/review workflow.

The demo should be framed as:

- patient portal proof
- admin portal proof
- import, review, and export proof
- handover documentation proof
- support boundary proof

Do not present Phase 1 as:

- full ecommerce
- checkout or payments
- inventory or fulfilment operations
- an advanced reporting platform
- a patient invite or email system
- a mobile app
- a complete clinical workflow platform

## What Midland Gets Now

Midland gets a Phase 1 portal and operating handover pack that can be used to demonstrate and operate the agreed foundation:

- patient portal pages for dashboard, equipment, supply request, maintenance, and profile visibility
- admin portal foundation for staff-only operational views
- protected admin routes that require authorised admin access
- controlled CSV import preview and preflight workflow
- controlled import execution path when preflight passes
- created, skipped, and failed import result handling
- duplicate NHI and duplicate machine serial protections
- imported patient visibility in the admin patient list
- imported patient drawer with patient, equipment, mask, funding, and import metadata where available
- no fake mask fallback when mask data was not imported
- NHI-safe imported patient review boundaries
- CSV review/download evidence outputs in the import workflow where available
- handover docs, SOPs, known limitations, risks, and support model

## What Is Explicitly Out Of Scope

The following are not delivered in Phase 1 and should not be claimed in the demo:

- full ecommerce
- checkout, Stripe, card payments, refunds, subscriptions, or reconciliation
- inventory management, stock reservation, dispatch, or fulfilment
- patient invite emails or patient email automation
- Cognito patient-account creation from import
- mobile app
- advanced reporting or analytics platform
- advanced audit dashboard
- editable clinical review workflow unless separately scoped
- automatic correction of source data
- clinical advice, clinical decisioning, or legal/privacy sign-off
- unlimited spreadsheet format support
- backup, disaster recovery, or formal AWS managed-service obligations unless separately contracted

## Live Demo Script

### 1. Open With The Phase 1 Boundary

Say:

```text
Today we are showing the Phase 1 foundation: patient portal visibility, staff admin visibility, controlled import review, handover documentation, and support boundaries. This is not a checkout, inventory, patient email, mobile app, or advanced reporting demo.
```

Show:

- `midland-os/HANDOVER-INDEX.md`
- `midland-os/06-memory/known-limitations.md`

Proof point:

- The handover pack states what is included and what remains outside Phase 1.

### 2. Patient Portal Proof

Navigate through the patient portal routes:

- `/portal/dashboard`
- `/portal/equipment`
- `/portal/reorder`
- `/portal/maintenance`
- `/portal/profile`

Show:

- dashboard opens for the patient portal shell
- equipment information area is present
- supply request route is present
- maintenance route is present
- profile route is present
- mobile and desktop layouts are responsive at a basic layout level

Talk track:

```text
This proves the patient-facing foundation exists for core visibility and self-service entry points. It should be described as Phase 1 portal foundation, not full ecommerce or fulfilment.
```

Boundary to state:

- Supply request visibility is not a complete checkout or payment workflow.
- The portal is not a mobile app.
- Import does not automatically create patient accounts or send invitations.

### 3. Admin Portal Proof

Navigate to:

- `/admin`
- `/admin/patients`
- `/admin/import`
- `/admin/orders`
- `/admin/reports`

Show:

- unauthenticated admin routes redirect to `/admin/login?reason=unauthorized`
- admin login route is reachable
- admin pages are staff-only protected routes
- protected route behaviour is consistent across the admin area

If demonstrating with an authorised admin session, also show:

- admin dashboard shell
- patients list
- import page
- orders view
- reports view

Talk track:

```text
This proves the staff admin foundation and access boundary. Admin pages should be treated as operational views for Phase 1, not a complete ERP, finance system, inventory platform, or analytics suite.
```

Boundary to state:

- Reports are management/admin visibility only where present.
- Orders and inventory are not full fulfilment or stock systems in Phase 1.

### 4. Import, Review, And Export Proof

Navigate to `/admin/import`.

Show:

- CSV input/upload area
- preview-only warning and real-import boundary wording
- preview/preflight workflow
- import readiness/preflight sections
- downloadable review/evidence outputs where available
- blank template download
- processed CSV downloads after a preview result where available

Talk track:

```text
The import workflow is designed to reduce risk before data changes. Preview validates and preflights the file. Execution is controlled and should only happen when preflight passes. The workflow also gives staff CSV evidence outputs for review.
```

Explain created/skipped/failed:

| Result | Meaning |
| --- | --- |
| Created | A row passed preflight and became an imported admin record. |
| Skipped | A valid-looking row was protected by a safety check, such as duplicate NHI or duplicate machine serial. |
| Failed | A row could not be imported and needs source correction, technical review, or Midland owner escalation. |

Show or cite:

- `midland-os/07-outputs/phase-1/day-31-rehearsal/api-test-results.md`
- `midland-os/07-outputs/phase-1/day-31-rehearsal/admin-import-page-notes.md`
- `midland-os/07-outputs/phase-1/day-34-import-batch-results/admin-action-summary.md`

Boundary to state:

- Import does not create patient portal accounts.
- Import does not send emails or invites.
- Import does not create orders or fulfilment tasks.
- Import does not reserve or decrement inventory.
- NHI exports must not expose raw NHI, encrypted NHI, or NHI hashes.

### 5. Imported Patient Review Proof

Navigate to `/admin/patients` with demo data available.

Show:

- imported patient visible in the admin patient list
- imported status or review status where present
- patient drawer opens
- overview fields are visible
- machine/device details are visible where imported
- mask details are visible where imported
- missing mask data stays explicit as `No mask record imported`
- import batch metadata is visible where available

Talk track:

```text
This proves staff can review imported records operationally. Missing data is not invented. Imported records remain staff-review records until Midland completes its own operational review.
```

Boundary to state:

- Admin review is not clinical advice.
- Admin review status is display-only unless a separate approved workflow exists.
- Imported-patient NHI reveal is not part of the admin MVP.

### 6. Handover Docs Proof

Open `midland-os/HANDOVER-INDEX.md`.

Show the key sections:

- What Phase 1 Includes
- Canonical Docs
- How To Request Changes
- Ownership Boundary
- Handover Position

Then show:

- `midland-os/04-sops/import-sop.md`
- `midland-os/04-sops/admin-review-sop.md`
- `midland-os/04-sops/release-sop.md`
- `midland-os/04-sops/support-model.md`
- `midland-os/06-memory/known-limitations.md`
- `midland-os/06-memory/risks.md`
- `midland-os/06-memory/decision-log.md`

Talk track:

```text
The handover is not just the portal. Midland also receives the operating layer: how to run import review, release checks, support triage, known limitations, risks, and future change requests.
```

Proof point:

- Midland has a navigation index and SOPs for operating the agreed Phase 1 scope.

### 7. Support Boundary Proof

Open:

- `midland-os/04-sops/support-model.md`
- `midland-os/06-memory/support-model.md`

Show:

- included monthly support
- excluded work
- bug vs feature request boundary
- change request process
- Midland ownership boundary

Talk track:

```text
Support is bounded around the agreed Phase 1 workflows. Bugs in agreed workflows can be triaged through support. New workflows, checkout, inventory, patient emails, account changes, advanced dashboards, and major redesigns require separate scope.
```

Boundary to state:

- Midland owns source-data correctness, clinical decisions, identity decisions, funding interpretation, privacy/legal sign-off, and operational approval.
- Technical support owns implementation support and triage within agreed boundaries.

### 8. Close The Demo

Say:

```text
Phase 1 is ready to demonstrate as a bounded portal foundation plus controlled admin/import/review handover. The delivered value is operational control and visibility, not an expanded ecommerce, inventory, email, mobile, or analytics platform.
```

Close with the five proof points:

1. Patient portal foundation is present.
2. Admin portal boundary and staff views are present.
3. Import preview, review, execution boundary, and CSV evidence outputs are present.
4. Handover SOPs and operating memory are present.
5. Support and change-request boundaries are documented.

## Stakeholder Questions To Answer Directly

| Question | Honest answer |
| --- | --- |
| Can patients buy supplies online now? | No. Phase 1 includes portal foundation and supply request visibility, not full ecommerce or checkout. |
| Does import create patient accounts? | No. Imported patients are staff-review records unless account onboarding is separately scoped. |
| Are patient invites or emails included? | No. Invite and email workflows are out of scope for Phase 1. |
| Is this an inventory system? | No. Equipment and mask information is review visibility, not stock control or fulfilment. |
| Is reporting complete? | No. Reports are limited management/admin visibility where present, not an advanced reporting platform. |
| Can staff safely review imported patients? | Yes, within the documented admin review boundaries and with demo/proven import evidence. |
| Does the admin imported patient drawer expose raw NHI? | No. Imported-patient review is NHI-safe in the MVP boundary. |
| What happens after handover? | Support follows the documented support model. New scope goes through a change request. |

## Demo Checklist

Before the live demo:

- Confirm demo environment is available.
- Use demo data only.
- Confirm patient portal routes open.
- Confirm admin unauthorised redirects and login route.
- Confirm authorised admin access if showing protected admin pages live.
- Confirm import demo CSV is available if running a preview.
- Confirm exports/downloads are demonstrated only where available.
- Keep `HANDOVER-INDEX.md` open as the documentation anchor.
- Keep `known-limitations.md` ready for scope questions.
- Do not imply Phase 2 or later capabilities are already delivered.

## Known Warnings To State If Asked

- Import writes are not transactional yet.
- Test records currently exist in DynamoDB.
- Admin review status is display-only unless separately scoped.
- Imported-patient NHI reveal is not part of the admin MVP.
- Some admin pages are lightweight operational views.
- Support response expectations are not guaranteed resolution times.
- Future features require scoped approval before implementation.
