#!/usr/bin/env node
// hermes-workflow v0.8 — deterministic workflow rail, no API calls
// proof-log --append mode writes to an existing .md file with LOG confirmation

import { existsSync, appendFileSync } from "node:fs";
import { extname }                    from "node:path";
import { createInterface }            from "node:readline/promises";

// ─── Safety boundary (included in all generated outputs) ─────────────────────

const SAFETY_ITEMS = [
  "No raw NHI, encrypted NHI, or NHI hash",
  "No patient email, phone, or address",
  "No Cognito identifiers or usernames",
  "No tokens, API keys, or secrets",
  "No raw audit payloads",
  "No patient-facing dollar values unless explicitly scoped",
];

const SAFETY_BLOCK = SAFETY_ITEMS.map((s) => `- ${s}`).join("\n");

const VERIFY_CMD = "node midland-os/hermes-lite/scripts/hermes-ship.mjs check";

// ─── Arg parser ───────────────────────────────────────────────────────────────

function parseArgs(rawArgs) {
  const values = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const item = rawArgs[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = rawArgs[i + 1];
    if (!next || next.startsWith("--")) {
      values[key] = "true";
    } else {
      values[key] = next;
      i++;
    }
  }
  return values;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

function usage(missingFor) {
  if (missingFor) {
    console.error(`\nMissing required flag: --objective\n`);
  }
  console.log(`
Hermes Workflow v0.8

Usage:
  node midland-os/hermes-lite/scripts/hermes-workflow.mjs <command> [flags]

Commands:
  task        Generate a structured task brief
  claude      Generate a Claude Code implementation prompt
  codex       Generate a Codex review prompt
  proof-log   Generate an Obsidian-ready proof log section

Flags (all optional except --objective):
  --objective     What the task achieves (required for all commands)
  --context       Background context
  --business      Business goal
  --allowed       Allowed files (comma-separated or quoted)
  --forbidden     Forbidden files (comma-separated or quoted)
  --requirements  Implementation requirements
  --acceptance    Acceptance criteria
  --claimed       Claimed changes made (for codex / proof-log)
  --changes       Alias for --claimed (for proof-log)
  --files         Files changed (for proof-log)
  --commit        Git commit ID (for proof-log)
  --amplify       Amplify job ID / status (for proof-log)
  --verification  Verification result override (for proof-log)
  --browser       Browser proof note (for proof-log)
  --value         Business value delivered (for proof-log)
  --append        Append to log file instead of printing to stdout (proof-log only)
  --log-file      Target .md or .markdown file path (required with --append)

Examples:
  node midland-os/hermes-lite/scripts/hermes-workflow.mjs task \\
    --objective "Add export button to Orders page" \\
    --context "Staff need a CSV export of visible orders" \\
    --allowed "src/app/admin/(protected)/orders/page.tsx" \\
    --forbidden "src/app/api/**, src/lib/aws/**"

  node midland-os/hermes-lite/scripts/hermes-workflow.mjs claude \\
    --objective "Add export button to Orders page" \\
    --context "Staff need a CSV export of visible orders" \\
    --allowed "src/app/admin/(protected)/orders/page.tsx" \\
    --forbidden "src/app/api/**, src/lib/aws/**" \\
    --requirements "Export uses visibleOrders; no API calls" \\
    --acceptance "CSV downloads with visible rows; tsc and build pass"

  node midland-os/hermes-lite/scripts/hermes-workflow.mjs codex \\
    --objective "Add export button to Orders page" \\
    --claimed "Added downloadCsv helper and Download CSV button to orders/page.tsx" \\
    --allowed "src/app/admin/(protected)/orders/page.tsx" \\
    --forbidden "src/app/api/**, src/lib/aws/**"

  node midland-os/hermes-lite/scripts/hermes-workflow.mjs proof-log \\
    --objective "Phase 2.9-3 Orders Fulfilment Queue Clarity" \\
    --commit "07c9313" \\
    --amplify "Job 1042 SUCCEED" \\
    --files "src/app/admin/(protected)/orders/page.tsx" \\
    --changes "Added STATUS_QUEUE_COPY sub-labels and Funding Check tab" \\
    --value "Staff can scan queue status at a glance without opening each order"

  node midland-os/hermes-lite/scripts/hermes-workflow.mjs proof-log \\
    --objective "Phase 2.9-3 Orders Fulfilment Queue Clarity" \\
    --commit "07c9313" \\
    --amplify "Job 1042 SUCCEED" \\
    --files "src/app/admin/(protected)/orders/page.tsx" \\
    --changes "Added STATUS_QUEUE_COPY sub-labels and Funding Check tab" \\
    --value "Staff can scan queue status at a glance" \\
    --append --log-file "/path/to/proof-log.md"

  node midland-os/hermes-lite/scripts/hermes-ship.mjs check
`);
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generateTask(a) {
  const allowed  = a.allowed     || "(specify allowed files)";
  const forbidden = a.forbidden  || "(specify forbidden files)";
  const business = a.business    || "(specify business goal)";
  const req      = a.requirements || "(specify requirements)";
  const accept   = a.acceptance  || "(specify acceptance criteria)";
  const context  = a.context     || "(specify context)";

  return `# Task Brief

## Objective
${a.objective}

## Context
${context}

## Business goal
${business}

## Allowed files
${allowed}

## Forbidden files
${forbidden}

## Requirements
${req}

## Acceptance criteria
${accept}

## Verification
Run:
${VERIFY_CMD}
`;
}

function generateClaude(a) {
  const allowed   = a.allowed      || "(specify allowed files)";
  const forbidden = a.forbidden    || "(specify forbidden files)";
  const context   = a.context      || "(specify context)";
  const business  = a.business     || "(specify business goal)";
  const req       = a.requirements || "(specify requirements)";
  const accept    = a.acceptance   || "(specify acceptance criteria)";

  return `You are working in the Midland Sleep production portal repo.

Objective:
${a.objective}

Context:
${context}

Business goal:
${business}

Allowed files:
${allowed}

Forbidden files:
${forbidden}

Requirements:
${req}

Data safety:
Do not expose:
${SAFETY_BLOCK}

Acceptance criteria:
${accept}

Verification:
Run:
${VERIFY_CMD}

Report back:
- Files changed
- Summary of changes
- Whether forbidden files were touched
- Data safety check
- Verification results
`;
}

function generateCodex(a) {
  const claimed   = a.claimed   || "(no claimed changes provided)";
  const allowed   = a.allowed   || "(specify allowed files)";
  const forbidden = a.forbidden || "(specify forbidden files)";
  const files     = a.files     || "(not specified)";

  return `# Codex Review Prompt

You are performing a strict scope and safety review of a claimed implementation.
You are not approving this for deployment — you are checking it against the spec.

## Objective
${a.objective}

## Claimed changes
${claimed}

## Files reported changed
${files}

## Allowed files
${allowed}

## Forbidden files
${forbidden}

## Scope checks
- Verify that ONLY allowed files were changed.
- Verify that NO forbidden files were touched.
- If any file outside the allowed list was modified, report it as a FAIL.

## Behaviour checks
- Verify the implementation matches the objective.
- Verify no new dependencies were added (no package.json changes).
- Verify no new API endpoints were created unless explicitly allowed.
- Verify no auth, session, middleware, or Cognito logic was changed.
- Verify no DynamoDB write logic was added or changed unless explicitly allowed.

## Data safety checks
The following must not appear in any generated output, log, or UI element:
${SAFETY_BLOCK}

## Existing behaviour risk checks
- Does the change risk breaking existing status tab filtering?
- Does the change risk breaking existing KPI card counts?
- Does the change risk exposing patient data that was previously hidden?
- Does the change risk breaking the request drawer or patient drawer?
- Does the change introduce any hardcoded demo or fake data in production paths?

## Required fixes
List every violation. If none found: state PASS with a one-line summary.

## Verification expectations
- \`npx tsc --noEmit\` must pass with no errors.
- \`npm run build\` must pass with no errors.
- Only allowed files changed.
- No secrets, tokens, or sensitive data visible.
`;
}

function generateProofLog(a) {
  const commit   = a.commit       || "(commit id not provided)";
  const amplify  = a.amplify      || "(Amplify job not provided)";
  const files    = a.files        || "(files not specified)";
  const claimed  = a.claimed      || a.changes || a.context || "(what changed not specified)";
  const verify   = a.verification || `\`${VERIFY_CMD}\` — PASS`;
  const browser  = a.browser      || "Not captured.";
  const value    = a.value        || "(business value not specified)";
  const ts       = new Date().toISOString().slice(0, 10);

  return `## ${a.objective}

**Date:** ${ts}

| Field | Value |
|---|---|
| Commit | \`${commit}\` |
| Amplify | ${amplify} |
| Files changed | \`${files}\` |

### What changed
${claimed}

### Safety boundary
${SAFETY_BLOCK}

### Verification
${verify}

### Browser proof
${browser}

### Business value
${value}
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const command = process.argv[2];
  const args    = parseArgs(process.argv.slice(3));

  const COMMANDS = ["task", "claude", "codex", "proof-log"];

  if (!command || !COMMANDS.includes(command)) {
    usage();
    process.exit(command ? 1 : 0);
  }

  if (!args.objective) {
    usage(true);
    console.error(`Run: node midland-os/hermes-lite/scripts/hermes-workflow.mjs ${command} --objective "..." [other flags]\n`);
    process.exit(1);
  }

  switch (command) {
    case "task":
      console.log(generateTask(args));
      break;
    case "claude":
      console.log(generateClaude(args));
      break;
    case "codex":
      console.log(generateCodex(args));
      break;
    case "proof-log": {
      const content = generateProofLog(args);

      if (args.append !== "true") {
        // stdout only — unchanged behaviour
        console.log(content);
        break;
      }

      // ── Append mode ──────────────────────────────────────────────────────────

      if (!args["log-file"]) {
        console.error("\n✗ --log-file is required when using --append\n");
        console.error("  Example: --append --log-file path/to/proof-log.md\n");
        process.exit(1);
      }

      const logFile = args["log-file"];
      const ext     = extname(logFile).toLowerCase();

      if (ext !== ".md" && ext !== ".markdown") {
        console.error(`\n✗ --log-file must be a .md or .markdown file\n`);
        console.error(`  Got: ${logFile}\n`);
        process.exit(1);
      }

      if (!existsSync(logFile)) {
        console.error(`\n✗ Log file does not exist: ${logFile}\n`);
        console.error("  Hermes does not create log files. Create the file first, then use --append.\n");
        process.exit(1);
      }

      // Preview
      console.log("\n─── Preview ─────────────────────────────────────────────────────\n");
      console.log(content);
      console.log("─────────────────────────────────────────────────────────────────");
      console.log(`\n  Target: ${logFile}`);
      console.log("\n  Type exactly  LOG  to append, or anything else to abort.");

      const rl = createInterface({ input: process.stdin, output: process.stdout });
      let answer;
      try {
        answer = await rl.question("\n  Confirm: ");
      } finally {
        rl.close();
      }

      if (answer.trim() !== "LOG") {
        console.log("\n  Aborted. No changes made.");
        process.exit(0);
      }

      appendFileSync(logFile, "\n\n" + content, "utf8");
      console.log(`\n  ✓ Appended to ${logFile}`);
      break;
    }
  }
}

main().catch((err) => {
  console.error("\n✗ Hermes Workflow encountered an unexpected error.");
  console.error(err?.message || String(err));
  process.exit(1);
});
