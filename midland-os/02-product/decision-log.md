# Product Decision Log — Phase 2D

This file records product decisions made during Phase 2D (patient request lifecycle).
For Phase 1 and Phase 2A/2C decisions, see `midland-os/06-memory/decision-log.md`.

---

## Delivered status is non-blocking; Declined is blocking

**Decision:** `delivered` does not prevent a patient from submitting another request. `declined`
continues to prevent reorder and directs the patient to call the clinic.

**Rationale:** A delivered request represents a completed supply cycle. Preventing reorder after
delivery would require the patient to contact staff unnecessarily. Declined requests indicate a
clinical or process gate that staff need to resolve directly; a portal reorder from a declined state
would bypass that gate.

**Boundary:** The transition from `delivered` to a new request is not automatic. The patient must
manually submit a new request. No recurring order, subscription, or auto-reorder logic is implied.

---

## Audit-first policy on status updates

**Decision:** The audit event is written to DynamoDB before the status update is applied.
If the audit write fails, the status update does not proceed and the API returns a 500 error.

**Rationale:** An unaudited status change is worse than a temporarily stuck request. Staff can
retry. A change with no audit trail cannot be reconstructed.

**Boundary:** Audit events record admin action metadata only. They do not contain NHI, dollar
estimates, delivery addresses, email body content, passwords, or secrets.

---

## patient_msid captured via pre-fetch, not request payload

**Decision:** Before writing a `REQUEST_STATUS_UPDATED` audit event, the API fetches the existing
order record from DynamoDB using `getReorderById`. The `patient_msid`, `request_reference`, and
current `status` are read from that record. These values are not accepted from the admin client
request body.

**Rationale:** Accepting patient_msid from the client would allow a malicious or misconfigured
client to associate the audit event with the wrong patient. The server-side fetch is authoritative.

**Boundary:** If the pre-fetch fails (non-fatal), the audit event is still written without patient
context. A warning is logged. The status update proceeds.

---

## Cookie separation: portal_token for patients, id_token for admins

**Decision:** The `/api/auth/session` route detects whether a verified JWT belongs to an admin or
a patient, and writes the token to a different httpOnly cookie: `id_token` for admins,
`portal_token` for patients.

**Rationale:** A single shared cookie name caused the patient login flow to overwrite the admin
session (and vice versa) in browsers where both sessions were active. Split cookie names prevent
cross-contamination without requiring separate Cognito user pools.

**Admin detection logic:** mirrors `isAuthorizedAdmin()` exactly — checks `custom:role`,
`custom:is_dev`, `cognito:username`, and `email` against allowlists. The `custom:msid` field is
not used for admin detection because the midland-admin Cognito user has `custom:msid='MS-000000'`,
which matches patient MSID patterns.

---

## Active / Completed / All tabs replace implicit "everything" view

**Decision:** Admin Orders defaults to the **Active** tab (New, Reviewing, Approved, Sent,
Needs Follow-Up). Delivered and Declined requests are visible under **Completed**. All requests
are visible under **All**.

**Rationale:** As delivered and declined requests accumulate over time, a single flat list becomes
harder to work from. Staff need to focus on requests that require action without losing history.
Completed requests must remain accessible for audit and patient context — they do not soft-delete.

**KPI scoping:** KPI card counts reflect the current tab's data. Switching tabs clears the active
KPI filter and status filter panel to avoid confusing cross-filter state.

---

## No email automation in Phase 2D

**Decision:** No email, SMS, or push notification is sent to the patient when an admin changes
their request status.

**Rationale:** Email automation requires transactional email service integration (SES, SendGrid,
etc.), unsubscribe handling, template management, and compliance review. These are out of scope for
Phase 2. Manual follow-up by clinic staff is the operating model for Phase 2.

**Future scope:** Patient notification on status change is scoped as Phase 2E. See
`phase-2e-delayed-notification-spec.md`.

---

## Phase 2E deferred to spec — not yet approved for implementation

**Decision:** Phase 2E (delayed patient notification) is documented as a product/technical spec
and is not yet approved for implementation. Implementation begins only after Midland confirms
the seven pre-implementation decisions listed in Section 12 of the spec.

**Rationale:** Email notifications involve patient contact, SES domain verification, NZ Spam Act
obligations, and patient data handling (email address capture). These require explicit product
owner sign-off before a line of implementation code is written.

**Architecture locked:** EventBridge Scheduler + Notification Lambda + DynamoDB notifications
table + SES. DynamoDB TTL approach is explicitly rejected due to timing unreliability.

---

## No inventory or entitlement deduction in Phase 2D

**Decision:** Submitting a request, approving it, or marking it Delivered does not decrement any
inventory count or entitlement balance in DynamoDB.

**Rationale:** Phase 2D proves the request workflow. Entitlement deduction requires a confirmed
entitlement tracking schema, a verified balance-calculation model, and product owner sign-off on
deduction rules (e.g. when deduction occurs — at approval, dispatch, or delivery). These are Phase
3 scope items.

**Boundary:** Estimated cost fields on orders (estimatedItemAmount, estimatedFundedAmount,
estimatedPatientCopay, estimatedRemainingAfter) are staff-facing annotations only. They are not
returned to the patient API and do not affect any balance.
