# Patient / Portal Account / Order Reconciliation
**Midland Sleep — Phase 2 Admin Portal**
**Date:** 2 June 2026
**Status:** Read-only analysis. No data was modified.

---

## Purpose

This report explains the relationship between the three operational data sources visible in the
admin portal, and why their counts differ. It is intended for internal review before the Midland
presentation and for ongoing data quality monitoring.

---

## Live counts (as observed from admin dashboard — 2 June 2026)

| Source | Total | Sub-counts |
|---|---|---|
| **Patients** | 41 | 37 pending review · 2 needs outreach · 4 safety checks due · 0 eligible now |
| **Portal Accounts** | 29 | 14 password changed · 15 temp password · 0 locked |
| **Orders / Requests** | (run diagnostic — see below) | — |

> Patients and Orders counts are from DynamoDB. Portal Accounts are from the Cognito User Pool.
> Orders exact cross-reference counts require the diagnostic script (see §8).

---

## 1. Total patients

**41** patients in the DynamoDB `midland-sleep-patients` table (`sk = 'PROFILE'`, `org_id = 'midland-sleep'`).

All 41 are real imported records. Demo patients are disabled in the Patients page
(`SHOW_DEMO_PATIENTS = false`). The count matches `GET /api/admin/patients → patients.length`.

---

## 2. Total portal accounts

**29** accounts in the Cognito User Pool with a `custom:msid` attribute.

The count matches `GET /api/admin/portal-accounts → accounts.length`. These are real patient
portal logins. The portal is opt-in; not every patient in the register has a portal account.

---

## 3. Total orders / requests

Counts are returned by `GET /api/admin/orders`. The Orders page shows the full list including
`admin_created` rows. Real (non-admin) request count is `orders.filter(o => source !== 'admin_created')`.

For exact current count, run the diagnostic script (§8).

---

## 4. Patients with portal accounts

**Expected: 29** (all Cognito accounts should have a matching patient record).

Portal accounts are only created through the Admin → Portal Accounts flow, which requires staff to
select a patient from the register first. The creation path always writes `custom:msid` equal to
`patient.portal_id`. Therefore, every portal account _should_ have a matching patient record.

If the diagnostic script reports any portal accounts without a patient record, that indicates:
- A test/demo account created directly in Cognito outside the portal workflow, OR
- A patient record that was hard-deleted (violates ADR-011 soft-delete policy).

---

## 5. Patients without portal accounts

**Expected: 12** (41 patients − 29 portal accounts = 12 without accounts).

This is **expected and normal behaviour**. Portal onboarding is opt-in and manual:

1. Patient is imported from the CSV register into DynamoDB.
2. Staff reviews the patient record (review_status: `pending_review → reviewed`).
3. If the patient wants portal access, staff creates a Cognito account via Portal Accounts page.
4. Patient receives an invite and sets their password.

Patients at step 1–2 have no portal account yet. The 12-patient gap represents patients who are
in the register but have not yet been onboarded to the portal. This gap is expected to shrink as
more patients are onboarded over time.

**This is not a data error.**

---

## 6. Portal accounts without patient record

**Expected: 0** in production.

Should be verified by running the diagnostic script. If any appear, they are likely:
- Test accounts created directly in Cognito by a developer.
- Accounts where the patient's MSID was entered incorrectly.

These would show up in the Orders page as orders with `portalAccountStatus: 'linked'` but no
patient record in the Patients page. Action required if found (see §12).

---

## 7. Orders with matching patient record

An order matches a patient when `order.patient_msid === patient.portal_id` (MSID comparison,
case-insensitive). Most real orders placed through the patient portal should have a match, since
patients can only order if they have a portal account (which requires a patient record).

Admin-created orders (`source: 'admin_created'`) are excluded from the operational KPI counts;
they represent staff-submitted requests and may or may not match a patient in the register.

For exact counts, run the diagnostic script.

---

## 8. Orders missing patient record

An order is missing a patient record when its `patient_msid` does not appear in the patients table.
This can occur in these scenarios:

| Scenario | Expected? | Action |
|---|---|---|
| `source: 'admin_created'` orders with a staff-invented MSID | Yes — test/admin use | No action needed |
| Legacy orders placed before the patient import | Possible | Review individually |
| Orders from patients whose DynamoDB record was accidentally hard-deleted | Not expected | Investigate and re-import |
| Typo in MSID during portal account creation | Not expected | Correct in Cognito |

For exact counts and MSID list, run the diagnostic script.

---

## 9. Orders with linked portal account

An order has a linked portal account when `order.patient_msid === account.msid`.
In the Orders page this is shown as `portalAccountStatus: 'linked'`.

All orders from `source: 'patient_portal'` should have a linked portal account (the patient had
to be logged in to place the order). Support requests and admin-created orders may not.

---

## 10. Orders without portal account

Orders where `portalAccountStatus: 'no_account'`. Expected for:
- `source: 'admin_created'` — staff placed the order on behalf of a patient
- `source: 'support_request'` — submitted via phone or other channel
- Orders from patients who have since had their portal account removed

These are not errors. They simply reflect that the patient does not have (or no longer has) a
portal login.

---

## 11. Notes: expected mismatches vs data quality issues

### Expected and normal

| Mismatch | Reason |
|---|---|
| 41 patients, 29 portal accounts | Portal is opt-in. 12 patients not yet onboarded — normal. |
| 15 accounts with temp password | Patients invited but haven't changed their password yet — expected for new onboardings. |
| 37 patients still pending review | Patient register was recently imported; staff are working through reviews — expected. |
| Admin-created orders not counted in real order totals | Correct by design — `isAdminRow()` excludes them from operational KPIs. |
| Orders without a portal account link | Many orders are staff-submitted or phone-based — expected. |
| `DEMO_REQUESTS` (4 hardcoded orders) | Only render if the Orders API returns zero real orders. Should never appear in production. |

### Needs monitoring

| Mismatch | Risk | Recommended check |
|---|---|---|
| Portal account with no matching patient record | Low–Medium | Run diagnostic; if found, trace MSID to determine origin |
| Real order with MSID not in patient register | Low–Medium | Run diagnostic; check if MSID is a test/typo |
| Patients with `safety_check_required = true` not assigned to a staff member | Medium | Check `safety_assigned_to` field; unassigned safety checks should have an owner |

### Not a concern

- The 41 vs 29 count difference is not a bug. It is structural.
- The 15 temp-password accounts are not lost invites — they represent patients who received the
  invite email but have not yet activated their account.

---

## 12. Recommended next actions

### Immediate (before Midland presentation)

1. **Run the diagnostic script** to populate exact cross-reference counts and confirm no
   unexpected portal accounts exist without patient records.

2. **Review the 2 patients flagged `needs_outreach`** on the Patients page — ensure they are
   assigned and actively being followed up.

3. **Review the 4 patients flagged `safety_check_required`** — confirm each has a staff member
   assigned (`safety_assigned_to`) and a due date set.

4. **Confirm the 15 temp-password accounts** are expected invites (recently onboarded patients
   who haven't logged in yet). No action if they are recent; follow up if older than 2 weeks.

### Post-presentation

5. **Work through the 37 pending-review patients** — the goal is to move these to `reviewed`
   status as staff validate each imported record.

6. **Onboard the remaining 12 patients** who do not have portal accounts, as appropriate.

7. **Monitor orders cross-reference** — as portal adoption grows, the proportion of orders with
   a linked portal account should increase.

---

## Data sources (read-only)

| Source | Route | Backing store |
|---|---|---|
| Patients | `GET /api/admin/patients` | DynamoDB `midland-sleep-patients` (scan, sk = PROFILE) |
| Portal Accounts | `GET /api/admin/portal-accounts` | Cognito User Pool (`custom:msid` attribute) |
| Orders | `GET /api/admin/orders` | DynamoDB orders table (scan, org_id = midland-sleep) |

### Linking keys

```
patient.portal_id  (e.g. "MS-238872")
  = account.msid   (Cognito custom:msid)
  = order.patient_msid (orders table field)
```

All three use the same MSID format (`MS-` prefix + digits). Comparison is case-insensitive.
The `patient_id` (internal DynamoDB UUID) is separate from the MSID and is not used for
cross-system linking.

---

## Running the diagnostic script

The companion script at `scripts/diagnostics/reconcile.mjs` calls all three APIs and prints
exact cross-reference counts. It is read-only.

**Requirements:** a running admin portal with a valid session cookie.

```bash
# Start dev server
npm run dev

# In a separate terminal — paste the session cookie from the browser DevTools
ADMIN_COOKIE="midland.session=<paste-cookie-here>" \
  node scripts/diagnostics/reconcile.mjs
```

The script outputs:
- Patient sub-counts
- Portal account sub-counts
- Order status breakdown
- Cross-reference: patients with/without accounts
- Cross-reference: orders with/without patient record and portal account
- Any orphaned portal accounts (accounts with no patient match)
- Any real orders whose MSID doesn't appear in the patient register

---

*This document is read-only. No data was modified in its preparation.*
*Generated from code analysis of `src/app/api/admin/patients/route.ts`,*
*`src/app/api/admin/portal-accounts/route.ts`, `src/app/api/admin/orders/route.ts`,*
*`src/lib/aws/dynamodb.ts`, and `src/lib/aws/cognito-admin.ts`.*
