# Biomedical Import Workflow

> The Phase 1 wedge. This is what the offer is about, not "CSV import."

## Workflow overview

```text
Biomedical-style spreadsheet
  → verify data
  → clean / fix CSV
  → approve batch
  → controlled import (dry-run → execute)
  → populate DynamoDB (patient + device + mask + entitlement)
  → admin review (list + drawer)
  → export / report bridge (Admin Data Operations)
  → SOP / handover
```

## Source data

```text
Origin:        Biomedical Services NZ ALTER export OR Midland-maintained spreadsheet
Format:        CSV / XLSX (CSV preferred for first pass)
Encoding:      UTF-8 expected; we test for BOM and Windows-1252 fallback
Volume Phase 1: 50–100 records (rehearsal-grade)
```

## Required fields (minimum viable record)

```text
Patient
  given_name          string, required
  family_name         string, required
  dob                 ISO date, required
  nhi                 NZ NHI format, required → AES-256-GCM encrypted on write
  email               optional but preferred
  phone               optional
  address             optional, suburb-level

Device (CPAP machine)
  model               string, required (AirSense 11, AirSense 10, SleepStyle 650, etc.)
  serial              string, required → duplicate detection key
  supplied_at         ISO date, optional
  warranty_until      ISO date, optional

Mask
  model               string, optional (Mirage FX, F&P Eson 2, AirFit F30i, etc.)
  size                string, optional (Small / Medium / Large)
  supplied_at         ISO date, optional

Entitlement
  funded_year         int, optional (defaults to current year if omitted)
  last_claim_at       ISO date, optional
  next_eligible_at    ISO date, optional
```

## Steps

### 1. Verify data

```text
Owner:   Midland (data export) → OneOfZero (validation)
Action:
  [ ] confirm row count
  [ ] confirm column headers match expected
  [ ] sample 5 rows, eyeball for obvious errors
  [ ] confirm encoding (no mojibake)
  [ ] confirm date format consistency
```

### 2. Clean / fix CSV

```text
Owner: OneOfZero (with Midland clinical sign-off on edits)
Action:
  [ ] standardise date format → ISO 8601
  [ ] trim whitespace
  [ ] normalise NHI format (no spaces, uppercase)
  [ ] strip empty rows
  [ ] flag rows missing required fields → report back to Midland
  [ ] DO NOT invent missing data
  [ ] DO NOT fall back to fake mask records
```

### 3. Approve batch

```text
Owner: Midland clinical lead
Action:
  [ ] review cleaned CSV
  [ ] explicit written approval (email or signed PDF)
  [ ] approval recorded in 02-product/decision-log.md
```

### 4. Controlled import

```text
Owner: OneOfZero (with Midland watching for go-live batch)

Step 4a — Dry run
  [ ] POST /api/admin/import/dry-run with cleaned CSV
  [ ] response: per-row OK / WARN / FAIL
  [ ] summary: total, would-create, would-skip, would-fail
  [ ] no DynamoDB writes
  [ ] no audit row (read-only operation)

Step 4b — Approval gate
  [ ] dry-run results reviewed
  [ ] explicit "execute" command
  [ ] batch ID generated
  [ ] audit row PutItem BEFORE execute begins

Step 4c — Execute
  [ ] POST /api/admin/import/execute with batch ID
  [ ] per-row PutItem to patients / devices / masks / entitlement
  [ ] duplicate NHI → skip + log skip reason
  [ ] duplicate serial → skip + log skip reason
  [ ] failed row → record in batch summary, do not abort batch
  [ ] response: created / skipped / failed counts + per-row outcomes
  [ ] final audit row PutItem with batch result
```

### 5. Populate DynamoDB

```text
Tables touched:    patients, devices, masks, entitlement
Tables NOT touched: orders, comms, audit (audit gets PutItem only at boundaries)
```

### 6. Admin review

```text
See 01-clinic-operations/admin-review-workflow.md
```

### 7. Export / report bridge

```text
See 03-technical/admin-data-operations.md and 04-sops/export-sop.md
```

### 8. SOP / handover

```text
See 04-sops/import-sop.md
```

## Failure modes

```text
- ALTER export delayed                        → highest external risk
- columns do not match expected format        → coordinate with Midland on a remap
- real data messier than test data            → expect FAILED rows in first batch, do not panic
- duplicate NHI / serial conflicts            → expected; documented as SKIP not FAIL
- missing mask / device / funding fields      → record imports with what's present, no fake data
- Privacy Officer review delayed              → blocks go-live, not import
```

## What this is NOT

```text
- two-way sync with ALTER (export only, in Phase 1)
- real-time replication
- automated nightly sync
- patient-facing import
- a place to invent missing data
```
