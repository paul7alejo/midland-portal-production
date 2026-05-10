# Feature Backlog

> Where ideas go that are NOT Phase 1B MVP. Living document.
> Format: idea / phase target / rough size / rationale.

## Phase 2 (Month 12+)

```text
[ ] Patient invitation flow + Cognito user provisioning
    Size: M | Why: required to grow active portal users beyond imported records

[ ] Automated patient email (transactional only — confirmations, reminders)
    Size: S–M | Why: reduces admin phone load further

[ ] /portal/shop reactivation (Stripe live mode)
    Size: M | Why: revenue share line item — Month 12 conversation

[ ] /portal/checkout reactivation (Layer 2 — Patient Price 10% off CPAP)
    Size: M | Why: same as above

[ ] Notes & tags on patient records (admin-only)
    Size: S | Why: replaces sticky notes / spreadsheets; not clinical notes

[ ] Outreach engine — saved segments + bulk SMS / email (Midland-approved)
    Size: M | Why: reorder reminders, safety check nudges

[ ] Advanced audit dashboard (filter, search, export beyond the 30/90 window)
    Size: M | Why: Privacy Officer + funder review needs

[ ] Saved reports + scheduled export (email a CSV every Monday morning)
    Size: S | Why: reduces manual admin export load
```

## Phase 3 (Year 2)

```text
[ ] Entitlement-aware product catalogue
    Size: L | Why: patient sees products that match their funded year + device

[ ] Add-ons / accessories (within Layer 2 / 10% off discipline)
    Size: M | Why: small revenue lift

[ ] Co-pay / mixed-funding flows (some funded, some patient-paid)
    Size: M | Why: reflects real clinic billing
```

## Phase 4 (Year 2)

```text
[ ] SKU & stock model
    Size: L | Why: cannot fulfil orders without it

[ ] Supplier management
    Size: M

[ ] Reorder thresholds + low-stock alerts
    Size: S–M

[ ] Fulfilment dashboard
    Size: M
```

## Phase 4.5 (Mobile)

```text
[ ] PWA — installable patient view
    Size: M | Why: older patients on phones, no app-store friction

[ ] Native app
    Size: L | Why: only after PWA proves usage; expensive
```

## Phase 5 (Retention)

```text
[ ] Reorder nudges (compliant SMS / email cadence)
[ ] Education content — sleep hygiene, mask fitting, troubleshooting
[ ] Support pathways (deflect calls before they happen)
[ ] Ethical referral / reward mechanics — only if HIPC-compliant
```

## Phase 6 (Multi-clinic)

```text
[ ] org_id-based tenant separation (already designed in DynamoDB)
[ ] Clinic configuration (branding, entitlement caps, contact details)
[ ] Reusable onboarding flow (clinic-by-clinic playbook)
[ ] Terraform workspace per clinic
[ ] Centralised reporting across clinics (anonymised)
```

## Always-rejected ideas (do not re-propose)

```text
- Midland Points or any earn / reward / loyalty system
- Referral programme
- Three-layer checkout (Govt + Points + Patient)
- Paid consultations (clinical sale through portal)
- Subscribe & Save
- Hose or water chamber sales (clinical safety)
- AI chatbot for patients
- AI clinical assistant or diagnostic tool
- Auto-create Cognito patient users during import
- Two-way sync with ALTER (export-only, in 1B)
- Real-time replication
- Portal-driven delete or restore (always AWS console only)
```

## Triage rules

```text
- Ideas come from Midland calls, admin feedback, AI session brainstorms,
  Hormozi readings, lead conversations.
- Capture in this file with a phase target and rough size.
- Do not promise to Midland. Triage at monthly improvement review.
- Backlog is not a commitment. It is a parking lot.
```
