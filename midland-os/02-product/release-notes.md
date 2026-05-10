# Release Notes

> Public-facing version log. Pasted into Midland's monthly improvement review.
> Internal-only details (key rotation, AWS config) live in the decision log.

---

## v0.31 — Day 30 closeout (in progress, not released)

**Target:** May 11, 2026

**Highlights:**
- Midland OS v1 documentation pack published in `midland-os/` (v3.1)
- Admin Data Operations sub-system planned (Days 33–37)
- HIPC compliance items 🟡 → tracking toward 🟢 with rehearsal evidence

**Internal notes:** see `06-memory/weekly-summary.md`

---

## v0.30 — Day 29 (released, pushed)

**Highlights:**
- Admin imported patients table live
- Patient drawer/detail view live
- Imported patient API now returns no raw NHI
- No fake mask fallback

**Known limitations:** drawer formatting needs polish (Day 32); review status display-only.

---

## v0.29 — Day 28 (released, pushed)

**Highlights:**
- Controlled execute import wired to DynamoDB
- Duplicate NHI + serial protection live
- Created / skipped / failed counts in import response
- Audit row PutItem on import boundaries

---

## v0.28 — 1B-a Import Governance complete

**Highlights:**
- Preview validation
- Duplicate detection
- Evidence pack
- Approval workflow

---

## Template for future releases

```markdown
## v0.XX — [Description]
**Target:** YYYY-MM-DD
**Status:** released / in progress / planned

**Highlights:**
- ...

**Bug fixes:**
- ...

**Known limitations:**
- ...

**Internal notes:** see `06-memory/weekly-summary.md`
```
