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

The Angular foundation uses standalone components, strict TypeScript, routing, SCSS, Tailwind CSS, signals, Reactive Forms support, and `HttpClient`. The initial implementation includes the application shell, home page, API-backed package catalogue, and not-found route. The booking wizard remains intentionally unimplemented pending the outstanding product and API decisions.
