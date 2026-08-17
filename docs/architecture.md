# Frontend Architecture

## Goals

The architecture should make the primary booking path easy to change, test, and understand without introducing framework layers before they are needed. Angular feature boundaries follow user-facing capabilities; shared and core code exist only for genuinely cross-cutting concerns.

## Proposed source structure

```text
src/app/
├── core/
│   ├── config/          # Typed runtime/environment configuration and injection tokens
│   ├── interceptors/    # Cross-cutting HTTP concerns when justified
│   ├── models/          # Shared API contracts and domain primitives
│   └── services/        # Domain API clients such as packages and bookings
├── shared/
│   └── components/      # Reusable presentational UI with no feature ownership
├── features/
│   ├── home/            # Landing page and primary CTA
│   ├── health-check/    # Catalogue/package selection UI
│   └── booking/         # Booking shell, steps, confirmation, and lookup
├── app.component.ts     # Application shell and router outlet
├── app.config.ts        # Providers, router, HTTP, and global application setup
└── app.routes.ts        # Top-level route map
```

Directories should be added as real code requires them. This is a boundary map, not a requirement to create empty boilerplate.

## Angular conventions

- Build with standalone components and functional providers.
- Lazy-load route-level components or feature route arrays where it creates a clear feature boundary.
- Use `ChangeDetectionStrategy.OnPush` unless a future Angular version makes equivalent behavior implicit.
- Use `inject()` where it keeps construction concise; constructor injection remains acceptable when clearer.
- Use modern control flow (`@if`, `@for`, `@switch`) and track stable identifiers in loops.
- Use Reactive Forms for booking input and typed forms where Angular supports them.
- Keep templates declarative. Move nontrivial mapping, orchestration, and API interaction out of templates.
- Avoid barrel files until they demonstrably simplify stable public boundaries.

The foundation was initialized on Angular 21.2 using the latest stable patch releases resolved by the current Angular CLI and pinned through `package-lock.json`. This choice keeps the project on the CLI's current stable standalone application architecture while preserving reproducible installs.

## State and Signals

Signals are the default for synchronous UI and feature state:

```ts
loading = signal(false);
packages = signal<HealthCheckPackage[]>([]);
selectedPackage = signal<HealthCheckPackage | null>(null);
canContinue = computed(() => this.selectedPackage() !== null);
```

Guidelines:

- Keep state as close as possible to its owners.
- Use `computed()` for derived values; never manually synchronize values that can be derived.
- Use `effect()` only for imperative synchronization such as analytics, browser APIs, or a non-signal external system. Effects must have a clear cleanup/lifecycle story.
- Convert `HttpClient` observables at the feature boundary when signals improve template state, while retaining observable cancellation/composition where useful.
- Do not put ephemeral sensitive booking data in browser persistence.
- A small feature-scoped booking state service is justified when routed steps need to share in-memory draft state. It should not become a global catch-all store.
- Do not introduce NgRx until there is proven complex, cross-feature state with requirements such as event replay or advanced effects.

## Component boundaries

Route components orchestrate data and navigation. Step/form components own presentation and typed form behavior. Shared components are visually reusable and domain-light.

Proposed booking boundary:

```text
BookingShellComponent
├── BookingProgressComponent
├── PackageSelectionPageComponent
│   └── HealthCheckPackageCardComponent
├── FulfilmentSelectionPageComponent
│   └── FulfilmentModeCardComponent
├── BookingDetailsPageComponent
│   ├── ParticipantDetailsFormComponent
│   └── BookingContactFormComponent
├── BookingReviewPageComponent
│   └── BookingSummaryComponent
└── BookingConfirmationPageComponent
```

Names are proposals, not boilerplate requirements. For example, separate participant and contact forms only if the confirmed API contract and UX make that separation useful.

## Routing

Proposed public routes:

| Route                           | Responsibility                                                              |
| ------------------------------- | --------------------------------------------------------------------------- |
| `/`                             | Focused home page with the primary booking CTA                              |
| `/health-check/packages`        | Fetch and select an available package                                       |
| `/book/fulfilment`              | Select an API-supported mode; requires an in-memory package selection       |
| `/book/details`                 | Collect details; requires in-memory package and mode selections             |
| `/book/review`                  | Review the draft; submission occurs only on explicit confirmation           |
| `/book/confirmation/:reference` | Display the returned reference and safe next steps                          |
| `/bookings/:reference`          | Retrieve a booking where the authorization/verification contract permits it |
| `**`                            | Accessible not-found page with a route back to safety                       |

Guards should prevent accidental entry into later steps without required in-memory state, returning users to the earliest incomplete step. Guards are navigation aids, not security controls. Avoid sensitive values in URLs.

The fulfilment and details guards are implemented. Refresh intentionally clears the draft, so guarded routes recover to package selection or fulfilment as appropriate.

Whether the lookup route is public and what it may display remains a backend/product security decision.

## Forms and data boundaries

Maintain three concepts where needed:

- Form state: controls, interaction state, client-side format validation, and user-friendly error messages.
- API models: exact typed request/response contracts.
- Presentation models: display labels and formatting derived from API data.

Map the completed form state into the booking request at one explicit boundary. Client validation may enforce required fields and obvious formats, but the API remains authoritative for business validation and acceptance.

## Loading and errors

Every API-backed route should model `idle`, `loading`, `success`, and `error` outcomes, including an empty catalogue where applicable. Preserve already-rendered data during background refresh if doing so is honest and helpful.

- Package loading: show a stable skeleton or status message, then catalogue, empty state, or retryable error.
- Submission: disable duplicate submission, communicate progress, and retain the draft on a recoverable failure.
- Field errors: associate server-provided field errors with the matching controls when safe and possible.
- System errors: provide a plain-language message, retry path, and support guidance without exposing internals.
- Unknown booking/reference: do not reveal whether sensitive records exist beyond the agreed API response semantics.

## Testing strategy

- Unit-test API mapping, computed state, validators, and booking state transitions.
- Component-test keyboard interaction, labels, error announcements, selection, and responsive-critical states.
- Add end-to-end coverage for the happy path plus catalogue failure, validation failure, submission failure/retry, refresh/guard behavior, and confirmation.
- Mock at the HTTP boundary using realistic typed fixtures; do not encode fake business logic into components.
- Include automated accessibility checks while retaining manual keyboard and screen-reader review.
