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

| Route                                         | Responsibility                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `/`                                           | Focused home page with the primary booking CTA                              |
| `/health-check/packages`                      | Fetch and select an available package                                       |
| `/book/fulfilment`                            | Select an API-supported mode; requires an in-memory package selection       |
| `/book/details`                               | Collect details; requires in-memory package and mode selections             |
| `/book/review`                                | Review the draft; submission occurs only on explicit confirmation           |
| `/book/confirmation/:reference`               | Display or securely recover confirmation and initialize guest funding       |
| `/bookings/:reference`                        | Retrieve a booking where the authorization/verification contract permits it |
| `/login`                                | In-memory administrator and operations login                                |
| `/admin/package-prices`                       | Role-guarded package-price operations                                       |
| `/admin/providers`                            | Guarded provider listing, filtering, and creation                           |
| `/admin/providers/:id`                        | Guarded provider profile, status, and account-link operations               |
| `/admin/matching-queue`                       | Guarded, paginated provider-matching readiness queue                        |
| `/admin/access-denied`                        | Accessible recovery for authenticated users without an allowed role         |
| `/admin/provider-assignments`                 | Guarded matching controls and operational assignment list                   |
| `/admin/provider-assignments/:id`             | Guarded assignment detail and accepted-assignment confirmation              |
| `/provider/dashboard`                         | Role-scoped operational dashboard using the authoritative provider summary  |
| `/provider/offers`                            | Provider-owned actionable offer list                                        |
| `/provider/appointments`                      | Confirmed provider appointments and Health Check entry points               |
| `/provider/offers/:id`                        | Safe offer detail and deliberate accept/decline actions                     |
| `/provider/bookings/:reference/health-check`  | Provider-only encounter and structured measurement entry                    |
| `/provider/access-denied`                     | Accessible recovery for users without the explicit PROVIDER role            |
| `/provider/setup/:token`                      | Public one-time provider invitation inspection and account setup            |
| `/provider/register`                          | Public provider account creation and onboarding submission                  |
| `/provider/profile`                           | Provider-authenticated onboarding profile, update, and review submission    |
| `/me/health-checks`                           | Authenticated Patient-scoped paginated Health Check history                 |
| `/me/link-health-history`                     | Link one guest Patient history using secure ownership proof                 |
| `/me/health-checks/:bookingReference/results` | Authenticated patient's own completed measurement result                    |
| `/health-results/:token`                      | Guest result authorized by a dedicated opaque token                         |
| `**`                                          | Accessible not-found page with a route back to safety                       |

Guards should prevent accidental entry into later steps without required in-memory state, returning users to the earliest incomplete step. Guards are navigation aids, not security controls. Avoid sensitive values in URLs.

The fulfilment and details guards are implemented. Refresh intentionally clears the draft, so guarded routes recover to package selection or fulfilment as appropriate.

Review additionally requires saved details and redirects to the earliest incomplete step. Confirmation accepts a reference route parameter, renders a matching in-memory response immediately, and otherwise performs a cookie-authorized secure lookup. Route or query parameters never establish ownership or payment success.

The selected catalogue price is a computed value derived from the selected package's API-provided `prices` and selected fulfilment-mode ID. It gates progression but is presentation state only: the public request mapper never sends an amount or currency. The server-returned `quotedAmount` and `quotedCurrency` form the authoritative booking quote snapshot on confirmation.

Draft form state remains memory-only. After creation, the backend sets a separate HttpOnly public-booking session cookie. Confirmation renders the matching in-memory response immediately; after refresh it performs a credentialed `GET /public/bookings/:reference`. The backend validates that the cookie owns that exact booking, so the reference remains an identifier rather than authorization. Funding and payment initialization use the same cookie and empty request bodies; no amount, currency, provider credential, or payment reference is client controlled.

Checkout handoff is an explicit browser boundary. The API supplies a normalized HTTPS Paystack-hosted URL, the frontend validates its scheme and expected host, and only then exposes a deliberate navigation action. Redirect query parameters are ignored. Webhook verification and server state are authoritative, and confirmation re-reads that state after refresh. A dedicated payment-return route remains deferred until the deployed backend callback URL is agreed.

Confirmation also loads the cookie-authorized payment-status projection once per page entry and after payment initiation. Pending users may explicitly request one reconciliation action at a time; there is no interval, recursive timer, automatic polling, or automatic mutation replay. The backend selects the latest attempt, validates provider reference/amount/currency, throttles verification, and returns the authoritative result. Terminal failure or cancellation invalidates any in-memory checkout URL before another deliberate attempt.

Public booking cookie authorization is deliberately isolated from `AuthStateService`, staff/provider bearer tokens, and the staff refresh interceptor. A guest does not need a registered user, and public-booking `401` responses never trigger staff session refresh.

Admin authentication uses a small signal service holding the access token and safe current-user identity in memory only. The refresh token is never represented in frontend code: the backend stores it in an HttpOnly cookie. Angular's application initializer attempts one credentialed refresh on startup, with a bounded timeout, before protected guards decide whether to redirect. Guards await the initialization promise and then require an authenticated `ADMIN` or `OPERATIONS` role; authorization remains enforced independently by the backend.

A functional interceptor attaches the in-memory bearer token only to URLs under the configured API base URL. One normal API `401` starts or joins a shared refresh operation and, after success, retries that request once. Login, refresh, and logout are excluded from this recovery path to prevent loops. Failed restoration is an ordinary unauthenticated state; failed runtime refresh clears the frontend session and returns the user to login. Logout always clears local state even if backend revocation cannot be reached.

Provider routes reuse the same login, signal state, startup restoration, interceptor, and logout flow. Their guard requires the explicit `PROVIDER` role after restoration; ADMIN or OPERATIONS alone never implies provider access. Admin pages remain responsible for operational pricing, while provider pages expose only assignments owned by the authenticated provider. The backend remains responsible for ownership checks, provider linkage, offer expiry, matching transitions, and valid actions.

Provider offer list and detail components model only the backend's safe offer projection: operational timestamps and status, booking reference, package/mode labels, participant name, requested time preferences, and an optional provider response reason. They intentionally exclude contact data, date of birth, location notes, internal booking/provider identifiers, and matching history.

Confirmed provider assignments link to a provider-only Smart Health Check encounter. The page loads or explicitly starts the server-owned encounter, saves all six structured measurements as a draft operation, and completes only after a separate confirmation. Units and recorded timestamps come back from the API; completed encounters disable the form. The frontend provides structural numeric validation only and contains no clinical ranges, interpretations, diagnoses, alerts, or patient-facing results.

Admin assignment routes use the existing ADMIN/OPERATIONS guard and session. Operations may ask the backend to start matching, inspect assignment state, confirm an accepted provider response, or explicitly expire stale offers. The browser never constructs a candidate list, ranks providers, evaluates availability, revives expired offers, or directly changes booking state. Provider `ACCEPTED` remains distinct from admin `CONFIRMED`; only the server confirmation response advances the booking to `PROVIDER_ASSIGNED`.

Automatic provider matching begins server-side after successful payment. The matching queue is therefore a monitoring and intervention projection: `READY` requires no routine browser command, `UNFULFILLABLE` permits explicit retry, and active/accepted/assigned states link into assignment or booking detail. With no booking-status filter, the browser leaves the filter absent so the backend owns funding gates and deterministic ordering. Readiness is displayed exactly from the API and is never recalculated or re-sorted client-side.

Booking detail contains controlled intervention tools. General ACTIVE-provider search supplies safe named choices but does not assert booking eligibility. Normal manual assignment is backend-validated; override is visually separated and requires an audited reason; reassignment requires a reason and can resume automatic discovery or nominate a provider for normal eligibility validation. None of these mutations are automatically replayed. Provider acceptance now atomically confirms the held assignment/reservation and schedules the booking; routine operations confirmation is no longer part of the normal flow. Stale-offer expiry remains an explicit command until a scheduler exists.

`/admin/bookings/:reference` connects the matching queue and provider-assignment workflow through a guarded operational booking projection. It shows the backend-provided booking, schedule, quote/funding, normalized payment, assignment, and readiness summaries; it does not reuse the public booking-session DTO or treat a reference as public authorization. Contextual actions are gated only by the returned readiness, and matching remains an explicit server-owned operation.

Matching now holds a compatible ProviderLocation for provider-location work, and provider acceptance atomically creates the confirmed schedule. Patient origin and appointment destination remain separate projections. The legacy admin scheduling surface remains recovery-compatible but is not the routine post-acceptance path. Patient, provider offer/assignment, and encounter views render only their authorized confirmed schedule/location data; provider-location views never reconstruct the patient's full origin address. Reassignment refreshes authoritative state so released schedules and locations are not retained locally.

At booking time the patient chooses a required appointment date, start time, and IANA timezone. No requested end time is constructed for new bookings; the selected package's backend duration derives the matching window. Legacy response end times remain renderable without producing malformed ranges when null. Confirmed appointments remain a distinct projection with explicit scheduled start and end. Provider availability separately defines operating start/end and an optional `bookingStopTime`, meaning the latest new appointment start rather than a required finish time.

The admin projection may include operational booker contact data that the public confirmation projection does not expose. Registered-user bookings can legitimately have missing structured names or phone numbers; the UI renders neutral missing-data labels and never substitutes participant identity. Provider IDs, health data, payment-provider internals, and lifecycle histories stay outside this page's model.

Provider administration keeps the provider operational profile separate from the linked user account. Basic profile edits never carry status, roles, or user IDs; activation, suspension, linking, and unlinking are explicit confirmed server operations. The guarded user-search API supplies minimized account identity, status, roles, and current provider-link context. Operators select an eligible result instead of entering an opaque UUID, and the backend remains authoritative for eligibility and PROVIDER-role changes. Self-registration and clinical verification remain deferred.

Provider onboarding supports two explicit paths. Operations creates a complete pending provider identity and invitation in one request, while self-registration creates a linked provider account and submits its profile for review. Invitation delivery returns only `SENT`, `MANUAL_REQUIRED`, or `FAILED`; manual links remain component-memory-only. Invitation acceptance and self-registration both end at normal login without creating a frontend session.

Account existence, onboarding review, and operational status remain distinct. A `PROVIDER` role permits access to the provider onboarding profile but does not prove approval or matching eligibility. Providers may edit only backend-permitted identity fields before approval and may resubmit a rejected profile. Operations alone approves or rejects a `SUBMITTED` profile; approval returns `APPROVED` plus operational `ACTIVE`. Activate is exposed only for already-approved inactive or suspended providers. Clinical verification remains a later prerequisite.

Provider configuration has two deliberately separate surfaces. Authenticated providers use provider-owned routes to maintain their profile, catalogue-backed services, named locations, service-location links, weekly availability, and dated exceptions before submitting for review. Those requests derive provider ownership from the authenticated session and never carry a provider ID. ADMIN/OPERATIONS retains the provider-detail configuration surface for review and exceptional operational correction.

The provider workspace renders the readiness projection embedded in the provider profile response and translates only its blocker codes; it does not recreate readiness rules. Providers configure their own HOME_VISIT service areas and operations reviews them read-only. Providers may submit when the server projection is ready, but only operations may approve or reject onboarding, suspend, or reactivate a provider. `APPROVED` and `ACTIVE` remain distinct from account creation and configuration readiness, and booking-specific matching still evaluates geography, schedule coverage, exceptions, reservations, capacity, and lifecycle state server-side.

Patient result access is separate from booking confirmation, payment cookies, staff roles, and provider encounter entry. The registered routes wait for session restoration, and the backend derives the linked Patient from the authenticated User even for multi-role accounts. `/me/health-checks` preserves backend ordering and pagination, exposes only safe history summaries, and uses `hasCompletedResult` rather than inferred lifecycle state to link completed results. An absent Patient link and an empty history intentionally share the same neutral empty page. The guest route uses its dedicated opaque token only for the public result endpoint and never copies it into global state or browser persistence. Both result routes render the same completed, measurement-only projection with backend-returned units. No family/dependent access, ranges, interpretation, alerts, reports, or advice are inferred.

The registered patient workspace follows `User → SELF Patient → Health Checks`. Registration creates the backend-owned identities but does not authenticate; normal login then routes USER authority to `/me/dashboard`. The patient shell exposes profile, category-backed history, patient-safe detail/results, and authenticated SELF booking. `patientReference` is displayed and copyable as a public record identifier, never as authorization, and internal Patient IDs are absent from all requests. Registered payment uses the dedicated JWT-authorized `/me/health-checks/:reference/payment` boundary and never borrows guest-session authority.

Guest checkout presents three backend-owned funding choices without changing payment authority. `PAY_NOW` keeps the Paystack Popup/access-code handoff, `PAYMENT_LINK` keeps the hosted URL only in component memory for deliberate copying/opening, and `PAY_LATER` keeps the same booking awaiting funding without reserving provider capacity. Returning guests may select a collection option against that same session-owned booking. The frontend never promotes Popup success, link creation, or deferred payment to settled state; secure status reads and deliberate reconciliation remain authoritative and automatic matching begins only after backend settlement.

Authenticated SELF Patient checkout offers the same provider-neutral choices through distinct `/me` endpoints. Popup success and browser callback parameters never settle funding locally; the patient verification command and subsequent status/detail reads are authoritative. `PAY_LATER` reserves neither provider capacity nor an appointment.

## Operational dashboards

`/provider/dashboard` and `/admin/dashboard` render aggregate cards exclusively from their dedicated summary APIs. Provider totals cover new offers, appointment-local today/upcoming work, and authoritative in-progress/completed encounter states. Admin totals cover booking lifecycle operations, unexpired active offers, and provider network review/active counts. Small offer and matching-queue tables are previews only and never supply or correct dashboard totals.

Pending providers remain in onboarding and do not call operational dashboard APIs. Provider financial cards are intentionally deferred until SmartClinic has an authoritative earnings and settlement domain; they must not be derived from booking funding or payment transactions. Current read gaps are a provider today/upcoming filtered work endpoint and an admin provider-list filter for onboarding `SUBMITTED`, so those dashboard totals remain cards rather than misleading list-derived previews.

## Referrals and rewards

Authenticated USER accounts read direct-only referral code, target-aware links, ledger-backed point totals, database-driven multi-level progress, and safe history from `/me/referrals`. Patient registration may submit the explicit `ref` query value as `referralCode`; provider registration may additionally submit a validated CLINIC, LABORATORY, or PHARMACY intent hint without overriding the selected provider type. Referral codes identify attribution only and never authorize accounts or health data. Level names, ordering, requirements, completion, and the highest configured level all come from `levelProgress`; Angular does not encode level business rules. Referral trees, downlines, and network-derived rewards remain deferred.

`/me/impact` is the authenticated USER impact dashboard. It composes the server-owned referral code and invite URLs, reward balances, direct-referral pipeline, multi-level progression, qualified counts, and consent-gated leaderboard position from one `/me/impact` read. Public leaderboard participation defaults to backend state and changes only through the explicit preferences command; referral codes and links never become authentication state. Detailed referral activity and withdrawal operations remain on the existing referrals page.

Manual cash withdrawal V1 is a USER-authorized, booking-independent operation. A request reserves points, operations makes the bank transfer outside SmartClinic, and operations records processing and terminal status. Only a confirmed external transfer may be marked PAID; FAILED and CANCELLED release reserved points. Bank ownership is not verified and provider-only accounts cannot use the USER withdrawal endpoints.

Authenticated SELF Health Check payment can reserve reward points through booking-scoped `/me/health-checks/:reference/rewards` APIs. Preview, applied point value, booking total, remaining external amount, redemption status, and funding state are backend-authoritative. A zero external remainder settles without Paystack; a positive remainder continues through the existing Paystack popup or hosted-link flow without Angular sending an amount. Guest and provider-only contexts cannot redeem points. Reserved Health Check points remain distinct from withdrawal reservations and are never described as spent before settlement.

Authenticated guest-history linking attaches an existing Patient record in place; it does not copy or merge profile, booking, or payment ownership. Booking proof deliberately combines the current User bearer token with the browser-managed public booking-session cookie, while result proof submits only a dedicated result-access token. Email and phone are never ownership proofs. Successful result-proof linking clears the in-memory form value and the backend revokes active guest result grants; successful booking-proof linking leaves the booking session untouched because its existing booking/funding authority is separate. Family/dependent linking remains deferred.

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
