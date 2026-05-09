# Release SOP

## Release Checklist

Before production release or rehearsal:

1. Confirm `git status` is clean.
2. Run `npx tsc --noEmit`.
3. Run `npm run build`.
4. Confirm unauthorized admin API access returns `401`.
5. Confirm import dry run still works.
6. Confirm blocked execute writes nothing.
7. Confirm review-required execute writes nothing.
8. Confirm clean execute writes expected patient, device, and optional mask records.
9. Confirm imported patient appears in the admin list.
10. Confirm imported patient drawer opens.
11. Confirm imported machine and mask data display correctly.
12. Confirm no-mask records do not show fake mask data.
13. Confirm no raw NHI appears in API responses, UI, logs, or screenshots.

## Release Notes

Record:

- Commit hash
- Date and time
- Operator
- Environment
- Verification results
- Known issues accepted for release

## Rollback

Rollback planning must be agreed before live patient migration. At minimum, identify the previous deployable commit and confirm who is authorised to approve rollback.
