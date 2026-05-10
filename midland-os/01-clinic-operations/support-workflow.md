# Support Workflow

> How OneOfZero supports Midland post go-live, on the NZD 2,300/month retainer.

## Channels

```text
Primary     email — paul@oneofzero.co.nz
Backup      Slack / phone (urgent only — bookable Mon–Fri)
NEVER       direct DM to Paul outside business hours unless P1 emergency
```

## Response targets (commercial — not contractual SLAs)

```text
P1 — production down / patient data risk      acknowledged within 4 hours
P2 — admin can't perform a core task          acknowledged within 1 business day
P3 — minor bug, cosmetic issue                acknowledged within 3 business days
P4 — feature request                           acknowledged within 5 business days,
                                              triaged into change-request flow
```

## Triage rules

```text
P1 examples:
  - production portal returns 5xx for any role
  - NHI visible in URL, log, or unauthorised UI
  - patient data missing or corrupted
  - backup system failure not self-healing
  - export or audit log inaccessible

P2 examples:
  - import dry-run failing on valid batch
  - admin drawer not opening for some records
  - export button returning empty CSV

P3 examples:
  - typo in copy
  - layout off on a specific browser
  - status badge wrong colour

P4 examples:
  - "can we add filter X"
  - "can we see metric Y"
  - "can we automate Z"
```

## What's INCLUDED in retainer

```text
- maintenance and minor fixes
- AWS / hosting monitoring + adjustments
- Cognito user pool admin assistance
- monthly improvement review (1 hour, scheduled)
- support questions from admin staff (reasonable volume)
- audit log spot-checks
- backup verification
- release oversight
- small UI / copy improvements within agreed monthly capacity
```

## What's EXCLUDED from retainer

```text
- major new features (separate scope + price)
- checkout / Stripe / shop reactivation (Phase 2 conversation)
- inventory or supplier integration
- mobile app build
- patient invitation automation
- bulk patient email sends
- unlimited spreadsheet format support
- legal / compliance certification responsibility
- clinical decision responsibility
- training new admin staff (1 session included; further training quoted)
```

## Change request flow

```text
1. Midland emails request to paul@oneofzero.co.nz
2. Paul triages: bug fix (within retainer) vs change request (separate)
3. If change request:
   a. scope clarification call (15 min, not billed)
   b. quote sent (one-line price + estimated days)
   c. Midland approves in writing
   d. work scheduled
   e. work delivered, milestone billed
4. If bug fix:
   a. Paul fixes within priority window
   b. note in monthly improvement review
```

## Monthly improvement review (1 hour, scheduled)

```text
Agenda:
  [ ] last month's tickets summary
  [ ] uptime and AWS billing
  [ ] backup status (verified)
  [ ] audit log anomalies (if any)
  [ ] portal usage metrics (admin requests, exports run, backups taken)
  [ ] Midland-side feedback
  [ ] proposed improvements (queue, not commitment)
  [ ] any new risks or known limitations
```

## Emergency / out-of-hours

```text
Definition:    P1 only (production down or patient data risk)
Contact:       phone (provided to Midland clinical lead at handover)
Response:      within 4 hours, best effort
Resolution:    same business day where possible
Compensation:  no after-hours surcharge for P1 — included in retainer commitment
               P2 / P3 / P4 are next-business-day at most
```

## What this is NOT

```text
- a help desk for patients (admin staff funnel patient questions)
- a 24/7 SLA (it's a 1-person retainer)
- legal or clinical advice
- training/onboarding for new clinical software
- a free unlimited support buffer
```
