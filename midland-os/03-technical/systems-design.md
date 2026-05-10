# Systems Design

## 1. Identity and Access System

```text
- AWS Cognito — 2 pools (patient, staff)
- Next.js protected routes
- Role-based access enforced server-side
- Session cookies / token handling
- Rules:
    NHI is never a credential
    admin and patient access remain separated
    dev/support access is auditable (is_dev: true)
```

## 2. Patient Data System

```text
Storage: DynamoDB (7 tables)
  patients
  devices
  masks
  entitlement
  orders         (ENTITLEMENT | MIXED only in Phase 1B)
  audit          (PutItem only)
  comms          (transactional only)

Phase 1B data rules:
  - import creates patient/device/mask/entitlement records only
  - no order/comms writes during import
  - no patient Cognito account creation during import
  - no raw NHI in normal admin responses
```

## 3. Import System

```text
Workflow:
  source file
  → parse
  → validate
  → detect duplicate NHI/serial
  → dry run (no writes, no audit)
  → approval gate
  → execute (audit BEFORE)
  → created / skipped / failed
  → audit AFTER
  → evidence pack

Controls:
  - batch ID
  - skipped/failed reasons
  - per-row outcomes
  - no uncontrolled writes
```

## 4. Admin Review System

```text
imported patient list
  → drawer / detail
  → machine / mask / funding review
  → status
  → export / report bridge
  → backup status visibility
```

## 5. Admin Data Operations System (NEW v3.1)

```text
Three subsystems — see 03-technical/admin-data-operations.md for detail

A. Export        4 endpoints, NHI excluded by default, audit before file generation
B. Backup        DynamoDB PITR + on-demand + weekly S3 snapshot Lambda
C. AWS State     read-only describe-table / describe-backup panel
```

## 6. Audit / Evidence System

```text
- append-only (PutItem only) on midland-sleep-audit
- IAM-enforced (admin role has no UpdateItem / DeleteItem)
- safeLog() everywhere; no console.log of patient data
- evidence captured in /midland-os/07-outputs/
```

## 7. SOP / Handover System

```text
import-sop.md
admin-review-sop.md
release-sop.md
support-model.md
onboarding-sop.md
export-sop.md       (v3.1)
backup-sop.md       (v3.1)
known-limitations.md
HANDOVER-INDEX.md
```

## 8. OneOfZero Commercial System

```text
Purpose: convert delivery into case study, retainer justification, and reusable IP.

Outputs:
  - before/after proof (07-outputs/phase-1/)
  - pricing logic (oneofzero-os/02-sales/)
  - case study notes
  - reusable implementation modules
  - proposal language
  - future roadmap
```

## Data flow — import to admin to backup

```text
Biomedical-style CSV
  ↓
Dry-run validation (no writes)
  ↓
Approval gate (audit BEFORE execute)
  ↓
Execute import → DynamoDB (patient + device + mask + entitlement)
  ↓
Audit AFTER (created/skipped/failed counts)
  ↓
Admin imported patients API
  ↓
Admin table → drawer → review
  ↓
Export endpoint (Rule 16: NHI excluded by default; audit BEFORE file)
  ↓
Weekly S3 snapshot (Lambda, 02:00 NZ Sunday)
  ↓
SOP / handover
```

## Failure modes

```text
- ALTER export delayed                             highest external risk
- columns do not match expected format             coordinate with Midland
- real data messier than test data                 expected
- duplicate NHI / serial conflicts                 documented as SKIP not FAIL
- missing mask / device / funding fields           record what's present, no fake data
- Privacy Officer review delayed                   blocks go-live, not import
- Lambda backup failure                            CloudWatch alarm → email Paul
- DynamoDB throttle                                CloudWatch alarm; auto-scale or shift to PROVISIONED if persistent
```

## Mitigation

```text
- document blocked-by-client items
- capture evidence at every step
- keep known limitations honest
- do not overbuild
- treat 1F as stretch
- backup smoke test in every release SOP
```
