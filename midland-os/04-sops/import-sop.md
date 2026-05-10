# Import SOP

> Standard Operating Procedure for the Biomedical-style spreadsheet import.
> Read this end-to-end before running any production import.

## Purpose

Move patient records from Biomedical / ALTER spreadsheets into the Midland portal DynamoDB tables, safely and reversibly, with full audit evidence.

## Owner

```text
Source data export       Midland (named owner per batch)
Validation & cleanup     OneOfZero (Paul)
Approval                 Midland clinical lead
Execute                  OneOfZero (Paul) with Midland watching
Post-import review       Midland admin staff
```

## Preconditions

```text
[ ] Privacy Officer sign-off current
[ ] Clinical lead has named the data owner
[ ] Source file format confirmed (CSV / XLSX → CSV preferred)
[ ] Required columns confirmed (see biomedical-import-workflow.md)
[ ] Encoding confirmed (UTF-8; flag BOM / Windows-1252 if found)
[ ] Migration window agreed
[ ] Last weekly backup snapshot succeeded (do not import on a broken backup)
```

## Steps

### 1. Receive

```text
Receive source from Midland clinical lead.
Confirm row count + sample fields.
Save copy to OneOfZero secure storage (NOT in repo, NOT in AI tools).
```

### 2. Clean

```text
[ ] standardise dates → ISO 8601
[ ] trim whitespace
[ ] normalise NHI (no spaces, uppercase)
[ ] strip empty rows
[ ] flag rows missing required fields → return list to Midland
[ ] DO NOT invent missing data
[ ] DO NOT fall back to fake mask records
[ ] note row count before/after
```

### 3. Approval

```text
Send cleaned CSV to Midland clinical lead for written approval.
Record approval (email or signed PDF) in 02-product/decision-log.md.
Do not proceed without approval.
```

### 4. Dry-run

```text
[ ] POST /api/admin/import/dry-run with cleaned CSV
[ ] review per-row OK / WARN / FAIL
[ ] review summary: would-create, would-skip, would-fail
[ ] if WARN/FAIL > 5%, escalate back to Midland
[ ] no DynamoDB writes
[ ] dry-run is read-only — no audit row required, but action attempt is logged
```

### 5. Execute

```text
[ ] POST /api/admin/import/execute with cleaned CSV + batch_id
[ ] audit row PutItem BEFORE execution begins
[ ] per-row PutItem to patients / devices / masks / entitlement
[ ] duplicate NHI → SKIP + reason
[ ] duplicate serial → SKIP + reason
[ ] failed row → record in batch summary, do not abort batch
[ ] response: created / skipped / failed counts + per-row outcomes
[ ] audit row PutItem AFTER with batch result
```

### 6. Verify

```text
[ ] open admin patient list, filter by batch_id
[ ] spot-check 5 random imported records via drawer
[ ] verify no raw NHI in any response
[ ] verify no fake mask fallback (records without masks show "no mask on record")
[ ] export combined CSV for the batch and confirm visually
[ ] save evidence to /midland-os/07-outputs/phase-1/<date>-import-batch-<id>/
```

### 7. Communicate

```text
[ ] send Midland clinical lead a brief: created / skipped / failed
[ ] flag any unexpected SKIPs or FAILs
[ ] note next batch window
[ ] update 02-product/release-notes.md if applicable
```

## Failure handling

```text
PutItem fails on patient            row added to FAIL list, batch continues
PutItem fails on device/mask        patient still imported, equipment flagged for re-import
PutItem fails on entitlement         patient + device + mask imported; entitlement re-import required
Audit PutItem fails                  ABORT batch immediately, do not proceed
DynamoDB throttle                   exponential backoff; if persistent, abort batch
Lambda timeout                      partial batch saved; resume with remaining rows under same batch_id
```

## Out of scope (Phase 1B)

```text
- Cognito user creation during import
- patient invitation email
- order generation
- comms record creation
- inventory linking
- automated daily ALTER sync
- two-way write back to ALTER
```

## Escalation

```text
Data integrity concern               STOP + Paul + Midland Privacy Officer
NHI exposure suspected               STOP + isolate evidence + Privacy Officer same day
PutItem failure on audit             STOP + investigate + report
Schema mismatch with Midland source  back-coordinate + decide retry vs new export
```

## Records

```text
- batch_id and counts in 02-product/release-notes.md
- evidence pack in 07-outputs/phase-1/<date>-import-batch-<id>/
- decision (anything material) in 02-product/decision-log.md
- risks (any new) in 06-memory/risks.md
```
