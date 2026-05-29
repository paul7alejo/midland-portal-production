# Phase 2D — Live Demo Runbook

Prepared by: Paul Alejo / OneOfZero
Date: 30 May 2026
Branch: phase-2a-admin-ops
Audience: Paul running a Midland stakeholder demo

Keep this document open on a second screen or printed. Work through it top to bottom.
Total demo time: approximately 25–30 minutes including discussion.

---

## 1. Demo objective

Show Midland that the full patient supply request lifecycle is working end-to-end in the portal
today — without custom code, phone calls, or manual emails from staff.

The key points to land:

1. A patient can request CPAP supplies through the portal without calling the clinic.
2. Staff see all requests in one organised queue and can action them with a single click.
3. The patient sees a clear, honest status at every stage — no guessing, no "did you receive my request?" phone calls.
4. Every action is recorded in a full audit trail tied to the patient, the request, and the staff member.
5. When a request is complete, the patient can reorder without contacting the clinic again.

Do not oversell. This is not an AI workflow platform, a fulfilment system, or a payment product.
It is a clean, reliable staff work queue and a patient-facing status window that replaces a
spreadsheet and a phone.

---

## 2. Pre-demo setup

Complete this before the meeting starts. Allow 15–20 minutes.

### 2.1 Browser setup

- Open two browser windows side by side, or two separate browsers (Chrome + Safari, or normal + incognito).
  - **Left / Window A:** Patient portal — log in as the demo patient.
  - **Right / Window B:** Admin portal — log in as admin.
- Set both windows to a comfortable zoom level. 90% or 100% works well on a laptop screen shared via video call.
- Close any tabs you do not need. The screen should look clean when sharing.

### 2.2 Patient session

- Log in as the demo patient (`MS-749418` or the agreed demo account).
- Navigate to the patient dashboard: `/portal/dashboard`
- Confirm the patient name, equipment summary, and status bar are visible.
- Navigate to `/portal/reorder`
- Confirm the supply request form is showing — meaning there is no active blocking request.
  - If a previous demo request is still showing as Reviewing, Approved, etc., switch to the admin
    window and set it to Delivered or Declined to clear the block before the demo starts.
  - If the request is in Delivered state, the form will already be available.

### 2.3 Admin session

- Log in as admin at `/admin`
- Navigate to `/admin/orders`
- Confirm the Active tab is selected and the queue loads.
- Confirm the demo patient's MSID does not have a blocking active request in the queue.
  If one exists from a previous session, set it to Delivered now so the demo starts clean.

### 2.4 Known good state before demo begins

| Check | Expected state |
|-------|---------------|
| Patient dashboard loads | ✓ Name, equipment summary, status bar visible |
| Patient reorder page | ✓ Form is visible (no active blocking request) |
| Admin Orders — Active tab | ✓ Queue loads, no old demo request blocking |
| Admin Audit Log | ✓ /admin/audit loads, recent events visible |

If any of these fail, see Section 10 (fallback talking points) before trying to fix live.

---

## 3. Accounts and URLs to prepare

| What | Detail |
|------|--------|
| Demo patient login | Email and password for `MS-749418` (or agreed demo account) |
| Admin login | `admin@midlandsleep.co.nz` credentials |
| Patient portal URL | `[deployed Amplify URL]/login` |
| Admin portal URL | `[deployed Amplify URL]/admin` |
| Patient dashboard | `/portal/dashboard` |
| Patient requests | `/portal/reorder` |
| Admin Orders | `/admin/orders` |
| Admin Audit Log | `/admin/audit` |

Fill in the deployed Amplify URL before the meeting. Keep credentials in a password manager,
not on a sticky note visible during screen share.

---

## 4. Demo script — patient side

### Step 4.1 — Patient dashboard

**Show:** Patient portal dashboard at `/portal/dashboard`

**Say:**
> "This is what your patient sees when they log in. Their name, their CPAP device, their current
> mask, and a status bar at the top that tells them where things stand with the clinic.
> They don't need to call to know if their request has been received — it's right here."

**Point out:**
- Patient name and MSID in the header or sidebar
- Equipment summary (device and mask listed)
- The supply request status area (if a previous request exists, note the status)

---

### Step 4.2 — Patient submits a supply request

**Navigate to:** `/portal/reorder`

**Say:**
> "When a patient needs CPAP supplies, they come here. They can select the items they need,
> confirm where to send them, and submit. No phone call required."

**Do:**
1. Select one or two items from the checkboxes (e.g. mask cushion, filters)
2. Confirm the delivery address is pre-filled or fill it in if prompted
3. Select a contact preference (email or phone)
4. Click Submit

**Say after submit:**
> "The patient immediately sees a confirmation with a reference number — REQ-[patient MSID]-A.
> They know it was received. The form disappears and this status card takes its place."

**Point out:**
- The reference number on the confirmation card
- The status message: "Midland Sleep is reviewing your request"
- The submit form is no longer visible — the patient cannot send duplicate requests

---

### Step 4.3 — Patient sees status update (return to after admin step 5.2)

**Navigate back to:** `/portal/reorder` (refresh)

**Say:**
> "After [the admin action you just showed], the patient refreshes their portal and sees this."

**Point out the updated status message.** Match the copy to the admin status you just set:
- Approved → *"Your request has been approved. Our team will prepare your items."*
- Sent → *"Your supplies have been dispatched. Please allow 2–3 business days for delivery."*

---

### Step 4.4 — Patient sees Delivered and can reorder

**Trigger after admin marks Delivered in Step 5.4**

**Navigate to:** `/portal/reorder` (refresh)

**Say:**
> "Once staff mark the request as Delivered, the patient sees this completion message.
> And — importantly — the request form reappears. They can submit another request for their next
> supply cycle without calling the clinic."

**Point out:**
- "Your supply request is complete" heading
- The new request form visible below the completed status card

---

## 5. Demo script — admin side

### Step 5.1 — Admin Orders queue

**Navigate to:** `/admin/orders` — Active tab (default)

**Say:**
> "On the staff side, every patient supply request lands in this queue. The Active tab shows
> everything that needs attention — New, Reviewing, Approved, Sent, or Needs Follow-Up.
> Completed requests — Delivered and Declined — are in the Completed tab so they don't
> clutter the working view."

**Point out:**
- The Active / Completed / All tab bar
- The new request that just arrived from the patient (Step 4.2)
- The reference number, patient name, items summary, and source badge (Portal)
- The KPI cards at the top showing counts per status
- The Filter & Sort button (mention, no need to demo in detail)

---

### Step 5.2 — Admin reviews the request and opens the patient drawer

**Point to the new request row**

**Say:**
> "Staff can see the request summary right in the row. But they can also open the full patient
> record without leaving this page."

**Do:** Click "View patient" on the request row to open the patient drawer.

**Say:**
> "This drawer pulls up the patient's record — their device, their mask, their import history.
> Everything staff need to make a decision is in one place. No switching between screens."

**Point out:**
- Patient name, MSID, device, mask details in the drawer
- Close the drawer when done

**Now update the status:**

**Do:** Change the status dropdown on the request row from New → Reviewing

**Say:**
> "One click to change the status. The change saves immediately and is recorded in the audit trail."

Wait a moment, then:

**Do:** Change Reviewing → Approved

**Say:**
> "Approved. The patient will see this when they next check their portal."

*(Switch to patient window for Step 4.3 here, then return)*

---

### Step 5.3 — Admin advances to Sent

**Do:** Change Approved → Sent

**Say:**
> "When staff have confirmed the supplies are on their way, they mark it Sent. The patient
> immediately sees updated copy on their portal: their supplies are dispatched."

*(Optional: switch to patient window to show the Sent copy, then return)*

---

### Step 5.4 — Admin marks Delivered; request moves to Completed tab

**Do:** Change Sent → Delivered

**Say:**
> "Once staff know the patient has received their supplies, they mark it Delivered. Watch what
> happens to the request."

**Point out:**
- The request disappears from the Active tab
- Switch to Completed tab and show the request is now there
- Switch back to All tab to show it appears in the full history

**Say:**
> "The request doesn't disappear — it moves to Completed. Staff have a permanent record.
> Active keeps the working queue clean."

*(Switch to patient window for Step 4.4 here, then return)*

---

### Step 5.5 — Funding review flag (optional, if time permits)

**Point to the "Flag funding" button on any request row**

**Say:**
> "There's one more tool here for staff. If a request needs a second look before you commit —
> maybe the patient's entitlement is close to the limit — staff can flag it for funding review.
> It puts an amber indicator on the row. The patient's status doesn't change. It's an internal
> note for the team."

*(No need to demonstrate live unless Midland asks)*

---

## 6. Audit proof script

**Navigate to:** `/admin/audit`

**Say:**
> "Everything we just did — every status change — is in this audit trail.
> Each row shows who made the change, which patient it was, what the status was before,
> and what it changed to. The timestamp is there too."

**Do:** Filter or scroll to find the `REQUEST_STATUS_UPDATED` events for the demo request.

**Point out the event detail for one row:**
- admin email
- patient MSID
- previous status
- new status
- result: success
- timestamp

**Say:**
> "This is not just a log. If there's ever a question about what happened to a patient's request —
> when it was approved, which staff member actioned it — it's all here. No guesswork."

**Optional: point out the `REQUEST_CREATED` event**

**Say:**
> "The patient's submission is logged too — when it was created, which patient, which items.
> The full chain is recorded from the moment the patient submits to the moment staff mark it delivered."

---

## 7. What to say about known limitations

Say these things yourself, before Midland notices them. It builds trust.

---

**"The patient has to refresh their portal to see a status update."**

> "One thing that isn't live yet: when you change a status, the patient doesn't get an automatic
> notification. They'd need to check back in to see the update. That's what Phase 2E is —
> a scheduled email that goes out 30 minutes after you change the status. We've designed the whole
> thing but we want your sign-off on a few decisions before we build it."

*(Leads directly into the Phase 2E conversation — Section 8)*

---

**"There's no inventory or stock control."**

> "The system records that you approved and dispatched the request, but it doesn't connect to
> your stock. Picking and packing is still done through your normal process. This is your
> request workflow and audit trail — not a warehouse system."

---

**"No payment is taken through the portal."**

> "There's no checkout here. If there's a patient co-payment, that's handled the same way it
> always has been. We haven't connected a payment gateway yet — that's Phase 3 scope."

---

**"Entitlement isn't being deducted."**

> "The estimate fields in the admin view — the funded amount, co-pay — are for staff reference
> only at this stage. Nothing is actually being taken from the patient's ACC/PHO entitlement
> balance. Automatic entitlement tracking is Phase 3."

---

**"Some earlier test requests show as 'Legacy request' in the reference column."**

> "There are a few requests in the system from earlier testing that predate the reference number
> format. They'll show as 'Legacy request'. Once you're in production, everything new will have
> a proper reference number. The old ones can be cleaned up."

---

## 8. What to say about Phase 2E delayed notifications

Use this after covering the "patient has to refresh" limitation (Section 7).

---

**The core pitch — one paragraph:**

> "We've designed the notification system and written the full spec. Here's how it works:
> when you change a request status to Approved, Sent, Declined, or Needs Follow-Up, the system
> schedules an email to the patient — but it waits 30 minutes before sending. That gives any
> staff member time to fix an accidental change before the patient hears about it. If you
> update the status again in that window, the original email is cancelled and a new one is
> scheduled for the latest status. Only the final state sends."

---

**What the email says:**

> "The emails are plain and practical. Approved: 'Your supply request has been approved — our
> team will prepare your items.' Sent: 'Your supplies are on the way — allow 2–3 business days.'
> Declined: 'We weren't able to approve this through the portal — please call us.' Needs Follow-Up:
> 'Our team needs to follow up with you — please contact us.' No dollar amounts, no clinical
> promises, no internal admin detail."

---

**What we haven't built yet, and why we're stopping to ask:**

> "We haven't written a line of code for this yet. Before we do, we need a few decisions from
> you — things that you're the right person to decide, not us. The most important one is a
> legal question: sending status update emails to patients counts as transactional communication
> under the NZ Unsolicited Electronic Messages Act, and you should be comfortable that's correct
> for your patient relationship. We think it clearly is, but you should confirm it."

---

**Estimated timeline once decisions are made:**

> "Once we have your answers, the build is about three to four days of focused work.
> The longest lead time is actually on the AWS side — verifying your sending domain takes
> 24 to 48 hours. We'd recommend starting that in parallel the moment you confirm which
> email address you want to send from."

---

## 9. Decisions to ask Midland for

At the end of the demo, work through these. Most can be answered in the meeting.
Full context is in `midland-os/02-product/phase-2e-release-gate.md`.

---

**D1 — Delay window:**
> "How long should staff have to correct a status change before the patient is emailed?
> We've proposed 30 minutes. That's generally enough time to catch a mistake in the queue.
> Is 30 minutes right, or would you prefer shorter or longer?"

---

**D2 — Sending address:**
> "What address do you want emails to come from? Options are something like
> `noreply@midlandsleep.co.nz` or `hello@midlandsleep.co.nz`. `noreply` is conventional
> for status updates; `hello` is warmer. Either works — it's your brand, your call."

---

**D3 — Reply-to address:**
> "If a patient replies to the notification email, where should it land?
> Your shared inbox, or a dedicated address?"

---

**D4 — Patient email storage:**
> "When a patient submits a request, we'd capture their email address from their login
> session and store it on the request record. That's the simplest way to know where to
> send the notification later. Are you comfortable with that?"

---

**D5 — Test walkthrough participant:**
> "Before we turn notifications on in production, we'd do a test walkthrough with a
> short delay — one minute instead of 30 — so you can see the full flow with your own eyes.
> Who from your team should be there for that?"

---

**D6 — Failure owner:**
> "Occasionally an email won't send — wrong address, provider issue, whatever. When that
> happens, the audit log will flag it. Who on your team should be the person who checks
> the audit log for failed notifications and follows up manually?"

---

**D7 — NZ Spam Act (most important):**
> "The NZ Unsolicited Electronic Messages Act covers commercial messages, not transactional
> ones. A status update saying 'your request has been approved' should clearly fall under
> transactional. But you or your legal adviser should confirm you're comfortable with that
> position before we go live. This isn't something we can confirm on your behalf."

*(If Midland wants to proceed, note the answer. If they want to check first, that's fine — it won't hold up any of the other build work.)*

---

**D8 — Email provider:**
> "We'd use AWS SES — Amazon's email sending service — because you're already hosted on AWS
> and it keeps everything in one place. The cost is negligible at your volume. Is there any
> reason to use a different provider?"

---

## 10. If something fails during demo — fallback talking points

Do not apologise excessively or fill silence with technical explanation. Pick the relevant
fallback and keep the conversation moving.

---

**Patient portal won't load / shows an error:**

> "We're on a development branch today — this is the working environment before it merges
> to production. [Pause, try a refresh.] While that loads, let me show you the admin side —
> it tells the same story from the other direction."

Move to the admin Orders view and continue the demo from there. Return to the patient view
when it recovers.

---

**Admin Orders won't load / returns an error:**

> "Let me show you the patient side first while we sort this out."

Flip windows. Continue with the patient portal. If Orders recovers, come back to it.

---

**Status change doesn't save / shows an error:**

> "Occasionally the dev environment needs a moment — this wouldn't happen in production on
> a dedicated branch. Let me show you the audit trail instead, which I prepared earlier,
> so you can see what the record looks like when it does save correctly."

Navigate to `/admin/audit` and walk through the audit proof using previously recorded events.

---

**Patient status copy doesn't update after admin change:**

> "The patient portal requires a manual refresh to pick up the latest status — that's actually
> the exact limitation I was going to mention: this is what Phase 2E fixes. The status is
> correct in the database right now, it's just waiting for the patient to refresh. Let me
> reload and show you."

Reload the patient window. If the status still doesn't update, it is likely a caching issue
on the dev environment. Say so directly and show the admin audit trail as proof the change
was recorded.

---

**Demo account is in a wrong state (request stuck mid-cycle):**

> "Let me just reset this request to the right starting point."

On the admin Orders view, change the status to Delivered to unblock the form, then move
to a clean request submission. Takes 15 seconds.

---

**Midland asks a question you can't answer on the spot:**

> "That's a good question and I want to give you an accurate answer — let me note it and
> send you a written response after the call. I'd rather do that than guess."

Write it down visibly. Send a follow-up within 24 hours.

---

**Midland raises a feature request during the demo:**

> "We can absolutely look at that. Let me capture it as a change request — we'll scope it
> separately so it doesn't affect what's already working. I don't want to promise something
> in a meeting that we haven't designed yet."

Do not commit to timeline or effort in the room.

---

*Prepared by OneOfZero for Midland Sleep Phase 2D stakeholder demo.*
*Questions: paul7alejo@gmail.com*
