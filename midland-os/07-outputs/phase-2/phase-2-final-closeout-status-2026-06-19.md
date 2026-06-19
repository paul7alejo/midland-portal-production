# Midland Sleep — Phase 2 Final Closeout Status

## Date
2026-06-19

## Final Status
Phase 2 Admin / Patient Operations is closeout-ready.

The controlled patient communication layer is complete, deployed, proof-logged, documented, and security-reviewed.

## Current Branch
`phase-2a-admin-ops`

## Latest Commit
`67a3167` — `docs: add phase 1 2 commercial closeout drafts`

## Latest Amplify Job
Job `230` — `SUCCEED`

Commit:
`67a31674c0ff7f74155fc554ebc60546bcfd827f`

Message:
`docs: add phase 1 2 commercial closeout drafts`

## Key Commits

| Commit | Purpose |
|---|---|
| `7acd962` | 14C — Display patient notices in portal |
| `3a0cf4c` | 14D — Notice governance tabs and duplicate protection |
| `a3670ba` | 14E — Notice MSID input and bell badge |
| `6b580f2` | 14F — Notice display polish and local seen state |
| `cbdfb4b` | Add Phase 2 closeout documentation pack |
| `87199d0` | Record runtime key rotation proof |
| `67a3167` | Add Phase 1/2 commercial closeout email and meeting drafts |

## Amplify Deployment Evidence

| Job | Commit / Reason | Status |
|---|---|---|
| `223` | 14C — Patient notice display | `SUCCEED` |
| `224` | 14D — Notice governance tabs | `SUCCEED` |
| `225` | 14E — MSID input and bell badge | `SUCCEED` |
| `226` | 14F — Notice display polish | `SUCCEED` |
| `227` | Phase 2 closeout pack | `SUCCEED` |
| `228` | Redeploy after runtime IAM access key rotation | `SUCCEED` |
| `229` | Runtime key rotation proof | `SUCCEED` |
| `230` | Phase 1/2 commercial closeout drafts | `SUCCEED` |

## Completed Capability

Phase 2 completed the controlled patient communication layer:

- Admin-created patient notices
- All-patient notices
- Single-patient notices
- Portal top strip placement
- Dashboard card placement
- Notification bell placement
- Notifications page visibility
- Priority levels: Info / Reminder / Important
- Bell badge awareness
- Local seen state for clinic notices
- Duplicate all-patient notice conflict protection
- MSID input normalization
- Selected-patient tab marked as future scope

## Security Closeout

Runtime AWS access key rotation is complete.

Rotated:
- `MIDLAND_ACCESS_KEY_ID`
- `MIDLAND_SECRET_ACCESS_KEY`

Not rotated:
- `NHI_ENCRYPTION_KEY`
- `NHI_HASH_SALT`

Reason:
NHI encryption/hash secrets require migration planning and must not be rotated casually.

Security proof:
- New runtime key created
- Amplify env updated
- Amplify redeployed successfully
- Old exposed runtime key disabled
- Runtime API/browser smoke checks passed
- Old exposed runtime key deleted
- Rotation proof committed

## Final Local Verification

Final sanity checks passed:

- Working tree clean
- Branch: `phase-2a-admin-ops`
- TypeScript passed
- Production build passed
- Next.js build completed successfully
- 58/58 static pages generated

## Closeout Documents

Phase 2 closeout pack:
- `midland-os/07-outputs/phase-2/phase-2-closeout-summary.md`
- `midland-os/07-outputs/phase-2/phase-2-demo-script.md`
- `midland-os/07-outputs/phase-2/phase-2-known-limitations.md`
- `midland-os/07-outputs/phase-2/phase-2-browser-proof-checklist.md`
- `midland-os/07-outputs/phase-2/phase-2-support-and-next-phase.md`

Commercial drafts:
- `midland-os/02-commercial/midland-phase-1-2-closeout-email-draft.md`
- `midland-os/02-commercial/midland-phase-1-2-closeout-meeting-script.md`

Security proof:
- `midland-os/07-outputs/phase-2/runtime-key-rotation-proof-2026-06-19.md`

## Known Future Scope

Do not build these before commercial closeout:

- Selected-patient multi-select
- SMS/email delivery
- Server-side read receipts
- Notification analytics
- PWA/mobile install experience
- Inventory
- Checkout/payment
- Stripe
- Entitlement/inventory sync
- Activity Inbox expansion

These belong in future paid phases.

## Commercial Position

Phase 1:
Production Portal Foundation / Controlled Import / Handover  
`NZD $38,500 + GST`

Phase 2:
Admin Operations / Orders + Notification Infrastructure / Patient Notices / Portal UX  
`NZD $26,500 + GST`

Total Phase 1/2 closeout:
`NZD $65,000 + GST`

Recommended support retainer:
`NZD $3,500/month + GST`, 6-month minimum

## Next Action

Move to commercial closeout:

1. Review client email draft.
2. Remove internal draft notes/placeholders.
3. Prepare invoice.
4. Schedule closeout/demo meeting.
5. Present support retainer.
6. Do not start Phase 3 until Phase 1/2 is commercially closed.
