# Deployment Runbook

> Step-by-step for deploying to production. Read this end-to-end before every production deploy.

## Pre-deploy

```text
[ ] Confirm staging is green (last 24h)
[ ] Confirm no open P1 issues
[ ] Confirm Privacy Officer sign-off is current (annual + after material changes)
[ ] Confirm last weekly backup snapshot succeeded
[ ] Confirm CloudWatch alarms are green
[ ] Confirm the change set scope is documented in decision-log.md
```

## Step 1 — Local verification

```bash
git status                    # must be clean
git pull --rebase             # latest main
npx tsc --noEmit              # must pass
npm run build                 # must pass
npm run lint                  # must pass
```

## Step 2 — Create release branch (or PR)

```bash
git checkout -b release/v0.XX
git push origin release/v0.XX
# open PR to main, self-review the diff
```

## Step 3 — Smoke test on staging

Staging URL: configured in Amplify console.

```text
[ ] admin login + MFA works
[ ] patient login (demo MS-238872 / Demo@1234!) works
[ ] dashboard renders without errors
[ ] equipment page renders
[ ] reorder request submission works (audit row written)
[ ] admin patient list opens
[ ] drawer opens for an imported patient
[ ] export imported patients CSV runs (NHI excluded — open the file and check)
[ ] export with NHI opt-in: reason field required, audit row written before file
[ ] on-demand backup endpoint runs (confirm via DynamoDB describe-backup)
[ ] AWS state visibility panel renders
[ ] /portal/shop returns 404
[ ] /portal/checkout returns 404
[ ] no NHI in any URL
[ ] no console.log of patient data (open browser console; it should be quiet)
```

## Step 4 — Merge + deploy

```text
[ ] merge release branch to main
[ ] Amplify auto-deploys to prod
[ ] watch the build log for errors
[ ] watch CloudWatch for any alarm in the first 10 min
```

## Step 5 — Post-deploy smoke test (production)

Production URL: portal.midlandsleep.co.nz (or as configured).

```text
[ ] admin login works
[ ] patient login works
[ ] one read-only patient page renders correctly
[ ] no 5xx errors in CloudWatch
[ ] WAF metrics look normal
[ ] backup status panel reads correctly
```

## Step 6 — Tag the release

```bash
git tag v0.XX
git push --tags
```

Update `02-product/release-notes.md` with the user-facing summary.

## Rollback

If a smoke test fails or a CloudWatch alarm fires within 30 minutes of deploy:

```text
1. In Amplify console → Hosting environments → choose previous successful deploy → Redeploy this version
2. Notify Midland (email + phone if P1)
3. Open an incident note in 06-memory/risks.md
4. Investigate locally, do not push another deploy until root cause is documented
5. If patient data may have been affected, contact Midland Privacy Officer same day
```

## DO NOT (during deploy)

```text
- skip the staging smoke test
- bypass the typecheck or build
- deploy on Friday afternoon without a stated rollback plan
- deploy with an open P1 issue
- deploy without Privacy Officer sign-off if the change touches patient data
- deploy data migrations and code changes in the same release without a feature flag
```

## Restore (Rule 17 — AWS console only)

Restore is NOT exposed in the portal. If a restore is required:

```text
1. Open an incident in 06-memory/risks.md
2. Notify Midland clinical lead + Privacy Officer
3. Use AWS console:
   - DynamoDB → Backups → choose backup → Restore to new table
   - Validate restored table contents
   - Use scripted swap to repoint application or restore individual records
4. Audit row written manually with action: MANUAL_RESTORE, reason, who, when
5. Post-incident review: update known-limitations.md and learnings.md
```
