import { PublicBookingRequest } from '../../core/models/public-booking.model';
import { BookingFlowStateService } from './booking-flow-state.service';

function optional(value: string): string | undefined {
  const normalized = value.trim();
  return normalized || undefined;
}

export function mapBookingFlowToPublicBookingRequest(
  bookingFlow: BookingFlowStateService,
): PublicBookingRequest {
  const healthCheckPackage = bookingFlow.selectedPackage();
  const fulfilmentMode = bookingFlow.selectedFulfilmentMode();
  const details = bookingFlow.details();

  if (!healthCheckPackage || !fulfilmentMode || !details) {
    throw new Error('Cannot create a public booking request from incomplete booking state.');
  }

  return {
    booker: {
      givenName: details.booker.givenName.trim(),
      familyName: details.booker.familyName.trim(),
      ...(optional(details.booker.email) && { email: optional(details.booker.email) }),
      phone: details.booker.phone.trim(),
    },
    participant: {
      relationship: details.participant.relationship,
      givenName: details.participant.givenName.trim(),
      familyName: details.participant.familyName.trim(),
      ...(optional(details.participant.dateOfBirth) && {
        dateOfBirth: optional(details.participant.dateOfBirth),
      }),
      ...(optional(details.participant.phone) && { phone: optional(details.participant.phone) }),
      ...(optional(details.participant.email) && { email: optional(details.participant.email) }),
    },
    booking: {
      healthCheckPackageId: healthCheckPackage.id,
      fulfilmentModeId: fulfilmentMode.id,
      preferredDate: details.preferences.preferredDate.trim(),
      preferredTimeFrom: details.preferences.preferredTimeFrom.trim(),
      preferredTimezone: details.preferences.preferredTimezone.trim(),
      ...(optional(details.preferences.locationNote) && {
        locationNote: optional(details.preferences.locationNote),
      }),
      ...(['HOME_VISIT', 'PROVIDER_LOCATION'].includes(fulfilmentMode.code) && {
        visitAddress: {
          addressLine1: details.visitAddress.addressLine1.trim(),
          ...(optional(details.visitAddress.addressLine2) && {
            addressLine2: optional(details.visitAddress.addressLine2),
          }),
          city: details.visitAddress.city.trim(),
          stateOrRegion: details.visitAddress.stateOrRegion.trim(),
          ...(optional(details.visitAddress.postalCode) && {
            postalCode: optional(details.visitAddress.postalCode),
          }),
          countryCode: details.visitAddress.countryCode.trim().toUpperCase(),
        },
      }),
    },
  };
}
