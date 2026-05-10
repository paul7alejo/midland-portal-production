# Admin Data Operations — Technical Spec (v3.1)

> The sub-system that turns the admin portal from a viewer into the operating layer over AWS.
> This is what makes "Midland OS v1" a real operating system instead of just docs.
> Three sub-systems: **Export**, **Backup**, **AWS State Visibility**.

---

## A. EXPORT (read-out)

### A.1 Endpoints

```text
POST /api/admin/exports/imported-patients
POST /api/admin/exports/combined
POST /api/admin/exports/entitlement
POST /api/admin/exports/audit-window
```

All export endpoints share a common envelope:

```ts
type ExportRequest = {
  filters: {
    org_id?: string;        // server enforces user's own org_id; this is informational
    batch_id?: string;
    status?: ReviewStatus;
    date_from?: string;     // ISO date
    date_to?: string;       // ISO date
    days_window?: 30 | 90;  // audit-window only
  };
  include_nhi?: boolean;     // default false; true requires `reason`
  reason?: string;           // required when include_nhi === true
};

type ExportResponse = {
  download_url: string;      // single-use, 24h-expiring, watermarked filename
  file_name: string;
  row_count: number;
  audit_id: string;          // the PutItem written BEFORE file generation
  expires_at: string;        // ISO datetime
};
```

### A.2 Hygiene rules (every endpoint)

```text
[ ] NHI EXCLUDED by default — encrypted column omitted from CSV
[ ] include_nhi: true requires non-empty `reason` string
[ ] audit row PutItem BEFORE file generation
[ ] download_url is server-generated, single-use, 24h expiring
[ ] file_name watermarked with batch_id + timestamp + actor_id (last 6 chars)
[ ] CSV escaping: comma, quote, newline, BOM
[ ] no console.log in the export path; safeLog only
[ ] no patient identifier in URL (download_url uses opaque token)
[ ] server-side filtering only; never trust client-supplied org_id
[ ] PII minimisation: only fields required for the declared use case
```

### A.3 CSV column sets (NHI excluded by default)

**Imported patients export**

```text
msid, given_name, family_name, dob_year, email, phone, address_suburb,
imported_at, imported_batch_id, review_status, is_active, created_at
```

**Combined patient/device/mask export** (one row per patient with array-of-devices/masks expanded)

```text
msid, given_name, family_name, dob_year,
device_model, device_serial, device_supplied_at, device_warranty_until,
mask_model, mask_size, mask_supplied_at,
review_status, imported_at, imported_batch_id
```

**Entitlement summary export**

```text
msid, given_name, family_name, funded_year,
last_claim_at, next_eligible_at, entitlement_status,
device_model, mask_model
```

**Audit-window export**

```text
audit_id, action, actor_role, is_dev, patient_msid, reason, created_at,
request_id, metadata_json (sanitised)
```

If `include_nhi: true`: `nhi` column appended to imported / combined / entitlement exports. Audit-window never includes NHI (reason values may reference, but no raw NHI column).

### A.4 Implementation notes

```text
- Server generates CSV in-memory or streams from DynamoDB → S3 upload-by-token
- Download URL: signed URL to S3 object in a short-lived bucket prefix
  (e.g. s3://midland-sleep-exports/<env>/<token>/file.csv)
- TTL handled by S3 lifecycle rule: prefix expires at 24h
- Watermark in file metadata + filename (no overlay needed for CSV)
- For audit-window: query DynamoDB GSI on action_type or patient_id, paginate,
  cap at 100K rows per export (return error if exceeded — split window)
```

---

## B. BACKUP (durability)

### B.1 Three layers

```text
1. DynamoDB PITR (Point-in-Time Recovery)
   - enabled on all 7 tables
   - 35-day rolling restore window
   - AWS-native, no portal logic required
   - configured via AWS console or terraform; not exposed in portal

2. On-demand DynamoDB backup (admin-triggered)
   - endpoint: POST /api/admin/backup/on-demand
   - body: { reason: string }
   - Lambda calls dynamodb:CreateBackup for every table
   - response: backup IDs, status, audit_id
   - audit row PutItem BEFORE create_backup is called

3. Weekly S3 snapshot (Lambda-driven CSV export)
   - schedule: cron(0 14 ? * SUN *) — Sunday 02:00 NZT (14:00 UTC)
   - Lambda iterates patients/devices/masks/entitlement/audit
   - writes encrypted CSV to s3://midland-sleep-backups/<env>/<yyyy>/<ww>/
   - status row written to a backup_status DynamoDB item
   - CloudWatch alarm on Lambda failure → email Paul
```

### B.2 S3 bucket policy

```text
Bucket name:        midland-sleep-backups (or per env)
Encryption:         SSE-S3 (or KMS for later)
Versioning:         ON
Public access:      BLOCKED (all 4 toggles)
Lifecycle:
  - prefix /backups: 90 days Standard → Glacier; expire at 365 days
  - prefix /exports: expire at 24 hours
Bucket policy:      IAM-only, no anonymous, MFA-delete optional
Replication:        none in Phase 1B (single-region)
```

### B.3 Backup status panel data

```text
GET /api/admin/backup/status
returns:
  pitr:          { table_name: enabled | disabled, ... } per table
  on_demand:     { last_at, last_status, last_actor, last_reason, last_size_bytes }
  weekly_snapshot: { last_run_at, last_status, last_size_bytes, last_location, next_run_at }
  alarms:        { lambda_failure: ok | alarm, throttle: ok | alarm }
```

### B.4 Restore procedure (NOT exposed in portal — Rule 17)

Restore is documented in `04-sops/release-sop.md` and `03-technical/deployment-runbook.md`. Process:

```text
1. Open incident in 06-memory/risks.md
2. Notify Midland clinical lead + Privacy Officer
3. AWS console:
   - DynamoDB → Backups → choose backup → Restore to NEW table name
   - Validate restored table contents
   - Use scripted swap or manual record copy to repoint app
4. Audit row written manually (action: MANUAL_RESTORE, reason, who)
5. Post-incident review → known-limitations.md + learnings.md
```

---

## C. AWS STATE VISIBILITY (read-only)

### C.1 Endpoint

```text
GET /api/admin/aws-status
```

### C.2 Response shape

```ts
type AwsStatus = {
  region: 'ap-southeast-2';
  tables: Array<{
    name: string;
    record_count: number;       // approximate from describe-table
    table_size_bytes: number;
    last_write_at: string;      // ISO; from item-latest-update probe
    pitr_enabled: boolean;
    encryption_status: 'SSE_S3' | 'KMS';
    deletion_protection: boolean;
  }>;
  cognito: {
    patient_pool_users: number;
    staff_pool_users: number;
  };
  backup_summary: BackupStatus;  // see B.3
  s3_backup_bucket: {
    name: string;
    object_count_approx: number;
    total_size_gb: number;
    public_access_blocked: boolean;
    versioning: 'Enabled' | 'Suspended';
  };
};
```

### C.3 What this panel does NOT do

```text
- delete a table or item
- restore from backup
- modify schema
- change PITR or encryption settings
- create or rotate Secrets Manager values
- mutate IAM
- access another org's data

Anything mutative is AWS console only (Rule 17).
```

---

## DATA-FLOW (end-to-end, v3.1)

```text
Biomedical CSV
  → import dry-run (no write, no audit)
  → admin approves
  → audit PutItem BEFORE execute
  → execute → DynamoDB writes (patient + device + mask + entitlement)
  → audit AFTER (counts)
  → admin views patient list / drawer
  → admin runs export
    → audit BEFORE
    → CSV generated (NHI excluded by default)
    → signed URL returned, 24h TTL
  → weekly Sunday 02:00 NZT
    → Lambda snapshot
    → S3 put with versioning
    → backup_status row updated
    → CloudWatch alarm on failure
```

---

## ACCEPTANCE CRITERIA (Day 50)

```text
[ ] All 4 export endpoints live and tested with demo data
[ ] NHI excluded by default verified by manual CSV inspection
[ ] Opt-in NHI export: reason required, audit row before file generation
[ ] Download URLs: 24h-expiring and single-use confirmed
[ ] PITR enabled on all 7 tables (AWS console screenshot in evidence pack)
[ ] On-demand backup tested end-to-end with describe-backup confirmation
[ ] Weekly Sunday snapshot has run at least twice successfully
[ ] AWS state visibility panel reads without errors
[ ] Restore attempt from portal returns 403 / endpoint not exposed
[ ] Backup smoke test added to release-sop.md (Rule 18)
[ ] Restore procedure documented in deployment-runbook.md
```

---

## EFFORT (Days 33–37)

```text
Day 33  Imported patients CSV export                         1 day
Day 34  Combined / entitlement / audit window export         1 day
Day 35  Backup: PITR + on-demand + weekly S3 Lambda          1.5 days
Day 36  AWS state visibility panel                           1 day
Day 37  Import batch evidence summary (closes 1D)            0.5 day
                                                             ────────
                                                             ~5 days
```
