# Clinic Implementation Playbook

> Repeatable steps for onboarding a new clinic onto the portal platform.
> Based on Midland learnings. Update after each new clinic.

## Week 0 — Discovery (1–2 days)

```text
[ ] discovery call (60 min)
[ ] confirm patient volume, staff count, current tech stack
[ ] confirm funding model (government / private / mixed)
[ ] confirm data source (ALTER / spreadsheet / PMS export)
[ ] confirm Privacy Officer exists or needs appointing
[ ] confirm clinical lead for data sign-off
[ ] send readiness checklist
[ ] proposal with milestone billing
```

## Week 1 — Setup (2–3 days)

```text
[ ] new org_id in DynamoDB (or new Terraform workspace)
[ ] new Cognito pools (patient + staff)
[ ] new S3 backup prefix
[ ] new CloudWatch dashboard
[ ] brand config (colours, logo, clinic name)
[ ] demo accounts provisioned
[ ] Phase 1A demo deployed (Vercel or Amplify preview)
```

## Weeks 2–4 — Import + Admin (5–8 days)

```text
[ ] receive source data from clinic
[ ] validate + clean
[ ] dry-run import
[ ] clinical approval
[ ] execute import (first 50–100 records)
[ ] admin review + drawer verification
[ ] export bridge configured
[ ] backup discipline verified
```

## Week 5 — SOPs + Handover (3–5 days)

```text
[ ] import SOP customised for clinic data format
[ ] admin review SOP
[ ] release SOP
[ ] support model documented
[ ] onboarding SOP for admin staff
[ ] HANDOVER-INDEX customised
[ ] staff training session (30 min)
[ ] Privacy Officer walkthrough
```

## Week 6 — Go-live (2–3 days)

```text
[ ] final QA
[ ] backup smoke test
[ ] production deploy
[ ] CloudWatch alarms verified
[ ] retainer starts
```

## Post go-live

```text
[ ] monthly improvement review
[ ] quarterly summary email
[ ] case study capture (before/after)
```
