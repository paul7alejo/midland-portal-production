# /admin-view
Build admin page, table, or detail view.
## Includes
Patient list, drawer, batch summary, export/backup/AWS status pages.
## Rules
- org_id filter enforced server-side
- No raw NHI in table columns
- No fake mask fallback ("no mask on record")
- Status badges: Pending review | Reviewed | Action needed | Escalated
- Tables collapse to cards on mobile
- Verify: npx tsc --noEmit
