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
