# Midland OS Handover Index

## What Midland OS v1 Is

Midland OS v1 is handover-ready as the operating and documentation layer for Phase 1 admin, import, review, and release workflows. Future expansion should be handled through scoped change requests and later-phase delivery, not assumed within Phase 1.

It is not a separate AI product, a second app, or a fake expansion of the portal. It is the handover documentation around the portal: how the platform should be used, reviewed, supported, and safely extended.

## What Phase 1 Includes

Phase 1 currently includes:

- admin portal foundation
- patient portal foundation
- controlled biomedical CSV import workflow
- dry-run validation and preflight before writes
- controlled execute import when preflight passes
- created/skipped/failed import result summaries
- duplicate NHI and duplicate machine serial checks
- imported patient visibility in the admin patient list
- imported patient drawer with patient, machine, mask, funding, and import metadata
- NHI-safe imported patient admin handling
- no fake mask fallback when mask data is missing
- SOPs for import, admin review, release, and support boundaries
- Phase 1D demo and closeout evidence

Phase 1 does not include checkout/Stripe, inventory or fulfilment operations, mobile app workflows, patient invites, patient email flows, advanced audit dashboards, fake analytics, or a complete reporting platform.

## Canonical Docs

Start here:

- [Midland Sleep Portal Overview](00-core-context/midland-overview.md)
- [Phase Map](00-core-context/phase-map.md)
- [Weekly Summary](06-memory/weekly-summary.md)
- [Decision Log](06-memory/decision-log.md)

Clinic operations:

- [Biomedical Import Workflow](01-clinic-operations/biomedical-import-workflow.md)
- [Admin Review Workflow](01-clinic-operations/admin-review-workflow.md)

SOPs:

- [Import SOP](04-sops/import-sop.md)
- [Admin Review SOP](04-sops/admin-review-sop.md)
- [Release SOP](04-sops/release-sop.md)

Memory and governance:

- [Known Limitations](06-memory/known-limitations.md)
- [Risks](06-memory/risks.md)
- [Support Model](06-memory/support-model.md)

Phase 1 outputs:

- [Day 50 Final Phase 1 Closeout and Readiness Checkpoint](07-outputs/phase-1/day-50-final-closeout-readiness.md)
- [Day 49 Stakeholder Demo and Handover Walkthrough](07-outputs/phase-1/day-49-stakeholder-demo-handover.md)
- [Phase 1D Demo Script](07-outputs/phase-1/phase-1d-demo-script.md)
- [Phase 1D Closeout Summary](07-outputs/phase-1/phase-1d-closeout-summary.md)
- [Phase 1E Closeout Summary](07-outputs/phase-1/phase-1e-closeout-summary.md)

## How To Request Changes

Use this process for changes after handover:

1. State the operational problem or desired outcome.
2. Identify whether it is a bug, support request, or feature request.
3. Link the relevant SOP or workflow.
4. State the affected users and patient-data risk.
5. Confirm whether the request changes Phase 1 boundaries.
6. Define acceptance criteria before implementation.
7. Treat work outside support boundaries as a scoped change request.

Do not start vague or unlimited work. Do not treat clinical, identity, funding, or source-data decisions as technical implementation decisions.

## After Go-Live

After go-live, Midland should use this index as the navigation page for operating the portal.

Recommended rhythm:

- review known limitations before stakeholder demos
- use the import SOP before import batches
- use the admin review SOP after imports
- use the release SOP for release/rehearsal checks
- route support and changes through the support model
- update weekly summary and decision log when decisions change

## Ownership Boundary

OneOfZero / technical support owns implementation support, release support, and technical triage within agreed boundaries.

Midland owns clinical decisions, patient-care decisions, source-data correctness, identity decisions, funding interpretation, privacy/legal sign-off, and operational approval to proceed with imported records.

## Handover Position

Midland OS v1 is handover-ready as an operating layer for Phase 1 admin/import/review visibility. It should be kept current as the product moves into later phases.
