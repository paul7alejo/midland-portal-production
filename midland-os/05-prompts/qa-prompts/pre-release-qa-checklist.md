# pre-release-qa-checklist.md
# Run before every production deployment
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz

---

## Code Quality

```
[ ] npx tsc --noEmit — passes (zero errors)
[ ] npm run build — passes (no build errors)
[ ] git status — clean (no uncommitted changes)
[ ] No console.log for patient data (safeLog only)
[ ] No raw NHI in any log statement (maskNHI used)
[ ] No STRIPE_* env vars in production
[ ] shop/checkout routes return 404
[ ] src/phase2/ not imported into any production route
```

---

## Authentication

```
[ ] Patient login (MSID or email) works — try MS-238872 / Demo@1234!
[ ] Admin login (email + MFA) works — try admin@midlandsleep.co.nz / Admin@secure1!
[ ] NHI not accepted as login credential
[ ] Unauthenticated /portal/* → redirect to /login
[ ] Unauthenticated /admin/* → redirect to /login
[ ] Patient cannot access /admin/* routes
```

---

## Import Flow

```
[ ] Dry-run with test CSV — returns expected preview counts
[ ] Execute import with valid CSV — returns created/skipped/failed counts
[ ] Duplicate NHI → skipped with reason
[ ] Duplicate serial → skipped with reason
[ ] Missing mask patient → "Not recorded" shown (no fake data)
[ ] Imported patients appear in /admin/patients
[ ] Patient drawer opens and shows correct data
[ ] No raw NHI returned in any API response
[ ] Audit row written for import approval
```

---

## Admin Data Operations

```
[ ] Export imported patients CSV — downloads successfully
[ ] Export CSV has no NHI column (default)
[ ] NHI opt-in export: reason field required before file generated
[ ] Audit row written BEFORE download link returned
[ ] Download link single-use / 24h expiry
[ ] AWS state visibility panel — loads table record counts
[ ] On-demand backup — triggers and returns success status
[ ] Backup status panel — shows last successful backup
[ ] No delete/restore operations exposed in portal UI
```

---

## NHI Reveal

```
[ ] NHI shows as ZZZ**** by default in all views
[ ] Reveal button in Profile and admin drawer works
[ ] Audit row written BEFORE NHI is revealed
[ ] 30-second auto-hide works
[ ] NHI re-masks after 30 seconds
[ ] No raw NHI in network responses outside reveal endpoint
```

---

## Patient Portal

```
[ ] /portal/dashboard — loads for all 3 demo patients
[ ] /portal/equipment — shows correct machine/mask for each patient
[ ] Paul Moreno: AirSense 11 + AirFit F30i Small + ✅ CAN REORDER
[ ] Sarah Kim: SleepStyle 650 + F&P Eson 2 Medium + ⏳ NOT YET (Nov 2026)
[ ] Richard O'Brien: AirSense 10 + Mirage FX Large + ✅ CAN REORDER
[ ] Entitlement shows YES/NO — never a dollar amount
[ ] /portal/shop → 404
[ ] /portal/checkout → 404
[ ] No water chamber or hose products visible
```

---

## Backup Smoke Test (Rule 18)

```
[ ] All 7 DynamoDB tables — PITR enabled (verify in AWS console)
[ ] On-demand backup — trigger from /admin/aws-status → confirm success
[ ] Last weekly S3 snapshot — present in s3://midland-sleep-backups/
[ ] CloudWatch alarm for Lambda failure — active and configured
```

---

## HIPC / Compliance

```
[ ] Privacy notice above every data collection form
[ ] NHI never logged raw
[ ] Download My Data endpoint works (5/day rate limit)
[ ] Audit log append-only confirmed (no UpdateItem/DeleteItem in audit table)
[ ] AWS region: ap-southeast-2 (verify in AWS console)
```

---

## Mobile / Accessibility

```
[ ] Login page usable on iPhone (375px width)
[ ] Patient dashboard readable on mobile
[ ] Touch targets ≥ 44px on key actions
[ ] Reorder button accessible and visible
[ ] Amber warning (#F59E0B) visible for OVERDUE notices
```

---

## Sign-Off

```
Tester:       Paul Alejo
Date:         [date]
Build:        [commit hash]
Result:       PASS / FAIL
Notes:        [any exceptions or deferred items]
```
