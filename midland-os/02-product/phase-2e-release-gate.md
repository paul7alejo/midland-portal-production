# Phase 2E — Pre-Implementation Release Gate Checklist

Status: AWAITING MIDLAND APPROVAL
Date: 29 May 2026
Spec reference: `midland-os/02-product/phase-2e-delayed-notification-spec.md`

Implementation must not begin until every Go item in this checklist is confirmed.

---

## Go / No-Go Checklist

Each item requires a named decision-maker and a written confirmation date before the corresponding
implementation step proceeds.

Legend: ✅ Go | ❌ No-Go | ⏳ Awaiting confirmation

---

### 1. Midland business approval

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 1.1 | Midland product owner has reviewed and approved the Phase 2E spec in full | ⏳ | Midland |
| 1.2 | Midland is aware that patient email addresses will be stored on order records at creation time | ⏳ | Midland |
| 1.3 | Midland confirms email notification is the correct channel for patient contact at this stage | ⏳ | Midland |
| 1.4 | Midland confirms the 30-minute staff correction window is acceptable | ⏳ | Midland |
| 1.5 | Midland confirms they have authority to send transactional email to patients (no outstanding opt-in or Privacy Act obligations that would block this) | ⏳ | Midland |

**All five must be Go before any implementation code is written.**

---

### 2. Message template approval

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 2.1 | Approved template reviewed and approved for the `approved` status | ⏳ | Midland |
| 2.2 | Sent template reviewed and approved | ⏳ | Midland |
| 2.3 | Declined template reviewed and approved | ⏳ | Midland |
| 2.4 | Needs Follow-Up template reviewed and approved | ⏳ | Midland |
| 2.5 | All templates confirmed to contain no funding dollar amounts | ⏳ | Paul / Midland |
| 2.6 | All templates confirmed to contain no NHI, entitlement balances, or admin-only estimates | ⏳ | Paul / Midland |
| 2.7 | Clinic phone number confirmed for inclusion in Declined and Needs Follow-Up templates | ⏳ | Midland |
| 2.8 | Reply-to email address confirmed (e.g. hello@midlandsleep.co.nz) | ⏳ | Midland |

**All eight must be Go before template implementation begins.**

---

### 3. Sender email and domain

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 3.1 | Sending domain confirmed (expected: midlandsleep.co.nz) | ⏳ | Midland |
| 3.2 | Midland has DNS access to add SES verification records (CNAME / TXT / DKIM) | ⏳ | Midland |
| 3.3 | Sending email address confirmed (e.g. noreply@midlandsleep.co.nz or hello@midlandsleep.co.nz) | ⏳ | Midland |
| 3.4 | SES domain verification has been initiated (can run in parallel with other steps) | ⏳ | Paul |
| 3.5 | SES production access (sandbox exit) has been requested from AWS Support | ⏳ | Paul |
| 3.6 | SES sandbox exit has been granted (AWS Support typically takes 24–48 hours) | ⏳ | AWS / Paul |

**Gates 3.1–3.3 are Midland decisions. Gates 3.4–3.6 are Paul actions after 3.1–3.3 are confirmed.**
**3.6 must be Go before any live patient email is sent.**

---

### 4. Email provider decision

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 4.1 | AWS SES confirmed as the email provider for Phase 2E | ⏳ | Midland / Paul |
| 4.2 | If SES is rejected: alternative provider (SendGrid, Postmark, etc.) named and approved | N/A | Midland |
| 4.3 | Email sending cost is understood and accepted (SES: ~$0.10/1,000 emails at Midland scale ≈ negligible) | ⏳ | Midland |

**SES is the recommended path. Confirm or explicitly choose an alternative before build starts.**

---

### 5. Patient email address source

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 5.1 | Confirmed: `patient_email` will be captured from the Cognito JWT at order creation time and stored on the order record | ⏳ | Midland / Paul |
| 5.2 | Confirmed: `patient_email` will never be returned in the patient portal API response or the admin orders API response | ⏳ | Paul |
| 5.3 | Confirmed: `patient_email` on the order record is an internal infrastructure field, not a user-editable profile field | ⏳ | Midland |
| 5.4 | Confirmed: if a patient changes their email in Cognito after submitting a request, the stored email on existing orders is not updated (accepted limitation for Phase 2E) | ⏳ | Midland |

**5.1 is the architectural decision. If rejected, Option B (Cognito AdminGetUser at send time) must be explicitly selected instead. All four must be confirmed before the order creation API is touched.**

---

### 6. Notification delay setting

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 6.1 | Production delay confirmed: 30 minutes (1800 seconds) | ⏳ | Midland |
| 6.2 | Confirmed: delay is configurable via `NOTIFICATION_DELAY_SECONDS` env var, not hardcoded | ⏳ | Paul |
| 6.3 | Test environment delay confirmed: 5 minutes (300 seconds) | ⏳ | Paul |
| 6.4 | Dev/local delay confirmed: 1 minute (60 seconds) | ⏳ | Paul |

**6.1 is the only Midland decision. Others are implementation config.**

---

### 7. Testing mode

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 7.1 | Test email address for internal notification testing confirmed (e.g. paul7alejo@gmail.com or a Midland internal address) | ⏳ | Paul / Midland |
| 7.2 | Confirmed: real patient addresses will not be used during test-mode sends | ⏳ | Paul |
| 7.3 | Test scenario documented and walkthrough plan agreed before go-live: submit request → change status → wait delay → verify email received → test cancel flow | ⏳ | Paul / Midland |
| 7.4 | Confirmed: at least one Midland staff member will participate in test walkthrough before production notifications are enabled | ⏳ | Midland |

---

### 8. Failure monitoring and ownership

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 8.1 | Named owner for `NOTIFICATION_FAILED` audit events — who checks and follows up | ⏳ | Midland |
| 8.2 | Named owner for Lambda / EventBridge failures (DLQ alerts) | ⏳ | Paul |
| 8.3 | Agreed protocol when a notification fails and patient was not contacted: staff manual follow-up is the fallback for Phase 2E | ⏳ | Midland |
| 8.4 | CloudWatch alarm or Amplify monitoring for Lambda error rate agreed | ⏳ | Paul |
| 8.5 | Confirmed: no automatic retry in Phase 2E; manual follow-up is acceptable as failure handling | ⏳ | Midland |

**8.1 and 8.3 are Midland decisions. 8.2, 8.4 are Paul actions. 8.5 is a Midland acceptance.**

---

### 9. Data and privacy boundaries

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 9.1 | Confirmed: email body content is never stored in DynamoDB or audit logs | ⏳ | Paul |
| 9.2 | Confirmed: patient email address is never stored in audit logs | ⏳ | Paul |
| 9.3 | Confirmed: NHI is never included in notification content or logs | ⏳ | Paul |
| 9.4 | Confirmed: funding dollar amounts are never included in notification content or logs | ⏳ | Paul |
| 9.5 | Midland confirms patient email address storage on order records is acceptable under their privacy obligations (NZ Privacy Act 2020) | ⏳ | Midland |
| 9.6 | Midland confirms transactional email to patients does not require additional consent under the NZ Unsolicited Electronic Messages Act 2007 — or that existing patient consent covers this use | ⏳ | Midland |
| 9.7 | Unsubscribe / opt-out handling is explicitly deferred to Phase 3 — Midland accepts this limitation for Phase 2E volume | ⏳ | Midland |

**9.5, 9.6, 9.7 are Midland/legal decisions. 9.1–9.4 are Paul implementation commitments. All seven must be confirmed before live patient emails are sent.**

---

### 10. Audit and comms logging requirements

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 10.1 | Confirmed: five audit event types are sufficient: `NOTIFICATION_SCHEDULED`, `NOTIFICATION_CANCELLED`, `NOTIFICATION_SENT`, `NOTIFICATION_FAILED`, `NOTIFICATION_SKIPPED` | ⏳ | Paul / Midland |
| 10.2 | Confirmed: `NOTIFICATION_*` events will appear in the existing `/admin/audit` viewer with no new UI required for Phase 2E | ⏳ | Midland |
| 10.3 | Confirmed: audit event `details` field contains only safe status descriptions, not message content | ⏳ | Paul |
| 10.4 | Midland has reviewed and accepted the audit-first policy: the audit event is written before the notification is sent | ⏳ | Midland |

---

### 11. Rollback plan

| # | Gate | Status | Owner |
|---|------|--------|-------|
| 11.1 | Rollback plan documented: disable `NOTIFICATIONS_ENABLED` env var → all new schedules are suppressed immediately; in-flight schedules continue until they fire or are cancelled manually | ⏳ | Paul |
| 11.2 | Rollback plan documented: if a wave of incorrect notifications is sent, staff manual outreach is the recovery path (no unsend capability exists in SES) | ⏳ | Midland |
| 11.3 | Confirmed: `NOTIFICATIONS_ENABLED` feature flag will be added and default to `false` on first deploy | ⏳ | Paul |
| 11.4 | Midland accepts that sent emails cannot be recalled once delivered to the patient's inbox | ⏳ | Midland |
| 11.5 | Midland has a brief comms plan if patients receive an incorrect notification (e.g. "we sent this in error — please disregard and contact us") | ⏳ | Midland |

**11.4 and 11.5 are critical Midland acceptances. No recovery path exists for a sent email. The 30-minute delay is the only protection.**

---

### 12. Out-of-scope confirmation

| # | Item explicitly out of scope for Phase 2E | Midland confirms |
|---|------------------------------------------|-----------------|
| 12.1 | SMS / text message notifications | ⏳ |
| 12.2 | Automatic approval based on notification outcome | ⏳ |
| 12.3 | Inventory or fulfilment triggered by notification | ⏳ |
| 12.4 | Payment or checkout linked to notification | ⏳ |
| 12.5 | Post-delivery survey or NPS trigger | ⏳ |
| 12.6 | Unsubscribe / opt-out management UI | ⏳ |
| 12.7 | Patient notification preferences UI | ⏳ |
| 12.8 | Clinical advice in notification content | ⏳ |
| 12.9 | Real-time push / websocket notifications | ⏳ |
| 12.10 | Rich HTML / branded email template design | ⏳ |
| 12.11 | Patient email address change via admin portal | ⏳ |

**Midland must confirm this list. Any item marked as in-scope triggers a change request and scope discussion before implementation proceeds.**

---

## Open decisions table

| # | Decision | Options | Owner | Blocking which gate |
|---|----------|---------|-------|-------------------|
| D1 | Production delay: 30 min or different | 30 min / 15 min / 60 min | Midland | 6.1 |
| D2 | Sending address | noreply@midlandsleep.co.nz vs hello@midlandsleep.co.nz | Midland | 3.3 |
| D3 | Reply-to address | hello@midlandsleep.co.nz or shared mailbox | Midland | 2.8 |
| D4 | patient_email storage: capture at creation vs lookup at send time | Option A (capture at creation) vs Option B (Cognito lookup) | Midland / Paul | 5.1 |
| D5 | Test walkthrough participant from Midland | Named staff member | Midland | 7.4 |
| D6 | Failure follow-up owner | Named Midland staff member | Midland | 8.1 |
| D7 | NZ Unsolicited Electronic Messages Act compliance | Transactional email accepted / additional consent required | Midland / legal | 9.6 |
| D8 | Email provider | AWS SES (recommended) vs alternative | Midland / Paul | 4.1 |

---

## Risks table

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Patient receives notification for a status that admin corrected after 30 min window | Low — 30-min window is generous for correction | High — patient confusion | Staff awareness of correction window; clear template copy; 11.5 comms plan |
| R2 | SES sandbox exit denied or delayed by AWS Support | Low — sandbox exit is routine for legitimate transactional email | Medium — delays go-live | Request sandbox exit early, in parallel with other gates |
| R3 | `patient_email` stored at creation but patient has since changed email in Cognito | Low — uncommon at Midland's current scale | Low — patient may receive email to old address | Accepted limitation for Phase 2E; Phase 3 may add email sync |
| R4 | NZ Unsolicited Electronic Messages Act 2007 — patients did not explicitly opt in to status update emails | Medium — transactional emails are generally exempt, but Midland should confirm | High — legal exposure if treated as marketing | Gate 9.6 blocks implementation until Midland confirms legal position |
| R5 | Admin accidentally bulk-changes multiple requests before noticing the 30-min window | Low | High — multiple patients receive incorrect notification | Feature flag (11.3) allows instant suppression of new schedules |
| R6 | Lambda cold-start causes notification to fire late (>5 min past scheduled time) | Low — provisioned concurrency or keep-warm can mitigate | Low — slight delay acceptable | EventBridge Scheduler is precise; Lambda cold-start is milliseconds, not minutes |
| R7 | Notification Lambda deployed without `NOTIFICATIONS_ENABLED=true` causing silent drop | Low with feature flag pattern | Medium — notifications never send without staff noticing | Monitoring (8.4); explicit enable step in deployment checklist |
| R8 | Declined notification causes patient distress without adequate support contact detail | Medium — depends on template copy | High — patient welfare | Gate 2.3 requires Midland review of Declined template before implementation |
| R9 | Email sent to patient contains unexpected sensitive data due to a future code change | Low with current template approach | High — privacy breach | Templates use only 3 safe variables; code review required on any template change |
| R10 | SES sending quota exceeded during a high-volume period | Very low at current scale | Low — SES default quota is 50,000/day | Not a practical risk at Phase 2E volume |

---

## Recommended implementation sequence

This sequence assumes all Go/No-Go gates are confirmed. Steps marked **(parallel)** can run
simultaneously. Steps marked **(blocked)** cannot start until the listed gate is confirmed.

```
Step 1  (parallel) SES domain verification initiated            → gates 3.1, 3.2, 3.3 confirmed
Step 1  (parallel) SES sandbox exit requested from AWS Support  → gate 3.1 confirmed
Step 2  DynamoDB notifications table created                    → gate 1.1 confirmed
Step 3  ReorderRecord patient_email field added                 → gates 5.1, 5.2, 5.3 confirmed
        (POST /api/patient/reorder captures email from JWT)
        (GET /api/patient/reorder and GET /api/admin/orders never return patient_email)
Step 4  Notification Lambda written and deployed (disabled)     → gates 1.1, 2.1–2.8, 4.1 confirmed
Step 5  EventBridge Scheduler IAM execution role created        → gate 1.1 confirmed
Step 6  scheduleNotification() helper added to                  → steps 2–5 complete
        PATCH /api/admin/orders (non-blocking to status update)
Step 7  NOTIFICATION_* audit events wired                       → step 6 complete
Step 8  NOTIFICATIONS_ENABLED=false deployed to Amplify         → step 6 complete
Step 9  Internal test walkthrough (5-min delay, test address)   → gate 7.1–7.4 confirmed
        Verify: NOTIFICATION_SCHEDULED → wait → NOTIFICATION_SENT → email received
        Verify: cancel flow → NOTIFICATION_CANCELLED → new NOTIFICATION_SCHEDULED
        Verify: status change to non-notifiable → NOTIFICATION_CANCELLED
Step 10 Midland staff walkthrough                               → gates 7.3, 7.4 confirmed
Step 11 SES sandbox exit confirmed                              → gate 3.6
Step 12 NOTIFICATIONS_ENABLED=true deployed to production       → all gates confirmed
Step 13 Monitor first 48 hours — check audit log for
        NOTIFICATION_SENT, NOTIFICATION_FAILED, NOTIFICATION_SKIPPED
```

---

## Final recommendation

**Do not begin implementation until:**

1. Gates 1.1–1.5 (business approval) are all confirmed in writing.
2. Gates 9.5, 9.6, 9.7 (privacy / NZ Spam Act) are confirmed by Midland or their legal adviser.
3. Gates 2.1–2.8 (template approval) are confirmed — especially the Declined template (R8).
4. Gate 3.6 (SES sandbox exit) is confirmed — this has the longest lead time (24–48 hours AWS Support).

**SES sandbox exit should be requested immediately** once gates 3.1–3.3 are confirmed, since it is
the only external dependency with a variable lead time.

**The 30-minute delay and NOTIFICATIONS_ENABLED feature flag are non-negotiable.** They are the only
runtime protection against incorrect or premature patient contact. Both must be in place on first deploy.

**Implementation is low-risk at Midland's current patient volume.** The engineering work is ~3–4 days
of focused effort once all gates are confirmed. The primary risk is legal/privacy (R4) and patient
communication quality (R8). Both are Midland decisions, not engineering decisions.

**Current status: awaiting Midland confirmation of all gate items before implementation begins.**
