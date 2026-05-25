# Go-Live Signoff Checklist

## Purpose

This document records the formal go / no-go decision for a controlled pilot or production release of the Midland Sleep admin portal, import workflow, and patient portal. It is completed only after all smoke test checklists have been run and reviewed.

This is a signoff record — not a planning document. Complete it at the time of decision. Keep a copy in an approved Midland location.

## Release Identification

| Field | Value |
|---|---|
| Release version / branch / tag | |
| Commit hash | |
| Environment | |
| Amplify deployment confirmed | Yes / No |
| Deployment date and time | |

## Technical Pre-Conditions

| Check | Result | Notes |
|---|---|---|
| TypeScript check (`npx tsc --noEmit`) | Pass / Fail | |
| Production build (`npm run build`) | Pass / Fail | |
| Amplify deployment confirmed successful | Yes / No | |
| Admin login URL reachable | Yes / No | |
| Patient portal URL reachable | Yes / No / Not in scope | |

## Smoke Test Signoff

| Checklist | Result | Tester | Date |
|---|---|---|---|
| Admin smoke test | Pass / Fail | | |
| Import smoke test | Pass / Fail | | |
| Patient portal smoke test | Pass / Fail / Not in scope | | |

## NHI and Privacy Gate

| Check | Confirmed |
|---|---|
| Raw NHI does not appear in any admin screen, evidence output, or browser log reviewed during smoke test | Yes / No |
| No temporary passwords appear in import history, batch details sheet, or evidence CSVs | Yes / No |
| No real patient data was pasted into AI tools, informal channels, or non-approved systems during preparation | Yes / No |

## Known Limitations Signoff

The Midland operational owner confirms they understand and accept the following known limitations:

| Limitation | Accepted |
|---|---|
| Import history is stored in the admin browser only. It will not appear on other devices, other browsers, or after browser data is cleared. | Yes / No |
| Rollback of imported records is a placeholder only. Automated reversal is not available. Any reversal requires a separately approved data remediation plan. | Yes / No |
| No backend-persistent import batch history is shared across devices or admin users. | Yes / No |
| NHI reveal is disabled in the current admin MVP. Imported patient NHI cannot be viewed in the admin drawer during the pilot. | Yes / No |
| No patient invites or automated patient emails are triggered by any current workflow. | Yes / No |
| No checkout, payment, inventory, or fulfilment operations are available. | Yes / No |
| This is a controlled pilot. Not all edge cases have been tested with real patient data. | Yes / No |

## Support Boundary Signoff

| Boundary | Acknowledged |
|---|---|
| OneOfZero technical support is responsible for: application bugs, import workflow errors, build and deployment checks, and safe field display issues. | Yes / No |
| Midland is responsible for: clinical decisions, patient identity decisions, source data correctness, funding interpretation, and operational approval to proceed with imported records. | Yes / No |
| After-hours emergency support is not included unless separately contracted. | Yes / No |
| Rollback requires a separately approved data remediation plan — it is not executed automatically or on demand. | Yes / No |

## Data Ownership Acknowledgement

| Statement | Acknowledged |
|---|---|
| Midland is the data controller for patient records imported into the portal. | Yes / No |
| OneOfZero is the technical operator and does not provide legal, privacy, or clinical sign-off on imported patient data. | Yes / No |
| Batch evidence CSVs downloaded from import history are Midland's responsibility to store and secure. | Yes / No |
| Import history that is not downloaded before browser data is cleared cannot be recovered by technical support. | Yes / No |

## Clinical Responsibility Boundary

| Statement | Acknowledged |
|---|---|
| Admin review of imported records is operational visibility only. It is not clinical advice. | Yes / No |
| The portal does not support clinical decisioning, clinical data entry, or clinical recommendations. | Yes / No |
| Imported patients remain staff-review records until Midland completes its operational review. | Yes / No |
| Midland's clinical staff and operational owner are responsible for all patient-care decisions. | Yes / No |

## Escalation Contacts

| Role | Name | Contact |
|---|---|---|
| Midland operational owner | | |
| Midland data handling escalation contact | | |
| OneOfZero technical support contact | | |
| Rollback approver (Midland) | | |

## Pilot Scope Confirmation

The parties confirm this release covers the following and only the following:

- admin login and patient list review
- controlled CSV import of an agreed patient cohort
- portal account creation for the imported cohort
- patient drawer review by admin staff
- patient portal login and record review by the agreed pilot cohort, if in scope

The following are not in scope and must not be presented or assumed as delivered:

- checkout, Stripe, or payment capture
- inventory or fulfilment system operations
- patient invites or patient-facing email automation triggered by the portal
- mobile app workflows
- clinical decision support or clinical advice from the system
- advanced audit or analytics dashboards
- backend-persistent import history shared across devices or admin users
- automated rollback execution
- multi-clinic or multi-tenant separation
- SSO, Terraform, or infrastructure management
- legal, privacy, or clinical sign-off on behalf of Midland

## Final Go / No-Go Decision

| Field | Value |
|---|---|
| Decision | Go / No-go |
| Reason if No-go | |
| Decision recorded by | |
| Decision date and time | |
| Midland operational owner sign-off | |
| OneOfZero technical contact sign-off | |
