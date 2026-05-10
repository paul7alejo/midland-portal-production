# Case Study Capture

> What to capture during delivery so the case study writes itself.

## Capture cadence

```text
Every Friday    proof-log.md (oneofzero-os/05-memory/proof-log.md)
Every milestone before/after pair, screenshot, metric
Every release   release-notes.md entry + permission check
Monthly         improvement review notes (Midland-side)
```

## What to capture (per milestone)

```text
[ ] Before state    1-paragraph + screenshot if applicable
                    e.g. "Admin staff manually checking entitlement on every
                    reorder call. ~6 minutes per call."
[ ] After state     1-paragraph + screenshot
                    e.g. "Admin opens drawer, sees ✅ CAN REORDER, processes
                    in 90 seconds."
[ ] The metric      one number, ideally hours-saved or risk-reduced
[ ] The quote       one sentence from Midland, with permission
[ ] The artefact    SOP / dashboard screenshot / audit log excerpt (redacted)
[ ] The decision    why we built it this way (link to decision-log ADR)
```

## What NOT to capture

```text
- patient names, NHIs, real DOBs, real addresses
- staff names without permission
- anything from the audit log that would re-identify a patient
- screenshots of real patient data (use demo accounts always)
- internal Midland email or Slack
- anything that could be used to compare clinics or staff performance
```

## Permissions

```text
Before publishing anything externally:
  [ ] Midland clinical lead permission
  [ ] Midland Privacy Officer permission
  [ ] All screenshots use demo accounts (Paul / Sarah / Richard / Dev)
  [ ] All metrics are aggregate, never patient-level
  [ ] Anything on LinkedIn / blog / podcast / talk gets a 1-line approval
```

## Storage

```text
Live captures:    oneofzero-os/05-memory/proof-log.md  (timestamps + brief notes)
Polished assets:  midland-os/07-outputs/sales-assets/   (anonymised, ready to share)
Source material:  retain for 1 year, then archive
```

## Final case study artefact

When go-live + 90 days have passed, produce:

```text
- 2-page PDF case study
- 1-slide summary for talks
- 4 social-post variants (LinkedIn / X / blog / email)
- 1 video walkthrough (5 min, demo accounts only)
- updated lead-magnets with fresh numbers
```

These are the assets you take into Year 2 sales conversations.
