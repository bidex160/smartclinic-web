import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import {
  PublicBookingFundingResult,
  PublicBookingPaymentInitiationResult,
  PublicBookingPaymentStatus,
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
    visitAddressSummary: null,
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
  const payment: PublicBookingPaymentInitiationResult = {
    bookingReference: 'SC-REF',
    fundingStatus: 'PENDING',
    checkoutOption: 'PAY_NOW',
    paymentAttemptReference: 'SC-PAY-safe',
    status: 'AWAITING_CUSTOMER_ACTION',
    amount: '12500.00',
    currency: 'NGN',
    checkoutUrl: 'https://checkout.paystack.com/pay/safe',
    accessCode: 'access-code-safe',
  };
  const pendingStatus: PublicBookingPaymentStatus = {
    bookingReference: 'SC-REF',
    bookingStatus: 'AWAITING_FUNDING',
    fundingStatus: 'PENDING',
    checkoutOption: 'PAY_NOW',
    paymentStatus: 'PENDING_CONFIRMATION',
    paymentAttemptReference: 'SC-PAY-safe',
    amount: '12500.00',
    currency: 'NGN',
    paidAt: null,
    bookingTotal: '12500.00',
    pointsReserved: 0,
    pointsAmount: '0.00',
    remainingExternalAmount: '12500.00',
    redemptionStatus: null,
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
    expect(fixture.nativeElement.textContent).toContain('funding obligation is ready');
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

  it('initializes payment once and opens the access-code Paystack Popup', async () => {
    const pending = new Subject<PublicBookingPaymentInitiationResult>();
    const { fixture, api, resumeTransaction } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () => pending,
    });

    fixture.componentInstance.initiatePayment();
    fixture.componentInstance.initiatePayment();
    expect(api.initiatePayment).toHaveBeenCalledTimes(1);
    expect(api.initiatePayment).toHaveBeenCalledWith('SC-REF', 'PAY_NOW');
    expect(fixture.componentInstance.paymentPending()).toBe(true);

    pending.next(payment);
    pending.complete();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedCheckoutOption()).toBe('PAY_NOW');
    expect(resumeTransaction).toHaveBeenCalledWith('access-code-safe', expect.any(Object));
    expect(fixture.nativeElement.textContent).not.toContain('Payment successful');
  });

  it('rejects an invalid or non-HTTPS checkout URL and permits retry', async () => {
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () =>
        of({
          ...payment,
          checkoutOption: 'PAYMENT_LINK',
          checkoutUrl: 'javascript:alert(1)',
          accessCode: null,
        }),
    });

    fixture.componentInstance.initiatePayment('PAYMENT_LINK');
    fixture.detectChanges();

    expect(fixture.componentInstance.checkoutUrl()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Continue to secure payment');
    expect(fixture.nativeElement.textContent).toContain('Pay securely');
    expect(fixture.nativeElement.textContent).toContain('incomplete response');
  });

  it('hands off payment using only the backend-returned access code', async () => {
    const { fixture, resumeTransaction, navigateExternal } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () => of(payment),
    });
    fixture.componentInstance.initiatePayment();

    expect(resumeTransaction).toHaveBeenCalledWith('access-code-safe', expect.any(Object));
    expect(navigateExternal).not.toHaveBeenCalled();
  });

  it('creates a shareable payment link without opening the Popup', async () => {
    const linkPayment: PublicBookingPaymentInitiationResult = {
      ...payment,
      checkoutOption: 'PAYMENT_LINK',
      accessCode: null,
    };
    const { fixture, api, resumeTransaction } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () => of(linkPayment),
    });

    fixture.componentInstance.selectCheckoutOption('PAYMENT_LINK');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Create payment link');
    fixture.componentInstance.initiatePayment();
    fixture.detectChanges();

    expect(api.initiatePayment).toHaveBeenCalledWith('SC-REF', 'PAYMENT_LINK');
    expect(resumeTransaction).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Payment link ready');
    expect(fixture.nativeElement.textContent).toContain('does not give them access');
  });

  it('copies a generated payment link with accessible feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () => of({ ...payment, checkoutOption: 'PAYMENT_LINK', accessCode: null }),
    });
    fixture.componentInstance.initiatePayment('PAYMENT_LINK');
    await fixture.componentInstance.copyPaymentLink();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('https://checkout.paystack.com/pay/safe');
    expect(fixture.nativeElement.textContent).toContain('Payment link copied');
  });

  it('saves PAY_LATER with nullable attempt data and supports later collection options', async () => {
    const payLater: PublicBookingPaymentInitiationResult = {
      bookingReference: 'SC-REF',
      fundingStatus: 'PENDING',
      checkoutOption: 'PAY_LATER',
      paymentAttemptReference: null,
      status: null,
      amount: '12500.00',
      currency: 'NGN',
      checkoutUrl: null,
      accessCode: null,
    };
    const { fixture, api, resumeTransaction } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: (_reference, option) =>
        option === 'PAY_LATER'
          ? of(payLater)
          : option === 'PAYMENT_LINK'
            ? of({ ...payment, checkoutOption: 'PAYMENT_LINK', accessCode: null })
            : of(payment),
    });

    fixture.componentInstance.initiatePayment('PAY_LATER');
    fixture.detectChanges();
    expect(api.initiatePayment).toHaveBeenCalledWith('SC-REF', 'PAY_LATER');
    expect(resumeTransaction).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Booking saved — payment still required');
    expect(fixture.nativeElement.textContent).toContain('No provider or appointment capacity');

    fixture.componentInstance.initiatePayment('PAY_NOW');
    expect(api.initiatePayment).toHaveBeenCalledWith('SC-REF', 'PAY_NOW');
    fixture.componentInstance.initiatePayment('PAYMENT_LINK');
    expect(api.initiatePayment).toHaveBeenCalledWith('SC-REF', 'PAYMENT_LINK');
  });

  it('does not expose payment choices after authoritative settlement', async () => {
    const { fixture, api } = await setup({
      initial: { ...confirmation, status: 'PENDING_PROVIDER_MATCH' },
      paymentStatus: () =>
        of({
          ...pendingStatus,
          fundingStatus: 'SETTLED',
          paymentStatus: 'SUCCEEDED',
          bookingStatus: 'PENDING_PROVIDER_MATCH',
        }),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Payment options');
    fixture.componentInstance.initiatePayment('PAY_LATER');
    expect(api.initiatePayment).not.toHaveBeenCalled();
  });

  it('ignores payment-looking query parameters and re-reads authoritative booking state', async () => {
    const authoritative = { ...confirmation, status: 'AWAITING_FUNDING' };
    const { fixture, api } = await setup({
      recovery: () => of(authoritative),
      paymentStatus: () => of(pendingStatus),
    });
    fixture.detectChanges();

    expect(api.getPublicBooking).toHaveBeenCalledWith('SC-REF');
    expect(api.getPaymentStatus).toHaveBeenCalledWith('SC-REF');
    expect(fixture.nativeElement.textContent).toContain('AWAITING_FUNDING');
    expect(fixture.nativeElement.textContent).not.toContain('Payment successful');
  });

  it.each([401, 403])(
    'sanitizes a %i session failure during payment initiation',
    async (status) => {
      const { fixture } = await setup({
        initial: { ...confirmation, status: 'AWAITING_FUNDING' },
        payment: () => throwError(() => new HttpErrorResponse({ status })),
      });
      fixture.componentInstance.initiatePayment();

      expect(fixture.componentInstance.paymentError()).toContain(
        'booking session is no longer available',
      );
    },
  );

  it('sanitizes provider and network failures and allows retry', async () => {
    let attempts = 0;
    const { fixture, api } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      payment: () => {
        attempts += 1;
        return attempts === 1
          ? throwError(
              () =>
                new HttpErrorResponse({
                  status: 503,
                  error: { message: 'raw Paystack upstream secret detail' },
                }),
            )
          : of(payment);
      },
    });
    fixture.componentInstance.initiatePayment();

    expect(fixture.componentInstance.paymentError()).toContain('temporarily unavailable');
    expect(fixture.componentInstance.paymentError()).not.toContain('Paystack upstream');
    fixture.componentInstance.initiatePayment();
    expect(api.initiatePayment).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.paymentResult()?.accessCode).toBe('access-code-safe');
  });

  it('renders confirmed payment, paid time, amount, and authoritative booking state', async () => {
    const succeeded: PublicBookingPaymentStatus = {
      ...pendingStatus,
      bookingStatus: 'PENDING_PROVIDER_MATCH',
      fundingStatus: 'SETTLED',
      paymentStatus: 'SUCCEEDED',
      paidAt: '2026-08-18T10:00:00.000Z',
    };
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'PENDING_PROVIDER_MATCH' },
      paymentStatus: () => of(succeeded),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Payment confirmed');
    expect(text).toContain('Funding settled');
    expect(text).toContain('NGN 12500.00');
    expect(text).toContain('Pending Provider Match');
    expect(text).toContain('Aug');
    expect(text).toContain('provider has not yet been assigned');
  });

  it.each([
    ['PENDING_CONFIRMATION', 'Payment pending'],
    ['FAILED', 'Payment failed'],
    ['CANCELLED', 'Payment cancelled'],
  ] as const)('renders %s using the safe label %s', async (paymentStatus, label) => {
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      paymentStatus: () => of({ ...pendingStatus, paymentStatus }),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(label);
    expect(fixture.nativeElement.textContent).not.toContain(paymentStatus);
  });

  it('refreshes payment status manually and prevents duplicate refresh requests', async () => {
    const refresh = new Subject<PublicBookingPaymentStatus>();
    const succeeded = {
      ...pendingStatus,
      bookingStatus: 'PENDING_PROVIDER_MATCH',
      fundingStatus: 'SETTLED' as const,
      paymentStatus: 'SUCCEEDED' as const,
    };
    const { fixture, api } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      paymentStatus: () => of(pendingStatus),
      paymentStatusRefresh: () => refresh,
    });

    fixture.componentInstance.checkPaymentStatus();
    fixture.componentInstance.checkPaymentStatus();
    expect(api.refreshPaymentStatus).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.paymentStatusRefreshing()).toBe(true);

    refresh.next(succeeded);
    refresh.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Payment confirmed');
    expect(fixture.nativeElement.textContent).toContain('Pending Provider Match');
  });

  it('handles payment verification throttling without exposing interval details', async () => {
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      paymentStatus: () => of(pendingStatus),
      paymentStatusRefresh: () => throwError(() => new HttpErrorResponse({ status: 429 })),
    });
    fixture.componentInstance.checkPaymentStatus();

    expect(fixture.componentInstance.paymentStatusError()).toBe(
      'Payment status was checked recently. Please wait a moment before checking again.',
    );
  });

  it.each([401, 403])('sanitizes a %i payment-status session error', async (status) => {
    const { fixture } = await setup({
      initial: confirmation,
      paymentStatus: () => throwError(() => new HttpErrorResponse({ status })),
    });

    expect(fixture.componentInstance.paymentStatusError()).toContain(
      'booking session is no longer available',
    );
  });

  it('sanitizes provider verification failures', async () => {
    const { fixture } = await setup({
      initial: { ...confirmation, status: 'AWAITING_FUNDING' },
      paymentStatus: () => of(pendingStatus),
      paymentStatusRefresh: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              error: { message: 'raw provider reconciliation detail' },
            }),
        ),
    });
    fixture.componentInstance.checkPaymentStatus();

    expect(fixture.componentInstance.paymentStatusError()).toContain('temporarily unavailable');
    expect(fixture.componentInstance.paymentStatusError()).not.toContain('raw provider');
  });

  it('does not start automatic payment polling', async () => {
    const { fixture, api } = await setup({
      initial: confirmation,
      paymentStatus: () => of(pendingStatus),
    });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(api.getPaymentStatus).toHaveBeenCalledTimes(1);
    expect(api.refreshPaymentStatus).not.toHaveBeenCalled();
  });

  async function setup(
    options: {
      initial?: PublicBookingResponse;
      recovery?: () => ReturnType<BookingsApiService['getPublicBooking']>;
      funding?: () => ReturnType<BookingsApiService['initializeFunding']>;
      payment?: (
        ...args: Parameters<BookingsApiService['initiatePayment']>
      ) => ReturnType<BookingsApiService['initiatePayment']>;
      paymentStatus?: () => ReturnType<BookingsApiService['getPaymentStatus']>;
      paymentStatusRefresh?: () => ReturnType<BookingsApiService['refreshPaymentStatus']>;
    } = {},
  ) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const navigateExternal = vi.fn();
    const api = {
      getPublicBooking: vi.fn(options.recovery ?? (() => of(confirmation))),
      initializeFunding: vi.fn(options.funding ?? (() => of(funding))),
      initiatePayment: vi.fn(options.payment ?? (() => of(payment))),
      getPaymentStatus: vi.fn(
        options.paymentStatus ??
          (() =>
            of({
              ...pendingStatus,
              fundingStatus: null,
              paymentStatus: null,
              paymentAttemptReference: null,
            })),
      ),
      refreshPaymentStatus: vi.fn(options.paymentStatusRefresh ?? (() => of(pendingStatus))),
    };
    await TestBed.configureTestingModule({
      imports: [BookingConfirmationPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ reference: 'SC-REF' }),
              queryParamMap: convertToParamMap({ reference: 'fake', status: 'success' }),
            },
          },
        },
        { provide: Router, useValue: router },
        { provide: BookingsApiService, useValue: api },
        { provide: EXTERNAL_NAVIGATOR, useValue: navigateExternal },
      ],
    }).compileComponents();
    const state = TestBed.inject(BookingFlowStateService);
    if (options.initial) state.completeBooking(options.initial);
    const fixture = TestBed.createComponent(BookingConfirmationPageComponent);
    const resumeTransaction = vi.fn();
    fixture.componentInstance.popup.resumeTransaction = resumeTransaction;
    return {
      fixture,
      state,
      api,
      router,
      navigateExternal,
      resumeTransaction,
    };
  }
});
