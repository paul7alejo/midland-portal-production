# Phase 1B Execution Tracker

> Day 30 onward. Daily checklist. Tick boxes as you go. This file replaces the v6.4 day-by-day docs.

## Priority labels

```text
MUST                — required for June 30
STRETCH             — only if runway holds
BLOCKED-BY-MIDLAND  — client-side dependency
```

## Current state

```text
Repo:    clean
Day 28:  ✅ DONE + pushed
Day 29:  ✅ DONE + pushed
Day 30:  🟡 started, not complete
```

---

## Day 30 — Closeout Docs + Production Rehearsal Pack [MUST]

Slice: 1C closeout / transition to 1D + 1E.

```text
[ ] /midland-os/00-core-context/midland-overview.md
[ ] /midland-os/00-core-context/phase-map.md
[ ] /midland-os/01-clinic-operations/biomedical-import-workflow.md
[ ] /midland-os/01-clinic-operations/admin-review-workflow.md
[ ] /midland-os/04-sops/import-sop.md
[ ] /midland-os/04-sops/admin-review-sop.md
[ ] /midland-os/04-sops/release-sop.md
[ ] /midland-os/02-product/decision-log.md
[ ] /midland-os/06-memory/weekly-summary.md
[ ] /midland-os/06-memory/risks.md
[ ] /midland-os/06-memory/known-limitations.md
[ ] /midland-os/04-sops/support-model.md
```

Verification:
```bash
git status
npx tsc --noEmit
git add midland-os/
git commit -m "docs: add Midland OS production rehearsal pack"
git push
```

---

## Day 31 — Full Proof Rehearsal [MUST]

```text
[ ] Unauthorized import API = 401
[ ] Dry run clean CSV = passed
[ ] Blocked execute = 400 and created 0
[ ] Clean execute = created 1
[ ] Duplicate NHI = skipped 1
[ ] Duplicate serial = skipped 1
[ ] Imported patient appears in admin list
[ ] Drawer opens
[ ] No-mask patient shows no fake mask
[ ] NHI fields not exposed
[ ] npx tsc --noEmit passes
[ ] npm run build passes
```

Evidence: `/midland-os/07-outputs/phase-1/day-31-rehearsal/`

---

## Day 32 — Small Admin Polish Only [MUST]

Allowed:
```text
[ ] pending_review → "Pending review"
[ ] ISO timestamp → readable NZ date/time
[ ] phone formatting
[ ] device ID wrapping
[ ] "Imported" badge if data exists
[ ] empty / loading / error copy
[ ] drawer spacing
```

Forbidden: backend workflow changes, review-state mutation unless safe, Cognito, emails, patient invites, checkout, inventory, redesign.

---

## Day 33 — Admin Export: Imported Patients CSV [MUST] (1D-x)

```text
[ ] new admin route: /admin/exports
[ ] export imported patients to CSV (filter: batch ID, status, date range)
[ ] NHI EXCLUDED by default (Rule 16)
[ ] opt-in NHI export gated: reason field, audit row PutItem BEFORE generation
[ ] download link: single-use, 24h expiring, watermarked filename
[ ] CSV escaping: commas, quotes, newlines
[ ] safeLog only in export path
[ ] empty / loading / error states
```

Verification:
```bash
npx tsc --noEmit
# manual: trigger export, confirm audit row written before download URL
# manual: open CSV, confirm no NHI / no PII beyond declared scope
```

---

## Day 34 — Combined / Entitlement / Audit Window Export [MUST] (1D-x)

```text
[ ] combined patient + device + mask CSV (admin operational view)
[ ] entitlement summary CSV (per patient, current year)
[ ] audit log window export — last 30 / 90 days as JSON or CSV
[ ] all exports inherit Rule 16
[ ] filters server-side, no raw query in URL
```

---

## Day 35 — Backup System: PITR + On-Demand + Weekly S3 [MUST] (1D-x)

```text
[ ] enable DynamoDB PITR on all 7 tables (35-day rolling)
[ ] on-demand backup endpoint: admin role + reason required
[ ] weekly S3 snapshot Lambda — Sunday 02:00 NZ → s3://midland-sleep-backups/
[ ] S3 bucket: encrypted, versioning ON, public access BLOCKED
[ ] retention: 90 days hot, 1 year cold
[ ] CloudWatch alarm on Lambda failure → email Paul
[ ] document restore in release-sop.md (NOT in portal — Rule 17)
```

---

## Day 36 — AWS State Visibility Panel [MUST] (1D-x)

```text
[ ] new admin page: /admin/aws-status
[ ] read-only panel: total records per table, last write, region, encryption status
[ ] backup status panel: last successful, size, location, retention
[ ] reads via DynamoDB describe-table + describe-backup APIs only
[ ] NO destructive operations exposed
```

---

## Day 37 — Import Batch Evidence Summary [MUST]

```text
[ ] batch ID visible / documented
[ ] created / skipped / failed summary
[ ] screenshots captured
[ ] duplicate NHI / serial outcomes documented
[ ] failed-row handling documented
```

---

## Day 38 — 1D Closeout + Demo Script [MUST]

12-step demo flow:
```text
1.  dry-run validation
2.  controlled execute import
3.  created/skipped/failed summary
4.  admin imported patients table
5.  imported patient drawer
6.  machine/device details
7.  mask behavior with no fake fallback
8.  no raw NHI exposure
9.  admin export (imported + combined + entitlement)
10. backup status panel + on-demand backup
11. AWS state visibility panel
12. known limitations and next-phase boundary
```

Create: `/midland-os/07-outputs/phase-1/phase-1d-demo-script.md`

---

## Day 39 — Finalize Import SOP [MUST]
## Day 40 — Finalize Admin Review + Export SOP [MUST]
## Day 41 — Release SOP + Known Limitations [MUST]
## Day 42 — Support Model + Retainer Boundaries [MUST]
## Day 43 — Midland OS Handover Index [MUST]
## Day 44 — Risks, Decisions, Learnings Cleanup [MUST]
## Day 45 — 1E Closeout + Handover Pack [MUST]

(See `00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md` Section 14 for detail.)

---

## Days 46–49 — 1F Patient Visual Clarity Sprint [STRETCH]

Only after 1C / 1D / 1E are stable.

```text
[ ] older-patient readability
[ ] typography
[ ] contrast
[ ] spacing
[ ] tap targets
[ ] mobile clarity
[ ] image slot consistency
[ ] no generated/unlicensed images
```

---

## Day 50 — Final Go-Live Readiness Checkpoint [MUST]

```text
[ ] git clean
[ ] npx tsc --noEmit pass
[ ] npm run build pass
[ ] dry-run works
[ ] execute import works
[ ] duplicate protections work
[ ] imported patients visible
[ ] drawer opens
[ ] no raw NHI exposure
[ ] export path works (NHI excluded by default — Rule 16)
[ ] backup smoke test passes (PITR + on-demand + weekly snapshot — Rule 18)
[ ] AWS state visibility panel reads cleanly
[ ] portal-driven restore/delete confirmed not exposed (Rule 17)
[ ] Midland OS handover complete
[ ] support model documented
```

Client-blocked checklist:
```text
[ ] ALTER owner confirmed
[ ] ALTER export format confirmed
[ ] columns confirmed
[ ] migration window agreed
[ ] Privacy Officer review booked / completed
[ ] clinical / data signoff owner named
[ ] staff training / walkthrough date agreed
```
