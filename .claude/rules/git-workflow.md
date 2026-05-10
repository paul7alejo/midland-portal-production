# Git Workflow Rules

## Branching
Feature branch + PR even solo. Never commit directly to main.

## Branch naming
```
docs/day-30-midland-os-pack
feat/admin-export-bridge
fix/drawer-spacing
refactor/import-parser
chore/update-deps
ops/cloudwatch-alarms
```

## Commit messages
Conventional commits: `<type>(<scope>): <description>`
Types: feat, fix, docs, refactor, chore, test, ops
One line, < 72 chars, imperative mood, no period.

## Before push
```bash
git status          # clean
npx tsc --noEmit    # pass
npm run build       # pass
```

## PR workflow
1. Create branch from main
2. Make changes, verify locally
3. Push branch
4. Open PR to main
5. Self-review the diff
6. Merge (squash preferred for clean history)
7. Delete branch

## What never gets committed
- .env.local (gitignored)
- node_modules (gitignored)
- Real patient data
- Secrets, API keys, passwords
- NHI values (even encrypted ones in test fixtures)
