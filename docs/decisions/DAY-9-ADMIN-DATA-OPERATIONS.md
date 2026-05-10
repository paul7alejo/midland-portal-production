# ADR-010 — Admin Data Operations added to Phase 1B

**Date:** May 9, 2026
**Status:** ACTIVE
**Pack version:** v3.1

## Context

Phase 1B was scoped as import → admin review → SOPs → handover. But a portal without export, backup visibility, or AWS state awareness is a viewer, not an operating layer. Admins would need to email Paul for every export and have no way to verify backup health.

## Decision

Add the Admin Data Operations sub-system to Phase 1B (Days 33–37):

### A. Export (read-out)
- 4 endpoints: imported patients, combined, entitlement summary, audit window
- NHI excluded by default (Rule 16)
- Opt-in NHI requires reason + audit PutItem BEFORE file generation
- Download: single-use, 24h expiring, watermarked filename

### B. Backup (durability)
- DynamoDB PITR on all 7 tables (35-day rolling)
- On-demand backup endpoint (admin triggers with reason + audit)
- Weekly S3 snapshot Lambda (Sunday 02:00 NZT, encrypted, versioned)
- CloudWatch alarm on Lambda failure

### C. AWS State Visibility (read-only)
- /admin/aws-status panel
- Per-table: record count, size, last write, PITR status, encryption
- Backup status: last on-demand, last weekly, alarm state
- NO destructive operations exposed (Rule 17)

## Commercial options

- **Option A:** Absorb in NZD 42,000 anchor (eats ~3 founder days)
- **Option B:** Line item NZD 2,500–3,500 → total NZD 44,500–45,500

## New rules added

- Rule 16: NHI excluded from every export by default
- Rule 17: No portal-driven delete or restore (AWS console only)
- Rule 18: Backup smoke test in every release SOP

## Consequences

- Days 33–37 allocated to Admin Data Operations (was previously 1E start)
- 1E pushed to Days 39–45
- 1F window narrowed (Day 46–49) — remains stretch
- Day 50 final checkpoint unchanged
- S3 bucket + Lambda added to AWS stack
- 2 new SOPs: export-sop.md, backup-sop.md

## References

- midland-os/03-technical/admin-data-operations.md (full spec)
- midland-os/04-sops/export-sop.md
- midland-os/04-sops/backup-sop.md
- midland-os/02-product/decision-log.md (ADR-010)
