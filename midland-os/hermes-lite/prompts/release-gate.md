# Release Gate Checklist

## Objective
{{objective}}

## Branch
{{branch}}

## Commit
{{commit}}

## Changed Files
{{changedFiles}}

## Gate Checks

### 1. Scope
- Are all changed files expected?
- Were forbidden files avoided?
- Is the change surgical?

### 2. Safety
Confirm no unsafe data is exposed:
- raw NHI
- encrypted NHI
- NHI hash
- patient email
- phone
- address
- admin email
- Cognito identifiers
- audit payloads
- tokens
- secrets

### 3. Verification
Required commands:
- npx tsc --noEmit
- npm run build

### 4. Browser Proof
List manual proof steps:
{{browserProof}}

### 5. Deployment Proof
Confirm Amplify job status with:
aws amplify list-jobs --app-id d3n1gantisqxbk --branch-name phase-2a-admin-ops --max-results 5 --region ap-southeast-2 --query 'jobSummaries[*].{jobId:jobId,status:status,commitId:commitId,commitMessage:commitMessage,startTime:startTime}' --output table

## Verdict
PASS / FAIL / HOLD

## Notes
{{notes}}
