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

## UI and Operations

- Some admin pages remain lightweight operational placeholders or management views.
- The system should not be presented as a complete ERP, finance, audit, fulfilment, or CRM platform.
- Support boundaries and escalation owners must be confirmed before real patient migration.
