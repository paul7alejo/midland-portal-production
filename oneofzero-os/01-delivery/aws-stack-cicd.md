# AWS Stack + CI/CD (OneOfZero view)

> Pointer document. Detailed AWS stack lives in `midland-os/03-technical/aws-stack.md`.
> This file captures the OneOfZero perspective: cost discipline, vendor margin, and
> reusability across future clinics.

## Cost discipline (Phase 1B baseline)

```text
DynamoDB PAY_PER_REQUEST     ~NZD 5–25 / month at Phase 1 volume
DynamoDB PITR                ~NZD 5–10 / month
S3 backups bucket            ~NZD 1–3 / month
Lambda (weekly snapshot)     pennies
Cognito                      first 50,000 MAU free
Amplify hosting              ~NZD 5–25 / month
SES (transactional)          ~NZD 1–5 / month
CloudWatch logs              ~NZD 5–20 / month
WAF                          ~NZD 5–10 / month

Phase 1B total estimate:     NZD 32–95 / month
At 20,000 patients:          NZD 80–120 / month
```

## Hosting margin

```text
AWS actual cost:        ~NZD 30–95 / month
Charged to Midland:     NZD 150–300 / month  (hosting line item in retainer)
Net margin:             NZD 70–220 / month
Year 1 hosting margin:  NZD 1,800–2,640
```

## CI/CD discipline (Phase 1B minimum)

```text
GitHub main branch
  → GitHub Actions quality gate
    typecheck (npx tsc --noEmit)
    build (npm run build)
    lint (eslint)
  → Amplify auto-deploy on merge to main
  → production smoke test post-deploy
```

Do not add: multi-account AWS, event-driven queues, automated security scans, or Terraform before June 30.

## What unlocks each future phase

```text
Phase 2 (shop)            → Stripe live mode, Phase 2 code re-imported, Month 12
                            contract review, audit dashboard upgrade
Phase 4 (inventory)       → SKU table, supplier table, fulfilment dashboard
Phase 4.5 (mobile / PWA)  → service worker, manifest, install prompt; only after
                            ordering and fulfilment stable
Phase 6 (multi-clinic)    → Terraform workspace per clinic, org_id tenant
                            separation already designed in DynamoDB
```

## Reusability for future clinics

The whole stack is designed so adding Clinic 2 means:

```text
1. New AWS account or new Terraform workspace
2. Same table shapes, different org_id values
3. Same Cognito pools, fresh users
4. Same code base, different theme tokens
5. Same SOPs, same release process
```

That's the productization advantage of the architecture decisions locked in `midland-os/02-product/decision-log.md`.

## OneOfZero IaC posture

```text
Phase 1B          manual via AWS console (documented in deployment-runbook)
Months 5–6        Terraform — bring DynamoDB, S3, Cognito, Amplify under IaC
Year 2            multi-clinic via Terraform workspaces
Year 3+           Terraform module published as part of the productized clinic offer
```
