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
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  HealthCheckMeasurementCode,
  ProviderHealthCheckEncounter,
  SaveHealthCheckMeasurementsRequest,
} from '../../core/models/provider-health-check-encounter.model';
import { ProviderHealthCheckEncountersApiService } from '../../core/services/provider-health-check-encounters-api.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ConfirmedScheduleSummary } from '../../core/models/booking-schedule.model';
import { UtilsService } from '../../core/services/utils.service';

function finiteFourDecimals(control: AbstractControl): ValidationErrors | null {
  if (control.value === '' || control.value === null) return null;
  const value = Number(control.value);
  return Number.isFinite(value) && /^-?\d+(\.\d{1,4})?$/.test(String(control.value))
    ? null
    : { numeric: true };
}

@Component({
  selector: 'app-provider-health-check-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './provider-health-check-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderHealthCheckPageComponent {
  utilsService = inject(UtilsService);

  private readonly api = inject(ProviderHealthCheckEncountersApiService);
  private readonly offersApi = inject(ProviderOffersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';
  readonly encounter = signal<ProviderHealthCheckEncounter | null>(null);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly canStart = signal(false);
  readonly startSchedule = signal<ConfirmedScheduleSummary | null>(null);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly completionConfirmation = signal(false);
  readonly completed = computed(() => this.encounter()?.status === 'COMPLETED');
  readonly hasAllSavedMeasurements = computed(() => this.encounter()?.measurements.length === 6);

  private measurementControl() {
    return this.formBuilder.control<number | null>(null, [Validators.required, finiteFourDecimals]);
  }
  readonly form = this.formBuilder.group({
    systolic: this.measurementControl(),
    diastolic: this.measurementControl(),
    bloodGlucose: this.measurementControl(),
    bmi: this.measurementControl(),
    temperature: this.measurementControl(),
    oxygenSaturation: this.measurementControl(),
    pulse: this.measurementControl(),
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.reference || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.canStart.set(false);
    this.api
      .get(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (encounter) => this.applyEncounter(encounter),
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.loadStartEligibility();
            return;
          }
          this.handleError(error, 'The Health Check encounter could not be loaded.');
        },
      });
  }

  private loadStartEligibility(): void {
    this.offersApi.getOffers('CONFIRMED').subscribe({
      next: (offers) => {
        const offer = offers.find((item) => item.bookingReference === this.reference);
        this.startSchedule.set(offer?.confirmedSchedule ?? null);
        this.canStart.set(!!offer?.confirmedSchedule);
        if (!offer?.confirmedSchedule)
          this.error.set(
            'This booking is not ready to start. A confirmed scheduled appointment is required.',
          );
      },
      error: () =>
        this.error.set(
          'The booking schedule could not be verified. Return to My offers and try again.',
        ),
    });
  }

  start(): void {
    if ((!this.canStart() && this.encounter()?.status !== 'DRAFT') || this.mutating()) return;
    this.beginMutation();
    this.api
      .start(this.reference)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (encounter) => {
          this.canStart.set(false);
          this.applyEncounter(encounter);
          this.statusMessage.set('Smart Health Check started.');
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'The Health Check could not be started.'),
      });
  }

  save(): void {
    if (this.form.invalid || this.mutating() || this.encounter()?.status !== 'IN_PROGRESS') {
      this.form.markAllAsTouched();
      return;
    }
    this.beginMutation();
    this.api
      .saveMeasurements(this.reference, this.request())
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (encounter) => {
          this.applyEncounter(encounter);
          this.statusMessage.set('All six measurements were saved.');
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Measurements could not be saved.'),
      });
  }

  requestCompletion(): void {
    if (
      this.encounter()?.status === 'IN_PROGRESS' &&
      this.hasAllSavedMeasurements() &&
      !this.mutating()
    )
      this.completionConfirmation.set(true);
  }
  cancelCompletion(): void {
    this.completionConfirmation.set(false);
  }
  complete(): void {
    if (
      !this.completionConfirmation() ||
      this.encounter()?.status !== 'IN_PROGRESS' ||
      !this.hasAllSavedMeasurements() ||
      this.mutating()
    )
      return;
    this.beginMutation();
    this.api
      .complete(this.reference)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (encounter) => {
          this.completionConfirmation.set(false);
          this.applyEncounter(encounter);
          this.statusMessage.set('Smart Health Check completed. Measurements are now read-only.');
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'The Health Check could not be completed.'),
      });
  }

  recordedAt(code: HealthCheckMeasurementCode): string | null {
    return this.encounter()?.measurements.find((item) => item.code === code)?.recordedAt ?? null;
  }

  private request(): SaveHealthCheckMeasurementsRequest {
    const value = this.form.getRawValue();
    return {
      bloodPressure: { systolic: Number(value.systolic), diastolic: Number(value.diastolic) },
      bloodGlucose: { value: Number(value.bloodGlucose) },
      bmi: { value: Number(value.bmi) },
      temperature: { value: Number(value.temperature) },
      oxygenSaturation: { value: Number(value.oxygenSaturation) },
      pulse: { value: Number(value.pulse) },
    };
  }
  private applyEncounter(encounter: ProviderHealthCheckEncounter): void {
    this.encounter.set(encounter);
    const measurement = (code: HealthCheckMeasurementCode) =>
      encounter.measurements.find((item) => item.code === code);
    this.form.setValue({
      systolic: measurement('BLOOD_PRESSURE')?.value ?? null,
      diastolic: measurement('BLOOD_PRESSURE')?.secondaryValue ?? null,
      bloodGlucose: measurement('BLOOD_GLUCOSE')?.value ?? null,
      bmi: measurement('BMI')?.value ?? null,
      temperature: measurement('TEMPERATURE')?.value ?? null,
      oxygenSaturation: measurement('OXYGEN_SATURATION')?.value ?? null,
      pulse: measurement('PULSE')?.value ?? null,
    });
    encounter.status === 'IN_PROGRESS' ? this.form.enable() : this.form.disable();
  }
  private beginMutation(): void {
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
  }
  private handleError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 403) {
      void this.router.navigate(['/provider/access-denied']);
      return;
    }
    const messages: Record<number, string> = {
      404: 'This booking or encounter is unavailable to this provider.',
      409: 'This Health Check cannot start until the booking has a confirmed scheduled appointment, or its lifecycle state no longer allows this action.',
      400: 'Review all six measurement values and try again.',
      422: 'One or more measurement values could not be accepted.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? fallback),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
