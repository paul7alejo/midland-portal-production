# Phase 2 Closeout Summary

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-19
Branch: `phase-2a-admin-ops`
Latest build: Amplify Job 226 — SUCCEED
Latest commit: `6b580f2` — chore: polish patient notice display

---

## What Phase 2 delivered

Phase 2 is the Admin Operations and Patient Communication layer for the Midland Sleep portal. It covers every function between a patient submitting a supply request and an admin actioning it, plus the clinic's ability to publish notices directly into the patient portal.

### Supply request lifecycle

- Patient submits a supply request from the portal (items, delivery address, contact preference).
- A generated request reference is assigned and stored in DynamoDB.
- The portal prevents duplicate submissions while an active request exists.
- Patient sees a status card with content specific to each of eight statuses: New, Reviewing, Approved, Sent, Delivered, Declined, Needs Follow-Up, and no request.
- When status is Delivered, the patient can submit a new request.

### Admin Orders command centre

- All requests visible across three tabs: Active, Completed, All.
- Inline status dropdown — admin changes status directly on the row.
- Audit event written before every status mutation.
- Funding review flag toggleable per request (internal signal, not visible to patients).
- PatientDrawer opens from any row: device, mask, and order history without leaving the page.
- Filter and Sort drawer: status, source, date range, funding flag.
- Download Report drawer: summary metric CSV and visible-row export.

### Admin Patients register

- Search across all patients regardless of active segment.
- Segments: Pending Review, Needs Outreach, Safety Checks, All.
- PatientDrawer available from the Patients page as well as Orders.

### Patient Notices (Phase 2A additions — 14C through 14F)

Admins can create, publish, expire, and archive notices that appear in the patient portal. The system supports three placements, three priority levels, and two audience types.

**Placements**

| Placement | Where it appears |
|---|---|
| Top strip | Scrolling awareness bar in the desktop portal header |
| Dashboard card | Notice card on the patient dashboard |
| Notification bell | Clinic notice item in the bell dropdown and Notifications page |

**Priority levels**

| Priority | Visual treatment |
|---|---|
| Info | Teal styling |
| Reminder | Amber styling |
| Important | Red styling |

**Audience types**

| Audience | Behaviour |
|---|---|
| All patients | Visible to every authenticated portal user |
| Single patient | Targeted by MSID; accepts bare digits or prefixed format, then normalises to MS-\<number\>. |
| Selected patients | UI tab visible, disabled — coming soon |

**Governance**

- Admin cannot publish a second all-patient notice if one with the same placement, priority, and overlapping schedule is already active. The server returns a 409 with a clear message.
- All notice mutations are audit-logged before the write.
- Notices are never hard-deleted — status cycles Draft → Published → Expired/Archived.

**Patient experience**

- Top strip hides when no active notice exists — no hardcoded fallback copy.
- Bell badge count is `request-status unread + unseen clinic notice count`.
- Clinic notice badge clears locally after the patient opens the bell (localStorage-tracked per browser).
- Priority pill ("Info", "Reminder", "Important") shown on dashboard cards, bell dropdown, and Notifications page.

---

## Deployment proof

| Sprint | Commit | Amplify Job | Result |
|---|---|---|---|
| 14C — Patient portal notice display | 7acd962 | 223 | SUCCEED |
| 14D — Notice governance tabs and duplicate protection | 3a0cf4c | 224 | SUCCEED |
| 14E — Notice MSID input and bell badge | a3670ba | 225 | SUCCEED |
| 14F — Notice display polish and local seen state | 6b580f2 | 226 | SUCCEED |

TypeScript: passing. Production build: passing.

---

## What this phase is not

See `phase-2-known-limitations.md` for the complete list. Short version: no SMS, no email, no server-side read receipts, no inventory, no payment, no entitlement sync, no analytics, no PWA.

---

## Commercial position

Phase 2 is complete and closeout-ready. The branch is stable, proofed, and Amplify-deployed. Recommended next step is a Midland walkthrough to collect staff feedback before scoping Phase 3.

For support, retainer, and next-phase options see `phase-2-support-and-next-phase.md`.
