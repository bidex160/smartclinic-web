import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import {
  PublicBookingFundingResult,
  PublicBookingPaymentInitiationResult,
} from '../../core/models/public-booking.model';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';
import { safePaystackCheckoutUrl } from './paystack-checkout-url';

@Component({
  selector: 'app-booking-confirmation-page',
  templateUrl: './booking-confirmation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmationPageComponent {
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

  readonly confirmation = computed(() => {
    const confirmation = this.bookingFlow.confirmation();
    return confirmation?.bookingReference === this.routeReference ? confirmation : null;
  });
  readonly canInitiatePayment = computed(
    () => this.fundingResult() !== null || this.confirmation()?.status === 'AWAITING_FUNDING',
  );

  constructor() {
    if (!this.confirmation()) this.recoverConfirmation();
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

  initiatePayment(): void {
    const booking = this.confirmation();
    if (!booking || !this.canInitiatePayment() || this.paymentPending()) return;

    this.paymentPending.set(true);
    this.paymentError.set(null);
    this.checkoutUrl.set(null);
    this.bookingsApi.initiatePayment(booking.bookingReference).subscribe({
      next: (result) => {
        this.paymentPending.set(false);
        this.paymentResult.set(result);
        const checkoutUrl = safePaystackCheckoutUrl(result.checkoutUrl);
        if (result.bookingReference !== booking.bookingReference || !checkoutUrl) {
          this.paymentError.set(
            'Secure checkout could not be opened because the payment service returned an invalid destination. Please try again.',
          );
          this.focusErrorSummary();
          return;
        }
        this.checkoutUrl.set(checkoutUrl);
      },
      error: (error: unknown) => {
        this.paymentPending.set(false);
        this.paymentError.set(this.paymentMessage(error));
        this.focusErrorSummary();
      },
    });
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

  private focusErrorSummary(): void {
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[data-error-summary]')?.focus(),
    );
  }
}
