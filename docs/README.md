# SmartClinic Web Documentation

This directory describes the proposed frontend architecture and product experience before Angular is initialized. It is intentionally implementation-neutral where backend contracts or product decisions are not yet final.

## Documents

- [Architecture](architecture.md): application boundaries, Angular conventions, state, components, routing, and quality strategy.
- [Design system](design-system.md): visual direction, tokens, responsive behavior, interaction states, and accessibility.
- [Booking flow](booking-flow.md): the primary user journey, route-step responsibilities, form state, and unresolved product decisions.
- [API integration](api-integration.md): configuration, typed API access, endpoint ownership, loading/error handling, privacy, and security.

## Product anchor

SmartClinic's primary public action is **Book My Smart Health Check**. The first release should make this path obvious and calm:

```text
Home
  → Select health check package
  → Select fulfilment mode
  → Enter participant and booking information
  → Review
  → Submit booking
  → Receive booking reference
```

The API is the source of truth. The frontend presents the available catalogue and guides input; it does not recreate backend business rules.

## Current status

The Angular foundation uses standalone components, strict TypeScript, routing, SCSS, Tailwind CSS, signals, Reactive Forms, and `HttpClient`. The public booking journey covers API-backed package, pricing, and fulfilment selection, in-memory details, review, deliberate submission, secure confirmation recovery, guest funding, Paystack checkout handoff, and authoritative payment-status display. Catalogue prices are displayed but never submitted; confirmation uses the server-returned quote snapshot. The backend-managed HttpOnly public-booking session authorizes recovery, payment initialization, status reads, and deliberate reconciliation without exposing a session token to JavaScript. Checkout redirects are never treated as proof of payment.

The first authenticated operations feature provides ADMIN/OPERATIONS login and guarded package-price management. Access tokens remain in memory, while an HttpOnly refresh cookie restores the session once at startup and supports single-flight `401` recovery. The feature lists, filters, creates, schedules, and deactivates prices and provides explicit session logout without browser-storage tokens or unrelated administration features.

Operations also has a guarded provider-matching queue. It preserves the backend's oldest-first ordering and derived readiness, supports server-side filters and pagination, and starts matching only after an explicit action. Active and accepted offers link into the existing provider-assignment workflow.

A guarded operational booking detail now links queue rows with provider assignments. It presents only the backend's safe operational projection, handles absent registered-booker contact/funding/payment/assignment data without inference, and exposes matching only when the returned readiness is `READY`.

The first provider self-service feature reuses that session infrastructure for explicit `PROVIDER` role access. Providers can list and filter only their own safe offer projections, inspect an offer, and deliberately accept or decline an actionable assignment. The frontend never models or renders patient contact details, health data, location notes, provider internals, or matching internals.

Confirmed assignments now open a provider-only Smart Health Check encounter for the six initial measurements. Providers explicitly start, save, review, and complete the encounter; server-returned units and timestamps are authoritative, and completed measurements are read-only. Clinical interpretation remains deferred.

Authenticated Patient-linked Users can review their backend-scoped, paginated Smart Health Check history and open results only where `hasCompletedResult` is true. Multi-role accounts use the same `/me` scope, and empty/unlinked accounts receive one neutral empty state. Completed measurement results remain available through two deliberately separate paths: authenticated ownership by booking reference or exactly one guest result through a dedicated opaque token. The guest token is not persisted or reused as booking/payment authority; family/dependent access and clinical interpretation remain deferred.

An authenticated User may link an existing guest Patient history using either the browser's matching HttpOnly booking-session cookie together with JWT authentication, or a dedicated guest result token. Email and phone are not accepted as ownership proof. Linking updates the existing Patient association in place, revokes guest result grants after result proof, and does not merge or transfer booking/payment authority.

Admin and operations users can initiate server-owned provider matching, inspect the safe operational assignment projection, confirm an accepted provider response, and deliberately run stale-offer expiry. The frontend provides workflow controls and status visibility but never selects candidates or advances assignment/booking state itself.

Provider administration lets ADMIN/OPERATIONS list, create, inspect, edit, activate, suspend, link, and safely unlink provider profiles. Provider profiles remain distinct from user identities. Guarded, explicit user search exposes only minimized account and provider-link context, and linking sends only a deliberately selected user ID to the backend-authoritative role workflow.

Unlinked providers can receive one-time setup invitations. Creation reports whether email was sent or a provider-neutral manual fallback is required; fallback links remain ephemeral and are never reconstructed from history. The public setup route validates the link, creates the provider account with a new password, and then requires normal login.
