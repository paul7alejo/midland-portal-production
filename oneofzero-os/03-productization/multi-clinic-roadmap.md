# Multi-Clinic Roadmap

## Architecture

```text
Shared codebase → per-clinic Terraform workspace → per-clinic org_id
Same DynamoDB tables, scoped by org_id GSI
Per-clinic Cognito pools (or shared pool with org_id attribute)
Per-clinic S3 backup prefix
Per-clinic CloudWatch dashboard
Per-clinic brand config
```

## Timeline

```text
Year 1      Midland stable, playbook extracted
Year 2 Q1   Clinic 2 onboarded (4–6 weeks using playbook)
Year 2 Q2   Clinic 3 (3–4 weeks — playbook refined)
Year 2 H2   Centralised reporting across clinics
Year 3      5–10 clinics, leveraged delivery, NZD 250k+ recurring
```

## Economics at scale

```text
1 clinic     NZD 42k build + NZD 27.6k retainer/yr = NZD ~70k/yr
3 clinics    NZD 85k builds + NZD 72k retainer/yr = NZD ~157k/yr
5 clinics    NZD 130k builds + NZD 120k retainer/yr = NZD ~250k/yr
10 clinics   leveraged — NZD 400k+/yr (retainer + hosting + share)
```

## Key constraint

Paul is solo. Multi-clinic requires either:
- extreme playbook efficiency (4-week onboarding per clinic)
- or a subcontractor for frontend/docs while Paul owns architecture + compliance

Decision point: Year 2 Q2 — evaluate after clinic 2 is stable.
