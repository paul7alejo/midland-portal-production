# Phase 2 Command Centre Demo Script

## Date

2026-06-02

## Demo objective

Show that the Midland Sleep portal has moved beyond a basic website into an admin operations platform for managing patient supply requests, funding review visibility, portal linkage, and reporting.

## Opening narrative

This phase focuses on the admin operations workflow. The goal is to help staff review patient supply requests, understand which requests need funding attention, see recent request activity, export safe reports, and keep entitlement handling clearly separated from future checkout and deduction workflows.

## Demo flow

### 1. Patient Requests Command Centre

Open Admin → Patient Requests.

Explain:

The Patient Requests page now acts as an operational command centre for staff. It gives a quick view of request volume, active review work, funding review flags, completed requests, and declined requests.

Show:
- KPI cards
- Active status tabs
- Request table
- Portal account linkage badge

### 2. KPI filters

Click each relevant KPI card:
- Requests this month
- New requests
- Needs funding review
- Delivered requests
- Declined requests

Explain:

These cards are not just display metrics. They act as operational filters so staff can quickly move from summary to the relevant worklist.

### 3. Request activity chart

Show the request activity line chart.

Explain:

The chart shows aggregate request activity only. It does not expose patient identifiers or sensitive clinical information.

Show:
- Hover tooltip
- Guide line and marker
- Click-to-filter by date

### 4. Custom date range

Open Filter & Sort.

Show:
- This week
- This month
- Custom range
- From date
- To date

Explain:

The custom date range controls both the list and the chart, so staff can review request activity over a specific period.

### 5. Request Review Drawer

Open a request.

Show tabs:
- Request
- Funding
- Patient
- History

Explain:

The drawer keeps the review workflow in one place without forcing staff to leave the request queue.

### 6. Funding review flag

Show the funding review flag/unflag action.

Explain:

Funding estimates are visibility-only at this stage. Staff can flag requests that need review, but the system does not deduct entitlement or process payment in Phase 2.

### 7. History tab

Open History.

Explain:

The history view shows safe patient request activity. It is intentionally limited to request-related events and does not expose raw audit payloads or sensitive patient data.

### 8. Reports

Open Download Report.

Show:
- Summary report
- Detailed request list

Explain:

The exports support operational review while keeping sensitive patient data controlled.

### 9. Funding & Entitlement page

Open Admin → Funding & Entitlement.

Explain:

This page is Phase 2 visibility-only. It clarifies what staff can see now and what remains future Phase 3 scope.

Show:
- Phase 2 visibility-only notice
- Default annual allowance
- Not yet tracked / not yet calculated values
- Funding review workflow section
- Phase 3 boundaries

### 10. Phase 3 boundary

Explain:

Entitlement deduction, checkout, payment, and inventory reservation are intentionally not live in Phase 2. Those are separate Phase 3 implementation items.

## Closeout statement

At this point, the platform supports a real admin workflow for reviewing patient supply requests, tracking funding review needs, viewing safe request activity, and exporting operational reports. The next decision is whether to move into delayed patient notifications, deeper audit history, or Phase 3 entitlement-aware checkout.

## Known limitations to mention

- Entitlement deduction is not implemented.
- Checkout/payment is not implemented.
- Inventory reservation is not implemented.
- Request history is patient-request-wide, not selected-request-specific.
- Delivered/declined KPIs use request created date, not status transition date.
- Chart and KPI metrics exclude admin/test rows.

## Recommended next phase options

### Option 1 — Phase 2E Delayed Patient Notifications

Admin status updates can trigger delayed patient email notifications, with cancellation/rescheduling if staff change the status.

### Option 2 — Selected Request Audit History

History can be narrowed from patient-wide request activity to selected-request-specific audit events.

### Option 3 — Phase 3 Entitlement-Aware Checkout

Build product catalogue, entitlement-aware checkout, patient co-pay, accessory recommendations, and order workflow.

## Recommended next move

Present the current Phase 2 command centre to Midland first. Do not start Phase 3 until the current workflow is accepted.
