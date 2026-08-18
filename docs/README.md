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

The first provider self-service feature reuses that session infrastructure for explicit `PROVIDER` role access. Providers can list and filter only their own safe offer projections, inspect an offer, and deliberately accept or decline an actionable assignment. The frontend never models or renders patient contact details, health data, location notes, provider internals, or matching internals.

Admin and operations users can initiate server-owned provider matching, inspect the safe operational assignment projection, confirm an accepted provider response, and deliberately run stale-offer expiry. The frontend provides workflow controls and status visibility but never selects candidates or advances assignment/booking state itself.
