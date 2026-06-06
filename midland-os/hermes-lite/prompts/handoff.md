# Midland Sleep Handoff

## Purpose of Next Session
{{purpose}}

## Hard Rules
- Do not save anything into the repo unless explicitly asked.
- Do not expose raw NHI, encrypted NHI, NHI hash, patient email, phone, address, Cognito sub, raw audit payloads, tokens, or secrets.
- Use pointers to commits/files instead of duplicating large content.
- Be precise and operational.

## Project Context
OneOfZero Systems is building the Midland Sleep portal as a healthcare-adjacent operations platform.

Stack:
- Next.js
- TypeScript
- Tailwind
- AWS Amplify
- Cognito
- DynamoDB

## Current Repo State
Branch:
{{branch}}

Latest commit:
{{latestCommit}}

Git status:
{{gitStatus}}

Amplify status:
{{amplifyStatus}}

## Current Feature Status
Implemented:
{{implemented}}

Passed:
{{passed}}

Failed:
{{failed}}

Not browser-proven:
{{notBrowserProven}}

## Files Changed
{{filesChanged}}

## High-Risk Files
{{highRiskFiles}}

## Forbidden Files for Next Step
{{forbiddenFiles}}

## Data / Safety Constraints
- No raw NHI.
- No unsafe patient data in logs or outputs.
- Admin mutations require audit.
- No hard delete unless isolated and explicitly approved.
- Cognito/DynamoDB changes require review.

## Current Task
{{currentTask}}

## Acceptance Criteria
{{acceptanceCriteria}}

## Verification Commands
- npx tsc --noEmit
- npm run build

## Suggested Agent Roles
- ChatGPT: product, scope, pricing, diagnosis.
- Claude Code: implementation.
- Codex: strict review.
- Perplexity: external research only.

## Risks
{{risks}}

## Next Message to Paste
{{nextMessage}}
