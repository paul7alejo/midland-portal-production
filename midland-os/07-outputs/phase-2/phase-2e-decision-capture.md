# Phase 2E — Decision Capture Sheet

Prepared by: OneOfZero / Paul Alejo
Demo date: _______________
Completed by: _______________

Instructions: Work through D1–D8 during or after the demo.
Circle or mark the chosen option. Add notes. Confirm owner and target date.
Implementation does not begin until all eight decisions are recorded.

---

## Context

Phase 2E will add delayed patient email notifications to the supply request workflow.
When staff change a request status to Approved, Sent, Declined, or Needs Follow-Up,
the system schedules an email to the patient 30 minutes later. If staff correct the
status before the delay expires, the original notification is cancelled and a new one
is scheduled for the updated status.

Statuses that trigger a notification: **Approved, Sent, Declined, Needs Follow-Up**
Statuses that do not trigger a notification: New, Reviewing, Delivered, funding-review flags

No implementation code has been written. These decisions are required before work begins.

---

## D1 — Staff correction window (delay before patient is emailed)

**Decision:** How long should staff have to correct an accidental status change before the
patient receives a notification email?

| Option | Description |
|--------|-------------|
| **30 minutes** ← recommended | Gives staff a comfortable correction window for most workflows. Long enough to catch a mistake; short enough that patients are notified the same day. |
| 15 minutes | Faster notification, shorter correction window. Suitable if staff check the queue frequently and errors are unlikely. |
| 60 minutes | Longer correction window. Patient notification is delayed by up to an hour after the status change. |

**Midland answer:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D2 — Sending email address (what patients see as the "from" address)

**Decision:** What email address should notification emails be sent from?

| Option | Description |
|--------|-------------|
| **noreply@midlandsleep.co.nz** ← recommended for status updates | Conventional for automated status notifications. Sets clear expectation that this address is not monitored for replies. |
| hello@midlandsleep.co.nz | Warmer and more human. Suitable if Midland wants patients to feel they can reply directly. Requires the hello mailbox to handle patient replies. |
| Other: _______________ | If Midland has a preferred address not listed above. |

**Midland answer:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D3 — Reply-to address (where patient replies are delivered)

**Decision:** If a patient replies to a notification email, where should that reply land?

| Option | Description |
|--------|-------------|
| hello@midlandsleep.co.nz | A monitored general inbox that staff check regularly. |
| Shared / team mailbox | A specific shared inbox for patient enquiries. Requires that inbox to be actively monitored. |
| Same as sending address | Only practical if the sending address is a monitored mailbox (not noreply). |
| Other: _______________ | Specify. |

**Midland answer:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D4 — Patient email address: how it is obtained

**Decision:** When a patient submits a supply request, how should the system know which email
address to send their notification to?

| Option | Description |
|--------|-------------|
| **Option A: Capture at creation** ← recommended | When the patient submits a request, their email address (from their login session) is stored on the request record. Simple and reliable at send time. If the patient later changes their email in Cognito, existing request records are not updated — accepted limitation. |
| Option B: Look up at send time | When the notification is about to send, the system queries AWS Cognito for the patient's current email. No storage on the request record. Slightly more complex. Always uses the patient's current email. |

**Midland answer:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland / Paul | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D5 — Test walkthrough participant from Midland

**Decision:** Before enabling notifications in production, we will run a full test with a
short delay (1–5 minutes instead of 30) so the team can see the flow end to end.
Who from Midland should be present or named for that walkthrough?

| What is needed | Details |
|----------------|---------|
| Named staff member | The person who will participate in the test walkthrough and confirm the flow before go-live |
| Their email address | To receive the test notification email during the walkthrough |
| Preferred date/window | When they are available for a 20–30 minute test session |

**Midland answer — name:** _______________

**Midland answer — email:** _______________

**Midland answer — availability:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D6 — Notification failure owner

**Decision:** If a notification email fails to send (e.g. patient email address not found,
sending provider error), the Audit Log will record a NOTIFICATION_FAILED event. Who from
the Midland team is responsible for reviewing those failures and following up with the patient
manually?

| What is needed | Details |
|----------------|---------|
| Named staff member | The person responsible for checking and acting on failed notifications |
| Frequency of check | How often they will review the audit log for NOTIFICATION_FAILED events (daily recommended) |

**Midland answer — name:** _______________

**Midland answer — check frequency:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D7 — NZ Unsolicited Electronic Messages Act 2007 compliance

**Decision:** Sending automated status update emails to patients requires Midland to be
satisfied that these emails are transactional communications — not commercial messages —
under the NZ Unsolicited Electronic Messages Act 2007.

Transactional emails (e.g. order status updates, account confirmations) are generally not
classified as commercial messages and do not require opt-in consent under the Act.
Status update emails informing a patient their supply request has been approved or dispatched
are, in our view, clearly transactional in nature.

**However: OneOfZero cannot make this legal determination on Midland's behalf.**
This confirmation must come from Midland or their legal adviser.

| Option | Description |
|--------|-------------|
| **Confirmed: transactional** ← if Midland is comfortable | Midland is satisfied that patient status update emails are transactional and do not require separate opt-in consent under the Act. |
| Brief legal check required | Midland would like to confirm with their adviser before proceeding. This does not block other decisions — it can run in parallel. |
| Additional consent mechanism required | Midland determines that opt-in consent is needed. Phase 2E design would need to be revisited to include a consent gate. |

**Midland answer:** _______________

**Confirmed by (name):** _______________ **Role:** _______________ **Date:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland / legal adviser | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## D8 — Email sending provider

**Decision:** Which service should send the notification emails?

| Option | Description |
|--------|-------------|
| **AWS SES (Simple Email Service)** ← recommended | Already part of the Midland AWS account. Cost is negligible at current patient volume (~$0.10 per 1,000 emails). No new vendor relationship required. Requires activating the sending domain — takes 24–48 hours via a DNS record change. |
| Alternative provider (SendGrid, Postmark, Mailgun, etc.) | Can be used if Midland has an existing relationship or preference. Requires separate account, API key, and integration work. Additional cost depending on the provider. |

**Midland answer:** _______________

**If alternative provider chosen — name of provider:** _______________

**Notes:** _______________________________________________________________________________

**Owner:** Midland / Paul | **Status:** ⏳ Awaiting | **Date confirmed:** _______________

---

## Decision summary table

| # | Decision | Recommended | Midland answer | Status |
|---|----------|-------------|----------------|--------|
| D1 | Staff correction window | 30 minutes | | ⏳ |
| D2 | Sending email address | noreply@midlandsleep.co.nz | | ⏳ |
| D3 | Reply-to address | hello@midlandsleep.co.nz or shared mailbox | | ⏳ |
| D4 | Patient email source | Option A: capture at creation | | ⏳ |
| D5 | Test walkthrough participant | Named staff member + availability | | ⏳ |
| D6 | Failure follow-up owner | Named staff member + check frequency | | ⏳ |
| D7 | NZ Spam Act compliance | Confirmed transactional / legal check | | ⏳ |
| D8 | Email provider | AWS SES | | ⏳ |

---

## Note on implementation timeline

Once all eight decisions are confirmed:

- **Estimated implementation time:** 3–4 days of focused engineering work.
- **Longest external dependency:** Activating the sending domain with AWS takes 24–48 hours.
  This can begin in parallel as soon as D2 (sending address) and D8 (provider) are confirmed.
- **Go-live gate:** NOTIFICATIONS_ENABLED will be set to false on first deployment.
  Notifications will only be enabled after the test walkthrough (D5) is completed and
  signed off by Midland.

---

*This sheet forms part of the Phase 2E pre-implementation gate record.*
*Retain with the Phase 2D acceptance checklist.*
*OneOfZero — paul7alejo@gmail.com*
