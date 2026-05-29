# Phase 2E — Delayed Patient Notification Workflow Specification

Status: DRAFT — not yet approved for implementation
Date: 29 May 2026
Author: Paul Alejo / Claude Code

---

## 1. Product objective

When a Midland Sleep staff member changes a patient supply request status, the patient should
receive a timely, safe notification by email. The notification must:

- be delayed by 30 minutes from the status change to give staff time to correct accidental changes
- be automatically cancelled and rescheduled if admin changes status again before the delay expires
- contain only patient-safe information (no funding amounts, no NHI, no admin estimates)
- respect the patient's stated contact preference
- produce a full audit trail without storing message content in the audit log

This is not a real-time notification system. It is a delayed, fire-and-cancel queue.

---

## 2. User story

**As a Midland Sleep patient**, when my supply request status changes to Approved, Sent,
Declined, or Needs Follow-Up, I want to receive an email within 30–60 minutes so I know what
to expect next — without having to keep refreshing the portal.

**As a Midland Sleep staff member**, when I accidentally change a request status, I want a
correction window (30 minutes) before the patient is contacted, so I can update the status without
the patient receiving a confusing or incorrect notification.

---

## 3. Status-to-notification rules

Only the following status transitions trigger a notification schedule:

| Status changed to | Notification triggered | Reason |
|-------------------|----------------------|--------|
| `approved`        | Yes, after delay     | Patient needs to know supply is confirmed |
| `declined`        | Yes, after delay     | Patient needs to know to call clinic |
| `needs_followup`  | Yes, after delay     | Patient needs to know staff will contact them |
| `sent`            | Yes, after delay     | Patient can expect delivery |
| `new`             | No                   | Staff-internal — request just arrived |
| `reviewing`       | No                   | Internal review state, no action required by patient |
| `delivered`       | No (Phase 2E)        | Reserved for Phase 3 survey/feedback trigger |

The funding review flag (`needs_funding_review`) is an internal staff signal. It never triggers
a patient notification.

---

## 4. Delay, cancel, and reschedule behaviour

### 4.1 On status change

When an admin changes a request status to one of the notification-eligible statuses:

1. Check whether a pending scheduled notification exists for this `order_id`.
2. If a pending notification exists, cancel it:
   - Delete or disable the EventBridge Scheduler rule
   - Write a `NOTIFICATION_CANCELLED` audit event
   - Update the notification record: `cancelled_at`, `cancelled_reason: "status_changed_before_send"`
3. Create a new scheduled notification record in DynamoDB with `scheduled_for = now + 30 minutes`.
4. Create a new EventBridge Scheduler rule targeting a notification Lambda, firing at `scheduled_for`.
5. Write a `NOTIFICATION_SCHEDULED` audit event.

### 4.2 On status change to a non-notifiable status

If admin changes status to `new`, `reviewing`, or `delivered`:

1. Check whether a pending scheduled notification exists for this `order_id`.
2. If a pending notification exists, cancel it (same cancel flow as 4.1 step 2).
3. Do not schedule a new notification.
4. Write a `NOTIFICATION_CANCELLED` audit event.

### 4.3 On scheduler fire (30 min elapsed)

1. The notification Lambda is invoked with `order_id` and `notification_id`.
2. Lambda fetches the notification record from DynamoDB.
3. If `cancelled_at` is set — stop, do not send. (Safety guard against race conditions.)
4. Fetch the current order record from DynamoDB.
5. If current order status no longer matches the notification's `target_status` — stop, do not send.
   Write a `NOTIFICATION_SKIPPED` audit event with reason `status_mismatch`.
6. Resolve patient email address (see Section 6.3).
7. If no email address available — write `NOTIFICATION_FAILED` audit event with reason
   `no_email_address`. Do not retry automatically; flag for staff review.
8. Check `contact_preference` on the order record. If `contact_preference === "phone"`, cancel the
   notification gracefully and write `NOTIFICATION_SKIPPED` with reason `contact_preference_phone`.
9. Send email via SES with the patient-safe template for the current status.
10. Write `NOTIFICATION_SENT` audit event.
11. Update notification record: `sent_at`, `status: "sent"`.

### 4.4 Timing configuration

| Environment | Delay      | How set |
|-------------|-----------|--------|
| Production  | 30 minutes | `NOTIFICATION_DELAY_SECONDS=1800` env var |
| Testing     | 5 minutes  | `NOTIFICATION_DELAY_SECONDS=300` env var |
| Dev/local   | 1 minute   | `NOTIFICATION_DELAY_SECONDS=60` env var |

The Lambda and scheduler creation code must read from this env var, not a hardcoded value.

---

## 5. Patient-safe message templates

All templates must satisfy:

- No funding dollar amounts (no `estimated_amount`, `estimated_funded_amount`, `estimated_patient_copay`)
- No entitlement balance figures
- No NHI (no raw, hashed, or encrypted NHI)
- No admin-only review notes or flags
- No clinical promises or clinical advice
- No admin estimates or Phase 3 placeholder text
- Plain language; no jargon
- Clear next step for the patient

### 5.1 Approved

```
Subject: Your supply request has been approved — Midland Sleep

Hi [patient_name],

Your supply request ([request_reference]) has been approved by our team.

We'll prepare your supplies and contact you if we need any further information.
You can check the status of your request at any time in the Midland Sleep patient portal.

If you have any questions, please contact us at [clinic_phone] or reply to this email.

Midland Sleep
```

### 5.2 Sent

```
Subject: Your supplies have been dispatched — Midland Sleep

Hi [patient_name],

Great news — your supply request ([request_reference]) has been dispatched.

Please allow 2–3 business days for delivery. If you have not received your supplies
after 5 business days, please contact us at [clinic_phone].

You can check the status of your request in the Midland Sleep patient portal.

Midland Sleep
```

### 5.3 Declined

```
Subject: Your supply request — Midland Sleep

Hi [patient_name],

We were unable to approve your recent supply request ([request_reference]) through the portal.

Please contact our team directly to discuss your options:
Phone: [clinic_phone]
Or reply to this email.

We're here to help and will work with you to find the best path forward.

Midland Sleep
```

### 5.4 Needs Follow-Up

```
Subject: We need to follow up on your supply request — Midland Sleep

Hi [patient_name],

Our team needs to follow up with you about your supply request ([request_reference]).

Please contact us at your earliest convenience:
Phone: [clinic_phone]
Or reply to this email.

Midland Sleep
```

### Template variables

| Variable            | Source                          | Notes |
|---------------------|---------------------------------|-------|
| `[patient_name]`    | `ReorderRecord.patient_name`    | First name if possible; full name as fallback |
| `[request_reference]` | `ReorderRecord.request_reference` | e.g. REQ-749418-A |
| `[clinic_phone]`    | Clinic config / env var         | Not from DynamoDB record |

No template variable should reference funding, entitlement, NHI, estimates, or admin notes.

---

## 6. Data model proposal

### 6.1 Notifications table

Table name: `midland-sleep-notifications`

| Attribute              | Type    | Notes |
|------------------------|---------|-------|
| `pk`                   | String  | `NOTIF#<uuid>` |
| `sk`                   | String  | `NOTIFICATION` |
| `id`                   | String  | UUID |
| `order_id`             | String  | References `ReorderRecord.id` |
| `org_id`               | String  | `midland-sleep` |
| `patient_msid`         | String  | For audit linking |
| `patient_id`           | String  | Cognito user sub — used to resolve email |
| `target_status`        | String  | Status that triggered the schedule |
| `notification_status`  | String  | `pending` \| `sent` \| `cancelled` \| `failed` \| `skipped` |
| `scheduler_name`       | String  | EventBridge Scheduler rule name |
| `scheduled_for`        | String  | ISO timestamp |
| `created_at`           | String  | ISO timestamp |
| `created_by`           | String  | Admin Cognito sub |
| `created_by_email`     | String  | Admin email |
| `sent_at`              | String  | ISO timestamp (set on send) |
| `cancelled_at`         | String  | ISO timestamp (set on cancel) |
| `cancelled_reason`     | String  | `status_changed_before_send` \| `status_changed_to_non_notifiable` |
| `skipped_reason`       | String  | `status_mismatch` \| `contact_preference_phone` \| `no_email_address` |
| `failed_at`            | String  | ISO timestamp (set on failure) |
| `failure_reason`       | String  | Sanitized error description |
| `attempt_count`        | Number  | How many send attempts (max 1 for Phase 2E) |

GSI on `order_id` (to check for existing pending notifications quickly).

**Not stored:** email body content, patient email address, NHI, dollar amounts, admin notes.

### 6.2 EventBridge Scheduler naming convention

Scheduler rule names must be deterministic and unique per notification:

```
midland-notif-{org_id}-{order_id}-{notification_id}
```

Example: `midland-notif-midland-sleep-abc123-def456`

This allows the cancel flow to build the rule name from `order_id` and `notification_id`
without an additional lookup.

### 6.3 Patient email address resolution

`ReorderRecord` does not store a patient email address. Two options:

**Option A (recommended for Phase 2E):** At order creation time (`POST /api/patient/reorder`),
capture the patient's Cognito email claim from the verified JWT and store it on the
`ReorderRecord` as `patient_email`. This email is confirmed by Cognito and is available at
creation time with no extra API call at notification time.

**Option B (fallback):** At notification send time, look up the patient in Cognito using
`patient_id` (Cognito sub) via `AdminGetUser`. This requires IAM permission for
`cognito-idp:AdminGetUser` in the Lambda execution role, adds latency, and introduces
a Cognito dependency at send time.

Option A is preferred because it removes the Cognito runtime dependency from the notification
Lambda and is simpler to test.

**Important:** `patient_email` on `ReorderRecord` is internal infrastructure only. It must
never be returned in the patient API response (`GET /api/patient/reorder`) or the admin
orders API (`GET /api/admin/orders`). It is used only by the notification system.

### 6.4 Existing ReorderRecord fields used

The notification system reads but does not write to:

- `ReorderRecord.id` — order lookup
- `ReorderRecord.patient_id` — email resolution (Option B) or cross-check
- `ReorderRecord.patient_msid` — audit events
- `ReorderRecord.patient_name` — email template variable
- `ReorderRecord.request_reference` — email template variable
- `ReorderRecord.status` — final status check before send
- `ReorderRecord.contact_preference` — gate for phone-only patients

---

## 7. Audit and comms logging rules

Every notification lifecycle event writes an audit record to `midland-sleep-audit`.

| Event type                  | When                                    |
|-----------------------------|-----------------------------------------|
| `NOTIFICATION_SCHEDULED`    | When a new notification is queued       |
| `NOTIFICATION_CANCELLED`    | When a pending notification is cancelled |
| `NOTIFICATION_SENT`         | When email is successfully handed to SES |
| `NOTIFICATION_FAILED`       | When send attempt fails (SES error, no email) |
| `NOTIFICATION_SKIPPED`      | Status mismatch or contact preference gate |

### Audit event fields (all events)

| Field             | Value |
|-------------------|-------|
| `event_type`      | One of the five types above |
| `category`        | `Notifications` |
| `org_id`          | `midland-sleep` |
| `order_id`        | The request ID |
| `notification_id` | UUID from the notification record |
| `patient_msid`    | Patient MSID |
| `result`          | `success` or `failure` |
| `details`         | Safe, human-readable summary (see below) |
| `timestamp`       | ISO |

### Audit details field (patient-safe)

`NOTIFICATION_SCHEDULED`: `Notification scheduled for status: approved, delivery in 30 minutes.`
`NOTIFICATION_CANCELLED`: `Notification cancelled — reason: status_changed_before_send.`
`NOTIFICATION_SENT`: `Notification sent successfully for status: approved.`
`NOTIFICATION_FAILED`: `Notification failed — reason: no_email_address.`
`NOTIFICATION_SKIPPED`: `Notification skipped — reason: contact_preference_phone.`

### What must never appear in audit logs

- Email body content or subject line content
- Patient email address
- Patient NHI (raw, hashed, or encrypted)
- Dollar amounts (estimated_amount, funded_amount, copay)
- Admin notes or review reasons
- Cognito tokens or secrets

---

## 8. Failure handling

### 8.1 SES delivery failure

If SES returns an error:

1. Write `NOTIFICATION_FAILED` audit event with sanitized error description.
2. Update notification record: `failed_at`, `failure_reason`, `attempt_count`.
3. Do not retry automatically in Phase 2E. Manual retry or staff outreach is the fallback.
4. Phase 3 may introduce retry logic with exponential backoff (max 3 attempts).

### 8.2 Missing email address

If `patient_email` is not on the record and Cognito lookup fails:

1. Write `NOTIFICATION_FAILED` with `failure_reason: "no_email_address"`.
2. Consider a staff-visible flag or alert for manual follow-up (Phase 3 scope).

### 8.3 Lambda invocation failure

If the EventBridge Scheduler cannot invoke the Lambda:

1. EventBridge Scheduler has built-in retry. Configure max 2 retries with dead-letter queue.
2. DLQ events should write a `NOTIFICATION_FAILED` audit event via a separate DLQ processor Lambda.
3. Do not write duplicate send attempts. The notification record's `attempt_count` gates this.

### 8.4 Status mismatch at send time

If the current order status no longer matches `target_status` when the Lambda fires:

1. Write `NOTIFICATION_SKIPPED` with `reason: status_mismatch`.
2. Do not send.
3. This is the expected outcome of a cancelled-and-rescheduled sequence.

### 8.5 Double-send guard

Before sending, always check:
- `notification_record.notification_status !== "sent"`
- `notification_record.notification_status !== "cancelled"`
- `notification_record.cancelled_at` is not set
- Current order status matches `target_status`

All four checks must pass before SES send is invoked.

---

## 9. Admin visibility requirements

### 9.1 Audit log (existing `/admin/audit` page)

The five `NOTIFICATION_*` event types should appear in the audit log viewer with the same table
format as existing `REQUEST_STATUS_UPDATED` events. No additional UI required for Phase 2E.

### 9.2 Admin orders page

No changes required to the admin orders work queue for Phase 2E.

An optional future enhancement (Phase 3) would add a "Notified" indicator on order rows where
`NOTIFICATION_SENT` has been recorded.

### 9.3 Staff correction window reminder

No UI prompt is required for Phase 2E. The 30-minute delay is the implicit window.

A Phase 3 improvement could show a "Notification pending in X minutes — undo?" toast on status
change, but this is not required for the notification system to function.

---

## 10. Out of scope

The following are explicitly not part of Phase 2E:

- **SMS / text message notifications.** Only email. SMS requires a separate provider integration,
  opt-in compliance, and number storage — a distinct future scope item.
- **Automatic approval.** No status is changed automatically based on notification outcome.
- **Inventory or fulfilment.** Notification does not trigger picking, packing, or dispatch.
- **Payment or checkout.** Notification does not create invoices, charges, or payment links.
- **Post-delivery survey or NPS.** Delivered status does not trigger a notification in Phase 2E.
  This is reserved for a later survey/feedback phase.
- **Unsubscribe flow.** Phase 2E uses a simple reply-to address. Full unsubscribe management
  (CAN-SPAM / Spam Act compliance) must be scoped and approved before production email volume grows.
- **Notification preferences UI.** Patients cannot configure notification types in Phase 2E.
  The only gate is the existing `contact_preference` field (phone vs. email).
- **Clinical advice or clinical decision-making** in any notification content.
- **Patient email address change.** Admin cannot update a patient's email via the portal in Phase 2E.
- **Rich HTML email templates.** Plain-text or simple HTML is sufficient for Phase 2E.
  A branded email design pass can happen separately.
- **Real-time / websocket notifications.** Push to patient browser is a Phase 3 scope item.

---

## 11. Implementation options

### Option A: EventBridge Scheduler (recommended)

**How it works:**
- On status change, create an EventBridge Scheduler one-time schedule targeting a Lambda.
- Store the scheduler rule name in the notification record.
- On cancel, delete the EventBridge Scheduler rule by name.
- On fire, Lambda performs final safety checks and sends via SES.

**Pros:**
- Native AWS managed timing — no polling, no cron Lambda.
- Rules are individually addressable (create, update, delete by name).
- Sub-minute precision. Scales without operational overhead.
- IAM-controlled. Works with existing Midland AWS account.
- Dead-letter queue available per schedule.

**Cons:**
- Requires IAM permissions: `scheduler:CreateSchedule`, `scheduler:DeleteSchedule`,
  `lambda:InvokeFunction` for the scheduler execution role.
- EventBridge Scheduler has a cost per schedule (currently $1 per million schedules invocations).
  At Midland's current scale, cost is negligible.
- If the Lambda function ARN or IAM role changes, existing schedules may break.

**Required infrastructure:**
- EventBridge Scheduler execution role (IAM role with `lambda:InvokeFunction`)
- Notification Lambda (Node.js, ~100 lines, reads env vars for delay and clinic config)
- DLQ (SQS) for failed Lambda invocations
- `midland-sleep-notifications` DynamoDB table
- SES verified sending identity for `@midlandsleep.co.nz`

### Option B: Step Functions Express Workflow with Wait State

**How it works:**
- On status change, start a Step Functions execution with a `Wait` state for 30 minutes.
- On cancel, send a `StopExecution` to the running workflow.
- After wait, workflow transitions to a `Send` state.

**Pros:**
- Visual workflow in AWS console — easier to debug.
- Cancellation is `StopExecution` — no separate cancel lookup required.
- Built-in retry and error handling.

**Cons:**
- Step Functions Express Workflows have a max duration of 5 minutes. Standard Workflows must be used.
- Standard Workflows are more expensive than EventBridge Scheduler for simple delays.
- More complex infrastructure to provision and maintain.
- Overkill for a single delayed email.

### Option C: DynamoDB TTL + Stream + Lambda (polling)

**How it works:**
- Set a TTL on the notification record for `now + 30 minutes`.
- A DynamoDB Stream triggers a Lambda on item expiry.
- Lambda sends the email.

**Cons:**
- DynamoDB TTL deletion is not precisely timed (can fire up to 48 hours late in worst case).
- TTL-triggered events are DELETE events on a stream — cancellation requires an additional
  "cancelled" flag rather than removing the notification record.
- Timing is unreliable for a patient-facing workflow.

**Not recommended.** TTL precision is not suitable for time-sensitive patient communications.

---

## 12. Recommended implementation path

### Phase 2E implementation (recommended)

**Architecture:** EventBridge Scheduler + Notification Lambda + DynamoDB notifications table + SES

**Steps (in order):**

1. **Data model** — Add `patient_email` to `ReorderRecord`. Capture from JWT at order creation.
   Add to `createReorderRequest` only. Never return in patient or admin API responses.

2. **DynamoDB table** — Create `midland-sleep-notifications` table with the schema in Section 6.1.
   Add GSI on `order_id`. IaC via CDK or manual creation — document the ARN in Midland OS.

3. **SES setup** — Verify sending domain `midlandsleep.co.nz` in SES. Move out of SES sandbox
   (requires AWS support request). Configure sending identity. Test with internal address first.

4. **Notification Lambda** — Small Node.js Lambda. Reads `NOTIFICATION_DELAY_SECONDS` and
   `CLINIC_PHONE` from env vars. Fetches notification + order records. Performs safety checks
   (Section 4.3). Sends via SES. Writes audit event. Updates notification record.

5. **EventBridge Scheduler IAM role** — Create execution role with `lambda:InvokeFunction`
   permission for the notification Lambda. Store ARN in env vars.

6. **PATCH `/api/admin/orders` integration** — After successful status update, call a
   `scheduleNotification(orderId, newStatus, adminSub, adminEmail)` helper function.
   Helper handles: lookup existing pending notification, cancel if exists, create new if
   status is notifiable, write audit events. Failure of this helper must not block the
   status update response — log the error but return `{ ok: true }` regardless.

7. **Audit log integration** — `NOTIFICATION_*` events appear in existing `/admin/audit` view
   automatically (no UI changes required).

8. **Testing** — Test with `NOTIFICATION_DELAY_SECONDS=60`. Create a request, change status
   to `approved`, confirm `NOTIFICATION_SCHEDULED` audit event, wait 60 seconds, confirm
   `NOTIFICATION_SENT` audit event and email received. Then test cancel: change status again
   before delay, confirm `NOTIFICATION_CANCELLED` + new `NOTIFICATION_SCHEDULED`.

### Sequencing note

Steps 1 (data model) and 3 (SES setup) can be done in parallel. SES sandbox exit should be
initiated early as it requires an AWS support request and may take 24–48 hours.

Steps 4, 5, 6 require Step 2 (table) and Step 3 (SES) to be complete.

### Pre-implementation decisions required from Midland

Before implementation begins, the following must be confirmed with the Midland product owner:

1. Confirm patient email capture at order creation is acceptable (Option A in Section 6.3).
2. Confirm `contact_preference === "phone"` suppresses email notifications completely.
3. Confirm the reply-to address for patient email responses (e.g. `hello@midlandsleep.co.nz`).
4. Confirm the clinic phone number to include in templates.
5. Confirm whether a 30-minute delay is acceptable, or if a different window is preferred.
6. Confirm unsubscribe/opt-out handling is acceptable as a Phase 3 item (acknowledging
   NZ Unsolicited Electronic Messages Act obligations for transactional vs marketing email).
7. Confirm SES sending domain and DNS access to verify `midlandsleep.co.nz`.
