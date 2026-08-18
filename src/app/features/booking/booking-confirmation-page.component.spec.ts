import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import {
  PublicBookingFundingResult,
  PublicBookingResponse,
} from '../../core/models/public-booking.model';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingConfirmationPageComponent } from './booking-confirmation-page.component';

describe('BookingConfirmationPageComponent', () => {
  const confirmation: PublicBookingResponse = {
    bookingReference: 'SC-REF',
    status: 'DRAFT',
    healthCheckPackage: { code: 'PACKAGE', name: 'Smart package' },
    fulfilmentMode: { code: 'MODE', name: 'Provider location' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    quotedAmount: '12500.00',
    quotedCurrency: 'NGN',
    preferredDate: null,
    preferredTimeWindowStart: null,
    preferredTimeWindowEnd: null,
    preferredTimezone: null,
    locationNote: null,
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
  };
  const funding: PublicBookingFundingResult = {
    bookingReference: 'SC-REF',
    fundingStatus: 'PENDING',
    attemptId: null,
    attemptStatus: null,
    amount: '12500.00',
    currency: 'NGN',
    paymentReference: null,
  };

  it('renders matching in-memory state immediately without a recovery lookup', async () => {
    const { fixture, state, api, router } = await setup({ initial: confirmation });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('SC-REF');
    expect(fixture.nativeElement.textContent).toContain('Smart package');
    expect(fixture.nativeElement.textContent).toContain('NGN 12500.00');
    expect(api.getPublicBooking).not.toHaveBeenCalled();

    fixture.componentInstance.bookAnother();
    expect(state.confirmation()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/health-check/packages']);
  });

  it('restores a refreshed confirmation through the secure booking API', async () => {
    const { fixture, api, state } = await setup({ recovery: () => of(confirmation) });
    fixture.detectChanges();

    expect(api.getPublicBooking).toHaveBeenCalledWith('SC-REF');
    expect(state.confirmation()).toEqual(confirmation);
    expect(fixture.nativeElement.textContent).toContain('Ada Okafor');
  });

  it('shows a safe recovery state for a missing or wrong booking session', async () => {
    const { fixture } = await setup({
      recovery: () => throwError(() => new HttpErrorResponse({ status: 401 })),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('booking session is no longer available');
    expect(fixture.nativeElement.textContent).not.toContain('Ada Okafor');
  });

  it('prevents duplicate funding requests and renders the authoritative result', async () => {
    const pending = new Subject<PublicBookingFundingResult>();
    const refreshed = { ...confirmation, status: 'AWAITING_FUNDING' };
    const { fixture, api } = await setup({
      initial: confirmation,
      funding: () => pending,
      recovery: () => of(refreshed),
    });

    fixture.componentInstance.initializeFunding();
    fixture.componentInstance.initializeFunding();
    expect(api.initializeFunding).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.fundingPending()).toBe(true);

    pending.next(funding);
    pending.complete();
    fixture.detectChanges();

    expect(api.getPublicBooking).toHaveBeenCalledWith('SC-REF');
    expect(fixture.nativeElement.textContent).toContain('Payment obligation prepared');
    expect(fixture.nativeElement.textContent).toContain('NGN 12500.00');
    expect(fixture.nativeElement.textContent).toContain('AWAITING_FUNDING');
    expect(fixture.nativeElement.textContent).toContain('checkout is not available yet');
  });

  it('allows a deliberate retry after funding initialization fails', async () => {
    let attempts = 0;
    const { fixture, api } = await setup({
      initial: confirmation,
      recovery: () => of({ ...confirmation, status: 'AWAITING_FUNDING' }),
      funding: () => {
        attempts += 1;
        return attempts === 1
          ? throwError(() => new HttpErrorResponse({ status: 0 }))
          : of(funding);
      },
    });

    fixture.componentInstance.initializeFunding();
    expect(fixture.componentInstance.fundingError()).toContain('No charge was made');
    fixture.componentInstance.initializeFunding();

    expect(api.initializeFunding).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.fundingResult()).toEqual(funding);
  });

  it('does not use browser storage for confirmation recovery or funding', async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { fixture } = await setup({ initial: confirmation, funding: () => of(funding) });
    fixture.componentInstance.initializeFunding();

    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  async function setup(
    options: {
      initial?: PublicBookingResponse;
      recovery?: () => ReturnType<BookingsApiService['getPublicBooking']>;
      funding?: () => ReturnType<BookingsApiService['initializeFunding']>;
    } = {},
  ) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const api = {
      getPublicBooking: vi.fn(options.recovery ?? (() => of(confirmation))),
      initializeFunding: vi.fn(options.funding ?? (() => of(funding))),
    };
    await TestBed.configureTestingModule({
      imports: [BookingConfirmationPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-REF' }) } },
        },
        { provide: Router, useValue: router },
        { provide: BookingsApiService, useValue: api },
      ],
    }).compileComponents();
    const state = TestBed.inject(BookingFlowStateService);
    if (options.initial) state.completeBooking(options.initial);
    return {
      fixture: TestBed.createComponent(BookingConfirmationPageComponent),
      state,
      api,
      router,
    };
  }
});
