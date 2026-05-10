# Security Rules

## Always
- maskNHI() before any string reaches any logger
- safeLog() not console.log() for patient data
- Audit PutItem BEFORE sensitive actions
- Auth check (role + org_id) on every API route
- NHI excluded from exports by default (Rule 16)
- No portal-driven delete/restore (Rule 17)

## Never
- NHI as login credential
- NHI in URLs, query strings, alt text, aria-labels
- Secrets in code or repo
- Real patient data in AI tools
- Console.log of patient data
- Stripe keys in Phase 1B production env
- Portal-exposed destructive AWS operations

## On every release
- Backup smoke test (PITR + on-demand + weekly snapshot)
- Security review of any auth/NHI/audit changes
- Privacy notice above every form (HIPC Rule 3)
- Known limitations documented honestly
