# Risks

- ALTER export format is not confirmed.
- No real patient data should be used in AI tools.
- Admin review status is visible but not yet editable.
- Import writes are not transactional.
- Test data pollution exists from early test imports.
- SOPs need Midland review before live use.
- Duplicate detection currently relies on scan-based checks suitable for Phase 1C scale, not final high-volume architecture.
- Release and rollback ownership should be confirmed before live patient migration.
- Production support boundaries need written agreement before go-live.
- Accidentally creating Cognito patient accounts during import would expand scope and create patient-communication risk.
- Patient invite/email work before June 30 would bypass the agreed Phase 1 boundary.
- Replacing PutItem-only import/audit writes with update/upsert behaviour could overwrite existing data without a separate safety design.
- Adding a default mask fallback would hide missing clinical/source data.
- Returning raw NHI from imported patient APIs would breach the current admin safety model.
- Checkout, inventory/fulfilment, or mobile work could distract from Phase 1 admin/import/review readiness.
