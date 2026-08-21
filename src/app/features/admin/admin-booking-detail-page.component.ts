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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { AdminBookingDetail } from '../../core/models/admin-booking-detail.model';
import {
  AdminProviderLocation,
  ScheduleBookingRequest,
} from '../../core/models/booking-schedule.model';
import { MatchingQueueReadiness } from '../../core/models/admin-matching-queue.model';
import { MatchingResult } from '../../core/models/admin-provider-assignment.model';
import { AdminBookingsApiService } from '../../core/services/admin-bookings-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

@Component({
  selector: 'app-admin-booking-detail-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-booking-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBookingDetailPageComponent {
  private readonly bookingsApi = inject(AdminBookingsApiService);
  private readonly assignmentsApi = inject(AdminProviderAssignmentsApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';

  readonly booking = signal<AdminBookingDetail | null>(null);
  readonly loading = signal(false);
  readonly matching = signal(false);
  readonly scheduling = signal(false);
  readonly scheduleFormOpen = signal(false);
  readonly locationsLoading = signal(false);
  readonly eligibleLocations = signal<AdminProviderLocation[]>([]);
  readonly locationLoadError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly createdAssignmentId = signal<string | null>(null);
  readonly scheduleForm = this.formBuilder.group({
    date: ['', Validators.required],
    timeFrom: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
    timeTo: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
    timezone: ['', Validators.required],
    providerLocationId: [''],
  });
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
        next: (booking) => {
          this.booking.set(booking);
          if (this.canSchedule(booking) && !this.scheduleFormOpen()) this.prefillSchedule(booking);
        },
        error: (error: HttpErrorResponse) => this.handleLoadError(error),
      });
  }

  canSchedule(booking: AdminBookingDetail): boolean {
    return (
      booking.status === 'PROVIDER_ASSIGNED' &&
      booking.assignment.assignmentStatus === 'CONFIRMED' &&
      !!booking.assignment.providerId
    );
  }

  openScheduleForm(): void {
    const booking = this.booking();
    if (!booking || !this.canSchedule(booking)) return;
    this.prefillSchedule(booking);
    this.scheduleFormOpen.set(true);
    if (booking.fulfilmentMode.code === 'PROVIDER_LOCATION') this.loadEligibleLocations(booking);
  }

  cancelSchedule(): void {
    if (!this.scheduling()) this.scheduleFormOpen.set(false);
  }

  submitSchedule(): void {
    const booking = this.booking();
    const value = this.scheduleForm.getRawValue();
    const locationRequired = booking?.fulfilmentMode.code === 'PROVIDER_LOCATION';
    if (
      !booking ||
      !this.canSchedule(booking) ||
      this.scheduleForm.invalid ||
      this.scheduling() ||
      value.timeFrom >= value.timeTo ||
      (locationRequired && !value.providerLocationId)
    ) {
      this.scheduleForm.markAllAsTouched();
      if (value.timeFrom && value.timeTo && value.timeFrom >= value.timeTo)
        this.setError('Appointment start time must be before the end time.');
      return;
    }
    const request: ScheduleBookingRequest = {
      date: value.date,
      timeFrom: value.timeFrom,
      timeTo: value.timeTo,
      timezone: value.timezone,
      ...(locationRequired && { providerLocationId: value.providerLocationId }),
    };
    this.scheduling.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.bookingsApi
      .schedule(booking.bookingReference, request)
      .pipe(finalize(() => this.scheduling.set(false)))
      .subscribe({
        next: () => {
          this.scheduleFormOpen.set(false);
          this.statusMessage.set('Appointment scheduled successfully.');
          this.loadBooking();
        },
        error: (error: HttpErrorResponse) => this.handleScheduleError(error),
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

  private prefillSchedule(booking: AdminBookingDetail): void {
    let browserTimezone = '';
    try {
      browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      browserTimezone = '';
    }
    this.scheduleForm.reset({
      date: booking.preferredDate ?? '',
      timeFrom: booking.preferredTimeFrom?.slice(0, 5) ?? '',
      timeTo: booking.preferredTimeTo?.slice(0, 5) ?? '',
      timezone: booking.preferredTimezone ?? browserTimezone,
      providerLocationId: '',
    });
  }

  private loadEligibleLocations(booking: AdminBookingDetail): void {
    const providerId = booking.assignment.providerId;
    if (!providerId || this.locationsLoading()) return;
    this.locationsLoading.set(true);
    this.locationLoadError.set(null);
    this.eligibleLocations.set([]);
    forkJoin({
      capabilities: this.bookingsApi.getProviderCapabilities(providerId),
      locations: this.bookingsApi.getProviderLocations(providerId),
      packages: this.packagesApi.getPackages(),
      modes: this.modesApi.getFulfilmentModes(),
    })
      .pipe(finalize(() => this.locationsLoading.set(false)))
      .subscribe({
        next: ({ capabilities, locations, packages, modes }) => {
          const packageId = packages.find((item) => item.code === booking.package.code)?.id;
          const modeId = modes.find((item) => item.code === booking.fulfilmentMode.code)?.id;
          const linkedIds = new Set(
            capabilities
              .filter(
                (item) =>
                  item.isActive &&
                  item.healthCheckPackageId === packageId &&
                  item.fulfilmentModeId === modeId,
              )
              .flatMap((item) => item.providerLocationIds),
          );
          this.eligibleLocations.set(
            locations.filter((item) => item.isActive && linkedIds.has(item.id)),
          );
          if (!this.eligibleLocations().length)
            this.locationLoadError.set(
              'No active provider location is linked to this confirmed capability.',
            );
        },
        error: () =>
          this.locationLoadError.set(
            'Eligible provider locations could not be loaded. Try again before scheduling.',
          ),
      });
  }

  private handleScheduleError(error: HttpErrorResponse): void {
    const messages: Record<number, string> = {
      400: 'Review the appointment date, time, timezone, and provider location.',
      404: 'The booking or provider location is no longer available.',
      409: 'This booking already has a confirmed appointment or the provider is unavailable. Use the rescheduling workflow to change an existing appointment.',
      422: 'The appointment details could not be accepted. Review them and try again.',
    };
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? 'The appointment could not be scheduled.'),
    );
  }

  private setError(message: string): void {
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
