# Midland Sleep — Phase 1/2 Closeout Meeting Script

> Internal use only. This is a speaker guide, not a document to share with the client.
> Estimated duration: 20–30 minutes.

---

## Before the meeting

- Admin portal open, logged in as admin test account.
- Patient portal open in a second tab, logged in as test patient account.
- A test all-patient Dashboard card / Important notice already published (for demo).
- A test single-patient Notification bell / Reminder notice published to a non-production MSID.
- No real patient data visible on screen.
- Closeout summary document open for reference if needed.

---

## 1. Opening (2 minutes)

> Warm, direct. Don't over-explain. Set the frame immediately.

"Thanks for making time. I wanted to do this properly — both to walk you through what's been built, and to close out Phase 1 and Phase 2 commercially.

What I want to cover today: a quick look at what's live, a demo of the notices system we've just finished, and then a conversation about where we go from here — support retainer and next phases.

I'll keep it to 25 minutes or so. Questions any time."

---

## 2. Technical closeout summary (3 minutes)

> State the facts plainly. Don't downplay but don't oversell the technical detail.

"Just to confirm the technical position before we get into the demo:

Phase 2 is fully deployed to the current Midland environment. The latest Amplify build passed. TypeScript and the production build are clean. We completed a runtime AWS key rotation as part of closing out — that's now documented and the old credential is deleted.

We've got proof logs for all the notice work — sprints 14C through 14F — committed into the repo. The Phase 2 closeout documentation pack is in the repo as well.

So the platform is stable, clean, and closed out technically. Nothing hanging."

---

## 3. Phase 1/2 value framing (3 minutes)

> This is important. Say this clearly and don't rush it.

"Before the demo, I want to frame what's actually been built — because it's worth naming it properly.

When this started, the brief was effectively a patient web presence. What we've built is a production operations platform. Not a website update. An operations platform.

Phase 1 gave you authenticated patient access, supply request submission, device and mask record visibility, a controlled data import system with validation and guardrails, admin patient management, audit logging, and soft-delete compliance controls.

Phase 2 added the full supply request command centre — the Orders page where staff action requests, change status, download reports, and manage the patient queue. And then the Patient Notices system, which is the piece we'll demo today.

Everything runs on role-protected infrastructure with an audit-first write pattern. Every status change, every data mutation — audit event first, then write. That's not a small website."

---

## 4. Demo (12–15 minutes)

### 4a. Admin overview (2 minutes)

**Navigate to:** Admin Orders.

"This is the command centre for supply requests. Everything comes in here — three tabs, Active, Completed, All. Staff can change request status inline, open a patient record without leaving the page, filter and sort the queue, and download safe reports.

The funding review flag is an internal signal — patients never see it."

> Show the PatientDrawer briefly. Don't go deep — this is context, not the focus.

---

### 4b. Patient Notices — admin view (1 minute)

**Navigate to:** Admin → Notices.

"The Notices page is the broadcast channel into the patient portal. Admins create notices here and publish them directly to patients — no dev work required.

Three audience types: All patients, Single patient, and Selected patients which is coming in a future phase. Three placements, three priority levels."

---

### 4c. All-patient notice (2 minutes)

> The Important / Dashboard card notice should already be published.

"Show the published notice in the table. This is an Important-priority Dashboard card notice targeting all patients.

Let me switch to the patient portal."

**Switch to patient portal tab → Dashboard.**

"The patient sees this on their dashboard — the red priority pill, the message. The visual treatment is deliberate: Info is teal, Reminder is amber, Important is red. Staff control what patients see and when, without touching the portal code."

---

### 4d. Duplicate protection (2 minutes)

**Switch back to admin tab.**

"Now — one thing we built specifically as a governance control: if a staff member tries to publish a second all-patient notice with the same placement and priority while the first one is still active, the server blocks it."

> If you have a second draft ready, try to publish it and show the 409 error.
> If not, describe it: "The server returns a conflict message — 'An all-patient dashboard card important notice already overlaps this schedule.' You need to expire or reschedule the first one before publishing another."

"This prevents the patient portal from showing conflicting or duplicated notices. It's a server-side rule, not a UI hint."

---

### 4e. Single-patient notice (2 minutes)

"Single-patient notices target one patient by MSID. The MSID field accepts bare digits or the prefixed format — the system normalises both. So staff don't need to know the exact format."

> Point to the published single-patient notice in the table. Do not enter a real MSID or show real patient data.

"This notice will appear only in that patient's bell and notifications page — no other patient sees it."

---

### 4f. Patient portal — top strip and bell (2 minutes)

**Switch to patient portal tab.**

"Two more placements. If there's an active Top strip notice, it appears here as a scrolling bar in the desktop header. If there isn't one, the bar doesn't show at all — no fallback copy."

**Open the notification bell.**

"The bell badge count is the sum of unread request notifications and unseen clinic notices. Once the patient opens the bell, the clinic notice count drops to zero — it's tracked locally in the browser. They won't see the badge again for notices they've already looked at, until a new one is published."

---

### 4g. Notifications page (1 minute)

**Navigate to:** /portal/notifications.

"The full notifications page. Supply request updates and clinic notices in one place, clearly labelled and visually differentiated by type and priority."

---

## 5. Known limitations — future paid scope (2 minutes)

> Frame these as the next commercial conversation, not as gaps or apologies.

"A few things that are deliberately out of scope for Phase 1 and 2 — not oversights, just scope decisions we agreed on:

- **SMS and email delivery.** Notices are portal-only. Outbound patient comms via email or SMS is a separate integration that needs a verified sending domain, opt-in management, and compliance sign-off. That's Phase 3 work.
- **Server-side read receipts.** The seen state for clinic notices is browser-local. No analytics on who's read what.
- **Checkout and payment.** No transaction flow yet. That's Phase 3C/4.
- **Inventory.** No stock reservation or deduction. Phase 4.
- **PWA.** The portal isn't installable on mobile home screens yet. Phase 3A.

None of these are bugs. They're the next phases."

---

## 6. Pricing close (3 minutes)

> Calm, direct. State the numbers, don't hedge.

"On the commercial side — Phase 1 and Phase 2 are closed out and ready to invoice.

Phase 1: NZD $38,500 + GST — portal foundation, import, handover.
Phase 2: NZD $26,500 + GST — admin operations, orders, notices, portal UX.
Total: NZD $65,000 + GST.

I'll issue the closeout invoice shortly. Is there anyone else I should copy, or any particular format you need for your records?"

> Pause. Let them respond. Don't fill the silence.

---

## 7. Retainer close (3 minutes)

> Transition naturally from the invoice conversation.

"Going forward, what I'd recommend is moving onto a structured support retainer. The platform is in production now — you'll want defect cover, security patch review, and the ability to make minor changes without spinning up a full project engagement each time.

What I'm proposing: NZD $3,500 per month plus GST, six-month minimum. That covers maintenance, priority support, and access for planning the next phases.

It's designed to give you a predictable cost and continuity of the team that built the system."

> If they push back on price: "We can look at the scope of what's included. But the floor needs to cover the time to maintain a production healthcare-adjacent system properly — that's not a small surface area."

---

## 8. Next-phase roadmap (3 minutes)

> Brief. This is a teaser, not a full spec.

"On what comes next — there are five natural next phases, and I'd recommend scoping them in order:

**Phase 3A** — PWA. Make the portal installable, mobile-first access, safe online-first behaviour.
**Phase 3B** — Product Catalogue. Admin-managed items, patient browsing.
**Phase 3C** — Entitlement-Aware Request Form. Entitlement and funding visibility, co-pay logic.
**Phase 3D** — Fulfilment Console. Pick, pack, dispatch workflow for staff.
**Phase 4** — Inventory and Entitlement Sync. Stock reservation, balance deduction, and external system integration (scoped separately).

These are separate builds, priced separately. I'd want to do a discovery session for whichever phase you want to prioritise before we write a spec.

What's causing the most friction in the current workflow — would that help us decide where to start?"

> Listen. Let them direct. Their answer will tell you which phase matters most commercially.

---

## 9. Handling likely objections

### "This is more than we expected to spend."

"Phase 1 and Phase 2 represent a substantial production build across secure access, admin operations, audit-aware workflows, import guardrails, patient communication, and AWS infrastructure. What you have is not a basic web form — it's an operations platform with authentication, audit controls, role enforcement, import guardrails, and now a controlled patient communication layer. The price reflects that. We can look at a payment schedule if that helps."

### "Can we pause and revisit the retainer later?"

"That's fine. I'd just note that without a retainer in place, any maintenance or changes get scoped and priced as ad hoc work, which takes longer to kick off and is usually more expensive over time. The retainer is there for predictability on your side, not just mine."

### "What about SMS notifications — we thought that was included?"

"SMS and email delivery was always called out as a separate phase requiring compliance decisions around sending domain, opt-in consent, and message content. We have the portal notification infrastructure in place — the notices are live in the portal. Outbound email and SMS is the next layer, and it's a separate scope with its own compliance requirements."

### "Why can't we just do small changes as we go without a retainer?"

"You can — ad hoc requests are available. A retainer just gives you priority response time, covers routine maintenance without a new quote each time, and locks in the current rate. Without it, any change is a new engagement."

### "We're happy with the system but want to think about Phase 3."

"That's completely fine. Take the time you need. I'd suggest we set a date to do a Phase 3A/3B discovery session — even a 30-minute call — so that when you're ready to move, we're not starting from zero on the spec."

---

## 10. Close

"I'll send through the closeout invoice this week and a retainer proposal as a separate document for you to review.

If there's anything from today you want to dig into further, or if other staff need to see the platform, I'm happy to do a repeat walkthrough.

Thanks again for the collaboration on this — it's been a solid build."

---

> Post-meeting actions:
> - Send closeout invoice (Phase 1: $38,500 + GST, Phase 2: $26,500 + GST)
> - Send retainer proposal document separately
> - Note any Phase 3 priorities they mentioned
> - Schedule follow-up if retainer not confirmed in meeting
