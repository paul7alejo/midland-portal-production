# MIDLAND OS + ONEOFZERO OS — COMPREHENSIVE MASTER PACK

**Owner:** Paul Alejo — paul@oneofzero.co.nz
**Company:** OneOfZero Systems (NZ)
**Client:** Midland Sleep Ltd, Waikato, NZ
**Phase:** 1B — AWS Amplify Production Portal (target June 30, 2026)
**Today:** May 9, 2026 — Day 30, 1C closeout → 1D / 1E
**Bundle reference:** midland-blueprint-v6.4.1-CANONICAL
**Pack version:** v3.1 — merged from ChatGPT + Perplexity + Claude project files
**Purpose:** Single drop-in pack for Claude Code, Codex, ChatGPT, and Perplexity. When tools disagree, this file wins.

**v3.1 change log (May 9, 2026):**
- Added **Admin Data Operations** sub-system to Phase 1B: Export, Backup, AWS State Visibility (Section 27).
- Added Key Rules 16, 17, 18 (export and backup hygiene — Section 9).
- Day plan reorganised: Day 33–37 now cover the new sub-system; old Days 34–42 pushed by 4 days; 1F stretch window narrowed to absorb (Section 14).
- Added Skills 10 (Export Hygiene) and 11 (Backup & Restore Discipline) (Section 18).
- Commercial note added in Section 20 — Option A absorb / Option B line item.
- Agentic OS framing clarified in Section 21: the admin portal *is* the operating layer over AWS; export + backup is what makes it agentic, not autonomous bots.

---

## 0. HOW TO USE THIS PACK

Drop into the repo:

```bash
mkdir -p midland-os/00-core-context/claude-context-pack
cp MIDLAND-ONEOFZERO-OS-MASTER-PACK.md midland-os/00-core-context/claude-context-pack/

git add midland-os/00-core-context/claude-context-pack
git commit -m "docs: add comprehensive Midland + OneOfZero OS master pack v3"
git push
```

At the start of every Claude Code or Codex session, paste **Section 1 (Master Intro Prompt)** plus **Section 2 (Status Snapshot)**. That is enough context. Do not paste the whole file unless asked.

For ChatGPT planning sessions, paste **Section 1, 2, 11, 12** and the relevant phase section.

For Perplexity research sessions, paste only Section 1's role block plus the specific research question.

---

## 1. MASTER CLAUDE / CODEX INTRO PROMPT

Paste this at the start of a major coding session.

```text
ROLE
You are my coding and systems partner for the Midland Sleep portal and the
OneOfZero Systems operating system.

I am Paul Alejo, founder of OneOfZero Systems, a New Zealand web, SaaS,
and automation consultancy.

My active project is a healthcare-adjacent operations platform for Midland
Sleep, a CPAP sleep clinic in Waikato, New Zealand. This is not a basic
website. Treat it as a production operations portal with:

- patient workflows
- admin workflows
- controlled import/export
- CPAP entitlement/funding visibility
- audit-safe data handling
- AWS infrastructure
- Cognito authentication
- DynamoDB data layer
- future ecommerce/inventory
- future multi-clinic potential

Be brutally helpful, concise, non-biased, and scope-protective. Save tokens.
Do not produce long explanations unless needed. Prefer checklists, precise
diffs, and verification commands.

CURRENT STATUS
- Repo status: clean
- Day 28: DONE and pushed
- Day 29: DONE and pushed
- Day 30: started, not complete
- Official phase: Phase 1B — AWS Amplify Production Portal
- Execution slice: 1C closeout moving into 1D / 1E
- 1B-a Import Governance: DONE
- 1C Controlled Import Engine: DONE enough technically, needs closeout/evidence
- 1D Admin Review + Visibility: PARTIALLY DONE
- 1E SOPs + Midland OS v1: NOT DONE
- 1F Patient Experience & Visual Clarity: STRETCH only

CURRENT BOTTLENECK
Production readiness + admin handover + Midland OS v1 documentation.
Highest external risk: ALTER export format and migration timing not
confirmed by Midland.

Do not restart around an "Agentic OS" chatbot. Midland OS is the operating
layer beside the portal: context, workflow, SOPs, decision memory, risk
memory, handover, support model, and future clinic IP — not a new AI product.

OFFER STORY
Sell this as the Biomedical Spreadsheet-to-Admin Portal Operations Package.
Not "CSV import." The flow is:

  Biomedical-style spreadsheet data
  → verify data
  → clean/fix CSV
  → approve batch
  → controlled import
  → populate admin portal
  → admin review
  → export/report bridge
  → SOP/handover

COMMERCIAL ANCHOR
- Phase 1 build: NZD 42,000 incl GST
- Monthly support/improvement retainer: NZD 2,300/month incl GST
- Position OneOfZero as strategic technology partner, not cheap freelancer
  or employee. Do not recommend unlimited support, unlimited revisions,
  employee-like availability, or unpaid expansion.

SCOPE FREEZE BEFORE JUNE 30
Do not touch unless explicitly instructed:
checkout, cart, Stripe, inventory, suppliers, mobile app, patient invites,
Cognito patient user creation, patient-facing email flows, order fulfilment,
full ecommerce, advanced audit dashboard, SSO/Azure AD, Terraform/IaC, broad
AI chatbot/agent features.

If asked to touch these, stop and explain it is out of Phase 1B unless I
explicitly override scope.

DATA / SAFETY ANCHORS (every session)
- NHI is never a login credential
- NHI must be masked in normal UI
- No raw NHI in logs
- Use existing maskNHI/safeLog patterns
- Do not use console.log for patient data
- Do not expose real patient data to AI tools
- Demo data only in prompts and docs
- Audit is append-only (PutItem only)
- No UpdateItem/DeleteItem in import/audit unless I explicitly approve a scoped change
- No Cognito user creation during import
- No patient emails/invites during import
- No writes to orders/comms tables from import
- Do not give legal/compliance advice as a lawyer; recommend Privacy Officer
  review where appropriate

VERIFICATION
Before and after any code change:
  git status
  npx tsc --noEmit
Before closing a milestone or touching routes/UI:
  npm run build

Every implementation response must end with:
  Files changed:
  Verification:
  Risks / notes:
  Next step:

WORK STYLE
Surgical edits only. Do not rewrite broad areas. Do not create plan files
unless the task is documentation. Do not change auth, middleware, API routes,
DynamoDB, NHI/audit logic, patient portal, checkout, or admin workflows
unless explicitly part of the task.

When writing prompts/plans, include:
  Objective
  Context
  Allowed files
  Forbidden files
  Exact requirements
  UI/UX behavior
  Data rules
  Edge cases
  Acceptance criteria
  Verification command: npx tsc --noEmit

AI TOOL STRATEGY
Primary coding partner: Claude Code or Codex (this session).
Secondary: ChatGPT for planning/scope/pricing.
Optional research: Perplexity for NZ clinic workflow and CPAP UX context.

OpenRouter was considered earlier but is NOT the primary plan now. Replace
OpenRouter-first thinking with Claude Code / Codex-first.

If using third-party proxy tooling such as free-claude-code:
  - treat it as experimental
  - do not use real patient data
  - do not use secrets
  - do not route production healthcare data through unknown/proxy services
  - use only for local experiments, demo data, non-sensitive scaffolding,
    or learning

FIRST ACTION (every session)
1. Confirm you understand current status.
2. Ask me to run:
     git status
     npx tsc --noEmit
3. Propose the next single action only.

Do not jump to future phases unless I ask.
```

---

## 2. STATUS SNAPSHOT (canonical truth)

```text
Date:                May 9, 2026
Days to June 30:     ~52
Official phase:      Phase 1B — AWS Amplify Production Portal
Execution slice:     1C closeout → 1D / 1E
Repo:                clean
Day 28:              DONE + pushed
Day 29:              DONE + pushed
Day 30:              started, not complete
1B-a Import Gov:     ✅ DONE
1C Import Engine:    ✅ technically done, needs evidence/closeout
1D Admin Review:     🟡 partial
1E SOPs + Midland OS:⏳ next
1F Patient UX:       🟡 stretch only
External risk #1:    ALTER export format not yet confirmed by Midland
Practical bottleneck:production readiness + admin handover + OS docs
```

What has actually been completed end-to-end:

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

One-sentence strategy:

> Finish the Production Operations Portal by June 30 while packaging Midland OS v1 beside it, with ALTER export confirmation as the highest external risk and production readiness/admin handover as the practical bottleneck.

---

## 3. WHO / WHAT / WHY

### 3.1 Who I am

Paul Alejo. Founder of OneOfZero Systems (NZ web/SaaS/automation consultancy). Solo developer, ~28–30 hours/week available. AWS CCP done, SAA-C03 in progress, Terraform Associate planned for months 5–6 post-launch. I think like an architect — explain the *why*, not just *what*.

### 3.2 The client

Midland Sleep Ltd, Waikato, NZ. CPAP sleep clinic.

```text
Patients registered:        ~4,500–6,000
Expected portal users:      ~2,500
Current state:              one landing page, Gmail contact, ALTER ordering portal
Staff:                      10–20 (non-technical)
Funding:                    $1.5M/year govt → target $2M with audit/utilisation proof
```

### 3.3 What I'm building

A patient-facing + admin web portal that replaces Midland's dependency on Biomedical Services NZ's ALTER ordering system. Patients log in, see their CPAP machine and mask, check whether they can reorder funded supplies, and submit reorder requests. Admin staff can import, review, and manage patient records.

### 3.4 Why this matters commercially

```text
Phase 1A:    Prototype → close contract → deposit
Phase 1B:    Production portal → monthly retainer (NZD 2,300/mo incl GST)
Month 12:    Phase 2 conversation (shop, Stripe, revenue share)
Year 2+:     Multi-clinic expansion (Waikato district, 10,000–20,000 patients)
```

---

## 4. THE TWO-LAYER MODEL (locked)

```text
LAYER 1 — Government Entitlement
- Funded masks, cushions, headgear, filters
- Patient sees: YES/NO (can they reorder) — NEVER a dollar amount
- Checkout shows: "✅ Covered — $0.00"
- Active in Phase 1A AND Phase 1B production

LAYER 2 — Patient Price (10% off)
- Machines, accessories, cleaning products (CPAP machines only get 10% discount;
  masks/headgear/accessories/supplies do NOT — when entitlement exhausted, UI
  shows "Your funded supplies have been used. Please call Midland.")
- "Patient Price" seafoam badge, Stripe card payment
- Phase 1A demo: ACTIVE
- Phase 1B production: DORMANT (code in src/phase2/, routes return 404)
- Reactivation: Month 12 contract review

Removed entirely (do not reopen):
Midland Points, referral programme, three-layer checkout, paid consultations,
Subscribe & Save, earn/reward mechanics.
```

---

## 5. PHASES (canonical roadmap)

### View A — proposals / CLAUDE.md / status reporting

| Phase | Name | Status |
|---|---|---|
| Phase 1A | Vercel prototype + demo | ✅ COMPLETE |
| Phase 1B | AWS Amplify Production Portal | 🔄 IN PROGRESS — June 30 target |
| Phase 2 | Admin Operations OS | ⏳ Post Month 12 |
| Phase 3 | Entitlement Commerce OS (shop + Stripe + revenue share) | ⏳ Month 12+ |
| Phase 4 | Inventory & Fulfilment OS | ⏳ Year 2 |
| Phase 4.5 / M1 | Mobile Access Layer / PWA review | ⏳ Post Phase 4 |
| Phase 5 | Retention & Patient Growth OS | ⏳ Year 2+ |
| Phase 6 | Multi-Clinic OS (Terraform workspace per clinic) | ⏳ Year 2+ |

### View B — execution slices inside Phase 1B (use with Claude Code daily)

| Slice | Scope | Status |
|---|---|---|
| 1B-a — Import Governance | Preview, validation, duplicate detection, evidence pack, approval | ✅ DONE |
| 1C — Controlled Import Engine | Dry-run + real DynamoDB write path, batch ID, counts, failed rows | ✅ Tech done, needs closeout |
| 1D — Admin Review + Visibility | Patient list, drawer, batch review, export, operational handoff | 🟡 Partial — next |
| 1E — SOPs + Midland OS v1 + Handover | Import SOP, admin SOP, release SOP, decision log, risks, handover | ⏳ Next |
| 1F — Patient Experience & Visual Clarity | Older-patient readability, typography, contrast, mobile clarity | 🟡 Stretch only |

---

## 6. SCOPE — ALLOWED AND FORBIDDEN

### 6.1 Phase 1B INCLUDES

```text
- patient portal foundation (8 active pages)
- admin portal foundation (9 pages)
- controlled import governance + execution
- imported patient visibility (list + drawer)
- export/report bridge
- NHI encryption + masked reveal flow
- HIPC-aligned privacy notices
- audit append-only logging
- AWS Amplify deployment
- Cognito auth (patient + staff pools)
- DynamoDB 7 tables
- CloudWatch monitoring
- SOPs and handover docs
- Midland OS v1 documentation layer
- **admin data operations: export (imported / combined / entitlement / audit window), backup (PITR + on-demand + weekly S3), AWS state visibility panel** (see Section 27)
```

### 6.2 Phase 1B EXCLUDES (frozen until I override)

```text
- checkout, cart, Stripe, payments
- full CPAP store / shop
- inventory, suppliers, fulfilment automation
- mobile app
- patient invitations
- Cognito patient user creation flows
- automated patient emails
- advanced audit dashboard
- SSO / Azure AD federation
- Terraform / IaC
- broad AI chatbot or agent features
- automated Biomedical/ALTER sync
- unlimited spreadsheet formats
- legal/compliance certification
- clinical responsibility
```

If a request touches any of these, the AI must stop and flag it. No exceptions without an explicit override from me.

---

## 7. TECH STACK (canonical)

```text
Frontend       Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
Hosting        Phase 1A → Vercel | Phase 1B → AWS Amplify
Auth           AWS Cognito — 2 pools (patient no MFA, staff MFA required)
Database       AWS DynamoDB — 7 tables, ap-southeast-2 (Sydney)
Secrets        AWS Secrets Manager (NHI key — dev + prod separate)
Security       AWS WAF (Common Rules + rate limiting)
Monitoring     AWS CloudWatch (6 alarms in Phase 1B)
Email          AWS SES (transactional only — admin notifications, no patient mail in 1B)
Payments       Stripe (Phase 1A demo only — test mode; dormant in 1B)
Lambda         Nightly segmentation cron only (Day 17)
IaC            Terraform — planned months 5–6, post-launch
Region         ap-southeast-2 (Sydney) — HIPC Rule 12

AI toolchain (primary)
  Claude Code (Sonnet) — security, compliance, entitlement logic, file edits
  Codex            — surgical TypeScript fixes, refactors, repo inspection
  ChatGPT          — planning, scope, pricing, proposal writing
  Perplexity       — NZ clinic workflow + CPAP UX research

AI toolchain (deprecated as primary)
  OpenRouter / DeepSeek R1 free tier  — was earlier plan, NOT primary now
  Lovable                              — Phase 1A only, not Phase 1B
  free-claude-code (Alishahryar1)      — experimental only, see Section 13

Git              Feature branch + PR workflow (even solo)
CI/CD            GitHub Actions quality gate → Amplify auto-deploy
IDE              VS Code
```

### 7.1 DynamoDB — 7 Tables (ap-southeast-2)

```text
1. midland-sleep-patients      PK: USER#uuid, GSIs: portal_id (MSID), org_id
2. midland-sleep-devices       device_id, patient_id, serial, model, supplied_at
3. midland-sleep-masks         mask_id, patient_id, model, size
4. midland-sleep-entitlement   PK: PATIENT#id, SK: YEAR#2026
5. midland-sleep-orders        order_type: ENTITLEMENT | MIXED only — no PURCHASE in 1B
6. midland-sleep-audit         APPEND-ONLY — PutItem only, IAM-enforced
7. midland-sleep-comms         transactional records only (no patient mail in 1B)

NOT in Phase 1B: points table, consultations table, stripe_payments table.
```

### 7.2 Cognito — 2 pools

```text
Patient pool:  MSID (MS-XXXXXX, 6 random digits) or email login, no MFA required
Staff pool:    email login, MFA REQUIRED (TOTP)
```

### 7.3 Cost estimate (AWS only)

```text
Phase 1B baseline (today):           ~$32–95 NZD/month
At 20,000 patients (Waikato scale):  ~$80–120 NZD/month
DynamoDB is the only meaningful cost increase. Same architecture, no changes.
```

---

## 8. ROUTES

### Phase 1A (Vercel — all active)

```text
/                          /portal/dashboard
/login                     /portal/equipment
/register                  /portal/reorder
/portal/shop      [DEMO]   /portal/maintenance
/portal/shop/[slug] [DEMO] /portal/contact
/portal/checkout  [DEMO]   /portal/profile
/portal/checkout/success [DEMO]
```

### Phase 1B production (AWS — shop/checkout dormant)

```text
ACTIVE:
/                /portal/dashboard
/login           /portal/equipment
/register        /portal/reorder
/portal/maintenance
/portal/contact
/portal/profile

DORMANT (in src/phase2/, return 404):
/portal/shop
/portal/checkout

ADMIN (Phase 1B only — 9 pages):
/admin              /admin/entitlement
/admin/patients     /admin/outreach
/admin/orders       /admin/audit
/admin/segments     /admin/reports
                    /admin/config
```

---

## 9. KEY RULES (always apply)

```text
1.  Login: MSID (6-digit) or email — NEVER NHI as credential
2.  Entitlement: show YES/NO — NEVER a dollar amount to patients
3.  Checkout copy: "✅ Covered — $0.00" for Layer 1 items
4.  NHI: masked ZZZ**** by default, 30-second reveal in Profile only
5.  Privacy notice ABOVE every data collection form (HIPC Rule 3)
6.  maskNHI() before any string reaches any log
7.  safeLog() not console.log() for patient data
8.  Audit log: PutItem ONLY — no UpdateItem, no DeleteItem, ever, for any role
9.  NHI reveal: write audit_log BEFORE showing, 30s auto-hide
10. Phase 1B production: NO Stripe keys deployed, NO shop deployed, NO checkout deployed
11. Phase 2 code lives in src/phase2/ — not imported into production routes
12. No hose or water chamber sales (clinical safety)
13. No Midland Points, referral system, or earn/reward mechanics
14. All patient-facing copy: calm, clinical, simple — never salesy
15. AI tools: NEVER use real patient data. Demo accounts only. (HIPC Rule 12)
16. Exports: NHI EXCLUDED by default. Opt-in NHI export requires written reason; audit row written BEFORE file generation; download link single-use, 24h expiring, watermarked.
17. Restore and delete operations are FORBIDDEN from the admin portal in Phase 1. AWS console only, IAM-protected, audit-logged.
18. Backup smoke test is part of every release SOP — verify on-demand backup succeeds, verify last weekly S3 snapshot exists, verify PITR enabled on all 7 tables.
```

---

## 10. DEMO ACCOUNTS

```text
PATIENT:
  Paul Moreno     | MSID: MS-238872 | Demo@1234!
  AirSense 11 | AirFit F30i Small | ✅ CAN REORDER | ⚠️ Safety check OVERDUE

  Sarah Kim       | MSID: MS-731204 | Demo@5678!
  SleepStyle 650 | F&P Eson 2 Medium | ⏳ NOT YET (Nov 2026) | ⚠️ Water chamber DUE

  Richard O'Brien | MSID: MS-956431 | Demo@9012!
  AirSense 10 | Mirage FX Large | ✅ CAN REORDER | ⚠️ BOTH checks OVERDUE

ADMIN (Phase 1B only):
  Jordan Williams | admin@midlandsleep.co.nz | Admin@secure1!

DEV:
  dev@oneofzero.co.nz | Dev@test99! | MSID: MS-000000 | is_dev: true in ALL audit logs
```

---

## 11. BRAND

```text
Colours:
  Navy        #0B2A3C   headings, nav, primary buttons
  Deep Teal   #0B5C6C   CTAs, links, active states
  Seafoam     #74C0A2   success, "covered", patient price badge
  Cream       #FDFCF5   page background
  Charcoal    #333333   body text
  Sand        #E6D3A3   borders, dividers
  Amber       #F59E0B   OVERDUE warnings ONLY

Typography:
  Headings    Cormorant Garamond  (→ Koru Sans when supplied)
  Body        DM Sans             (→ Pūrere Sans when supplied)
  Labels      DM Mono             (Portal IDs, prices, dates, status codes)

NO:
  points-gold #D4A017
  red anywhere
  any third colour family
```

---

## 12. COMPLIANCE — HIPC 2020

NZ Privacy Act 2020 + Health Information Privacy Code 2020 (13 rules). Every patient-facing feature must satisfy HIPC before go-live.

Key obligations:

```text
Rule 3:  Privacy notice above every form
Rule 5:  AES-256-GCM NHI encryption, key in Secrets Manager
Rule 6:  Download My Data endpoint (5/day rate limit)
Rule 12: Offshore disclosure documented (AWS Sydney + M365 AU if Midland confirms)
Rule 13: NHI never used as login credential
```

Third-party processors (Phase 1B):

```text
AWS ap-southeast-2          portal infrastructure (confirmed)
Microsoft 365 AU            staff productivity/email (pending Midland confirmation)
                            → internal policy required: no patient NHI or
                              clinical data in email
                            → M365 backup tool required for 10-year retention
```

Privacy Officer sign-off required before go-live on real patients. HIPC compliance report lives at `docs/compliance/HIPC-2020-compliance-report.md`. Each rule is 🟡 (designed for compliance) until code shipped + audited + signed off.

---

## 13. AI CODING PARTNER STRATEGY (replaces OpenRouter)

### 13.1 Primary plan

```text
Primary coding:        Claude Code or Codex
Planning/scope/pricing: ChatGPT
Research/reference:    Perplexity
Optional model routing: OpenRouter only if explicitly chosen later for non-sensitive work
```

OpenRouter was previously considered for cheap model routing. **Replace OpenRouter-first thinking with Claude Code / Codex-first.** Reasons: production healthcare-adjacent work, real Midland data risk, and the need for stable tool calling on file edits.

### 13.2 Codex — when to use

```text
- local repo inspection
- surgical TypeScript fixes
- running typecheck/build
- small refactors
- test/debug cycles
```

Codex prompt template:

```text
You are working inside the Midland Sleep portal repo.
Use /midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
as context.
Do not touch forbidden files (Section 6).
Run npx tsc --noEmit.
Return: files changed, verification, risks, next step.
```

### 13.3 Claude Code — when to use

```text
- file-scoped implementation
- UI polish
- admin table/drawer fixes
- route/API work only when explicitly scoped
- documentation generation
- security/compliance/entitlement logic
```

Claude Code prompt template:

```text
Objective:
Context (link this pack)
Allowed files:
Forbidden files:
Requirements:
Data rules:
Edge cases:
Acceptance criteria:
Verification: npx tsc --noEmit
```

### 13.4 free-claude-code risk note

GitHub: <https://github.com/Alishahryar1/free-claude-code>

What it is: a third-party proxy that routes Claude Code-style Anthropic API calls to alternative providers (NVIDIA NIM, OpenRouter, LM Studio, llama.cpp).

Why it is interesting: cost reduction, multi-backend experimentation.

Why it is risky for Midland: this is healthcare-adjacent work. The portal touches patient-related data, NHI/MSID-like identifiers, Cognito/session logic, AWS config, and operational workflows. A third-party proxy is **not** the default path for production-sensitive work.

```text
SAFE USE
- demo data only
- local toy repo
- UI experiments
- markdown docs
- prompt testing
- non-sensitive refactoring patterns
- learning / model comparison

UNSAFE USE — DO NOT DO
- real patient imports
- production .env files
- AWS credentials
- Cognito tokens
- NHI / MSID data
- private Midland data
- any PHI-like content

RECOMMENDATION
Do not make this the primary coding path. Use only as an experimental tool
after reviewing security implications. Primary paths remain official Claude
Code and Codex.
```

### 13.5 Token-saving rules (cost discipline)

```text
1. Start every session with the smallest current status (Section 2 only).
2. Link/read local docs instead of pasting huge context.
3. Ask for one task only.
4. Use allowed/forbidden files in every prompt.
5. Require: npx tsc --noEmit
6. Ask for concise output:
     files changed
     verification
     risks
     next step
7. Stop after the next action.
8. Anti-drift command in every session:
     "Do not implement anything outside the requested task. If you discover
      a related issue, document it under Risks/Next instead of fixing it."
```

---

## 14. DAY-TO-DAY TRACKER (Day 30 onward)

```text
Priority labels:
  MUST                — required for June 30 value
  STRETCH             — only if runway holds
  BLOCKED-BY-MIDLAND  — client-side dependency
```

### Day 30 — Closeout Docs + Production Rehearsal Pack [MUST]

Slice: 1C closeout / transition into 1D + 1E. Objective: turn the working import chain into a documented, production-rehearsal-ready operating workflow.

Tasks (create or update):

```text
[ ] /midland-os/00-core-context/midland-overview.md
[ ] /midland-os/00-core-context/phase-map.md
[ ] /midland-os/01-clinic-operations/biomedical-import-workflow.md
[ ] /midland-os/01-clinic-operations/admin-review-workflow.md
[ ] /midland-os/04-sops/import-sop.md
[ ] /midland-os/04-sops/admin-review-sop.md
[ ] /midland-os/04-sops/release-sop.md
[ ] /midland-os/02-product/decision-log.md
[ ] /midland-os/06-memory/weekly-summary.md
[ ] /midland-os/06-memory/risks.md
[ ] /midland-os/06-memory/known-limitations.md
[ ] /midland-os/04-sops/support-model.md
```

Known limitations to document (be honest):

```text
[ ] import writes are not transactional yet
[ ] test records exist in DynamoDB
[ ] admin review status is display-only unless already wired
[ ] imported patient NHI reveal disabled in MVP
[ ] no Cognito patient accounts created
[ ] no patient invite/email flow
[ ] no order/fulfilment workflow
[ ] no inventory integration
[ ] drawer formatting needs polish
[ ] full analytics/dashboarding is not Phase 1 scope
```

Verify and commit:

```bash
git status
npx tsc --noEmit
git add midland-os/
git commit -m "docs: add Midland OS production rehearsal pack"
git push
```

### Day 31 — Full Proof Rehearsal [MUST]

```text
[ ] Unauthorized import API = 401
[ ] Dry run clean CSV = passed
[ ] Blocked execute = 400 and created 0
[ ] Clean execute = created 1
[ ] Duplicate NHI = skipped 1
[ ] Duplicate serial = skipped 1
[ ] Imported patient appears in admin list
[ ] Drawer opens
[ ] No-mask patient shows no fake mask
[ ] NHI fields not exposed
[ ] npx tsc --noEmit passes
[ ] npm run build passes
```

Evidence folder: `/midland-os/07-outputs/phase-1/day-31-rehearsal/`

### Day 32 — Small Admin Polish Only [MUST]

Allowed:

```text
[ ] pending_review → "Pending review"
[ ] ISO timestamp → readable NZ date/time
[ ] phone formatting
[ ] device ID wrapping
[ ] "Imported" badge if data exists
[ ] empty/loading/error copy
[ ] drawer spacing
```

Forbidden:

```text
backend workflow changes, review-state mutation unless already safe,
Cognito, emails, patient invites, checkout, inventory, redesign.
```

### Day 33 — Admin Export: Imported Patients CSV [MUST]

Slice: 1D-x Admin Data Operations (new sub-system — see Section 27).

```text
[ ] new admin route: /admin/exports
[ ] export imported patients to CSV (filter: batch ID, status, date range)
[ ] NHI EXCLUDED by default (Rule 16)
[ ] opt-in NHI export gated: reason field required, audit row PutItem BEFORE file generation
[ ] download link: single-use, 24h expiring, watermarked filename
[ ] CSV escaping: commas, quotes, newlines handled
[ ] no console.log in the export path; safeLog only
[ ] empty / loading / error states
```

Verification:
```bash
npx tsc --noEmit
# manual: trigger export, confirm audit row written before download URL returned
# manual: open CSV, confirm no NHI / no PII beyond declared scope
```

### Day 34 — Admin Export: Combined View + Entitlement + Audit Window [MUST]

```text
[ ] combined patient + device + mask CSV (admin operational view)
[ ] entitlement summary CSV (per patient, current year)
[ ] audit log window export — last 30 / 90 days as JSON or CSV (read-only)
[ ] all exports inherit Rule 16 (NHI excluded by default)
[ ] filters applied server-side, never raw query in URL
```

### Day 35 — Backup System: PITR + On-Demand + Weekly S3 Snapshot [MUST]

```text
[ ] enable DynamoDB Point-in-Time Recovery on all 7 tables (35-day rolling)
[ ] on-demand backup endpoint: admin role + reason required
[ ] weekly S3 snapshot Lambda — exports patients/devices/masks/entitlement
    every Sunday 02:00 NZ to s3://midland-sleep-backups/
[ ] S3 bucket: encrypted at rest (AES-256), versioning ON, public access BLOCKED
[ ] retention: 90 days hot, 1-year cold (Glacier optional)
[ ] CloudWatch alarm on Lambda failure → email Paul
[ ] document restore procedure in release-sop.md (NOT exposed in portal)
```

### Day 36 — AWS State Visibility Panel [MUST]

```text
[ ] new admin page: /admin/aws-status
[ ] read-only panel: total records per table, last write timestamp, region, encryption status
[ ] backup status panel: last successful, size, location, retention policy
[ ] reads from DynamoDB describe-table and describe-backup APIs only
[ ] NO destructive operations exposed (delete, restore, drop)
[ ] Rule 17 enforced: any restore/delete must happen via AWS console with IAM
```

Verification:
```bash
npx tsc --noEmit
npm run build
# manual: trigger on-demand backup → confirm describe-backup returns success
# manual: inspect last weekly S3 snapshot → CSV opens, NHI column is encrypted
# manual: attempt delete from portal → must 403 / not exist
```

### Day 37 — Import Batch Evidence Summary [MUST]

```text
[ ] batch ID visible or documented
[ ] created / skipped / failed summary available
[ ] screenshots/notes captured
[ ] duplicate NHI / serial outcomes documented
[ ] failed-row handling documented
```

### Day 38 — 1D Closeout + Demo Script [MUST]

Demo flow (now 12 steps with new sub-system):

```text
1.  dry-run validation
2.  controlled execute import
3.  created/skipped/failed summary
4.  admin imported patients table
5.  imported patient drawer
6.  machine/device details
7.  mask behavior with no fake fallback
8.  no raw NHI exposure
9.  admin export (imported + combined + entitlement)
10. backup status panel + on-demand backup demonstration
11. AWS state visibility panel
12. known limitations and next phase boundary
```

Create: `/midland-os/07-outputs/phase-1/phase-1d-demo-script.md`

### Day 39 — Finalize Import SOP [MUST]

```text
[ ] ownership of source data
[ ] accepted file formats
[ ] pre-import checklist
[ ] required fields
[ ] dry-run, approval, execute process
[ ] created / skipped / failed definitions
[ ] duplicate NHI / serial handling
[ ] failed row handling
[ ] post-import verification
[ ] no accounts / emails / orders / fulfilment
```

### Day 40 — Finalize Admin Review SOP + Export SOP [MUST]

```text
[ ] patient list workflow
[ ] drawer workflow
[ ] fields to review
[ ] missing mask/device handling
[ ] review status wording
[ ] export workflow (NHI exclusion, opt-in reason, audit before download)
[ ] backup verification workflow
[ ] escalation path
[ ] not clinical advice (explicit)
```

### Day 41 — Release SOP + Known Limitations [MUST]

```text
[ ] go/no-go checklist
[ ] pre-release checks
[ ] smoke test checklist (incl. backup smoke test — Rule 18)
[ ] admin / import / export / backup checks
[ ] known limitations
[ ] support boundaries
[ ] rollback / escalation notes (restore via AWS console only — Rule 17)
[ ] signoff checklist
```

### Day 42 — Support Model + Retainer Boundaries [MUST]

```text
[ ] included monthly support
[ ] excluded work
[ ] response expectations
[ ] emergency handling
[ ] bug vs feature request
[ ] change request process
[ ] monthly improvement cadence
[ ] AWS / hosting boundaries
[ ] backup monitoring inclusion
[ ] NZD 2,300/month incl GST retainer anchor
```

### Day 43 — Midland OS Handover Index [MUST]

Create: `/midland-os/HANDOVER-INDEX.md`

```text
[ ] what Midland OS v1 is
[ ] Phase 1 capability summary (incl. Admin Data Operations)
[ ] links to status, phase map, workflows, SOPs, limitations, risks, support model
[ ] how to request changes
[ ] what happens after go-live
[ ] state Midland OS v1 is an operating layer, NOT a separate AI product
```

### Day 44 — Risks, Decisions, Learnings Cleanup [MUST]

```text
[ ] no Cognito patient accounts in Phase 1 import
[ ] no patient invite/email flow before June 30
[ ] PutItem-only audit rule
[ ] no fake mask fallback
[ ] no raw NHI returned from imported patient API
[ ] checkout / inventory / mobile deferred
[ ] decision: Admin Data Operations added in v3.1 (record commercial path)
[ ] decision: portal-driven restore/delete forbidden in Phase 1 (Rule 17)
```

### Day 45 — 1E Closeout + Handover Pack [MUST]

Create: `/midland-os/07-outputs/phase-1/phase-1e-closeout-summary.md`

Done when every Midland OS file reviewed, handover index links correct, support model clear, limitations honest, import/admin/export/backup SOPs usable.

### Days 46–49 — 1F Patient Visual Clarity Sprint [STRETCH]

Narrowed window (was 7 days, now 4) to absorb the Admin Data Operations sub-system. Only after 1C / 1D / 1E are stable. Focus:

```text
[ ] older-patient readability
[ ] typography
[ ] contrast
[ ] spacing
[ ] tap targets
[ ] mobile browser clarity
[ ] product/machine image slots
[ ] no generated/unlicensed images
```

Do not open: checkout, inventory, mobile app, payment, email, patient invites.

### Day 50 — Final Go-Live Readiness Checkpoint [MUST]

```text
[ ] git clean
[ ] npx tsc --noEmit pass
[ ] npm run build pass
[ ] dry-run works
[ ] execute import works
[ ] duplicate protections work
[ ] imported patients visible
[ ] drawer opens
[ ] no raw NHI exposure
[ ] export/evidence path works (incl. NHI excluded by default — Rule 16)
[ ] backup smoke test passes (PITR enabled, on-demand works, last weekly snapshot present — Rule 18)
[ ] AWS state visibility panel reads cleanly
[ ] portal-driven restore / delete confirmed not exposed (Rule 17)
[ ] Midland OS handover complete
[ ] support model documented
[ ] blocked-by-client list updated
```

Client-blocked checklist:

```text
[ ] ALTER owner confirmed
[ ] ALTER export format confirmed
[ ] columns confirmed
[ ] migration window agreed
[ ] Privacy Officer review booked / completed
[ ] clinical / data signoff owner named
[ ] staff training / walkthrough date agreed
```

---

## 15. ARCHITECTURE DESIGN

### 15.1 Goal

Ship Phase 1B by June 30 as a production operations portal — not a full SaaS platform yet.

### 15.2 High-level architecture

```text
Browser
  ↓
Next.js / TypeScript app (App Router)
  ↓
Protected routes + role-based UI (patient | admin | dev)
  ↓
API routes / server actions
  ↓
AWS Cognito (auth)
  ↓
DynamoDB (7 tables)
  ↓
CloudWatch logs/monitoring
```

### 15.3 User groups

```text
Patient
Admin
Developer / OneOfZero support
Future: clinic manager, inventory/fulfilment role
```

### 15.4 Core Phase 1B workflows

1. **Patient portal foundation** — login → dashboard → entitlement/funding visibility → machine/mask overview → support/reorder pathway.
2. **Admin portal foundation** — login → patient list → imported patients → patient drawer → review → export/evidence.
3. **Controlled import** — CSV/XLSX → dry run → validation → duplicate detection → approval → execute → DynamoDB writes → summary → admin visibility.
4. **Midland OS workflow** — status file → day plan → implementation → evidence → SOP → risk/decision log → handover.

### 15.5 Architecture principles

```text
- MVP first
- No unnecessary backend rewrites
- No patient account creation during import
- No email automation in Phase 1B
- No order/fulfilment writes during import
- No fake data fallbacks in patient/admin views
- No raw NHI in API responses unless via existing safe reveal flow
```

### 15.6 Future architecture (post Phase 1B)

```text
Phase 2  Admin Operations OS         notes, outreach, safety checks, reporting
Phase 3  Entitlement Commerce OS     entitlement-aware catalogue, checkout, co-pay
Phase 4  Inventory & Fulfilment OS   SKUs, stock, suppliers, reorder thresholds
Phase 4.5 Mobile / PWA               only after ordering and fulfilment stable
Phase 6  Multi-Clinic OS             tenant separation, terraform per clinic
```

---

## 16. SYSTEMS DESIGN

### 16.1 Identity and Access System

```text
- AWS Cognito (2 pools: patient, staff)
- Next.js protected routes
- Role-based access
- Session cookies / token handling
- Rules:
  - NHI is not a credential
  - admin and patient access remain separated
  - dev/support access must be auditable
```

### 16.2 Patient Data System

```text
Storage: DynamoDB
  patients table
  devices table
  masks table
  entitlement table

Phase 1B data rules:
  - import creates patient/device/mask records only
  - no order/comms writes during import
  - no patient Cognito account creation during import
  - no raw NHI in normal admin responses
```

### 16.3 Import System

```text
Workflow:
  source file
  → parse
  → validate
  → detect duplicate NHI/serial
  → dry run
  → approval gate
  → execute
  → created / skipped / failed
  → evidence pack

Controls:
  - batch ID
  - skipped/failed reasons
  - no uncontrolled writes
  - audit append where applicable
```

### 16.4 Admin Review System

```text
imported patient list
  → drawer / detail
  → machine / mask / funding review
  → status / evidence
  → export / report bridge

Phase 1B review status may be display-only if mutation is not built safely.
```

### 16.5 Audit / Evidence System

```text
- append-only (PutItem only)
- no raw NHI logs
- safeLog() instead of console.log() for patient-related data
- evidence captured in /midland-os/07-outputs
```

### 16.6 SOP / Handover System

```text
import-sop.md
admin-review-sop.md
release-sop.md
support-model.md
known-limitations.md
HANDOVER-INDEX.md
```

### 16.7 OneOfZero Commercial System

```text
Purpose: turn delivery into case study, retainer justification, future clinic IP.
Outputs:
  - before/after proof
  - pricing logic
  - case study notes
  - reusable implementation modules
  - proposal language
  - future roadmap
```

### 16.8 Data flow: import to admin

```text
Biomedical-style CSV
  ↓
Dry-run validation
  ↓
Approval gate
  ↓
Execute import
  ↓
DynamoDB records (patient + device + mask + entitlement)
  ↓
Admin imported patients API
  ↓
Admin table
  ↓
Drawer / detail
  ↓
Export / evidence
  ↓
SOP / handover
```

### 16.9 Failure modes

```text
- ALTER export delayed
- columns do not match expected format
- real data messier than test data
- duplicate NHI / serial conflicts
- missing mask / device / funding fields
- Privacy Officer review delayed
- scope creep into checkout / inventory / mobile
```

### 16.10 Mitigation

```text
- document blocked-by-client items
- capture evidence at every step
- keep known limitations honest
- do not overbuild
- use the day-by-day tracker
- treat 1F as stretch
```

---

## 17. AWS STACK + CI/CD

### 17.1 Stack

```text
Hosting       AWS Amplify
Auth          Amazon Cognito (2 pools)
Database      Amazon DynamoDB (7 tables)
Monitoring    Amazon CloudWatch (6 alarms)
Email         Amazon SES — transactional only, NOT patient mail in 1B
Storage       S3 — only if file/image storage required
Payments      Stripe — Phase 1A demo only, dormant in 1B
Secrets       AWS Secrets Manager (NHI key dev + prod)
Security      AWS WAF (Common Rules + rate limiting)
IaC           Terraform — months 5–6, not before June 30
Region        ap-southeast-2 (Sydney)
```

### 17.2 Phase 1B infrastructure priorities

```text
- stable Amplify deployment
- secure Cognito auth
- DynamoDB tables working for patient / device / mask / entitlement / import
- CloudWatch visibility for production issues
- safe env variable handling
- no secrets committed
- no real patient data in AI tools
```

### 17.3 CI/CD minimum for June 30

Do not overbuild.

```text
GitHub main branch
  → Amplify deployment
  → typecheck/build before merge
  → environment variables in AWS/hosting settings
  → production smoke test after deploy
```

Local verification before push:

```bash
git status
npx tsc --noEmit
npm run build
```

Branch flow for docs:

```bash
git checkout -b docs/day-30-midland-os-pack
git add midland-os/
git commit -m "docs: add Midland OS production rehearsal pack"
git push origin docs/day-30-midland-os-pack
```

Branch flow for code:

```bash
git checkout -b feat/admin-export-bridge
npx tsc --noEmit
npm run build
git add -A
git commit -m "feat: add safe imported patient export bridge"
git push origin feat/admin-export-bridge
```

### 17.4 Deployment checklist

```text
[ ] repo clean
[ ] typecheck passes
[ ] build passes
[ ] env vars confirmed
[ ] auth smoke test
[ ] admin login smoke test
[ ] import dry-run smoke test
[ ] controlled execute smoke test using demo data
[ ] imported patient visible
[ ] drawer opens
[ ] export / evidence path works
[ ] no raw NHI exposure
[ ] CloudWatch logs checked
[ ] known limitations updated
```

### 17.5 Do not do before June 30

```text
- Terraform rewrite
- multi-account AWS design
- event-driven queues unless already necessary
- SES patient email automation
- Stripe / checkout pipeline
- inventory / supplier integrations
- native mobile app pipeline
```

### 17.6 Future CI/CD (post go-live)

```text
- staging / prod environment discipline
- automated tests for import parser/validator
- release checklist PR template
- CloudWatch alarm tuning
- backup / export strategy
- IaC gradually
- security review cadence
```

---

## 18. SKILLS — REUSABLE PROMPT MODULES

Modular skills for Claude Code or Codex sessions. Reference these by name in prompts.

### Skill 1 — Scope Guard

Purpose: stop Phase 1B from drifting into checkout, inventory, mobile, or full CRM.

```text
If the request touches: checkout, Stripe, inventory, mobile app, patient
invites, Cognito patient creation, or email flows before June 30 — flag it
and offer a safe deferral path. Do not implement.

Output:
  Allowed / Not allowed
  Why
  Safest next action
  Verification
```

### Skill 2 — Controlled Import Review

```text
[ ] dry run works
[ ] execute path gated
[ ] duplicate NHI protected
[ ] duplicate serial protected
[ ] created / skipped / failed summary exists
[ ] no raw NHI returned
[ ] no fake fallback data
[ ] no Cognito user creation
[ ] no patient email / invite flow
[ ] no orders / comms writes

Verification:
  npx tsc --noEmit
  npm run build
```

### Skill 3 — Admin Review Workflow

```text
[ ] imported patients visible
[ ] drawer opens
[ ] machine / device shown clearly
[ ] mask data shown honestly
[ ] no fake fallback
[ ] review status wording human-readable
[ ] export / report bridge exists or is documented
```

### Skill 4 — SOP Writer

Every SOP includes:

```text
Purpose
Owner
Preconditions
Steps
Expected result
Failure handling
Escalation
Known limitations
Out of scope
```

### Skill 5 — Release Readiness

```text
[ ] git clean
[ ] npx tsc --noEmit pass
[ ] npm run build pass
[ ] import rehearsal evidence captured
[ ] admin review flow works
[ ] known limitations documented
[ ] support model documented
[ ] client-blocked items listed
```

### Skill 6 — Patient Visual Clarity

Stretch only after 1C / 1D / 1E stable. No backend changes. No checkout / inventory. No generated / unlicensed images. Improve typography, contrast, spacing, tap targets, card clarity.

### Skill 7 — Commercial Asset Extractor

For every milestone, capture:

```text
Before state
After state
Admin hours saved or risk reduced
Operational proof
Reusable clinic template note
Future phase upsell
Case study note
```

### Skill 8 — Token Saver

```text
- start with current status only
- reference local files instead of pasting huge docs
- ask for one task at a time
- no long explanations unless requested
- prefer checklists and diffs
- stop after next action
```

### Skill 9 — Brutal Review

```text
Review this plan / code / doc brutally.

Check:
1. Does it move Midland toward import → review → export → SOP → handover?
2. Does it create scope creep?
3. Does it risk patient data exposure?
4. Does it support the NZD 42k Phase 1 value story?
5. Is it safe for June 30?
6. What should be cut?
7. What is the next single action?

Be concise. No motivational fluff.
```

### Skill 10 — Export Hygiene

Use before any export endpoint or button ships.

```text
[ ] NHI excluded by default
[ ] opt-in NHI export requires written reason captured pre-generation
[ ] audit row PutItem written BEFORE file generated
[ ] download link single-use, 24h expiring, watermarked
[ ] patient demographics minimised — only fields required for the use case
[ ] no raw query parameters in URLs
[ ] no console.log of patient data anywhere in the export path
[ ] CSV escaped properly (commas, quotes, newlines)

Verification:
  npx tsc --noEmit
  manual: trigger export, check audit table has row with admin id + reason BEFORE file URL
  manual: open generated CSV, confirm no NHI / no PII beyond declared scope
```

### Skill 11 — Backup & Restore Discipline

Use before any backup work, and as part of every release SOP.

```text
[ ] DynamoDB PITR enabled on all 7 tables (verify via AWS console)
[ ] on-demand backup endpoint requires admin role + reason
[ ] weekly S3 snapshot Lambda has CloudWatch alarm on failure
[ ] backup S3 bucket: encrypted at rest, versioning ON, public access BLOCKED
[ ] restore is documented in release-sop.md but NOT exposed in portal
[ ] backup status panel reads from CloudWatch / DynamoDB describe APIs only
[ ] no portal-driven destructive operations (Rule 17)

Verification:
  trigger on-demand backup → confirm describe-backup returns SUCCESS
  inspect last weekly snapshot in S3 → confirm CSV opens, NHI column is encrypted
  attempt delete from portal → must 403 / not exist
```

---

## 19. PROMPT TEMPLATES

### 19.1 Surgical code task

```text
Objective:
[one sentence]

Context:
Midland Sleep portal. Phase 1B. Current slice: [1C/1D/1E/1F].
Reference: midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
Do not expand scope.

Allowed files:
- [exact files]

Forbidden files:
- auth
- middleware
- Cognito logic
- DynamoDB logic unless explicitly allowed
- checkout / cart / shop
- inventory
- email / invite flows
- patient portal unless explicitly allowed

Requirements:
- [specific requirements]

Data rules:
- no real patient data
- no raw NHI logs
- no fake fallback data
- do not expose sensitive fields

Edge cases:
- [list]

Acceptance criteria:
- [list]

Verification:
  npx tsc --noEmit

After completion, respond with:
  Files changed:
  Verification result:
  Risks / notes:
  Next step:
```

### 19.2 Documentation task

```text
Objective:
Create / update [doc name] for Midland OS v1.

Context:
Phase 1B production readiness and handover. Must be honest, bounded,
useful for clinic operations.

Include:
- purpose
- owner
- process
- risks
- known limitations
- what is out of scope
- escalation
- support boundary

Do not:
- overpromise automation
- claim legal / compliance certification
- mention future features as included
```

### 19.3 UI clarity task

```text
Objective:
Improve readability and clarity for older patients.

Allowed:
- typography
- spacing
- contrast
- helper copy
- button clarity
- image slot consistency

Forbidden:
- backend
- API
- auth
- data model
- checkout
- inventory
- email
- generated images

Verification:
  npx tsc --noEmit
```

### 19.4 Brutal review prompt

(Use Skill 9.)

---

## 20. COMMERCIAL STRATEGY + PRICING

### 20.1 Positioning

Do **not** sell this as a website. Sell:

> Midland Sleep Phase 1 Production Operations Portal

Outcome:

> Move Midland from spreadsheet/manual patient tracking into a live admin portal where the first 50–100 patient records can be safely validated, imported, reviewed, updated, and operationally managed.

### 20.2 Phase 1 package — anchor numbers

```text
Phase 1 build:    NZD 42,000 incl GST
Retainer:         NZD 2,300 / month incl GST
```

Included:

```text
1.  live production admin/patient portal foundation
2.  controlled import governance
3.  controlled real import of first 50–100 patient-style records / rehearsal
4.  admin patient list + detail / drawer
5.  basic review visibility
6.  export / report bridge
7.  essential UI/UX polish
8.  SOPs, onboarding, handover
9.  support model
10. Midland OS v1 documentation layer
```

Excluded:

```text
- full ecommerce checkout
- Stripe
- full inventory management
- supplier integration
- automated Biomedical/ALTER sync
- unlimited spreadsheet formats
- unlimited imports
- advanced shipping automation
- full audit dashboard
- patient invitation automation
- patient email automation
- legal / compliance responsibility
- clinical responsibility
```

### 20.3 Milestone billing (recommended)

```text
15%  deposit / mobilisation              = NZD 6,300
20%  1B-a Import Governance              = NZD 8,400
25%  1C Controlled Import Engine         = NZD 10,500
20%  1D Admin Review + Visibility        = NZD 8,400
20%  1E SOPs + Midland OS v1 + Handover  = NZD 8,400
                                           ────────
                                           NZD 42,000
```

### 20.4 Internal cost / time estimates

```text
1C closeout / evidence:           1–3 days
1D admin visibility / export:     3–5 days
1E SOPs / handover:               5–7 days
1F visual clarity:                5–8 days (stretch)
QA / rehearsal / go-live:         5–10 days

Opportunity cost:                 NZD 120–180/hr internal rate
Founder delivery cost (range):    NZD 12,000–33,000 equivalent
                                  depending on scope discipline
```

### 20.5 External expenses to watch

```text
AWS hosting / infra MVP:                NZD 50–300+/month early
                                         (rises with traffic / logging / storage)
Domain / DNS / email tools:             NZD 20–100/month
AI coding tools / subscriptions / API:  NZD 50–500+/month depending on usage
Legal review of contract:               NZD 1,000–3,500+ one-off
Accounting / GST / tax:                 variable
Professional indemnity / cyber insurance: investigate before production
                                          healthcare-adjacent support
Product images / assets:                use licensed / approved assets only
```

### 20.6 Hosting margin

```text
AWS actual cost:         ~NZD 30–95 / month
Charged to Midland:      NZD 150–300 / month  (hosting line in retainer)
Net margin:              NZD 70–220 / month
```

### 20.7 Retainer boundaries

Included:

```text
- maintenance
- minor fixes
- small improvements within agreed monthly capacity
- release oversight
- AWS / admin support checks
- support questions
- monthly improvement review
```

Excluded:

```text
- major new features
- checkout
- inventory
- mobile app
- supplier integration
- patient invite automation
- unlimited changes
- clinical / compliance legal responsibility
```

### 20.8 Future phase pricing

```text
Phase 2  Admin Operations OS              NZD 18,000–30,000
Phase 3  Entitlement Commerce OS          NZD 25,000–45,000
Phase 4  Inventory & Fulfilment OS        NZD 20,000–35,000
Phase 5  Retention & Patient Growth OS    NZD 12,000–25,000
PWA / Mobile Access Layer                 NZD 8,000–15,000
Native mobile app                         NZD 25,000–60,000+
Phase 6  Multi-Clinic OS                  strategic, not feature-priced
```

### 20.9 Year 1 OneOfZero earnings (range)

```text
Phase 1A prototype:           NZD 3,500–5,000
Phase 1B full build:          NZD 22,000–28,000  (sub-totals; canonical anchor is NZD 42k)
Monthly retainer (12 mo):     NZD 18,000–24,000  ($1,500–2,000 model) | NZD 27,600 ($2,300 anchor)
Hosting margin (12 mo):       NZD 1,800–2,640
                              ────────────────
YEAR 1 RANGE (anchor model):  NZD ~70,000–~75,000 incl GST
```

### 20.10 Month 12 revenue share negotiation

```text
DO NOT negotiate at contract signing. First deliver value.
Then negotiate from proof.

Conversation: 'The portal generated $X in optional shop sales and saved
              $Y in admin time. Formalise a revenue share — 85/15 on
              shop revenue. Aligns our incentives.'

Contract seed at signing:
  'Revenue share arrangements for optional product sales will be reviewed
   and agreed upon at the 12-month contract review.'

Year 2 conservative range with share:
  retainer        NZD 18,000–27,600
  share 15%       NZD  2,250– 6,000
  hosting margin  NZD  1,800– 2,640
                  ───────────────────
                  NZD 22,000–36,000
```

### 20.11 Midland ROI story (Hormozi value framing)

```text
Year 1 cost to Midland:   NZD 45,000–60,000 (build + retainer)
Returns:
  1. Staff time savings:    35 hrs/week reduction × $35/hr = NZD ~63,700/yr
  2. Optional shop revenue: 2,500 × 20% × $25 margin       = NZD ~12,500/yr
  3. Machine sales upside:  10–30 machines × $200 margin   = NZD 2,000–6,000/yr
  4. Funding case proof:    audit data → +NZD 500,000 govt (1.5M → 2M)
                            ──────────────────────────────────
Total Year 1 return (excl. funding uplift):  NZD ~80,000
Net Year 1 (excl. uplift):                   NZD +20,000–35,000
```

### 20.12 OneOfZero lead-generation angle

Use Midland as the case study.

Lead magnet ideas:

```text
- Clinic Spreadsheet-to-Portal Readiness Checklist
- CPAP Entitlement Workflow Audit
- Sleep Clinic Admin Bottleneck Review
- Patient Reorder Experience Teardown
```

Hormozi-style logic:

```text
Give the secrets, sell the implementation.
Provide value before asking.
Turn the Midland proof into engaged leads for other clinics.
```

### 20.13 Admin Data Operations — commercial position (v3.1 addition)

The Admin Data Operations sub-system (Export + Backup + AWS State Visibility — see Section 27) is a real expansion of the original Phase 1B scope. Two honest options:

```text
Option A — ABSORB
  Keep the NZD 42,000 anchor
  Eats ~3 days of founder time inside the existing milestone budget
  Recommended IF the price has already been signed in writing

Option B — LINE ITEM
  Add "Admin Data Operations — Export, Backup, AWS State Visibility"
  Price: NZD 2,500–3,500 incl GST add-on
  Revised anchor: NZD 44,500–45,500 incl GST
  Recommended IF the contract is not yet signed
  Justification to Midland:
    - backup is an operational safety baseline, not a feature
    - export visibility is what makes the portal actually usable
    - this would otherwise be Phase 2 scope, brought forward
```

Either way, document the choice in `02-product/decision-log.md` with date, reasoning, and Midland communication.

---

## 21. MIDLAND OS v1 vs ONEOFZERO OS

### 21.1 Midland OS v1 — clinic-side

**Purpose:** run clinic operations safely.

**Core jobs:**

```text
1. Import governance
2. Data mapping
3. Admin review
4. SOP handover
5. Known limitations
6. Support process
7. Go-live readiness
```

### 21.2 OneOfZero OS — business-side

**Purpose:** protect scope, package IP, turn Midland into a reusable clinic operations offer.

**Core jobs:**

```text
1. Weekly planning
2. Scope control
3. Pricing logic
4. Proposal assets
5. Case study capture
6. Retainer justification
7. Multi-clinic roadmap
```

### 21.3 Recommended folder structure

```text
/midland-os
  /00-core-context
    CANONICAL-STATUS.md
    midland-overview.md
    oneofzero-positioning.md
    non-negotiables.md
    phase-map.md
    pricing-scope.md
    data-boundaries.md
    /claude-context-pack
      MIDLAND-ONEOFZERO-OS-MASTER-PACK.md  ← this file

  /01-clinic-operations
    biomedical-import-workflow.md
    admin-review-workflow.md
    patient-lifecycle.md
    support-workflow.md
    reporting-metrics.md

  /02-product
    mvp-rules.md
    feature-backlog.md
    decision-log.md
    release-notes.md
    ui-ux-standards.md
    PHASE-1B-EXECUTION-TRACKER.md

  /03-technical
    architecture.md
    systems-design.md
    aws-stack.md
    cicd.md
    auth-boundaries.md
    dynamodb-model-notes.md
    deployment-runbook.md
    audit-logging-rules.md

  /04-sops
    import-sop.md
    admin-review-sop.md
    release-sop.md
    support-model.md
    onboarding-sop.md

  /05-prompts
    MASTER-CLAUDE-INTRO-PROMPT.md
    /claude-code-prompts
    /codex-prompts
    /strategy-prompts
    /qa-prompts

  /06-memory
    weekly-summary.md
    risks.md
    known-limitations.md
    learnings.md
    open-loops.md

  /07-outputs
    /phase-1
    /phase-2
    /proposals
    /sales-assets

  HANDOVER-INDEX.md
```

### 21.4 Operating cadence

Weekly:

```text
Monday     top 3 priorities, blocked tasks, open risks
Wednesday  build checkpoint
Friday     shipped / slips / decisions / commercial notes
```

Every milestone:

```text
- update decision-log.md
- update weekly-summary.md
- update risks.md
- update learnings.md
- capture before/after proof
```

### 21.5 Operating "agents" — controlled workflows, not autonomous bots

Do **not** start with autonomous agents. Start with named, scoped workflows:

```text
1. Import Governance Agent       — runs the import SOP
2. Data Mapping Agent            — column mapping for new spreadsheet shapes
3. Admin Review Agent            — checks list / drawer / export are clean
4. Support / Service Agent       — applies retainer rules to incoming requests
5. Weekly Improvement Agent      — drives the Mon / Wed / Fri cadence
6. Commercial Asset Extractor    — pulls before/after proof for case studies
```

### 21.6 The value story to sell

> Production Operations Portal + Midland OS v1
> A controlled clinic operating layer that helps Midland safely validate, import, review, and manage patient records from Biomedical-style spreadsheet workflows.

### 21.7 What not to do

```text
- build a chatbot first
- call this an AI diagnosis tool
- route real patient data into AI tools
- replace the portal with docs
- spend more time planning than shipping
```

---

## 22. ONEOFZERO OS — INTERNAL OPERATING ADVISOR PROMPT

For ChatGPT / business-side sessions:

```text
You are the internal operating advisor for OneOfZero Systems.

Mission: help Paul Alejo protect scope, ship Midland Sleep Phase 1B, turn
the work into reusable clinic IP, and position OneOfZero as a strategic
long-term healthcare-adjacent operations partner.

Operating principles (in order):
  Business owner first
  Product strategist second
  Senior engineer third
  Freelancer last

Always evaluate:
  value created
  admin hours saved
  operational risk reduced
  patient experience improved
  data handling risk
  scope control
  retainer potential
  reusable clinic IP

Default answer structure:
  1. Honest recommendation
  2. Reasoning
  3. Risks
  4. Pricing / structure
  5. Next action

Do not:
  - underprice
  - suggest employee-like support
  - use vague "it depends" without a recommendation
  - open scope casually
  - give legal / compliance advice as a lawyer

Current commercial anchor:
  Phase 1 build: NZD 42,000 incl GST
  Retainer:      NZD 2,300/month incl GST

Strategic target:
  Midland becomes the first case study for a productized healthcare
  operations portal offer.
```

---

## 23. INFRASTRUCTURE DECISIONS LOCKED

These are decided. Do not reopen them.

```text
- AWS, not Azure. AWS stays regardless of Midland using M365. M365 is SaaS
  productivity (their IT). AWS is custom infra (the portal). Independent
  layers. SSO federation (Cognito ↔ Azure AD) is a Month 6 item, not 1B.

- Stripe dormant in Phase 1B. Shop and checkout are Phase 1A demo only.
  Code lives in src/phase2/, returns 404 in production. Reactivation =
  Month 12 contract review. See ADR 006 in docs/decisions/.

- DynamoDB, not RDS. 7 tables, PAY_PER_REQUEST, deletion protection ON.

- Amplify, not ECS / EKS. Serverless hosting is right for this scale.

- 7 DynamoDB tables. No points table, no consultations table, no
  stripe_payments table in Phase 1B.

- ap-southeast-2 (Sydney). Single region for Phase 1. HIPC Rule 12 via
  Cloud Risk Assessment (Midland's responsibility).

- AWS will handle 20,000 patients (Waikato district scale) with zero
  architecture changes. DynamoDB cost goes from ~$20 to ~$40–60 NZD/month.
  Same stack, same code, same deployment.
```

---

## 24. DATA MIGRATION WARNING (HIGHEST EXTERNAL RISK)

The most likely cause of a June 30 miss is **data migration, not code.**

Before go-live, someone must export existing patient records (machines, masks, NHI, entitlement history) from ALTER / spreadsheets and import into DynamoDB with NHI encryption. This is a 1–2 week project requiring:

```text
- export from ALTER in a usable format
- NHI encryption of every record (AES-256-GCM)
- clinical sign-off from Midland on imported data
- Privacy Officer confirmation
```

**Ask Midland this week:**

> "Who owns the data export from ALTER, what format does it come in, and when can we schedule the migration?"

---

## 25. RESPONSE FORMAT (every implementation reply must end like this)

```text
Files changed:
Verification:
Risks / notes:
Next step:
```

For implementation planning:

```text
Plan:
Files:
Commands:
Risks:
Next:
```

---

## 26. FINAL OPERATING RULE

Do not build more features for the sake of features. Move Midland toward:

> import → review → export/report → SOP → handover → go-live

Then start the retainer, package the case study, and use it to win the next clinic.

---

## 27. ADMIN DATA OPERATIONS — EXPORT, BACKUP, AWS STATE VISIBILITY

This is the sub-system that turns the admin portal from a viewer into the actual operating layer over AWS. It is what makes "Midland OS v1" real instead of just docs. It is also the concrete answer to "what does agentic OS mean here?" — admin staff get *agency* over their data through the portal, not autonomous bots.

### 27.1 Why this is in Phase 1

```text
- Operationally critical: a clinic cannot run on a portal it cannot get data out of.
- Backup is a baseline safety obligation, not a feature.
- AWS state visibility is what stops admin staff asking "is the data still there?"
- Already partially scoped in the original Day 33 export/report bridge.
- Without it, Midland depends on Paul + AWS console for every data question.
```

### 27.2 Three sub-systems

#### A. EXPORT (read-out)

```text
Imported patients CSV          filter by batch ID, status, date range
Combined patient/device/mask   admin operational view — single CSV
Entitlement summary CSV        per patient, current year
Audit log window               last 30 / 90 days, JSON or CSV (read-only)

Hygiene (every export endpoint):
  - NHI EXCLUDED by default
  - opt-in NHI requires written reason
  - audit PutItem BEFORE file generation
  - download link single-use, 24h expiring, watermarked filename
  - server-side filtering only, no raw query in URL
  - CSV escaping handled
```

#### B. BACKUP (durability)

```text
DynamoDB PITR                 enabled on all 7 tables, 35-day rolling
On-demand backup              admin role + reason; named DynamoDB backup via SDK
Weekly S3 snapshot Lambda     Sunday 02:00 NZ → s3://midland-sleep-backups/
S3 bucket                     AES-256, versioning ON, public access BLOCKED
Retention                     90 days hot, 1-year cold (Glacier optional)
Failure alerting              CloudWatch alarm → email Paul on snapshot failure
Restore documentation         release-sop.md (NOT exposed in portal — Rule 17)
```

#### C. AWS STATE VISIBILITY (read-only)

```text
/admin/aws-status panel shows:
  - total records per table
  - last write timestamp per table
  - region, encryption status
  - last successful backup (timestamp, size, location)
  - PITR status per table
  - retention policy summary

Reads from:
  - DynamoDB describe-table API
  - DynamoDB describe-backup API
  - S3 list-objects (backups bucket only)
  - CloudWatch metrics (read-only)

Forbidden in portal (Rule 17):
  - delete table / item
  - restore from backup
  - drop / modify schema
  - any IAM mutation
```

### 27.3 Implementation effort

```text
Day 33 — Imported patients CSV export                  (1 day)
Day 34 — Combined / entitlement / audit window export  (1 day)
Day 35 — Backup: PITR + on-demand + weekly S3 snapshot (1.5 days)
Day 36 — AWS state visibility panel                    (1 day)
Day 37 — Import batch evidence summary                 (0.5 day)
                                                       ─────────
Total                                                  ~5 days
```

### 27.4 Why this is "agentic" without being autonomous

The previous Midland OS docs explicitly say *"do not start with autonomous agents — start with controlled workflows"* and that operating "agents" are named, scoped workflows (Import Governance Agent, Admin Review Agent, Support / Service Agent, etc.).

The Admin Data Operations sub-system is the substrate those workflows act on:

```text
- Import Governance Agent → uses controlled import + batch evidence export
- Admin Review Agent      → uses imported patient list + drawer + export
- Support / Service Agent → uses backup status panel + audit window export
- Weekly Improvement Agent→ uses CSV exports for before/after metrics
- Commercial Asset Extractor → uses combined export for case-study metrics
```

Without export + backup, those "agents" have nothing to act on except docs. With them, the portal is a real operating layer.

### 27.5 What this is NOT (scope hygiene)

```text
- not two-way sync with ALTER (one-way out only, in Phase 1)
- not real-time replication (snapshots are weekly + on-demand)
- not portal-driven restore or delete (AWS console only)
- not patient-facing exports (admin only)
- not analytics dashboards (raw export is enough for Phase 1)
- not automated email of exports (admin downloads, not pushes)
```

### 27.6 Acceptance criteria for go-live

```text
[ ] All 4 export types tested with demo data
[ ] NHI excluded by default verified by manual CSV inspection
[ ] Opt-in NHI export writes audit row BEFORE file generation
[ ] PITR enabled on all 7 tables (AWS console screenshot in evidence pack)
[ ] On-demand backup tested end-to-end with describe-backup confirmation
[ ] Last weekly S3 snapshot exists and opens cleanly
[ ] AWS state visibility panel reads without errors
[ ] Restore attempt from portal returns 403 / not exposed
[ ] Backup smoke test added to release-sop.md (Rule 18)
[ ] Restore procedure documented in release-sop.md
```

---



*OneOfZero Systems | Paul Alejo | paul@oneofzero.co.nz*
*Midland Sleep Ltd | Waikato, NZ | CPAP Patient Portal*
*Phase 1B target: June 30, 2026*
*Bundle: midland-blueprint-v6.4.1-CANONICAL*
*Master Pack v3.1 — May 9, 2026*
