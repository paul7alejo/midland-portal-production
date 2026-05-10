# Proposal Templates

> Default skeletons for the proposals we send. Always customise; never copy-paste verbatim.

## Phase 0 Discovery proposal — 1 page

```markdown
# Phase 0 Discovery — [CLINIC NAME]

**Date:** [DATE]
**From:** Paul Alejo, OneOfZero Systems
**For:** [CLINIC LEAD]

## What this is
A 2-week paid discovery to determine whether a Phase 1 production operations
portal is the right next step for [CLINIC].

## What we'll do
- 2-hour clinic walk-through (in person or video)
- shadow your admin team for 1 day
- review your current patient export sample (anonymised)
- review HIPC 2020 posture
- 1 stakeholder interview (Privacy Officer + clinical lead)
- 10-page Phase 1 scope + quote at the end

## What we'll not do
- write any code
- claim HIPC compliance for you
- propose a "platform" — we propose one wedge

## Price
NZD [X,XXX] incl GST, fixed.
Net 14 on signing.

## Deliverable
A Phase 1 proposal, an architecture sketch, and a milestone plan.
If after Phase 0 we agree it's not a fit, that's fine — you keep the report.

## Next step
Reply yes and I'll send a contract Wednesday.
```

## Phase 1 Production Operations Portal proposal — 4 pages

```markdown
# Phase 1 Production Operations Portal — [CLINIC NAME]

**Date:** [DATE]
**From:** Paul Alejo, OneOfZero Systems
**For:** [CLINIC LEAD]

## Outcome (in your words)
- replace your dependency on [ALTER / similar] for [WORKFLOW]
- give your admin staff a portal that handles [ENTITLEMENT QUESTION]
- get audit data you can use for [FUNDER]
- get a backup-able, exportable, owned data layer
- meet HIPC 2020 from day one

## Scope (8 weeks)
1. Controlled import governance (Biomedical-style spreadsheet → DynamoDB)
2. Admin patient list + drawer
3. Admin Data Operations: Export (4 types) + Backup (PITR + on-demand + weekly) +
   AWS State Visibility
4. Patient portal foundation (login, dashboard, equipment, entitlement, reorder
   request, profile, Download My Data)
5. SOPs (import, admin review, release, support, export, backup)
6. Operating layer documentation (Clinic OS v1)
7. Handover + Privacy Officer sign-off

## Out of scope (Phase 2+)
- shop / Stripe / payments
- inventory / suppliers / fulfilment
- mobile app
- patient invitation automation
- automated patient email
- portal-driven delete or restore

## Stack
[brief: Next.js / Cognito / DynamoDB / Amplify / S3 / CloudWatch — ap-southeast-2]

## Compliance
HIPC 2020 across 13 rules. AES-256-GCM NHI encryption. Privacy Officer sign-off
required before go-live.

## Price
NZD [42,000] incl GST.

## Milestone billing
[15 / 20 / 25 / 20 / 20]

## Retainer (post go-live)
NZD [2,300] / month incl GST. 3 months notice to cancel.

## Insurance
Professional indemnity + cyber insurance carried by OneOfZero.

## Limitation of liability
Capped at 2× annual fees paid.

## Timeline
Signed by [DATE] → kickoff [DATE] → go-live [DATE].

## Acceptance
Reply YES, I'll send the contract within 2 business days.
```

## Change request proposal — 1 page

```markdown
# Change Request — [FEATURE]

**Date:** [DATE]
**For:** [CLINIC LEAD]

## What you asked for
[1-2 sentence description in their words]

## Why this is a change request, not maintenance
[1 sentence — references retainer boundaries]

## Proposed scope
- [bullet]
- [bullet]
- [bullet]

## Out of scope
- [bullet]

## Price
NZD [X,XXX] incl GST.

## Timeline
[N] business days from approval.

## Impact on June 30 / current milestone
[None / brief impact + mitigation]

## Acceptance
Reply YES and I'll schedule it for [WEEK].
```

## Tone rules

```text
- one promise, one price, one date — no buffet menus
- show what's NOT included before they ask
- show the timeline — never "asap" or "as fast as possible"
- show the price in NZD incl GST every time
- do not over-explain technical detail in the proposal
- do not under-quote to win — the cheap quote loses you the next clinic
```
