#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hermesDir = path.join(root, "midland-os", "hermes-lite");
const promptsDir = path.join(hermesDir, "prompts");

const command = process.argv[2];

const templates = {
  claude: "claude-implementation.md",
  codex: "codex-review.md",
  release: "release-gate.md",
  handoff: "handoff.md",
  brief: "task-brief.md"
};

function usage() {
  console.log(`
Hermes Lite v0.1

Usage:
  node midland-os/hermes-lite/scripts/hermes-lite.mjs <command>

Commands:
  claude    Print Claude implementation prompt template
  codex     Print Codex review prompt template
  release   Print release gate template
  handoff   Print handoff template
  brief     Print task brief template
`);
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

console.log(fs.readFileSync(templatePath, "utf8"));
