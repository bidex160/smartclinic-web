# API Integration

## Principles

The frontend is an API consumer. It owns presentation, input ergonomics, navigation, and transient UI state. The backend owns the catalogue, package/mode availability, business validation, pricing, booking creation, booking references, and authoritative booking state.

## Base URL configuration

Provide a typed API configuration through Angular dependency injection. Build endpoint paths from a single base URL supplied by environment or runtime configuration. Do not reference `http://localhost:3000` in feature code.

Runtime configuration is preferable when the same built assets must deploy across environments; build-time Angular environment configuration is acceptable if each environment produces a separate artifact. The deployment approach should decide this before initialization.

Validate configuration at application startup and fail with a clear operational error when it is absent or malformed. Avoid exposing secrets: a browser API base URL is public configuration, and credentials must never be bundled into the frontend.

## Domain API services

Start with thin domain-oriented services rather than a generic repository layer:

- `HealthCheckPackagesApi`: retrieves the current package catalogue.
- `FulfilmentModesApi`: retrieves the current fulfilment catalogue.
- `BookingsApi`: creates and securely retrieves a session-owned public booking, initializes funding and checkout, reads authoritative payment state, and requests deliberate reconciliation.
- `AuthApi`: logs in and retrieves the authenticated safe user identity.
- `PackagePricesApi`: lists, creates, schedules, and deactivates package prices.
- `ProviderOffersApi`: lists and retrieves provider-owned safe offers and submits accept/decline responses.
- `AdminProviderAssignmentsApi`: starts server-owned matching, reads operational assignments, confirms accepted assignments, and runs explicit stale expiry.

These services own URL construction and typed `HttpClient` calls. Feature state/orchestration decides when to load, retry, navigate, and present results. Components should not call `HttpClient` directly.

## Endpoints

| Method and path                                                  | Frontend use                                       | Ownership notes                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /api/v1/health-check-packages`                              | Populate package selection and supported options   | API controls catalogue and availability                                |
| `GET /api/v1/fulfilment-modes`                                   | Populate fulfilment selection                      | API controls fulfilment mode availability                              |
| `POST /api/v1/public/bookings`                                   | Submit the reviewed public booking draft           | Sets the HttpOnly public-booking session cookie                        |
| `GET /api/v1/public/bookings/:reference`                         | Securely restore the session-owned confirmation    | Cookie must own the exact referenced booking                           |
| `POST /api/v1/public/bookings/:reference/funding/initialize`     | Initialize the guest funding obligation            | Sends no amount/currency; server returns authoritative funding state   |
| `POST /api/v1/public/bookings/:reference/payment/initiate`       | Request a provider-hosted guest checkout           | Empty body; backend returns only normalized safe checkout data         |
| `GET /api/v1/public/bookings/:reference/payment-status`          | Read authoritative guest payment state             | Cookie-bound safe booking/funding/latest-attempt projection            |
| `POST /api/v1/public/bookings/:reference/payment-status/refresh` | Reconcile the latest attempt with the provider     | Empty body; backend selects the attempt and throttles verification     |
| `POST /api/v1/auth/login`                                        | Establish an in-memory authenticated session       | Returns access token and safe user identity                            |
| `POST /api/v1/auth/refresh`                                      | Restore or rotate a browser session                | Uses and rotates an HttpOnly refresh cookie                            |
| `POST /api/v1/auth/logout`                                       | Revoke the current refresh session                 | Clears the refresh cookie; local state clears regardless               |
| `POST /api/v1/auth/logout-all`                                   | Revoke all refresh sessions for the current user   | Requires Bearer authentication                                         |
| `GET /api/v1/auth/me`                                            | Retrieve the current safe user identity            | Bearer-authenticated                                                   |
| `GET /api/v1/admin/package-prices`                               | List and filter package prices                     | ADMIN or OPERATIONS                                                    |
| `POST /api/v1/admin/package-prices`                              | Create a package price                             | ADMIN or OPERATIONS                                                    |
| `POST /api/v1/admin/package-prices/schedule`                     | Schedule a future replacement price                | Preserves history; ADMIN or OPERATIONS                                 |
| `PATCH /api/v1/admin/package-prices/:id/deactivate`              | Deactivate without deletion                        | ADMIN or OPERATIONS                                                    |
| `GET /api/v1/admin/providers`                                    | List/filter provider profiles                      | ADMIN/OPERATIONS; backend ordering and pagination                      |
| `GET /api/v1/admin/providers/:id`                                | Read one safe provider profile                     | Includes linked-user summary and capability/location counts            |
| `POST /api/v1/admin/providers`                                   | Create an unlinked pending provider                | Basic profile only                                                     |
| `PATCH /api/v1/admin/providers/:id`                              | Update basic provider profile                      | Never sends status, roles, or user ID                                  |
| `PATCH /api/v1/admin/providers/:id/activate`                     | Activate a provider explicitly                     | Confirmed operational mutation                                         |
| `PATCH /api/v1/admin/providers/:id/suspend`                      | Suspend a provider explicitly                      | Confirmed operational mutation                                         |
| `POST /api/v1/admin/providers/:id/link-user`                     | Link an existing eligible user                     | Typed service support; UI awaits safe admin user search                |
| `POST /api/v1/admin/providers/:id/unlink-user`                   | Unlink safely and remove PROVIDER role server-side | Backend blocks active-work conflicts                                   |
| `GET /api/v1/provider/offers`                                    | List the authenticated provider's current offers   | PROVIDER; optional assignment-status filter                            |
| `GET /api/v1/provider/offers/:id`                                | Read one owned safe offer                          | PROVIDER; ownership enforced by API                                    |
| `POST /api/v1/provider/offers/:id/accept`                        | Accept one offered assignment                      | Single deliberate mutation; server validates expiry                    |
| `POST /api/v1/provider/offers/:id/decline`                       | Decline one offered assignment                     | Optional reason; preserves matching history                            |
| `POST /api/v1/admin/bookings/:reference/matching/start`          | Start or retry provider matching                   | ADMIN/OPERATIONS; backend selects eligible candidate                   |
| `GET /api/v1/admin/bookings/matching-queue`                      | Read the operational provider-matching queue       | Backend owns readiness, default funding gate, ordering, and paging     |
| `GET /api/v1/admin/bookings/:reference`                          | Read one operational booking projection            | ADMIN/OPERATIONS; safe booking, funding, payment, and matching context |
| `GET /api/v1/admin/provider-assignments`                         | List/filter operational assignments                | Filters reference, provider ID, or assignment status                   |
| `GET /api/v1/admin/provider-assignments/:id`                     | Inspect one operational assignment                 | Excludes payment, contact, and raw history data                        |
| `POST /api/v1/admin/provider-assignments/:id/confirm`            | Confirm an accepted provider response              | Advances assignment and booking transactionally                        |
| `POST /api/v1/admin/provider-assignments/expire-stale`           | Expire stale offers and continue matching          | Explicit operations action; never run by a UI timer                    |

Exact payloads are not documented here because they must come from the backend's authoritative API contract. Before implementation, obtain OpenAPI/schema examples or agreed request and response fixtures, including validation and error shapes.

The operational booking-detail response is distinct from both the guest confirmation response and raw persistence models. It includes only the contact and workflow context staff need. Nullable registered-booker name/phone fields remain nullable in TypeScript and are never inferred from participant data. Queue references and assignment views link to this projection, while assignment IDs continue to link to the assignment-specific workflow.

Provider management receives only safe linked-user identity, roles, and account status—never credentials, sessions, or token data. Linking and unlinking are backend-owned transactions. There is currently no admin user-search endpoint, so frontend link submission is deliberately unavailable rather than accepting raw UUIDs; adding searchable safe user selection is the contract dependency.

The package catalogue includes benefits, estimated duration, and current prices keyed by fulfilment-mode ID. These prices support comparison and gate progression. They are not included in the public booking request. On creation, the backend resolves pricing again and returns `quotedAmount` with `quotedCurrency`; that response snapshot is authoritative for the created booking. A `422` response means pricing is no longer available and returns the user to deliberate selection/retry behavior without exposing backend details.

## Type strategy

- Define explicit request and response interfaces matching the wire format.
- Avoid `any`; use `unknown` plus validation/narrowing at truly untrusted dynamic boundaries.
- Keep transport models separate from form models when nullability, naming, formatting, or grouping differs.
- Map API codes to user-facing copy exhaustively while providing a safe fallback for forward-compatible unknown values.
- Codes can use literal unions when the contract is closed, but runtime handling must still tolerate an unexpected value without crashing.
- Do not hardcode catalogue arrays as application state. Typed known codes are not the same as hardcoded availability.
- Preserve raw backend values required for submission rather than reverse-mapping display labels.

## Request flow

```text
Route component / feature state
  → domain API service
    → configured HttpClient
      → SmartClinic API
  ← typed response or normalized error
← signals/computed presentation state
```

Add interceptors only for real cross-cutting concerns such as a request correlation header, approved authentication credentials, or consistent transport-error normalization. Do not hide feature-specific behavior in interceptors.

The access token and safe current user exist only in Angular signal state. The refresh token is an HttpOnly cookie owned by the browser and backend; JavaScript never reads it and no auth token is written to local or session storage. Login, refresh, logout, and logout-all opt into `withCredentials` so the cookie can be set, rotated, or cleared. Other origins do not receive SmartClinic credentials.

At application startup, a modern Angular application initializer performs exactly one credentialed refresh attempt and completes within a bounded timeout. A missing or expired refresh cookie resolves to a normal unauthenticated state without a global error. Protected guards wait for this initialization before redirecting.

The auth interceptor is limited to the configured SmartClinic API URL and never attaches the bearer token to external URLs. For a normal API `401`, all concurrent failures share one in-flight refresh. A successful refresh rotates the cookie, updates in-memory auth, and retries each failed request once with the new bearer token. Auth session endpoints cannot trigger refresh recovery, and retried requests do not re-enter the interceptor, preventing loops and repeated mutations. Failed refresh clears in-memory authentication and returns the user to admin login; `403` pricing responses route to the accessible access-denied page.

Public booking creation, secure retrieval, and funding initialization use `withCredentials: true` so the browser can manage the backend's `smartclinic_public_booking_session` HttpOnly cookie. They opt out of staff bearer-token attachment and staff `401` refresh handling. The cookie/token is absent from frontend models and state. The booking reference is not authorization, and unauthorized or mismatched-session reads render only a safe recovery state. This guest security context is independent of admin/provider authentication.

Funding initialization has an empty request body. Its typed response contains booking reference, server amount/currency, funding status, nullable attempt status/identifier, and nullable payment reference.

Payment initiation also has an empty request body. The backend resolves the payer email and authoritative funding values, initializes or reuses the provider-side attempt, and returns only `bookingReference`, `paymentAttemptReference`, normalized status, amount, currency, and nullable `checkoutUrl`. The frontend contains no Paystack keys, access codes, internal IDs, raw payloads, or client-generated payment references. It accepts checkout handoff only for a valid HTTPS `checkout.paystack.com` URL and never constructs a Paystack URL.

The hosted checkout redirect and its query parameters are untrusted navigation context, not payment evidence. Signed Paystack webhooks plus server-side verification determine settlement. After return or refresh, the frontend must securely `GET` the booking again using the public-booking session and render the server status. The backend currently has no callback endpoint and its example `PAYSTACK_CALLBACK_URL` is not a confirmed frontend route, so `/book/payment-return/:reference` is intentionally not present.

Payment status reads return only booking reference/status, nullable funding and payment-attempt status, nullable safe attempt reference, amount/currency, and successful transaction time. The browser never selects an attempt or submits amount, currency, payment reference, or provider metadata. Status refresh is an explicit, non-replayed mutation. The signed webhook is the primary confirmation path; manual refresh invokes the same server-side verification and settlement boundary for recovery. A throttled `429` is presented as a short wait without revealing internal rate-limit configuration. No timers or background polling are used.

Only backend `SUCCEEDED` is payment confirmation. `CREATED`, `AWAITING_CUSTOMER_ACTION`, and `PENDING_CONFIRMATION` remain pending; `FAILED` and `CANCELLED` remain unconfirmed. `PENDING_PROVIDER_MATCH` after payment means matching may proceed and does not mean assignment has occurred.

Logout revokes the current refresh session and clears its cookie. Logout-all additionally sends the current bearer token and revokes every session for that user. The frontend clears in-memory authentication and navigates to login even when the logout network request fails, avoiding an apparently authenticated UI.

Credentialed cross-origin deployments require the backend to allow the exact frontend origin, allow credentials, and configure cookie `SameSite`, `Secure`, domain, and path attributes consistently with the deployed origins. Wildcard CORS origins are incompatible with credentialed browser requests.

## Provider offer boundary

Provider APIs are Bearer-authenticated and use the existing refresh recovery. Components never call `HttpClient` directly. A provider list may pass the backend-supported single `status` query parameter; omitting it preserves the server's current-offers default.

The offer transport model mirrors only the safe response: assignment status and response timestamps, booking reference, package and fulfilment labels, participant name, requested date/time/timezone, and optional decline reason. It does not model participant contact details, date of birth, free-text location notes, internal booking/provider IDs, or matching history. UI code must not infer or request those fields.

Accept and decline are deliberate POST operations with duplicate controls disabled while pending. They carry an explicit HTTP-context opt-out from automatic request replay: a `401` may refresh the session, but the mutation itself must be deliberately submitted again. A `409` means the server considers the offer expired or otherwise no longer actionable; the UI disables response actions and reloads the authoritative offer instead of reviving it. `403` routes to provider access denial, and `404` uses a non-enumerating owned-offer message.

## Admin matching boundary

The admin matching client is a thin transport layer. Start matching sends only the encoded booking reference; provider candidates, capability checks, availability, sequential offer policy, expiry, and booking transitions remain authoritative backend concerns. Assignment filters map directly to the supported `bookingReference`, `providerId`, and `status` query parameters.

The queue client maps only the supported booking status, catalogue IDs, preferred date, latest assignment status, exact booking reference, page, and limit parameters. Omitting booking status preserves the backend default of settled `PENDING_PROVIDER_MATCH` bookings ordered by creation time and reference. The frontend renders response order unchanged and uses returned `page`, `limit`, `total`, and `totalPages`; it does not implement local sorting or infinite scroll.

Readiness is backend-derived operational metadata: `READY`, `FUNDING_INCOMPLETE`, `INCOMPLETE_SCHEDULING`, `ACTIVE_OFFER`, `ACCEPTED_AWAITING_CONFIRMATION`, `UNFULFILLABLE`, or `ALREADY_ASSIGNED`. Only `READY` exposes the explicit matching command. Queue reads never start matching. Active/accepted rows link to assignment management, while candidate selection and all readiness rules remain server-owned. Settled SELF funding is a default queue prerequisite, not a browser rule.

The queue read model contains only reference/status, package/mode labels, participant name, requested schedule, funding/quote summary, latest assignment status/provider display name, readiness, and timestamps. It excludes contact data, date of birth, provider payment metadata, internal IDs, histories, and candidate providers.

The administrative read model contains assignment/booking state, provider display identity, package and fulfilment labels, minimal participant name, requested schedule, offer timestamps, and a decline reason only when relevant. It excludes funding, payment, participant contact data, credentials, location notes, candidate sets, and raw histories.

Provider acceptance records willingness but does not assign the booking. ADMIN/OPERATIONS confirmation is a separate explicit action available only for `ACCEPTED`; its returned DTO supplies the authoritative `CONFIRMED` assignment and `PROVIDER_ASSIGNED` booking states. Start, confirm, and stale-expiry mutations opt out of automatic HTTP replay and refresh their read view after success. Stale expiry is user-triggered and never scheduled in the browser.

## Loading, empty, and error handling

- Catalogue requests expose loading, success, empty, and retryable error states.
- Cancellation or latest-request behavior should prevent stale responses from replacing newer choices.
- Booking submission uses an explicit pending state and disables repeat activation.
- Retain in-memory form state after recoverable network or server errors.
- Map backend field validation to controls only through an agreed, typed error shape.
- Treat timeouts, offline state, validation failure, authorization failure, not-found, conflict, rate limiting, and server errors according to their different recovery options.
- Log operational diagnostics without request/response bodies or participant data. User messages should not expose stack traces, infrastructure, or raw backend errors.

Retries must be deliberate. A catalogue GET may be manually or safely retried. A booking POST must not be automatically retried unless the backend provides idempotency semantics that prevent duplicate bookings.

## Security and data handling

- Use HTTPS outside local development.
- Confirm backend CORS and credential policy for each deployed frontend origin.
- Coordinate allowed origins, `Access-Control-Allow-Credentials`, `SameSite`, `Secure`, cookie path, and CSRF controls with the backend/deployment. Neither staff auth nor public-booking tokens belong in browser storage.
- Never store participant or health information in local/session storage, URL parameters, analytics, logs, or monitoring metadata.
- Keep sensitive draft data in memory and clear it when the booking session ends or is abandoned where practical.
- Encode references used in paths and render all backend text as plain text unless it passes an explicitly approved sanitization path.
- Minimize confirmation and lookup data. A booking reference is an identifier, never proof of identity or authorization.
- Configure a restrictive Content Security Policy and related browser security headers at the hosting layer as deployment is defined.
- Do not claim regulatory compliance based only on frontend safeguards.

## Contract questions before implementation

- What are the exact success payloads and status codes for all three endpoints?
- Are packages returned as an array or envelope, and how are availability and fulfilment modes represented?
- Will location, scheduling, preparation, or separate visit-fee fields be added to the catalogue?
- What booking fields are required, optional, nullable, or conditionally required?
- What is the standard error envelope and field-validation path format?
- Does booking creation support an idempotency key?
- What recovery flow should be offered after the HttpOnly public-booking session expires?
- What caching headers and catalogue freshness behavior should the client respect?
- What are the timeout, rate-limit, and support expectations?
- Is API version compatibility documented through OpenAPI and contract tests?
