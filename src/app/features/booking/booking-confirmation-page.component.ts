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

import { PublicBookingFundingResult } from '../../core/models/public-booking.model';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';

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
  readonly bookingFlow = inject(BookingFlowStateService);
  private readonly routeReference = this.route.snapshot.paramMap.get('reference');

  readonly recovering = signal(false);
  readonly recoveryError = signal<string | null>(null);
  readonly fundingPending = signal(false);
  readonly fundingError = signal<string | null>(null);
  readonly fundingResult = signal<PublicBookingFundingResult | null>(null);

  readonly confirmation = computed(() => {
    const confirmation = this.bookingFlow.confirmation();
    return confirmation?.bookingReference === this.routeReference ? confirmation : null;
  });

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

  private focusErrorSummary(): void {
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[data-error-summary]')?.focus(),
    );
  }
}
