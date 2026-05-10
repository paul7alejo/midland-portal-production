# /verify
Run verification checks and summarize.
## Commands
```bash
npx tsc --noEmit
npm run build
npm run lint
```
## Output
```
TypeScript:  ✅ pass | ❌ N errors
Build:       ✅ pass | ❌ failed
Lint:        ✅ pass | ⚠️ N warnings
```
## Rules
- Run ALL three
- If any fail, do not commit
- Suggest fix for first error only
