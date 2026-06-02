# Phase 2E Delayed Patient Notifications Specification

## Date

2026-06-02

## Objective

Define the next workflow automation slice after the Phase 2 Admin Operations Command Centre.

The goal is to notify patients safely after staff update the status of a supply request, without exposing funding dollar values, clinical notes, or internal audit details.

## Workflow

Patient submits supply request.

Admin reviews request in Patient Requests.

Admin changes status:
- reviewing
- approved
- sent
- declined
- needs_followup
- delivered

System schedules a patient notification after a configurable delay.

Recommended delay:
- 15 to 30 minutes

Reason for delay:
- Allows staff to correct accidental status changes.
- Prevents patients receiving multiple confusing updates.
- Gives the clinic a safer operational buffer.

## Notification behavior

When status changes:
1. Create notification schedule record.
2. Wait configured delay.
3. Before sending, confirm request status is still the same.
4. If status changed again, cancel old notification and schedule the newest one.
5. Send patient-safe email.
6. Record comms/audit event.

## Patient-safe email content

Allowed:
- request received
- request under review
- request approved
- request sent/dispatched
- request needs follow-up
- request declined with safe contact wording
- request completed/delivered
- clinic contact details
- next step wording

Forbidden:
- raw funding dollar values
- entitlement balance details
- NHI
- clinical notes
- internal admin comments
- raw audit data
- Cognito/user IDs
- staff-only funding estimates
- blame/clinical decision wording

## Status message examples

### approved

Subject:
Your Midland Sleep supply request has been approved

Body:
Your supply request has been approved. Midland Sleep will prepare your supplies and contact you if anything else is needed.

### sent

Subject:
Your Midland Sleep supplies are on the way

Body:
Your supplies have been marked as sent. Please contact Midland Sleep if you have any questions.

### needs_followup

Subject:
Midland Sleep will contact you about your request

Body:
Your request needs a little more follow-up. Midland Sleep will contact you with the next steps.

### declined

Subject:
Update about your Midland Sleep supply request

Body:
Your request could not be approved at this time. Please contact Midland Sleep if you would like to discuss this further.

### delivered

Subject:
Your Midland Sleep supply request is complete

Body:
Your request has been marked as complete. Please contact Midland Sleep if you still need help.

## Admin visibility

Admin should be able to see:
- notification scheduled
- notification cancelled
- notification sent
- notification failed

Do not expose email provider secrets or raw payloads.

## Data model draft

Potential table or item type:
- notification_id
- request_id
- patient_msid
- org_id
- status_at_schedule_time
- scheduled_for
- sent_at
- cancelled_at
- failed_at
- notification_status
- template_key
- created_at
- updated_at

Notification statuses:
- scheduled
- cancelled
- sent
- failed

## Implementation options

### Option A — AWS-native

Use DynamoDB + EventBridge Scheduler or Lambda polling.

Pros:
- AWS-aligned
- more production appropriate
- auditable

Cons:
- more setup
- more IAM/config complexity

### Option B — App-level scheduled worker

Use application route/cron-style trigger.

Pros:
- simpler early version
- easier to inspect

Cons:
- less robust if hosting schedule is limited
- must avoid duplicate sends carefully

## Recommended implementation

Use AWS-native scheduling if the project is moving toward production healthcare-adjacent operations.

For a controlled MVP, use the simplest reliable approach that supports:
- delay
- cancellation/reschedule
- idempotency
- audit/comms logging
- failure visibility

## Acceptance criteria

- Admin status update can schedule a delayed patient notification.
- If status changes again before send time, old notification is cancelled or ignored.
- Patient receives only the latest valid status update.
- Notification content is patient-safe.
- No funding dollar values are exposed.
- No NHI or clinical notes are exposed.
- Sent/cancelled/failed notification events are recorded.
- Failed sends do not break request status updates.
- Duplicate sends are prevented.
- Existing request workflow remains unchanged.

## Out of scope

- SMS
- marketing campaigns
- GoHighLevel automation
- payment links
- checkout
- entitlement deduction
- inventory dispatch automation
- clinical advice
- patient surveys
- rewards/referrals

## Risk notes

This feature touches patient communication. It must be scoped carefully.

Main risks:
- sending wrong status update
- duplicate emails
- exposing staff-only funding information
- notifying patient before staff correction
- no audit/comms trail
- email delivery failures

## Commercial note

This should be treated as a paid Phase 2E workflow automation sprint, not free support.

Suggested pricing:
- NZD $4,000–$7,500 + GST for specification and implementation
- higher if email provider setup, templates, retry handling, admin notification dashboard, or compliance documentation are included
