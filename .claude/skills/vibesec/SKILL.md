# /vibesec
Quick security pass on a diff or feature.
## Check
1. No secrets in code (API keys, passwords, connection strings)
2. No raw NHI in logs, URLs, responses
3. Auth checks on every API route (role + org_id)
4. Audit PutItem BEFORE sensitive actions
5. No console.log of patient data (safeLog only)
6. No SQL/NoSQL injection vectors (parameterised queries)
7. CORS configured correctly
8. Rate limiting on sensitive endpoints
9. No portal-driven delete/restore (Rule 17)
10. CSP headers appropriate
## Output
Pass/fail per check with file:line references.
