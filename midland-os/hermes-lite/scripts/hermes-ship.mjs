#!/usr/bin/env node
// hermes-ship v0.5 — check mode only

import { spawnSync }      from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath }   from "node:url";

// scripts/ → hermes-lite/ → midland-os/ → repo root
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

function run(label, cmd, args) {
  section(label);
  console.log(`> ${cmd} ${args.join(" ")}\n`);
  const result = spawnSync(cmd, args, {
    cwd:   repoRoot,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`\n✗ FAILED: ${label} (exit ${result.status ?? "signal"})`);
    process.exit(result.status ?? 1);
  }
  console.log(`\n✓ OK: ${label}`);
}

const command = process.argv[2];

if (command !== "check") {
  console.log("Usage: node hermes-ship.mjs check");
  process.exit(command ? 1 : 0);
}

console.log("Hermes Ship v0.5 — check mode");
console.log(`Repo root: ${repoRoot}`);

run("Git status",   "git", ["status", "--short"]);
run("Git diff",     "git", ["diff", "--name-only"]);
run("Typecheck",    "npx", ["tsc", "--noEmit"]);
run("Build",        "npm", ["run", "build"]);

section("Result");
console.log("  ✓ All checks passed.");
