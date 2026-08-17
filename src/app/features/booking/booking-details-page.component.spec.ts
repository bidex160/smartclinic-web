import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingDetailsPageComponent } from './booking-details-page.component';
import { BookingFlowStateService } from './booking-flow-state.service';

describe('BookingDetailsPageComponent', () => {
  let component: BookingDetailsPageComponent;
  let state: BookingFlowStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    state = TestBed.inject(BookingFlowStateService);
    state.selectPackage({
      id: 'package-id',
      code: 'API_PACKAGE',
      name: 'Package',
      description: null,
      isActive: true,
    });
    state.selectFulfilmentMode({ id: 'mode-id', code: 'API_MODE', name: 'Mode', isActive: true });
    component = TestBed.createComponent(BookingDetailsPageComponent).componentInstance;
  });

  it('rejects missing required details and invalid optional formats', () => {
    component.form.controls.booker.patchValue({ email: 'not-an-email', phone: '12' });
    component.form.controls.participant.patchValue({
      givenName: '',
      familyName: '',
      email: 'invalid',
    });
    component.form.controls.preferences.patchValue({
      preferredTimeFrom: '12:00',
      preferredTimeTo: '09:00',
    });

    component.submitDetails();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.booker.controls.email.hasError('email')).toBe(true);
    expect(component.form.controls.preferences.hasError('timeOrder')).toBe(true);
    expect(state.details()).toBeNull();
  });

  it('copies booker identity and contact fields for a SELF participant', () => {
    component.form.controls.booker.setValue({
      givenName: 'Ada',
      familyName: 'Okafor',
      email: 'ada@example.test',
      phone: '+2348012345678',
    });
    component.form.controls.participant.controls.relationship.setValue('SELF');

    component.copyBookerToParticipant();

    expect(component.form.controls.participant.getRawValue()).toMatchObject({
      givenName: 'Ada',
      familyName: 'Okafor',
      email: 'ada@example.test',
      phone: '+2348012345678',
    });
  });
});
