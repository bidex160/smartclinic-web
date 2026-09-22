# Patient-to-care network: agreed direction and implementation gaps

22 September 2026. Goal: help a mother find who can see her, when, and where, with continuity between virtual and local physical care.

## Existing implementation inspected

- Independent providers can register, complete onboarding profiles and submit for review. Profile fields include name, contact, professional reference, provider type and location.
- Provider services, physical locations, availability, care requests, appointments and consultation records exist.
- Platform-admin provider invitations exist. They are not hospital-admin doctor affiliations.
- Clinical orders include a REFERRAL enum value, but no complete specialist-referral creation/routing/acceptance workflow was found. Network referrals and rewards are a separate feature.
- No structured specialty catalogue, public doctor photo/logo fields or provider photo-upload flow was found in the inspected onboarding contracts. Clinical attachment upload is not a public profile-photo mechanism.

## Small addition implemented now

The consultation record editor has a specialist-referral note builder, including ENT and 21 other specialty suggestions plus free text. The doctor enters the destination, reason and next steps, then explicitly adds the note to the existing plan and saves through the existing clinical-record workflow. Existing plan text is preserved; the combined 10,000-character limit is enforced. It makes no claim that a referral has been sent, accepted, booked or that a specialist is available. No clinical details are put in URLs or local storage.

## Preserve these product decisions for subsequent work

1. One doctor profile can support independent work and multiple mutually accepted hospital/health-station affiliations. Hospital administrators invite doctors who accept or link an existing account; avoid duplicate identities and overlapping schedules.
2. Doctors upload their own profile photos; verified facility administrators upload logos. Add dedicated validated image storage, removal/replacement and public-image response contracts before showing upload controls.
3. Build a verified hospital directory that distinguishes listed/unconnected facilities from connected facilities and service-specific booking/payment availability. Saving a hospital must not imply record linkage or an appointment. Seed verified names/locations/logos with provenance and duplicate matching; do not claim all tertiary hospitals are already present.
4. Discover by selected state/city, with optional location permission and nationwide name search.
5. Participating pharmacies may act as health stations for explicitly configured services. Doctor/station partnership requires mutual acceptance, suitable staff/equipment, location-specific schedules and clear responsibility. A pharmacy listing alone enables no additional clinical services.
6. Full specialist referrals need structured specialty/provider search, clinician-entered reason and timing, patient-authorised sharing, recipient acceptance/rejection, booking, status tracking, result/feedback return, audit and role isolation. Do not equate the new note helper with this handoff.

## Suggested next implementation slice

Structured public provider profiles and a dedicated image upload path, then doctor/facility affiliation invitations and specialty-based discovery. Follow with actual referral handoffs and health-station appointments once recipient permissions and availability are represented. Keep the patient journey: find suitable care, select a time, receive confirmation, attend, and see the next step.

Validation for this addition: four focused tests pass (ENT selection and plan preservation, custom specialties/blank-input validation, combined length limit, and disabled state). Production build passes with existing budget/unused-import warnings. No referral was sent, no live patient data changed, and this addition has not been deployed or browser-tested.

## Public profile image follow-up — 22 September 2026

Implemented after the initial gap review: provider setup now supports public photo/logo upload, replacement and removal through a dedicated API endpoint. Images appear on doctor-selection and hospital-selection/connection cards, with initials when missing or broken. Facilities use an uncropped logo fit. Upload requires a separate explicit public-image action, accepts JPEG/PNG/WebP up to 5 MB, blocks duplicate submissions and preserves the existing image on failure. Identity/approval rules remain unchanged. No real photos, hospital logos or directory records were invented or preloaded.

The backend adds nullable provider image columns and requires its new migration and configured Cloudinary storage before rollout. Details and rollback instructions are in the backend `docs/provider-profile-images.md`. Hospital doctor invitations, affiliations, specialty matching and routed clinical referrals remain future work. This supersedes only the image-upload gap above.

Validation: frontend build passes with existing warnings; 22 focused image-editor/care-discovery tests pass. Public storage, mobile appearance and the full deployed image lifecycle still need live verification.

Follow-up contract/fallback run: nine tests passed across image editor, onboarding API and avatar suites (five overlap with the earlier run; 26 unique frontend tests passed across the four focused suites). Backend has 44 focused passing tests.
