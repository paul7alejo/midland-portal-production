# Tools Stack

> The toolchain across coding, planning, research, design, and ops.

## Coding partner

```text
PRIMARY                    Claude Code (file edits, security/compliance work)
                           Codex (surgical TypeScript fixes, refactors, repo inspection)

SECONDARY                  ChatGPT (planning, scope, pricing, proposals)

RESEARCH                   Perplexity (NZ clinic workflow, CPAP UX context)

EXPERIMENTAL ONLY          free-claude-code (Alishahryar1) — NEVER with real
                           patient data, secrets, or production credentials.
                           See 01-delivery/free-claude-code-risk-note.md.

DEPRECATED                 OpenRouter / DeepSeek R1 free tier as primary
                           Lovable as primary (Phase 1A only)
```

## Code stack

```text
Frontend       Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
Hosting        Vercel (1A) → AWS Amplify (1B+)
Auth           AWS Cognito (2 pools)
Database       AWS DynamoDB (7 tables)
Backups        DynamoDB PITR + S3 weekly snapshot Lambda
Secrets        AWS Secrets Manager
Security       AWS WAF
Monitoring     AWS CloudWatch (6 alarms)
Email          AWS SES (transactional only)
Payments       Stripe (Phase 1A demo only; dormant in 1B)
IaC            Terraform (Months 5–6, post-launch)
Region         ap-southeast-2 (Sydney)
```

## Local dev

```text
IDE            VS Code
Node           v20 LTS
Package mgr    npm
Git            feature branch + PR (even solo)
CLI            AWS CLI v2, gh, jq
Browser        Chrome + Safari for mobile QA
```

## Project tools

```text
Diagrams       Excalidraw (architecture), Whimsical (flows)
Notes          repo markdown is source of truth (not Notion)
Calendar       standard
Time tracking  optional, internal only
```

## What we deliberately do NOT use

```text
- Notion / Coda — repo markdown is canonical
- Slack workspace dedicated to client — email + SMS for urgent
- Jira / ClickUp — repo PRs + decision-log.md is enough at this scale
- third-party analytics (Google Analytics, Mixpanel, etc.) — privacy
- patient-facing live chat — we are not a SaaS company
- generic CRM — wrong shape for clinic operations
- AI chatbots embedded in patient flow — never
```

## When to add a tool

```text
- it solves a real, recurring pain
- it does not handle real patient data unless reviewed
- it does not introduce a new failure mode (vendor lock-in, secret sprawl)
- it earns its monthly cost in hours saved
- it is documented in this file before adoption
```
