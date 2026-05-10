# Phase Map

> Two views of the same plan. View A is for proposals and external comms.
> View B is what we actually use day-to-day with Claude Code and Codex.

---

## VIEW A — Canonical Roadmap

| Phase | Name | Status | Window |
|---|---|---|---|
| 1A | Vercel prototype + demo | ✅ Complete | Pre-contract |
| 1B | AWS Amplify Production Portal | 🔄 In progress | June 30, 2026 target |
| 2 | Admin Operations OS | ⏳ Post Month 12 | Year 2 Q1–Q2 |
| 3 | Entitlement Commerce OS (shop + Stripe + revenue share) | ⏳ Month 12+ | Year 2 |
| 4 | Inventory & Fulfilment OS | ⏳ Year 2 | Year 2 |
| 4.5 | Mobile Access Layer / PWA review | ⏳ Post Phase 4 | Year 2 |
| 5 | Retention & Patient Growth OS | ⏳ Year 2+ | Year 2 |
| 6 | Multi-Clinic OS — Terraform workspace per clinic | ⏳ Year 2+ | Year 2+ |

---

## VIEW B — Execution slices inside Phase 1B

| Slice | Scope | Status | Day window |
|---|---|---|---|
| 1B-a Import Governance | Preview, validation, duplicate detection, evidence pack, approval | ✅ DONE | Days 1–22 |
| 1C Controlled Import Engine | Dry-run + DynamoDB write path, batch ID, counts, failed rows | ✅ Tech done | Days 23–29 |
| 1C closeout | Closeout docs, rehearsal, evidence | 🟡 Day 30–31 | |
| 1D Admin Review + Visibility | Patient list, drawer, batch review polish | 🟡 Partial | Day 32 |
| **1D-x Admin Data Operations** | **Export + Backup + AWS State Visibility** | **⏳ NEW (v3.1)** | **Days 33–37** |
| 1D close | 1D closeout + demo script | ⏳ Day 38 | |
| 1E SOPs + Midland OS v1 + Handover | Import SOP, admin SOP, release SOP, decision log, risks, handover | ⏳ Days 39–45 | |
| 1F Patient UX & Visual Clarity | Older-patient readability, typography, mobile | 🟡 Stretch | Days 46–49 |
| Final | Go-live readiness checkpoint | ⏳ Day 50 | June 30 |

---

## RULES FOR PHASE TRANSITIONS

```text
- Each slice must produce evidence in 07-outputs/phase-1/ before moving on.
- Each slice must update decision-log.md with key decisions.
- Each slice must update risks.md and known-limitations.md if anything changed.
- 1F is stretch only. If 1E slips, drop 1F entirely. Do not slip 1E for 1F.
- Day 50 is the no-go gate. If anything in the final checklist fails, push
  go-live by 1 week (the buffer) — do not ship hot.
```

---

## DEPENDENCIES (external blockers)

```text
[ ] ALTER export owner confirmed (Midland-side)
[ ] ALTER export format + columns confirmed
[ ] Migration window agreed with Midland clinical lead
[ ] Privacy Officer review booked / completed
[ ] Clinical / data signoff owner named
[ ] Staff training / walkthrough date agreed
[ ] M365 confirmation (for HIPC Rule 12 documentation)
```

These are tracked in `06-memory/risks.md` under "Blocked by Midland."
