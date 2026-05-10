# REPO-UPDATE-GUIDE.md
# How to Update Your midland-portal Repo with Midland OS v3.1
# One-time setup + daily habit instructions
# May 10, 2026 | paul@oneofzero.co.nz

---

## Total Files in This Pack

Batch 1 — Root files (this batch, download first):
  midland-os/CLAUDE.md
  midland-os/SKILLS.md
  midland-os/README.md
  midland-os/REPO-UPDATE-GUIDE.md

Batch 2 — Context + workflows:
  midland-os/00-core-context/midland-overview.md
  midland-os/00-core-context/non-negotiables.md
  midland-os/00-core-context/phase-map.md
  midland-os/00-core-context/data-boundaries.md
  midland-os/00-core-context/oneofzero.md
  midland-os/01-clinic-operations/biomedical-import-workflow.md
  midland-os/01-clinic-operations/admin-review-workflow.md
  midland-os/01-clinic-operations/support-workflow.md
  midland-os/01-clinic-operations/release-workflow.md

Batch 3 — Product + technical:
  midland-os/02-product/mvp-rules.md
  midland-os/02-product/feature-backlog.md
  midland-os/02-product/ui-ux-standards.md
  midland-os/02-product/DAY2DAY-PHASE-1B-TRACKER.md
  midland-os/03-technical/architecture.md
  midland-os/03-technical/aws-stack.md
  midland-os/03-technical/cicd.md
  midland-os/03-technical/audit-logging-rules.md

Batch 4 — SOPs + prompts + memory:
  midland-os/04-sops/import-sop.md
  midland-os/04-sops/admin-review-sop.md
  midland-os/04-sops/release-sop.md
  midland-os/05-prompts/claude-session-starter.md
  midland-os/05-prompts/codex-export-prompt.md
  midland-os/05-prompts/codex-backup-prompt.md
  midland-os/05-prompts/codex-admin-drawer-prompt.md
  midland-os/06-memory/CANONICAL-STATUS.md
  midland-os/06-memory/decision-log.md
  midland-os/06-memory/risks.md
  midland-os/06-memory/learnings.md

Plus (copy manually):
  midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK-v3.1.md

Total: 32 files across 4 batches.

---

## Step 1 — Open Your Repo

```bash
cd ~/your-repos/midland-portal
git status
```

Confirm clean or note what is pending.

---

## Step 2 — Create the Folder Structure

```bash
mkdir -p midland-os/00-core-context/claude-context-pack
mkdir -p midland-os/01-clinic-operations
mkdir -p midland-os/02-product
mkdir -p midland-os/03-technical
mkdir -p midland-os/04-sops
mkdir -p midland-os/05-prompts
mkdir -p midland-os/06-memory
mkdir -p midland-os/07-outputs/phase-1
```

---

## Step 3 — Copy All Files In

After downloading each batch from Perplexity, copy into the matching folder.

Example for Batch 1:
  CLAUDE.md           → midland-os/CLAUDE.md
  SKILLS.md           → midland-os/SKILLS.md
  README.md           → midland-os/README.md
  REPO-UPDATE-GUIDE.md → midland-os/REPO-UPDATE-GUIDE.md

For all other batches, match the filename to the folder structure in Step 2.

Place the master pack here:
  MIDLAND-ONEOFZERO-OS-MASTER-PACK-v3.1.md
  → midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK-v3.1.md

---

## Step 4 — Personalise These Two Files (required before first AI session)

### midland-os/06-memory/CANONICAL-STATUS.md
  - Date: → today's date
  - Days to June 30: → count from today (today = May 10 = 51 days)
  - Execution slice: → 1C closeout / 1D
  - Today's bottleneck: → 1C closeout docs
  - Today's single next action: → [what you will do first]
  - External blockers: → update dates you first raised each item

### midland-os/CLAUDE.md — STATUS BLOCK (top of file)
  - Date: → today
  - Days to June 30: → 51
  - Execution slice: → 1C

---

## Step 5 — Make the Commercial Decision First

Open: midland-os/06-memory/decision-log.md → ADR-012

Question: Is the NZD 42k contract ALREADY SIGNED?

  YES → Option A: absorb export/backup into flat rate.
        Add note to decision-log.md:
        "ADR-012 resolved: Option A — absorb, contract signed [date]"

  NO  → Option B: add NZD 2,500–3,500 line item to proposal.
        Update decision-log.md:
        "ADR-012 resolved: Option B — separate line item, proposal not yet signed"
        Revise quote before sending Midland anything.

---

## Step 6 — Verify .gitignore Does Not Ignore midland-os/

```bash
git check-ignore -v midland-os/README.md
```

If it returns nothing: you are fine.
If it returns a rule: remove that rule from .gitignore.

---

## Step 7 — Commit to Repo

```bash
git checkout -b docs/midland-os-v3.1-pack
git add midland-os/
git commit -m "docs: Midland OS v3.1 master pack — all context, SOPs, skills"
git push origin docs/midland-os-v3.1-pack
```

Open a PR and merge to main.

---

## Step 8 — First Claude Code Session

Open VS Code in your midland-portal repo.
Open a new Claude Code / Codex session.
Paste this prompt (fill in the brackets first):

---
Please read midland-os/CLAUDE.md first. Then read midland-os/06-memory/CANONICAL-STATUS.md.

Today:            [date]
Days to June 30:  [number]
Current slice:    1C closeout
Last git commit:  [paste: git log -1 --oneline]
git status:       [paste output]
tsc check:        [paste: npx tsc --noEmit]
Top blocker:      ALTER export format not confirmed by Midland.

What is the single next action I should take today?
---

---

## Daily Habit Going Forward (5 min, end of every working day)

1. Update midland-os/06-memory/CANONICAL-STATUS.md
2. Tick row in midland-os/02-product/DAY2DAY-PHASE-1B-TRACKER.md
3. git status && npx tsc --noEmit
4. git add midland-os/ && git commit -m "docs: Day [N] status update"
5. Log any new risks or decisions in 06-memory/ files

---

## Three Non-Negotiables Before Anything Else

1. ADR-012 commercial decision (signed or not?)
2. Chase ALTER format from Midland this week (see risks.md RISK-001)
3. Day 30 first — closeout docs before new code features
