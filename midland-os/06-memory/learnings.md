# Learnings

> Captured at every milestone. Append-only. The substrate of the OneOfZero clinic playbook.

## Format

```text
[L-NNN] short title
        Date:        YYYY-MM-DD
        Slice:       1B-a / 1C / 1D / 1D-x / 1E / 1F
        Domain:      build / commercial / data / process / security
        Learning:    one or two sentences, plain English
        Carry-forward: how this changes the way we work or what we do next
```

---

## L-001 — Treat Biomedical-style data as messy by default
**Date:** April 2026
**Slice:** 1B-a → 1C
**Domain:** data
**Learning:** Even sample data from a clinic is dirtier than test data: encoding mismatches, inconsistent date formats, trailing whitespace, NHI-with-spaces. Validation must run before duplicate detection, not after.
**Carry-forward:** Every clinic onboarding starts with a "verify data" step before "approve batch."

---

## L-002 — Display review status before wiring mutation
**Date:** April 2026
**Slice:** 1D
**Domain:** build
**Learning:** Showing review status is a 1-day task. Safely wiring the mutation (audit, IAM, race conditions) is a 3-day task. Shipping the read-only view first lets admin work begin while we earn the right to mutate.
**Carry-forward:** "Read first, write second" is the default for any new admin field.

---

## L-003 — Backup is operational, not technical
**Date:** May 2026
**Slice:** 1D-x
**Domain:** process
**Learning:** PITR is 30 seconds in the AWS console. The hard part is the SOP, the smoke test, and the visibility panel that lets admin staff trust it.
**Carry-forward:** Every backup feature ships with three artefacts — the AWS config, the SOP, and the in-portal status read-out.

---

## L-004 — Surgical edits beat heroic refactors
**Date:** April 2026
**Slice:** 1B-a, 1C
**Domain:** build
**Learning:** Days where the prompt was "Allowed files: [3 files]" shipped clean. Days where it was "review the area" produced rabbit holes.
**Carry-forward:** Every Claude Code / Codex session names allowed files and forbidden files explicitly.

---

## L-005 — Hormozi framing applies to clinic comms, not to patient comms
**Date:** April 2026
**Slice:** product
**Learning:** Rule of 100 / Grand Slam Offer thinking sharpens the OneOfZero offer to Midland. The patient experience itself must be calm and clinical, never sales-coded.
**Carry-forward:** Hormozi mental models stay on the OneOfZero side of the wall. Patient-facing copy is calm and clinical.

---

## L-006 — One canonical pack beats fourteen reference docs
**Date:** May 2026
**Slice:** Midland OS v3.1
**Domain:** process
**Learning:** Drift starts when there are too many sources of truth. Consolidating into a single MIDLAND-ONEOFZERO-OS-MASTER-PACK.md, then splitting into purpose-folders, made AI sessions cheaper and more accurate.
**Carry-forward:** Every clinic gets a single canonical pack. Subfolders are read-references, not parallel truths.

---

## L-007 — "Agentic OS" means agency over data, not autonomous bots
**Date:** May 2026
**Slice:** Midland OS v3.1
**Domain:** product
**Learning:** When Paul says "agentic OS," the substrate is admin agency over AWS data through the portal — export, backup, AWS state visibility. Not autonomous chatbots. Reframing the term unlocked the right Phase 1 feature (Admin Data Operations) instead of the wrong one (a chatbot).
**Carry-forward:** "Agentic" in our context = controlled workflows + admin agency, never autonomous LLM action on patient data.

---

## Template — copy this for the next learning

```markdown
## L-NNN — [title]
**Date:**
**Slice:**
**Domain:**
**Learning:**
**Carry-forward:**
```
