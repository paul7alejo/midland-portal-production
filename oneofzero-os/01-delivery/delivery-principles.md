# Delivery Principles

## Five things that hold across every project

```text
1. Start with one wedge.       Not a 12-feature platform.
2. Surgical edits.              Allowed files / forbidden files in every prompt.
3. Honest known-limitations.    Say what doesn't work. Trust compounds.
4. Operating layer beside code. SOPs, decisions, risks, learnings, handover.
5. Production-readiness gates.  Backup smoke test, audit log, Privacy Officer sign-off.
```

## How we structure a clinic engagement

```text
Phase 0 — Discovery (paid, fixed)
  - 2 weeks
  - clinic walk-through, ALTER export sample, admin shadowing
  - HIPC posture audit
  - scoped Phase 1 proposal with anchor + milestones

Phase 1 — Production Operations Portal (this is Midland)
  - 8–10 weeks
  - import + admin review + export + backup + handover
  - Midland OS v1 documentation
  - go-live + retainer start

Phase 1.5 — Stabilisation (retainer-funded, first 90 days)
  - daily monitoring
  - weekly improvement review
  - early-bug response
  - case study capture

Phase 2+ — Capability expansion
  - shop reactivation, inventory, mobile, multi-clinic
  - quoted separately, not bundled into retainer
```

## Definition of done — Phase 1

```text
- live production portal, MFA on staff, MSID for patients
- 1 controlled import rehearsal completed with evidence
- 4 export types working with audit-before-file discipline
- backup: PITR + on-demand + weekly S3 + visibility panel
- 5 SOPs delivered (import, admin review, release, support, export+backup)
- Midland OS v1 handover index published
- Privacy Officer sign-off received
- retainer starts the day after go-live
```

## How we say no

```text
"This is a great idea for Phase 2 / Phase 3. For now I'm protecting our
 June 30 date by keeping this out of the build. Let's add it to the
 feature backlog with the right priority and revisit at the Month 12
 contract review."
```

```text
"That would expand scope. To do it well I'd want to scope it as a
 separate quote — happy to send a one-pager next week."
```

## How we ship faster without breaking things

```text
- always npx tsc --noEmit before committing
- always npm run build before merging
- always feature branch + PR even solo
- always add a known-limitation BEFORE shipping a partial feature
- always update decision-log.md when something locks in
- never deploy on Friday afternoon
- never ship a destructive operation without dual-control + audit
```

## When something goes wrong

```text
1. Stop. Don't push another deploy.
2. Capture the symptom in 06-memory/risks.md or 06-memory/known-limitations.md.
3. If patient data may be affected — contact Midland Privacy Officer same day.
4. Rollback via Amplify previous-deploy redeploy.
5. Post-incident: update learnings.md. Find the rule that should have prevented it.
6. Never delete or rewrite the audit log. Always append a new row.
```
