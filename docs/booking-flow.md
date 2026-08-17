# Booking Flow

## Journey

```text
Home
  → Package
  → Fulfilment
  → Details
  → Review
  → Submit
  → Confirmation/reference
```

The journey should feel like a short sequence of decisions rather than a large form. Each step has one primary task, a clear heading, an indication of progress, and a safe way back without losing the in-memory draft.

## Step responsibilities

### 1. Home

Explain the Smart Health Check proposition in approved, non-diagnostic language. The dominant **Book My Smart Health Check** CTA routes to package selection. Do not force account creation unless the product and backend require it.

### 2. Select package

Fetch `GET /api/v1/health-check-packages` on entry. Render only packages returned as available by the API. Initial known codes are `ESSENTIAL` and `COMPLETE`, but the UI must handle an empty catalogue and unknown future codes safely.

The user must understand meaningful API-provided differences such as included services, price, and duration, once the response contract defines them. Selection is stored in the in-memory booking draft.

### 3. Select fulfilment mode

Show only modes supported for the selected package by the backend contract. Initial known modes are `PROVIDER_LOCATION` and `HOME_VISIT`. The UI may map codes to approved labels, but must not assume both modes are always available.

Location, address, travel area, appointment time, and fee behavior remain subject to the API contract. Do not infer eligibility or calculate surcharges in the browser.

### 4. Enter details

Use typed Reactive Forms. Collect only fields required by the confirmed booking request. Separate participant information from booking/contact information in the UI if that distinction helps users and matches the contract.

Client validation should cover required input, basic formatting, and clear correction guidance. Backend validation remains authoritative. Sensitive draft values remain in memory and must not be persisted to web storage, embedded in URLs, or sent to analytics.

### 5. Review

Display a concise summary of package, fulfilment, participant, contact, price/schedule if authoritative, and any required acknowledgements. Provide edit actions that return to the owning step. Mask sensitive data where full display adds no value.

The final button should clearly state the consequence, such as **Submit booking**, rather than using a vague label. Submission happens only here and only once per user action.

### 6. Submit

Map the draft to the typed request and call `POST /api/v1/bookings`. While pending, prevent duplicate submission and announce status accessibly. On validation errors, return users to actionable fields without discarding input. On a transient error, preserve the draft and offer retry.

An idempotency mechanism is desirable but depends on backend support and must be agreed in the API contract.

### 7. Confirmation

Use the reference returned by the create response; do not generate one client-side. Display the reference, safe next steps, and approved contact/support information. Avoid showing unnecessary sensitive details.

If confirmation is refreshed, `GET /api/v1/bookings/:reference` may restore displayable state only if the backend defines suitable authorization and response minimization. A reference alone should not be assumed to authorize disclosure.

## Proposed feature components

```text
features/
├── home/
│   └── HomePageComponent
├── health-check/
│   ├── PackageSelectionPageComponent
│   └── HealthCheckPackageCardComponent
└── booking/
    ├── BookingShellComponent
    ├── BookingProgressComponent
    ├── FulfilmentSelectionPageComponent
    ├── FulfilmentModeCardComponent
    ├── BookingDetailsPageComponent
    ├── ParticipantDetailsFormComponent
    ├── BookingContactFormComponent
    ├── BookingReviewPageComponent
    ├── BookingSummaryComponent
    └── BookingConfirmationPageComponent
```

Only create these components when the implementation needs them. If the confirmed details form is small, fewer boundaries may be clearer.

## State transitions

The booking feature uses a root-provided, in-memory `BookingFlowStateService` with signals for the selected package, selected fulfilment mode, and form draft. Computed signals expose step access, booker/participant details, and preferences. Submission status and references will be added only with those future steps.

Derived signals should determine completed steps and the earliest valid route. Changing a package must clear any downstream mode or values that are no longer valid. This is UI consistency, not replacement business validation.

Refresh clears sensitive draft state by design for the initial implementation. Users arriving at an incomplete route are redirected to the earliest required step with a calm explanation.

Package, fulfilment, and details are implemented. SELF uses an explicit copy action from booker to participant fields so the user can review and edit the result; it does not silently synchronize fields. A valid details form is saved in memory and stops before review or submission.

## Open product and UI decisions

- Exact package response fields: price/currency, benefits, preparation, duration, availability, and supported fulfilment modes.
- Exact booking request fields and which relate to the participant versus the booking contact.
- Whether one person may book for another, and requirements for minors or dependants.
- Whether authentication, identity verification, consent, or terms acceptance is required.
- Provider-location selection, home-visit service-area checks, address capture, and map/provider dependencies.
- Whether date/time scheduling happens during booking or after submission.
- Pricing, taxes, home-visit fees, promotions, payment timing, refunds, and cancellation/rescheduling.
- User-facing copy and approved mappings for package and fulfilment codes.
- What confirmation and booking lookup may display, and what authorization protects it.
- Support/contact routes and operational escalation for failed or ambiguous submissions.
- Brand identity, imagery, typography, tone, localization, and supported languages.
- Analytics/consent requirements and the events permitted without health data.
