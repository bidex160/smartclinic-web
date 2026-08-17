# SmartClinic Web Engineering Guide

## Repository scope

- This repository contains only the SmartClinic frontend. The backend lives in the separate `smartclinic-api` repository.
- Do not turn the repositories into a monorepo, copy backend code into this repository, or modify the backend while working here.
- Keep backend contracts and frontend representations distinct. The API remains the source of truth for catalogue availability, fulfilment options, validation, pricing, booking creation, and booking status.

## Product priority

- The primary public action is **Book My Smart Health Check**.
- Preserve the core journey: home, package selection, fulfilment selection, participant and booking details, review, submission, and booking confirmation.
- Keep secondary platform capabilities visually subordinate to the booking action.
- Build a trustworthy, simple, accessible, healthcare-focused, mobile-first experience. Do not make unsupported medical or regulatory claims.

## Technology and Angular conventions

- Use the latest appropriate stable Angular version selected when the application is initialized; record the chosen version and rationale in the setup change.
- Use TypeScript, standalone components, Angular Router, `HttpClient`, Reactive Forms, Angular Signals, and Tailwind CSS.
- Prefer modern template control flow: `@if`, `@for`, and `@switch`. Do not introduce `*ngIf`, `*ngFor`, or legacy `ngSwitch` where modern control flow applies.
- Prefer signals for local and feature UI state, `computed()` for derived state, and `effect()` only for genuine imperative synchronization with an external system. Do not use effects to derive state.
- Do not introduce NgRx initially. Add state libraries only after demonstrated cross-feature complexity.
- Keep components focused. Split the booking flow by route step and responsibility; do not build one giant wizard component.
- Use Reactive Forms for user input. Keep form models, API transport models, and display/view models separate when their shapes or responsibilities differ.
- Avoid speculative layers, generic repositories, empty directories, placeholder services, and abstractions with only one trivial consumer.

## Proposed source organization

Use this structure as features are implemented, creating files and directories only when needed:

```text
src/app/
├── core/
│   ├── config/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── shared/
│   └── components/
├── features/
│   ├── home/
│   ├── health-check/
│   └── booking/
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

- `core/` is for singleton configuration, cross-cutting HTTP behavior, shared API contracts, and domain API services.
- `shared/` is for reusable presentational components with no feature ownership.
- `features/` owns route-level UI, feature-specific state, forms, and components.
- Prefer lazy-loaded route components or feature route definitions at feature boundaries.

## API integration

- Read the API base URL from environment/runtime configuration. Never scatter development URLs through components or services.
- Components must not call `HttpClient` directly when a domain API service is appropriate.
- Type request and response payloads. Do not use `any` for API data.
- Consume these backend endpoints: `GET /api/v1/health-check-packages`, `POST /api/v1/bookings`, and `GET /api/v1/bookings/:reference`.
- Treat package codes such as `ESSENTIAL` and `COMPLETE`, and fulfilment modes such as `PROVIDER_LOCATION` and `HOME_VISIT`, as backend-provided catalogue data. Codes may be typed as known values for safe display mapping, but availability must not be hardcoded as frontend state.
- Do not reproduce backend pricing, eligibility, scheduling, availability, booking-reference generation, or validation rules. Frontend validation should improve input quality and usability without pretending to be authoritative.
- Normalize HTTP errors in one cross-cutting place only when it produces a meaningful consistent contract. Preserve field-level errors where the API supplies them.

## UI, accessibility, and responsive behavior

- Start with semantic HTML and a sensible heading hierarchy.
- Every input needs an associated label, useful instructions, and an accessible error message.
- All interactive controls must be keyboard accessible and have visible focus states.
- Do not rely on color alone to communicate selection, status, or error state.
- Design mobile-first, then enhance layouts at tablet and desktop widths. Booking steps should remain linear and easy to scan on small screens.
- Use shared design tokens for color, typography, spacing, radius, elevation, and focus styling. Meet WCAG 2.2 AA as the baseline target.
- Respect reduced-motion preferences and avoid unnecessary animation.

## Health data, privacy, and security

- Collect only information required by the booking contract and disclose why it is needed.
- Never store sensitive health or participant information in `localStorage`, `sessionStorage`, URLs, analytics payloads, logs, or error-reporting breadcrumbs.
- Keep in-progress sensitive form state in memory. A page refresh may intentionally clear it unless a secure, product-approved recovery mechanism is implemented.
- Do not expose sensitive details on confirmation or lookup screens without an appropriate backend authorization/verification design.
- Do not render backend-provided content as trusted HTML.
- Do not claim HIPAA, GDPR, NDPR, or other regulatory compliance unless it has been verified and implemented across the system.

## Quality expectations

- Add focused unit tests for state transitions, mapping, validation behavior, and error handling; add route-level or end-to-end coverage for the primary booking path when the test stack exists.
- Test responsive behavior and keyboard navigation at each completed feature.
- Keep loading, empty, error, success, and retry states explicit.
- Prevent duplicate submissions and clearly distinguish recoverable errors from final outcomes.
- Run the repository's formatting, linting, test, and build commands before handing off code once those commands exist.
- Do not commit or push unless the user explicitly requests it.

## Documentation

- Keep `docs/` aligned with implemented behavior and API contracts.
- Record material architectural decisions and unresolved contract assumptions instead of silently hardcoding them.

