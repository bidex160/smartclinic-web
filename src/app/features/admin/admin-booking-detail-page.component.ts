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
import { AdminProviderListItem } from '../../core/models/admin-provider.model';
import { AdminBookingsApiService } from '../../core/services/admin-bookings-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-admin-booking-detail-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-booking-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBookingDetailPageComponent {
  utilsService = inject(UtilsService);
  private readonly bookingsApi = inject(AdminBookingsApiService);
  private readonly assignmentsApi = inject(AdminProviderAssignmentsApiService);
  private readonly providersApi = inject(AdminProvidersApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';

  readonly booking = signal<AdminBookingDetail | null>(null);
  readonly loading = signal(false);
  readonly intervening = signal(false);
  readonly scheduling = signal(false);
  readonly scheduleFormOpen = signal(false);
  readonly locationsLoading = signal(false);
  readonly eligibleLocations = signal<AdminProviderLocation[]>([]);
  readonly locationLoadError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly createdAssignmentId = signal<string | null>(null);
  readonly providerResults = signal<readonly AdminProviderListItem[]>([]);
  readonly providerSearchLoading = signal(false);
  readonly providerSearchMessage = signal<string | null>(null);
  readonly interventionOpen = signal<'assign' | 'override' | 'reassign' | null>(null);
  readonly confirmingIntervention = signal(false);
  readonly providerSearchForm = this.formBuilder.group({
    query: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });
  readonly assignForm = this.formBuilder.group({ providerId: ['', Validators.required] });
  readonly overrideForm = this.formBuilder.group({
    providerId: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
  });
  readonly reassignForm = this.formBuilder.group({
    mode: this.formBuilder.control<'automatic' | 'selected'>('automatic'),
    providerId: [''],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
  });
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

  retryMatching(): void {
    const booking = this.booking();
    if (!booking || booking.status !== 'UNFULFILLABLE' || this.intervening()) return;
    this.intervening.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.createdAssignmentId.set(null);
    this.assignmentsApi
      .retryMatching(booking.bookingReference)
      .pipe(finalize(() => this.intervening.set(false)))
      .subscribe({
        next: (result) => {
          this.handleMatchingResult(result, 'Automatic matching was retried');
          this.loadBooking();
        },
        error: (error: HttpErrorResponse) => this.handleMatchingError(error),
      });
  }

  openIntervention(kind: 'assign' | 'override' | 'reassign'): void {
    this.interventionOpen.set(kind);
    this.confirmingIntervention.set(false);
    this.error.set(null);
  }

  closeIntervention(): void {
    if (this.intervening()) return;
    this.interventionOpen.set(null);
    this.confirmingIntervention.set(false);
  }

  searchProviders(): void {
    if (this.providerSearchForm.invalid || this.providerSearchLoading()) {
      this.providerSearchForm.markAllAsTouched();
      return;
    }
    this.providerSearchLoading.set(true);
    this.providerSearchMessage.set(null);
    this.providersApi
      .list({
        status: 'ACTIVE',
        search: this.providerSearchForm.controls.query.value.trim(),
        page: 1,
        limit: 10,
      })
      .pipe(finalize(() => this.providerSearchLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.providerResults.set(response.items);
          this.providerSearchMessage.set(
            `${response.items.length} active provider${response.items.length === 1 ? '' : 's'} found. Selection is still validated against this booking by the backend.`,
          );
        },
        error: (error: HttpErrorResponse) =>
          this.handleInterventionError(error, 'Providers could not be searched right now.'),
      });
  }

  selectProvider(provider: AdminProviderListItem): void {
    if (provider.status !== 'ACTIVE') return;
    const kind = this.interventionOpen();
    if (kind === 'assign') this.assignForm.controls.providerId.setValue(provider.id);
    if (kind === 'override') this.overrideForm.controls.providerId.setValue(provider.id);
    if (kind === 'reassign') {
      this.reassignForm.patchValue({ mode: 'selected', providerId: provider.id });
    }
  }

  selectedProviderName(): string {
    const kind = this.interventionOpen();
    const id =
      kind === 'assign'
        ? this.assignForm.controls.providerId.value
        : kind === 'override'
          ? this.overrideForm.controls.providerId.value
          : this.reassignForm.controls.providerId.value;
    return this.providerResults().find((provider) => provider.id === id)?.displayName ?? '';
  }

  requestInterventionConfirmation(): void {
    const kind = this.interventionOpen();
    const form =
      kind === 'assign'
        ? this.assignForm
        : kind === 'override'
          ? this.overrideForm
          : this.reassignForm;
    if (
      !kind ||
      form.invalid ||
      (kind === 'reassign' &&
        this.reassignForm.controls.mode.value === 'selected' &&
        !this.reassignForm.controls.providerId.value)
    ) {
      form.markAllAsTouched();
      return;
    }
    this.confirmingIntervention.set(true);
  }

  submitIntervention(): void {
    const booking = this.booking();
    const kind = this.interventionOpen();
    if (!booking || !kind || !this.confirmingIntervention() || this.intervening()) return;
    const operation =
      kind === 'assign'
        ? this.assignmentsApi.assignProvider(booking.bookingReference, {
            providerId: this.assignForm.controls.providerId.value,
          })
        : kind === 'override'
          ? this.assignmentsApi.overrideProvider(booking.bookingReference, {
              providerId: this.overrideForm.controls.providerId.value,
              reason: this.overrideForm.controls.reason.value.trim(),
            })
          : this.assignmentsApi.reassignProvider(booking.bookingReference, {
              reason: this.reassignForm.controls.reason.value.trim(),
              ...(this.reassignForm.controls.mode.value === 'selected' && {
                providerId: this.reassignForm.controls.providerId.value,
              }),
            });
    this.intervening.set(true);
    this.error.set(null);
    operation.pipe(finalize(() => this.intervening.set(false))).subscribe({
      next: (result) => {
        this.handleMatchingResult(
          result,
          kind === 'reassign'
            ? 'Provider reassignment completed'
            : 'Provider intervention completed',
        );
        this.interventionOpen.set(null);
        this.confirmingIntervention.set(false);
        this.loadBooking();
      },
      error: (error: HttpErrorResponse) =>
        this.handleInterventionError(error, 'The provider intervention could not be completed.'),
    });
  }

  canReassign(booking: AdminBookingDetail): boolean {
    return (
      ['PENDING_PROVIDER_MATCH', 'PROVIDER_ASSIGNED'].includes(booking.status) &&
      ['OFFERED', 'ACCEPTED', 'CONFIRMED'].includes(booking.assignment.assignmentStatus ?? '')
    );
  }

  readinessLabel(readiness: MatchingQueueReadiness): string {
    const labels: Record<MatchingQueueReadiness, string> = {
      READY: 'Ready for automatic matching',
      FUNDING_INCOMPLETE: 'Funding incomplete',
      INCOMPLETE_SCHEDULING: 'Scheduling incomplete',
      INCOMPLETE_VISIT_ADDRESS: 'Visit address incomplete',
      ACTIVE_OFFER: 'Provider offer active',
      ACCEPTED_AWAITING_CONFIRMATION: 'Awaiting confirmation',
      UNFULFILLABLE: 'Provider match needs review',
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

  private handleMatchingResult(result: MatchingResult, action: string): void {
    if (result.outcome === 'OFFER_CREATED') {
      this.statusMessage.set(`${action}. A provider offer was created.`);
      this.createdAssignmentId.set(result.assignmentId);
      return;
    }
    this.statusMessage.set(
      `${action}, but no eligible provider is currently available. Operations can continue reviewing the booking.`,
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
      409: 'The intervention conflicts with the current workflow, provider eligibility, or reserved capacity.',
      422: 'This booking is not ready for matching. Review its funding and scheduling information.',
    };
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? 'Automatic matching could not be retried right now.'),
    );
  }

  private handleInterventionError(error: HttpErrorResponse, fallback: string): void {
    const messages: Record<number, string> = {
      400: 'Review the selected provider and required reason, then try again.',
      404: 'The booking, provider, or assignment is no longer available.',
      409: 'The selected provider is not eligible, capacity is unavailable, or the booking workflow has changed.',
      422: 'The booking does not have complete scheduling information for this intervention.',
    };
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? fallback),
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
