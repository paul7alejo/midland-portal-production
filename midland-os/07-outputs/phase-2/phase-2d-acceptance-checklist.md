# Phase 2D — Stakeholder Acceptance Checklist

Prepared by: OneOfZero / Paul Alejo
Date of demo: _______________
Midland attendees: _______________

Instructions: Work through each section during or immediately after the demo.
Mark each item ✓ Accepted, ✗ Not accepted, or — Not demonstrated.
Add comments where needed. Sign off at the bottom.

---

## Section 1 — Patient supply request workflow

| # | Item | Status | Comments |
|---|------|--------|----------|
| 1.1 | Patient can log into the portal and navigate to the Supply Requests page | | |
| 1.2 | Patient can select CPAP supply items from a checklist (cushion, headgear, mask kit, filters) | | |
| 1.3 | Patient can confirm or enter a delivery address before submitting | | |
| 1.4 | Patient can indicate a contact preference (email or phone) | | |
| 1.5 | On submission, patient sees a confirmation card with a reference number (e.g. REQ-749418-A) | | |
| 1.6 | After submission, the request form is replaced by a status card — the patient cannot submit a duplicate request while one is active | | |
| 1.7 | The status message on the patient portal is clear and plain-language at each stage | | |

---

## Section 2 — Patient dashboard

| # | Item | Status | Comments |
|---|------|--------|----------|
| 2.1 | Patient dashboard shows the patient's name and MSID | | |
| 2.2 | Dashboard shows the patient's CPAP device and mask record | | |
| 2.3 | Dashboard shows the current supply request status prominently | | |
| 2.4 | Dashboard layout is clear and readable for a patient audience | | |
| 2.5 | No admin-only or financial data is visible to the patient | | |

---

## Section 3 — Admin Orders work queue

| # | Item | Status | Comments |
|---|------|--------|----------|
| 3.1 | Patient request appears in Admin Orders under the Active tab immediately after submission | | |
| 3.2 | Request row shows: reference number, patient name, MSID, items summary, source (Portal), and status | | |
| 3.3 | Active tab shows only requests needing staff action (New, Reviewing, Approved, Sent, Needs Follow-Up) | | |
| 3.4 | Completed tab shows Delivered and Declined requests separately — they are not lost | | |
| 3.5 | All tab shows the full request history across all statuses | | |
| 3.6 | KPI cards at the top of the queue show counts per status for the current tab | | |
| 3.7 | Staff can open the patient drawer from any request row to see the patient's record, device, and mask without leaving the Orders page | | |
| 3.8 | Filter & Sort panel allows filtering by status, source, date, and sorting by date or name | | |
| 3.9 | Funding review flag can be set on any request — it is an internal staff signal and does not change the patient-visible status | | |
| 3.10 | Admin Orders page is usable as a daily staff work queue without excessive scrolling or confusion | | |

---

## Section 4 — Status update and patient visibility

| # | Item | Status | Comments |
|---|------|--------|----------|
| 4.1 | Admin can change request status using the inline dropdown on each request row | | |
| 4.2 | Status changes save immediately without a page reload | | |
| 4.3 | Patient-visible copy is status-specific and clear at each stage: | | |
| | — New / Reviewing: "Midland Sleep is reviewing your request" | | |
| | — Approved: "Your request has been approved" | | |
| | — Sent: "Your supplies have been dispatched" | | |
| | — Needs Follow-Up: "Our team needs to follow up with you" | | |
| | — Declined: "Your request could not be approved through the portal" | | |
| 4.4 | For Declined and Needs Follow-Up statuses, the patient is directed to contact the clinic — no form is shown | | |
| 4.5 | Patient status copy is acceptable for patients to read — no internal jargon, no financial detail | | |

---

## Section 5 — Delivered status and repeat request

| # | Item | Status | Comments |
|---|------|--------|----------|
| 5.1 | Admin can set a request status to Delivered | | |
| 5.2 | Delivered request moves from Active tab to Completed tab | | |
| 5.3 | Patient sees "Your supply request is complete" copy when status is Delivered | | |
| 5.4 | After Delivered, the new supply request form is visible again — patient can submit another request | | |
| 5.5 | Declined requests do not unlock the form — patient must contact the clinic | | |
| 5.6 | The repeat-request lifecycle is acceptable for real patients: one active request at a time, unlocked after delivery | | |

---

## Section 6 — Audit trail

| # | Item | Status | Comments |
|---|------|--------|----------|
| 6.1 | Every status change is recorded in the admin Audit Log | | |
| 6.2 | Each audit event shows: timestamp, staff email, patient MSID, previous status, new status, result | | |
| 6.3 | The initial patient submission (REQUEST_CREATED) is also recorded in the audit log | | |
| 6.4 | Audit records are readable and useful for operational review | | |
| 6.5 | No patient financial data, NHI, or sensitive personal information is visible in the audit log | | |

---

## Section 7 — Known limitations acknowledged

The following are known limitations of Phase 2D. Midland confirms they have been explained
and are understood before going live with real patients.

| # | Limitation | Acknowledged |
|---|-----------|-------------|
| 7.1 | The patient must manually refresh their portal to see a status update. There is no automatic email or push notification in Phase 2D. | |
| 7.2 | The patient can only see their most recent request. A full request history view for patients is future scope. | |
| 7.3 | Delivered is set manually by staff. There is no courier integration or automatic delivery confirmation. | |
| 7.4 | Some earlier test requests show as "Legacy request" in the reference column. These are pre-production test records. | |
| 7.5 | The request form on mobile requires some scrolling after the Delivered status card. This is a minor UX item for a future pass. | |

---

## Section 8 — Items confirmed not live in Phase 2D

Midland confirms that the following items were not claimed as live during the demo and are
understood to be future scope.

| # | Item | Confirmed not live |
|---|------|--------------------|
| 8.1 | Automatic patient email or SMS notifications | |
| 8.2 | Inventory reservation or stock deduction | |
| 8.3 | ACC / PHO entitlement balance deduction | |
| 8.4 | Patient payment or checkout | |
| 8.5 | Automated fulfilment or dispatch tasks | |
| 8.6 | Clinical eligibility validation | |
| 8.7 | Patient request history view (multiple past requests) | |

---

## Section 9 — Phase 2E status

| # | Item | Confirmed |
|---|------|-----------|
| 9.1 | Phase 2E (delayed patient email notifications) has been specified and designed, but no implementation code has been written | |
| 9.2 | Implementation of Phase 2E requires Midland confirmation of decisions D1–D8 (captured in the Phase 2E decision sheet) | |
| 9.3 | The NZ Unsolicited Electronic Messages Act compliance question (D7) must be confirmed by Midland or their legal adviser before Phase 2E goes live | |

---

## Section 10 — Acceptance sign-off

### Overall Phase 2D acceptance

Phase 2D — patient supply request lifecycle — is accepted as demonstrated and suitable for
use with real Midland Sleep patients, subject to the limitations acknowledged in Section 7.

**Accepted** ☐ &nbsp;&nbsp; **Conditionally accepted** ☐ &nbsp;&nbsp; **Not accepted** ☐

If conditionally accepted or not accepted, describe what must change before acceptance:

```
_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________
```

---

### Sign-off

| | |
|--|--|
| **Name** | ___________________________ |
| **Role** | ___________________________ |
| **Organisation** | Midland Sleep |
| **Date** | ___________________________ |
| **Signature** | ___________________________ |

---

| | |
|--|--|
| **Name** | Paul Alejo |
| **Role** | Technical Lead |
| **Organisation** | OneOfZero |
| **Date** | ___________________________ |

---

*This document forms part of the Phase 2D delivery record.*
*Retain for project and operational records.*
