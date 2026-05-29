# Risks

## Phase 1 / Phase 2 operational risks

- No real patient data should be used in AI tools.
- Admin review status is visible but not yet editable.
- Import writes are not transactional.
- Test data pollution exists from early test imports.
- SOPs need Midland review before live use.
- Duplicate detection currently relies on scan-based checks suitable for Phase 1C scale, not final high-volume architecture.
- Release and rollback ownership should be confirmed before live patient migration.
- Production support boundaries need written agreement before go-live.
- Accidentally creating Cognito patient accounts during import would expand scope and create patient-communication risk.
- Replacing PutItem-only import/audit writes with update/upsert behaviour could overwrite existing data without a separate safety design.
- Adding a default mask fallback would hide missing clinical/source data.
- Returning raw NHI from imported patient APIs would breach the current admin safety model.

## Phase 2E notification risks (implementation not yet approved)

See full risk table in `midland-os/02-product/phase-2e-release-gate.md`.

- **Patient receives incorrect notification after 30-min window expires.** Mitigation: staff
  awareness of correction window; NOTIFICATIONS_ENABLED feature flag for instant suppression.
- **NZ Unsolicited Electronic Messages Act 2007 compliance not confirmed.** Midland must confirm
  transactional email to patients does not require additional consent. This is gate 9.6 and blocks
  implementation until legal position is confirmed.
- **Declined notification causes patient distress without adequate support contact.** Mitigation:
  Declined template requires Midland review and approval before implementation (gate 2.3).
- **SES sandbox exit delayed.** Mitigation: request sandbox exit immediately once sending domain
  is confirmed — it is the only external dependency with variable lead time.
- **patient_email stored on order record from Cognito JWT.** If a patient changes their Cognito
  email after submitting a request, the stored email on existing orders is not updated. Accepted
  limitation for Phase 2E; requires Midland confirmation (gate 5.4).
- **Sent emails cannot be recalled.** The 30-minute delay is the only protection. If an incorrect
  notification is sent, staff manual outreach is the only recovery path.
