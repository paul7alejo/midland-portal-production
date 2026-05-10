# Prompt Templates

> Drop-in templates for Claude Code, Codex, ChatGPT, and Perplexity.

## 1. Surgical code task (Claude Code or Codex)

```text
Objective:
[one sentence]

Context:
Midland Sleep portal. Phase 1B. Current slice: [1C/1D/1D-x/1E/1F].
Reference: midland-os/00-core-context/claude-context-pack/MIDLAND-ONEOFZERO-OS-MASTER-PACK.md
Do not expand scope.

Allowed files:
- [exact files]

Forbidden files:
- auth, middleware, Cognito logic
- DynamoDB clients unless explicitly allowed
- checkout / cart / shop
- inventory
- email / invite flows
- patient portal unless explicitly allowed

Requirements:
- [specific requirements]

Data rules:
- no real patient data
- no raw NHI logs (maskNHI, safeLog)
- no fake fallback data
- audit PutItem BEFORE sensitive action

Edge cases:
- [list]

Acceptance criteria:
- [list]

Verification:
  npx tsc --noEmit

After completion:
  Files changed:
  Verification result:
  Risks / notes:
  Next step:
```

## 2. Documentation task

```text
Objective:
Create / update [doc name] for Midland OS v1.

Context:
Phase 1B production readiness and handover. Honest, bounded, useful for
clinic operations. NOT marketing copy.

Include:
- purpose
- owner
- preconditions
- steps
- expected result
- failure handling
- escalation
- known limitations
- out of scope

Do not:
- overpromise automation
- claim legal / compliance certification
- mention future features as included
```

## 3. UI clarity task

```text
Objective:
Improve readability and clarity for older patients on phones.

Allowed:
- typography, spacing, contrast
- helper copy, button clarity
- image slot consistency

Forbidden:
- backend, API, auth, data model
- checkout / inventory / email / patient invites
- generated or unlicensed images

Verification:
  npx tsc --noEmit
```

## 4. Brutal review

```text
Review this plan / code / doc brutally.

Check:
1. Does it move Midland toward import → review → export → SOP → handover?
2. Does it create scope creep?
3. Does it risk patient data exposure?
4. Does it support the NZD 42k Phase 1 value story?
5. Is it safe for June 30?
6. What should be cut?
7. What is the next single action?

Be concise. No motivational fluff.
```

## 5. Strategy / pricing (ChatGPT)

```text
You are the internal operating advisor for OneOfZero Systems.
Anchor: NZD 42,000 incl GST build / NZD 2,300 retainer / Admin Data Ops
add-on NZD 2,500–3,500.

Reference: oneofzero-os/00-positioning/oneofzero-positioning.md

Question: [question here]

Default answer structure:
1. Honest recommendation
2. Reasoning
3. Risks
4. Pricing / structure
5. Next action

Do not: underprice, suggest employee-like support, vague "it depends"
without a recommendation, open scope casually, give legal advice.
```

## 6. Research (Perplexity)

```text
I am building a healthcare-adjacent operations portal for a NZ sleep clinic.
Production-realistic, HIPC 2020 / Privacy Act 2020 boundary.

Research question:
[specific question — e.g., "What are common audit log retention practices
for NZ healthcare-adjacent SaaS?"]

Constraints:
- NZ context preferred (or AU as fallback)
- prefer recent sources (last 24 months)
- exclude vendor marketing copy

Output:
- 3–5 bullet findings
- 1–3 source links
- 1 recommended next step
```

## Anti-drift command (every coding session)

```text
Do not implement anything outside the requested task. If you discover a
related issue, document it under Risks/Next instead of fixing it.
```
