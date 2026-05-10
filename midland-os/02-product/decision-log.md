# Decision Log

> Every decision that shapes the build, the commercial relationship, or the operating layer.
> Append-only. Never edit past entries; add a new entry to amend.

---

## ADR-001 — AWS, not Azure
**Date:** April 2026
**Decision:** Use AWS (Amplify + Cognito + DynamoDB + CloudWatch + S3) for the production portal, regardless of whether Midland adopts Microsoft 365 for staff productivity.
**Reasoning:** AWS and M365 are independent layers — M365 is SaaS productivity; AWS is custom infra. AWS gives us full control over Cognito + DynamoDB + IAM. ap-southeast-2 (Sydney) satisfies HIPC Rule 12 via Cloud Risk Assessment.
**Status:** LOCKED. Do not reopen.

---

## ADR-002 — DynamoDB, not RDS
**Date:** April 2026
**Decision:** 7 DynamoDB tables, PAY_PER_REQUEST, deletion protection ON.
**Reasoning:** Solo dev; DynamoDB scales without ops overhead; cheaper at this volume; multi-tenant via org_id GSI is straightforward.
**Status:** LOCKED.

---

## ADR-003 — Amplify, not ECS / EKS
**Date:** April 2026
**Decision:** AWS Amplify for hosting the Next.js app.
**Reasoning:** Serverless hosting is right for this scale; eliminates container ops; integrates with Cognito and Route 53 cleanly.
**Status:** LOCKED.

---

## ADR-004 — ap-southeast-2 single region (Phase 1)
**Date:** April 2026
**Decision:** Single region in Sydney for Phase 1.
**Reasoning:** HIPC Rule 12 compliance is documented per-region; multi-region complexity is unjustified for ~6,000 patients in Waikato; multi-region is a Phase 6 / multi-clinic concern.
**Status:** LOCKED.

---

## ADR-005 — Two-layer model only (no Midland Points)
**Date:** April 2026
**Decision:** Layer 1 (government entitlement) + Layer 2 (10% off CPAP machines only). Removed entirely: Midland Points, referral, three-layer checkout, paid consultations, Subscribe & Save, earn/reward.
**Reasoning:** Clinical and ethical clarity; HIPC simplicity; Hormozi-style "one offer" focus; avoids gamification of healthcare.
**Status:** LOCKED.

---

## ADR-006 — Stripe / shop dormant in Phase 1B
**Date:** April 2026
**Decision:** /portal/shop and /portal/checkout return 404 in Phase 1B production. Code preserved in `src/phase2/`. Reactivation conversation at Month 12.
**Reasoning:** Phase 1B is operations + import; revenue share negotiation belongs after value is demonstrated, not at contract signing.
**Status:** LOCKED.

---

## ADR-007 — MSID replaces NHI as login credential
**Date:** April 2026
**Decision:** Patient login uses MSID (MS-XXXXXX, 6 random digits 100000–999999) or email. NHI is never a credential.
**Reasoning:** Privacy Act 2020 + HIPC Rule 13. Direct compliance fix.
**Status:** LOCKED. Demo accounts updated: Paul MS-238872, Sarah MS-731204, Richard MS-956431, Dev MS-000000.

---

## ADR-008 — Layer 2 discount applies to CPAP machines only
**Date:** April 2026
**Decision:** 10% discount applies to CPAP machines. Does NOT apply to masks, headgear, accessories, supplies. When entitlement exhausted, UI shows "Your funded supplies have been used. Please call Midland."
**Reasoning:** Deliberate business simplification; avoids automated discount on consumables that should route through clinical conversation.
**Status:** LOCKED.

---

## ADR-009 — Coding partner: Claude Code / Codex first, OpenRouter retired
**Date:** May 2026
**Decision:** Primary coding partner is Claude Code or Codex. OpenRouter / DeepSeek R1 free tier is no longer the primary plan. Lovable retired as Phase 1A finishes. ChatGPT for planning, Perplexity for research. free-claude-code (Alishahryar1) is experimental only — never with real patient data, secrets, or production credentials.
**Reasoning:** Production healthcare-adjacent work warrants stable, official tooling. Token discipline + surgical edits replace cheap routing as the cost lever.
**Status:** ACTIVE.

---

## ADR-010 — Admin Data Operations added to Phase 1B (v3.1)
**Date:** May 9, 2026
**Decision:** Add Admin Data Operations sub-system (Export + Backup + AWS State Visibility) to Phase 1B, distributed across Days 33–37. This is what makes the portal an "operating layer" and operationally usable.
**Three sub-systems:**
- **Export** — imported patients CSV, combined patient/device/mask CSV, entitlement summary CSV, audit log window. NHI excluded by default; opt-in requires reason + audit row before file generation.
- **Backup** — DynamoDB PITR on all 7 tables, on-demand backup endpoint, weekly S3 snapshot Lambda. Status panel.
- **AWS State Visibility** — read-only panel; counts, last write, last backup. No portal-driven delete or restore (AWS console only).
**Commercial:**
- **Option A** — absorb in NZD 42,000 anchor (eats ~3 founder days)
- **Option B** — line item NZD 2,500–3,500 incl GST → revised NZD 44,500–45,500
**Status:** ACTIVE. Choose Option A vs B based on whether contract is signed; record choice in next ADR.

---

## ADR-011 — [TEMPLATE — copy this when adding the next decision]
**Date:**
**Decision:**
**Reasoning:**
**Status:**
**Notes:**

---
