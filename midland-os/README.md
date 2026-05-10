# Midland OS — README

> Operating layer beside the Midland Sleep production portal.
> Not a separate AI product. Not a chatbot. Not a feature.
> A controlled set of context, workflows, SOPs, decisions, risks, and handover material that lets the portal be operated safely.

## Folder map

```text
midland-os/
  00-core-context/      — canonical truth: status, phase map, scope, data rules
    claude-context-pack/  — single drop-in pack for AI sessions
  01-clinic-operations/ — workflows: import, admin review, patient lifecycle, support, reporting
  02-product/           — MVP rules, backlog, decisions, releases, UI standards, execution tracker
  03-technical/         — architecture, systems, AWS, CI/CD, auth, dynamodb, deployment, audit, admin data ops
  04-sops/              — import, admin review, release, support, onboarding, export, backup
  05-prompts/           — master intro, skills, prompt templates, claude/codex/strategy/qa prompts
  06-memory/            — weekly summary, risks, known limitations, learnings, open loops
  07-outputs/           — phase-1, phase-2, proposals, sales-assets evidence
  HANDOVER-INDEX.md     — single entry point for Midland staff after go-live
  README.md             — this file
```

## How to use this folder

**Every Claude Code or Codex session:**
Paste Sections 1 + 2 of `00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md` at the start.

**Daily build:**
Follow `02-product/PHASE-1B-EXECUTION-TRACKER.md` (Day 30 onward).

**Every milestone:**
Update `02-product/decision-log.md`, `06-memory/weekly-summary.md`, `06-memory/risks.md`, `06-memory/learnings.md`. Capture before/after proof in `07-outputs/phase-1/`.

**Before any release:**
Run `04-sops/release-sop.md` checklist end-to-end.

**Handover to Midland:**
`HANDOVER-INDEX.md` is the single entry point.

## Operating cadence (weekly)

```text
Monday     top 3 priorities, blocked tasks, open risks
Wednesday  build checkpoint
Friday     shipped / slips / decisions / commercial notes
```

## Operating "agents" — controlled workflows, not autonomous bots

```text
1. Import Governance Agent       runs the import SOP
2. Data Mapping Agent            column mapping for new spreadsheet shapes
3. Admin Review Agent            checks list / drawer / export are clean
4. Support / Service Agent       applies retainer rules to incoming requests
5. Weekly Improvement Agent      drives the Mon / Wed / Fri cadence
6. Commercial Asset Extractor    pulls before/after proof for case studies
```

## Pack version

v3.1 — May 9, 2026. See `00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md` for the full canonical pack and change log.
