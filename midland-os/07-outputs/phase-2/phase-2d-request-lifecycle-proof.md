# Phase 2D — Patient Request Lifecycle Proof

Date: 29 May 2026
Branch: phase-2a-admin-ops
TypeScript: `npx tsc --noEmit` — PASS

---

## Scope

Phase 2D closes the supply request loop for a real patient (MS-749418) from first submission through
admin review, status progression, delivery confirmation, and a verified repeat request. This is the
first end-to-end lifecycle proof with:

- patient-submitted requests via the portal
- admin status updates in the orders worklist
- patient-visible status copy that tracks each stage honestly
- a Delivered terminal status that unlocks reorder
- audit events that capture patient_msid, request_id, previous_status, and new_status
- an Active / Completed / All tab view so staff can separate in-progress from historical work

Phase 2D also fixed four auth/session regressions introduced by the Phase 2D-4 cookie split work:
stale admin Amplify session contaminating the patient portal, cookie naming collision between admin
and patient sessions, an invalid redirect target (/portal/login), and a patient-identity heuristic
that misclassified the midland-admin Cognito user.

---

## Non-goals (explicit)

The following are intentionally out of scope for Phase 2D and must not be inferred from this proof:

- No email or SMS notification is sent to the patient at any stage.
- No inventory is reserved, decremented, or fulfilled.
- No payment or checkout flow exists.
- No post-delivery survey or NPS prompt is triggered.
- No entitlement balance is deducted from DynamoDB.
- No prescription check or clinical validation is performed.
- No automated fulfilment task is created.
- Audit events record admin actions only — they do not represent a compliance audit system.

---

## 1. Request creation proof

Route: `/portal/reorder` (patient login required)

Patient MS-749418 navigated to the supply request page. The page showed:

- CPAP supply request form
- item checkboxes (mask cushion, headgear, complete mask kit, filters)
- delivery address confirmation
- contact preference radio
- Submit button enabled when at least one item selected and delivery address present

On submission:

- POST `/api/patient/reorder` was called with the patient's portal_token cookie
- A new order record was written to DynamoDB with status `new`
- A `REQUEST_CREATED` audit event was written with the patient's MSID and org_id
- The patient was shown a confirmation card with a reference number (e.g. REQ-749418-A)
- The request form was replaced by the current request status card
- No dollar estimates were returned in the patient-facing API response

DynamoDB record fields confirmed present:
- `pk`: `ORDER#<uuid>`
- `sk`: `REORDER`
- `org_id`: `midland-sleep`
- `patient_msid`: `MS-749418`
- `patient_name`: patient display name
- `items`: array of selected item keys
- `status`: `new`
- `created_at`: ISO timestamp
- `request_reference`: formatted reference number

---

## 2. Admin Orders visibility proof

Route: `/admin/orders`

After the patient submitted:

- The request appeared in the Admin Orders table under the **Active** tab (default view)
- Reference number, patient name, MSID, items, source badge (Portal), and status (New) were visible
- The request did not appear under the **Completed** tab (correct — new/active statuses are excluded)
- No dollar amounts were shown as null/dash where estimates had not been entered by admin
- The amber KPI dot appeared on the New card

Tab behaviour confirmed:
- **Active** tab: shows New, Reviewing, Approved, Sent, Needs Follow-Up
- **Completed** tab: shows Delivered, Declined
- **All** tab: shows all statuses
- Switching tabs clears the active KPI filter and status filter panel selections
- KPI card counts are scoped to the current tab

---

## 3. Status update proof

Admin changed the request status through each stage via the inline select in the orders table:

| Step | Status set | Expected patient view |
|------|-----------|----------------------|
| 1    | Reviewing  | "Midland Sleep is reviewing your request" |
| 2    | Approved   | "Your request has been approved" |
| 3    | Sent       | "Your supplies have been dispatched" |
| 4    | Delivered  | "Your supply request is complete" |

Each status change:
- called PATCH `/api/admin/orders` with `{ id, status }`
- the API fetched the existing record via `getReorderById` before writing the audit event
- the audit event was written before the DynamoDB status update (audit-first policy)
- the status update in DynamoDB followed on audit success
- the admin table row updated visually without a full page reload
- the patient saw the new status on their next portal refresh

The Delivered row moved from the **Active** tab to the **Completed** tab after refresh (tab pre-filter
is client-side; the data is fetched fresh on each GET).

---

## 4. Patient status display proof

Route: `/portal/reorder` (patient login required)

For each status the patient saw a status card with:

**New / Reviewing**
- Heading: "Midland Sleep is reviewing your request"
- Message: includes allow 5–7 business days guidance
- Request form hidden, cannot submit another request

**Approved**
- Heading: "Your request has been approved"
- Message: Midland Sleep has approved your supply request; team will prepare your items

**Sent**
- Heading: "Your supplies have been dispatched"
- Message: allow 2–3 business days for delivery

**Needs Follow-Up**
- Heading: "Midland Sleep needs to follow up with you"
- Message: our team needs to confirm a few details; contact Midland Sleep directly
- Request form hidden

**Declined**
- Heading: "Your request could not be approved through the portal"
- Message: please contact Midland Sleep with a phone contact link
- Request form hidden

**Delivered**
- Heading: "Your supply request is complete"
- Message: supplies have been delivered or completed; you can submit another supply request when needed
- Request form shown (non-blocking — patient may reorder)

Dollar estimates are not shown on any patient-facing page. The status card does not show internal
admin notes, request_id UUIDs, or DynamoDB record details.

---

## 5. Delivered lifecycle proof

The `delivered` status was added across:

- `src/lib/aws/dynamodb.ts` — `ReorderStatus` type and `normalizeReorderStatus`
- `src/app/api/admin/orders/route.ts` — `VALID_STATUSES`, `STATUS_DISPLAY`
- `src/app/api/patient/reorder/route.ts` — `PATIENT_STATUS_MESSAGES`; excluded from `ACTIVE_STATUSES` (non-blocking)
- `src/app/portal/reorder/page.tsx` — `BLOCKING_STATUSES_PATIENT` explicitly excludes `delivered`; full heading/message copy added
- `src/app/admin/(protected)/orders/page.tsx` — `STATUS_OPTIONS`, `STATUS_BADGE` (teal), `DB_STATUS`, `COMPLETED_TAB_STATUSES`

Blocking vs non-blocking behaviour:
- `BLOCKING_STATUSES_PATIENT` = `{ new, reviewing, approved, sent, needs_followup, declined }`
- `delivered` is intentionally absent — the request form is shown when status is delivered
- `declined` remains blocking — patient cannot reorder; must contact clinic

Admin status select confirmed `Delivered` appears as a valid option in the inline dropdown.
Patient portal confirmed form is visible when status is `delivered`.

---

## 6. Repeat request proof

After admin set status to `delivered`:

- Patient MS-749418 refreshed `/portal/reorder`
- The status card showed the "Your supply request is complete" delivered message
- Below the status card, the request form was rendered (form was not hidden)
- Patient was able to select new items and submit a second request
- Second request appeared in Admin Orders as a new `new` row under the Active tab
- The previous delivered request remained visible in Admin Orders under the Completed tab

This confirms the lifecycle is complete and repeatable.

---

## 7. Audit proof with patient_msid

Route: `/admin/audit`

Audit events for request status changes previously showed `patient_msid: Not captured`.

Fix applied in PATCH `/api/admin/orders`:
- `getReorderById(id, ORG_ID)` is called once at the top of the PATCH handler
- The result provides `patient_msid`, `request_reference`, and current `status` (as `previous_status`)
- Failure of the lookup is non-fatal — a warn is logged and the audit proceeds without patient context
- Both the `needsFundingReview` and status-update audit paths now include these fields

Confirmed audit event shape for `REQUEST_STATUS_UPDATED`:

| Field            | Value example              |
|------------------|---------------------------|
| event_type       | REQUEST_STATUS_UPDATED    |
| action           | REQUEST_STATUS_UPDATED    |
| category         | Orders                    |
| admin_email      | admin@midlandsleep.co.nz  |
| patient_msid     | MS-749418                 |
| request_id       | REQ-749418-A              |
| previous_status  | reviewing                 |
| new_status       | approved                  |
| result           | success                   |
| order_id         | (DynamoDB record UUID)    |

Fields confirmed absent from audit events: raw NHI, estimated dollar amounts, delivery address,
token/cookie data, email body content, passwords, secrets.

---

## 8. Orders Active / Completed / All history proof

Tab behaviour confirmed in browser:

- Default view on page load: **Active** tab selected
- Active tab shows only: New, Reviewing, Approved, Sent, Needs Follow-Up
- Completed tab shows only: Delivered, Declined
- All tab shows all statuses
- Delivered requests remain visible in Completed and All — they do not disappear
- Declined requests appear in Completed — they are not permanently hidden
- KPI card counts reflect the current tab's data (not all-time counts)
- Switching tabs clears KPI filter and status filter panel selections
- Filter panel, date range, type filter, sort, and search all work within the active tab
- The inline status dropdown still allows changing status regardless of which tab is active
- Creating a test request via the test panel switches the view to Active + sets KPI filter to New

`normalizeStatus` was also fixed to handle `"Delivered"` and `"delivered"` input values, which
previously fell through to the `"New"` fallback.

---

## 9. Known UX issues to clean later

These are honest limitations observed during Phase 2D proof. None are blockers for Phase 2D closeout.

**Request reference display**
- Legacy requests without a `request_reference` field show "Legacy request" as the reference number
  in the admin orders table. These are pre-reference records from early testing.

**Delivered status card placement**
- The delivered status card and the new request form are stacked vertically. On narrow screens this
  creates a long scroll before the form appears. Future improvement: collapse the delivered card or
  move the form above it.

**Admin orders tab: KPI card relevance on Completed tab**
- The KPI cards (New, Reviewing, Approved, Sent, Declined, Needs Follow-Up, Needs Funding Review) are
  all shown on every tab. On the Completed tab, most show 0. A future pass could show only the
  relevant KPI cards per tab (e.g. Delivered + Declined on Completed).

**No patient notification on status change**
- The patient must manually refresh `/portal/reorder` to see a status update. There is no push
  notification, email trigger, or badge indicator. Email automation is a future scope item.

**Admin orders table date format**
- Dates are formatted in NZ locale (`26 May 2026`). The parseDateForSort function parses this format
  only. If dates arrive in an unexpected format, the sort/date-range filter silently treats them as
  unparseable. This is a known edge case with legacy or admin-created records.

**Funding review flag on completed requests**
- The "Flag funding" button is visible on Delivered and Declined rows in the Completed tab. This is
  not harmful but is likely not useful after a request is complete. A future pass can hide it on
  terminal statuses.

**Patient portal: no request history**
- The patient can only see their most recent request. There is no request history view for the
  patient. If a patient has multiple requests, only the latest is shown. History is an explicit
  Phase 3 / future scope item.

---

## Verification

TypeScript:
- `npx tsc --noEmit` — PASS on branch phase-2a-admin-ops

Build:
- `npm run build` should be confirmed on Amplify deploy before patient-facing use

Auth regressions fixed and confirmed:
- Patient portal hard refresh no longer shows Midland Admin / MS-000000
- Admin login no longer loops at /admin/login?reason=unauthorized after cookie split
- Session conflict redirect targets /login (existing patient sign-in route), not /portal/login
- Admin token writes to id_token cookie; patient token writes to portal_token cookie
