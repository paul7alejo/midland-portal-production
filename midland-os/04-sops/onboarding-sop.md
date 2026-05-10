# Onboarding SOP

> How a new admin user (or, eventually, a new clinic) gets onto the portal safely.

## Admin user onboarding (Phase 1B)

### Preconditions

```text
[ ] Midland clinical lead has named the new admin
[ ] Privacy Officer awareness (no formal sign-off needed for additional admins)
[ ] Email confirmed (corporate domain)
[ ] Phone confirmed (for MFA fallback if TOTP locked out)
```

### Steps

```text
1. Paul creates Cognito staff-pool user with role: admin, org_id: midland
2. Forced password change on first login
3. MFA TOTP enrolment required (Google Authenticator / 1Password)
4. Walkthrough call (30 min)
   - patient list, drawer, review actions
   - exports (4 types) — practice with demo batch
   - on-demand backup with reason
   - AWS state visibility panel
   - escalation paths
5. Sandbox session: new admin runs an export on demo data
6. Audit row spot-check: confirm new admin's actions appear in audit log
7. New admin reads admin-review-sop.md + non-negotiables.md
8. Sign-in to /admin/profile, set display name + contact
```

### What new admins must understand before independent use

```text
- NHI is masked by default
- NHI reveal requires a written reason and is audit-logged
- Exports exclude NHI by default; opt-in needs reason + audit
- They cannot delete or restore via portal (Rule 17)
- /portal/shop and /portal/checkout don't exist in production yet
- Calling Midland is sometimes the right answer (e.g. "supplies exhausted")
```

### Off-boarding admins

```text
[ ] Cognito user disabled (not deleted — audit trail preserved)
[ ] role attribute set to "disabled"
[ ] active sessions invalidated
[ ] notification to remaining admins
[ ] audit row written: ADMIN_OFFBOARD with reason
```

---

## Patient onboarding (NOT in Phase 1B)

```text
Phase 1B   patients are imported via controlled import; Cognito user is
           NOT auto-created. Midland's existing process invites patients.
           Patients self-register or are provisioned manually as they ask.

Phase 2    patient invitation flow + Cognito user provisioning
```

### Self-registration (basic Phase 1B)

```text
[ ] /register collects email + DOB + MSID
[ ] system matches against patients table
[ ] if match: send confirmation email, create Cognito user
[ ] if no match: silent no-op (do not confirm/deny existence — privacy)
[ ] privacy notice above form (HIPC Rule 3)
[ ] no NHI asked
```

---

## New clinic onboarding (Phase 6 — out of scope)

```text
Phase 6    multi-clinic playbook lives in
           oneofzero-os/03-productization/clinic-implementation-playbook.md
```

---

## Records

```text
- Admin onboarding event             audit log row (ADMIN_ONBOARD)
- Walkthrough date                   note in 06-memory/weekly-summary.md
- Sandbox export run                 captured automatically in audit
- Off-boarding event                 audit log row (ADMIN_OFFBOARD)
```
