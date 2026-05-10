# MVP Rules

> What goes in the v1 production build, what doesn't, and how we decide on the fly.

## The MVP test

A feature ships in Phase 1B if and only if it answers YES to all five:

```text
1. Does it move Midland toward the import → review → export → SOP → handover line?
2. Is it operationally critical (clinic cannot run without it)?
3. Does it preserve patient data safety?
4. Can we ship it without expanding scope to checkout / inventory / mobile / SSO?
5. Can we deliver it inside the existing day-by-day plan without slipping June 30?
```

If any answer is NO → it is NOT MVP. Document it in `02-product/feature-backlog.md` instead.

## Confirmed MVP features

```text
[x] patient login (MSID or email, no MFA)
[x] patient dashboard (machine, mask, entitlement YES/NO)
[x] equipment view
[x] reorder request (server-side request, not order placement)
[x] maintenance / safety check view
[x] contact form (with HIPC Rule 3 privacy notice)
[x] profile (edit own name/email/phone, NHI reveal 30s, Download My Data)
[x] admin login (MFA required)
[x] admin patient list (with filters)
[x] admin drawer (patient detail)
[x] controlled import (dry-run + execute + duplicate detection + failed row handling)
[x] Admin Data Operations: Export (4 types) + Backup + AWS State Visibility (v3.1)
[x] audit log (append-only, IAM-enforced)
[x] HIPC compliance baseline (privacy notices, NHI encryption, masking)
[x] CloudWatch monitoring + alarms
[x] backup discipline (PITR + on-demand + weekly S3)
```

## Confirmed NOT MVP (Phase 1B)

```text
[ ] checkout, cart, Stripe → Phase 2 (Month 12)
[ ] shop catalogue → Phase 2
[ ] inventory, suppliers → Phase 4
[ ] mobile app / PWA → Phase 4.5
[ ] patient invitations → Phase 2
[ ] Cognito patient user creation flow → Phase 2
[ ] automated patient email → Phase 2
[ ] advanced audit dashboard → Phase 2
[ ] SSO / Azure AD federation → Month 4–6
[ ] Terraform / IaC → Months 5–6 post-launch
[ ] AI agents / chatbot → not in roadmap
[ ] Midland Points / referral / earn-reward → REMOVED ENTIRELY
[ ] paid consultations → REMOVED
[ ] hose or water chamber sales → REMOVED (clinical safety)
```

## "Surgical edit" rule

```text
Every change should be:
  - file-scoped (allowed files listed in the prompt)
  - small (a single feature slice, not a refactor)
  - verifiable with npx tsc --noEmit
  - committable with a single descriptive message

If the change pulls in 5+ unrelated files or 200+ lines across a milestone,
stop and split it.
```

## "If asked to expand scope" decision tree

```text
1. Is the request P1 or patient-data critical? → ship as bug fix, log decision.
2. Is it within the existing day-by-day plan? → schedule, no scope change.
3. Is it new work? → quote separately, document in feature-backlog.md.
4. Is it a Phase 2+ feature being asked early? → defer politely, point at Month 12.
5. Is it Midland under pressure? → empathy + plan, not feature.
```

## What "production-ready" means in Phase 1B

```text
- npx tsc --noEmit passes
- npm run build passes
- end-to-end smoke test of import + admin review + export + backup passes
- HIPC compliance report items 🟡 → 🟢 where evidence has been captured
- Privacy Officer sign-off for go-live data
- audit log is being written
- CloudWatch alarms are wired
- backup smoke test passes
- known limitations honestly documented
- support model documented
```
