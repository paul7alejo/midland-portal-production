# Auth Boundaries

> What each role can do and what each cannot. Server-enforced, not just UI-hidden.

## Roles

```text
patient   own record only
admin     org-scoped via org_id
dev       full access in dev env; prod via emergency procedure; is_dev: true on every audit row
```

## Patient — can do

```text
- log in via MSID or email
- view own dashboard, equipment, entitlement, maintenance
- update own name / email / phone
- submit reorder request (Layer 1 entitlement only in 1B)
- reveal own NHI for 30 seconds in Profile (audit logged)
- Download My Data (HIPC Rule 6, 5/day rate limit)
- contact form (privacy notice above form)
```

## Patient — cannot do

```text
- view another patient's record
- update own machine / mask / NHI directly (admin must update via controlled change)
- access /admin/* (any path)
- access /portal/shop or /portal/checkout (404 in 1B)
- run an export
- trigger a backup
- call any AWS API directly
```

## Admin — can do

```text
- log in with MFA (TOTP)
- view all patients within their org_id
- open patient drawer
- update review status (display-only if mutation isn't safely wired)
- run controlled import (dry-run + execute)
- run admin exports (4 types — see admin-data-operations.md)
- reveal patient NHI in drawer with written reason (audit before reveal)
- trigger on-demand backup with reason (audit logged)
- view AWS state visibility panel (read-only)
- view audit log windows (30 / 90 days)
```

## Admin — cannot do

```text
- delete a patient record (AWS console only)
- restore from backup (AWS console only)
- modify another org's patients (org_id scoping)
- write to audit log via UpdateItem / DeleteItem (PutItem only; IAM-enforced)
- create a Cognito patient user (Phase 2)
- send patient email (Phase 2)
- access Stripe / payments (Phase 2)
- modify entitlement policy from portal (config goes through AWS console / IaC later)
```

## Dev — can do

```text
- everything admin can do, in dev environment
- full read access to staging
- access to AWS console for infra changes
- access to Secrets Manager via emergency procedure
```

## Dev — cannot do

```text
- silently access prod (every prod read/write writes is_dev: true to audit)
- bypass MFA for staff actions in prod (Cognito enforces)
- delete production data without out-of-band approval + audit
```

## Server-side authorization checks

```text
EVERY API route checks (in order):
  1. is the user authenticated? (Cognito session)
  2. does the user have the role this route requires?
  3. for admin routes, does the requested resource belong to the user's org_id?
  4. for sensitive actions (NHI reveal, NHI export, backup trigger), is the
     reason field present?
  5. write audit row PutItem BEFORE the action takes effect.
  6. perform the action.
  7. write audit row PutItem AFTER, with outcome.

Failures at any step:
  - return 403 (or 401 for unauth)
  - log the rejection (without leaking patient data)
  - never reveal whether a record exists if the user has no permission
```

## URL safety

```text
- never include NHI in any URL, query string, fragment, or referer
- never include MSID in publicly-shared URLs (admin-only)
- patient-facing URLs are stable and predictable, no patient ID embedded
- admin patient-detail URL uses an opaque ID, not NHI or MSID
```

## Cognito user lifecycle (Phase 1B)

```text
Patient:
  - NOT auto-created during import
  - provisioned via Midland's existing process or staff manual creation
  - first login: forced password change
  - MFA optional (not enforced for patients in 1B)

Staff:
  - created by Paul (initial setup) or admin (limited)
  - MFA required from first login
  - role attribute set: admin or dev
  - org_id attribute set
```
