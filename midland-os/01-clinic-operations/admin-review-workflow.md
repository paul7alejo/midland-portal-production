# Admin Review Workflow

> What admin staff do every day in the portal. Operations software, not CRM.

## Daily admin loop

```text
1. Log in (MFA required)
2. Open patient list → check imported batch summary
3. Drawer-review high-priority records (overdue, recently imported, failed)
4. Action where needed (export for outreach, export for clinical handoff)
5. Check AWS state visibility panel (records present, last backup, no alarms)
6. End of day → audit log spot-check (last 24h)
```

## Patient list

```text
Columns:
  MSID
  Name
  Last imported
  Device serial (truncated, full on hover/drawer)
  Mask model (or "—" if none)
  Status (Pending review / Reviewed / Action needed)
  Imported badge (if from a recent batch)

Filters:
  by org_id
  by status
  by import batch ID
  by date range (imported_at)

Search:
  by MSID
  by surname (case-insensitive prefix)
  NEVER search by NHI in the URL
```

## Drawer / detail view

```text
Top section
  Name, MSID, Date of birth (year only by default; full DOB on click + audit)
  NHI: ZZZ**** masked. 30-second reveal in Profile only — admin reveals in
       drawer require a written reason → audit row BEFORE reveal renders.

Equipment section
  Machine model, serial, supplied date, warranty
  Mask model + size (or honest "no mask on record" — never fake fallback)

Entitlement section
  Funded year
  Last claim
  Next eligible
  Status: ✅ CAN REORDER / ⏳ NOT YET / ⚠️ NEEDS REVIEW
  NEVER show a dollar amount

Audit section (read-only)
  Last 5 events on this record (action, who, when)
```

## Review status

```text
Pending review     just imported, not touched
Reviewed           admin looked at it, no action needed
Action needed      something missing or wrong (mask gap, expired warranty, contact data missing)
Escalated          clinical decision required, Midland-side
```

## What admins can do (Phase 1B)

```text
[ ] view list, drawer
[ ] update review status (display-only if mutation isn't safely wired — see known-limitations)
[ ] export imported batch to CSV (Admin Data Operations)
[ ] export combined / entitlement / audit window CSVs
[ ] trigger on-demand backup (with reason)
[ ] view AWS state visibility panel
```

## What admins CANNOT do (Phase 1B)

```text
[ ] edit patient record fields directly (data correction goes through controlled import)
[ ] delete a patient record (AWS console only, IAM-protected)
[ ] restore from backup (AWS console only, IAM-protected)
[ ] create a Cognito patient user (Phase 2)
[ ] send patient email (Phase 2)
[ ] place an order on a patient's behalf (out of scope in 1B)
```

## Escalation paths

```text
Clinical question        → Midland clinical lead
Privacy concern          → Midland Privacy Officer
NHI exposure suspected   → STOP, contact Paul, do not export, write incident note
Backup failure alert     → Paul (CloudWatch alarm email)
AWS billing anomaly      → Paul
Bug or system error      → Paul (within retainer SLA)
```

## What this is NOT

```text
- a CRM (no notes, tags, marketing)
- a clinical record system (no diagnostic data)
- an outreach engine (Phase 2)
- a reporting / analytics dashboard (export to CSV instead)
- an order management system (Phase 1B is import + review, not orders)
```
