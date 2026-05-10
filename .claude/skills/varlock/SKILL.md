# /varlock
Confirm env-var handling is correct.
## Check
1. .env.local is in .gitignore
2. No secrets committed to repo (grep for API keys, passwords)
3. Amplify env vars match .env.local keys
4. Secrets Manager references use correct ARN format
5. Dev and prod NHI encryption keys are separate
6. No Stripe keys in Phase 1B production env
## Output
Pass/fail per check.
