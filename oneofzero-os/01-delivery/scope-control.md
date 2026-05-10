# OneOfZero OS — Scope Control

## The Rule of 100 (Hormozi)

Every hour spent on unscoped work is an hour not spent on the June 30 deadline.
One distraction at the wrong moment can break the whole timeline.

Before touching any task, ask:
1. Is this in the Phase 1B scope list? (Section 6 of master pack)
2. If yes — do it.
3. If no — document it as a future phase, estimate it, and send a change request.
4. If the client asks verbally — say "great idea, let me capture that for Phase 2."

## Scope Freeze List (Phase 1B — before June 30)

DO NOT TOUCH without an explicit override:
- Checkout, cart, Stripe, payments
- Full CPAP shop / inventory
- Mobile app or PWA
- Patient invitations / Cognito patient user creation
- Automated patient emails
- Advanced analytics dashboard
- SSO / Azure AD federation
- Terraform IaC (post-launch)
- Broad AI chatbot/agent features
- Automated ALTER sync
- Unlimited spreadsheet format support
- Legal/compliance certification
- Clinical responsibility

## How to Handle Scope Requests

**Client says:** "Can we also add X?"
**You say:** "Yes — that's a great idea for Phase 2. I'll document it and we can scope
it properly after June 30 go-live. It won't be in the current phase."

**Client says:** "It's just a small thing."
**You say:** "Even small things have integration risk at this stage. I'd rather ship
cleanly on June 30 and add it properly in the retainer cycle."

## Change Request Template

```
CHANGE REQUEST — OneOfZero / Midland Sleep
Date:
Requested by:
Description:
Estimated effort (hours):
Estimated cost (NZD incl GST):
Phase: [ ] Phase 1B add-on  [ ] Phase 2  [ ] Retainer cycle
Impact on June 30 deadline: [ ] None  [ ] Low  [ ] RISKS DEADLINE
Approved by:
```
