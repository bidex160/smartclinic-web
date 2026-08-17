import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { BookingsApiService } from '../../core/services/bookings-api.service';
import { ParticipantRelationship } from './booking-flow.models';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingProgressComponent } from './booking-progress.component';
import { mapBookingFlowToPublicBookingRequest } from './public-booking-request.mapper';

@Component({
  selector: 'app-booking-review-page',
  imports: [RouterLink, BookingProgressComponent],
  templateUrl: './booking-review-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingReviewPageComponent {
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly router = inject(Router);
  readonly bookingFlow = inject(BookingFlowStateService);

  readonly submitting = signal(false);
  readonly submissionError = signal<string | null>(null);

  confirmBooking(): void {
    if (this.submitting()) return;

    this.submitting.set(true);
    this.submissionError.set(null);

    const request = mapBookingFlowToPublicBookingRequest(this.bookingFlow);
    this.bookingsApi
      .createPublicBooking(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (confirmation) => {
          this.bookingFlow.completeBooking(confirmation);
          void this.router.navigate(['/book/confirmation', confirmation.bookingReference]);
        },
        error: (error: HttpErrorResponse) => {
          this.submissionError.set(this.getSubmissionError(error));
          queueMicrotask(() =>
            this.host.nativeElement.querySelector<HTMLElement>('#submission-error')?.focus(),
          );
        },
      });
  }

  relationshipLabel(relationship: ParticipantRelationship): string {
    switch (relationship) {
      case 'SELF':
        return 'Myself';
      case 'FAMILY':
        return 'Family member';
      case 'OTHER':
        return 'Someone else';
    }
  }

  private getSubmissionError(error: HttpErrorResponse): string {
    if (error.status === 0)
      return 'We could not reach SmartClinic. Check your connection, then try again.';
    if (error.status === 400)
      return 'Some booking information was not accepted. Review your details and try again.';
    if (error.status === 409)
      return 'We could not create a unique booking reference. Please try again.';
    if (error.status === 422)
      return 'Pricing is no longer available for this selection. Please choose another option.';
    return 'SmartClinic could not create your booking right now. Your details are still here, so you can try again.';
  }
}
