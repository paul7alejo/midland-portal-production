## BEHAVIOURAL GUIDELINES (Karpathy Rules)
> These bias toward caution over speed.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- Push back when warranted. Stop when confused. Name what's confusing.

### 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Touch only what you must. Don't improve adjacent code.
- Don't refactor things that aren't broken.
- Match existing style even if you'd do it differently.
- Every changed line must trace directly to the request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals.
- For multi-step tasks, state a brief plan before starting.
- Loop until verified — don't stop at "seems to work".

> Exception: for tasks under 20 lines or clearly scoped
> (CSS change, copy edit), proceed without pre-questions.
> Reserve the above for architectural and multi-file tasks.

## Deletion, Soft Delete, and Audit Rules
> Full policy: docs/decisions/ADR-011-delete-soft-delete-audit-policy.md

- **Soft delete is the default.** Mark records with `is_deleted: true`, `deleted_at`, `deleted_by`, `deleted_by_email`. Never remove from DynamoDB.
- **Hard delete is forbidden by default** for patient records, notes, orders, access history, and all operational data. Requires Privacy Officer sign-off and a documented ADR.
- **Delete confirmation UI must require the admin to type `DELETE` exactly** before the action is enabled. Default action is always soft delete.
- **Audit every edit or soft-delete action.** Write a safe audit event (`NOTE_UPDATED`, `NOTE_SOFT_DELETED`, etc.) with action, patient_msid, record_id, admin_sub, admin_email, timestamp — no body content, no NHI, no secrets.
- **Admin notes are owner-only for edit and soft-delete.** Ownership = `created_by` (admin Cognito sub). Enforced server-side. Other admins can view, not mutate. Nobody hard-deletes notes through the UI.

@AGENTS.md
