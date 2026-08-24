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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  PatientBookingStatus,
  PatientEncounterStatus,
  PatientHealthCheckHistoryFilters,
  PatientHealthCheckHistoryResponse,
} from '../../core/models/patient-health-check-history.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { UtilsService } from '../../core/services/utils.service';

const BOOKING_STATUSES: readonly PatientBookingStatus[] = [
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
const ENCOUNTER_STATUSES: readonly PatientEncounterStatus[] = [
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];
const EMPTY_RESPONSE: PatientHealthCheckHistoryResponse = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

@Component({
  selector: 'app-my-health-checks-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './my-health-checks-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyHealthChecksPageComponent {
  utilsService = inject(UtilsService);

  private readonly api = inject(HealthCheckResultsApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly response = signal<PatientHealthCheckHistoryResponse>(EMPTY_RESPONSE);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly bookingStatuses = BOOKING_STATUSES;
  readonly encounterStatuses = ENCOUNTER_STATUSES;
  readonly pageSizes = [10, 20, 50] as const;
  readonly filterForm = this.formBuilder.group({
    bookingStatus: this.formBuilder.control<PatientBookingStatus | ''>(''),
    encounterStatus: this.formBuilder.control<PatientEncounterStatus | ''>(''),
    limit: this.formBuilder.control<10 | 20 | 50>(20),
  });
  private readonly appliedFilters = signal<PatientHealthCheckHistoryFilters>({
    page: 1,
    limit: 20,
  });

  constructor() {
    this.load();
  }

  applyFilters(): void {
    const value = this.filterForm.getRawValue();
    this.appliedFilters.set({
      page: 1,
      limit: value.limit,
      ...(value.bookingStatus && { bookingStatus: value.bookingStatus }),
      ...(value.encounterStatus && { encounterStatus: value.encounterStatus }),
    });
    this.load();
  }

  clearFilters(): void {
    this.filterForm.reset({ bookingStatus: '', encounterStatus: '', limit: 20 });
    this.appliedFilters.set({ page: 1, limit: 20 });
    this.load();
  }

  goToPage(page: number): void {
    const current = this.response();
    if (this.loading() || page < 1 || (current.totalPages > 0 && page > current.totalPages)) return;
    this.appliedFilters.update((filters) => ({ ...filters, page }));
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getMyHealthChecks(this.appliedFilters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: (error: HttpErrorResponse) => {
          this.response.set(EMPTY_RESPONSE);
          this.error.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Your Smart Health Checks are unavailable right now. Please try again.',
          );
          queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
        },
      });
  }

  bookingStatusLabel(status: PatientBookingStatus): string {
    const labels: Record<PatientBookingStatus, string> = {
      DRAFT: 'Draft',
      AWAITING_FUNDING: 'Awaiting payment',
      PENDING_PROVIDER_MATCH: 'Finding a provider',
      PROVIDER_ASSIGNED: 'Provider assigned',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'Health Check in progress',
      COMPLETED: 'Completed',
      UNFULFILLABLE: 'Provider match needs review',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired',
    };
    return labels[status];
  }

  encounterStatusLabel(status: PatientEncounterStatus | null): string {
    if (status === null) return 'Not started';
    const labels: Record<PatientEncounterStatus, string> = {
      DRAFT: 'Not started',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return labels[status];
  }

  schedule(
    date: string | null,
    from: string | null,
    to: string | null,
    timezone: string | null,
  ): string {
    if (!date && !from && !to) return 'Not scheduled';
    const time = from && to ? `${from}–${to}` : (from ?? to ?? '');
    return [date, time, timezone].filter(Boolean).join(' · ');
  }
}
