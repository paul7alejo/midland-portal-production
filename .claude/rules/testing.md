# Testing Rules

## Phase 1B minimum (do not overbuild)
- TypeScript strict mode: npx tsc --noEmit
- Build verification: npm run build
- Lint: npm run lint
- Manual smoke test per release (staging then prod)

## Smoke test checklist (every release)
- Admin login + MFA works
- Patient login (demo MS-238872) works
- Dashboard renders
- Import dry-run works
- Import execute works
- Admin patient list renders
- Drawer opens
- No raw NHI visible
- Export runs (NHI excluded verified)
- Backup smoke test passes (Rule 18)
- AWS state visibility panel renders
- /portal/shop returns 404
- /portal/checkout returns 404

## What we do NOT build in Phase 1B
- Unit test suite (nice-to-have but not blocking go-live)
- Integration tests (Playwright is Week 3 Day 15 target — stretch)
- E2E test pipeline
- Load testing (traffic is negligible at this scale)
- Security penetration testing (manual review is sufficient for Phase 1)

## Phase 2+ testing improvements
- Playwright for import/export/admin flows
- API integration tests for critical paths
- Automated security scan in CI
- Load testing before multi-clinic deployment
