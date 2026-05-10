# Backup SOP (v3.1)

> Three-layer backup discipline: PITR + on-demand + weekly S3.
> Backup smoke test is part of every release SOP (Rule 18).

## Backup layers

```text
1. DynamoDB PITR                 35-day rolling, AWS-native, on all 7 tables
2. On-demand DynamoDB backup     admin-triggered, with reason
3. Weekly S3 snapshot Lambda     Sunday 02:00 NZT, encrypted CSV per table
```

## Owner

```text
PITR config + bucket policy   Paul (initial setup, Months 5–6 IaC takes over)
On-demand triggers             Admin (with reason)
Weekly snapshot Lambda         Paul (monitor + fix)
Restore procedure              Paul + AWS console (Rule 17 — never via portal)
```

## When to trigger an on-demand backup

```text
[ ] before a major data migration / large import (50+ rows)
[ ] before a schema change (rare)
[ ] before any release tagged "ops:" or "feat:" with data impact
[ ] after a Privacy Officer audit, to anchor a known-good state
[ ] when an admin "is going to do something they'd like a checkpoint for"
    (prudent restraint — annotate reason)
```

## Steps for on-demand backup

```text
1. /admin/aws-status → "Trigger on-demand backup"
2. Enter reason (non-empty, meaningful)
3. Click confirm — audit row PutItem BEFORE backup is created
4. Lambda iterates dynamodb:CreateBackup for all 7 tables
5. Response: backup IDs + status
6. Verify in AWS console: DynamoDB → Backups → list (should appear within 30–60s)
7. Note the backup IDs in 02-product/release-notes.md if associated with a release
```

## Steps for weekly snapshot (automated)

Runs every Sunday at 02:00 NZT. No human action needed.

```text
[ ] CloudWatch alarm "weekly-snapshot-failure" emails Paul if Lambda errors
[ ] /admin/aws-status panel shows last_run_at + last_status
[ ] If last_run_at is > 8 days, raise to P1 (something silently broke)
```

## Backup smoke test (Rule 18) — part of every release

```text
[ ] PITR status: ENABLED on all 7 tables
[ ] last on-demand backup in this release cycle: SUCCESS in describe-backup
[ ] last weekly S3 snapshot: < 7 days old, opens cleanly
[ ] CloudWatch alarm "weekly-snapshot-failure" is in OK state
[ ] backup S3 bucket: encryption ON, versioning ON, public access BLOCKED
```

If any step fails → BLOCK the release. Fix backup first.

## Restore (Rule 17 — AWS console only, NEVER from portal)

```text
1. Open incident in 06-memory/risks.md
2. Notify:
   - Midland clinical lead
   - Midland Privacy Officer
   - Paul (if Paul is initiating, notify Midland leadership)
3. AWS console actions:
   a. DynamoDB → Backups → select backup
   b. Restore to NEW table name (do not overwrite live)
   c. Validate restored table contents (sample queries, row count)
   d. Coordinate swap (env var change or scripted record copy)
   e. Verify post-swap operations (admin login, list, drawer)
4. Manual audit row written:
   action: MANUAL_RESTORE
   reason: <reason>
   actor: <name>
   metadata: { "source_backup_id": "...", "target_table": "...", "swap_method": "..." }
5. Post-incident review:
   - update 06-memory/known-limitations.md if scope was tighter than expected
   - update 06-memory/learnings.md with what to do differently next time
   - update this SOP if procedure needs adjustment
```

## What restore is NOT

```text
- a portal feature (it is not, will not be, in 1B)
- something to do casually
- a substitute for code-level rollback (use Amplify previous deploy first)
- an admin-staff procedure (Paul + AWS console only)
```

## Bucket policy reminders (S3 backups)

```text
[ ] all 4 public-access-block toggles ON
[ ] versioning ON
[ ] encryption ON (SSE-S3 minimum, KMS preferred)
[ ] lifecycle: 90 days hot → Glacier; expire at 365 days (configurable)
[ ] no anonymous bucket policy
[ ] MFA-delete optional but recommended once stable
```

## Failure modes + handling

```text
On-demand Lambda fails               retry once; if fails again → P1 → Paul
Weekly snapshot Lambda fails         CloudWatch alarm fires; investigate within 24h;
                                     no patient data loss because PITR still active
PITR disabled accidentally           re-enable immediately; investigate IAM change;
                                     write incident note; Privacy Officer informed
S3 bucket access policy weakened     immediate revert; investigate; incident note
Backup smoke test fails in release   BLOCK release; do not proceed; fix backup first
Restore from backup fails             do not panic; second backup option available;
                                     escalate to AWS support if needed
```

## Cost (for context — not a budgeting exercise here)

```text
PITR                 ~$0.20/GB/month — negligible at our volume
S3 snapshots         ~$0.025/GB/month + Glacier transitions — negligible
Lambda backup        weekly invocation, pennies
On-demand backups    ~$0.10/GB created — negligible
Total backup cost    < NZD 5 / month at Phase 1B scale
```

## Out of scope

```text
- cross-region replication (Phase 6 multi-clinic)
- patient-initiated backup
- third-party backup tooling
- continuous replication to off-AWS
- backup of S3 backups bucket itself (versioning is the protection)
```
