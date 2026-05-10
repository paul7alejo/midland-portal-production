# Proof Log

> Before/after evidence captured from each delivery. Feeds case studies and lead magnets.

## Midland Sleep — Phase 1B

### Before (pre-portal)
```text
- spreadsheets + phone + Gmail for CPAP supply management
- NHI used as login credential (compliance risk)
- ~40 hrs/week admin time on phone reorders
- no audit trail for funder utilisation reports
- dependency on ALTER third-party ordering system
- no export, no backup visibility, no admin operating layer
```

### After (Phase 1B target)
```text
- production operations portal (admin + patient)
- MSID replaces NHI as credential (HIPC compliance)
- controlled import with audit trail
- 4-type export bridge with NHI excluded by default
- 3-layer backup discipline (PITR + on-demand + weekly S3)
- AWS state visibility panel
- documented SOPs + Midland OS v1 handover
- admin self-serve for exports, backup, review
- audit data available for funder utilisation proof
```

### Metrics to capture (post go-live)
```text
[ ] admin hours saved per week (target: 20–30 hrs reduction)
[ ] imports run per month
[ ] exports run per month
[ ] backup success rate
[ ] portal uptime (target: 99.5%+)
[ ] funder utilisation data improvement (Midland self-reports)
```

---

## Template for future clinics

```markdown
## [Clinic Name] — Phase [X]

### Before
```text
- ...
```

### After
```text
- ...
```

### Metrics
```text
[ ] ...
```
```
