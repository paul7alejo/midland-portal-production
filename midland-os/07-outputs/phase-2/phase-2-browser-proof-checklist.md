# Phase 2 Browser Proof Checklist

Prepared by: OneOfZero / Paul Alejo
Date: 2026-06-19

This checklist covers manual browser verification for Patient Notices sprints 14C through 14F. Each item can be verified with a live patient portal account and an admin account with notice permissions.

Amplify proof jobs: 223 (14C), 224 (14D), 225 (14E), 226 (14F) — all SUCCEED.

---

## Sprint 14C — Patient portal notice display

Commit: `7acd962` | Amplify Job 223

### Top strip

- [ ] Admin publishes an All-patients / Top strip notice.
- [ ] Patient logs in to the desktop portal — the scrolling awareness bar appears in the header with the notice title and message.
- [ ] No active Top strip notice — the awareness bar area is hidden (not shown as blank or with fallback text).

### Dashboard card

- [ ] Admin publishes an All-patients / Dashboard card notice.
- [ ] Patient visits /portal/dashboard — a notice card appears above or within the main content.
- [ ] The card shows the notice title, message, and (if set) an expiry date.
- [ ] An expired notice does not appear.

### Notification bell

- [ ] Admin publishes an All-patients / Notification bell notice.
- [ ] Patient opens the bell dropdown — the clinic notice appears in the All tab.
- [ ] The Unread tab does not show clinic notices (only request-status notifications).
- [ ] The "Clinic notice" chip appears on the item.

### Notifications page

- [ ] Patient visits /portal/notifications — the clinic notice appears in the All tab.
- [ ] The "Clinic notice" chip appears on the card.
- [ ] Request-status notifications are not disrupted.

### Single-patient notice targeting

- [ ] Admin publishes a Single-patient notice targeting a test MSID.
- [ ] Patient with that MSID sees the notice.
- [ ] A different patient does not see the notice.

---

## Sprint 14D — Notice governance, audience tabs, duplicate protection

Commit: `3a0cf4c` | Amplify Job 224

### Audience tabs

- [ ] Admin Notices page shows three tabs: All patients, Single patient, Selected patients.
- [ ] Selected patients tab is visible but disabled (click does nothing or shows a coming soon message).
- [ ] Switching to All patients tab shows only all-patient notices.
- [ ] Switching to Single patient tab shows only single-patient notices.
- [ ] Tab count badges update to reflect the number of notices per audience type.

### Per-tab filters

- [ ] Status filter (All / Draft / Published / Expired / Archived) works within the active tab.
- [ ] Placement filter works within the active tab.
- [ ] Priority filter works within the active tab.
- [ ] Sort (Updated newest / Published newest / Priority) works within the active tab.
- [ ] Switching tabs resets all filters.

### Form defaults from active tab

- [ ] With All patients tab active, clicking + Create notice defaults the Audience field to All patients.
- [ ] With Single patient tab active, clicking + Create notice defaults the Audience field to Single patient and shows the MSID input.

### Duplicate publish protection

- [ ] Publish an All-patients / Top strip / Important notice.
- [ ] Try to publish a second All-patients / Top strip / Important notice — server returns a 409 with a human-readable conflict message.
- [ ] The message names the placement, priority, and schedule conflict.
- [ ] Expire the first notice, then publish the second — succeeds.
- [ ] Single-patient notices with the same placement and priority can both be published — no conflict check.

---

## Sprint 14E — MSID input normalisation and bell badge count

Commit: `a3670ba` | Amplify Job 225

### MSID normalisation

- [ ] Admin enters bare digits, e.g. \<TEST_MSID_DIGITS\> — the notice saves normalised to MS-\<TEST_MSID_DIGITS\>.
- [ ] Admin enters MS-\<TEST_MSID_DIGITS\> — saves correctly.
- [ ] Admin enters lowercase ms-\<TEST_MSID_DIGITS\> — normalises to MS-\<TEST_MSID_DIGITS\>.
- [ ] Admin enters an invalid value (e.g. letters, mixed format) — form shows a validation error and does not save.

### Bell badge with clinic notices

- [ ] When a Notification bell notice is published, the bell badge count reflects `request-status unread + clinic notice count`.
- [ ] Badge count is non-zero when the patient has unseen clinic notices, even if request notifications are all read.
- [ ] Badge count is zero when both are zero.

---

## Sprint 14F — Display polish and local seen state

Commit: `6b580f2` | Amplify Job 226

### Top strip — no hardcoded fallback

- [ ] No active Top strip notice: the awareness bar area in the desktop header is completely absent — no scrolling text, no "Care note" fallback.
- [ ] Active Top strip notice: the awareness bar appears with the notice title · message text.

### Priority visual treatment

**Dashboard card:**
- [ ] Important notice: red background tint, red left border, "Important" pill in red.
- [ ] Reminder notice: amber background tint, amber left border, "Reminder" pill in amber.
- [ ] Info notice: teal background tint, teal left border, "Info" pill in teal.

**Bell dropdown:**
- [ ] Clinic notice item shows a priority chip (Important / Reminder / Info) in the correct colour.
- [ ] "Clinic notice" label chip appears alongside the priority chip.

**Notifications page:**
- [ ] Clinic notice card has a priority-themed background (red / amber / teal).
- [ ] Priority chip appears before the "Clinic notice" label.

### Local seen state — badge clears after opening bell

- [ ] Patient has unseen clinic notices — bell badge shows count.
- [ ] Patient opens the bell — badge count drops by the number of clinic notices (they are now marked seen in localStorage).
- [ ] Patient closes and reopens the bell in the same browser session — clinic notice count in badge remains 0.
- [ ] Patient hard-refreshes the page — seen state is restored from localStorage; badge does not re-inflate for previously seen notices.
- [ ] Request-status unread count is unaffected by bell open/close (still server-side).

### Regression — existing notifications

- [ ] Supply request status notifications still appear in both All and Unread tabs.
- [ ] Marking a request notification as read still decrements the request-status unread count.
- [ ] Clicking a request notification still navigates to the supply request status anchor.
