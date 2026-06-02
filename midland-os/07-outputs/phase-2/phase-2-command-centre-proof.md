# Phase 2 Command Centre Proof

## Date

2026-06-02

## Scope proven

### Orders Command Centre

- Real operational KPI cards
- KPI card filtering
- SVG request activity chart
- Chart hover tooltip aligned using SVG-native coordinate conversion
- Chart click-to-filter by date
- Custom date range filtering
- Chart/list filter alignment
- Status tabs
- Portal account linkage badges
- Request Review Drawer
- Patient request activity History tab
- Summary report export
- Detailed request list export
- Status update dropdown
- Funding review flag/unflag

### Funding & Entitlement

- Phase 2 visibility-only page
- Funding review workflow clarified
- Link back to Patient Requests
- Phase 3 boundaries explicit:
  - no deduction
  - no checkout
  - no payment
  - no inventory reservation

## Safety checks

- No NHI exposed
- No patient email exposed
- No phone/address exposed
- No raw audit payload exposed
- No Cognito identifiers exposed
- No patient-facing funding dollar exposure added

## Known limitations

- Entitlement deduction is not implemented
- Checkout/payment is not implemented
- Inventory reservation is not implemented
- Chart uses loaded request data only
- Delivered/declined KPIs use request created date, not status transition timestamp
- Request history in Orders is patient-request-wide, not selected-request-specific
- Chart and KPI metrics exclude admin/test rows even when test rows are visible in the table

## Demo proof checklist

- Orders page loads
- KPI filters work
- Custom date range works
- Chart hover aligns
- Chart click filters by date
- Request drawer opens
- History tab safe
- Portal badge visible
- Reports download
- Entitlement page explains visibility-only scope

## Browser proof notes

Final deployed checks confirmed:
- Orders chart hover, guide line, tooltip, marker, and click date are aligned.
- Custom date range updates both chart and list.
- Funding & Entitlement page is visibility-only and does not perform Phase 3 actions.

## Dashboard alignment proof

Commit: c211385 — fix: align dashboard with live admin data

The Admin Dashboard was updated before presentation to remove stale/static demo data and align with the same live admin sources used by Patients, Orders, and Portal Accounts.

Confirmed:
- Static demo dashboard rows removed.
- Hardcoded dashboard counts removed.
- Dashboard metrics now derive from existing admin APIs.
- Patient counts align with Patients page.
- Portal account counts align with Portal Accounts page.
- Request counts align with Orders / Patient Requests source.
- Dashboard no longer presents fake operational rows.
- No NHI, raw audit payload, Cognito IDs, or hidden identifiers are exposed.

Known limitation:
- Dashboard is an operational snapshot only. Full data reconciliation between patients, portal accounts, Cognito, and orders should be handled as a separate read-only reconciliation task if needed.

## Dashboard alignment proof

Commit: c211385 — fix: align dashboard with live admin data

The Admin Dashboard was updated before presentation to remove stale/static demo data and align with the same live admin sources used by Patients, Orders, and Portal Accounts.

Confirmed:
- Static demo dashboard rows removed.
- Hardcoded dashboard counts removed.
- Dashboard metrics now derive from existing admin APIs.
- Patient counts align with Patients page.
- Portal account counts align with Portal Accounts page.
- Request counts align with Orders / Patient Requests source.
- Dashboard no longer presents fake operational rows.
- No NHI, raw audit payload, Cognito IDs, or hidden identifiers are exposed.

Known limitation:
- Dashboard is an operational snapshot only. Full data reconciliation between patients, portal accounts, Cognito, and orders should be handled as a separate read-only reconciliation task if needed.
