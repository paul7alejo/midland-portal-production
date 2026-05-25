# Admin Smoke Test Checklist

## Purpose

This checklist verifies that the admin portal is functioning correctly before a controlled pilot or release. Run this checklist in the target environment against real admin credentials, not test credentials.

Pass all items before signing off on the go / no-go gate.

## Environment

Record before starting:

| Field | Value |
|---|---|
| Environment | |
| Admin login URL | |
| Commit hash / release tag | |
| Tester | |
| Date | |

## Admin Login

- [ ] Admin login page loads at the expected URL.
- [ ] Unauthorised access to `/admin/patients` without login redirects to the login page or returns an appropriate error.
- [ ] Named admin user can log in with their credentials.
- [ ] Admin session is established after login — admin patient list is reachable.
- [ ] Incorrect credentials are rejected — error message displayed, no access granted.

## Admin Dashboard and Navigation

- [ ] Admin dashboard loads after login.
- [ ] Navigation to `/admin/patients` succeeds.
- [ ] Navigation to `/admin/import` succeeds.
- [ ] Navigation to `/admin/portal-accounts` succeeds.
- [ ] No broken links or 404 errors in the primary navigation.

## Patient List

- [ ] `/admin/patients` loads without error.
- [ ] Patient list displays at least one record if the environment has imported patients.
- [ ] Patient search or filter works for a known patient name.
- [ ] Patient list does not display raw NHI in any column or row.
- [ ] Pagination or scroll works if the patient list is long.

## Patient Drawer

- [ ] Clicking a patient row opens the patient drawer.
- [ ] Drawer header displays the patient name.
- [ ] Drawer does not display raw NHI in any field label or value.
- [ ] Drawer closes correctly when dismissed.

## Patient Drawer — Work Tab

- [ ] Work tab opens without error.
- [ ] Machine brand, model, serial, and setup date display if imported.
- [ ] Mask brand and model display if imported.
- [ ] Missing mask data displays `No mask record imported` — no fake or default mask is shown.
- [ ] Device ID displays if imported.
- [ ] Funding fields display if imported.

## Patient Drawer — Record Tab

- [ ] Record tab opens without error.
- [ ] Patient demographic fields display where imported.
- [ ] No raw NHI appears in any record field.
- [ ] Import batch ID and import metadata display where available.

## Patient Drawer — Notes Tab

- [ ] Notes tab opens without error.
- [ ] Existing notes display for patients that have notes.
- [ ] Adding a note succeeds and the note appears in the list.
- [ ] Notes are attributed to the correct admin user.
- [ ] Note edit is available only to the admin user who created the note.
- [ ] Soft delete of a note is available only to the owning admin.
- [ ] No hard delete option is present.

## Patient Drawer — History Tab

- [ ] History tab opens without error.
- [ ] Activity and audit history entries display in readable form.
- [ ] No raw NHI, encrypted NHI, or NHI hash appears in the history list.
- [ ] No raw temporary passwords appear in the history list.

## Portal Account Section

- [ ] Portal account section displays in the patient drawer for imported patients with `enable_portal_access = true`.
- [ ] Account status (active, locked, etc.) displays correctly.
- [ ] Password reset workflow is accessible.
- [ ] Account unlock workflow is accessible where the account is locked.
- [ ] Attempting a reset or unlock shows audit confirmation before completing the action.

## Portal Accounts Admin Page

- [ ] `/admin/portal-accounts` loads without error.
- [ ] Portal account list displays imported patients with portal access.
- [ ] Search by patient name or username returns correct results.
- [ ] Filter by account status works.
- [ ] No raw NHI appears in the portal accounts list.

## NHI Safety

- [ ] Raw NHI does not appear in the patient list at `/admin/patients`.
- [ ] Raw NHI does not appear in any drawer tab during a normal review.
- [ ] Raw NHI does not appear in the portal accounts list.
- [ ] Raw NHI does not appear in browser console logs visible during the smoke test.
- [ ] NHI reveal is confirmed disabled in the current MVP — no reveal button is accessible.

## Pass / Fail Summary

| Section | Result | Notes |
|---|---|---|
| Admin login | Pass / Fail | |
| Dashboard and navigation | Pass / Fail | |
| Patient list | Pass / Fail | |
| Patient drawer | Pass / Fail | |
| Work tab | Pass / Fail | |
| Record tab | Pass / Fail | |
| Notes tab | Pass / Fail | |
| History tab | Pass / Fail | |
| Portal account section | Pass / Fail | |
| Portal accounts page | Pass / Fail | |
| NHI safety | Pass / Fail | |

**Overall admin smoke test result:** Pass / Fail

Tester sign-off: ___________________________

Date: ___________________________
