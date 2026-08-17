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
- `BookingsApi`: creates a public booking. Booking lookup is intentionally not implemented.
- `AuthApi`: logs in and retrieves the authenticated safe user identity.
- `PackagePricesApi`: lists, creates, schedules, and deactivates package prices.

These services own URL construction and typed `HttpClient` calls. Feature state/orchestration decides when to load, retry, navigate, and present results. Components should not call `HttpClient` directly.

## Endpoints

| Method and path                                     | Frontend use                                     | Ownership notes                                          |
| --------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `GET /api/v1/health-check-packages`                 | Populate package selection and supported options | API controls catalogue and availability                  |
| `GET /api/v1/fulfilment-modes`                      | Populate fulfilment selection                    | API controls fulfilment mode availability                |
| `POST /api/v1/public/bookings`                      | Submit the reviewed public booking draft         | API validates, creates, and returns confirmation data    |
| `GET /api/v1/bookings/:reference`                   | Retrieve permitted booking/confirmation state    | Authorization and safe response fields must be confirmed |
| `POST /api/v1/auth/login`                           | Establish an in-memory authenticated session     | Returns access token and safe user identity              |
| `POST /api/v1/auth/refresh`                         | Restore or rotate a browser session              | Uses and rotates an HttpOnly refresh cookie              |
| `POST /api/v1/auth/logout`                          | Revoke the current refresh session               | Clears the refresh cookie; local state clears regardless |
| `POST /api/v1/auth/logout-all`                      | Revoke all refresh sessions for the current user | Requires Bearer authentication                           |
| `GET /api/v1/auth/me`                               | Retrieve the current safe user identity          | Bearer-authenticated                                     |
| `GET /api/v1/admin/package-prices`                  | List and filter package prices                   | ADMIN or OPERATIONS                                      |
| `POST /api/v1/admin/package-prices`                 | Create a package price                           | ADMIN or OPERATIONS                                      |
| `POST /api/v1/admin/package-prices/schedule`        | Schedule a future replacement price              | Preserves history; ADMIN or OPERATIONS                   |
| `PATCH /api/v1/admin/package-prices/:id/deactivate` | Deactivate without deletion                      | ADMIN or OPERATIONS                                      |

Exact payloads are not documented here because they must come from the backend's authoritative API contract. Before implementation, obtain OpenAPI/schema examples or agreed request and response fixtures, including validation and error shapes.

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

Logout revokes the current refresh session and clears its cookie. Logout-all additionally sends the current bearer token and revokes every session for that user. The frontend clears in-memory authentication and navigates to login even when the logout network request fails, avoiding an apparently authenticated UI.

Credentialed cross-origin deployments require the backend to allow the exact frontend origin, allow credentials, and configure cookie `SameSite`, `Secure`, domain, and path attributes consistently with the deployed origins. Wildcard CORS origins are incompatible with credentialed browser requests.

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
- If cookie authentication is introduced, coordinate `SameSite`, secure cookies, credential mode, and CSRF protection with the backend. Do not store auth tokens in local storage by default.
- Never store participant or health information in local/session storage, URL parameters, analytics, logs, or monitoring metadata.
- Keep sensitive draft data in memory and clear it when the booking session ends or is abandoned where practical.
- Encode references used in paths and render all backend text as plain text unless it passes an explicitly approved sanitization path.
- Minimize confirmation and lookup data. A booking reference should be treated as sensitive, not as proof of identity.
- Configure a restrictive Content Security Policy and related browser security headers at the hosting layer as deployment is defined.
- Do not claim regulatory compliance based only on frontend safeguards.

## Contract questions before implementation

- What are the exact success payloads and status codes for all three endpoints?
- Are packages returned as an array or envelope, and how are availability and fulfilment modes represented?
- Will location, scheduling, preparation, or separate visit-fee fields be added to the catalogue?
- What booking fields are required, optional, nullable, or conditionally required?
- What is the standard error envelope and field-validation path format?
- Does booking creation support an idempotency key?
- Does `GET /bookings/:reference` require authentication or an additional verification factor?
- What caching headers and catalogue freshness behavior should the client respect?
- What are the timeout, rate-limit, and support expectations?
- Is API version compatibility documented through OpenAPI and contract tests?
