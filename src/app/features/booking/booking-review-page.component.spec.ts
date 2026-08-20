import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { PublicBookingResponse } from '../../core/models/public-booking.model';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingReviewPageComponent } from './booking-review-page.component';

describe('BookingReviewPageComponent', () => {
  const response: PublicBookingResponse = {
    bookingReference: 'SC-2026-REF',
    status: 'DRAFT',
    healthCheckPackage: { code: 'PACKAGE', name: 'Smart package' },
    fulfilmentMode: { code: 'MODE', name: 'Home option' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    quotedAmount: '12500.00',
    quotedCurrency: 'API',
    preferredDate: '2026-08-20',
    preferredTimeWindowStart: '09:00',
    preferredTimeWindowEnd: '12:00',
    preferredTimezone: 'Africa/Lagos',
    locationNote: null,
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
  };

  it('renders the complete review summary', async () => {
    const { fixture } = await setup(() => of(response));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Smart package');
    expect(text).toContain('Home option');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Confirm Smart Health Check');
    expect(text).toContain('Booking price shown before confirmation');
    expect(text).toContain('API 12500.00');
    expect(text).not.toContain('quotedAmount');
  });

  it('prevents duplicate submissions and stores a successful confirmation', async () => {
    const pending = new Subject<PublicBookingResponse>();
    const { fixture, api, state, router } = await setup(() => pending);
    fixture.componentInstance.confirmBooking();
    fixture.componentInstance.confirmBooking();

    expect(api.createPublicBooking).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.submitting()).toBe(true);
    pending.next(response);
    pending.complete();

    expect(state.confirmation()).toEqual(response);
    expect(router.navigate).toHaveBeenCalledWith(['/book/confirmation', 'SC-2026-REF']);
  });

  it('keeps the draft after failure and permits a deliberate manual retry', async () => {
    let attempt = 0;
    const { fixture, api, state } = await setup(() => {
      attempt += 1;
      return attempt === 1 ? throwError(() => new HttpErrorResponse({ status: 0 })) : of(response);
    });

    fixture.componentInstance.confirmBooking();
    expect(fixture.componentInstance.submissionError()).toContain('could not reach');
    expect(state.details()).not.toBeNull();
    fixture.componentInstance.confirmBooking();

    expect(api.createPublicBooking).toHaveBeenCalledTimes(2);
    expect(state.confirmation()).toEqual(response);
  });

  it('explains a 422 pricing failure without exposing backend internals', async () => {
    const { fixture } = await setup(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { message: 'No current catalogue price is available: internal detail' },
          }),
      ),
    );

    fixture.componentInstance.confirmBooking();

    expect(fixture.componentInstance.submissionError()).toBe(
      'Pricing is no longer available for this selection. Please choose another option.',
    );
    expect(fixture.componentInstance.submissionError()).not.toContain('internal detail');
  });

  async function setup(
    createResponse: () => ReturnType<BookingsApiService['createPublicBooking']>,
  ) {
    const api = { createPublicBooking: vi.fn(createResponse) };
    await TestBed.configureTestingModule({
      imports: [BookingReviewPageComponent],
      providers: [provideRouter([]), { provide: BookingsApiService, useValue: api }],
    }).compileComponents();
    const state = TestBed.inject(BookingFlowStateService);
    seedState(state);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return { fixture: TestBed.createComponent(BookingReviewPageComponent), api, state, router };
  }
});

function seedState(state: BookingFlowStateService): void {
  state.selectPackage({
    id: 'package-id',
    code: 'PACKAGE',
    name: 'Smart package',
    description: null,
    benefits: [],
    estimatedDurationMinutes: null,
    prices: [
      {
        fulfilmentModeId: 'mode-id',
        fulfilmentModeCode: 'MODE',
        fulfilmentModeName: 'Home option',
        amount: '12500.00',
        currency: 'API',
      },
    ],
    isActive: true,
  });
  state.selectFulfilmentMode({ id: 'mode-id', code: 'MODE', name: 'Home option', isActive: true });
  state.saveDetails({
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
      dateOfBirth: '',
      phone: '',
      email: '',
    },
    preferences: {
      preferredDate: '2026-08-20',
      preferredTimeFrom: '09:00',
      preferredTimeTo: '12:00',
      locationNote: '',
      preferredTimezone: '',
    },
  });
}
