# Phase 2 Support and Next Phase Recommendations

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-19

---

## Phase 2 is closed

Phase 2 delivered the Admin Operations command centre and the Patient Communication infrastructure. The branch is stable, Amplify-deployed, and TypeScript-clean.

The recommended next step is a Midland staff walkthrough using the demo script (`phase-2-demo-script.md`) to collect operational feedback before any further development begins.

---

## Ongoing support options

### Defect support

Issues that are regressions from Phase 2 functionality (something that worked and now does not) are covered under the closeout period. Report via the agreed channel with a reproduction step and the browser console output.

### Change requests

Any request to add new functionality — including items on the Known Limitations list — is new scope. This includes:
- Selected-patient multi-select targeting
- Server-side read receipts for notices
- Email or SMS delivery
- Notice analytics
- PWA or push notifications

Change requests should be discussed and estimated before work begins.

---

## Recommended next phases

The following phases are recommended in priority order based on operational value and build dependency. Each should be scoped and estimated as a separate engagement.

---

### Phase 3A — Patient Mobile Access + PWA Readiness

**What this adds:**

- Progressive Web App (PWA) shell — installable on iOS and Android home screen
- Offline-capable page cache for the dashboard and status card
- Push notification infrastructure (browser push, opt-in)
- Mobile layout audit and touch target review

**Why now:**

Most patients will access the portal from a mobile device. The current portal is responsive but not installable or push-capable. Phase 3A closes the gap between a web app and a native-feeling patient experience.

**Dependencies:** None — builds on the existing portal.

---

### Phase 3B — Product Catalogue

**What this adds:**

- Admin-managed product catalogue (items, categories, descriptions, images)
- Patient-facing catalogue browsing (view only)
- Item metadata: funded status, ACC/PHO eligibility indicator, co-pay indicator
- Foundation for entitlement-aware ordering in Phase 3C

**Why now:**

The current supply request form uses a hardcoded item list. A managed catalogue gives the clinic control over what patients can request and supports the entitlement logic that Phase 3C requires.

**Dependencies:** None — standalone admin + patient feature.

---

### Phase 3C — Entitlement-Aware Request Form

**What this adds:**

- Patient supply request form rebuilt against the product catalogue
- Entitlement balance displayed inline (funded amount, estimated co-pay)
- Optional accessories with patient-side cost visibility
- Funding explanation copy (ACC, PHO)
- Admin-side order review with entitlement context

**Why now:**

This is the highest-value commercial feature. It moves the portal from a "contact us to request supplies" workflow to a self-service, entitlement-informed supply request. It prepares the foundation for payment in Phase 4.

**Dependencies:** Phase 3B (catalogue).

---

### Phase 3D — Admin Fulfilment Console

**What this adds:**

- Admin-side fulfilment workflow: pick, pack, dispatch
- Packing slip generation
- Courier reference field and tracking number storage
- Status automation triggers on dispatch confirmation

**Why now:**

Currently the "Sent" status is updated manually. Phase 3D gives staff an end-to-end fulfilment interface that reduces manual coordination and provides a dispatch audit trail.

**Dependencies:** Phase 3B (catalogue), Phase 3C (order form).

---

### Phase 4 — Inventory and Entitlement Sync

**What this adds:**

- Stock reservation on request submission
- Inventory deduction on dispatch
- ACC/PHO entitlement balance deduction on fulfilment
- Balance reconciliation reporting
- Integration with external inventory/PMS if applicable

**Why now:**

Once Phase 3 is delivering self-service orders, inventory accuracy becomes critical. Phase 4 closes the loop between patient ordering and stock management.

**Dependencies:** Phase 3B, 3C, 3D.

---

## Pricing note

Each phase above should be scoped and estimated separately. As a reference frame:

| Phase | Indicative range (NZD excl. GST) |
|---|---|
| 3A — PWA Readiness | $4,000–$8,000 |
| 3B — Product Catalogue | $5,000–$10,000 |
| 3C — Entitlement Request Form | $10,000–$20,000 |
| 3D — Fulfilment Console | $8,000–$15,000 |
| 4 — Inventory + Entitlement Sync | $15,000–$30,000 |

Ranges depend on scope decisions made during discovery. Monthly retainer arrangements are available as an alternative to per-phase fixed pricing.

---

## Recommended conversation order

1. Staff walkthrough using `phase-2-demo-script.md`
2. Collect operational feedback — identify what's blocking daily workflow
3. Agree Phase 3A or 3B start date
4. Scope and estimate the agreed next phase
5. Begin next sprint

Do not start Phase 3 without the staff walkthrough. Operational feedback will shape which phase delivers the most value first.
