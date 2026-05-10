# Known Limitations

## Phase 1 Truths

Phase 1 is an admin/import/review visibility release. It is not a full commerce, fulfilment, analytics, mobile, or patient onboarding platform.

## Patient Portal and Accounts

- No Cognito patient accounts are created by import.
- No patient portal access is created by import.
- No patient invites are sent by import.
- No patient emails are sent by import.
- Imported patients remain staff-review records until Midland completes its operational review.

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

## UI and Operations

- Some admin pages remain lightweight operational placeholders or management views.
- The system should not be presented as a complete ERP, finance, audit, fulfilment, or CRM platform.
- Support boundaries and escalation owners must be confirmed before real patient migration.
