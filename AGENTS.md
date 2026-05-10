# AGENTS.md — Midland Sleep Portal

> Defines sub-agents for Claude Code. These are NOT autonomous bots.
> They are controlled prompt-driven workflows triggered by the developer.

## Sub-agents

### 1. Code Reviewer (`/.claude/agents/code-reviewer.md`)

**Role:** Review code changes before merge.
**Trigger:** Every PR or commit touching `src/`.
**Checks:** TypeScript, build, NHI safety, maskNHI, safeLog, audit PutItem, auth/org_id, scope boundaries, Phase 1B limits, no fake data, copy quality.
**Output:** ✅ APPROVE | ⚠️ CONCERNS | ❌ BLOCK with findings.

### 2. Planner (`/.claude/agents/planner.md`)

**Role:** Produce daily/weekly execution plans.
**Trigger:** Start of session or `/plan`.
**Input:** Current day, slice, repo status, open risks, blocked items.
**Output:** Day plan with tasks, verification, evidence target, risks, next action.
**Rules:** MUST before STRETCH. No scope expansion. Reference PHASE-1B-EXECUTION-TRACKER.md.

### 3. Security Reviewer (`/.claude/agents/security-reviewer.md`)

**Role:** Review security and HIPC compliance.
**Trigger:** Any change touching auth, NHI, audit, export, backup, API routes, env vars.
**Checks:** NHI handling (7 sub-checks), auth (4), audit (3), data safety (4), infrastructure (4).
**Output:** Pass/fail with file:line references.

## Operating "agents" (Midland OS workflows — not sub-agents)

These are documented operating workflows, not Claude Code sub-agents:

```
1. Import Governance        runs the import SOP
2. Data Mapping             column mapping for new spreadsheet shapes
3. Admin Review             patient list / drawer / export discipline
4. Support / Service        retainer rules for incoming requests
5. Weekly Improvement       Monday / Wednesday / Friday cadence
6. Commercial Extractor     before/after proof for case studies
```

## What agents are NOT

```
- autonomous bots running without developer oversight
- AI chatbots for patients or admins
- automated decision-makers for clinical or compliance questions
- a replacement for human judgment on NHI, audit, or data safety
```

## How to use

```bash
# In Claude Code session:
# Reference the agent file to activate its checklist:
"Review this PR using .claude/agents/code-reviewer.md"
"Plan today using .claude/agents/planner.md"
"Security review this diff using .claude/agents/security-reviewer.md"
```
