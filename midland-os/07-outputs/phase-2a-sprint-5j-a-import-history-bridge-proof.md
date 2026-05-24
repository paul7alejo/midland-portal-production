# Phase 2A Sprint 5J-A — Import History Evidence Bridge Proof
## Midland Sleep Portal
## OneOfZero Systems | Paul Alejo
## Date: 24 May 2026

## Summary

Sprint 5J-A delivered a browser-local import history evidence bridge for the Midland Sleep admin import workflow.

This is not system-wide persistent batch history. It is a browser-local convenience layer that allows staff on the current device/browser to:
- return to prior executed import batches
- view a safe batch details sheet
- view a safe portal access summary
- download staff-safe evidence CSVs
- retain import history after reload in the same browser

This sprint does **not** create a shared audit record across devices or users. History is stored in the current browser only.

---

## Scope

### Included
- Friendly import IDs shown in Results, Import History, and Batch Details
- Browser-local import history using localStorage
- Clickable Import History rows
- Batch Details sheet
- Safe portal access summary in batch details
- Staff-safe evidence CSV downloads:
  - batch summary CSV
  - portal access summary CSV
  - failed rows CSV when applicable
  - skipped rows CSV when applicable
- Honest browser-local copy
- Rollback/recovery remains placeholder-only

### Explicitly not included
- Backend-persistent shared import batch history
- Cross-device or cross-browser batch history
- Rollback execution
- Temporary password storage
- Temporary password redisplay in history/details
- Raw NHI exposure
- Auth or Cognito redesign
- Import engine rewrite

---

## Build verification

### TypeScript
- `npx tsc --noEmit` passed

### Build
- `npm run build` passed

---

## Browser proof completed

### Proof 1 — Correct browser-local empty state
Verified `/admin/import` shows:
- `No Import History`
- explicit wording that history is local to this device and browser only
- no misleading system-wide persistence wording

Result:
- PASS

### Proof 2 — First successful import
Executed clean 2-row import with portal access enabled for both rows.

Expected:
- 2 patients created
- 2 portal users created
- 0 skipped
- 0 failed

Observed:
- import completed successfully
- friendly import ID generated: `IMP-20260524-001`

Result:
- PASS

### Proof 3 — First batch visible in Import History
After returning to Import History and reloading the page:
- batch remained visible in the same browser
- friendly import ID displayed as primary identifier
- raw batch UUID displayed as secondary metadata
- imported-by value displayed correctly
- browser-local warning copy displayed correctly

Observed:
- `IMP-20260524-001` visible after reload

Result:
- PASS

### Proof 4 — First batch details sheet
Opened batch details for `IMP-20260524-001`.

Verified:
- friendly import ID in header
- raw UUID shown below
- imported-by email shown
- created/skipped/failed counts correct
- portal users created count correct
- safe portal access summary shown
- no temporary passwords shown in history/details
- batch evidence section shown
- rollback/recovery remains placeholder-only

Result:
- PASS

### Proof 5 — Safe evidence downloads for batch 001
Downloaded:
- batch summary CSV
- portal access summary CSV

Verified safe content only.

#### Batch summary CSV fields verified
- import_id
- batch_id
- imported_by
- executed_at
- total_rows
- created
- skipped
- failed
- portal_accounts_created
- portal_already_existed
- portal_failures
- status

#### Portal access summary CSV fields verified
- row
- patient_name
- portal_id
- username
- outcome

Verified absent:
- no temporary passwords
- no raw NHI
- no secrets/tokens

Result:
- PASS

### Proof 6 — Patients page cross-check
Confirmed imported patients appeared in `/admin/patients`.

Observed:
- imported records visible
- MSIDs created
- imported patients shown in patient worklist
- pending review state visible

Result:
- PASS

### Proof 7 — Second successful import
Second clean 2-row import initially returned `Unauthorized` at execute.
This was resolved by logging out and logging back in, then retrying the same file.

This indicates a local admin session/auth reliability issue rather than a CSV or import logic failure.

After fresh login, same file executed successfully.

Observed:
- 2 patients created
- 2 portal users created
- 0 skipped
- 0 failed
- friendly import ID generated: `IMP-20260524-002`

Result:
- PASS after fresh login

### Proof 8 — Sequential friendly import IDs
Verified sequential browser-local friendly IDs:
- `IMP-20260524-001`
- `IMP-20260524-002`

Observed in Import History:
- 2 batches · this browser

Result:
- PASS

### Proof 9 — Second batch details sheet
Opened batch details for `IMP-20260524-002`.

Verified:
- friendly import ID in header
- raw UUID secondary
- imported-by email correct
- safe portal access summary present
- batch evidence section present
- rollback placeholder remains disabled

Result:
- PASS

### Proof 10 — Safe evidence downloads for batch 002
Downloaded:
- batch summary CSV
- portal access summary CSV

Verified safe content only.

#### Safe portal access summary confirmed
The batch details section includes a staff-safe portal access summary showing:
- row
- patient name
- portal ID (MSID)
- login username

This summary does not store or display temporary passwords and does not expose raw NHI.

Result:
- PASS

---

## Data safety verification

### Confirmed safe
- No raw NHI shown in Import History
- No raw NHI shown in Batch Details
- No temporary passwords shown in history/details
- Temporary passwords shown only on immediate Results screen
- Evidence CSVs contain safe operational fields only
- Safe portal access summary is staff-safe and does not expose secrets

### Confirmed not stored in history/details
- temporary passwords
- raw NHI
- reusable secrets
- reset tokens
- Cognito internals

---

## Known limitations

### 1. Browser-local only
Import history is stored in the current browser only.
It does not appear on other devices or other browsers and is lost if browser storage is cleared.

### 2. Not an audit system of record
This sprint does not create true backend-persistent shared batch history.
It is a convenience evidence bridge, not a clinic-wide authoritative audit record.

### 3. Auth/session drift observed during local testing
One repeated execute attempt returned `Unauthorized`.
After logout/login, the same file imported successfully.
This suggests session/auth reliability drift in the local admin session, not an import logic defect.

### 4. Rollback remains placeholder-only
Recovery/rollback UI is informational only.
No rollback execution exists in this sprint.

---

## Final assessment

Sprint 5J-A is successful as a browser-local import history evidence bridge.

It provides meaningful operational value by allowing staff to:
- identify executed import batches
- reopen batch details
- view safe portal access identifiers
- download safe evidence artifacts
- retain import history after reload in the same browser

It should be described honestly as:
- browser-local
- device-local
- convenience history
- not a shared persistent audit record

---

## Recommended next status

### Close this sprint as:
`Phase 2A Sprint 5J-A — Browser-Local Import History Evidence Bridge`

### Recommended follow-up
A later sprint may implement true backend-persistent batch history if Midland needs:
- shared history across devices/admins
- authoritative friendly IDs
- persistent stored evidence references
- operations-grade audit-backed batch lookup

For now, this sprint is ready to close and merge as a bounded, safe, useful import UX bridge.
