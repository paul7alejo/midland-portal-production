# Phase 2 Demo Script

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-19
Audience: Midland Sleep staff and stakeholders
Duration: approximately 25–35 minutes

---

## Before the demo

- Open the admin portal in one browser tab (signed in as an admin account).
- Open the patient portal in a second browser tab (signed in as a test patient account).
- Confirm a test patient MSID is ready (e.g. a non-production patient record).
- Confirm no conflicting published notice exists for the test placement/priority combination — expire or archive any that do.

---

## 1. Admin login

**Show:** Admin login page at `/admin/login`.

**Say:** "Staff log in with their Cognito credentials. The system verifies their role server-side on every request — there is no client-side trust."

---

## 2. Operations overview

**Navigate to:** Admin Orders page.

**Show:**
- Three tabs: Active, Completed, All.
- KPI cards (count per status).
- Inline status dropdown on a request row.
- PatientDrawer — click any row to open it.

**Say:** "This is the supply request command centre. Every patient submission lands here. Staff can action requests, check patient records, and change status — all in one place without navigating away."

**Show (briefly):**
- Filter and Sort drawer.
- Download Report drawer — show the metric summary section. Do not click Generate Report on live patient data during the demo unless using a test account.

---

## 3. Patient Notices — admin view

**Navigate to:** Admin → Notices.

**Show:**
- Three audience tabs: All patients, Single patient, Selected patients (disabled, coming soon label).
- KPI cards (Draft, Published, Inactive).
- Filter bar (Status, Placement, Priority, Sort).

**Say:** "Notices is the clinic's broadcast channel into the patient portal. Admins create notices from this page. There are three audience types, three placements, and three priority levels. The Selected patients tab is coming in a future phase."

---

## 4. All-patient notice — create and publish

**Action:** Click + Create notice.

**Fill in:**
- Title: e.g. "Mask cushion recall"
- Message: e.g. "A small batch of cushions shipped in May may have a manufacturing defect. Contact us if you are affected."
- Audience: All patients
- Placement: Dashboard card
- Priority: Important
- Leave schedule blank (effective immediately).

**Click:** Save draft. Show the new draft row in the table.

**Click:** Publish. Show the notice status change to Published.

**Say:** "The notice is now live. Every authenticated patient will see this on their dashboard."

---

## 5. Duplicate protection

**Action:** Try to publish a second draft notice with the same audience (All patients), placement (Dashboard card), and priority (Important).

**Show:** The server returns a conflict error — "An all-patient dashboard card important notice already overlaps this schedule."

**Say:** "The system prevents accidental double-publishing. You need to expire or reschedule the existing notice before another one with the same placement, priority, and active window can go live. This keeps the portal unambiguous for patients."

---

## 6. Single-patient notice

**Action:** Click + Create notice.

**Fill in:**
- Title: e.g. "Device calibration reminder"
- Message: e.g. "Your device is due for a calibration check. Please contact the clinic."
- Audience: Single patient
- MSID: enter a non-production test MSID as bare digits, e.g. \<TEST_MSID_DIGITS\>.
- Placement: Notification bell
- Priority: Reminder

**Click:** Save draft, then Publish.

**Say:** "The MSID field accepts plain digits or the MS-prefixed format — the system normalises both bare digits and prefixed input to MS-\<TEST_MSID_DIGITS\> before saving. This notice will appear only in that patient's bell and notifications page."

---

## 7. Patient portal — dashboard

**Switch to:** Patient portal tab.

**Navigate to:** Dashboard.

**Show:**
- The Important / Dashboard card notice appears with a red priority pill ("Important") and amber/red styling.
- If a Top strip notice is published, show the scrolling awareness bar in the desktop header.
- If no Top strip notice is published, note that the strip area is hidden entirely — no fallback copy.

**Say:** "Patients see the notice immediately on their next page load. The priority pill makes it visually clear whether this is routine information, a reminder, or something important."

---

## 8. Bell badge and notification bell

**Show:**
- The bell button in the portal header has a badge showing the total count (unread request notifications + unseen clinic notices).

**Click the bell:**
- Show the clinic notice item with the priority chip and "Clinic notice" label.
- Show request-status notifications alongside.

**Close and reopen the bell.**

**Show:** The clinic notice badge count has dropped to zero after the first open (seen state stored in the browser).

**Say:** "The badge clears when the patient opens the bell. This is browser-local state — no server round-trip required for dismiss. The read state for supply request notifications still operates server-side as before."

---

## 9. Notifications page

**Navigate to:** /portal/notifications.

**Show:** All tab with the clinic notice card — priority chip, "Clinic notice" label, and priority-themed background.

**Say:** "The full notifications page shows the same content as the bell dropdown. Clinic notices are clearly distinguished from supply request status updates by their label and colour."

---

## 10. Next phase explanation

**Say:** "Phase 2 closes out the admin operations and patient communication infrastructure. The portal now has a complete request workflow, a patient communication system, and a notice governance layer.

Phase 3 will build the patient-facing product catalogue and entitlement-aware request form — moving the portal toward self-service supply ordering. We'd recommend a walkthrough with staff first to collect feedback before scoping Phase 3."

See `phase-2-support-and-next-phase.md` for the recommended Phase 3 and 4 roadmap.

---

## Demo reset checklist

After the demo, clean up test notices:

- [ ] Expire or archive the test all-patient Dashboard card notice.
- [ ] Archive the test single-patient Notification bell notice.
- [ ] Confirm no test drafts remain in Published state.
