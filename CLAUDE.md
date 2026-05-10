# CLAUDE.md — Midland Sleep Portal v8.2

> Drop this at repo root. Claude Code and Codex read it automatically.
> Version: 8.2 (v3.1 aligned — Admin Data Operations added)
> Last updated: May 10, 2026

## Project

Midland Sleep patient + admin portal. Healthcare-adjacent operations software.
Phase 1B production target: June 30, 2026.
Repo: https://github.com/paul7alejo/midland-portal-production.git

## Stack

```
Frontend:   Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
Hosting:    AWS Amplify (Phase 1B production)
Auth:       AWS Cognito (2 pools: patient no MFA, staff MFA TOTP)
Database:   AWS DynamoDB — 7 tables, ap-southeast-2, PAY_PER_REQUEST
Secrets:    AWS Secrets Manager (NHI key — dev + prod separate)
Security:   AWS WAF (Common Rules + rate limiting)
Monitoring: AWS CloudWatch (6 alarms)
Backup:     DynamoDB PITR + on-demand + weekly S3 snapshot Lambda
Email:      AWS SES (transactional only — NOT patient email in 1B)
Payments:   Stripe dormant in 1B (src/phase2/, returns 404)
Region:     ap-southeast-2 (Sydney)
```

## Current status

```
Pack version:     v3.1
Day 30:           🟡 in progress
Slice:            1C closeout → 1D + 1D-x (Admin Data Ops) → 1E
External risk #1: ALTER export format not confirmed
```

## Key rules (always apply)

```
1.  Login: MSID (MS-XXXXXX) or email — NEVER NHI
2.  Entitlement: show YES/NO — NEVER dollar amount
3.  At checkout: "✅ Covered — $0.00" (Layer 1 items)
4.  NHI: masked ZZZ**** by default, 30s reveal in Profile only
5.  Privacy notice ABOVE every data collection form (HIPC Rule 3)
6.  maskNHI() before any string reaches any log
7.  safeLog() not console.log() for patient data
8.  Audit log: PutItem ONLY — no UpdateItem, DeleteItem, ever
9.  NHI reveal: write audit BEFORE showing, 30s auto-hide
10. Phase 1B: NO Stripe keys, NO shop deployed, NO checkout deployed
11. Phase 2 code lives in src/phase2/ — not imported
12. No hose or water chamber sales (clinical safety)
13. No Midland Points, referral system, or earn/reward
14. Patient copy: calm, clinical, simple — never salesy
15. AI tools: NEVER use real patient data — demo accounts only
16. NHI excluded from exports by default (opt-in needs reason + audit)
17. No portal-driven delete or restore (AWS console only)
18. Backup smoke test in every release SOP
```

## Demo accounts

```
PATIENT
  Paul Moreno     | MS-238872 | Demo@1234!
  Sarah Kim       | MS-731204 | Demo@5678!
  Richard O'Brien | MS-956431 | Demo@9012!

ADMIN
  Jordan Williams | admin@midlandsleep.co.nz | Admin@secure1!

DEV
  dev@oneofzero.co.nz | Dev@test99! | MS-000000 | is_dev: true
```

## Brand

```
Navy:      #0B2A3C   headings, nav, primary buttons
Deep Teal: #0B5C6C   CTAs, links, active states
Seafoam:   #74C0A2   success, "covered", patient price badge
Cream:     #FDFCF5   page background
Charcoal:  #333333   body text
Sand:      #E6D3A3   borders, dividers
Amber:     #F59E0B   OVERDUE warnings ONLY
```

## Routes (Phase 1B production)

```
PATIENT (active):
  / | /login | /register | /portal/dashboard | /portal/equipment |
  /portal/reorder | /portal/maintenance | /portal/contact | /portal/profile

DORMANT (src/phase2/, 404):
  /portal/shop | /portal/checkout

ADMIN (active):
  /admin | /admin/patients | /admin/orders | /admin/segments |
  /admin/entitlement | /admin/outreach | /admin/audit |
  /admin/reports | /admin/config | /admin/exports | /admin/aws-status
```

## DynamoDB — 7 tables

```
1. midland-sleep-patients    PK: USER#uuid, GSI: portal_id, org_id
2. midland-sleep-devices     PK: device_id, GSI: patient_id
3. midland-sleep-masks       PK: mask_id, GSI: patient_id
4. midland-sleep-entitlement PK: PATIENT#id, SK: YEAR#2026
5. midland-sleep-orders      order_type: ENTITLEMENT | MIXED only
6. midland-sleep-audit       APPEND-ONLY (PutItem only, IAM-enforced)
7. midland-sleep-comms       transactional only
```

## Verification

```bash
npx tsc --noEmit    # before and after every change
npm run build       # before closing any milestone
```

## Work style

```
- Surgical edits only — no broad rewrites
- Allowed/forbidden files declared per task
- Feature branch + PR even solo
- Every implementation reply ends:
    Files changed:
    Verification:
    Risks / notes:
    Next step:
- Anti-drift: do not implement outside the requested task
```

## Skills (trigger with /command)

```
EVERY SESSION:   /plan /verify /commit
PATIENT PORTAL:  /portal-component /frontend-design /equipment-alerts
SECURITY:        /vibesec /nhi-audit /sanitize /varlock /entitlement-check
ADMIN:           /admin-dashboard /admin-view
ADMIN DATA OPS:  /admin-export /backup /aws-status
AS NEEDED:       /debug /cicd-check /demo-ready /track-event
                 /techdebt /fix-wallet /new-component /rename-credits
```

## Documentation

```
midland-os/                     operating layer docs
  00-core-context/              canonical truth
    claude-context-pack/        master pack for AI sessions
  01-clinic-operations/         workflows
  02-product/                   MVP rules, backlog, decisions, tracker
  03-technical/                 architecture, AWS, DynamoDB, admin data ops
  04-sops/                      import, admin review, release, export, backup
  05-prompts/                   master intro, skills, templates
  06-memory/                    weekly summary, risks, limitations, learnings
  07-outputs/                   evidence packs
oneofzero-os/                   business-side operating system
```

## Locked decisions (do not reopen)

```
- AWS, not Azure
- DynamoDB, not RDS
- Amplify, not ECS/EKS
- 7 tables (no points/consultations/stripe_payments)
- ap-southeast-2 single region
- Stripe dormant in 1B
- No SSO/Azure AD in 1B
- No Terraform before June 30
- Layer 2 (10% off) CPAP machines only
- MSID format MS-XXXXXX (not MPID)
```
