# Known Limitations

- Import writes are not transactional yet.
- Test records currently exist in DynamoDB.
- Admin review status is display-only.
- Imported-patient NHI reveal is not available in the admin MVP.
- No Cognito patient accounts are created by import.
- No patient invite or patient email flow is triggered by import.
- No order or fulfilment workflow is triggered by import.
- No full inventory integration is available yet.
- Admin drawer formatting needs polish, including ISO date display, `pending_review` label formatting, and phone formatting.
- Support and audit model needs production review before real patient migration.
- Spreadsheet format handling is limited to the agreed Phase 1C import shape.
