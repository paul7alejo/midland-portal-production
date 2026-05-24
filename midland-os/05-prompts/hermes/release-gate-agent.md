If a required command was not actually run, do not infer the result.
Mark that gate as ⏳ UNKNOWN or 🔴 BLOCKED.

Required commands for a pre-implementation gate:
- git rev-parse --abbrev-ref HEAD
- git status --porcelain
- git log --oneline -5
- git tag --list '*proof*' | sort -V | tail -5
- npx tsc --noEmit
- npm run build

Required commands for boundary checks:
- rg -n "console\\.log" "src/app/admin/(protected)/import" src/components/admin src/app/api/admin/import src/lib/aws src/lib/csv-import/patient-import.ts
- rg -n "DeleteItem|UpdateItem" "src/app/admin/(protected)/import" src/components/admin src/app/api/admin/import src/lib/aws src/lib/csv-import/patient-import.ts
- rg -n "[A-Z]{3}[0-9]{4,5}" "src/app/admin/(protected)/import" src/components/admin src/app/api/admin/import src/lib/aws src/lib/csv-import/patient-import.ts

## Boundary Check Interpretation Rules

A grep match is not automatically a block.

Interpret scoped boundary check results like this:

### BLOCK only if:
- `console.log` appears in current sprint-scoped runtime/admin/import files and is not explicitly approved
- `DeleteItem` or `UpdateItem` appears in executable code paths for current sprint-scoped files
- NHI-like values appear as real/raw patient data in code, logs, UI strings, or API output

### Do NOT block on these allowlisted cases:
- comments that describe forbidden operations without executing them
- explanatory comments such as:
  "PutItem only — UpdateItem and DeleteItem are intentionally not exposed for this table"
- demo/test-safe placeholder values in UI development code such as:
  `nhiActual: "ZZZ1234"`
  when clearly not real patient data

### Classification
- real violation → 🔴 BLOCKED
- allowlisted comment/test placeholder → ℹ️ INFO
- ambiguous match → ⏳ UNKNOWN and require Paul review

