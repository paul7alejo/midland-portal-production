#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const hermesDir = path.resolve(scriptDir, "..");
const promptsDir = path.join(hermesDir, "prompts");

const command = process.argv[2];
const args = process.argv.slice(3);

const templates = {
  claude: "claude-implementation.md",
  codex: "codex-review.md",
  release: "release-gate.md",
  handoff: "handoff.md",
  brief: "task-brief.md"
};

const aliases = {
  objective: "objective",
  context: "context",
  allowed: "allowedFiles",
  allowedFiles: "allowedFiles",
  forbidden: "forbiddenFiles",
  forbiddenFiles: "forbiddenFiles",
  requirements: "requirements",
  acceptance: "acceptanceCriteria",
  acceptanceCriteria: "acceptanceCriteria",
  claimed: "claimedImplementation",
  claimedImplementation: "claimedImplementation",
  branch: "branch",
  commit: "commit",
  changed: "changedFiles",
  changedFiles: "changedFiles",
  browserProof: "browserProof",
  notes: "notes",
  purpose: "purpose",
  latestCommit: "latestCommit",
  gitStatus: "gitStatus",
  amplifyStatus: "amplifyStatus",
  implemented: "implemented",
  passed: "passed",
  failed: "failed",
  notBrowserProven: "notBrowserProven",
  filesChanged: "filesChanged",
  highRiskFiles: "highRiskFiles",
  currentTask: "currentTask",
  risks: "risks",
  nextMessage: "nextMessage",
  taskName: "taskName",
  businessValue: "businessValue",
  outcome: "outcome",
  edgeCases: "edgeCases",
  outOfScope: "outOfScope"
};

function usage() {
  console.log(`
Hermes Lite v0.2

Usage:
  node midland-os/hermes-lite/scripts/hermes-lite.mjs <command> [options]

Commands:
  claude    Print Claude implementation prompt
  codex     Print Codex review prompt
  release   Print release gate template
  handoff   Print handoff template
  brief     Print task brief template

Examples:
  node midland-os/hermes-lite/scripts/hermes-lite.mjs claude \\
    --objective "Fix Orders export" \\
    --allowed "src/app/admin/(protected)/orders/page.tsx" \\
    --forbidden "api, auth, DynamoDB" \\
    --requirements "Export must use visibleOrders" \\
    --acceptance "Export matches current filtered table"

  node midland-os/hermes-lite/scripts/hermes-lite.mjs codex \\
    --objective "Review Orders export fix" \\
    --claimed "Only Orders page changed" \\
    --allowed "src/app/admin/(protected)/orders/page.tsx" \\
    --forbidden "backend, auth, patient portal"
`);
}

function parseArgs(rawArgs) {
  const values = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const item = rawArgs[i];

    if (!item.startsWith("--")) {
      continue;
    }

    const rawKey = item.slice(2);
    const key = aliases[rawKey];

    if (!key) {
      values[rawKey] = rawArgs[i + 1] ?? "";
      i++;
      continue;
    }

    const next = rawArgs[i + 1];

    if (!next || next.startsWith("--")) {
      values[key] = "true";
      continue;
    }

    values[key] = next;
    i++;
  }

  return values;
}

function fillTemplate(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    return values[key] ?? `{{${key}}}`;
  });
}

if (!command || !templates[command]) {
  usage();
  process.exit(command ? 1 : 0);
}

const templatePath = path.join(promptsDir, templates[command]);

if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
const values = parseArgs(args);
const output = fillTemplate(template, values);

console.log(output);
