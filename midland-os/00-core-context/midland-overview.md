# Midland Sleep — Project Overview

## What this is

A patient-facing + admin web portal for Midland Sleep Ltd, a CPAP sleep clinic in Waikato, New Zealand. The portal replaces Midland's dependency on Biomedical Services NZ's ALTER ordering system. Patients log in, see their CPAP machine and mask, check whether they can reorder funded supplies, and submit reorder requests. Admin staff import, review, export, and back up patient records.

This is not a marketing website. It is healthcare-adjacent operational software.

## Client snapshot

```text
Name:                   Midland Sleep Ltd
Location:               Waikato, New Zealand
Patients registered:    ~4,500–6,000
Expected portal users:  ~2,500
Current state:          one landing page, Gmail contact, ALTER ordering portal
Staff:                  10–20 (non-technical)
Funding:                NZD 1.5M/year govt → target NZD 2M with audit/utilisation proof
Login currently:        NHI used as credential (compliance risk we are removing)
Login replacement:      MSID — MS-XXXXXX, 6 random digits, range 100000–999999
```

## Why Midland engaged OneOfZero

```text
- ALTER ordering system is third-party, expensive, and inflexible
- Manual phone-based reorder workflow eats ~40 admin hours/week
- No portal means no audit data → can't prove utilisation to govt funder
- NHI-as-login is a Privacy Act 2020 / HIPC 2020 risk
- They want to expand into a private clinic stream after Phase 1
```

## What "success" looks like at June 30

```text
- live production admin/patient portal
- controlled import of first 50–100 real patient records (rehearsal-grade)
- admin can list, drawer, export, back up, see AWS state
- import / admin review / export / backup / release SOPs delivered
- Privacy Officer sign-off complete
- monthly retainer started
- Midland has audit data to pursue NZD 2M government funding
- OneOfZero has a live NZ healthcare SaaS case study
```

## What is explicitly out of Phase 1

```text
- checkout, cart, Stripe, payments
- shop, inventory, suppliers
- mobile app, PWA
- patient invitation flows
- Cognito patient user creation flows (admin imports records, patients self-register Phase 2)
- automated patient emails
- advanced audit dashboard
- SSO / Azure AD federation
- Terraform / IaC
- broad AI chatbot or agent features
```

## Two-layer commercial model (locked)

```text
LAYER 1 — Government Entitlement (always active)
  Funded masks, cushions, headgear, filters
  Patient sees YES/NO, never a dollar amount
  Checkout: "✅ Covered — $0.00"

LAYER 2 — Patient Price (10% off CPAP machines only)
  Phase 1A demo: ACTIVE
  Phase 1B production: DORMANT (src/phase2/, returns 404)
  Reactivation: Month 12 contract review
```

## Demo accounts

```text
PATIENT
  Paul Moreno     | MSID MS-238872 | Demo@1234! | AirSense 11      | ✅ CAN REORDER | ⚠️ Safety overdue
  Sarah Kim       | MSID MS-731204 | Demo@5678! | SleepStyle 650   | ⏳ NOT YET     | ⚠️ Water chamber due
  Richard O'Brien | MSID MS-956431 | Demo@9012! | AirSense 10      | ✅ CAN REORDER | ⚠️ Both overdue

ADMIN (Phase 1B only)
  Jordan Williams | admin@midlandsleep.co.nz | Admin@secure1!

DEV
  dev@oneofzero.co.nz | Dev@test99! | MSID MS-000000 | is_dev: true in audit
```

## Geography & compliance frame

```text
Region:                ap-southeast-2 (Sydney) — HIPC Rule 12 via Cloud Risk Assessment
Privacy Act 2020:      every patient feature must satisfy
HIPC 2020:             13 rules, codified in docs/compliance/HIPC-2020-compliance-report.md
Privacy Officer:       Midland-side, sign-off required before go-live
Third-party processors: AWS Sydney (confirmed), M365 AU (Midland-pending)
```

## Why this becomes a productized offer

Midland is the first case study. The same portal pattern is reusable across other NZ sleep clinics, allied healthcare clinics with funded supply workflows, and (Year 2+) a multi-clinic Waikato-district deployment with Terraform-per-clinic.
