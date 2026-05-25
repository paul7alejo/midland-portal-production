# Patient Portal Smoke Test Checklist

## Purpose

This checklist verifies that the patient portal is accessible and functioning correctly for imported pilot patients. Run this checklist only if patient portal access is in scope for the controlled pilot.

Use a test patient account created by an approved import. Do not use real patient credentials unless explicitly approved and the patient has consented.

Pass all items before signing off on the go / no-go gate.

## Scope

This checklist covers:

- patient login with portal credentials created at import
- first-login password change
- patient dashboard visibility
- patient record display
- access control: patient sees only their own record
- no admin-only information visible to patients
- logout

This checklist does not cover:

- checkout, payment, or subscription flows
- patient invite or patient email flows
- mobile app workflows
- clinical data entry or clinical decision support
- multi-patient or multi-clinic access

## Environment

Record before starting:

| Field | Value |
|---|---|
| Environment | |
| Patient portal URL | |
| Commit hash / release tag | |
| Test patient username | |
| Tester | |
| Date | |

## Pre-Test Setup

- [ ] Patient portal URL is confirmed and reachable.
- [ ] Test patient account was created during an approved import with `enable_portal_access = true`.
- [ ] Temporary password for the test patient has been captured at import time.
- [ ] Tester has confirmed the test account is not a real patient unless explicitly approved.

## Patient Login

- [ ] Patient portal login page loads at the expected URL.
- [ ] Test patient can log in using the username and temporary password from the import.
- [ ] Incorrect credentials are rejected — error message displayed, no access granted.
- [ ] Login does not succeed for an account that was not created by an approved import.

## First-Login Password Change

- [ ] After first login with a temporary password, the patient is prompted to set a new password.
- [ ] New password must meet complexity requirements — weak passwords are rejected.
- [ ] After setting a new password, the patient is taken to their dashboard.
- [ ] Re-logging in with the temporary password after a forced change fails — old password is invalidated.

## Patient Dashboard

- [ ] Patient dashboard loads without error after login.
- [ ] Dashboard displays the patient's own name or expected personalised content.
- [ ] No admin-only UI elements are visible (admin navigation, admin actions, import controls).
- [ ] No other patients' names or records are visible on the dashboard.

## Patient Record Display

- [ ] Patient can view their own record details.
- [ ] Equipment and machine details display if imported.
- [ ] Funding and entitlement details display if currently supported.
- [ ] Patient record does not display raw NHI, encrypted NHI, or NHI hashes.
- [ ] Patient record does not display internal admin metadata (batch IDs, import status, admin review status).
- [ ] Patient record does not display other patients' data.

## Access Control

- [ ] Patient cannot navigate to admin pages (`/admin/patients`, `/admin/import`, `/admin/portal-accounts`).
- [ ] Attempting to access an admin URL redirects to the patient portal or returns an appropriate error.
- [ ] If it is practical and safe to test with a second patient account, confirm patient A cannot view patient B's record.
- [ ] Patient cannot trigger admin actions (reset passwords for others, unlock accounts, perform imports).

## No Admin-Only Information Visible

- [ ] Raw operational audit data is not visible to the patient.
- [ ] Admin review status, admin notes, and admin caution flags are not visible to the patient.
- [ ] Import batch IDs are not visible to the patient.
- [ ] Temporary passwords, hashed passwords, or Cognito user identifiers are not visible to the patient.

## Logout

- [ ] Logout button or link is present and accessible.
- [ ] Logout completes successfully.
- [ ] After logout, navigating to a protected patient page redirects to the login page.
- [ ] Session does not persist after logout — re-entering a protected URL does not grant access without re-login.

## Pass / Fail Summary

| Section | Result | Notes |
|---|---|---|
| Pre-test setup | Pass / Fail | |
| Patient login | Pass / Fail | |
| First-login password change | Pass / Fail | |
| Patient dashboard | Pass / Fail | |
| Patient record display | Pass / Fail | |
| Access control | Pass / Fail | |
| No admin-only information visible | Pass / Fail | |
| Logout | Pass / Fail | |

**Overall patient portal smoke test result:** Pass / Fail / Not in scope

Tester sign-off: ___________________________

Date: ___________________________
