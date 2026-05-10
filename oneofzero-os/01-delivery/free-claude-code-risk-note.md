# free-claude-code Risk Note

> Repo: https://github.com/Alishahryar1/free-claude-code
> A third-party proxy that routes Claude Code-style API calls to alternative
> providers (NVIDIA NIM, OpenRouter, LM Studio, llama.cpp).

## Why it's interesting

Cost reduction. Multi-backend experimentation. Useful for tinkering and learning.

## Why it's risky for Midland-grade work

Midland is healthcare-adjacent. The portal touches patient-related data, NHI/MSID-like identifiers, Cognito/session logic, AWS configuration, and operational workflows. A third-party proxy is **not** the default path for production-sensitive work.

## Safe use

```text
- demo data only
- local toy repo
- UI experiments
- markdown docs
- prompt testing
- non-sensitive refactoring patterns
- model comparison / learning
```

## Unsafe — DO NOT DO

```text
- real patient imports
- production .env files
- AWS credentials
- Cognito tokens
- NHI / MSID data
- private Midland data
- any PHI-like content
- production code that touches the audit log
- production code that touches encryption / Secrets Manager
```

## Recommendation

Do not make this the primary coding path. Use only as an experimental tool after reviewing security implications. Primary paths remain official Claude Code and Codex.

## If using it experimentally

```text
1. Use a separate disposable repo, not the Midland repo.
2. Use synthetic / demo data only — never copy real exports in.
3. Never paste secrets, env files, or AWS credentials.
4. Treat any output as untrusted; review carefully before using ideas in prod.
5. Document the experiment in 06-memory/learnings.md if useful.
```
