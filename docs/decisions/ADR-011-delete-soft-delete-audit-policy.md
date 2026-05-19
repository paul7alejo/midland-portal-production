# ADR-011 — Deletion Policy: Soft Delete, Audit Events, and Note Ownership

**Date:** May 20, 2026
**Status:** ACTIVE
**Pack version:** v3.2

## Context

Phase 2A introduces persistent admin notes on patient records. Before implementing edit and delete actions on notes (or any future operational record), the project needs a documented, enforced deletion policy to prevent accidental data loss, audit gaps, and cross-admin permission violations.

Midland is healthcare-adjacent. Operational records must remain traceable. The audit table is already append-only at the IAM level. This ADR extends that posture to all mutable admin data.

## Decision

### 1. Soft delete is the default

For all operational data in Midland — patient records, admin notes, orders, portal account events, and access history — soft delete is the default and required approach.

Soft-deleted records:
- Remain in DynamoDB with their original pk/sk unchanged
- Are marked with: `is_deleted: true`, `deleted_at` (ISO timestamp), `deleted_by` (admin sub), `deleted_by_email`
- Are hidden from normal UI views (filter `is_deleted != true` or `attribute_not_exists(is_deleted)`)
- Remain recoverable by direct DynamoDB access or a future admin audit view
- Include `delete_reason` where required by context

### 2. Hard delete is forbidden by default

Hard delete (physical removal via `DeleteItem`) is forbidden for:
- Patient records
- Admin notes
- Orders and reorder requests
- Audit-adjacent records
- Portal account access history
- Any operational record

Exceptions require:
- A legally scoped removal request (Privacy Act 2020) with Privacy Officer sign-off
- A documented ADR or decision log entry naming the specific scope
- Manual AWS console execution — never exposed through the portal UI

### 3. Delete confirmation requires typing DELETE

Any destructive action in the admin UI must:
- Show a confirmation modal explaining what will happen
- Require the admin to type `DELETE` exactly in a text field
- Keep the confirm button disabled until the input matches exactly
- Perform a soft delete, not a hard delete

High-risk actions should also require a `delete_reason` field in the modal.

### 4. Edit and soft-delete actions must be audited

Audit events for note mutations (safe metadata only — no body content, no NHI, no secrets):

| Event | When |
|---|---|
| `NOTE_CREATED` | Admin adds a persistent note to a patient record |
| `NOTE_UPDATED` | Admin edits their own note |
| `NOTE_SOFT_DELETED` | Admin soft-deletes their own note |

Audit payload must include: `action`, `patient_msid`, `note_id` (the sk), `admin_sub`, `admin_email`, `timestamp`, `result`.

Audit payload must NOT include: full note body, NHI, tokens, secrets.

The audit row is written BEFORE the mutation, per the existing write-order rule in `audit-logging-rules.md`.

### 5. Admin notes are owner-edit / owner-delete only

Permission model for persistent admin notes:

| Who | Can view active notes | Can edit | Can soft-delete |
|---|---|---|---|
| Any authorized admin | Yes | No (others' notes) | No (others' notes) |
| Creator admin only | Yes | Yes (own notes) | Yes (own notes) |
| Anyone | — | — | Hard delete: never through UI |

Ownership is determined by `created_by` (admin Cognito sub). The API route enforces this server-side — it is not a client-side trust decision.

## Consequences

- `listPatientNotes` queries must filter `attribute_not_exists(is_deleted) OR is_deleted = false` to hide soft-deleted notes
- Edit and soft-delete API routes check `created_by == admin.sub` before proceeding
- All edit/delete routes write an audit row via `appendAuditLog` before the mutation
- The PatientDrawer Notes tab shows only active (non-deleted) notes
- Future admin audit/history view may surface soft-deleted notes in a separate scoped view
- `deletePatientNote` in `dynamodb.ts` must use `UpdateCommand` (set fields), not `DeleteCommand`
- The UI confirmation modal for note delete must require typing `DELETE`

## References

- `midland-os/03-technical/audit-logging-rules.md` (write-order rule, safe metadata)
- `midland-os/00-core-context/non-negotiables.md` (rules 39–43)
- `src/lib/aws/dynamodb.ts` (note storage shape)
- `src/app/api/admin/patients/notes/route.ts` (note API)
