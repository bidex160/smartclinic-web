import { TestBed } from '@angular/core/testing';

import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { BookingDetailsDraft } from './booking-flow.models';
import { BookingFlowStateService } from './booking-flow-state.service';

describe('BookingFlowStateService', () => {
  let state: BookingFlowStateService;
  const healthCheckPackage: HealthCheckPackage = {
    id: 'package-one',
    code: 'API_PACKAGE',
    name: 'API package',
    description: null,
    benefits: [],
    estimatedDurationMinutes: null,
    prices: [
      {
        fulfilmentModeId: 'mode-one',
        fulfilmentModeCode: 'API_MODE',
        fulfilmentModeName: 'API mode',
        amount: '100.00',
        currency: 'API',
      },
    ],
    isActive: true,
  };
  const mode: FulfilmentMode = {
    id: 'mode-one',
    code: 'API_MODE',
    name: 'API mode',
    isActive: true,
  };
  const details: BookingDetailsDraft = {
    booker: { givenName: 'Ada', familyName: 'Okafor', email: '', phone: '+2348012345678' },
    participant: {
      relationship: 'SELF',
      givenName: 'Ada',
      familyName: 'Okafor',
      dateOfBirth: '',
      phone: '+2348012345678',
      email: '',
    },
    preferences: {
      preferredDate: '2026-08-20',
      preferredTimeFrom: '09:00',
      preferredTimeTo: '12:00',
      locationNote: '',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(BookingFlowStateService);
  });

  it('holds selections and details in signals and computed state', () => {
    expect(state.canAccessFulfilment()).toBe(false);
    state.selectPackage(healthCheckPackage);
    state.selectFulfilmentMode(mode);
    state.saveDetails(details);

    expect(state.selectedPackage()).toEqual(healthCheckPackage);
    expect(state.selectedFulfilmentMode()).toEqual(mode);
    expect(state.bookerDetails()?.givenName).toBe('Ada');
    expect(state.preferredDate()).toBe('2026-08-20');
    expect(state.canAccessDetails()).toBe(true);
  });

  it('clears downstream state when the package changes', () => {
    state.selectPackage(healthCheckPackage);
    state.selectFulfilmentMode(mode);
    state.saveDetails(details);
    state.selectPackage({ ...healthCheckPackage, id: 'package-two' });

    expect(state.selectedFulfilmentMode()).toBeNull();
    expect(state.details()).toBeNull();
  });
});
