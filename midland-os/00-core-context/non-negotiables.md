# Non-Negotiables

> These rules hold in every session, every task, every prompt, every deploy.
> Violating any of them is a release blocker.

## Data handling (HIPC 2020 + Privacy Act 2020)

```text
1.  NHI is never used as a credential.
2.  NHI is masked (ZZZ****) in all UI by default. 30-second reveal in Profile only,
    audit row written BEFORE the reveal renders.
3.  NHI is excluded from every export by default. Opt-in NHI export requires
    written reason; audit row PutItem BEFORE file generation; download is
    single-use, 24h expiring, watermarked.
4.  AES-256-GCM encryption at rest for NHI. Key in AWS Secrets Manager.
    Dev and prod keys separate.
5.  Privacy notice (HIPC Rule 3) above every data collection form.
6.  maskNHI() before any string reaches any logger.
7.  safeLog() — never console.log() — for any patient data.
8.  Real patient data never enters AI tools. Demo accounts only.
```

## Audit & integrity

```text
9.  Audit log is append-only — PutItem only. No UpdateItem, DeleteItem
    for any role, ever. IAM-enforced.
10. Audit row is written BEFORE any sensitive action (NHI reveal, export
    with NHI, on-demand backup, etc.) — not after.
11. Every admin action lands in the audit log with admin id, action,
    reason (where required), and timestamp.
```

## Auth & authorisation

```text
12. Patient login: MSID (MS-XXXXXX) or email — never NHI.
13. Patient pool: no MFA required.
14. Staff pool: MFA required (TOTP).
15. Dev account is_dev: true on every audit log row.
```

## Scope discipline (Phase 1B forbidden until override)

```text
16. No checkout, cart, Stripe, payments deployed.
17. No shop deployed. /portal/shop and /portal/checkout 404 in production.
18. Phase 2 code lives in src/phase2/ — not imported into production routes.
19. No inventory, suppliers, fulfilment automation.
20. No mobile app, PWA, native build.
21. No patient invite flows. No automated patient email. No Cognito patient
    user creation during import.
22. No SSO / Azure AD federation. No Terraform / IaC.
23. No broad AI chatbot or agent features.
24. No portal-driven delete or restore. AWS console only, IAM-protected.
```

## Operational hygiene

```text
25. No fake mask fallback. No fake data anywhere in admin views.
26. No hose or water chamber sales (clinical safety).
27. No Midland Points, referral system, earn/reward mechanics.
28. All patient-facing copy: calm, clinical, simple — never salesy.
```

## Build discipline

```text
29. Surgical edits. No broad rewrites without explicit approval.
30. Every coding task ends with: Files changed / Verification / Risks / Next.
31. npx tsc --noEmit before and after every code change.
32. npm run build before closing any milestone.
33. Feature branch + PR workflow even solo.
```

## Backup & release

```text
34. Backup smoke test is part of every release SOP — verify PITR enabled,
    on-demand backup succeeds, last weekly S3 snapshot exists.
35. Restore documented in release-sop.md but never exposed in portal.
```

## Deletion and data mutation

```text
39. Soft delete is the default for all Midland operational data (notes, records,
    orders, access history). Mark with is_deleted: true, deleted_at, deleted_by,
    deleted_by_email. Do not remove from DynamoDB.
40. Hard delete (DeleteItem) is forbidden for patient records, notes, orders,
    and operational records. Requires Privacy Officer sign-off and documented ADR.
    Hard delete is never exposed through the portal UI.
    Note: Rule 24 ("no portal-driven delete") refers to DynamoDB infrastructure-level
    operations (table delete, restore). Application-level soft delete (UpdateItem)
    is permitted and expected for operational records.
41. Any portal-driven edit or soft-delete action must write a safe audit event
    BEFORE the mutation. Payload: action, patient_msid, record_id, admin_sub,
    admin_email, timestamp. No note body, no NHI, no secrets.
42. Admin notes are owner-only for edit and soft-delete. Ownership = created_by
    (admin Cognito sub). Enforced server-side. Other admins may view but not mutate.
43. Delete confirmation UI must require the admin to type DELETE exactly before
    the action button is enabled. Default action is soft delete.
```

## Legal / compliance posture

```text
44. Do not provide legal or compliance advice as a lawyer.
45. Recommend Privacy Officer review when in doubt.
46. Do not assume responsibility for clinical decisions — surface limitations
    in SOPs and copy.
```
