# Codex Strict Review Prompt

## Objective
Strictly review the implementation for:

{{objective}}

## Claimed Implementation
{{claimedImplementation}}

## Allowed Files
{{allowedFiles}}

## Forbidden Files
{{forbiddenFiles}}

## Review Checklist

### A. Scope
PASS only if changed files are within allowed scope.
FAIL if forbidden files were changed.

### B. Behavior
Confirm the implementation satisfies the requested behavior without adding unrelated features.

### C. Data Safety
FAIL if any of these are newly exposed, logged, exported, or displayed:
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

### D. Existing Behavior
Confirm no breakage to existing flows relevant to this task.

### E. Verification
Confirm:
- npx tsc --noEmit passed
- npm run build passed

## Output Format
Return:

PASS / PASS WITH NOTES / FAIL

Include:
1. Verdict
2. Files changed
3. Scope findings
4. Behavior findings
5. Data safety findings
6. Existing behavior risks
7. Required fixes, if any
8. Manual browser test steps

Do not edit code.
