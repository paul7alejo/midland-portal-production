# Phase 2 Known Limitations

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-19

This document records what Phase 2 intentionally does not include. Every item below is a deliberate scope boundary — none are bugs. All are candidates for future paid scope.

---

## Patient Notices

### Selected-patient multi-select

The "Selected patients" audience tab is visible in the admin UI with a "coming soon" state. The ability to target a list of patients by MSID or segment is not implemented. Currently only two audience types are supported: All patients and Single patient (by MSID).

**Future scope:** Phase 3+ notice multi-select and patient segment targeting.

### SMS and email delivery

Notices appear in the patient portal only. There is no outbound SMS or email delivery for any notice type. Patients must log in to the portal to see a notice.

**Future scope:** Notification channels (SMS, email) are a separate integration scope requiring SES/SNZ configuration, opt-in consent management, and compliance review.

### Server-side read receipts

Whether a patient has seen a notice is tracked locally in their browser (localStorage). If the patient clears their browser data, the badge resets. There is no server-side record of which patients have opened which notices.

**Future scope:** Server-side read receipts would require a notice-read DynamoDB table, a PATCH API endpoint, and a consent and privacy review.

### Notice analytics

There is no reporting on notice open rates, patient reach, or engagement. The admin UI shows notice status (Draft / Published / Expired / Archived) only.

**Future scope:** Notice analytics and reach reporting is a separate product telemetry scope.

---

## Patient Portal

### Progressive Web App (PWA)

The patient portal is a responsive web application. It is not installable as a PWA, does not support push notifications, and does not cache for offline use. Mobile experience relies on browser.

**Future scope:** Phase 3A — Patient Mobile Access and PWA Readiness.

### Patient notification history (multiple past requests)

The patient sees their most recent supply request only. There is no request history view showing past completed requests.

**Future scope:** Request history view is straightforward to add once the patient experience is mature.

### Patient-initiated account management

Patients cannot change their email address, phone number, or portal password through the portal. These are managed externally (Cognito, clinic staff).

---

## Fulfilment and inventory

### Inventory reservation

Submitting a supply request does not deduct stock from inventory or reserve items. The portal operates independently of any stock management system.

**Future scope:** Phase 4 — Inventory and entitlement sync.

### Courier and dispatch integration

No tracking number, courier webhook, or dispatch confirmation is integrated. "Sent" status is updated manually by admin staff.

**Future scope:** Fulfilment integration is a later phase, dependent on the courier and PMS systems Midland uses.

### Automated recurring orders

Patients must submit a new supply request manually each time. There is no automated recall or recurring order schedule.

---

## Finance and entitlement

### Checkout and payment

There is no payment flow, Stripe integration, or co-pay checkout. The portal does not process financial transactions.

**Future scope:** Phase 3C — Entitlement-Aware Request Form and Phase 3D — Admin Fulfilment Console.

### Entitlement deduction

ACC and PHO entitlement balances are visible to admin as read-only fields. Submitting a request does not deduct from any funding balance.

**Future scope:** Phase 4 — Entitlement Sync.

### Product catalogue

There is no public-facing product catalogue or item detail pages. Patients select from a fixed list of supply categories on the request form.

**Future scope:** Phase 3B — Product Catalogue.

---

## Notifications

### Patient email notifications on status change

When an admin changes a request status, no email is sent to the patient. Phase 2E (delayed patient notifications) was specified but held pending Midland decisions on sending domain, opt-in, and delay window.

**Future scope:** Phase 2E spec is complete. Implementation is gated on D1–D8 decisions captured in `midland-os/02-product/phase-2e-decision-capture.md`.

---

## Reports

### PDF export

The Download Report drawer shows PDF as a future option but only generates CSV files.

**Future scope:** PDF report generation is a low-priority addition.

### Real-time streaming counts

KPI card counts reflect the data loaded on the current page render. They do not update in real time without a page refresh.
