# Midland OS Handover Index

## What Midland OS v1 Is

Midland OS v1 is the operating layer for the Midland Sleep portal. It collects the current operating context, workflows, SOPs, known limitations, risks, release notes, and support boundaries needed to run and explain Phase 1.

It is not a separate AI product. It is not a second application. It is the documented operating system around the portal: how the platform should be used, supported, reviewed, and safely extended.

## Phase 1 Capability Summary

Phase 1 currently includes:

- admin portal foundation
- patient portal foundation
- controlled biomedical CSV import workflow
- dry-run validation and preflight before writes
- controlled execute import when preflight passes
- created/skipped/failed import result summaries
- duplicate NHI and duplicate machine serial safety checks
- imported patient visibility in the admin patient list
- imported patient drawer with patient, machine, mask, funding, and import metadata
- safe handling patterns for NHI in imported admin records
- no fake mask fallback when mask data is missing
- operational SOPs for import, admin review, release, and support
- demo and closeout evidence for Phase 1D admin review and visibility

Phase 1 does not include checkout/Stripe, inventory or fulfilment operations, patient invites, patient email flows, advanced audit dashboards, mobile app workflows, or a full analytics/reporting platform.

## Start Here

- [Midland Sleep Portal Overview](00-core-context/midland-overview.md)
- [Phase Map](00-core-context/phase-map.md)
- [Weekly Summary](06-memory/weekly-summary.md)
- [Decision Log](06-memory/decision-log.md)
- [Known Limitations](06-memory/known-limitations.md)
- [Risks](06-memory/risks.md)

## Clinic Operations

- [Biomedical Import Workflow](01-clinic-operations/biomedical-import-workflow.md)
- [Admin Review Workflow](01-clinic-operations/admin-review-workflow.md)

## SOPs

- [Import SOP](04-sops/import-sop.md)
- [Admin Review SOP](04-sops/admin-review-sop.md)
- [Release SOP](04-sops/release-sop.md)

## Support Model

- [Support Model](06-memory/support-model.md)

The support model defines included support, excluded support, retainer direction, and the boundary between technical support and Midland operational ownership. If a formal SOP version is later added under `04-sops`, this index should be updated to point to that canonical file.

## Phase 1 Evidence

- [Phase 1D Demo Script](07-outputs/phase-1/phase-1d-demo-script.md)
- [Phase 1D Closeout Summary](07-outputs/phase-1/phase-1d-closeout-summary.md)
- Day 31 rehearsal evidence lives under `07-outputs/phase-1/day-31-rehearsal/` when present in the working copy.

## How To Request Changes

Use this process for any requested change:

1. State the operational problem or desired outcome.
2. Identify whether it is a bug, support request, or feature request.
3. Link the relevant SOP or workflow page.
4. State the affected users and patient-data risk.
5. Confirm whether the change affects Phase 1 boundaries.
6. For feature requests, define acceptance criteria before implementation.
7. For anything beyond included support, treat it as a scoped change request.

Do not start vague or unlimited work. Do not treat clinical, identity, funding, or source-data decisions as technical implementation decisions.

## After Go-Live

After go-live, Midland should use this handover index as the navigation page for operations and support.

Recommended operating rhythm:

- review known limitations before stakeholder demos
- use the import SOP before any import batch
- use the admin review SOP after imports
- record release checks using the release SOP
- route support and change requests through the support model
- keep weekly summary and decision log updated when decisions change

## Ownership Boundary

OneOfZero / technical support owns implementation support, release support, and technical triage within agreed boundaries.

Midland owns clinical decisions, patient-care decisions, source-data correctness, identity decisions, funding interpretation, privacy/legal sign-off, and operational approval to proceed with imported records.

## Current Handover Position

Midland OS v1 is handover-ready as an operating layer for Phase 1 admin/import/review visibility. It should be kept current as the product moves into later phases.
