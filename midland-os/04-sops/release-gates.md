# Release Gates — Midland Sleep Portal

> Phase 2A and forward. For Phase 1B release detail see `release-sop.md` and `../01-clinic-operations/release-workflow.md`.
> This file defines the environment ladder and the minimum gate that every code change must clear before advancing.

---

## Environment Ladder

```
Local → Feature/Dev Branch → Staging → Controlled Pilot → Production
```

| Environment | Purpose | Data | Promotes to |
|---|---|---|---|
| **Local** | Development and verification | Demo/fake data only | Feature branch |
| **Feature/Dev Branch** | Peer review, gate checks | Demo/fake data only | Staging |
| **Staging** | Integration smoke test, stakeholder preview | Demo/fake data only | Controlled pilot |
| **Controlled Pilot** | Monitored real-world use, 1–3 admins, 10–50 records | Controlled real data (Privacy Officer sign-off) | Production |
| **Production** | Live clinic operations | Real patient data | — |

### Staging rules (non-negotiable)

- Staging must use demo/fake data only. Never point staging at the production DynamoDB table.
- The staging `NEXT_PUBLIC_APP_ENV` environment variable must be set to `staging`.
- The staging Amplify environment must use separate Cognito pools and DynamoDB tables (or a mock layer).
- Any result, screenshot, or output from staging must be clearly labelled "staging / demo" before sharing.

---

## Gate 1 — Pre-Merge (every PR on phase-2a-admin-ops → main)

Run these locally before opening a PR. All three must pass:

```bash
git status --short        # must be clean (or all changes intentionally staged)
npx tsc --noEmit          # zero errors
npm run build             # build succeeds
```

If any fail: fix before merging. Do not force-merge around a failing typecheck.

---

## Gate 2 — Browser Smoke Check (staging, after every merge to main)

Open the admin portal in a real browser. Work through this list in order:

### Auth
- [ ] Admin login succeeds for an authorised admin
- [ ] Unauthorized access redirects or returns 401

### Patients worklist (`/admin/patients`)
- [ ] Page loads, KPI cards show correct counts
- [ ] Total Patients, Pending Review, Needs Outreach, Safety Checks Due KPI cards are all clickable
- [ ] Each worklist mode filters the table correctly
- [ ] Search by name and MSID works

### Patient drawer
- [ ] Drawer opens for an imported patient
- [ ] Overview tab loads: review cues, review action, outreach flag, admin caution section
- [ ] Equipment, NHI, Portal Account, Notes tabs each load without error

### Notes
- [ ] Add a note — saves and appears in list
- [ ] Edit a note (owner-only)
- [ ] Delete a note — requires typing DELETE to confirm
- [ ] Non-owner cannot edit or delete another admin's note

### Needs Outreach
- [ ] Mark a patient as needing outreach — badge appears in table row
- [ ] Clear outreach flag — badge disappears
- [ ] Patient appears in / leaves Needs Outreach worklist immediately

### Safety Checks (Admin Caution)
- [ ] Mark a patient for safety check — badge appears, patient enters Safety Checks worklist
- [ ] Edit details: reason, severity chip, due date, assigned to save and display
- [ ] Clear safety check with optional resolution note — patient leaves Safety Checks worklist
- [ ] Safety Checks Due KPI count updates correctly

### Portal Accounts (`/admin/portal-accounts`)
- [ ] Page loads and lists portal accounts
- [ ] Account drawer opens for a patient
- [ ] Password reset action is visible

### Import (`/admin/import`)
- [ ] Import preview page loads
- [ ] Dry-run validates a known-good CSV without writing records
- [ ] If any import code was touched in this release: full import smoke test required (see `import-sop.md`)

### Privacy and safety
- [ ] No raw NHI visible in any patient-facing UI or admin export
- [ ] No patient data in browser console logs
- [ ] Staging banner is visible ("STAGING — Demo data only")
- [ ] Staging banner does not appear in production

---

## Gate 3 — Controlled Pilot Limits

Before enabling any real patient records:

- Maximum 1–3 named Midland admin users
- Maximum 10–50 real patient records in the first batch
- Manual monitoring for the first 48 hours (CloudWatch + admin confirms actions look correct)
- Known limitations communicated to the pilot users in writing before access is granted
- Privacy Officer sign-off documented (name + date)
- Rollback owner named and reachable

Promote to full production only after the pilot period completes without incident.

---

## Gate 4 — Production Release (merge feature branch → main)

All of Gate 1 + Gate 2 must be complete. Additionally:

- [ ] No open P1 (data exposure, auth bypass, import corruption) issues
- [ ] PITR enabled on all DynamoDB tables (verify in AWS console)
- [ ] CloudWatch alarms green for the last 24 hours
- [ ] Known limitations written in release notes
- [ ] `midland-os/state.md` updated with the new sprint/feature status
- [ ] Git tag applied after merge (`git tag v2a-YYYY-MM-DD` pattern)

---

## Quick Reference — Phase 2A Sprint Features to Gate

| Sprint | Feature | Key smoke check |
|---|---|---|
| 4B | Review status filter | Pending Review / All / Reviewed worklist modes |
| 4C | Needs Outreach flag | Flag, badge, worklist, activity entry |
| 4D | Clickable KPI worklist cards | All 4 KPI cards clickable and filter correctly |
| 5A | Safety check flag | Mark/clear, KPI count, badge, worklist |
| 5B | Safety check detail fields | Reason, severity, due date, assigned to, resolve note |

---

## References

- Phase 1B release detail: `04-sops/release-sop.md`
- Full deployment runbook: `03-technical/deployment-runbook.md`
- Release workflow: `01-clinic-operations/release-workflow.md`
- CI/CD: `03-technical/cicd.md`
- Known limitations: `06-memory/known-limitations.md`
- Risks: `06-memory/risks.md`
