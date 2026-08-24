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
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AdminMatchingQueueFilters,
  AdminMatchingQueueItem,
  AdminMatchingQueueResponse,
  MatchingQueueFundingStatus,
  MatchingQueueReadiness,
} from '../../core/models/admin-matching-queue.model';
import { BookingStatus, MatchingResult } from '../../core/models/admin-provider-assignment.model';
import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { ProviderOfferStatus } from '../../core/models/provider-offer.model';
import { AdminMatchingQueueApiService } from '../../core/services/admin-matching-queue-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

const BOOKING_STATUSES: readonly BookingStatus[] = [
  'DRAFT',
  'AWAITING_FUNDING',
  'PENDING_PROVIDER_MATCH',
  'PROVIDER_ASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'UNFULFILLABLE',
  'CANCELLED',
  'EXPIRED',
];
const ASSIGNMENT_STATUSES: readonly ProviderOfferStatus[] = [
  'OFFERED',
  'ACCEPTED',
  'CONFIRMED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
];
const BOOKING_REFERENCE_PATTERN = /^SC-\d{4}-[A-F0-9]{12}$/i;
const EMPTY_RESPONSE: AdminMatchingQueueResponse = {
  items: [],
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
};

@Component({
  selector: 'app-matching-queue-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './matching-queue-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchingQueuePageComponent {
  private readonly queueApi = inject(AdminMatchingQueueApiService);
  private readonly assignmentsApi = inject(AdminProviderAssignmentsApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly fulfilmentModesApi = inject(FulfilmentModesApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly response = signal<AdminMatchingQueueResponse>(EMPTY_RESPONSE);
  readonly loading = signal(false);
  readonly catalogueLoading = signal(false);
  readonly retryingReference = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly latestAssignmentId = signal<string | null>(null);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly fulfilmentModes = signal<FulfilmentMode[]>([]);
  readonly bookingStatuses = BOOKING_STATUSES;
  readonly assignmentStatuses = ASSIGNMENT_STATUSES;
  readonly pageSizes = [10, 25, 50] as const;
  readonly filterForm = this.formBuilder.group({
    bookingReference: ['', Validators.pattern(BOOKING_REFERENCE_PATTERN)],
    bookingStatus: this.formBuilder.control<BookingStatus | ''>(''),
    packageId: [''],
    fulfilmentModeId: [''],
    preferredDate: [''],
    providerAssignmentStatus: this.formBuilder.control<ProviderOfferStatus | ''>(''),
    limit: this.formBuilder.control<10 | 25 | 50>(25),
  });
  private readonly appliedFilters = signal<AdminMatchingQueueFilters>({ page: 1, limit: 25 });

  constructor() {
    this.loadCatalogues();
    this.loadQueue();
  }

  applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.appliedFilters.set({
      page: 1,
      limit: value.limit,
      ...(value.bookingReference.trim() && {
        bookingReference: value.bookingReference.trim().toUpperCase(),
      }),
      ...(value.bookingStatus && { bookingStatus: value.bookingStatus }),
      ...(value.packageId && { packageId: value.packageId }),
      ...(value.fulfilmentModeId && { fulfilmentModeId: value.fulfilmentModeId }),
      ...(value.preferredDate && { preferredDate: value.preferredDate }),
      ...(value.providerAssignmentStatus && {
        providerAssignmentStatus: value.providerAssignmentStatus,
      }),
    });
    this.loadQueue();
  }

  clearFilters(): void {
    this.filterForm.reset({
      bookingReference: '',
      bookingStatus: '',
      packageId: '',
      fulfilmentModeId: '',
      preferredDate: '',
      providerAssignmentStatus: '',
      limit: 25,
    });
    this.appliedFilters.set({ page: 1, limit: 25 });
    this.loadQueue();
  }

  goToPage(page: number): void {
    const current = this.response();
    if (this.loading() || page < 1 || (current.totalPages > 0 && page > current.totalPages)) return;
    this.appliedFilters.update((filters) => ({ ...filters, page }));
    this.loadQueue();
  }

  retryMatching(item: AdminMatchingQueueItem): void {
    if (item.readiness !== 'UNFULFILLABLE' || this.retryingReference()) return;
    this.retryingReference.set(item.bookingReference);
    this.error.set(null);
    this.statusMessage.set(null);
    this.latestAssignmentId.set(null);
    this.assignmentsApi
      .retryMatching(item.bookingReference)
      .pipe(finalize(() => this.retryingReference.set(null)))
      .subscribe({
        next: (result) => {
          this.handleMatchingResult(result);
          this.loadQueue();
        },
        error: (error: HttpErrorResponse) => this.handleMatchingError(error),
      });
  }

  loadQueue(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.queueApi
      .getQueue(this.appliedFilters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'The matching queue could not be loaded. Please try again.'),
      });
  }

  readinessLabel(readiness: MatchingQueueReadiness): string {
    const labels: Record<MatchingQueueReadiness, string> = {
      READY: 'Ready for automatic matching',
      FUNDING_INCOMPLETE: 'Funding incomplete',
      INCOMPLETE_SCHEDULING: 'Scheduling incomplete',
      ACTIVE_OFFER: 'Provider offer active',
      ACCEPTED_AWAITING_CONFIRMATION: 'Awaiting confirmation',
      UNFULFILLABLE: 'Provider match needs review',
      ALREADY_ASSIGNED: 'Provider assigned',
    };
    return labels[readiness];
  }

  statusLabel(status: string | null): string {
    if (!status) return 'None';
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  fundingStatusLabel(status: MatchingQueueFundingStatus | null): string {
    return status ? this.statusLabel(status) : 'Not initialized';
  }

  private loadCatalogues(): void {
    this.catalogueLoading.set(true);
    forkJoin({
      packages: this.packagesApi.getPackages(),
      fulfilmentModes: this.fulfilmentModesApi.getFulfilmentModes(),
    })
      .pipe(finalize(() => this.catalogueLoading.set(false)))
      .subscribe({
        next: ({ packages, fulfilmentModes }) => {
          this.packages.set(packages);
          this.fulfilmentModes.set(fulfilmentModes);
        },
        error: () => {
          this.statusMessage.set(
            'Package and fulfilment filters are temporarily unavailable; the queue is still usable.',
          );
        },
      });
  }

  private handleMatchingResult(result: MatchingResult): void {
    if (result.outcome === 'OFFER_CREATED') {
      this.statusMessage.set(
        `Automatic matching was retried for ${result.bookingReference}. A provider offer was created.`,
      );
      this.latestAssignmentId.set(result.assignmentId);
      return;
    }
    this.statusMessage.set(
      `Automatic matching was retried for ${result.bookingReference}, but no eligible provider is currently available.`,
    );
  }

  private handleMatchingError(error: HttpErrorResponse): void {
    const messages: Record<number, string> = {
      400: 'Matching requires a complete preferred date, time window, and timezone.',
      404: 'That booking is no longer available.',
      409: 'Matching cannot be retried because another workflow is active or the booking state changed.',
      422: 'This booking cannot be retried until its funding and scheduling information is complete.',
    };
    this.handleError(
      error,
      messages[error.status] ?? 'Automatic matching could not be retried. Please try again.',
    );
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
}
