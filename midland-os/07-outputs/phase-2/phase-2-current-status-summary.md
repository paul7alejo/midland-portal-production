# Phase 2 — Admin Operations Command Centre: Current Status Summary

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-01

---

## What is now deployed and working

### Patient supply request lifecycle

- Patient can log in to the portal and navigate to the Supply Requests page.
- Patient selects items (cushion, headgear, mask kit, filters), confirms delivery address, and chooses a contact preference.
- On submission, a reference number is assigned (e.g. REQ-749418-A) and the request is created in DynamoDB.
- The portal blocks a duplicate submission while an active request exists.
- Patient sees a status card — not a blank page — after submission.
- The status card content is status-specific: different copy, progress steps, and CTAs for each of the 8 statuses (new, reviewing, approved, sent, delivered, declined, needs_followup, and null/no-request).

### Patient dashboard branching status logic

- The dashboard shows the patient's name, MSID, device record, and mask record.
- The active request status drives the card appearance: title, body copy, progress stepper, and CTA button.
- `declined` and `needs_followup` statuses direct patients to contact the clinic — no form or CTA links to reorder.
- `delivered` unlocks the new supply request form — the patient can submit another request.
- No admin-only or financial data is visible to the patient.

### Admin Orders Command Centre

- All requests appear in the Admin Orders page under three tabs: **Active**, **Completed**, **All**.
- **Active** tab shows: New, Reviewing, Approved, Sent, Needs Follow-Up.
- **Completed** tab shows: Delivered, Declined. These requests are not hidden, lost, or soft-deleted from the default view — they are visible under Completed.
- **All** tab shows the full request history across all statuses.
- KPI cards show per-status counts for the current tab.
- Clicking a KPI card filters the table to that status.
- Admin can change request status inline via a dropdown on each row.
- Status changes save immediately (optimistic update + server PATCH + rollback on failure).
- Audit event is written to DynamoDB before the status mutation (audit-first policy).
- The funding review flag can be toggled on any request — it is an internal staff signal only.
- PatientDrawer opens from any request row: shows the patient's name, MSID, device, mask, and order history without leaving the Orders page.
- Filter & Sort drawer allows filtering by status, source, date range, and funding review flag; sorting by date or name.

### Admin Patients register

- Admin Patients search now scans all patients regardless of the active segment filter (Pending Review, Needs Outreach, Safety Checks, All).
- When a search query is active, a helper message reads: "Search results are shown across all patients."
- The × button clears search and returns to the current segment view.
- "Clear all filters" also clears the search input.
- PatientDrawer works from the Patients page as well as the Orders page.

### Download Report drawer

- Header button "Download Report" opens a right-side drawer (same visual pattern as Filter & Sort).
- Drawer contains: reporting window selector (7 days / 30 days / 90 days / All time), request status summary with counts and coloured bar, source breakdown (Portal / Support / Admin created / Other), file format selector (CSV active; PDF shown as future scope).
- "Generate report" downloads a safe summary CSV with metric and value columns only — no patient identifiers.
- "Download request list (N visible rows)" downloads the currently visible table rows as CSV. Fields: Reference, Patient, MSID, Items, Status, Source, Date.
- Report window is independent of the table date filter.

---

## What staff can do

- Review and action all incoming supply requests from the Active work queue.
- Change request status (New → Reviewing → Approved → Sent → Delivered / Declined / Needs Follow-Up).
- Flag requests for funding review — internal signal, no patient visibility.
- Open a patient's record and order history from any row without navigating away.
- Search for any patient by name or MSID, regardless of review status or segment filter.
- Filter and sort the request list by status, source, date, and funding flag.
- Download a summary report for a chosen time window (safe metric/value CSV).
- Download the current visible request list as a CSV for operational use.

---

## What patients can do

- Log into the portal and view their dashboard (device, mask, current request status).
- Submit a supply request (items + delivery address + contact preference).
- See status-specific copy and progress steps as their request moves through the workflow.
- Re-submit after a delivered request is marked complete.
- Contact the clinic when the status is Declined or Needs Follow-Up.

---

## What reports and exports are available

| Export | Who | Fields |
|--------|-----|--------|
| Summary report (Generate report) | Admin only | Metric, Value — no patient identifiers |
| Request list (Download request list) | Admin only | Reference, Patient, MSID, Items, Status, Source, Date |

No patient financial data, NHI, email address, phone number, or delivery address is included in any export.

---

## What remains read-only / display only

- Estimated cost fields on orders (estimatedItemAmount, estimatedFundedAmount, estimatedPatientCopay, estimatedRemainingAfter) are visible to admin staff only, as annotations. They are never returned to the patient API.
- The funding review flag is a staff signal — no patient visibility.
- Device and mask data in PatientDrawer is read-only; no editing from the drawer.
- KPI counts reflect currently loaded data; they are not real-time streaming counts.

---

## What is not live yet

| Feature | Status |
|---------|--------|
| Patient email / SMS notifications on status change | Not implemented. Specified as Phase 2E. |
| Inventory reservation or stock deduction | Not implemented. Future scope. |
| ACC / PHO entitlement balance deduction | Not implemented. Future scope (Phase 3). |
| Patient payment or checkout | Not implemented. Future scope. |
| Courier / fulfilment integration | Not implemented. No tracking number or delivery webhook. |
| Patient request history (multiple past requests) | Not implemented. Patient sees most recent request only. |
| PDF report export | Not implemented. Shown as future scope in the drawer. |
| Automated recurring orders | Not implemented. Patient must submit manually each time. |

---

## Phase 2E decisions still pending (D1–D8)

Phase 2E (delayed patient email notifications) is fully specified and ready for implementation, but no implementation code has been written. Implementation is gated on Midland confirming decisions D1–D8 captured in `midland-os/02-product/phase-2e-decision-capture.md`:

| Decision | Item | Status |
|----------|------|--------|
| D1 | Send notification on status change vs on delivery only | Pending |
| D2 | Notification delay window (immediate / 15 min / etc.) | Pending |
| D3 | Notification email address source (Cognito attribute vs patient-entered) | Pending |
| D4 | Reply-to address for outbound notifications | Pending |
| D5 | Sending domain and verified SES identity | Pending |
| D6 | Whether to notify on Declined | Pending |
| D7 | NZ Unsolicited Electronic Messages Act compliance confirmation | Pending |
| D8 | Email template sign-off (plain text / branded) | Pending |

Until D1–D8 are confirmed, implementation does not begin. See `midland-os/02-product/phase-2e-release-gate.md` for the full gate list.

---

*This document reflects the Phase 2 Admin Operations Command Centre as deployed on branch `phase-2a-admin-ops` as of 2026-06-01.*
