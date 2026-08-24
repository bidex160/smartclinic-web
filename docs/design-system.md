# Design System Direction

## Experience principles

SmartClinic should feel calm, trustworthy, modern, and direct. The homepage should answer three questions quickly: what the health check is, what the user should do next, and why they can trust the process. **Book My Smart Health Check** is the dominant CTA; secondary capabilities belong in restrained navigation or supporting content.

Avoid clinical coldness, fear-based language, crowded dashboards, excessive gradients, stock-photo clichés, and unsupported health outcomes.

## Foundations

Define semantic Tailwind theme tokens rather than scattering raw color values and arbitrary dimensions:

- `primary`: the main healthcare brand/action color.
- `surface`, `surface-subtle`, and `background`: layered neutral surfaces.
- `text`, `text-muted`, and `border`: readable neutral roles.
- `success`, `warning`, and `danger`: status roles that always include text/icon cues.
- `focus`: a high-contrast, consistent focus ring.

The final palette and typography require brand assets and stakeholder approval. Any chosen text/background combination must meet WCAG 2.2 AA contrast. Body text should remain comfortably readable, with line lengths around 45–75 characters for longer content.

Use a small, consistent scale for spacing, radii, type, and elevation. Prefer whitespace and hierarchy over decorative chrome. Elevation should communicate layering, not make every card appear interactive.

## Core UI patterns

- Primary button: reserved for the main action in a view; full-width on narrow booking screens when helpful.
- Secondary and text buttons: visually quieter but still meet contrast and target-size requirements.
- Package card: semantic selectable control with package name, API-provided description/benefits/price where available, clear selected state, and no hidden clickable regions.
- Progress indicator: named steps and current position; it must not be the only way to understand the current page.
- Form field: persistent label, optional help text, accessible error text, and visible focus/error states.
- Alert/status: appropriate live-region behavior, concise recovery action, and no reliance on color.
- Summary group: term/value semantics with edit links returning to the relevant step.
- Skeleton/spinner: use sparingly, supply an accessible loading label, and prevent layout shift.

## Responsive strategy

Start with the smallest viewport and progressively enhance:

- Mobile: single-column content, clear step title, comfortable touch targets, and minimal nonessential navigation. Avoid sticky actions that obscure fields or errors.
- Tablet: increase content width and allow two-column catalogue cards when content remains scannable.
- Desktop: constrain reading/form width; use additional columns for catalogue or review summaries only when they improve comprehension.

Use content-driven breakpoints aligned with Tailwind defaults unless testing demonstrates a need to customize them. Do not encode separate mobile and desktop DOM trees when responsive CSS can express the layout.

Test at representative narrow, medium, wide, zoomed, and landscape sizes. Layout must tolerate longer API content, validation messages, enlarged text, and translated strings even if localization is not in the first release.

## Accessibility expectations

- Target WCAG 2.2 AA.
- Use landmarks (`header`, `nav`, `main`, `footer`) and one clear page-level heading.
- Use native buttons, links, fieldsets, legends, radio controls, and inputs before custom ARIA widgets.
- Provide accessible names and programmatic labels for every control.
- Make all interactions keyboard operable with logical focus order and visible focus indicators.
- On routed step changes, manage focus intentionally to the new page heading without surprising users.
- On validation failure, provide an error summary when useful and focus/announce the first invalid field appropriately.
- Use live regions selectively for asynchronous status; avoid repeated or noisy announcements.
- Maintain minimum usable target sizes and adequate spacing between adjacent controls.
- Respect `prefers-reduced-motion`; animation must not block progress or communicate essential meaning alone.
- Supply meaningful alternative text for informative imagery and empty alternatives for decorative imagery.

## Content and healthcare language

Use plain, reassuring language. Explain what happens next, how long a step may take when known, and which fields are required. Avoid diagnoses, guarantees, urgency cues without clinical basis, and claims that a package is suitable for a person unless the backend/product has an approved eligibility flow.

Do not present `ESSENTIAL`, `COMPLETE`, `PROVIDER_LOCATION`, or `HOME_VISIT` by transforming enum strings directly for final copy. Map backend codes to approved user-facing labels and descriptions while treating the API as the source of availability.
