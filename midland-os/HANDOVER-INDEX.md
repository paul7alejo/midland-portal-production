# Handover Index — Midland OS v1

> Single entry point for Midland staff after June 30 go-live.
> If you only read one file, read this.

---

## What Midland OS v1 is

The operating layer beside the patient portal. It is a curated set of context, workflows, SOPs, decisions, risks, and handover material that lets Midland operate the portal safely.

It is **not** a separate AI product. It is **not** a chatbot. It is **not** a feature you log in to. It is the documentation, procedures, and visibility layer that makes the portal a real operating system.

---

## What Phase 1 delivered

```text
✅ Patient portal — login, dashboard, equipment, reorder, maintenance, contact, profile
✅ Admin portal — patient list, drawer, review, exports, backup status, AWS state visibility
✅ Controlled import — Biomedical-style spreadsheet → DynamoDB with audit
✅ Admin Data Operations — 4 export types, 3-layer backup, AWS state visibility
✅ Audit log — append-only, 10-year retention, IAM-enforced
✅ HIPC alignment — privacy notices, NHI encryption + masking + reveal flow
✅ Backup discipline — DynamoDB PITR + on-demand + weekly S3 snapshot
✅ SOPs — import, admin review, release, support, onboarding, export, backup
✅ Documentation — this Midland OS v1 pack
```

---

## Daily entry points (post go-live)

```text
What to do today      01-clinic-operations/admin-review-workflow.md
Daily admin checklist  04-sops/admin-review-sop.md
Run an export          04-sops/export-sop.md
Trigger a backup       04-sops/backup-sop.md
Onboard a new admin    04-sops/onboarding-sop.md
Report a problem       01-clinic-operations/support-workflow.md
```

---

## Reference (read once, refer back)

```text
What we built          00-core-context/midland-overview.md
The phase plan         00-core-context/phase-map.md
Non-negotiables        00-core-context/non-negotiables.md
What's where           00-core-context/data-boundaries.md
Pricing + scope        00-core-context/pricing-scope.md
Clinic workflows       01-clinic-operations/
Product rules          02-product/mvp-rules.md
Backlog (parking lot)  02-product/feature-backlog.md
Decision log           02-product/decision-log.md
Architecture           03-technical/architecture.md
Systems design         03-technical/systems-design.md
AWS stack              03-technical/aws-stack.md
Audit log rules        03-technical/audit-logging-rules.md
Admin Data Operations  03-technical/admin-data-operations.md
Deployment runbook     03-technical/deployment-runbook.md
SOPs                   04-sops/
```

---

## Memory & history

```text
Weekly summary         06-memory/weekly-summary.md
Risks (open + closed)  06-memory/risks.md
Known limitations      06-memory/known-limitations.md
Learnings              06-memory/learnings.md
Open loops             06-memory/open-loops.md
Phase 1 evidence       07-outputs/phase-1/
```

---

## How to request a change

```text
1. Email paul@oneofzero.co.nz with:
   - what you want
   - why (operational impact)
   - urgency (P1 / P2 / P3 / P4)
2. Paul triages within retainer SLA (see 04-sops/support-model.md)
3. If it's a bug fix → fixed within retainer
4. If it's a change request → quoted separately, scheduled
5. Outcome lands in 02-product/release-notes.md
```

---

## What happens after Phase 1 go-live

```text
Month 1–11   monthly improvement reviews (1 hour, scheduled)
             retainer covers maintenance + minor improvements
             quarterly summary email at end of every Q
Month 12     Phase 2 conversation — shop, Stripe, revenue share, patient invite
             contract review
Year 2+      Phase 3+ as agreed; multi-clinic option available
```

---

## What this is NOT

```text
- a clinical record system
- a marketing or outreach engine (Phase 2)
- an order management system (Phase 4)
- a 24/7 SLA support contract
- legal / compliance certification
- responsible for clinical decisions
```

---

## Contacts

```text
OneOfZero (Paul Alejo)    paul@oneofzero.co.nz
Production portal         portal.midlandsleep.co.nz (or as configured)
AWS billing               Paul (forwarded summary to Midland monthly)
Privacy Officer           [Midland-side; insert name + contact]
Clinical lead             [Midland-side; insert name + contact]
```

---

## Pack version

```text
v3.1 — May 9, 2026
```
