# Phase 1 Pilot Proof Evidence

## Snapshot

Commit: 17ee720  
Tag: phase-1-pilot-proof  
Secondary tag: phase-1-pilot-proof-v2  
Amplify app: midland-portal-production  
Amplify app ID: d3n1gantisqxbk  
Final deploy job: 154  
Deploy status: SUCCEED  

## Proven Behaviours

- CSV preview validates rows before import.
- Fresh CSV patient import creates the patient record.
- Device and mask details appear in the patient portal.
- Cognito patient portal user is created.
- Temporary password is displayed once.
- Temporary password works without AWS CLI reset.
- Patient is forced to change password on first login.
- Patient lands in the correct portal record.
- Existing database duplicates are detected during preview.
- Re-previewing the same CSV blocks before execution.
- Existing NHI/device duplicates make preflight blocked.
- Execute Import is hidden/disabled when preflight is blocked.
- Execute duplicate skip remains as a final safety net.
- Runtime IAM permission issue was resolved by adding Cognito user management permission to `midland-amplify-role`.

## Final Proof Row

Generated Final Guard Patient  
NHI: masked/minimized in UI  
Machine serial: TEST-538746  
Portal user: created successfully  
Duplicate preview: blocked after import  

## Known Remaining UI Polish

- Machine display currently duplicates brand text in places, e.g. `ResMed ResMed AirSense 10`.
- Entitlement wording should be softened when funding is pending review or set to zero for demo data.
- Admin MSID/login username display should be made consistent.
- Notes wording should clarify whether notes are persistent or temporary.
- Patient-facing Request Supplies should use softer wording than “Entitlement exhausted” for pending-review/demo states.

## Explicitly Out of Scope For This Proof

- Bulk patient invite management
- Email/SMS invite delivery
- Password reset admin workflow
- Checkout/payment
- Inventory fulfilment
- Full audit dashboard
- Multi-clinic tenancy
- Clinical decision automation
