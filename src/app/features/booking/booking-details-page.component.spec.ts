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
      benefits: [],
      estimatedDurationMinutes: null,
      prices: [],
      isActive: true,
    });
    state.selectFulfilmentMode({
      id: 'mode-id',
      code: 'HOME_VISIT',
      name: 'Home visit',
      isActive: true,
    });
    component = TestBed.createComponent(BookingDetailsPageComponent).componentInstance;
  });

  it('requires appointment date, start time, and timezone with no end-time control', () => {
    component.form.controls.booker.patchValue({ email: 'not-an-email', phone: '12' });
    component.form.controls.participant.patchValue({
      givenName: '',
      familyName: '',
      email: 'invalid',
    });
    component.form.controls.preferences.patchValue({
      preferredDate: '',
      preferredTimeFrom: '',
      preferredTimezone: '',
    });

    component.submitDetails();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.booker.controls.email.hasError('email')).toBe(true);
    expect(component.form.controls.preferences.controls.preferredDate.hasError('required')).toBe(
      true,
    );
    expect(
      component.form.controls.preferences.controls.preferredTimeFrom.hasError('required'),
    ).toBe(true);
    expect(
      component.form.controls.preferences.controls.preferredTimezone.hasError('required'),
    ).toBe(true);
    expect(component.form.get('preferences.preferredTimeTo')).toBeNull();
    expect(component.form.controls.visitAddress.controls.addressLine1.hasError('required')).toBe(
      true,
    );
    expect(state.details()).toBeNull();
  });

  it('shows the structured home-visit address and keeps directions supplemental', () => {
    const fixture = TestBed.createComponent(BookingDetailsPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Home visit address');
    expect(text).toContain('Additional directions');
    expect(fixture.nativeElement.querySelector('#visit-address-one')).not.toBeNull();
    expect(text).not.toContain('latitude');
    expect(text).not.toContain('service-area ID');
  });

  it('renders appointment labels without an end-time or optional scheduling copy', () => {
    const fixture = TestBed.createComponent(BookingDetailsPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Appointment date');
    expect(text).toContain('Appointment time');
    expect(text).toContain('Timezone');
    expect(fixture.nativeElement.querySelector('#preferred-time-to')).toBeNull();
    expect(text).not.toContain('preferences are optional');
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
