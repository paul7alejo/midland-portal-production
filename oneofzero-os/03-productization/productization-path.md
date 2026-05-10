# Productization Path

## From custom build to reusable clinic offer

```text
Stage 1 — Midland (NOW)
  Custom build. Learn the domain. Capture SOPs. Document decisions.
  Deliverable: working portal + Midland OS v1.

Stage 2 — Extract reusable modules (Month 6–12)
  Identify what's clinic-generic vs Midland-specific.
  Extract: import engine, admin review, export, backup, audit, entitlement.
  Package: clinic-implementation-playbook.md.

Stage 3 — Second clinic (Year 2)
  Apply playbook. New org_id. New Cognito pools. Same codebase.
  Terraform workspace per clinic.
  Deliverable: clinic 2 live in 4–6 weeks (not 8).

Stage 4 — Productized offer (Year 2+)
  Fixed-price clinic onboarding package.
  Repeatable: discovery → import → admin → handover.
  Retainer per clinic.
  Shared infrastructure, isolated data.
```

## Reusable modules (extract from Midland)

```text
1. Controlled import engine (CSV → validate → dry-run → execute → DynamoDB)
2. Admin review system (list → drawer → status → export)
3. Export bridge (4 types, NHI-excluded default, audit-before-file)
4. Backup discipline (PITR + on-demand + weekly S3)
5. AWS state visibility (read-only panel)
6. Audit system (append-only, IAM-enforced)
7. Entitlement model (YES/NO, never dollar amount)
8. Auth model (2 Cognito pools, patient/staff split)
9. Midland OS documentation template (SOPs, decisions, risks, handover)
10. Brand + UI kit (configurable per clinic)
```

## Multi-clinic architecture (Phase 6)

```text
- org_id tenant separation (already designed in DynamoDB)
- Terraform workspace per clinic: terraform workspace new clinic2
- Shared codebase, per-clinic config (brand, entitlement caps, contact)
- Centralised reporting across clinics (anonymised aggregates)
- Per-clinic Cognito pools (or shared pool with org_id attribute)
- Per-clinic S3 backup prefix
- Per-clinic CloudWatch dashboard
```

## Pricing model for productized offer

```text
Discovery + readiness audit:     NZD 2,500 (applied to build if they proceed)
Clinic onboarding build:         NZD 25,000–35,000 (smaller than Midland — playbook exists)
Monthly retainer:                NZD 1,500–2,300
Hosting margin:                  NZD 70–220 / month
Revenue share (if shop active):  15% of optional product sales
```

## What makes this defensible

```text
1. Domain expertise (CPAP / funded supply / HIPC)
2. Documented operating layer (Midland OS template)
3. Reusable infrastructure (same stack, same Terraform)
4. Case study proof (Midland before/after)
5. Owner-operator trust (Paul is the person, not a rotating team)
6. Retainer alignment (we win when the clinic operates well)
```
