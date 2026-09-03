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
  FormControl,
  FormRecord,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdditionalHealthCheckResult,
  HealthCheckEncounterRequirement,
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
  readonly form = new FormRecord<FormControl<number | null>>({});

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
    const request = this.buildRequest();
    if (!request) {
      this.error.set('The encounter requirements do not contain all compatibility measurements.');
      return;
    }
    this.beginMutation();
    this.api
      .saveMeasurements(this.reference, request)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (encounter) => {
          this.applyEncounter(encounter);
          this.statusMessage.set('Health Check results were saved.');
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Health Check results could not be saved.'),
      });
  }

  requestCompletion(): void {
    if (
      this.encounter()?.status === 'IN_PROGRESS' && !this.mutating()
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

  recordedAt(code: string): string | null {
    return this.encounter()?.measurements.find((item) => item.code === code)?.recordedAt ?? null;
  }

  primaryControl(requirement: HealthCheckEncounterRequirement): FormControl<number | null> {
    return this.form.controls[this.controlKey(requirement.code, 'primary')];
  }
  secondaryControl(requirement: HealthCheckEncounterRequirement): FormControl<number | null> {
    return this.form.controls[this.controlKey(requirement.code, 'secondary')];
  }
  inputId(requirement: HealthCheckEncounterRequirement, part: 'primary' | 'secondary'): string {
    return `result-${encodeURIComponent(requirement.code)}-${part}`;
  }
  sourceLabel(requirement: HealthCheckEncounterRequirement): string {
    return requirement.source === 'SELECTED_ADDON' ? 'Selected add-on' : 'Included in package';
  }

  private buildRequest(): SaveHealthCheckMeasurementsRequest | null {
    const valueFor = (code: string, part: 'primary' | 'secondary' = 'primary') =>
      this.form.controls[this.controlKey(code, part)]?.value;
    const values = {
      systolic: valueFor('BLOOD_PRESSURE'),
      diastolic: valueFor('BLOOD_PRESSURE', 'secondary'),
      bloodGlucose: valueFor('BLOOD_GLUCOSE'),
      bmi: valueFor('BMI'),
      temperature: valueFor('TEMPERATURE'),
      oxygenSaturation: valueFor('OXYGEN_SATURATION'),
      pulse: valueFor('PULSE'),
    };
    if (Object.values(values).some((value) => value === null || value === undefined)) return null;
    const legacyCodes = new Set([
      'BLOOD_PRESSURE',
      'BLOOD_GLUCOSE',
      'BMI',
      'TEMPERATURE',
      'OXYGEN_SATURATION',
      'PULSE',
    ]);
    const additionalResults: AdditionalHealthCheckResult[] = [];
    const seen = new Set<string>();
    for (const requirement of this.encounter()?.requirements ?? []) {
      if (
        seen.has(requirement.code) ||
        legacyCodes.has(requirement.code) ||
        !requirement.requiresRecordedResult ||
        requirement.resultType === 'NONE'
      )
        continue;
      seen.add(requirement.code);
      const primary = this.primaryControl(requirement).value;
      if (primary === null) continue;
      if (requirement.resultType === 'BLOOD_PRESSURE') {
        const secondary = this.secondaryControl(requirement).value;
        if (secondary !== null)
          additionalResults.push({
            code: requirement.code,
            value: Number(primary),
            secondaryValue: Number(secondary),
          });
      } else {
        additionalResults.push({ code: requirement.code, value: Number(primary) });
      }
    }
    return {
      bloodPressure: { systolic: Number(values.systolic), diastolic: Number(values.diastolic) },
      bloodGlucose: { value: Number(values.bloodGlucose) },
      bmi: { value: Number(values.bmi) },
      temperature: { value: Number(values.temperature) },
      oxygenSaturation: { value: Number(values.oxygenSaturation) },
      pulse: { value: Number(values.pulse) },
      ...(additionalResults.length && { additionalResults }),
    };
  }
  private applyEncounter(encounter: ProviderHealthCheckEncounter): void {
    this.encounter.set(encounter);
    for (const key of Object.keys(this.form.controls)) this.form.removeControl(key);
    const seen = new Set<string>();
    for (const requirement of encounter.requirements) {
      if (seen.has(requirement.code) || requirement.resultType === 'NONE') continue;
      seen.add(requirement.code);
      const measurement = encounter.measurements.find((item) => item.code === requirement.code);
      const validators = [finiteFourDecimals];
      if (requirement.requiresRecordedResult) validators.unshift(Validators.required);
      this.form.addControl(
        this.controlKey(requirement.code, 'primary'),
        new FormControl<number | null>(measurement?.value ?? null, { validators }),
      );
      if (requirement.resultType === 'BLOOD_PRESSURE')
        this.form.addControl(
          this.controlKey(requirement.code, 'secondary'),
          new FormControl<number | null>(measurement?.secondaryValue ?? null, { validators }),
        );
    }
    encounter.status === 'IN_PROGRESS' ? this.form.enable() : this.form.disable();
  }
  private controlKey(code: string, part: 'primary' | 'secondary'): string {
    return `${part}:${encodeURIComponent(code)}`;
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
    const backendMessage = error.error?.message;
    const messages: Record<number, string> = {
      404: 'This booking or encounter is unavailable to this provider.',
      409: 'This Health Check cannot start until the booking has a confirmed scheduled appointment, or its lifecycle state no longer allows this action.',
      400: 'Review the Health Check result values and try again.',
      422: 'One or more Health Check result values could not be accepted.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : [400, 409, 422].includes(error.status) && typeof backendMessage === 'string'
          ? backendMessage
          : (messages[error.status] ?? fallback),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
