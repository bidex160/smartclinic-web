import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import {
  PublicBookingCheckoutOption,
  PublicBookingFundingResult,
  PublicBookingPaymentInitiationResult,
  PublicBookingPaymentStatus,
} from '../../core/models/public-booking.model';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';
import { safePaystackCheckoutUrl } from './paystack-checkout-url';
import PaystackPop from '@paystack/inline-js';

@Component({
  selector: 'app-booking-confirmation-page',
  templateUrl: './booking-confirmation-page.component.html',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmationPageComponent {
  popup = new PaystackPop();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly navigateExternal = inject(EXTERNAL_NAVIGATOR);
  readonly bookingFlow = inject(BookingFlowStateService);
  private readonly routeReference = this.route.snapshot.paramMap.get('reference');

  readonly recovering = signal(false);
  readonly recoveryError = signal<string | null>(null);
  readonly fundingPending = signal(false);
  readonly fundingError = signal<string | null>(null);
  readonly fundingResult = signal<PublicBookingFundingResult | null>(null);
  readonly paymentPending = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly paymentResult = signal<PublicBookingPaymentInitiationResult | null>(null);
  readonly checkoutUrl = signal<string | null>(null);
  readonly selectedCheckoutOption = signal<PublicBookingCheckoutOption>('PAY_NOW');
  readonly payLaterSaved = signal(false);
  readonly copyFeedback = signal<string | null>(null);
  readonly paymentStatusLoading = signal(false);
  readonly paymentStatusRefreshing = signal(false);
  readonly paymentStatusError = signal<string | null>(null);
  readonly authoritativePaymentStatus = signal<PublicBookingPaymentStatus | null>(null);

  readonly confirmation = computed(() => {
    const confirmation = this.bookingFlow.confirmation();
    return confirmation?.bookingReference === this.routeReference ? confirmation : null;
  });
  readonly canInitiatePayment = computed(
    () =>
      !this.isFundingSettled() &&
      (this.fundingResult() !== null || this.confirmation()?.status === 'AWAITING_FUNDING'),
  );
  readonly isFundingSettled = computed(
    () => this.authoritativePaymentStatus()?.fundingStatus === 'SETTLED',
  );
  readonly showCheckoutSection = computed(() => {
    if (this.isFundingSettled()) return false;
    if (this.checkoutUrl() || this.payLaterSaved()) return true;
    const status = this.authoritativePaymentStatus()?.paymentStatus;
    return (
      this.canInitiatePayment() &&
      status !== 'SUCCEEDED' &&
      status !== 'FAILED' &&
      status !== 'CANCELLED' &&
      status !== 'PENDING_CONFIRMATION'
    );
  });
  readonly paymentActionLabel = computed(() => {
    if (this.paymentPending()) {
      switch (this.selectedCheckoutOption()) {
        case 'PAYMENT_LINK':
          return 'Creating payment link…';
        case 'PAY_LATER':
          return 'Saving booking…';
        default:
          return 'Preparing secure payment…';
      }
    }
    switch (this.selectedCheckoutOption()) {
      case 'PAYMENT_LINK':
        return 'Create payment link';
      case 'PAY_LATER':
        return 'Save and pay later';
      default:
        return 'Pay securely';
    }
  });

  constructor() {
    if (this.confirmation()) this.loadPaymentStatus();
    else this.recoverConfirmation();
        this.route.queryParams.subscribe((params)=>{
      if(params['trxref']){
        const reference = this.route.snapshot.paramMap.get('reference')
        if(reference){
          console.log(reference)
          this.checkPaymentStatus(reference)
        }
      }
    })
  }

  recoverConfirmation(): void {
    if (!this.routeReference || this.recovering()) {
      if (!this.routeReference) {
        this.recoveryError.set('This booking is unavailable. Please start a new booking.');
      }
      return;
    }

    this.recovering.set(true);
    this.recoveryError.set(null);
    this.bookingsApi.getPublicBooking(this.routeReference).subscribe({
      next: (booking) => {
        this.bookingFlow.completeBooking(booking);
        this.recovering.set(false);
        this.loadPaymentStatus();
      },
      error: (error: unknown) => {
        this.recovering.set(false);
        this.recoveryError.set(this.recoveryMessage(error));
        this.focusErrorSummary();
      },
    });
  }

  initializeFunding(): void {
    const booking = this.confirmation();
    if (!booking || this.fundingPending()) return;

    this.fundingPending.set(true);
    this.fundingError.set(null);
    this.bookingsApi
      .initializeFunding(booking.bookingReference)
      .pipe(
        switchMap((result) =>
          this.bookingsApi.getPublicBooking(booking.bookingReference).pipe(
            map((refreshedBooking) => ({ result, refreshedBooking })),
            catchError(() => of({ result, refreshedBooking: null })),
          ),
        ),
      )
      .subscribe({
        next: ({ result, refreshedBooking }) => {
          this.fundingResult.set(result);
          if (refreshedBooking) this.bookingFlow.completeBooking(refreshedBooking);
          this.fundingPending.set(false);
        },
        error: (error: unknown) => {
          this.fundingPending.set(false);
          this.fundingError.set(this.fundingMessage(error));
          this.focusErrorSummary();
        },
      });
  }

  selectCheckoutOption(option: PublicBookingCheckoutOption): void {
    if (this.paymentPending() || this.isFundingSettled()) return;
    this.selectedCheckoutOption.set(option);
    this.paymentError.set(null);
    this.copyFeedback.set(null);
  }

  initiatePayment(option = this.selectedCheckoutOption()): void {
    const booking = this.confirmation();
    if (!booking || !this.canInitiatePayment() || this.paymentPending() || this.isFundingSettled())
      return;

    this.selectedCheckoutOption.set(option);
    this.paymentPending.set(true);
    this.paymentError.set(null);
    this.copyFeedback.set(null);
    this.checkoutUrl.set(null);
    this.payLaterSaved.set(false);
    this.bookingsApi.initiatePayment(booking.bookingReference, option).subscribe({
      next: (result) => {
        this.paymentPending.set(false);
        this.paymentResult.set(result);
        if (
          result.bookingReference !== booking.bookingReference ||
          result.checkoutOption !== option
        ) {
          this.rejectMalformedPaymentResponse();
          return;
        }

        if (result.fundingStatus === 'SETTLED') {
          this.loadPaymentStatus();
          return;
        }

        if (option === 'PAY_LATER') {
          this.payLaterSaved.set(true);
          this.loadPaymentStatus();
          return;
        }

        if (option === 'PAYMENT_LINK') {
          const checkoutUrl = safePaystackCheckoutUrl(result.checkoutUrl);
          if (!checkoutUrl) {
            this.rejectMalformedPaymentResponse();
            return;
          }
          this.checkoutUrl.set(checkoutUrl);
          this.loadPaymentStatus();
          return;
        }

        if (!result.accessCode) {
          this.rejectMalformedPaymentResponse();
          return;
        }
        this.popup.resumeTransaction(result.accessCode, {
          onSuccess: () => this.checkPaymentStatus(),
          onError: () => {
            this.paymentError.set(
              'We could not initialize secure payment. No charge was made. Please try again.',
            );
          },
        });
      },
      error: (error: unknown) => {
        this.paymentPending.set(false);
        this.paymentError.set(this.paymentMessage(error));
        this.focusErrorSummary();
      },
    });
  }

  async copyPaymentLink(): Promise<void> {
    const checkoutUrl = this.checkoutUrl();
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      this.copyFeedback.set('Payment link copied');
    } catch {
      this.copyFeedback.set(
        'Copy was unavailable. Select and copy the payment link from the field.',
      );
    }
  }

  continueToCheckout(): void {
    const checkoutUrl = safePaystackCheckoutUrl(this.checkoutUrl());
    if (!checkoutUrl) {
      this.checkoutUrl.set(null);
      this.paymentError.set('Secure checkout is not available. Please initialize payment again.');
      this.focusErrorSummary();
      return;
    }
    this.navigateExternal(checkoutUrl);
  }

  loadPaymentStatus(): void {
    const booking = this.confirmation();
    if (!booking || this.paymentStatusLoading()) return;

    this.paymentStatusLoading.set(true);
    this.paymentStatusError.set(null);
    this.bookingsApi.getPaymentStatus(booking.bookingReference).subscribe({
      next: (status) => {
        this.applyPaymentStatus(status);
        this.paymentStatusLoading.set(false);
      },
      error: (error: unknown) => {
        this.paymentStatusLoading.set(false);
        this.paymentStatusError.set(this.paymentStatusMessage(error));
        this.focusErrorSummary();
      },
    });
  }

  checkPaymentStatus(bookingReference?: string): void {
    const booking = this.confirmation();
    if ((!booking || this.paymentStatusRefreshing()) && !bookingReference) return;
    console.log(bookingReference)

    this.paymentStatusRefreshing.set(true);
    this.paymentStatusError.set(null);
    this.bookingsApi.refreshPaymentStatus(booking?.bookingReference || bookingReference!).subscribe({
      next: (status) => {
        this.applyPaymentStatus(status);
        this.paymentStatusRefreshing.set(false);
      },
      error: (error: unknown) => {
        this.paymentStatusRefreshing.set(false);
        this.paymentStatusError.set(this.paymentStatusMessage(error));
        this.focusErrorSummary();
      },
    });
  }

  paymentStatusLabel(status: PublicBookingPaymentStatus['paymentStatus']): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'Payment confirmed';
      case 'FAILED':
        return 'Payment failed';
      case 'CANCELLED':
        return 'Payment cancelled';
      case 'CREATED':
      case 'AWAITING_CUSTOMER_ACTION':
      case 'PENDING_CONFIRMATION':
        return 'Payment pending';
      default:
        return 'Payment not started';
    }
  }

  fundingStatusLabel(status: PublicBookingPaymentStatus['fundingStatus']): string {
    switch (status) {
      case 'SETTLED':
        return 'Funding settled';
      case 'PENDING':
        return 'Funding pending';
      case 'APPROVED':
        return 'Funding approved';
      case 'DECLINED':
        return 'Funding declined';
      case 'EXPIRED':
        return 'Funding expired';
      case 'CANCELLED':
        return 'Funding cancelled';
      default:
        return 'Funding not initialized';
    }
  }

  bookingStatusLabel(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  bookAnother(): void {
    this.bookingFlow.clear();
    void this.router.navigate(['/health-check/packages']);
  }

  private recoveryMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'This booking session is no longer available. Please start a new booking or use a future recovery option.';
      }
      if (error.status === 404) {
        return 'This booking is unavailable. Check the page address or start a new booking.';
      }
    }
    return 'We could not securely restore this booking right now. Please try again.';
  }

  private fundingMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'This booking session is no longer available. Please start a new booking or use a future recovery option.';
      }
      if (error.status === 404) return 'This booking is no longer available.';
      if (error.status === 409 || error.status === 422) {
        return 'Payment preparation is not available for the booking in its current state. Review the booking status and try again if appropriate.';
      }
    }
    return 'We could not prepare payment right now. No charge was made. You can try again.';
  }

  private paymentMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        return 'Payment cannot be initialized with the current payer details. Check that a valid email was provided with the booking.';
      }
      if (error.status === 401 || error.status === 403) {
        return 'This booking session is no longer available. Please start a new booking or use a future recovery option.';
      }
      if (error.status === 404) return 'This booking is no longer available.';
      if (error.status === 409 || error.status === 422) {
        return 'Secure payment is not available for the booking in its current state. Refresh the booking status before trying again.';
      }
      if (error.status === 502 || error.status === 503 || error.status === 0) {
        return 'The secure payment service is temporarily unavailable. No charge was made. Please try again.';
      }
    }
    return 'We could not initialize secure payment. No charge was made. Please try again.';
  }

  private paymentStatusMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'This booking session is no longer available. Please start a new booking or use a future recovery option.';
      }
      if (error.status === 404) return 'Payment information for this booking is unavailable.';
      if (error.status === 429) {
        return 'Payment status was checked recently. Please wait a moment before checking again.';
      }
      if (error.status === 409 || error.status === 422) {
        return 'Payment status cannot be checked for the booking in its current state.';
      }
      if (error.status === 502 || error.status === 503 || error.status === 0) {
        return 'The payment verification service is temporarily unavailable. Please try again later.';
      }
    }
    return 'We could not retrieve the authoritative payment status. Please try again.';
  }

  private applyPaymentStatus(status: PublicBookingPaymentStatus): void {
    if (status.bookingReference !== this.routeReference) {
      this.paymentStatusError.set('Payment status could not be safely matched to this booking.');
      return;
    }
    this.authoritativePaymentStatus.set(status);
    if (status.checkoutOption) this.selectedCheckoutOption.set(status.checkoutOption);
    if (
      status.paymentStatus === 'SUCCEEDED' ||
      status.paymentStatus === 'FAILED' ||
      status.paymentStatus === 'CANCELLED' ||
      status.paymentStatus === 'PENDING_CONFIRMATION'
    ) {
      this.checkoutUrl.set(null);
    }
  }

  private rejectMalformedPaymentResponse(): void {
    this.paymentError.set(
      'Payment could not be prepared because the payment service returned an incomplete response. Please try again.',
    );
    this.loadPaymentStatus();
    this.focusErrorSummary();
  }

  private focusErrorSummary(): void {
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[data-error-summary]')?.focus(),
    );
  }
}
