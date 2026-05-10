# /cicd-check
Confirm Amplify env + GitHub Actions configuration.
## Check
1. amplify.yml exists and references correct build commands
2. GitHub Actions workflow runs typecheck + build + lint
3. Env vars in Amplify console match .env.local keys
4. No Stripe env vars in Phase 1B production
5. Branch deploy: main → prod, develop → staging (if configured)
6. Build succeeds locally: npm run build
