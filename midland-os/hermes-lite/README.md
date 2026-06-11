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

## Hermes Workflow v0.8

Deterministic workflow rail — generates task briefs, Claude prompts, Codex review prompts, and Obsidian proof logs locally. No API calls. Without `--append`, no file writes.

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

### proof-log — Obsidian-ready proof log section (stdout)

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs proof-log \
  --objective "Phase 2.9-3 Orders Fulfilment Queue Clarity" \
  --commit "07c9313" \
  --amplify "Job 1042 SUCCEED" \
  --files "src/app/admin/(protected)/orders/page.tsx" \
  --changes "Added STATUS_QUEUE_COPY sub-labels and Funding Check tab" \
  --value "Staff can scan queue status at a glance without opening each order"
```

`--changes` and `--claimed` are interchangeable — both map to the "What changed" field.

### proof-log — append to existing log file

```sh
node midland-os/hermes-lite/scripts/hermes-workflow.mjs proof-log \
  --objective "Phase 2.9-3 Orders Fulfilment Queue Clarity" \
  --commit "07c9313" \
  --amplify "Job 1042 SUCCEED" \
  --files "src/app/admin/(protected)/orders/page.tsx" \
  --changes "Added STATUS_QUEUE_COPY sub-labels and Funding Check tab" \
  --value "Staff can scan queue status at a glance without opening each order" \
  --append --log-file "midland-os/proof-log.md"
```

**Append mode behaviour:**
- Requires `--log-file` — fails if missing.
- Target file must already exist and have a `.md` or `.markdown` extension — fails closed if not.
- Scans content for placeholder tokens before preview — fails closed if any are found (see below).
- Prints a full preview of the content that will be appended.
- Requires typing exactly `LOG` to proceed — anything else aborts with no file write.
- Appends `\n\n<content>` to the end of the file.

**Placeholder guard (append mode):**

Append mode blocks the following unfilled placeholder tokens and exits non-zero before showing the LOG prompt:

```
[ACTUAL   [NEW COMMIT   [JOB ID]   PASTE_   REAL_JOB_ID
REAL_SHORT_HASH   TODO   TBD   <commit>   <job>
your commit   your job
```

If any of these are detected, replace them with the real commit hash and Amplify job/status before re-running. Stdout-only mode (without `--append`) prints a warning for placeholders but does not fail.

**Security warning — never pass as CLI arguments:**
- Raw NHI, encrypted NHI, or NHI hash
- Patient email, phone number, or address
- Admin email or Cognito sub / username
- AWS keys, API keys, tokens, or session secrets
- Raw audit payloads or clinical notes
- `.env` values of any kind

All CLI arguments appear in shell history. Use safe placeholder text for sensitive fields and fill them in manually after generating the log.

### ship check — full pre-ship verification

```sh
node midland-os/hermes-lite/scripts/hermes-ship.mjs check
```

Runs: git status, git diff, tsc, build. Stops on first failure.

## Hermes Release v0.7

Supervised ship runner — scoped git add / commit / push with mandatory SHIP confirmation. Never runs `git add .`. Never commits files outside `--files`. Never runs AWS commands.

### ship — commit and push listed files

```sh
node midland-os/hermes-lite/scripts/hermes-release.mjs ship \
  --message "Phase 2.9-5B admin communication status clarity" \
  --files "src/app/admin/(protected)/orders/page.tsx"
```

Multiple files (comma-separated):

```sh
node midland-os/hermes-lite/scripts/hermes-release.mjs ship \
  --message "Phase 2.9-5A+5B patient and admin communication clarity" \
  --files "src/app/portal/dashboard/page.tsx,src/app/portal/reorder/page.tsx,src/app/admin/(protected)/orders/page.tsx"
```

**Safety rules:**
- Fails if any changed/untracked file is not listed in `--files` (dirty scope guard).
- Fails if any listed file is not actually changed.
- Runs `hermes-ship check` (tsc + build) before asking for confirmation.
- Warns loudly if any listed file matches a high-risk path (API routes, auth, DynamoDB, middleware, package files, `.env`, `amplify.yml`).
- Requires typing exactly `SHIP` to proceed — anything else aborts with no changes.
- After push, prints the Amplify status command for manual review (does not run it).

## Verification

Hermes Lite itself is tooling only.

For Midland application work, always run:
- npx tsc --noEmit
- npm run build

Or use the ship check shortcut above.
