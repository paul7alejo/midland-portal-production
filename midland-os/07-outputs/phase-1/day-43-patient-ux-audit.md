# Day 43 Patient UX Audit

## Scope

This audit reviewed the top five patient-facing screens for readability and clarity:

1. Dashboard - `/portal/dashboard`
2. My Equipment - `/portal/equipment`
3. Request Supplies - `/portal/reorder`
4. Maintenance - `/portal/maintenance`
5. My Profile - `/portal/profile`

Contact was also skimmed because it shares form and privacy patterns, but it is not ranked in the top five.

This is a documentation/UX audit only. No redesign or code change is claimed.

## Overall Findings

The portal is already using generally readable type sizes, clear card groupings, and 48px primary buttons in key workflows. The biggest UX risk is not visual polish; it is patient expectation management. Several screens use wording that could imply automation or future capability that is not fully in Phase 1.

Most patient value will come from clearer plain-English explanations, stronger missing-data states, and mobile-safe treatment of IDs/serials.

## Screen Audit

### 1. Dashboard

What works:

- Clear personalised greeting.
- Equipment, supplies, maintenance, and help are grouped into scannable cards.
- Primary supply action uses a large 48px button.
- Dates are readable NZ-style dates.

Issues:

- `My Equipment` uses `Device ID` while showing `serial_number`; this may confuse patients if staff refer to serial number.
- Missing device/mask values show `-`, which is technically compact but not patient-friendly.
- Maintenance status copy is helpful, but overdue/due statuses rely partly on colour and badges.
- Mobile layout is likely acceptable, but the two-column equipment grid could still feel dense when all fields are present.

Patient value ranking:

- High: replace `-` missing values with plain-English empty states.
- High: clarify serial number vs device ID wording.
- Medium: add brief explanation of what to do when equipment details look wrong.

### 2. My Equipment

What works:

- Page title and sections are clear.
- Machine and mask fields are grouped logically.
- `No machine on file` and `No mask on file` are better than fake fallbacks.
- Maintenance and previous-equipment placeholders are honest.

Issues:

- Dense inline `<dt>/<dd>` structure may scan poorly if long serial/model values are present.
- `No mask on file` is honest, but could be more helpful: tell patient to contact Midland if this seems wrong.
- Previous equipment placeholder may feel like an unfinished feature unless framed as future history.
- Product card clarity is adequate but could benefit from a short “Current records held by Midland Sleep” explanation.

Patient value ranking:

- High: add next-step copy for missing machine or mask records.
- Medium: ensure serial numbers wrap on mobile.
- Medium: make placeholder future-history copy less prominent than current equipment.

### 3. Request Supplies

What works:

- Page title is action-oriented.
- Privacy notice appears before delivery address collection.
- Supply cards are large and easy to tap.
- Eligible and not-yet-eligible items are separated.
- Submit button has a clear disabled state and 48px height.

Issues:

- Confirmation copy says “You will receive a confirmation at your email address,” but Phase 1 email flows are not in scope. This risks over-promising.
- `We will review your request and dispatch your supplies shortly` may imply fulfilment automation. Better: “Midland Sleep staff will review your request.”
- It is not obvious why the send button is disabled until the patient selects an item and enters address.
- Current mask is sourced from demo data in this page, which may not match the same live data source pattern as other pages.

Patient value ranking:

- Critical: remove or qualify email-confirmation promise unless email flow exists.
- High: make staff-review/manual fulfilment wording explicit.
- Medium: add short required-field hint near disabled submit.

### 4. Maintenance

What works:

- Clear title and explanatory subtitle.
- Maintenance cards explain safety checks and mask checks in plain English.
- Overdue states include direct call/email guidance.
- General CPAP maintenance explanation is useful.

Issues:

- “Nothing to do right now. We will remind you when this is due” may over-promise reminders if patient notification flows are not active.
- Maintenance dates are calculated from setup/fitted dates in UI; this may need clinical/ops confirmation before relying on it as advice.
- If no maintenance records exist, copy says only `No maintenance records on file` and gives no next step.
- Some wording edges toward care advice; should stay operational and refer to Midland staff.

Patient value ranking:

- Critical: avoid promising reminders unless reminder flow exists.
- High: add “Contact Midland if this looks wrong” for empty/uncertain maintenance states.
- Medium: make safety-check wording operational rather than clinical.

### 5. My Profile

What works:

- Clear title and privacy notice.
- NHI reveal is time-limited and explains that access is logged.
- Portal ID card is visually distinct and useful for support calls.
- Buttons are large enough for key actions.

Issues:

- NHI fallback displays `ZZZ****`; this looks like a fake/example NHI and could confuse patients if the real value is unavailable.
- Error copy says “In production, your encrypted NHI will appear here,” which is technically wrong for patient language; patients should not see “encrypted NHI.”
- Notification preference toggles look visually enabled/on while labelled `Coming soon`; this could confuse patients.
- Profile page contains future preference UI without an active workflow.

Patient value ranking:

- Critical: replace demo/technical NHI wording with patient-safe plain English.
- High: make coming-soon notification preferences clearly non-interactive, or hide until supported.
- Medium: clarify that Portal ID is for contacting Midland Sleep.

## Ranked Fixes By Patient Value

1. Request Supplies: remove email-confirmation promise unless the email flow is active.
2. Maintenance: remove reminder promise unless reminder notifications are active.
3. Profile: replace `encrypted NHI` and `ZZZ****` demo language with patient-safe copy.
4. Dashboard/Equipment: replace `-` missing values with plain-English missing-data states.
5. Equipment/Dashboard: clarify serial number vs device ID wording.
6. Profile: make notification preferences visibly disabled or defer them until supported.
7. Reorder: explain disabled submit requirements near the button.
8. Equipment: add next-step text when no machine or mask is on file.
9. Dashboard/Maintenance: ensure overdue/OK states use text plus colour, not colour alone.
10. All portal pages: check long serials, IDs, and emails wrap cleanly on mobile.

## Recommended Day 44+ Small Fix Set

If a small patient UX pass is approved later, the safest high-value edits are:

- update over-promising copy in Request Supplies and Maintenance
- improve NHI unavailable/reveal copy in Profile
- improve missing-data messages for equipment and mask records
- clarify serial number/device ID labels
- make coming-soon notification preferences less interactive-looking

These are display/copy improvements only. They should not add backend behaviour, emails, fulfilment, inventory, or clinical logic.

## Scope Boundary

This audit does not claim:

- a redesign was completed
- mobile screenshots were verified
- clinical wording was approved
- email reminders exist
- fulfilment automation exists
- checkout, inventory, or patient invite flows exist

It documents the top patient-facing readability and clarity issues so Midland can prioritise a safe UX polish pass.
