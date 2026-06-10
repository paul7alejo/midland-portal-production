#!/usr/bin/env node
// hermes-release v0.7 — supervised ship runner
// Requires explicit SHIP confirmation before git add / commit / push.
// Does NOT run AWS commands. Does NOT read .env files.

import { spawnSync }          from "node:child_process";
import { resolve, dirname }   from "node:path";
import { fileURLToPath }      from "node:url";
import { existsSync }         from "node:fs";
import { createInterface }    from "node:readline/promises";

// scripts/ → hermes-lite/ → midland-os/ → repo root
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SHIP_SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "hermes-ship.mjs");

const AMPLIFY_APP_ID = "d3n1gantisqxbk";
const AMPLIFY_REGION = "ap-southeast-2";

// Paths that trigger a loud warning even when listed in --files
const FORBIDDEN_WARN_PATTERNS = [
  "src/app/api/",
  "src/lib/aws/",
  "src/app/portal/",
  "src/components/AuthProvider.tsx",
  "src/middleware.ts",
  "package.json",
  "package-lock.json",
  ".env",
  "amplify.yml",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function divider(char = "─", width = 64) {
  return char.repeat(width);
}

function section(title) {
  console.log(`\n${divider()}`);
  console.log(`  ${title}`);
  console.log(divider());
}

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function git(...args) {
  return spawnSync("git", args, { cwd: repoRoot, encoding: "utf8", shell: false });
}

function gitInherit(...args) {
  return spawnSync("git", args, { cwd: repoRoot, stdio: "inherit", shell: false });
}

// Parse `git status --short --untracked-files=all` output into file paths.
// Lines: "XY path" or "XY old -> new" (rename).
function parseGitStatus(output) {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const rest = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
      // Rename: take the destination path after " -> "
      const parts = rest.split(" -> ");
      return parts[parts.length - 1].trim();
    })
    .filter(Boolean);
}

// Trim and split a comma-separated file list
function parseFileList(raw) {
  return raw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

function matchesForbidden(filepath) {
  return FORBIDDEN_WARN_PATTERNS.some((pattern) => filepath.includes(pattern));
}

// ─── Usage ────────────────────────────────────────────────────────────────────

function usage(reason) {
  if (reason) console.error(`\n✗ ${reason}\n`);
  console.log(`
Hermes Release v0.7 — supervised ship runner

Usage:
  node midland-os/hermes-lite/scripts/hermes-release.mjs ship \\
    --message "commit message" \\
    --files "path/to/file1.tsx,path/to/file2.mjs"

Required flags:
  --message   Commit message (required)
  --files     Comma-separated list of files to add and commit (required)

Behaviour:
  1. Reads git status — fails if any changed file is not in --files.
  2. Fails if any listed file is not changed or does not exist.
  3. Runs hermes-ship check (tsc + build) — stops on failure.
  4. Prints a summary and requires you to type exactly: SHIP
  5. git add <listed files>
  6. git commit -m "<message>"
  7. git push origin <current-branch>
  8. Prints the Amplify status command for you to run manually.

Example:
  node midland-os/hermes-lite/scripts/hermes-release.mjs ship \\
    --message "Phase 2.9-5B admin communication status clarity" \\
    --files "src/app/admin/(protected)/orders/page.tsx"
`);
}

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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const command = process.argv[2];

  if (command !== "ship") {
    usage(command ? `Unknown command: ${command}` : null);
    process.exit(command ? 1 : 0);
  }

  const args = parseArgs(process.argv.slice(3));

  if (!args.message) { usage("--message is required"); process.exit(1); }
  if (!args.files)   { usage("--files is required");   process.exit(1); }

  const listedFiles = parseFileList(args.files);
  if (listedFiles.length === 0) { usage("--files must list at least one file"); process.exit(1); }

  // ── 1. Read git status ──────────────────────────────────────────────────────

  section("Git status check");
  const statusResult = git("status", "--short", "--untracked-files=all");
  if (statusResult.status !== 0) fail("git status failed.");

  const changedFiles = parseGitStatus(statusResult.stdout);

  if (changedFiles.length === 0) {
    console.log("  No changed or untracked files. Nothing to ship.");
    process.exit(0);
  }

  console.log(`\n  Changed / untracked files (${changedFiles.length}):`);
  changedFiles.forEach((f) => console.log(`    ${f}`));

  // ── 2. Scope validation ─────────────────────────────────────────────────────

  section("Scope validation");

  // Every changed file must be listed in --files
  const listedSet  = new Set(listedFiles);
  const changedSet = new Set(changedFiles);
  const unlisted   = changedFiles.filter((f) => !listedSet.has(f));

  if (unlisted.length > 0) {
    console.error("\n✗ SCOPE FAIL — changed files not listed in --files:");
    unlisted.forEach((f) => console.error(`    ${f}`));
    console.error(
      "\n  Resolve: either add these files to --files, or stash/revert them before shipping."
    );
    process.exit(1);
  }

  // Every listed file must be changed (or untracked/newly added)
  const notChanged = listedFiles.filter((f) => !changedSet.has(f));
  if (notChanged.length > 0) {
    console.error("\n✗ SCOPE FAIL — listed files are not changed:");
    notChanged.forEach((f) => console.error(`    ${f}`));
    process.exit(1);
  }

  // Every listed file must exist on disk
  const missing = listedFiles.filter((f) => !existsSync(resolve(repoRoot, f)));
  if (missing.length > 0) {
    console.error("\n✗ SCOPE FAIL — listed files do not exist:");
    missing.forEach((f) => console.error(`    ${f}`));
    process.exit(1);
  }

  console.log("  ✓ All changed files are accounted for in --files.");

  // ── 3. Forbidden path warnings ──────────────────────────────────────────────

  const forbiddenMatches = listedFiles.filter(matchesForbidden);

  // ── 4. Hermes ship check (tsc + build) ─────────────────────────────────────

  section("Hermes ship check");
  console.log(`> node hermes-ship.mjs check\n`);
  const checkResult = spawnSync("node", [SHIP_SCRIPT, "check"], {
    cwd:   repoRoot,
    stdio: "inherit",
    shell: false,
  });
  if (checkResult.status !== 0) {
    fail("Hermes ship check failed. Fix errors before shipping.");
  }

  // ── 5. Get current branch ───────────────────────────────────────────────────

  const branchResult = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branchResult.status !== 0) fail("Could not determine current branch.");
  const branch = branchResult.stdout.trim();

  // ── 6. Print summary ────────────────────────────────────────────────────────

  section("Ship summary");
  console.log(`\n  Branch:  ${branch}`);
  console.log(`  Message: ${args.message}`);
  console.log(`\n  Files to add and commit:`);
  listedFiles.forEach((f) => console.log(`    + ${f}`));

  if (forbiddenMatches.length > 0) {
    console.log(`\n${divider("!", 64)}`);
    console.log("  ⚠  WARNING — HIGH-RISK FILES INCLUDED");
    console.log(divider("!", 64));
    forbiddenMatches.forEach((f) => console.log(`  ⚠  ${f}`));
    console.log(`\n  These paths are in the protected Midland zone.`);
    console.log(`  Review them carefully before confirming.\n`);
    console.log(divider("!", 64));
  }

  // ── 7. Require SHIP confirmation ────────────────────────────────────────────

  console.log(`\n${divider()}`);
  console.log("  Ready to ship. This will run:");
  console.log(`    git add ${listedFiles.join(" ")}`);
  console.log(`    git commit -m "${args.message}"`);
  console.log(`    git push origin ${branch}`);
  console.log(`\n  Type exactly  SHIP  to proceed, or anything else to abort.`);
  console.log(divider());

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let answer;
  try {
    answer = await rl.question("\n  Confirm: ");
  } finally {
    rl.close();
  }

  if (answer.trim() !== "SHIP") {
    console.log("\n  Aborted. No changes made.");
    process.exit(0);
  }

  // ── 8. git add ──────────────────────────────────────────────────────────────

  section("git add");
  const addResult = gitInherit("add", "--", ...listedFiles);
  if (addResult.status !== 0) fail("git add failed.");
  console.log(`\n  ✓ Staged ${listedFiles.length} file(s).`);

  // ── 9. git commit ───────────────────────────────────────────────────────────

  section("git commit");
  const commitResult = gitInherit("commit", "-m", args.message);
  if (commitResult.status !== 0) fail("git commit failed.");

  // ── 10. git push ────────────────────────────────────────────────────────────

  section("git push");
  const pushResult = gitInherit("push", "origin", branch);
  if (pushResult.status !== 0) fail("git push failed.");

  // ── 11. Post-push Amplify status command ────────────────────────────────────

  section("Amplify — check build status (run manually)");
  console.log(`\n  Push complete. To check the Amplify build status, run:\n`);
  console.log(`  aws amplify list-jobs \\`);
  console.log(`    --app-id ${AMPLIFY_APP_ID} \\`);
  console.log(`    --branch-name ${branch} \\`);
  console.log(`    --max-results 5 \\`);
  console.log(`    --region ${AMPLIFY_REGION} \\`);
  console.log(`    --query 'jobSummaries[*].{jobId:jobId,status:status,commitId:commitId,commitMessage:commitMessage,startTime:startTime}' \\`);
  console.log(`    --output table`);
  console.log(`\n  Hermes Release v0.7 — done.`);
}

main().catch((err) => {
  console.error("\n✗ Hermes Release encountered an unexpected error.");
  console.error(err?.message || String(err));
  process.exit(1);
});
