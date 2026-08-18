import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminBookingDetail } from '../../core/models/admin-booking-detail.model';
import { MatchingQueueReadiness } from '../../core/models/admin-matching-queue.model';
import { MatchingResult } from '../../core/models/admin-provider-assignment.model';
import { AdminBookingsApiService } from '../../core/services/admin-bookings-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

@Component({
  selector: 'app-admin-booking-detail-page',
  imports: [AdminSessionHeaderComponent, DatePipe, RouterLink],
  templateUrl: './admin-booking-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBookingDetailPageComponent {
  private readonly bookingsApi = inject(AdminBookingsApiService);
  private readonly assignmentsApi = inject(AdminProviderAssignmentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';

  readonly booking = signal<AdminBookingDetail | null>(null);
  readonly loading = signal(false);
  readonly matching = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly createdAssignmentId = signal<string | null>(null);
  readonly bookerName = computed(() => {
    const contact = this.booking()?.bookerContact;
    const name = [contact?.givenName, contact?.familyName].filter(Boolean).join(' ');
    return name || 'Not available';
  });

  constructor() {
    this.loadBooking();
  }

  loadBooking(): void {
    if (!this.reference || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.bookingsApi
      .getBooking(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (booking) => this.booking.set(booking),
        error: (error: HttpErrorResponse) => this.handleLoadError(error),
      });
  }

  startMatching(): void {
    const booking = this.booking();
    if (!booking || booking.readiness !== 'READY' || this.matching()) return;
    this.matching.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.createdAssignmentId.set(null);
    this.assignmentsApi
      .startMatching(booking.bookingReference)
      .pipe(finalize(() => this.matching.set(false)))
      .subscribe({
        next: (result) => {
          this.handleMatchingResult(result);
          this.loadBooking();
        },
        error: (error: HttpErrorResponse) => this.handleMatchingError(error),
      });
  }

  readinessLabel(readiness: MatchingQueueReadiness): string {
    const labels: Record<MatchingQueueReadiness, string> = {
      READY: 'Ready for matching',
      FUNDING_INCOMPLETE: 'Funding incomplete',
      INCOMPLETE_SCHEDULING: 'Scheduling incomplete',
      ACTIVE_OFFER: 'Provider offer active',
      ACCEPTED_AWAITING_CONFIRMATION: 'Awaiting confirmation',
      UNFULFILLABLE: 'No provider currently available',
      ALREADY_ASSIGNED: 'Provider assigned',
    };
    return labels[readiness];
  }

  statusLabel(status: string | null): string {
    if (!status) return 'Not started';
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private handleMatchingResult(result: MatchingResult): void {
    if (result.outcome === 'OFFER_CREATED') {
      this.statusMessage.set('Matching started and a provider offer was created.');
      this.createdAssignmentId.set(result.assignmentId);
      return;
    }
    this.statusMessage.set(
      'No eligible provider is currently available. The booking is now unfulfillable.',
    );
  }

  private handleLoadError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    if (error.status === 404) {
      this.booking.set(null);
      this.notFound.set(true);
      this.setError('This booking could not be found.');
      return;
    }
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : 'Booking details could not be loaded. Please try again.',
    );
  }

  private handleMatchingError(error: HttpErrorResponse): void {
    const messages: Record<number, string> = {
      404: 'This booking is no longer available.',
      409: 'Matching cannot start because another workflow is active or the booking state changed.',
      422: 'This booking is not ready for matching. Review its funding and scheduling information.',
    };
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? 'Matching could not be started right now.'),
    );
  }

  private setError(message: string): void {
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
