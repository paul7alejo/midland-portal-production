# Architecture

## Goal

Ship Phase 1B by June 30 as a production operations portal — not a SaaS platform.

## High-level

```text
Browser
  ↓
Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
  ↓
Protected routes + role-based UI (patient | admin | dev)
  ↓
API routes / server actions
  ↓
AWS Cognito (auth)        — 2 pools: patient (no MFA), staff (MFA required)
  ↓
DynamoDB (7 tables)        — ap-southeast-2 (Sydney)
  ↓
CloudWatch logs / 6 alarms
  +
S3 backups bucket          — weekly snapshot, encrypted, versioned, blocked-public
```

## User groups

```text
Patient                 own record only
Admin (staff)           org-scoped via org_id GSI
Developer / OneOfZero   audited (is_dev: true), prod access via emergency procedure
Future                  clinic manager, inventory/fulfilment role (Phase 4)
```

## Phase 1B core workflows

```text
1. Patient portal foundation    login → dashboard → entitlement → equipment → support/reorder
2. Admin portal foundation       login → patient list → drawer → review → export/backup
3. Controlled import             CSV → dry-run → validate → duplicate detect → approval →
                                 execute → DynamoDB writes → admin visibility
4. Admin Data Operations         export (imported / combined / entitlement / audit) +
                                 backup (PITR + on-demand + weekly S3) +
                                 AWS state visibility (read-only)
5. Midland OS workflow           status → day plan → implementation → evidence → SOP →
                                 risk/decision log → handover
```

## Architecture principles

```text
- MVP first. No unnecessary backend rewrites.
- No patient account creation during import.
- No email automation in Phase 1B.
- No order/fulfilment writes during import.
- No fake data fallbacks anywhere.
- No raw NHI in API responses unless via the existing safe reveal flow.
- No portal-driven destructive operations on AWS resources (Rule 17).
- All exports and reveals are audit-logged BEFORE the action visibly happens.
```

## Folders

```text
src/
  app/
    page.tsx
    login/
    register/
    portal/                  patient routes
      dashboard/
      equipment/
      reorder/
      maintenance/
      contact/
      profile/
    admin/                    admin routes (Phase 1B only)
      page.tsx
      patients/
      orders/
      segments/
      entitlement/
      outreach/
      audit/
      reports/
      config/
      exports/                NEW (v3.1)
      aws-status/             NEW (v3.1)
    api/
      admin/
        import/
          dry-run/
          execute/
        exports/              NEW (v3.1)
          imported-patients/
          combined/
          entitlement/
          audit-window/
        backup/               NEW (v3.1)
          on-demand/
          status/
        aws-status/           NEW (v3.1)
      patient/
  components/
  lib/
    auth/
    db/
    audit/
    safe-log.ts
    mask-nhi.ts
    export/                  NEW (v3.1)
    backup/                  NEW (v3.1)
  phase2/                    DORMANT — shop, checkout, Stripe — not imported in 1B
```

## Future architecture (post Phase 1B)

```text
Phase 2  Admin Operations OS         notes, outreach, safety checks, reporting
Phase 3  Entitlement Commerce OS     entitlement-aware catalogue, checkout, co-pay
Phase 4  Inventory & Fulfilment OS   SKUs, stock, suppliers, reorder thresholds
Phase 4.5 Mobile / PWA               only after ordering and fulfilment stable
Phase 6  Multi-Clinic OS             org_id tenant separation already designed,
                                     terraform workspace per clinic
```
