# Midland Sleep — Phase 1/2 Closeout Email Draft

> Internal draft. Review and personalise before sending.
> Remove this note block before sending.

---

**To:** [Midland Sleep contact]
**From:** Paul Alejo, OneOfZero
**Subject:** Midland Sleep Operations Portal — Phase 1 & 2 Closeout

---

Hi [Name],

I wanted to reach out formally to mark the completion of Phase 1 and Phase 2 of the Midland Sleep Operations Portal. Both phases are now technically closed out, proofed, and deployed to the current Midland environment.

---

**What we set out to build — and what it became**

When this project began, the initial brief was a patient-facing web presence. What we have delivered is significantly broader: a production operations platform purpose-built for Midland Sleep's clinical and administrative workflow.

The system now handles patient identity, supply request lifecycle, admin operations, audit-aware controls, data import with validation guardrails, and a controlled patient communication layer — all built to production standards with authentication, role enforcement, and audit logging throughout.

This is not a website update. It is the operational infrastructure for how Midland Sleep manages patients and supplies through a digital channel.

---

**Phase 1 — Production Portal Foundation**

Phase 1 established the core platform:

- Patient portal with authenticated access, dashboard, device and mask record visibility
- Supply request submission with validation, duplicate prevention, and reference tracking
- Patient status cards with status-specific content across all request states
- Admin portal with role-protected access
- Patient data import system with preview, validation, and autoclean guardrails
- Safety and audit controls: soft-delete policy, audit-first write pattern, access history
- Patient account and portal account management
- Runtime AWS infrastructure provisioned, secured, and operational

---

**Phase 2 — Admin Operations and Patient Communication Infrastructure**

Phase 2 extended the platform into operational management:

- Admin Orders command centre: full supply request lifecycle management, inline status changes, KPI filtering, PatientDrawer, report and export tools
- Admin Patients register: search, segment filtering, review workflows
- Safe reporting and CSV exports (no patient identifiers in report outputs)
- Controlled Patient Communication Layer (Patient Notices):
  - Admins can publish notices directly into the patient portal
  - Three placements: top strip, dashboard card, notification bell
  - Three priority levels: Info, Reminder, Important — with visual differentiation
  - Audience targeting: all patients or single patient by MSID
  - Duplicate publish protection: server-side conflict check prevents accidental double-publishing
  - MSID input normalisation: accepts bare digits or prefixed format
  - Bell badge awareness: unread and unseen counts tracked and displayed
  - Local seen state: badge clears after patient opens the bell (no server round-trip)
- Runtime AWS key rotation completed as part of Phase 2 security closeout

---

**Technical closeout status**

- All Phase 2 work committed and deployed: Amplify Job 229 — SUCCEED
- TypeScript and production build: passing
- Proof logging complete for sprints 14C through 14F
- Phase 2 closeout documentation pack committed
- Runtime key rotation proofed and recorded
- No known blocking technical closeout items for Phase 1/2

---

**Phase 1/2 commercial closeout**

| Phase | Scope | Amount |
|---|---|---|
| Phase 1 | Production Portal Foundation, Controlled Import, Handover | NZD $38,500 + GST |
| Phase 2 | Admin Operations, Orders, Notification Infrastructure, Patient Notices, Portal UX | NZD $26,500 + GST |
| **Total** | | **NZD $65,000 + GST** |

I will issue the final closeout invoice shortly. Please let me know if you need any supporting documentation or a summary for your records.

---

**Recommended next step — Support retainer**

With the platform now in production, we recommend moving to a structured support and development retainer. This covers:

- Defect response and platform maintenance
- Minor enhancements and configuration changes
- Security patch review
- Priority access for future phase planning

Recommended terms: **NZD $3,500/month + GST, 6-month minimum.**

This gives Midland a predictable cost base and ensures the platform stays current without requiring a new project engagement for every change.

---

**Future phases — separate scope**

Several capabilities are natural next phases for this platform. These are not included in Phase 1 or 2 and would each be scoped and priced separately:

- **Phase 3A** — Patient Mobile Access and PWA Readiness (installable portal, mobile-first access, safe online-first behaviour)
- **Phase 3B** — Product Catalogue (admin-managed items, categories, patient browsing)
- **Phase 3C** — Entitlement-Aware Request Form (entitlement and funding visibility, co-pay logic)
- **Phase 3D** — Admin Fulfilment Console (pick, pack, dispatch workflow)
- **Phase 4** — Inventory and Entitlement Sync (stock reservation, balance deduction)
- SMS and email patient notification delivery (requires SES configuration and consent decisions)
- Checkout and payment

I would welcome a short meeting to walk through the platform, discuss the retainer, and review the Phase 3 roadmap at your convenience.

---

Kind regards,

Paul Alejo
OneOfZero
[paul@oneofzero.com] — edit before sending
[+64 — edit before sending]

---

> Draft notes:
> - Confirm invoice terms and payment schedule before sending.
> - Confirm Midland contact name and email.
> - Attach Phase 2 closeout summary PDF if prepared.
> - Remove this block before sending.
