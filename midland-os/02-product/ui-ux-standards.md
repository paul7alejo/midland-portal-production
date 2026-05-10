# UI / UX Standards

> Calm, clinical, simple. Not salesy. For older patients on phones and admin staff under time pressure.

## Brand

```text
Colours:
  Navy        #0B2A3C   headings, nav, primary buttons
  Deep Teal   #0B5C6C   CTAs, links, active states
  Seafoam     #74C0A2   success, "covered", patient price badge (Phase 2)
  Cream       #FDFCF5   page background
  Charcoal    #333333   body text
  Sand        #E6D3A3   borders, dividers
  Amber       #F59E0B   OVERDUE warnings ONLY (never decorative)

Typography:
  Headings    Cormorant Garamond  → Koru Sans when supplied
  Body        DM Sans             → Pūrere Sans when supplied
  Labels      DM Mono             portal IDs, prices, dates, status codes

NO:
  points-gold #D4A017
  red anywhere (clinical anxiety)
  any third colour family
```

## Patient-facing copy rules

```text
- Calm and clinical, never salesy.
- Plain English. Reading age ~10–12 (not patronising; clear).
- Avoid medical jargon unless followed by a plain explanation.
- Avoid time pressure language ("limited time", "act now") — never used.
- Avoid emojis except minimalist functional ones (✅ for "covered", ⚠️ for OVERDUE).
- Never imply urgency or guilt to drive a reorder.
- Acknowledge limitations honestly ("Your funded supplies have been used.
  Please call Midland.") rather than offering a discount workaround.
```

## Admin-facing copy rules

```text
- Direct, factual.
- Use the action verb first ("Approve", "Export", "Trigger backup").
- Show counts and timestamps in DM Mono so they line up.
- Distinguish read-only state from action UI (no fake buttons).
- Pending review / Reviewed / Action needed / Escalated — fixed labels, no synonyms.
- Errors: explain what failed, what to do next, never raw stack traces.
```

## Layout

```text
- One column on mobile, two on desktop where it adds clarity, never three.
- Generous whitespace between sections (min 24px).
- Form fields stacked, never side-by-side on mobile.
- Tap targets ≥ 44px.
- Cards have 16–24px padding, never tighter on patient pages.
- Tables collapse to cards on narrow screens.
```

## Forms & data collection (HIPC Rule 3)

```text
- Privacy notice ABOVE the form, before any field.
- Required fields marked with *.
- NHI field: explicit "we encrypt this" reassurance + masked rendering.
- Validation: inline, not modal. Don't block submission until field is touched.
- Submit button is single-action (no double-submit).
- Success state: clear confirmation, what happens next, contact path if needed.
```

## NHI display

```text
- Default state: ZZZ**** (4-letter, 4-asterisk)
- 30-second reveal in patient Profile only.
- Reveal countdown timer visible.
- Audit row PutItem BEFORE the value renders.
- Auto-hide after 30s; user must re-trigger to see again.
- Admin reveal in drawer requires written reason → audit before reveal.
- NHI must NEVER appear in URLs, alt text, or aria-labels.
```

## Status badges (consistent across portal)

```text
✅ Covered — $0.00          seafoam, Layer 1 entitlement at checkout
✅ CAN REORDER              seafoam, eligibility status
⏳ NOT YET                  amber-on-cream, eligibility deferred
⚠️ OVERDUE                  amber, safety check / water chamber overdue
ⓘ Imported                  navy outline, dataset provenance
🔒 Encrypted at rest        small DM Mono label near NHI

NO red badges anywhere.
NO "Hot deal" or "Save X%" badges.
```

## Buttons

```text
Primary    Navy fill, Cream text             "Submit reorder request"
Secondary  Deep Teal outline, Deep Teal text "Cancel"
Tertiary   text-only Deep Teal               "Need help?"
Destructive (admin only) Sand outline, Charcoal text  "Trigger backup (admin)"

Never:
  - bright red destructive buttons
  - shouty caps headlines
  - shadow-heavy floating CTAs
```

## Loading and empty states

```text
Loading    skeletons not spinners where possible; no animation that flashes
Empty      explain what would normally appear and what to do next
Error      explain what failed, what to try, contact path
```

## Mobile clarity (1F focus, stretch)

```text
- Test on iPhone SE width (320px effective) — must read cleanly
- Buttons reach thumb without stretching
- Forms vertically stacked
- No fixed-position elements that cover content
- Avoid hover-only affordances (assume touch)
```

## Things we never do

```text
- generated AI illustrations of patients or staff
- stock photos of "happy elderly people sleeping"
- emoji-heavy patient copy
- modals with "are you sure you don't want to keep shopping?" dark patterns
- countdowns / urgency timers
- discount banners on entitlement items
- carousel of products on the landing
- testimonials inline with patient workflows
```
