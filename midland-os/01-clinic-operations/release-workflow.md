# Release SOP

> Standard procedure for shipping a release to production.
> Read end-to-end before every prod deploy.

## Purpose

Ship safely without breaking patient access, exposing data, or losing audit integrity.

## Owner

Paul (OneOfZero). Midland is informed for material changes.

## Pre-release checklist

```text
[ ] Privacy Officer sign-off current
[ ] No open P1 issues
[ ] Last weekly backup snapshot succeeded (Rule 18 — backup smoke)
[ ] PITR enabled on all 7 tables (verify via AWS console)
[ ] On-demand backup tested in staging this release cycle
[ ] CloudWatch alarms green for last 24h
[ ] Decision logged in 02-product/decision-log.md
```

## Local verification

```bash
git status                    # clean
git pull --rebase
npx tsc --noEmit              # pass
npm run build                 # pass
npm run lint                  # pass
```

## Staging smoke test

```text
[ ] admin login + MFA works
[ ] patient login (demo MS-238872 / Demo@1234!) works
[ ] dashboard renders without errors
[ ] equipment page renders
[ ] reorder request submission works (audit row written)
[ ] admin patient list opens
[ ] drawer opens for an imported patient
[ ] export imported patients CSV runs
[ ] open the CSV — verify NHI EXCLUDED by default
[ ] export with NHI opt-in: reason field required, audit row written before file
[ ] on-demand backup endpoint runs (confirm via DynamoDB describe-backup)
[ ] AWS state visibility panel renders
[ ] /portal/shop returns 404
[ ] /portal/checkout returns 404
[ ] no NHI in any URL
[ ] no console.log of patient data
[ ] privacy notices visible above every form (HIPC Rule 3)
```

## Backup smoke test (Rule 18)

```text
[ ] PITR status: ENABLED on all 7 tables
[ ] On-demand backup: trigger from staging, confirm describe-backup SUCCESS
[ ] Last weekly S3 snapshot exists and < 7 days old
[ ] Open last snapshot CSV — confirm NHI column appears as encrypted blob, not plaintext
[ ] CloudWatch alarm "weekly-snapshot-failure" is in OK state
```

## Merge + deploy

```text
[ ] merge release branch to main
[ ] Amplify auto-deploys to prod
[ ] watch build log
[ ] watch CloudWatch first 10 min for any alarm
```

## Production smoke test (post-deploy)

```text
[ ] admin login works
[ ] patient login works
[ ] one read-only patient page renders correctly
[ ] no 5xx in CloudWatch
[ ] WAF metrics normal
[ ] backup status panel reads correctly
```

## Release tagging

```bash
git tag v0.XX
git push --tags
```

Update `02-product/release-notes.md` with user-facing summary.

## Rollback

If smoke test fails or alarm fires within 30 min of deploy:

```text
1. Amplify console → Hosting → previous successful deploy → Redeploy this version
2. Notify Midland (email + phone if P1)
3. Open incident note in 06-memory/risks.md
4. Investigate locally; do not push another deploy until root cause documented
5. If patient data may have been affected → contact Privacy Officer same day
```

## Restore (Rule 17 — AWS console only, NOT exposed in portal)

```text
1. Open incident in 06-memory/risks.md
2. Notify Midland clinical lead + Privacy Officer
3. AWS console → DynamoDB → Backups → restore to NEW table → validate → swap
4. Audit row written manually with action: MANUAL_RESTORE, reason, who, when
5. Post-incident review → known-limitations.md + learnings.md
```

## Known limitations (Phase 1B — communicate honestly to Midland)

```text
- import writes are not transactional yet (per-row, not per-batch atomic)
- review status mutation may be display-only (depends on slice)
- imported patient NHI reveal disabled in MVP (use Profile reveal flow)
- no Cognito patient accounts created during import
- no patient invite/email flow
- no order/fulfilment workflow
- no inventory integration
- /portal/shop and /portal/checkout dormant in 1B (404)
```

## DO NOT (during release)

```text
- skip staging smoke test
- bypass typecheck or build
- deploy on Friday afternoon without a rollback plan
- deploy with an open P1 issue
- deploy without Privacy Officer sign-off if change touches patient data
- deploy data migrations and code changes in the same release without a feature flag
- expose restore or delete from the portal
```
