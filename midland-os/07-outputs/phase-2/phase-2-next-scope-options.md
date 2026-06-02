# Phase 2 Next Scope Options

## Date

2026-06-02

## Current checkpoint

The Phase 2 Admin Operations Command Centre is deployed and proofed.

Completed:
- Patient Requests command centre
- Operational KPI filters
- Filter-aware request activity chart
- Custom date range filtering
- Request Review Drawer
- Safe patient request activity view
- Portal linkage visibility
- Safe reports and exports
- Funding & Entitlement visibility-only page
- Phase 3 entitlement/checkout boundary clarified

## Recommended next move

Present the current workflow to Midland first before starting more implementation.

Next decision should be based on:
- staff feedback
- operational pain
- workflow risk
- commercial value
- Phase 3 readiness

## Option 1 — Phase 2E Delayed Patient Notifications

### Outcome

When staff update a patient request status, the patient receives a safe delayed notification email after a configurable delay.

### Why it matters

This closes the operational loop:
Patient submits request → admin reviews → status changes → patient gets update.

### Scope

- Trigger notification after status change
- Delay sending by 15–30 minutes
- Cancel/reschedule if status changes again before send
- Patient-safe message content
- Comms/audit log
- Admin visibility of notification status

### Out of scope

- SMS
- marketing automation
- clinical advice
- funding dollar exposure
- payment/checkout
- inventory dispatch logic

### Risk

Medium. Requires careful handling of patient communication, audit logging, and failed sends.

### Commercial value

High. This is a proper workflow automation feature, not UI polish.

## Option 2 — Selected Request Audit History

### Outcome

The History tab in the Request Review Drawer shows activity specific to the selected request instead of patient-wide request activity.

### Why it matters

Improves audit clarity and staff confidence.

### Scope

- Link audit events more tightly to request_id
- Filter History tab by selected request
- Keep patient-wide context optional or separate
- Preserve safe audit projection

### Out of scope

- Raw audit payload exposure
- NHI/email/phone exposure
- audit schema rewrite unless necessary

### Risk

Medium-low. Mainly data linkage and presentation.

### Commercial value

Medium. Useful for governance, less visible to patients.

## Option 3 — Phase 3 Entitlement-Aware Checkout

### Outcome

Patients can request/order CPAP supplies through an entitlement-aware checkout workflow.

### Why it matters

This is the biggest commercial feature. It moves the portal toward ordering, co-pay, accessories, and future ecommerce.

### Scope

- Product catalogue
- Entitlement-aware checkout
- Funded amount vs co-pay calculation
- Optional accessories
- Order review workflow
- Patient-safe funding explanation

### Out of scope unless separately scoped

- Stripe/payment
- inventory reservation
- supplier ordering
- multi-clinic SaaS
- rewards/referrals

### Risk

High. This touches funding logic, patient experience, ordering, and future payment flows.

### Commercial value

Very high. Should be priced as a separate Phase 3 build.

## Recommendation

Do not start Phase 3 yet.

Recommended order:
1. Midland walkthrough and feedback
2. Phase 2E delayed patient notification specification
3. Build Phase 2E only if accepted
4. Then scope Phase 3 entitlement-aware checkout separately

## Pricing note

Phase 2E should be treated as a paid workflow automation sprint, not free support.

Suggested pricing:
- NZD $4,000–$7,500 + GST for Phase 2E specification and implementation
- or include as part of a larger monthly product retainer

Phase 3 entitlement-aware checkout should be a separate build:
- NZD $15,000–$35,000 + GST depending on checkout, payment, catalogue, and order workflow scope
