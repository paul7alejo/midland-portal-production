# codex-task-template.md
# Copy this template for every Codex session
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz

---

## When to use Codex vs Claude Code

```
Use Codex for:
  - local repo inspection (grep, find, read)
  - surgical TypeScript fixes
  - running typecheck / build commands
  - small refactors (rename, extract function, fix imports)
  - test/debug cycles
  - reading and summarising existing files

Use Claude Code for:
  - file-scoped implementation (new components, routes, API handlers)
  - UI polish and admin table/drawer fixes
  - security / compliance / entitlement logic
  - documentation generation
  - larger multi-file tasks
```

---

## Codex Session Template

```text
Context:
  Midland Sleep portal — Phase 1B production.
  Repo context file: midland-os/00-core-context/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
  Do not touch forbidden files (see Section 6 of context pack).

Task:
  [One sentence — what needs to be done]

Files to inspect / modify:
  [List exact paths]

Forbidden files (do not touch):
  src/app/portal/checkout/
  src/app/portal/shop/
  src/phase2/
  auth / middleware (unless explicitly in scope)

Requirements:
  [numbered, specific]

Verification:
  npx tsc --noEmit
  [npm run build if routes/UI changed]

Output format:
  Files changed:
  Verification result:
  Risks / notes:
  Next step:
```

---

## Quick Inspection Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Find files referencing NHI (check for raw NHI exposure)
grep -r "nhi" src/ --include="*.ts" --include="*.tsx" -l

# Find console.log in patient-related code (should be safeLog)
grep -r "console.log" src/app/admin/ src/app/portal/ --include="*.ts" --include="*.tsx"

# Check for Stripe keys accidentally left in (should be zero)
grep -r "STRIPE" src/ --include="*.ts" --include="*.tsx" --include="*.env*"

# Find routes that might expose shop/checkout
grep -r "shop\|checkout" src/app/ --include="*.ts" --include="*.tsx" -l

# Verify audit table only uses PutItem
grep -r "UpdateItem\|DeleteItem" src/ --include="*.ts" --include="*.tsx" | grep -i "audit"

# Build check
npm run build 2>&1 | tail -20
```
