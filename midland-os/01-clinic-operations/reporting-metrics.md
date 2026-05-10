# Reporting & Metrics

> What we measure, how, and what we DO NOT track.
> Phase 1B keeps this simple: CSV export + AWS state visibility, not analytics dashboards.

## Operational metrics (Phase 1B)

These are derivable from CSV export + audit log + CloudWatch — no analytics layer needed.

### Import health

```text
Records imported per batch        from import API response
Records skipped (duplicates)      from import API response
Records failed (validation)       from import API response
Imports per week                  from audit log filter
Average time from receipt to import  manual tracking until automated
```

### Admin activity

```text
Admin logins per week             from audit log
NHI reveals per admin per month   from audit log (trigger investigation if anomalous)
Exports run per month             from audit log + Admin Data Operations log
Backups taken per month           from audit log
```

### Patient activity (low volume in 1B)

```text
Patient logins per week           from Cognito + audit log (once Cognito patient users provisioned)
Reorder requests submitted        from orders table (ENTITLEMENT type)
Profile updates                   from audit log
NHI reveals (by patient on own record) from audit log
```

### System health

```text
Portal uptime                     CloudWatch
5xx error rate                    CloudWatch
DynamoDB throttles                CloudWatch (alarm threshold)
Lambda errors (backup snapshot)   CloudWatch alarm
Last successful backup            DynamoDB describe-backup + S3 list-objects
PITR enabled per table            DynamoDB describe-continuous-backups
```

## What we do NOT track in Phase 1B

```text
- patient demographics by region (privacy + scope)
- "engagement" metrics (this is healthcare, not consumer SaaS)
- vanity metrics (DAU/MAU dashboards)
- conversion funnels (no shop in 1B)
- A/B test results (no shop, no marketing)
- third-party analytics (no Google Analytics, no Mixpanel — privacy)
```

## Reporting cadence

```text
Weekly      Paul self-tracks via /admin/aws-status panel + audit log spot-check
Monthly     improvement review with Midland (see 01-clinic-operations/support-workflow.md)
Quarterly   summary email to Midland: imports run, exports run, backup status,
            uptime, billing, any incidents
Annually    Midland funder report contribution (utilisation data, anonymised)
```

## How metrics are produced (no dashboard required)

```text
1. Admin opens /admin/exports
2. Admin runs combined / entitlement / audit window export
3. CSV downloads (audit row written before file generates — Rule 16)
4. Admin pastes into a spreadsheet for the funder report
5. Or — Paul pulls metrics from CloudWatch + DynamoDB describe APIs for the
   monthly improvement review
```

## Phase 2+ (out of scope, but noted)

```text
- proper reporting dashboard (Phase 2)
- patient-facing usage stats (Phase 5)
- multi-clinic comparison reports (Phase 6)
- automated funder reports (after multi-clinic stabilisation)
```

## Privacy-respecting principles

```text
- aggregate only — no patient-level data in any cross-cutting metric
- de-identify before any external share (anonymised aggregates only)
- never share metrics that could re-identify (small-cell suppression)
- all metric exports inherit Rule 16 (NHI excluded by default)
```
