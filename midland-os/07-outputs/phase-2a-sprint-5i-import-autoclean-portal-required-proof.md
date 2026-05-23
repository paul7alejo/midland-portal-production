# Phase 2A Sprint 5I Proof — Import Auto-Clean + Portal Required Rule

## Status
Implemented, deployed, and browser-tested.

## Deployed Commits
- 059036b ui: add import auto-clean candidate csv
- 6c2105b fix: improve import auto-clean normalization
- 8853ea48 fix: require portal access for patient import

## What Changed
- Added Auto-clean candidate CSV download in Import Validate step.
- Auto-clean normalizes safe formatting only:
  - whitespace
  - unambiguous dates
  - funded_by casing
  - portal access yes/no to true/false
  - machine/mask brand/model casing
  - mask size casing
- Portal access is now required for main patient import.
- Rows with portal access disabled are blocked before execution.
- Review & Approve now expects valid patients and portal accounts to match.

## Browser Proof
- Messy CSV was cleaned into a candidate CSV.
- Cleaned CSV re-uploaded and validated.
- true/true import created 2 patients and 2 portal accounts.
- Temporary passwords shown once only.
- true/false import was blocked before execution.
- Blocked row showed portal-access-required error.
- Preflight, approval, and risk report were blocked.
- Execute Import was unavailable when portal access was disabled.
- NHI remained masked.
- Auto-clean did not silently convert false to true.

## Explicitly Not Changed
- No auto-import.
- No silent false-to-true conversion.
- No Cognito internals changed.
- No DynamoDB core write logic changed.
- No NHI encryption/hash/reveal logic changed.
- No rollback backend implemented.

## Future Sprint
Sprint 5J — Persistent Import Batch History & Evidence Pack:
- friendly clickable import IDs
- persistent batch metadata
- downloadable preflight/approval/risk/manifest/original/cleaned/error reports
- recovery/rollback placeholder only
