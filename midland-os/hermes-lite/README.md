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

## Verification

Hermes Lite itself is tooling only.

For Midland application work, always run:
- npx tsc --noEmit
- npm run build
