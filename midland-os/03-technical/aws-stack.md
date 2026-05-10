# AWS Stack

## Components

```text
Hosting       AWS Amplify
Auth          Amazon Cognito (2 pools)
Database      Amazon DynamoDB (7 tables)
Monitoring    Amazon CloudWatch (6 alarms)
Email         Amazon SES — transactional only, NOT patient mail in 1B
Storage       S3 — backups bucket; future SES bounce processing
Backup engine DynamoDB PITR + S3 snapshot Lambda (v3.1)
Payments      Stripe — Phase 1A demo only, dormant in 1B
Secrets       AWS Secrets Manager (NHI key dev + prod separate)
Security      AWS WAF (Common Rules + rate limiting)
IaC           Terraform — months 5–6, not before June 30
Region        ap-southeast-2 (Sydney)
```

## DynamoDB — 7 Tables

```text
1. midland-sleep-patients
   PK: USER#uuid
   GSI1: portal_id (MSID lookup)
   GSI2: org_id (multi-tenant scoping)
   PITR: ON

2. midland-sleep-devices
   PK: device_id
   GSI: patient_id
   PITR: ON

3. midland-sleep-masks
   PK: mask_id
   GSI: patient_id
   PITR: ON

4. midland-sleep-entitlement
   PK: PATIENT#id
   SK: YEAR#2026
   PITR: ON

5. midland-sleep-orders
   PK: order_id
   GSI: patient_id
   order_type: ENTITLEMENT | MIXED only in Phase 1B
   PITR: ON

6. midland-sleep-audit
   PK: audit_id
   GSI: patient_id, admin_id, action_type
   PutItem ONLY — IAM-enforced
   PITR: ON

7. midland-sleep-comms
   PK: comms_id
   GSI: patient_id
   transactional records only
   PITR: ON
```

NOT in Phase 1B: points table, consultations table, stripe_payments table.

All tables: PAY_PER_REQUEST, deletion protection ON, encryption at rest with AWS-managed keys.

## Cognito

```text
Patient pool:
  username:    MSID (MS-XXXXXX) or email
  password policy: standard (min 12 chars, mixed case, number, symbol)
  MFA:         not required
  attributes:  email, given_name, family_name, msid, org_id, phone_number

Staff pool:
  username:    email
  MFA:         REQUIRED (TOTP)
  attributes:  email, given_name, family_name, role (admin | dev), org_id
```

## CloudWatch alarms (6 in Phase 1B)

```text
1. 5xx error rate > 1% over 5 min                 (Amplify / Lambda)
2. DynamoDB throttle events > 0 over 5 min        (any table)
3. Cognito sign-in failures spike (anomaly)        (per pool)
4. Audit table writes failing > 0 in 5 min         (data integrity)
5. Backup Lambda failure (weekly snapshot)         (v3.1)
6. WAF blocked requests anomalous spike            (security)

Alert destination: Paul's email (paul@oneofzero.co.nz)
```

## S3 — backups bucket (v3.1)

```text
Name:           midland-sleep-backups (or per environment)
Encryption:     AES-256 (SSE-S3) or KMS (customer-managed key)
Versioning:     ON
Public access:  BLOCKED (all four block-public toggles ON)
Lifecycle:
  - 90 days hot (Standard)
  - 90+ days → Glacier (optional)
  - 1 year retention then expire (configurable)
Bucket policy:  IAM-only access, no anonymous, MFA-delete optional
```

## Secrets Manager

```text
Secret: midland-sleep/nhi-encryption-key-dev   (development)
Secret: midland-sleep/nhi-encryption-key-prod  (production)

Rotation:    manual for Phase 1; automated rotation in Year 2
Access:      Lambda execution role + admin via emergency procedure
Audit:       CloudTrail logs every GetSecretValue call
```

## Cost estimate

```text
Phase 1B baseline (today, ~6,000 records):  NZD 32–95 / month
At 20,000 patients (Waikato scale):          NZD 80–120 / month

DynamoDB PITR:  ~$0.20/GB/month — negligible at our scale
S3 snapshots:   ~$0.025/GB/month — negligible at our scale
Lambda backup:  pennies, runs weekly
```

## Region rationale

```text
ap-southeast-2 (Sydney):
  - lowest latency to NZ
  - HIPC Rule 12 satisfied via Cloud Risk Assessment (Midland-side)
  - matches the AWS-published HIPC compliance posture
  - same region for DynamoDB, S3, Lambda, Cognito, Secrets Manager,
    Amplify hosting
```

## Locked decisions

```text
- AWS, not Azure
- DynamoDB, not RDS
- Amplify, not ECS / EKS
- 7 tables, no points / consultations / stripe_payments
- ap-southeast-2 single region
- Stripe dormant in 1B
- No SSO / Azure AD federation in 1B
- No Terraform in 1B
```
