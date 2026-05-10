# DynamoDB Model Notes

> Field-level notes for each table. Not a full schema reference — that lives in code.

## midland-sleep-patients

```text
PK              USER#<uuid>
GSI1 (msid)     PORTAL_ID#<MS-XXXXXX>
GSI2 (org)      ORG#<org_id>

Attributes (selected):
  user_id          string (uuid)
  msid             string (MS-XXXXXX, 6 random digits 100000–999999)
  org_id           string
  given_name       string
  family_name      string
  dob              ISO date
  nhi_encrypted    string (AES-256-GCM, key in Secrets Manager)
  email            string (optional)
  phone            string (optional)
  created_at       ISO datetime
  imported_at      ISO datetime (if imported)
  imported_batch_id string (if imported)
  review_status    enum: pending_review | reviewed | action_needed | escalated
  is_active        boolean
```

## midland-sleep-devices

```text
PK              DEVICE#<uuid>
GSI             PATIENT#<uuid>

Attributes:
  device_id        string (uuid)
  patient_id       string
  model            string (AirSense 11, AirSense 10, SleepStyle 650, etc.)
  serial           string (DEDUPE KEY on import)
  supplied_at      ISO date
  warranty_until   ISO date (optional)
  last_service_at  ISO date (optional)
  org_id           string
```

## midland-sleep-masks

```text
PK              MASK#<uuid>
GSI             PATIENT#<uuid>

Attributes:
  mask_id          string (uuid)
  patient_id       string
  model            string (Mirage FX, F&P Eson 2, AirFit F30i, etc.)
  size             string (Small | Medium | Large)
  supplied_at      ISO date
  org_id           string
```

## midland-sleep-entitlement

```text
PK              PATIENT#<uuid>
SK              YEAR#<2026>

Attributes:
  patient_id        string
  funded_year       int
  last_claim_at     ISO date (optional)
  next_eligible_at  ISO date (optional)
  status            enum: can_reorder | not_yet | needs_review
  org_id            string
```

## midland-sleep-orders

```text
PK              ORDER#<uuid>
GSI             PATIENT#<uuid>

Attributes:
  order_id         string
  patient_id       string
  order_type       enum: ENTITLEMENT | MIXED  (no PURCHASE in 1B)
  status           enum: requested | approved | fulfilled | cancelled
  channel          enum: portal | phone | clinic | other
  org_id           string
  created_at       ISO datetime
```

## midland-sleep-audit

```text
PK              AUDIT#<uuid>
GSI1            PATIENT#<uuid>
GSI2            ADMIN#<admin_id>
GSI3            ACTION#<action_type>

Attributes:
  audit_id         string (uuid)
  action           string (NHI_REVEAL, EXPORT_RUN, IMPORT_DRY_RUN, IMPORT_EXECUTE,
                          BACKUP_ON_DEMAND, REVIEW_STATUS_CHANGE, etc.)
  actor_id         string (cognito user id)
  actor_role       enum: patient | admin | dev | system
  is_dev           boolean
  patient_id       string (if relevant)
  reason           string (required for NHI reveal, NHI export, on-demand backup)
  metadata         map (action-specific, no patient data)
  created_at       ISO datetime
  request_id       string (server request id for cross-reference)

WRITE:    PutItem ONLY — IAM enforced
RETENTION: 10 years minimum (NZ Health Act + Privacy Act)
```

## midland-sleep-comms

```text
PK              COMMS#<uuid>
GSI             PATIENT#<uuid>

Attributes:
  comms_id         string
  patient_id       string
  channel          enum: email | sms (transactional only in 1B)
  subject          string
  body_excerpt     string (no NHI, no clinical detail)
  status           enum: queued | sent | failed
  created_at       ISO datetime
  org_id           string
```

## NOT in Phase 1B (do not create)

```text
- midland-sleep-points (Midland Points removed)
- midland-sleep-consultations (paid consultations removed)
- midland-sleep-stripe-payments (Stripe dormant in 1B)
```

## Multi-tenant scoping (org_id)

```text
- Every table has org_id either as PK component or attribute
- Admin queries are always filtered by the admin's own org_id
- This is the foundation for Phase 6 multi-clinic — Clinic 2 = new org_id only
- No table redesign required to add a clinic
```

## Indexes — common access patterns

```text
patients by MSID        GSI1 — login lookup, admin search
patients by org_id      GSI2 — multi-tenant filter
devices by patient_id   GSI — drawer view
masks by patient_id     GSI — drawer view
audit by patient_id     GSI1 — patient's audit trail
audit by admin_id       GSI2 — admin's actions in a window
audit by action_type    GSI3 — security/anomaly detection
```

## Capacity model

```text
PAY_PER_REQUEST on all 7 tables.
Reasons:
  - solo dev, no time to tune provisioned capacity
  - traffic is bursty (admin imports, clinic-hours patient activity)
  - cost is bounded by Phase 1 volume (~6,000 records, ~2,500 users)
Switch to PROVISIONED if monthly bill exceeds NZD 200 sustainably or
throttling alarm fires more than once a quarter.
```
