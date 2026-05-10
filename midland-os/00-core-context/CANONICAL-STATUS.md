# CANONICAL STATUS — Midland Sleep Portal

> Single source of truth across Claude Code, Codex, ChatGPT, and Perplexity.
> When tools disagree, this file wins.
> Update this file when status changes. Do not let it drift.

---

## ⏱ STATUS SNAPSHOT

```text
Date:                    May 9, 2026
Days to June 30:         ~52
Official phase:          Phase 1B — AWS Amplify Production Portal
Execution slice:         1C closeout → 1D + 1D-x (Admin Data Operations) → 1E
Repo:                    clean
Day 28:                  ✅ DONE + pushed
Day 29:                  ✅ DONE + pushed
Day 30:                  🟡 started, not complete
Pack version:            v3.1
External risk #1:        ALTER export format not yet confirmed by Midland
Practical bottleneck:    production readiness + admin handover + OS docs
```

---

## EXECUTION SLICES — current state

| Slice | What | Status |
|---|---|---|
| 1B-a Import Governance | Preview, validation, duplicate detection, evidence pack, approval | ✅ DONE |
| 1C Controlled Import Engine | Dry-run + DynamoDB write path, batch ID, counts, failed rows | ✅ Tech done — needs Day 30–31 closeout/evidence |
| 1D Admin Review + Visibility | Patient list, drawer, batch review | 🟡 Partial |
| **1D-x Admin Data Operations** | **Export + Backup + AWS State Visibility (v3.1 addition)** | **⏳ Day 33–37** |
| 1E SOPs + Midland OS v1 + Handover | Import SOP, admin SOP, release SOP, decision log, risks, handover | ⏳ Day 39–45 |
| 1F Patient UX & Visual Clarity | Older-patient readability, typography, mobile clarity | 🟡 Stretch — Day 46–49 |

---

## WHAT IS COMPLETE END-TO-END

```text
CSV / Biomedical-style data
  → dry-run validation
  → controlled execute import
  → DynamoDB patient/device/mask records
  → duplicate NHI + serial protection
  → imported patient API
  → imported patients visible in admin table
  → imported patient drawer
  → no raw NHI returned
  → no fake mask fallback
```

---

## ONE-SENTENCE STRATEGY

Finish the Production Operations Portal by June 30 while packaging Midland OS v1 beside it, with ALTER export confirmation as the highest external risk and production readiness/admin handover as the practical bottleneck.

---

## NON-NEGOTIABLES

- NHI is never a credential
- NHI excluded by default in every export (Rule 16)
- Audit append-only — PutItem only (no UpdateItem, no DeleteItem)
- No portal-driven delete or restore (Rule 17)
- No checkout, Stripe, inventory, mobile, patient invites, Cognito patient creation, patient email — all Phase 1B forbidden
- Real patient data never enters AI tools
- Demo accounts only in prompts and docs

---

## LAST UPDATED

```text
Date:    May 9, 2026
Updated by: Paul Alejo
Reason:  v3.1 — Admin Data Operations sub-system added to Phase 1B
```
