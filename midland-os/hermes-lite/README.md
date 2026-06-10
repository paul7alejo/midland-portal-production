# Hermes Lite

Hermes Lite is a local prompt, review, release-gate, and handoff helper for OneOfZero Systems and the Midland Sleep portal project.

It is not an autonomous coding agent.

## Purpose

Hermes Lite helps produce:
- Claude implementation prompts
- Codex review prompts
- release-gate checklists
- handoff summaries
- task briefs

## Rules

Hermes Lite must not directly edit production application code.

Protected areas include:
- auth
- middleware
- API routes
- DynamoDB logic
- Cognito logic
- NHI handling
- audit logic
- patient portal workflows
- checkout
- package files

## Usage

node midland-os/hermes-lite/scripts/hermes-lite.mjs claude
node midland-os/hermes-lite/scripts/hermes-lite.mjs codex
node midland-os/hermes-lite/scripts/hermes-lite.mjs release
node midland-os/hermes-lite/scripts/hermes-lite.mjs handoff
node midland-os/hermes-lite/scripts/hermes-lite.mjs brief

## Hermes Workflow v0.6

Deterministic workflow rail — generates task briefs, Claude prompts, Codex review prompts, and Obsidian proof logs locally. No API calls. No file writes.

### task — structured task brief

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs task \
  --objective "Add export button to Orders page" \
  --context "Staff need a CSV export of visible orders" \
  --allowed "src/app/admin/(protected)/orders/page.tsx" \
  --forbidden "src/app/api/**, src/lib/aws/**" \
  --requirements "Export uses visibleOrders; no API calls" \
  --acceptance "CSV downloads with visible rows; tsc and build pass"
```

### claude — Claude Code implementation prompt

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs claude \
  --objective "Add export button to Orders page" \
  --context "Staff need a CSV export of visible orders" \
  --allowed "src/app/admin/(protected)/orders/page.tsx" \
  --forbidden "src/app/api/**, src/lib/aws/**" \
  --requirements "Export uses visibleOrders; no API calls" \
  --acceptance "CSV downloads with visible rows"
```

### codex — Codex review prompt

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs codex \
  --objective "Add export button to Orders page" \
  --claimed "Added downloadCsv helper and Download CSV button" \
  --files "src/app/admin/(protected)/orders/page.tsx" \
  --allowed "src/app/admin/(protected)/orders/page.tsx" \
  --forbidden "src/app/api/**, src/lib/aws/**"
```

### proof-log — Obsidian-ready proof log section

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs proof-log \
  --objective "Phase 2.9-3 Orders Fulfilment Queue Clarity" \
  --commit "07c9313" \
  --amplify "Job 1042 SUCCEED" \
  --files "src/app/admin/(protected)/orders/page.tsx" \
  --claimed "Added STATUS_QUEUE_COPY sub-labels and Funding Check tab" \
  --value "Staff can scan queue status at a glance without opening each order"
```

### ship check — full pre-ship verification

```sh
node midland-os/hermes-lite/scripts/hermes-ship.mjs check
```

Runs: git status, git diff, tsc, build. Stops on first failure.

## Verification

Hermes Lite itself is tooling only.

For Midland application work, always run:
- npx tsc --noEmit
- npm run build

Or use the ship check shortcut above.
