# Support Model

> Retainer rules. Inclusive and exclusive boundaries. Response targets.

## Anchor

```text
Retainer:        NZD 2,300 / month incl GST
Notice period:   3 months either way
Hosting:         charged separately, NZD 150–300 / month, on monthly invoice
Term:            month-to-month after Phase 1 close
```

## INCLUDED in retainer

```text
- maintenance + minor fixes (P1–P3)
- monthly improvement review (1 hour, scheduled)
- AWS / hosting monitoring + adjustments
- Cognito user pool admin assistance
- support questions from admin staff (reasonable volume)
- audit log spot-checks
- backup verification
- release oversight
- small UI / copy improvements within agreed monthly capacity
- one new staff training session per year
```

## EXCLUDED from retainer (separate scope + price)

```text
- major new features
- checkout / Stripe / shop reactivation (Phase 2 conversation)
- inventory or supplier integration
- mobile app build
- patient invitation automation
- bulk patient email sends
- unlimited spreadsheet format support
- multi-clinic onboarding
- Terraform / IaC implementation
- legal / compliance certification responsibility
- clinical decision responsibility
- training new admin staff beyond first session/year
```

## Response targets (commercial — not contractual SLAs)

```text
P1 — production down / patient data risk      acknowledged within 4 hours
P2 — admin can't perform a core task          acknowledged within 1 business day
P3 — minor bug, cosmetic issue                acknowledged within 3 business days
P4 — feature request                           acknowledged within 5 business days,
                                              triaged into change-request flow
```

### Triage examples

```text
P1
  - production portal returns 5xx for any role
  - NHI visible in URL, log, or unauthorised UI
  - patient data missing or corrupted
  - backup system failure not self-healing
  - export or audit log inaccessible

P2
  - import dry-run failing on valid batch
  - admin drawer not opening for some records
  - export button returning empty CSV
  - on-demand backup failing intermittently

P3
  - typo in copy
  - layout off on a specific browser
  - status badge wrong colour

P4
  - "can we add filter X"
  - "can we see metric Y"
  - "can we automate Z"
  - "can we connect tool A"
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

## Monthly improvement review (60 min, scheduled)

```text
Agenda
  [ ] last month's tickets summary
  [ ] uptime + AWS billing
  [ ] backup status (verified)
  [ ] audit log anomalies (if any)
  [ ] portal usage metrics
  [ ] Midland-side feedback
  [ ] proposed improvements (queue, not commitment)
  [ ] new risks or known limitations
  [ ] next month focus
```

## Emergency / out-of-hours

```text
Definition       P1 only (production down or patient data risk)
Contact          phone (provided to Midland clinical lead at handover)
Response         within 4 hours, best effort
Resolution       same business day where possible
Compensation     no after-hours surcharge for P1 — included in retainer
                 P2/P3/P4 are next-business-day
```

## Quarterly summary email (provided to Midland)

```text
Subject:        Midland portal — Q[N] [year] summary
Includes:
  - imports run (counts + batch summary)
  - exports run (counts only — never patient data in email)
  - backup status (PITR healthy, weekly snapshots run/missed)
  - uptime
  - billing (AWS line items if material change)
  - incidents (none / brief)
  - next quarter focus
```

## What this is NOT

```text
- a help desk for patients (admin staff funnel patient questions)
- 24/7 SLA (it's a 1-person retainer)
- legal / clinical advice
- training / onboarding for unrelated clinical software
- a free unlimited support buffer
- a justification to defer Phase 2+ commercial conversations
```
