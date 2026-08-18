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
│   ├── booking/         # Booking shell, steps, confirmation, and lookup
│   └── provider/        # Provider-owned offer list, detail, and response UI
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

| Route                             | Responsibility                                                              |
| --------------------------------- | --------------------------------------------------------------------------- |
| `/`                               | Focused home page with the primary booking CTA                              |
| `/health-check/packages`          | Fetch and select an available package                                       |
| `/book/fulfilment`                | Select an API-supported mode; requires an in-memory package selection       |
| `/book/details`                   | Collect details; requires in-memory package and mode selections             |
| `/book/review`                    | Review the draft; submission occurs only on explicit confirmation           |
| `/book/confirmation/:reference`   | Display or securely recover confirmation and initialize guest funding       |
| `/bookings/:reference`            | Retrieve a booking where the authorization/verification contract permits it |
| `/admin/login`                    | In-memory administrator and operations login                                |
| `/admin/package-prices`           | Role-guarded package-price operations                                       |
| `/admin/access-denied`            | Accessible recovery for authenticated users without an allowed role         |
| `/admin/provider-assignments`     | Guarded matching controls and operational assignment list                   |
| `/admin/provider-assignments/:id` | Guarded assignment detail and accepted-assignment confirmation              |
| `/provider/offers`                | Provider-owned actionable/recent offer list                                 |
| `/provider/offers/:id`            | Safe offer detail and deliberate accept/decline actions                     |
| `/provider/access-denied`         | Accessible recovery for users without the explicit PROVIDER role            |
| `**`                              | Accessible not-found page with a route back to safety                       |

Guards should prevent accidental entry into later steps without required in-memory state, returning users to the earliest incomplete step. Guards are navigation aids, not security controls. Avoid sensitive values in URLs.

The fulfilment and details guards are implemented. Refresh intentionally clears the draft, so guarded routes recover to package selection or fulfilment as appropriate.

Review additionally requires saved details and redirects to the earliest incomplete step. Confirmation accepts a reference route parameter, renders a matching in-memory response immediately, and otherwise performs a cookie-authorized secure lookup. Route or query parameters never establish ownership or payment success.

The selected catalogue price is a computed value derived from the selected package's API-provided `prices` and selected fulfilment-mode ID. It gates progression but is presentation state only: the public request mapper never sends an amount or currency. The server-returned `quotedAmount` and `quotedCurrency` form the authoritative booking quote snapshot on confirmation.

Draft form state remains memory-only. After creation, the backend sets a separate HttpOnly public-booking session cookie. Confirmation renders the matching in-memory response immediately; after refresh it performs a credentialed `GET /public/bookings/:reference`. The backend validates that the cookie owns that exact booking, so the reference remains an identifier rather than authorization. Funding and payment initialization use the same cookie and empty request bodies; no amount, currency, provider credential, or payment reference is client controlled.

Checkout handoff is an explicit browser boundary. The API supplies a normalized HTTPS Paystack-hosted URL, the frontend validates its scheme and expected host, and only then exposes a deliberate navigation action. Redirect query parameters are ignored. Webhook verification and server state are authoritative, and confirmation re-reads that state after refresh. A dedicated payment-return route remains deferred until the deployed backend callback URL is agreed.

Public booking cookie authorization is deliberately isolated from `AuthStateService`, staff/provider bearer tokens, and the staff refresh interceptor. A guest does not need a registered user, and public-booking `401` responses never trigger staff session refresh.

Admin authentication uses a small signal service holding the access token and safe current-user identity in memory only. The refresh token is never represented in frontend code: the backend stores it in an HttpOnly cookie. Angular's application initializer attempts one credentialed refresh on startup, with a bounded timeout, before protected guards decide whether to redirect. Guards await the initialization promise and then require an authenticated `ADMIN` or `OPERATIONS` role; authorization remains enforced independently by the backend.

A functional interceptor attaches the in-memory bearer token only to URLs under the configured API base URL. One normal API `401` starts or joins a shared refresh operation and, after success, retries that request once. Login, refresh, and logout are excluded from this recovery path to prevent loops. Failed restoration is an ordinary unauthenticated state; failed runtime refresh clears the frontend session and returns the user to login. Logout always clears local state even if backend revocation cannot be reached.

Provider routes reuse the same login, signal state, startup restoration, interceptor, and logout flow. Their guard requires the explicit `PROVIDER` role after restoration; ADMIN or OPERATIONS alone never implies provider access. Admin pages remain responsible for operational pricing, while provider pages expose only assignments owned by the authenticated provider. The backend remains responsible for ownership checks, provider linkage, offer expiry, matching transitions, and valid actions.

Provider offer list and detail components model only the backend's safe offer projection: operational timestamps and status, booking reference, package/mode labels, participant name, requested time preferences, and an optional provider response reason. They intentionally exclude contact data, date of birth, location notes, internal booking/provider identifiers, and matching history.

Admin assignment routes use the existing ADMIN/OPERATIONS guard and session. Operations may ask the backend to start matching, inspect assignment state, confirm an accepted provider response, or explicitly expire stale offers. The browser never constructs a candidate list, ranks providers, evaluates availability, revives expired offers, or directly changes booking state. Provider `ACCEPTED` remains distinct from admin `CONFIRMED`; only the server confirmation response advances the booking to `PROVIDER_ASSIGNED`.

The admin assignment read model contains only operational identity and scheduling context: provider ID/display name, minimal participant name, package/mode, booking and assignment states, requested schedule, offer timestamps, and decline reason. Funding, payment, contacts, credentials, free-text location notes, and raw matching histories remain outside the frontend boundary.

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
