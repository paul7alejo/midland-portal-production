# Controlled Pilot Readiness Checklist

## Purpose

This checklist defines the minimum readiness conditions for Midland Sleep to proceed with a controlled pilot of the admin portal, CSV import workflow, and patient portal.

A controlled pilot is a bounded, supervised test with a limited and known patient cohort, a named set of admin users, and agreed escalation contacts. It is not a full unrestricted production launch. All limitations listed in the Known Limitations document remain in effect during the pilot.

## Pilot Scope

The controlled pilot covers:

- admin login and patient list review
- controlled CSV import of an agreed patient cohort
- portal account creation for the imported cohort
- patient drawer review by admin staff
- patient portal login and record review by a small subset of imported patients, if agreed

The pilot does not cover:

- checkout or payment flows
- inventory or fulfilment operations
- patient invites sent automatically by the system
- automated patient email flows
- mobile app workflows
- multi-clinic use or tenant separation
- clinical decisioning or clinical data entry
- advanced audit dashboards or reporting platforms
- backend-persistent import batch history shared across devices
- automated rollback of imported records
- SSO, Terraform, or infrastructure management

## Allowed Pilot Users

Before the pilot starts, confirm:

- [ ] Named Midland admin users are identified and their accounts are provisioned.
- [ ] Each admin user has completed at minimum one dry-run import review.
- [ ] Escalation contacts are confirmed for both Midland (operational owner) and OneOfZero (technical support).
- [ ] Patient portal access is limited to the agreed pilot cohort only.
- [ ] No external or untested admin users will be given access during the pilot period.

## Allowed Pilot Data

- [ ] The source file is from an approved Midland source system and is prepared by an authorised Midland staff member.
- [ ] The patient cohort is limited to the agreed pilot group — not the full patient list.
- [ ] The file has been reviewed and preflight-validated before execute.
- [ ] No real patient data has been pasted into AI tools, informal channels, or non-approved systems.
- [ ] No test records or dummy patients are mixed into the pilot cohort import file.

## Go / No-Go Gate

Go only when all of the following are confirmed:

- [ ] Admin smoke test checklist passes.
- [ ] Import smoke test checklist passes.
- [ ] Patient portal smoke test checklist passes, if patient-facing access is part of the pilot.
- [ ] TypeScript check passes: `npx tsc --noEmit`.
- [ ] Production build passes: `npm run build`.
- [ ] Amplify deployment is confirmed successful.
- [ ] Admin authentication smoke test passes in the target environment.
- [ ] NHI does not appear in raw form in any admin screen, evidence output, or browser log reviewed during the smoke test.
- [ ] Temporary passwords from a test import were captured correctly and not stored in import history.
- [ ] Import history shows friendly import IDs and batch details after returning to the history view.
- [ ] Known limitations are accepted in writing by the Midland owner.
- [ ] Rollback limitation is understood: automated reversal of imported records is not available.
- [ ] Support and escalation contacts are confirmed and reachable.

Do not proceed if any item above is not confirmed or remains uncertain.

## Pre-Pilot Setup Checklist

Environment:

- [ ] Production or agreed pilot environment is confirmed.
- [ ] Amplify deployment is the most recent release.
- [ ] Commit hash and release tag are recorded.
- [ ] Admin login URL is confirmed and reachable.
- [ ] Patient portal URL is confirmed and reachable, if patient access is in scope.

Admin accounts:

- [ ] Named admin users can log in successfully.
- [ ] Admin accounts are not shared between staff members.
- [ ] Admin users understand they should not share credentials.

Import preparation:

- [ ] Pilot CSV file is ready and has been preflight-validated in a dry run.
- [ ] Required columns are confirmed present, including `enable_portal_access`.
- [ ] All rows have `enable_portal_access` set to `true`.
- [ ] Duplicate NHI and machine serial checks have been reviewed.
- [ ] Invalid rows have been corrected or removed.

## Privacy and Data-Handling Checklist

- [ ] No raw NHI will be pasted into tickets, AI tools, emails, or informal notes at any point during the pilot.
- [ ] Temporary passwords will be handled according to Midland's agreed security policy and not forwarded by email unless explicitly approved.
- [ ] Batch evidence CSVs downloaded from import history will be stored only in approved Midland locations.
- [ ] Patient records reviewed by admin staff will not be shared outside the agreed pilot team.
- [ ] If a data handling concern arises during the pilot, it will be escalated to the Midland owner before continuing.
- [ ] The pilot will not involve accessing, exporting, or processing patient data beyond the agreed pilot cohort.

## Known Limitations Acknowledgement

The Midland owner confirms they understand and accept the following limitations before proceeding:

- [ ] Import history is stored in the admin browser only. It will not appear on other devices, other browsers, or after browser data is cleared.
- [ ] Rollback of imported records is a placeholder only. Automated reversal is not available. Any reversal requires a separately approved data remediation plan.
- [ ] No backend-persistent import batch history is shared across devices or admin users.
- [ ] NHI reveal is disabled in the current admin MVP. Imported patient NHI cannot be viewed in the admin drawer during the pilot.
- [ ] No patient invites or automated patient emails are triggered by any current workflow.
- [ ] No checkout, payment, inventory, or fulfilment operations are available.
- [ ] This is a controlled pilot. Not all edge cases have been tested with real patient data.

## Support and Escalation Path

During the pilot, escalate as follows:

Escalate to the Midland operational owner when:

- a patient identity, source-data, or equipment conflict requires a decision
- an admin user is unsure whether a record should proceed to downstream use
- a data handling concern arises

Escalate to OneOfZero technical support when:

- admin login fails unexpectedly
- import execute returns an unexpected error or `Unauthorized` response
- imported records do not appear in the admin patient list after a confirmed successful import
- evidence outputs are unavailable or inconsistent with the displayed result
- the patient portal does not load or login fails for an imported patient

If execute returns `Unauthorized` mid-import, the admin user should log in again and retry the import. This is a known session expiry behaviour.

## Rollback and Manual Recovery Note

Automated rollback is not implemented. If an import creates incorrect records during the pilot:

1. Stop the current import immediately.
2. Record the import batch ID and the affected row details.
3. Escalate to OneOfZero technical support with the batch ID and a description of the issue.
4. Do not attempt to re-import or correct records manually without a confirmed recovery plan.
5. Do not delete or modify DynamoDB records directly.
6. A data remediation plan must be reviewed and approved by the Midland owner and OneOfZero before any correction is made.

## Signoff Section

| Field | Value |
|---|---|
| Pilot date | |
| Environment | |
| Commit hash / release tag | |
| Midland operational owner | |
| OneOfZero technical contact | |
| Admin smoke test passed | Yes / No |
| Import smoke test passed | Yes / No |
| Patient portal smoke test passed | Yes / No / Not in scope |
| Known limitations accepted | Yes / No |
| Support contacts confirmed | Yes / No |
| Pilot go/no-go decision | Go / No-go |
| Decision recorded by | |

## Explicit Exclusions

The following are not part of this controlled pilot and must not be presented or assumed as delivered:

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
