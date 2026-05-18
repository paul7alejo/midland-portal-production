# Phase 1 Pilot Proof Evidence

## Snapshot

Commit: 17ee720  
Tag: phase-1-pilot-proof  
Secondary tag: phase-1-pilot-proof-v2  
Amplify app: midland-portal-production  
Amplify app ID: d3n1gantisqxbk  
Final deploy job: 154  
Deploy status: SUCCEED  

## Evidence Screenshots

- 01-import-success-temp-password.png
- 02-patient-dashboard-login-success.png
- 03-patient-equipment-visible.png
- 04-duplicate-preview-blocked.png
- 05-admin-patient-list.png
- 06-admin-drawer-overview.png
- 07-admin-drawer-equipment.png
- 08-nhi-hidden-mvp.png

## Proven Behaviours

- Fresh CSV patient import works.
- Patient/device/mask records are created.
- Cognito patient portal user is created.
- Temporary password is displayed once.
- Temporary password works without AWS CLI reset.
- Patient is forced to change password on first login.
- Patient lands in the correct portal record.
- Patient equipment is visible.
- Existing database duplicates are detected during preview.
- Duplicate CSV blocks before execution.
- Execute Import is hidden/disabled when preflight is blocked.
- Execute duplicate skip remains as a final safety net.
- Runtime IAM permissions were fixed through `midland-amplify-role`.
- NHI is not revealed in the MVP admin/patient interface.

## Final Boundary

This proof does not include checkout, inventory fulfilment, email/SMS invite delivery, admin password reset, bulk access management, full audit dashboard, or multi-clinic SaaS tenancy.

Those are future paid phases.
