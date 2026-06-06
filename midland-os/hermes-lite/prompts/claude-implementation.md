# Claude Implementation Prompt

## Objective
{{objective}}

## Context
{{context}}

## Allowed Files
{{allowedFiles}}

## Forbidden Files
{{forbiddenFiles}}

## Requirements
{{requirements}}

## Data Safety Rules
Do not expose, log, export, or display:
- raw NHI
- encrypted NHI
- NHI hash
- patient email
- phone
- address
- admin email
- Cognito sub
- Cognito username
- raw audit payloads
- tokens
- secrets

## Scope Rules
- Prefer surgical edits.
- Do not refactor unrelated code.
- Do not touch auth, middleware, API routes, DynamoDB, Cognito, patient portal, checkout, NHI, or audit logic unless explicitly scoped.
- Do not create markdown docs unless explicitly requested.

## Acceptance Criteria
{{acceptanceCriteria}}

## Verification
Run:
npx tsc --noEmit
npm run build

## Report Back
After implementation, report:
- files changed
- summary of changes
- whether any forbidden files were touched
- data safety check
- verification results
