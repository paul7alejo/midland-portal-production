# open-loops.md
# Things that are unresolved, deferred, or need a decision
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz
# Close loops by updating status and adding resolution date

---

## Format

```
[LOOP-NNN] Date opened | Priority | Title
Status:     OPEN | RESOLVED | DEFERRED
Owner:      Paul Alejo | Midland | Both
Details:    what needs to happen
Resolution: [fill when closed]
```

---

## Open Loops

### LOOP-001 | May 2026 | HIGH
**Title:** ALTER export owner, format, and column mapping not confirmed

Status:   OPEN
Owner:    Midland
Details:  Need to know: who owns the ALTER export, what format it comes
          in (CSV/XLSX), and whether the column headers match the import
          parser expectations. Request a sample file.
Resolution:

---

### LOOP-002 | May 2026 | HIGH
**Title:** Privacy Officer review not scheduled

Status:   OPEN
Owner:    Midland
Details:  Midland must have a Privacy Officer (or designated person)
          review HIPC compliance report before go-live with real patients.
          Is a PO named? Is a review window available before June 30?
Resolution:

---

### LOOP-003 | May 2026 | HIGH
**Title:** Staff training window not agreed

Status:   OPEN
Owner:    Both
Details:  Jordan Williams and other admin staff need a training walkthrough
          before go-live. Agree a date in the next Midland meeting.
Resolution:

---

### LOOP-004 | May 2026 | MEDIUM
**Title:** M365 data residency policy not confirmed

Status:   OPEN
Owner:    Midland
Details:  HIPC Rule 12 requires disclosure of offshore processors.
          Midland uses M365 — need confirmation that AU data residency
          is enabled and that staff do not include patient NHI/clinical
          data in email.
Resolution:

---

### LOOP-005 | May 2026 | MEDIUM
**Title:** Commercial path for Admin Data Operations (v3.1)

Status:   OPEN
Owner:    Paul Alejo
Details:  v3.1 adds export + backup + AWS state visibility.
          Two options:
            Option A: absorb into NZD 42k flat (only if contract already signed)
            Option B: line item at NZD 44.5–45.5k (if proposal still open)
          Decision needed before next Midland commercial conversation.
Resolution:

---

### LOOP-006 | May 2026 | MEDIUM
**Title:** Test records in production DynamoDB tables

Status:   OPEN
Owner:    Paul Alejo
Details:  Development/test records likely exist in production DynamoDB tables.
          Need to audit and remove via AWS console before migration window.
Resolution:

---

### LOOP-007 | May 2026 | LOW
**Title:** Terraform timeline and scope

Status:   DEFERRED
Owner:    Paul Alejo
Details:  Terraform Associate cert and IaC setup planned for months 5–6
          post-launch. No action needed before June 30.
          Revisit: October 2026.
Resolution: Deferred to October 2026.

---

### LOOP-008 | May 2026 | LOW
**Title:** SSO / Azure AD federation

Status:   DEFERRED
Owner:    Both
Details:  If Midland confirms M365 tenant + SSO interest, evaluate after
          Phase 1B stable. Earliest: Month 6.
Resolution: Deferred pending Midland M365 confirmation.
