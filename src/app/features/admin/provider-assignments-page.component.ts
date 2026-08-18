import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  AdminProviderAssignment,
  AdminProviderAssignmentFilters,
  BookingStatus,
  MatchingResult,
} from '../../core/models/admin-provider-assignment.model';
import { ProviderOfferStatus } from '../../core/models/provider-offer.model';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

const ASSIGNMENT_STATUSES: readonly ProviderOfferStatus[] = [
  'OFFERED',
  'ACCEPTED',
  'CONFIRMED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
];
const BOOKING_REFERENCE_PATTERN = /^SC-\d{4}-[A-F0-9]{12}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-provider-assignments-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './provider-assignments-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderAssignmentsPageComponent {
  private readonly api = inject(AdminProviderAssignmentsApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly assignments = signal<AdminProviderAssignment[]>([]);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly assignmentStatuses = ASSIGNMENT_STATUSES;
  readonly filterForm = this.formBuilder.group({
    bookingReference: ['', Validators.pattern(BOOKING_REFERENCE_PATTERN)],
    providerId: ['', Validators.pattern(UUID_PATTERN)],
    status: this.formBuilder.control<ProviderOfferStatus | ''>(''),
  });
  readonly matchingForm = this.formBuilder.group({
    bookingReference: ['', [Validators.required, Validators.pattern(BOOKING_REFERENCE_PATTERN)]],
  });

  constructor() {
    const bookingReference = this.route.snapshot.queryParamMap.get('bookingReference');
    if (bookingReference && BOOKING_REFERENCE_PATTERN.test(bookingReference)) {
      this.filterForm.controls.bookingReference.setValue(bookingReference.toUpperCase());
    }
    this.loadAssignments();
  }

  loadAssignments(): void {
    if (this.loading()) return;
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const value = this.filterForm.getRawValue();
    const filters: AdminProviderAssignmentFilters = {
      ...(value.bookingReference.trim() && {
        bookingReference: value.bookingReference.trim().toUpperCase(),
      }),
      ...(value.providerId.trim() && { providerId: value.providerId.trim() }),
      ...(value.status && { status: value.status }),
    };
    this.api
      .getAssignments(filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (assignments) => this.assignments.set(assignments),
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Assignments could not be loaded.'),
      });
  }

  clearFilters(): void {
    this.filterForm.reset({ bookingReference: '', providerId: '', status: '' });
    this.loadAssignments();
  }

  startMatching(): void {
    if (this.matchingForm.invalid || this.mutating()) {
      this.matchingForm.markAllAsTouched();
      return;
    }
    this.beginMutation();
    const reference = this.matchingForm.controls.bookingReference.value.trim().toUpperCase();
    this.api
      .startMatching(reference)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (result) => {
          this.statusMessage.set(this.matchingMessage(result));
          this.matchingForm.reset({ bookingReference: '' });
          this.loadAssignments();
        },
        error: (error: HttpErrorResponse) => this.handleMatchingError(error),
      });
  }

  expireStaleOffers(): void {
    if (this.mutating()) return;
    this.beginMutation();
    this.api
      .expireStaleOffers()
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (result) => {
          const unfulfillable = result.nextOffers.filter(
            (item) => item.bookingStatus === 'UNFULFILLABLE',
          ).length;
          this.statusMessage.set(
            `${result.expiredCount} stale ${result.expiredCount === 1 ? 'offer was' : 'offers were'} expired. ${result.nextOffers.length} matching ${result.nextOffers.length === 1 ? 'cycle was' : 'cycles were'} continued.${unfulfillable ? ` ${unfulfillable} reached unfulfillable status.` : ''}`,
          );
          this.loadAssignments();
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Stale offers could not be expired right now.'),
      });
  }

  assignmentStatusLabel(status: ProviderOfferStatus): string {
    return this.humanize(status);
  }

  bookingStatusLabel(status: BookingStatus): string {
    return this.humanize(status);
  }

  private matchingMessage(result: MatchingResult): string {
    if (result.outcome === 'OFFER_CREATED')
      return 'Matching started and an offer was created for an eligible provider.';
    if (result.outcome === 'UNFULFILLABLE') {
      return 'No eligible provider was available. The booking is now unfulfillable.';
    }
    return `Matching completed with booking status ${this.bookingStatusLabel(result.bookingStatus)}.`;
  }

  private beginMutation(): void {
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
  }

  private handleMatchingError(error: HttpErrorResponse): void {
    const messages: Record<number, string> = {
      400: 'Matching needs a complete preferred date, time window, and timezone.',
      404: 'That booking could not be found.',
      409: 'Matching cannot start from the booking’s current workflow state.',
      422: 'The booking does not yet have the required matching information.',
    };
    this.handleError(error, messages[error.status] ?? 'Matching could not be started right now.');
  }

  private handleError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : fallback,
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }

  private humanize(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}
