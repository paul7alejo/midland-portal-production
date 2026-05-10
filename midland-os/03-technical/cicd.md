# CI / CD

## Phase 1B minimum (do not overbuild)

```text
GitHub main branch
  → GitHub Actions quality gate
    - typecheck (npx tsc --noEmit)
    - build (npm run build)
    - lint (eslint)
    - basic security scan (no real patient data in repo)
  → Amplify auto-deploy on merge to main
  → production smoke test post-deploy
```

## Local verification before push

```bash
git status
npx tsc --noEmit
npm run build
```

If any of those fail, do not push. Fix locally first.

## Branching workflow

Feature branch + PR even solo. Reasons: it forces the surgical-edit discipline, it makes the audit trail clean, and it sets up the multi-clinic future.

```bash
# docs change
git checkout -b docs/day-30-midland-os-pack
git add midland-os/
git commit -m "docs: add Midland OS production rehearsal pack"
git push origin docs/day-30-midland-os-pack
# open PR to main, self-review, merge

# code change
git checkout -b feat/admin-export-bridge
npx tsc --noEmit
npm run build
git add -A
git commit -m "feat: add admin imported-patients CSV export"
git push origin feat/admin-export-bridge
# open PR, self-review, merge → Amplify deploys
```

## Commit message convention

```text
docs:     documentation-only changes
feat:     a new user-facing feature
fix:      a bug fix
refactor: code change without behavior change
chore:    tooling, deps, build config
test:     test-only changes
ops:      AWS / infra / IAM / CI changes
```

## Environment management

```text
local      .env.local (gitignored), no real patient data
staging    Amplify environment, demo accounts only
prod       Amplify environment, real patient data after Privacy Officer sign-off
```

## Deployment checklist

```text
[ ] repo clean
[ ] typecheck passes
[ ] build passes
[ ] env vars confirmed in Amplify console
[ ] auth smoke test (admin login + MFA + patient login)
[ ] import dry-run smoke test
[ ] controlled execute smoke test using demo data
[ ] imported patient visible in admin
[ ] drawer opens
[ ] export path works (NHI excluded by default)
[ ] backup smoke test (PITR enabled, on-demand works, last weekly snapshot present)
[ ] AWS state visibility panel reads cleanly
[ ] CloudWatch logs checked
[ ] known limitations updated
```

## What NOT to add before June 30

```text
- Terraform rewrite
- multi-account AWS design
- event-driven queues unless already necessary
- SES patient email automation
- Stripe / checkout pipeline
- inventory / supplier integrations
- native mobile app pipeline
```

## Future CI / CD (post go-live)

```text
- staging vs prod environment discipline
- automated tests for import parser/validator
- release checklist PR template
- CloudWatch alarm tuning per real traffic patterns
- backup / export verification automation
- IaC gradually (Terraform Months 5–6)
- security review cadence
- multi-clinic terraform workspace setup (Phase 6)
```
