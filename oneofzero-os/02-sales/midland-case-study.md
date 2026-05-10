# Midland Case Study (in progress)

> The case study is captured in real time as Phase 1B ships. Update at every milestone.

## Title

> From spreadsheet-and-phone to a controlled clinic operations portal in 8 weeks.

## Client

```text
Midland Sleep Ltd
Waikato, New Zealand
~6,000 active CPAP patients
~NZD 1.5M / yr government funding pool (target: NZD 2M with audit data)
10–20 admin / clinical staff (non-technical)
```

## The before state

```text
- ALTER ordering portal — third-party, expensive, slow to change
- Phone-and-spreadsheet for everything else
- ~35 admin hours/week of reorder coordination
- NHI used as login credential (Privacy Act / HIPC risk)
- No audit trail for funder reporting
- No backup discipline beyond ad-hoc spreadsheet copies
```

## The constraints

```text
- 8-week build, fixed-price NZD 42k
- solo developer
- 28–30 hours/week available
- AWS-only stack
- HIPC 2020 from day one
- no new clinical software, just a portal layer
- Privacy Officer must sign off before go-live
```

## What we built (in scope)

```text
- Patient portal foundation:
    login (MSID, no NHI as credential)
    dashboard, equipment, entitlement view
    reorder request
    profile (NHI 30s reveal in Profile, audit-logged)
    Download My Data (HIPC Rule 6)

- Admin command centre:
    patient list with filters
    drawer / detail with masked NHI
    controlled import (dry-run + execute)
    duplicate NHI / serial protection
    review status workflow
    Admin Data Operations:
      - 4 export types (NHI excluded by default — Rule 16)
      - PITR + on-demand + weekly S3 backup
      - AWS state visibility panel

- Operating layer (Midland OS v1):
    SOPs for import / admin review / release / support / export / backup
    decision log, risks, learnings, known limitations
    handover index for staff onboarding
    backup smoke test in every release
```

## What we explicitly did NOT build (Phase 2+)

```text
- shop, checkout, Stripe (Phase 2)
- inventory, suppliers, fulfilment (Phase 4)
- mobile app (Phase 4.5)
- patient invitation automation (Phase 2)
- automated patient email (Phase 2)
- portal-driven delete or restore (never — AWS console only)
```

## The numbers (to verify post go-live)

```text
Admin time saved (target):   ~35 hours/week reduction
Funded patient share served: 100% of imported batch via portal
Audit rows captured:         every NHI reveal, every export, every backup,
                             every import
Backup recovery point:       PITR 35-day window + weekly S3 snapshots
NHI handling:                AES-256-GCM at rest, never in URL, never in log
Region:                      ap-southeast-2 (HIPC Rule 12 satisfied)
```

## Outcome categories to measure (targets)

```text
1. Admin time savings:        35 hrs/wk × $35/hr ≈ NZD 63,700/yr
2. Funder evidence:           audit-trail data → support NZD 2M govt funding case
3. Compliance posture:        HIPC 2020 across 13 rules, Privacy Officer signed
4. Patient experience:        single login, plain-English entitlement, no jargon
5. Backup discipline:         PITR + on-demand + weekly snapshot smoke-tested
```

## What Midland says (post go-live, to be filled)

```text
[ ] one quote about admin time
[ ] one quote about patient feedback
[ ] one quote about funder reporting confidence
[ ] permission to use as a referenceable case study
```

## Reusable IP for OneOfZero

```text
- Biomedical Spreadsheet-to-Admin Portal Operations Package (the offer name)
- 7-table DynamoDB schema with org_id tenant separation
- Two-pool Cognito setup (patient no-MFA, staff MFA)
- Admin Data Operations sub-system (export + backup + AWS visibility)
- Midland OS v1 folder structure and SOP set
- HIPC 2020 compliance posture document
- 8-week milestone billing template
- Monthly retainer + improvement review template
```

## Permission asks (post go-live)

```text
[ ] permission to publish anonymised metrics
[ ] permission to use Midland name as reference (with Privacy Officer review)
[ ] permission to share the architecture diagram (no NHI / no patient PII)
[ ] permission to publish the SOP templates (anonymised)
```
