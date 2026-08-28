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

The user sees API-provided benefits, estimated duration, and current prices by fulfilment mode. Selection is stored in the in-memory booking draft.

### 3. Select fulfilment mode

Show only modes supported for the selected package by the backend contract. Initial known modes are `PROVIDER_LOCATION` and `HOME_VISIT`. The UI may map codes to approved labels, but must not assume both modes are always available.

Both `HOME_VISIT` and `PROVIDER_LOCATION` collect a structured `visitAddress` (`addressLine1`, optional `addressLine2`, city, state/region, optional postal code, and country code) separately from optional additional directions. For a home visit it is the service destination; for provider-location fulfilment it is the patient's origin used for deterministic geographic matching. A later backend-returned ProviderLocation is the distinct appointment destination. The request never sends provider, provider-location, or service-area identifiers. Appointment date, start time, and IANA timezone remain required; package duration determines the appointment end.

The review page presents the structured address before confirmation. Draft address data remains in memory only and is never written to browser storage. Geographic matching is entirely server-authoritative.

Location, address, travel area, appointment time, and fee behavior remain subject to the API contract. Do not infer eligibility or calculate surcharges in the browser.

### 4. Enter details

Use typed Reactive Forms. Collect only fields required by the confirmed booking request. The patient supplies an appointment date, appointment start time, and visible IANA timezone; the patient does not select an end time. The selected package supplies expected duration, which the backend uses to derive the matching window. Separate participant information from booking/contact information in the UI if that distinction helps users and matches the contract.

Client validation should cover required input, basic formatting, and clear correction guidance. Backend validation remains authoritative. Sensitive draft values remain in memory and must not be persisted to web storage, embedded in URLs, or sent to analytics.

### 5. Review

Display a concise summary of package, fulfilment, participant, contact, price/schedule if authoritative, and any required acknowledgements. Provide edit actions that return to the owning step. Mask sensitive data where full display adds no value.

The final button should clearly state the consequence, such as **Submit booking**, rather than using a vague label. Submission happens only here and only once per user action.

### 6. Submit

Map the draft to the typed request and call `POST /api/v1/bookings`. While pending, prevent duplicate submission and announce status accessibly. On validation errors, return users to actionable fields without discarding input. On a transient error, preserve the draft and offer retry.

An idempotency mechanism is desirable but depends on backend support and must be agreed in the API contract.

### 7. Confirmation

Use the reference returned by the create response; do not generate one client-side. Display the reference, safe next steps, and approved contact/support information. Avoid showing unnecessary sensitive details.

Booking creation accepts the backend's `smartclinic_public_booking_session` HttpOnly cookie. On confirmation refresh, `GET /api/v1/public/bookings/:reference` sends browser credentials and restores the safe response only when that cookie owns the exact booking. The frontend never reads or models the session token, and a reference alone never authorizes disclosure.

The confirmation page can explicitly call `POST /api/v1/public/bookings/:reference/funding/initialize` using the same booking session. It sends no amount or currency. Once funding is ready, `POST /api/v1/public/bookings/:reference/payment/initiate` returns only a safe provider-neutral payment reference/status, amount/currency, and Paystack-hosted checkout URL. The user must deliberately choose **Continue to secure payment**; the frontend never constructs provider URLs or sends prices, references, or provider keys.

A Paystack browser redirect is not proof of payment. Signed webhook handling and independent server verification are authoritative. On refresh or a future configured return, the confirmation page securely re-reads the booking through the HttpOnly public-booking session and displays only the backend booking status. No payment-return route is implemented until `PAYSTACK_CALLBACK_URL` is configured to a compatible frontend URL.

The confirmation page securely reads `GET /api/v1/public/bookings/:reference/payment-status` on entry. It presents provider-neutral payment, funding, and booking states rather than interpreting redirect query parameters. While payment is pending, the guest may deliberately invoke `POST /api/v1/public/bookings/:reference/payment-status/refresh`; the backend chooses and verifies the latest attempt. There is no automatic polling or mutation retry. A `429` asks the guest to wait before another check without disclosing the configured interval.

Only `SUCCEEDED` is presented as **Payment confirmed**. A confirmed payment may move a booking to `PENDING_PROVIDER_MATCH`, which means matching can begin—not that a provider has already been assigned. Failed or cancelled attempts may start a fresh explicit payment initialization; an old checkout URL is not reused after terminal status.

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

Package, fulfilment, details, review, submission, secure confirmation recovery, guest funding initialization, explicit hosted-checkout handoff, and manual payment reconciliation are implemented. SELF uses an explicit copy action from booker to participant fields so the user can review and edit the result; it does not silently synchronize fields. Public packages contain catalogue information rather than global Provider prices. The pre-create review therefore shows no estimate: booking creation commercially binds an eligible ProviderService and returns the immutable `quotedAmount`/currency snapshot used by funding. Review explicitly maps valid state to the public request contract without price fields and submits only after confirmation. Draft state remains memory-only; the successful response can be reconstructed from the cookie-authorized backend endpoint.

## Open product and UI decisions

- Whether preparation guidance will be added to the package catalogue.
- Exact booking request fields and which relate to the participant versus the booking contact.
- Whether one person may book for another, and requirements for minors or dependants.
- Whether authentication, identity verification, consent, or terms acceptance is required.
- Provider-location selection, home-visit service-area checks, address capture, and map/provider dependencies.
- Pricing, taxes, home-visit fees, promotions, payment timing, refunds, and cancellation/rescheduling.
- User-facing copy and approved mappings for package and fulfilment codes.
- Which future user-assisted recovery mechanism applies after the public booking session expires.
- Support/contact routes and operational escalation for failed or ambiguous submissions.
- Brand identity, imagery, typography, tone, localization, and supported languages.
- Analytics/consent requirements and the events permitted without health data.
