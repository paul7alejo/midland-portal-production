# UI / UX Standards

## Purpose

These standards guide patient-facing Midland Sleep portal screens. They are practical checks for readability, clarity, and safe patient communication. They are not a redesign brief.

## Patient-Facing Principles

- Use plain English before internal terminology.
- Explain what the patient can do now and what Midland staff will handle.
- Avoid implying automation that does not exist yet.
- Avoid clinical advice unless Midland has explicitly approved the wording.
- Make missing data clear rather than hiding it with a fake default.
- Keep NHI and privacy messaging calm, short, and explicit.

## Type and Hierarchy

Recommended minimums:

- Page title: 30-34px desktop, no smaller than 28px mobile.
- Section heading: 20-22px.
- Body text: 16px minimum.
- Supporting/help text: 14px minimum, used sparingly.
- Form labels: 16px minimum.
- Avoid long all-caps labels for patient-critical information.

Hierarchy:

1. One clear page title.
2. Short explanatory line under the page title when the action is not obvious.
3. Section headings that describe the task, not the data model.
4. Labels and values grouped so patients can scan quickly.

## Contrast and Colour

- Body text should use strong charcoal/navy tones, not low-opacity grey on pale backgrounds.
- Warning or overdue states should not rely on colour alone; include plain text such as `Overdue` or `Call Midland Sleep`.
- Links should remain visibly distinct from body text.
- Disabled states must still be readable.

## Spacing and Layout

- Keep card padding at least 16px mobile and 24px desktop.
- Keep at least 12px between related rows and 24px between major sections.
- Avoid dense two-column layouts on mobile.
- Long IDs, serials, and email addresses must wrap cleanly.
- Cards should not become a wall of equal-weight information; make the next action obvious.

## Tap Targets and Forms

- Buttons and key interactive controls should be at least 44px high.
- Selects, textareas, and inputs should be at least 44px high.
- Entire selectable supply cards should remain easy to tap.
- Buttons should state the action clearly: `Send request`, `Reveal NHI`, `Copy to clipboard`.
- If a button is disabled, the reason should be obvious from nearby text or required fields.

## Machine and Product Card Clarity

Machine cards should show:

- brand
- model/name
- serial number
- setup/issued date
- funded by, where relevant

Mask cards should show:

- brand
- model/name
- type
- size
- fitted/last-issued date

If data is missing, prefer plain wording such as `No mask on file` or `No mask record imported`. Do not invent default mask, machine, or supply information.

Supply cards should show:

- item name
- short description
- availability
- next eligible date when unavailable

## Mobile Layout

- Patient pages must work as a single-column flow on mobile.
- Primary actions should appear near the relevant explanation.
- Important status labels should not overflow or compress surrounding text.
- Header/account information should not crowd page content.
- Side navigation can collapse or be hidden, but the patient must still understand where they are.

## Privacy and Safety Copy

- Privacy notices should appear before collecting patient-entered information.
- NHI reveal should explain that access is logged and time-limited.
- Contact and supply request forms should not promise email or dispatch automation unless it exists.
- Use `Midland Sleep staff will review...` when the workflow is manual or staff-mediated.

## Review Checklist

For each patient-facing screen, check:

1. Is the page title clear?
2. Is the main action obvious?
3. Are font sizes readable on mobile?
4. Is contrast strong enough?
5. Are tap targets at least 44px?
6. Are machine/product cards understandable without staff knowledge?
7. Is missing data honest?
8. Does the copy avoid over-promising automation?
9. Does the mobile layout scan in one column?
10. Are privacy/NHI messages clear and safe?
