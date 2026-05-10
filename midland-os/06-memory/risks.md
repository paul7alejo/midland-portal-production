# Risks

> Living list. Highest-impact at top. Closed risks moved to bottom with date and resolution.

---

## OPEN — high impact

### R-001 — ALTER export format unconfirmed (BLOCKED-BY-MIDLAND)

```text
Impact:    blocks production data migration; could miss June 30 go-live
Owner:     Midland clinical lead
Mitigation: documented in 06-memory/risks.md; ask in next call
Action:    "Who owns ALTER export, format, columns, when?"
Last updated: May 9, 2026
```

### R-002 — Privacy Officer review not yet booked

```text
Impact:    blocks go-live with real patient data, even if code is ready
Owner:     Midland (Privacy Officer)
Mitigation: prompt at next Midland call; offer dates
Action:    book within 2 weeks of code-ready (Day 45 trigger)
Last updated: May 9, 2026
```

### R-003 — Migration rehearsal vs real data

```text
Impact:    real data may differ from rehearsal data (encoding, missing fields,
           edge cases not tested)
Owner:     OneOfZero (technical) + Midland (data quality)
Mitigation: import in batches of 50–100, dry-run first, capture failures honestly
Last updated: May 9, 2026
```

---

## OPEN — medium impact

### R-004 — Solo developer = single point of failure

```text
Impact:    if Paul is unavailable, response time degrades
Mitigation: SOPs + handover docs (1E) so admin can self-serve P3+
            Midland has phone contact for P1 (within 4h SLA)
            documentation is the bus factor mitigation
Last updated: May 9, 2026
```

### R-005 — DynamoDB throttle under unexpected load

```text
Impact:    portal degrades during simultaneous import + admin activity
Mitigation: PAY_PER_REQUEST capacity; CloudWatch alarm tuned;
            switch to PROVISIONED if alarm fires repeatedly
Last updated: May 9, 2026
```

### R-006 — Backup S3 bucket misconfiguration

```text
Impact:    public access, lost backups, GDPR-style exposure
Mitigation: bucket policy reviewed in release SOP every release;
            CloudWatch + AWS Config monitoring
Last updated: May 9, 2026 (v3.1 added)
```

### R-007 — NHI accidentally included in an export

```text
Impact:    HIPC violation, Privacy Officer notification, Midland reputational risk
Mitigation: NHI excluded by default (Rule 16); opt-in requires reason +
            audit BEFORE file generation; flag NHI exports > 1/month/admin
Last updated: May 9, 2026 (v3.1 added)
```

---

## OPEN — low impact

### R-008 — Cost spike if usage surges (not currently expected)

```text
Impact:    monthly AWS bill jumps from ~NZD 60 to NZD 200+
Mitigation: AWS billing alert at NZD 150; review at monthly improvement
Last updated: May 9, 2026
```

### R-009 — Lovable/Vercel reference-site dependency

```text
Impact:    Phase 1A artefacts (Vercel) become stale; not Phase 1B blocker
Mitigation: Phase 1A is demo-only; production is Amplify
Last updated: May 9, 2026
```

---

## CLOSED

```text
(none yet — open risks above are tracked through to closure)

When a risk closes, move here with:
  - resolution date
  - what resolved it
  - any leftover residual risk
```

---

## Risk template

```markdown
### R-XXX — [title]

```text
Impact:        [what could happen]
Owner:         [who is responsible]
Mitigation:    [what we are doing about it]
Action:        [next concrete step]
Last updated:  [date]
```
```
