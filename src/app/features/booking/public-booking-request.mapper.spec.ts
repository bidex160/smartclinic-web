import { TestBed } from '@angular/core/testing';

import { BookingFlowStateService } from './booking-flow-state.service';
import { mapBookingFlowToPublicBookingRequest } from './public-booking-request.mapper';

describe('mapBookingFlowToPublicBookingRequest', () => {
  it('maps catalogue IDs and form values into the public contract', () => {
    const state = createCompleteState();
    const request = mapBookingFlowToPublicBookingRequest(state);

    expect(request).toEqual({
      booker: {
        givenName: 'Ada',
        familyName: 'Okafor',
        email: 'ada@example.test',
        phone: '+2348012345678',
      },
      participant: {
        relationship: 'SELF',
        givenName: 'Ada',
        familyName: 'Okafor',
        dateOfBirth: '1990-01-01',
        phone: '+2348012345678',
        email: 'ada@example.test',
      },
      booking: {
        healthCheckPackageId: 'package-id',
        fulfilmentModeId: 'mode-id',
        preferredDate: '2026-08-20',
        preferredTimeFrom: '09:00',
        preferredTimezone: 'Africa/Lagos',
        locationNote: 'Front desk',
        visitAddress: {
          addressLine1: '1 Clinic Road',
          city: 'Ikeja',
          stateOrRegion: 'Lagos',
          countryCode: 'NG',
        },
      },
    });
  });

  it('omits optional empty strings instead of sending them', () => {
    const state = createCompleteState(true);
    const request = mapBookingFlowToPublicBookingRequest(state);

    expect(request.booker).not.toHaveProperty('email');
    expect(request.participant).not.toHaveProperty('dateOfBirth');
    expect(request.participant).not.toHaveProperty('phone');
    expect(request.participant).not.toHaveProperty('email');
    expect(request.booking).toEqual({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      preferredDate: '2026-08-20',
      preferredTimeFrom: '09:00',
      preferredTimezone: 'Africa/Lagos',
      visitAddress: {
        addressLine1: '1 Clinic Road',
        city: 'Ikeja',
        stateOrRegion: 'Lagos',
        countryCode: 'NG',
      },
    });
    expect(request.booking).not.toHaveProperty('quotedAmount');
    expect(request.booking).not.toHaveProperty('quotedCurrency');
    expect(request.booking).not.toHaveProperty('currency');
    expect(JSON.stringify(request)).not.toContain('quotedAmount');
    expect(JSON.stringify(request)).not.toContain('quotedCurrency');
  });

  it('omits visitAddress and provider/service identifiers for provider-location bookings', () => {
    const request = mapBookingFlowToPublicBookingRequest(
      createCompleteState(false, 'PROVIDER_LOCATION'),
    );
    expect(request.booking).not.toHaveProperty('visitAddress');
    expect(request.booking).not.toHaveProperty('serviceAreaId');
    expect(request.booking).not.toHaveProperty('providerId');
    expect(request.booking).not.toHaveProperty('providerLocationId');
  });
});

function createCompleteState(
  emptyOptional = false,
  modeCode = 'HOME_VISIT',
): BookingFlowStateService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  const state = TestBed.inject(BookingFlowStateService);
  state.selectPackage({
    id: 'package-id',
    code: 'PACKAGE',
    name: 'Package',
    description: null,
    benefits: [],
    estimatedDurationMinutes: null,
    prices: [],
    isActive: true,
  });
  state.selectFulfilmentMode({ id: 'mode-id', code: modeCode, name: 'Mode', isActive: true });
  state.saveDetails({
    booker: {
      givenName: ' Ada ',
      familyName: ' Okafor ',
      email: emptyOptional ? '  ' : 'ada@example.test',
      phone: ' +2348012345678 ',
    },
    participant: {
      relationship: 'SELF',
      givenName: ' Ada ',
      familyName: ' Okafor ',
      dateOfBirth: emptyOptional ? '' : '1990-01-01',
      phone: emptyOptional ? '' : '+2348012345678',
      email: emptyOptional ? '' : 'ada@example.test',
    },
    preferences: {
      preferredDate: '2026-08-20',
      preferredTimeFrom: '09:00',
      locationNote: emptyOptional ? ' ' : 'Front desk',
      preferredTimezone: 'Africa/Lagos',
    },
    visitAddress: {
      addressLine1: '1 Clinic Road',
      addressLine2: '',
      city: 'Ikeja',
      stateOrRegion: 'Lagos',
      postalCode: '',
      countryCode: 'NG',
    },
  });
  return state;
}
