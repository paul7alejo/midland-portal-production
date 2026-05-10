# Learnings

## Phase 1 Import

- Dry run must stay visibly separate from execute. Staff need to understand that dry run validates and preflights without writing records.
- Created, skipped, and failed counts are the simplest way to explain an import batch to Midland.
- Duplicate NHI is an identity-review issue, not a technical detail to force through.
- Duplicate machine serial is an equipment-review issue, not a technical detail to force through.
- PutItem-only import/audit writes keep Phase 1 safer by avoiding silent update/upsert behaviour.

## Admin Review

- Imported patients need enough drawer context for staff review: identity, contact, machine, mask, funding, batch ID, and review status.
- Missing mask data must remain explicit as `No mask record imported`.
- A fake/default mask fallback would create false confidence.
- Review status can be display-only and still useful if staff understand it is an operational prompt.

## Privacy and Patient Communication

- Raw NHI should not be returned from imported patient APIs.
- Imported-patient NHI reveal being disabled is acceptable for Phase 1 admin review.
- No Cognito patient accounts should be created by import in Phase 1.
- Patient invite and email flows should remain out of scope before June 30 unless separately approved.

## Scope Control

- Checkout, inventory/fulfilment, and mobile app work are deferred beyond Phase 1.
- Midland OS v1 works best as an operating layer around the portal, not as a separate product.
- Support and change requests need boundaries before go-live; vague support quickly becomes unbounded product work.
