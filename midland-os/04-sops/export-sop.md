# Export SOP (v3.1)

> Procedure for running any of the 4 admin exports.
> NHI excluded by default. Opt-in NHI requires written reason + audit BEFORE file generation.

## When to use which export

```text
Imported patients CSV    auditing recent imports, batch summaries
Combined CSV             outreach planning, clinical handoff (full operational view)
Entitlement summary      funder reports, eligibility audits
Audit window (30/90 d)   privacy review, anomaly investigation, incident timeline
```

## Preconditions

```text
[ ] admin login + MFA active
[ ] last weekly backup snapshot succeeded (export does not interfere with backup
    but a broken backup is a P1 — fix backup first if alarm fires)
[ ] /admin/aws-status panel green
```

## Steps (every export)

### 1. Open /admin/exports

```text
[ ] choose export type (Imported / Combined / Entitlement / Audit Window)
[ ] set filters:
    - date range (defaults to last 30 days)
    - batch id (if applicable)
    - status (if applicable)
    - days window (audit only — 30 or 90)
```

### 2. Decide on NHI

```text
DEFAULT: NHI excluded.

Opt-in only when ALL of these are true:
  [ ] there is a documented operational reason (funder audit, clinical handoff)
  [ ] the recipient is named and has authority to receive NHI
  [ ] the file will be deleted or escrowed after use
  [ ] the audit row reason field will state purpose + recipient

If unsure → DO NOT include NHI. Use a separate handoff process.
```

### 3. Submit and wait

```text
[ ] click "Generate"
[ ] system writes audit row PutItem BEFORE file generation
[ ] system streams CSV to S3 (short-lived bucket prefix)
[ ] response: signed URL, single-use, 24h expiring, watermarked filename
```

### 4. Download and use

```text
[ ] download via the signed URL
[ ] store securely (Midland-approved location, NOT public folders)
[ ] use within 24h or regenerate
[ ] delete or escrow after use
```

### 5. Verify (recommended for first export of a new type)

```text
[ ] open CSV in spreadsheet
[ ] confirm column set matches expected (see admin-data-operations.md)
[ ] if NHI excluded: confirm no NHI column
[ ] if NHI included: confirm NHI column appears (encrypted blob OR plaintext as agreed)
[ ] confirm row count looks right vs filter
```

## Sharing the file

```text
DO
  - share via Midland-approved secure channel
  - Microsoft 365 Secure Email if available
  - encrypted attachment with separate-channel password if not
  - delete original after handoff

DO NOT
  - email plain CSV with NHI to anyone, ever
  - share the signed URL — it is single-use; another person clicking it after
    you means the file is gone for one of you
  - upload to consumer cloud (Dropbox personal, Google Drive personal, etc.)
  - share through messaging apps (WhatsApp, Messenger, etc.)
  - paste contents into AI tools
```

## Special: NHI export opt-in

```text
[ ] reason field non-empty and meaningful (not "test" or "yes")
[ ] reason includes: purpose, recipient (name or org), planned retention
[ ] audit row written BEFORE file generation
[ ] anomaly: if NHI export count for an admin > 1/month, flag for review
[ ] post-use: delete the file or escrow per agreed retention
```

## Record-keeping

```text
- every export auto-writes an audit row
- no manual record-keeping needed for routine exports
- for NHI-included exports, also note in 06-memory/risks.md if novel use case
```

## Failure paths

```text
Generate button hangs                     wait 60s; if no response, refresh; check
                                          /admin/aws-status for alarms
Audit row PutItem fails                   export fails closed — file is NOT generated
Signed URL expires before download       click Generate again (creates new audit row)
File contains data you didn't expect      STOP, do not share, contact Paul
NHI accidentally included when it
shouldn't have been                       STOP, do not share, file incident note,
                                          contact Privacy Officer same day
```

## Out of scope

```text
- patient-driven exports (patient uses Download My Data — HIPC Rule 6)
- automated scheduled exports (Phase 2)
- exports to external systems (e.g. funder API integration — Phase 3+)
- exports of orders / comms / consultations (those tables don't exist or are not used in 1B)
```
