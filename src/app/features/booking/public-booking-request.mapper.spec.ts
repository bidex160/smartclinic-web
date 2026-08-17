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
        preferredTimeTo: '12:00',
        locationNote: 'Front desk',
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
    });
  });
});

function createCompleteState(emptyOptional = false): BookingFlowStateService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  const state = TestBed.inject(BookingFlowStateService);
  state.selectPackage({
    id: 'package-id',
    code: 'PACKAGE',
    name: 'Package',
    description: null,
    isActive: true,
  });
  state.selectFulfilmentMode({ id: 'mode-id', code: 'MODE', name: 'Mode', isActive: true });
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
      preferredDate: emptyOptional ? '' : '2026-08-20',
      preferredTimeFrom: emptyOptional ? '' : '09:00',
      preferredTimeTo: emptyOptional ? '' : '12:00',
      locationNote: emptyOptional ? ' ' : 'Front desk',
    },
  });
  return state;
}
