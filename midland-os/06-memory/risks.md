# risks.md
# Active risks — probability, impact, mitigation
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz

## Risk Rating Key
```
Probability: HIGH | MEDIUM | LOW
Impact:      HIGH | MEDIUM | LOW
Status:      OPEN | MITIGATED | RESOLVED | ACCEPTED
```

## CRITICAL RISKS

### RISK-001 — ALTER Export Format Not Confirmed
```
Probability: HIGH
Impact:      HIGH — could delay or block June 30 go-live entirely
Status:      OPEN
Trigger:     if not resolved by May 23, 2026 → escalate
Action:      ask Midland: who owns export, what format, when?
Owner:       Paul Alejo — raise with Midland in next meeting
```

### RISK-002 — Privacy Officer Review Not Scheduled
```
Probability: HIGH
Impact:      HIGH — go-live on real patients blocked without PO sign-off
Status:      OPEN
Trigger:     if not resolved by June 2, 2026 → escalate
Action:      raise in next Midland meeting
Owner:       Paul Alejo — raise with Midland
```

### RISK-003 — Import Data Quality Unknown
```
Probability: HIGH
Impact:      HIGH — missing fields, duplicate NHIs, format mismatch
Status:      OPEN
Mitigation:  dry-run catches most issues; "Not recorded" for missing; request sample file
Owner:       Paul Alejo — request sample file from Midland
```

## HIGH RISKS

### RISK-004 — Scope Creep Before June 30
```
Probability: MEDIUM-HIGH
Impact:      HIGH — delays go-live
Status:      OPEN (ongoing vigilance)
Mitigation:  enforce scope freeze list; "Phase 2 roadmap" as default response
```

### RISK-005 — Staff Training Window Not Agreed
```
Probability: MEDIUM
Impact:      HIGH — go-live may slip even if code ready
Status:      OPEN
Mitigation:  agree training date in next meeting
```

## MEDIUM RISKS

### RISK-006 — M365 Offshore Disclosure Not Confirmed
```
Probability: MEDIUM
Impact:      MEDIUM — HIPC Rule 12 compliance gap
Status:      OPEN
```

### RISK-007 — DynamoDB Test Records in Production
```
Probability: HIGH (likely exists)
Impact:      MEDIUM — data quality, not safety
Status:      OPEN
Mitigation:  audit DynamoDB before migration; remove via AWS console (Rule 17)
```

### RISK-008 — free-claude-code Proxy Security
```
Probability: LOW-MEDIUM
Impact:      MEDIUM
Status:      ACCEPTED with controls — demo data only, never real patient data
```

## LOW / ACCEPTED RISKS

### RISK-009 — Import Not Transactional
```
Status: ACCEPTED — documented in known-limitations.md
```

### RISK-010 — CloudWatch Alarm Tuning
```
Status: ACCEPTED — review after first 2 weeks of real traffic
```

## RESOLVED

```
RISK-000 — OpenRouter as primary coding path → RESOLVED (ADR-009)
```
