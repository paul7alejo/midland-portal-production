# Admin Review SOP

> What admin staff do when reviewing imported records or supporting patient queries.
> Operations procedure, not clinical advice.

## Purpose

Provide consistent, auditable handling of imported patient records and admin tasks, so the portal stays an operating layer rather than a black box.

## Owner

Midland admin staff (any one of them; rotating responsibility).

## Preconditions

```text
[ ] admin login works (MFA confirmed)
[ ] last import batch succeeded
[ ] no open P1 incidents
[ ] AWS state visibility panel shows green
```

## Daily loop

### 1. Open imported batch

```text
[ ] /admin/patients
[ ] filter by latest batch_id
[ ] read created/skipped/failed summary
```

### 2. Drawer-review high-priority records

Priority order:

```text
- records with FAIL status (escalate to Midland clinical lead)
- records with SKIP duplicate (verify the existing record is correct)
- records flagged "Action needed"
- recently overdue safety / water chamber checks
```

### 3. Drawer fields to confirm

```text
[ ] name and DOB year render correctly (no garbled characters)
[ ] MSID present and unique-looking (MS-XXXXXX)
[ ] device model and serial present
[ ] mask: shown honestly (model + size, OR "no mask on record" — never blank, never fake)
[ ] entitlement status: ✅ CAN REORDER / ⏳ NOT YET / ⚠️ NEEDS REVIEW
[ ] no dollar amount visible to admin in entitlement section either
[ ] last 5 audit events look reasonable
```

### 4. Action where needed

```text
NHI reveal              click reveal, ENTER REASON, view 30s, never screenshot
Export for outreach     /admin/exports → combined CSV → opens in spreadsheet
Export for funder       /admin/exports → entitlement summary → 90-day window
Update review status    set to Reviewed / Action needed / Escalated
Trigger ad-hoc backup   /admin/aws-status → trigger on-demand → enter REASON
```

### 5. End-of-day check

```text
[ ] /admin/aws-status panel green (no alarm flags)
[ ] last weekly snapshot timestamp is < 7 days
[ ] no failed PITR status
[ ] no anomalous NHI_REVEAL or EXPORT_RUN counts
```

## Escalation paths

```text
Clinical question                   Midland clinical lead
Privacy concern                     Midland Privacy Officer
NHI exposure suspected              STOP, do not export, contact Paul same day
Backup failure alert                Paul (P1)
Unknown bug or 5xx                  Paul (within retainer SLA)
```

## Forbidden in admin portal (Rule 17)

```text
[ ] do NOT delete a patient record (AWS console only)
[ ] do NOT restore from backup (AWS console only)
[ ] do NOT export NHI without a reason (gated; reason required)
[ ] do NOT take a screenshot of the NHI reveal
[ ] do NOT share an export URL — links are single-use 24h
```

## What admins are NOT responsible for

```text
- clinical decisions
- legal / compliance certification
- AWS account-level config
- Cognito user pool changes (Paul's job)
- production database schema changes
- backup restore (AWS console + Paul, jointly)
```

## Records

```text
Every export run, NHI reveal, on-demand backup, and review status change
auto-writes to the audit log. No manual record-keeping required beyond
that for routine admin tasks.

Notable events (escalations, anomalies, incidents) → escalate by email.
```
