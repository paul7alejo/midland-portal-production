# Midland Sleep — Phase 2D Summary and Phase 2E Decision Brief

Prepared by: OneOfZero / Paul Alejo
Date: 29 May 2026
Audience: Clinic owner, operations lead, admin lead

---

## Overview

Phase 2D is the first complete supply request cycle in the Midland Sleep portal. A patient can now
submit a request, see it move through your team's review process in real time, and receive a
confirmation that their supplies are on the way — all without a phone call or manual email being
required from staff.

This document summarises what is now working, what staff and patients can do today, and what
decisions we need from you before we begin the next phase.

---

## 1. What is now working

**Patient supply requests are live end-to-end.**

A patient logs into the portal, selects the CPAP supplies they need, confirms their delivery
address, and submits. The request arrives immediately in your admin Orders queue. Your team
reviews it, advances it through your workflow, and marks it delivered. The patient sees every
stage without needing to call.

**Admin Orders is now a proper work queue.**

The Orders page separates active requests (New, Reviewing, Approved, Sent, Needs Follow-Up) from
completed history (Delivered, Declined). Staff working the queue see only what needs action by
default. Completed requests stay on record and are visible any time.

**Status changes are audited.**

Every time a staff member changes a request status, the system records who made the change, what
the status was before, what it changed to, and which patient it belongs to. This is stored
separately from the request itself, in a dedicated audit trail.

**The full lifecycle has been verified with a real patient account (MS-749418).**

Submission → New → Reviewing → Approved → Sent → Delivered → patient reorders. Each stage was
confirmed in the browser. The audit trail for each status change was confirmed complete.

---

## 2. What staff can now do

- **See all patient supply requests in one place**, sorted by arrival date, with the most
  recent at the top.
- **Work from a focused Active queue** showing only requests that need attention.
  Delivered and Declined requests move to the Completed view automatically.
- **Change request status with a single click** from the inline status control in the
  request row. Changes save immediately.
- **Flag requests for funding review** — useful for requests that need a second look before
  proceeding, without changing the visible status for the patient.
- **Open the patient drawer** from any request to see the patient's record, device, and mask
  history alongside the request — no switching tabs or searching separately.
- **Filter and sort the queue** by status, source (portal vs. support request), date, and
  patient name.
- **View the full audit trail** in the Audit Log, including every status change with staff
  email, patient MSID, and timestamps.

---

## 3. What patients can now do

- **Submit a CPAP supply request from the portal**, selecting the items they need and
  confirming their delivery address.
- **See the current status of their request** on their portal dashboard, with clear plain-
  language copy for each stage.

  | What they submitted | What they see |
  |--------------------|-|
  | Request under review | "Midland Sleep is reviewing your request. Please allow 5–7 business days." |
  | Request approved | "Your request has been approved. Our team will prepare your items." |
  | Supplies dispatched | "Your supplies have been dispatched. Allow 2–3 business days for delivery." |
  | Needs follow-up | "Our team needs to follow up with you. Please contact Midland Sleep." |
  | Request declined | "Your request could not be approved through the portal. Please contact us." |
  | Delivery confirmed | "Your supply request is complete. You can submit another when needed." |

- **Submit a new request once their previous request is marked Delivered.** Declined requests
  do not unlock the form — the patient must contact the clinic.
- **See their equipment summary and dashboard** with their CPAP device, mask, and recent
  portal activity.

---

## 4. What is intentionally not automated yet

This section is explicit so there are no surprises.

**No email notification is sent to the patient.** When staff change a request status, the patient
must log into the portal to see the update. This is the expected behaviour for Phase 2D.
Automated email notification is the subject of Phase 2E (see Section 6).

**No inventory is reserved or deducted.** Approving or dispatching a request does not update
stock counts in any system. Staff manage fulfilment through their normal process.

**No entitlement balance is deducted.** Estimate fields on the admin orders view are for staff
reference only. No balance is adjusted in ACC or any other system when a request is submitted,
approved, or delivered.

**No payment is taken.** There is no checkout step. Patient billing, if applicable, is handled
outside the portal.

**No prescription or clinical validation is performed.** The portal does not verify clinical
eligibility before a request is submitted. That remains a staff responsibility during review.

---

## 5. Known limitations

These are honest limitations we are aware of and are tracking. None prevent the current workflow
from being used.

- **Patients must refresh the portal to see status updates.** There is no push notification or
  email alert yet. This is Phase 2E scope.
- **The patient can only see their most recent request.** A full request history view for the
  patient is a future scope item.
- **Delivered is set manually by staff.** There is no courier integration or automatic delivery
  confirmation. Staff mark a request delivered when they know it has been received.
- **Estimates in the admin view are for staff reference only** and are Phase 2 placeholders.
  Actual entitlement calculation and deduction is Phase 3 scope.
- **A small number of earlier test requests** submitted before the reference number system was
  in place appear as "Legacy request" in the admin queue. These can be identified and cleaned up
  once you are in production.

---

## 6. Phase 2E proposed next step: delayed patient email notifications

**What it would do:**

When a staff member changes a supply request status to Approved, Sent, Declined, or Needs
Follow-Up, the system would schedule a patient notification email to send 30 minutes later.
The delay gives staff a correction window: if the status was changed by mistake, it can be
updated before the patient receives anything. If the status changes again in the window, the
original notification is cancelled and a new one is scheduled for the latest status.

**What the patient would receive:**

Plain, clear emails with no clinical promises and no financial detail — just a status update
and a clear next step. For example:

- *Approved:* "Your supply request has been approved. Our team will prepare your items
  and be in touch if we need anything further."
- *Sent:* "Your supplies have been dispatched. Please allow 2–3 business days for delivery."
- *Declined:* "We were unable to approve your recent supply request through the portal.
  Please contact our team to discuss your options: [phone number]."
- *Needs Follow-Up:* "Our team needs to follow up with you about your request. Please
  contact us at your earliest convenience: [phone number]."

**What it would not do:**

It would not send dollar amounts, entitlement figures, clinical advice, or any admin-internal
information to the patient. New and Reviewing statuses would not trigger a notification.
Delivered would not trigger a notification at this stage.

**The technical approach is designed and ready.** The specification is complete. We have
not written any code yet. We are waiting for the decisions in Section 7 before starting.

**Estimated implementation time once decisions are confirmed: 3–4 days of focused work.**

---

## 7. Decisions needed from Midland before Phase 2E

We cannot begin implementation until you have confirmed the following. Most are simple
decisions you can make in a short meeting. The legal item (D7) may need a brief check
with your adviser.

| # | Decision needed | Options |
|---|----------------|---------|
| D1 | How long should staff have to correct a status change before the patient is emailed? | 30 minutes (recommended) / 15 min / 60 min |
| D2 | What address should emails come from? | noreply@midlandsleep.co.nz / hello@midlandsleep.co.nz |
| D3 | Where should patients reply if they respond to a notification email? | hello@midlandsleep.co.nz / a shared inbox |
| D4 | Is it acceptable to store the patient's email address on their supply request record at the time they submit? | Yes (recommended, simpler) / No (we look it up when sending instead) |
| D5 | Who on the Midland team will participate in the test walkthrough before we go live? | Named staff member |
| D6 | Who on the Midland team is responsible for following up if a notification fails to send? | Named staff member |
| D7 | Are you satisfied that sending status update emails to patients counts as transactional communication under the NZ Unsolicited Electronic Messages Act 2007 — and does not require separate opt-in consent? | Confirmed (transactional) / Needs legal check |
| D8 | Email sending provider | AWS SES — already in your AWS account (recommended) / Alternative |

**D7 is the most important decision to resolve early.** If there is any doubt about consent
obligations, a brief check with your legal adviser before we begin will prevent complications
after launch. Transactional status emails are generally not treated as commercial messages under
the Act, but Midland should confirm this applies to their patient relationship.

**The item with the longest lead time is the sending domain setup** (activating
midlandsleep.co.nz as a verified sending address through AWS). Once you confirm D2, we can
start that process in parallel — it typically takes 24–48 hours.

---

## 8. Recommended next meeting agenda

Suggested 30–45 minute call to close out the above:

1. **Demo walkthrough** — 10 min
   Walk through the Phase 2D lifecycle live in the browser.
   Patient submits → admin reviews → admin updates status → patient sees update → admin marks
   Delivered → patient can reorder.

2. **Phase 2D acceptance** — 5 min
   Confirm Phase 2D is accepted as working. Identify any workflow changes or copy adjustments
   needed before real patients use it.

3. **Phase 2E decisions** — 15 min
   Work through D1–D8 from Section 7. Most can be answered in this meeting.

4. **Legal / privacy check** — 5 min
   Confirm whether D7 needs a brief external check or can be answered by Midland directly.

5. **Next steps and timing** — 5 min
   Agree a date for Phase 2E test walkthrough once implementation is complete.

---

## 9. Demo checklist

Use this to walk through the system before or during the meeting.

**Patient portal (log in as a patient)**
- [ ] Patient sees their dashboard with equipment summary and portal status
- [ ] Patient navigates to Supply Requests
- [ ] Patient selects one or more items and confirms delivery address
- [ ] Patient submits — sees confirmation card with reference number
- [ ] Patient cannot submit again while request is active

**Admin Orders (log in as admin)**
- [ ] Admin sees the new request under the Active tab
- [ ] Reference number, patient name, items, and source (Portal) are visible
- [ ] Admin opens the patient drawer from the request row — sees patient record and device
- [ ] Admin changes status: New → Reviewing
- [ ] Admin changes status: Reviewing → Approved

**Patient portal — status update**
- [ ] Patient refreshes portal and sees "Your request has been approved" copy

**Admin Orders — continue**
- [ ] Admin changes status: Approved → Sent
- [ ] Admin changes status: Sent → Delivered
- [ ] Delivered request moves to Completed tab
- [ ] Active tab no longer shows the request

**Patient portal — delivered**
- [ ] Patient refreshes and sees "Your supply request is complete" copy
- [ ] New request form is now visible — patient can submit again

**Audit trail**
- [ ] Navigate to Admin Audit Log
- [ ] Find REQUEST_STATUS_UPDATED events for the demo request
- [ ] Confirm patient MSID, previous status, and new status are recorded for each change

---

*Prepared by OneOfZero. Questions or corrections: paul7alejo@gmail.com*
