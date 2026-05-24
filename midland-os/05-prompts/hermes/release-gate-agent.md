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
- rg "console\\.log" src
- rg "DeleteItem|UpdateItem" src
- rg "[A-Z]{3}[0-9]{4,5}" src
