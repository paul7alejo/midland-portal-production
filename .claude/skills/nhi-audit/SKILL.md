# /nhi-audit
NHI handling audit across a diff or feature.
## Check
1. NHI never in URLs, query strings, alt text, aria-labels
2. NHI masked ZZZ**** in all UI by default
3. maskNHI() called before any string reaches any logger
4. safeLog() not console.log() for patient data
5. NHI encrypted at rest (AES-256-GCM, key in Secrets Manager)
6. NHI excluded from exports by default (Rule 16)
7. NHI reveal: audit PutItem BEFORE value renders, 30s auto-hide
8. Admin NHI reveal requires written reason
## Output
Pass/fail per check with file:line references.
