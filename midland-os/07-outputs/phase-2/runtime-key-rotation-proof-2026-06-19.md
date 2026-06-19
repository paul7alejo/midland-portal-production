# Runtime IAM Access Key Rotation Proof — 2026-06-19

## Purpose
Rotate the exposed Midland runtime AWS access key pair used by the Amplify `phase-2a-admin-ops` branch.

## Scope
Rotated:
- `MIDLAND_ACCESS_KEY_ID`
- `MIDLAND_SECRET_ACCESS_KEY`

Not rotated:
- `NHI_ENCRYPTION_KEY`
- `NHI_HASH_SALT`

Reason: NHI encryption/hash values are data-handling secrets and require migration planning before rotation.

## IAM User
- `midland-phase2a-runtime`

## Rotation Summary
- Old runtime key was identified from the Amplify branch environment.
- New runtime key was created for `midland-phase2a-runtime`.
- Amplify branch environment variables were updated to the new key.
- Amplify branch was redeployed.
- Redeploy succeeded: Job 228 `SUCCEED`.
- Protected API checks returned expected 401 responses, not 500/runtime credential errors.
- Browser smoke test passed after old key was disabled.
- Old key was deleted.
- Final IAM access key list shows only the new active key remains.

## Verification
- Amplify Job 228: `SUCCEED`
- `/api/admin/notices`: returned expected unauthenticated 401
- `/api/patient/notices`: returned expected unauthenticated 401
- Admin notices page loaded after old key disabled
- Patient dashboard loaded after old key disabled
- Patient notices/dashboard card loaded after old key disabled

## Safety Notes
- No raw NHI was exposed.
- No secret values are recorded in this document.
- Screenshots used for internal proof must not be used publicly unless sanitized.
