# Data Boundaries

> What data we hold, where it lives, who can see it, what leaves the system.

## Data we hold

```text
Patient identity        name, DOB, MSID (MS-XXXXXX), email, phone, NHI (encrypted)
Patient demographics    address (suburb-level), GP/clinician info if provided
Device records          machine model, serial, supplied date, warranty, last service
Mask records            model, size, supplied date
Entitlement records     funded supply types, last claim, next eligibility, year
Order records           order_type (ENTITLEMENT | MIXED in 1B), status, channel, audit
Communications          transactional logs only — confirmations, error notices
Audit log               every sensitive action, append-only, 10-year retention plan
```

## Data we DO NOT hold (Phase 1B)

```text
- payment card details (Stripe handles this in Phase 1A demo only)
- clinical diagnostic notes
- AHI / sleep study data (out of scope, may be referenced read-only later)
- patient photographs
- any data Midland or its clinicians do not authorise
```

## Storage locations

```text
DynamoDB (ap-southeast-2)   primary store, 7 tables (see 03-technical/dynamodb-model-notes.md)
AWS Secrets Manager         NHI encryption key (dev + prod separate)
S3 (ap-southeast-2)         backups bucket (encrypted at rest, versioning ON,
                            public access BLOCKED, 90 days hot + 1 year cold)
CloudWatch                  logs (no patient data — safeLog enforced)
```

## Cross-border data flow

```text
- All operational data stays in ap-southeast-2 (Sydney).
- HIPC Rule 12 satisfied via Cloud Risk Assessment (Midland-side responsibility).
- Microsoft 365 (if Midland confirms) — staff productivity only,
  internal policy required: NO patient NHI or clinical data in email.
- AI tools — demo data only, never real patient data.
```

## Data leaving the system

| Path | Who triggers | NHI default | Audit | Notes |
|---|---|---|---|---|
| Imported patients CSV export | Admin | EXCLUDED | Yes (before file) | Rule 16 |
| Combined patient/device/mask CSV | Admin | EXCLUDED | Yes (before file) | Rule 16 |
| Entitlement summary CSV | Admin | EXCLUDED | Yes (before file) | Rule 16 |
| Audit log window export | Admin | EXCLUDED | Yes | 30 / 90 day window |
| Download My Data | Patient | INCLUDED (own only) | Yes | HIPC Rule 6, 5/day rate limit |
| Weekly S3 backup snapshot | Lambda | ENCRYPTED column | Yes (CW alarm on fail) | Internal only, no portal access |
| On-demand DynamoDB backup | Admin | DynamoDB-managed | Yes | Native AWS backup, not exposed CSV |

## Roles and access

```text
Patient        own record only, NHI masked unless 30s reveal in Profile (audit logged)
Admin (staff)  all patients in their org_id, NHI reveal requires reason (audit logged)
Dev            full read in dev, prod access via emergency procedure only,
                is_dev: true on every audit row
Privacy Officer  read access to audit log, no write
External       none — no third-party can query the system
```

## Retention

```text
Patient record           kept while patient is active + 10 years (NZ Health Act)
Audit log                10 years minimum
Backup S3 snapshots      90 days hot, 1 year cold (Glacier optional)
Communications           2 years rolling
DynamoDB PITR window     35 days rolling
Logs (CloudWatch)        90 days
```

## What we DO NOT export, ever

```text
- Patient passwords (hashed, can't anyway)
- Cognito access/refresh tokens
- Secrets Manager values
- IAM credentials
- AWS account-level data
```
