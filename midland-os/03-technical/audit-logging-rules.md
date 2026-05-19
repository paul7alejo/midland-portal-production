# Audit Logging Rules

> The audit log is append-only. Every sensitive action writes a row BEFORE the action takes effect. No exceptions.

## What gets logged

```text
NHI_REVEAL              patient self in Profile, or admin in drawer (with reason)
NHI_EXPORT              opt-in NHI inclusion in any export
EXPORT_RUN              any of the 4 admin export endpoints
IMPORT_DRY_RUN          read-only validation; logged for auditability of attempts
IMPORT_EXECUTE          batch ID, counts, started/completed timestamps
IMPORT_ROW_SKIP         per-row skip with reason (duplicate NHI, duplicate serial)
IMPORT_ROW_FAIL         per-row failure with sanitised reason
BACKUP_ON_DEMAND        admin-triggered DynamoDB backup, with reason
BACKUP_WEEKLY_SNAPSHOT  Lambda-triggered S3 snapshot result
REVIEW_STATUS_CHANGE    admin updated patient review status
LOGIN                   patient or staff login (Cognito post-auth)
LOGIN_FAIL              failed auth attempt (rate-limited)
PROFILE_UPDATE          patient updated own contact details
DOWNLOAD_MY_DATA        HIPC Rule 6 endpoint (5/day rate limit)
NOTE_CREATED            admin added a persistent note to a patient record
NOTE_UPDATED            admin edited their own note (creator only)
NOTE_SOFT_DELETED       admin soft-deleted their own note (creator only)
ADMIN_ACTION_OTHER      catch-all for admin actions not specifically named
```

### Note audit payload rules

```text
MUST include:   action, patient_msid, note_id (the DynamoDB sk), admin_sub,
                admin_email, timestamp, result
MUST NOT include: full note body, NHI (raw or encrypted), tokens, secrets
```

## What does NOT get logged (and why)

```text
- raw NHI values (Rule 6 — maskNHI before any logger)
- Cognito tokens (would defeat their purpose)
- Secrets Manager values
- patient passwords or hashes
- full request bodies (only sanitised metadata)
- query strings containing patient identifiers
```

## Format

```text
{
  audit_id:     "audit-uuid",
  action:       "EXPORT_RUN",
  actor_id:     "cognito-user-id",
  actor_role:   "admin",
  is_dev:       false,
  patient_id:   "USER#uuid"  | null  (depends on action),
  reason:       "Quarterly funder report — 90-day window",
  metadata:     { "export_type": "audit_window", "days": 90, "row_count": 1024 },
  request_id:   "req-uuid",
  created_at:   "2026-05-09T23:18:00.123Z"
}
```

## Write order rule

```text
Sensitive action lifecycle:
  1. Authorize (role + org + reason check)
  2. PutItem to audit BEFORE doing the thing
  3. Do the thing (reveal, export, backup, etc.)
  4. PutItem to audit AFTER with outcome (success / failure / row counts)

Failure path:
  - if PutItem in step 2 fails, abort the action — do not proceed
  - if the action fails after step 2, write a failure audit row in step 4
  - never silently rollback — the attempt itself is auditable evidence
```

## IAM enforcement

```text
- The Lambda execution role and the admin Cognito group both have:
    Allow: dynamodb:PutItem on midland-sleep-audit
    DENY:  dynamodb:UpdateItem on midland-sleep-audit
    DENY:  dynamodb:DeleteItem on midland-sleep-audit

- This is enforced at the IAM policy level, not just in code.
- Even Paul's prod role denies UpdateItem/DeleteItem on this table.
- Schema changes that would break this rule require a documented exception
  in 02-product/decision-log.md.
```

## Retention

```text
- 10 years minimum (NZ Health Act + Privacy Act 2020 alignment)
- DynamoDB PITR active for 35-day rolling restore
- Weekly S3 snapshot includes audit table
- Long-term archive to Glacier after 1 year (configurable)
- Deletion only via formal records-disposal procedure with Privacy Officer sign-off
```

## Read access

```text
admin              read own org_id audit rows for last 90 days via /admin/audit
                   read 30/90 day windows via export endpoint
patient            no direct access (HIPC Rule 6 export gives them their own data, not the audit)
dev                full read in dev; prod read via emergency procedure with reason logged
Privacy Officer    full read access (Midland-side, configured by Paul)
```

## Anomaly detection (Phase 1B keep simple)

```text
NHI_REVEAL count per admin per day      anomalous spike → manual review
EXPORT_RUN with NHI: TRUE                ANY occurrence → manual review (rare event)
LOGIN_FAIL streak                        > 5 in 5 min from same source → CloudWatch alarm
IMPORT_EXECUTE failures > 0              CloudWatch alarm
BACKUP_WEEKLY_SNAPSHOT failure           CloudWatch alarm
audit table write failure                CloudWatch alarm — data integrity P1
```

## Sample audit row (NHI reveal)

```json
{
  "audit_id": "01HF2A...",
  "action": "NHI_REVEAL",
  "actor_id": "cognito-admin-uuid",
  "actor_role": "admin",
  "is_dev": false,
  "patient_id": "USER#patient-uuid",
  "reason": "Confirming identity for phone call about reorder request",
  "metadata": { "view_seconds": 30, "channel": "drawer" },
  "request_id": "req-uuid",
  "created_at": "2026-05-09T22:14:32.001Z"
}
```

## What this enables

```text
- HIPC compliance evidence (Rule 5, Rule 6, Rule 13)
- incident response with full timeline reconstruction
- demonstration of access discipline to Privacy Officer
- evidence base for the funder utilisation case
- foundation for Phase 2 advanced audit dashboard
```
