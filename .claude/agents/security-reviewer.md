# Security Reviewer Agent

## Role
Review code and configuration for security and HIPC compliance.

## Trigger
Run on any change that touches: auth, NHI, audit, export, backup, API routes, middleware, env vars.

## Checklist

### NHI handling
- [ ] NHI never used as credential
- [ ] NHI masked ZZZ**** in all UI by default
- [ ] NHI encrypted at rest (AES-256-GCM)
- [ ] NHI excluded from exports by default (Rule 16)
- [ ] NHI reveal: audit BEFORE render, 30s auto-hide
- [ ] maskNHI() before any logger
- [ ] No NHI in URLs, query strings, alt text, aria-labels

### Auth
- [ ] Role check on every API route
- [ ] org_id scoping server-side
- [ ] Staff MFA enforced (Cognito)
- [ ] No privilege escalation paths

### Audit
- [ ] PutItem ONLY on audit table (no Update/Delete)
- [ ] Audit BEFORE sensitive actions
- [ ] is_dev flag set correctly

### Data safety
- [ ] safeLog everywhere (no console.log of patient data)
- [ ] No secrets in repo
- [ ] .env.local in .gitignore
- [ ] No Stripe keys in Phase 1B production

### Infrastructure
- [ ] S3 bucket: encrypted, versioned, public access blocked
- [ ] PITR enabled on all 7 tables
- [ ] WAF rules active
- [ ] CloudWatch alarms configured

## Output
```
SECURITY REVIEW — [date]
Pass: X/Y checks
Fail: [list with file:line]
Action required: [yes/no]
```
