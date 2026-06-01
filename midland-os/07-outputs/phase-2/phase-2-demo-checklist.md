# Phase 2 — Admin Operations Command Centre: Demo Checklist

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-01

Instructions: Work through each section during the demo.
Mark each item ✓ Pass, ✗ Fail, or — Not demonstrated.

---

## Section 1 — Admin Patients search

| # | Step | Result | Notes |
|---|------|--------|-------|
| 1.1 | Navigate to Admin → Patients | | |
| 1.2 | Confirm default segment shows "Pending Review" patients only | | |
| 1.3 | Type a patient name in the search box — confirm results appear across all patients, not just the current segment | | |
| 1.4 | Confirm the helper text "Search results are shown across all patients." appears below the search box when a query is active | | |
| 1.5 | Type an MSID (e.g. MS-749418) — confirm that patient is found even if their status is "reviewed" | | |
| 1.6 | Click the × button — confirm search clears and the segment view is restored | | |
| 1.7 | Click "Clear all filters" — confirm search is also cleared | | |
| 1.8 | Enter a search term that matches no patients — confirm empty state reads "Check the name or Midland Sleep ID and try again." | | |

---

## Section 2 — PatientDrawer (from Patients and Orders)

| # | Step | Result | Notes |
|---|------|--------|-------|
| 2.1 | From Admin → Patients, click "View" on any patient row | | |
| 2.2 | PatientDrawer opens on the right side — confirm it shows patient name, MSID, device, and mask record | | |
| 2.3 | Close the drawer | | |
| 2.4 | Navigate to Admin → Orders | | |
| 2.5 | Click "View Patient" on any request row | | |
| 2.6 | PatientDrawer opens — confirm it shows the same patient details and order history | | |
| 2.7 | Close the drawer — confirm the Orders table is still in its previous filter/tab state | | |

---

## Section 3 — Orders Active / Completed / All tabs

| # | Step | Result | Notes |
|---|------|--------|-------|
| 3.1 | Navigate to Admin → Orders | | |
| 3.2 | Confirm the page opens on the **Active** tab by default | | |
| 3.3 | Active tab: confirm only New, Reviewing, Approved, Sent, and Needs Follow-Up requests are shown | | |
| 3.4 | Click **Completed** tab — confirm Delivered and Declined requests appear | | |
| 3.5 | Click **All** tab — confirm the full history is visible (Active + Completed combined) | | |
| 3.6 | Confirm KPI cards at the top update when switching tabs — counts reflect the current tab | | |
| 3.7 | Click a KPI card — confirm the table filters to that status | | |
| 3.8 | Click the same KPI card again — confirm the filter clears | | |

---

## Section 4 — Declined and Delivered history visibility

| # | Step | Result | Notes |
|---|------|--------|-------|
| 4.1 | On the **Completed** tab, confirm at least one Declined request is visible | | |
| 4.2 | On the **Completed** tab, confirm at least one Delivered request is visible | | |
| 4.3 | Confirm these rows show full detail: reference, patient, MSID, items, status, date | | |
| 4.4 | Confirm that Declined and Delivered requests do NOT appear in the Active tab | | |
| 4.5 | On the **All** tab, confirm Declined and Delivered rows appear alongside Active ones | | |
| 4.6 | Change a request status from Approved to Delivered — confirm the row moves from Active to Completed without a page reload | | |

---

## Section 5 — Download Report drawer

| # | Step | Result | Notes |
|---|------|--------|-------|
| 5.1 | On Admin → Orders, click "Download Report" in the page header | | |
| 5.2 | Confirm the drawer opens from the right side (same animation as Filter & Sort) | | |
| 5.3 | Confirm the drawer title reads "Download Report" | | |
| 5.4 | Confirm four window buttons are shown: 7 days / 30 days / 90 days / All time | | |
| 5.5 | Confirm the default selected window is "30 days" | | |
| 5.6 | Confirm the status summary section shows counts for: Total, New, Reviewing, Approved, Sent, Delivered, Declined, Needs Follow-Up, Needs Funding Review | | |
| 5.7 | Confirm the source summary shows: Portal, Support, Admin created, and Other (if any) | | |
| 5.8 | Change the window to "7 days" — confirm the counts update | | |
| 5.9 | Change the window to "All time" — confirm the counts update to the full dataset | | |
| 5.10 | Confirm CSV is the only enabled file format; PDF is shown as disabled / future scope | | |
| 5.11 | Press Escape — confirm the drawer closes | | |
| 5.12 | Click "Download Report" again — confirm the drawer reopens in the same state | | |

---

## Section 6 — Summary report export ("Generate report")

| # | Step | Result | Notes |
|---|------|--------|-------|
| 6.1 | Open the Download Report drawer | | |
| 6.2 | Select "30 days" window | | |
| 6.3 | Click "Generate report" | | |
| 6.4 | Confirm a CSV file downloads (filename includes date, e.g. `orders-report-2026-06-01.csv`) | | |
| 6.5 | Open the CSV — confirm it contains only two columns: **Metric** and **Value** | | |
| 6.6 | Confirm rows include: Reporting window, Total requests, New, Reviewing, Approved, Sent, Delivered, Declined, Needs Follow-Up, Needs Funding Review, Portal, Support, Admin created | | |
| 6.7 | Confirm the CSV contains NO patient names, MSIDs, NHI, email addresses, phone numbers, delivery addresses, or dollar amounts | | |

---

## Section 7 — Request-list export ("Download request list")

| # | Step | Result | Notes |
|---|------|--------|-------|
| 7.1 | On Admin → Orders, ensure some rows are visible in the table | | |
| 7.2 | Open the Download Report drawer | | |
| 7.3 | Click "Download request list (N visible rows)" | | |
| 7.4 | Confirm N matches the count of rows currently visible in the table | | |
| 7.5 | Confirm a CSV downloads with columns: Reference, Patient, MSID, Items, Status, Source, Date | | |
| 7.6 | Confirm the CSV contains no NHI, email addresses, phone numbers, delivery addresses, or dollar amounts | | |
| 7.7 | Apply a tab filter (e.g. switch to Completed tab) and repeat — confirm the exported rows match the new visible set | | |

---

## Section 8 — Patient dashboard status branching

| # | Step | Result | Notes |
|---|------|--------|-------|
| 8.1 | Log in as a patient who has no active request — confirm the dashboard shows "No active supply request" copy and a CTA to submit | | |
| 8.2 | Submit a supply request — confirm the status card changes to "new" / "Request received" copy | | |
| 8.3 | As admin, change the request to Reviewing — have patient refresh — confirm the status card reflects the reviewing state | | |
| 8.4 | As admin, change to Approved — confirm patient sees "Your request has been approved" | | |
| 8.5 | As admin, change to Sent — confirm patient sees "Supplies on the way" with a Dispatched step active | | |
| 8.6 | As admin, change to Delivered — confirm patient sees "Your supply request is complete" and the new supply form is visible again | | |
| 8.7 | As admin, change a different request to Declined — confirm patient sees declined copy and a CTA to contact the clinic — no reorder form visible | | |
| 8.8 | As admin, change to Needs Follow-Up — confirm patient sees the follow-up message and a CTA to contact the clinic | | |

---

## Section 9 — Audit history proof

| # | Step | Result | Notes |
|---|------|--------|-------|
| 9.1 | Navigate to Admin → Audit Log | | |
| 9.2 | Change a request status in Admin → Orders | | |
| 9.3 | Return to Audit Log and confirm a `REQUEST_STATUS_UPDATED` event appears with: timestamp, admin email, patient MSID, previous status, new status | | |
| 9.4 | Confirm the audit event contains no NHI, no dollar amounts, no delivery address, no email body content | | |
| 9.5 | Toggle a funding review flag — confirm a `REQUEST_STATUS_UPDATED` audit event records the funding flag change | | |
| 9.6 | Confirm the initial patient submission event (`REQUEST_CREATED`) is present in the log | | |

---

## Section 10 — Known limitations acknowledged

The following are confirmed limitations of the current deployment.

| # | Limitation | Acknowledged |
|---|-----------|-------------|
| 10.1 | No patient email or SMS notification is sent on status change. Patient must refresh their portal to see an update. | |
| 10.2 | Phase 2E (delayed email notifications) is specified but not implemented. Gates D1–D8 must be confirmed by Midland before implementation begins. | |
| 10.3 | No inventory reservation or stock deduction occurs at any stage. | |
| 10.4 | No ACC / PHO entitlement balance is deducted. Estimated cost fields are admin annotations only. | |
| 10.5 | No payment or checkout step. | |
| 10.6 | No courier or fulfilment integration. Delivered status is set manually by staff. | |
| 10.7 | Patient sees most recent request only — no request history view for patients. | |
| 10.8 | Reports are generated from currently loaded request data only. Not a live analytics platform. | |
| 10.9 | PDF report export is not implemented. Shown as future scope in the drawer. | |

---

*This checklist covers the Phase 2 Admin Operations Command Centre as deployed on 2026-06-01.*
