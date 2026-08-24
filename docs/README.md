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

The Angular foundation uses standalone components, strict TypeScript, routing, SCSS, Tailwind CSS, signals, Reactive Forms, and `HttpClient`. The public booking journey covers API-backed package, pricing, and fulfilment selection, in-memory details, review, deliberate submission, secure confirmation recovery, and authoritative funding/payment status. Guests can pay now through the existing Paystack Popup, create an ephemeral hosted payment link for another payer, or save the same booking to pay later. Catalogue prices are displayed but never submitted; confirmation uses the server-returned quote snapshot. The backend-managed HttpOnly public-booking session authorizes recovery, option selection, status reads, and deliberate reconciliation without exposing a session token to JavaScript. Popup callbacks, copied/opened links, and redirects are never treated as proof of payment.

Organisation funding, wallet balances and ledgers, explicit external-payer identity, automatic pay-later expiry, and email/SMS delivery of payment links remain deferred.

The first authenticated operations feature provides ADMIN/OPERATIONS login and guarded package-price management. Access tokens remain in memory, while an HttpOnly refresh cookie restores the session once at startup and supports single-flight `401` recovery. The feature lists, filters, creates, schedules, and deactivates prices and provides explicit session logout without browser-storage tokens or unrelated administration features.

Operations has a guarded provider-matching intervention queue. Normal matching begins automatically after payment; the queue preserves backend ordering/readiness, supports server-side filters and pagination, retries unfulfillable bookings deliberately, and links active/accepted offers into assignment management.

The public shell is role-aware without changing authorization: guests see booking, provider acquisition, and sign-in actions; authenticated users see only entitled patient, provider, or operations portal destinations. The provider portal now has responsive workspace navigation, a dashboard composed from the existing provider profile/offers APIs, actionable offers, and a separate confirmed appointments view. Pending providers retain setup access while operational work remains gated by backend status and existing guards.

User-facing appointment dates and times are formatted for readability while transport values remain unchanged. Requested appointments remain distinct from confirmed appointments. Forms retain visible labels and use examples or instructions as secondary placeholders where useful.

A guarded operational booking detail links queue rows with provider assignments. It presents only the backend's safe operational projection and contains controlled retry, selected-provider assignment, audited override, and reassignment tools. Provider discovery in the browser is bounded and descriptive; the backend remains authoritative for eligibility and capacity.

Operations can now formally schedule a confirmed provider assignment. Preferred scheduling remains clearly requested context; an explicit backend-validated action creates the authoritative `SCHEDULED` appointment. Provider-location bookings use active linked location choices, while home visits send no location. Patient and provider views display the returned confirmed appointment separately, and encounter start is offered only after scheduled eligibility is verified. Rescheduling remains deferred.

The first provider self-service feature reuses that session infrastructure for explicit `PROVIDER` role access. Providers can list and filter only their own safe offer projections, inspect an offer, and deliberately accept or decline an actionable assignment. The frontend never models or renders patient contact details, health data, location notes, provider internals, or matching internals.

Confirmed assignments now open a provider-only Smart Health Check encounter for the six initial measurements. Providers explicitly start, save, review, and complete the encounter; server-returned units and timestamps are authoritative, and completed measurements are read-only. Clinical interpretation remains deferred.

Authenticated Patient-linked Users can review their backend-scoped, paginated Smart Health Check history and open results only where `hasCompletedResult` is true. Multi-role accounts use the same `/me` scope, and empty/unlinked accounts receive one neutral empty state. Completed measurement results remain available through two deliberately separate paths: authenticated ownership by booking reference or exactly one guest result through a dedicated opaque token. The guest token is not persisted or reused as booking/payment authority; family/dependent access and clinical interpretation remain deferred.

Standard users can now register, sign in, and use a dedicated patient portal for their safe SELF Patient profile, SmartClinic Patient ID, category-grouped Health Check history, booking details, completed results, and new authenticated SELF bookings. Registration never fabricates a session, and the public Patient ID is not a password or record-access credential. Registered payment remains deferred, as do guest longitudinal history, guest Patient claiming, family/dependent access, provider Patient-ID consent access, password reset, and profile editing.

An authenticated User may link an existing guest Patient history using either the browser's matching HttpOnly booking-session cookie together with JWT authentication, or a dedicated guest result token. Email and phone are not accepted as ownership proof. Linking updates the existing Patient association in place, revokes guest result grants after result proof, and does not merge or transfer booking/payment authority.

Admin and operations users can initiate server-owned provider matching, inspect the safe operational assignment projection, confirm an accepted provider response, and deliberately run stale-offer expiry. The frontend provides workflow controls and status visibility but never selects candidates or advances assignment/booking state itself.

Provider administration lets ADMIN/OPERATIONS list, create, inspect, edit, activate, suspend, link, and safely unlink provider profiles. Provider profiles remain distinct from user identities. Guarded, explicit user search exposes only minimized account and provider-link context, and linking sends only a deliberately selected user ID to the backend-authoritative role workflow.

Provider onboarding supports operations create-and-invite and public self-registration. Both create pending provider identities and accounts without implying eligibility. Authenticated providers can maintain their permitted profile, services, physical locations, service-location links, weekly availability, and exceptions, then explicitly submit or resubmit for review. The provider profile's backend readiness projection drives submission guidance; the browser does not reproduce its rules.

Operations reviews provider-submitted configuration, including read-only HOME_VISIT service areas, approves or rejects onboarding, controls suspension/reactivation, and retains configuration tools for exceptional support. Providers maintain deterministic state/city/postal service-area scopes themselves. Approval and operational ACTIVE status remain backend-owned and distinct from account creation or readiness. The matching backend remains authoritative for geography, booking windows, exceptions, capacity, and eligibility; maps, geocoding, radius, routing, and GIS are not implemented.
