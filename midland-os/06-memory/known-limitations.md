# Known Limitations

## Current Delivery Truths

Phase 1 and Phase 2A together deliver an admin portal, controlled CSV import, portal account creation on import, portal account management (reset and unlock), and browser-local import history. This is not a full commerce, fulfilment, analytics, mobile, or patient onboarding platform.

## Patient Portal and Accounts

- When `enable_portal_access` is `true` in the import CSV, a Cognito patient account and portal login are created during import. Temporary passwords are shown once at import time and are not stored. Use the Portal Account reset workflow if a password is missed — original passwords cannot be retrieved.
- When `enable_portal_access` is `false` or missing, no portal account is created and the row is blocked before execute.
- No patient invites are sent by import. Portal access provides login credentials only — no patient-facing email or invite is triggered.
- No patient emails are sent automatically by import.
- Imported patients remain staff-review records until Midland completes its operational review.

## Import History and Batch Evidence

- Import history is stored in the admin browser only. It does not appear on other devices, other browsers, or other admin users.
- Import history will not survive clearing browser data or switching devices. This is a convenience reference — not an audit system of record.
- Batch evidence CSVs (batch summary, failed rows, skipped rows, portal access summary) can be downloaded from the import history detail sheet. These should be saved externally if a persistent record is required.
- Rollback is a placeholder only. No automated rollback execution is implemented. Reversal of imported records requires a separately approved data remediation plan with Midland owner sign-off.
- No shared backend-persistent import batch history is implemented. If persistent import audit history for multi-admin or compliance use is required, it must be scoped as a separate change request.

## Checkout and Payments

- No checkout flow is live for Phase 1.
- No Stripe payment workflow is live for Phase 1.
- No cart, payment capture, refunds, subscriptions, or payment reconciliation are included in Phase 1.

## Inventory and Fulfilment

- No full inventory management system is included in Phase 1.
- Import does not create orders.
- Import does not create fulfilment tasks.
- Import does not reserve, decrement, dispatch, or reconcile stock.
- Equipment and mask data shown for imported patients is review visibility, not an inventory source of truth.

## Mobile App

- No mobile app is included in Phase 1.
- Staff and patient mobile-app workflows are out of scope.

## Audit and Reporting

- No advanced audit dashboard is included in Phase 1.
- Audit and support model need production review before real patient migration.
- Reports are management/admin visibility only where present; they are not a finance system or analytics platform.
- Safe imported-patient export should be used only when available and must exclude raw NHI, encrypted NHI, and NHI hashes.

## Import Workflow

- Import writes are not transactional yet.
- Test records currently exist in DynamoDB.
- Spreadsheet format handling is limited to the agreed Phase 1 import shape.
- Duplicate NHI rows require Midland identity review.
- Duplicate machine serial rows require Midland equipment review.
- Failed rows require source correction, technical review, or Midland owner escalation before retry.
- Dry run validates and preflights without writing records.

## Admin Review

- Admin review status is display-only unless a separate approved workflow exists.
- Imported-patient NHI reveal is not available in the admin MVP.
- Missing mask data should display `No mask record imported`; no fake/default mask should be assumed.
- Admin review is not clinical advice.
- Admin review does not trigger patient communication, orders, fulfilment, or portal access.

## Portal Account Management

- The Portal Accounts admin page supports password reset and account unlock for imported patients.
- Audit events are written before each action. Actions fail closed if the audit write fails.
- Portal account management does not extend to creating new accounts outside the import workflow, removing accounts, or changing patient email addresses. These are out of scope unless separately approved.

## Patient Supply Requests (Phase 2D)

- No patient notification is sent when request status changes. The patient must manually refresh
  their portal to see a status update. Delayed email notification is scoped as Phase 2E but is not
  yet approved for implementation. All gate items in `midland-os/02-product/phase-2e-release-gate.md`
  must be confirmed before implementation begins — particularly business approval (gates 1.1–1.5)
  and NZ privacy / Spam Act compliance (gates 9.5–9.7). SMS is explicitly out of scope unless
  separately approved.
- No inventory is reserved or decremented when a request is submitted or approved.
- No payment or checkout step exists. The "approved" status means admin intends to fulfil; it does
  not capture payment or confirm stock.
- No entitlement balance is deducted from DynamoDB at any stage of the request lifecycle.
- Patient request history is not available. The patient portal shows only the most recent request.
  Multiple historical requests are not listed for the patient.
- The admin funding review flag and estimated cost fields on orders are internal staff aids only.
  Dollar estimates are not shown to the patient.
- Legacy requests created before the `request_reference` field was introduced show "Legacy request"
  as the reference number in the admin orders table.
- The "Flag funding" action button is visible on completed (Delivered/Declined) requests. This is
  cosmetic only; flagging a completed request has no workflow impact.
- The `delivered` status is set manually by admin. There is no automatic delivery confirmation,
  tracking number integration, or courier webhook.

## Admin Operations Command Centre (Phase 2 — current)

**Not live — notifications:**
- No patient email or SMS notification is sent when a request status changes. The patient must
  manually refresh their portal to see a status update.
- Phase 2E (delayed email notification) is specified and ready for implementation but no
  implementation code has been written. All gate items in
  `midland-os/02-product/phase-2e-release-gate.md` must be confirmed before implementation begins
  — particularly business approval (D1–D8 in `phase-2e-decision-capture.md`) and NZ Unsolicited
  Electronic Messages Act compliance (gate 9.5–9.7). SMS is out of scope unless separately
  approved.

**Not live — inventory, fulfilment, payments:**
- No inventory is reserved or decremented at any stage of the request lifecycle.
- No ACC / PHO entitlement balance is deducted. Estimated cost fields on orders are admin
  annotations only — never returned to the patient API.
- No payment or checkout step. "Approved" means admin intends to fulfil; it does not capture
  payment or confirm stock availability.
- No courier or fulfilment integration. The Delivered status is set manually by staff. There is no
  tracking number, courier webhook, or automated delivery confirmation.

**Not live — patient-facing history:**
- The patient portal shows only the most recent request. Multiple historical requests are not listed
  for the patient. Full request history for patients is future scope.

**Reporting constraints:**
- The Download Report drawer generates summary reports from currently loaded request data only. It
  is not a real-time analytics platform and does not query aggregate history beyond what has been
  loaded for the current admin session.
- Summary report CSV (Generate report) contains Metric and Value columns only — no patient
  identifiers, NHI, email, address, or financial data.
- Request-list CSV (Download request list) contains Reference, Patient, MSID, Items, Status,
  Source, and Date — admin-only export. No NHI, email, phone, address, or dollar amounts.
- PDF export is not implemented. Shown as future scope in the drawer.

**Read-only fields:**
- Estimated cost fields (estimatedItemAmount, estimatedFundedAmount, estimatedPatientCopay,
  estimatedRemainingAfter) are admin staff annotations only. They are never returned in any patient
  API response.
- The funding review flag is an internal staff signal. It has no patient-visible effect.

## UI and Operations

- Some admin pages remain lightweight operational placeholders or management views.
- The system should not be presented as a complete ERP, finance, audit, fulfilment, or CRM platform.
- Support boundaries and escalation owners must be confirmed before real patient migration.
