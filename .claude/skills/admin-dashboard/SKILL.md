# /admin-dashboard
Build admin dashboard or admin-level pages.
## Rules
- Admin routes under /admin/*
- MFA required (Cognito staff pool)
- org_id scoping on all queries
- No raw NHI in responses
- No portal-driven delete/restore (Rule 17)
- Audit PutItem BEFORE sensitive actions
- Direct, factual copy
- DM Mono for IDs, dates, counts
- Verify: npx tsc --noEmit
