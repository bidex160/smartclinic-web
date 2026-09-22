# Staging E2E fixes — 22 September 2026

Base: `5d30166` (`staging`). Local branch: `fix/staging-e2e-20260922`. These are local source changes, not a deployed fix.

- Admin provider create/edit forms now include Pharmacy.
- Lab/test selection runs discovery and clears any previous delivery/provider selection. General requests no longer inherit Virtual. Missing imaging or other requested catalogue services produce an explicit unavailable message.
- Discovery cancels obsolete requests, preserves the full delivery-mode list across filtered searches, blocks submission while pending/failed, and offers retry.
- Care and appointment detail headings no longer infer a doctor consultation from Virtual delivery alone.
- Connected hospital detail now actually loads its companion and supports retry. Cancelled/refund-review funding is not labelled Payment needed. Prescription links open the relevant order. Grouped wallet availability is respected in both the UI and action handler.
- Pay a Bill on home/dashboard leads to authenticated hospital selection and individual request payment review. Guest home links preserve the bills destination through login. This is hospital billing, not utility bill payment or arbitrary external invoice entry.
- The admin offer-expiry notice reflects the new backend scheduled worker and retains manual processing.

The backend remains authoritative for provider availability, allowed modes, prices and payments. A lack of approved providers or an absent imaging catalogue service is shown honestly and is not fabricated by the frontend.

Regression tests use controlled location-service fixtures rather than relying on a prewarmed browser cache. Existing authentication fixtures now include the required nullable networkRole field, allowing the staging tests to compile. Other pre-existing full-suite failures and live-test blockers are documented in the accompanying report.

No credentials, password defaults or real clinical results are included in this change. Test-account registration/access and provider-side lab/pharmacy/radiology execution still need live verification after deployment.

## Mobile presentation follow-up

Based on the supplied screenshots, the operations/provider dashboards now use compact metric grids, softer surfaces, clearer headers and distinct shortcut icons. The provider grid uses two columns on phones, retaining full labels. Care selection cards expose selection to assistive technology and show provider initials and the actual provider category instead of generic doctor emoji. Consultation wording no longer promises immediate availability.

Notifications use a viewport-inset mobile panel, an explicit close control, unread-count labelling and Escape focus restoration. Payment-received messaging no longer promises that an appointment is automatically confirmed. Existing booking state remains authoritative.

Validation: production build passed (existing bundle/style budget warnings remain). The focused care-discovery and notification suites passed all 20 tests, including three new keyboard/unread-state tests. Browser access to the local preview was blocked; responsive screenshot review and live mobile workflows remain pending. This is not a claim of visual or end-to-end perfection.

The dashboard test run produced seven passes and six existing provider-dashboard fixture failures (missing API configuration injection). Those failures also occur in the staging baseline; the admin dashboard suite passes. They remain an explicit review limitation.
