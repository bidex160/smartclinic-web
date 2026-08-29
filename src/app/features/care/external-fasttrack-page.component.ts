import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PublicFindCareProvider } from '../../core/models/find-care.model';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
@Component({
  selector: 'app-external-fasttrack-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/me/fasttrack" class="font-bold text-brand-700 underline"
      >← FastTrack requests</a
    >
    <p class="mt-6 text-sm font-bold uppercase text-brand-600">Existing appointment</p>
    <h1 class="mt-2 text-3xl font-bold">Request FastTrack</h1>
    <p class="mt-3 text-slate-600">
      Ask a participating provider to verify your existing appointment for priority handling and a
      shorter expected waiting time. Clinical urgency and medical triage always take priority.
    </p>
    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="mt-8 grid gap-6 rounded-3xl border bg-white p-6"
      novalidate
    >
      <fieldset>
        <legend class="text-lg font-bold">Find your provider</legend>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <label
            >Country<select
              formControlName="countryCode"
              (change)="countryChanged($any($event.target).value)"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              @for (c of countries; track c.isoCode) {
                <option [value]="c.isoCode">{{ c.name }}</option>
              }
            </select></label
          ><label
            >State / Region<select
              [formControl]="fastTrackStateCode"
              (change)="stateChanged($any($event.target).value)"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">Select state</option>
              @for (s of states(); track s.isoCode) {
                <option [value]="s.isoCode">{{ s.name }}</option>
              }
            </select></label
          ><label
            >City<select
              formControlName="city"
              (change)="loadProviders()"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">Select city</option>
              @for (c of cities(); track c.name) {
                <option [value]="c.name">{{ c.name }}</option>
              }
            </select></label
          >
        </div>
      </fieldset>
      <label class="font-semibold"
        >Provider<select
          formControlName="providerReference"
          (change)="providerChanged()"
          class="mt-2 min-h-12 w-full rounded-xl border px-3"
        >
          <option value="">Select a FastTrack provider</option>
          @for (p of providers(); track p.providerReference) {
            <option [value]="p.providerReference">
              {{ p.displayName }} · {{ p.providerType.replaceAll('_', ' ') }}
            </option>
          }
        </select></label
      >
      @if (providerLoading()) {
        <p role="status">Finding FastTrack providers…</p>
      } @else if (searchReady() && !providers().length) {
        <p class="rounded-xl bg-slate-50 p-4">
          No providers currently match these filters with FastTrack support.
        </p>
      }
      <label class="font-semibold"
        >Service<select
          formControlName="serviceCode"
          class="mt-2 min-h-12 w-full rounded-xl border px-3"
        >
          <option value="">Select service</option>
          @for (s of fastServices(); track s.code) {
            <option [value]="s.code">
              {{ s.name }} · FastTrack {{ money(s.fastTrackFeeMinor, s.fastTrackCurrency) }}
            </option>
          }
        </select></label
      >
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="font-semibold"
          >External appointment reference<input
            formControlName="externalAppointmentReference"
            placeholder="e.g. HOSP-APT-12345"
            class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
        ><label class="font-semibold"
          >Appointment date<input
            type="date"
            formControlName="appointmentDate"
            class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
        ><label class="font-semibold"
          >Appointment time (optional)<input
            type="time"
            formControlName="appointmentTime"
            class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
        ><label class="font-semibold"
          >Department (optional)<input
            formControlName="department"
            placeholder="e.g. Outpatient clinic"
            class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
        ><label class="font-semibold"
          >Doctor name (optional)<input
            formControlName="doctorName"
            placeholder="e.g. Dr Adeyemi"
            class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
        ><label class="font-semibold sm:col-span-2"
          >Notes (optional)<textarea
            formControlName="notes"
            rows="3"
            maxlength="4000"
            placeholder="Add useful appointment details"
            class="mt-2 w-full rounded-xl border p-3"
          ></textarea>
        </label>
      </div>
      @if (error()) {
        <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
      }
      <button
        type="submit"
        [disabled]="submitting()"
        class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {{ submitting() ? 'Submitting FastTrack request…' : 'Submit for provider verification' }}
      </button>
    </form>
  </main>`,
})
export class ExternalFastTrackPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly find = inject(FindCareApiService);
  private readonly fast = inject(FastTrackApiService);
  private readonly location = inject(LocationDataService);
  private readonly router = inject(Router);
  readonly countries = this.location.getCountries();
  readonly states = signal<ReturnType<LocationDataService['getStates']>>(
    this.location.getStates('NG'),
  );
  readonly cities = signal<ReturnType<LocationDataService['getCities']>>([]);
  readonly fastTrackStateCode = new FormControl('', { nonNullable: true });
  readonly providers = signal<readonly PublicFindCareProvider[]>([]);
  readonly providerLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    countryCode: ['NG', Validators.required],
    stateOrRegion: ['', Validators.required],
    city: ['', Validators.required],
    providerReference: ['', Validators.required],
    serviceCode: ['', Validators.required],
    externalAppointmentReference: ['', [Validators.required, Validators.maxLength(160)]],
    appointmentDate: ['', Validators.required],
    appointmentTime: [''],
    department: ['', [Validators.maxLength(160)]],
    doctorName: ['', [Validators.maxLength(160)]],
    notes: ['', [Validators.maxLength(4000)]],
  });
  readonly selectedProvider = () =>
    this.providers().find(
      (p) => p.providerReference === this.form.controls.providerReference.value,
    );
  readonly fastServices = () =>
    this.selectedProvider()?.services.filter((s) => s.supportsFastTrack) ?? [];
  readonly searchReady = () =>
      !!(
        this.form.controls.countryCode.value &&
        this.form.controls.stateOrRegion.value &&
        this.form.controls.city.value
      );
  countryChanged(countryCode: string) {
    this.form.controls.countryCode.setValue(countryCode, { emitEvent: false });
    this.fastTrackStateCode.setValue('', { emitEvent: false });
    this.form.patchValue({ stateOrRegion: '', city: '', providerReference: '', serviceCode: '' });
    this.states.set(this.location.getStates(this.form.controls.countryCode.value));
    this.cities.set([]);
    this.providers.set([]);
  }
  stateChanged(stateCode: string) {
    this.form.patchValue({ city: '', providerReference: '', serviceCode: '' });
    this.fastTrackStateCode.setValue(stateCode, { emitEvent: false });
    const s = this.states().find((x) => x.isoCode === stateCode);
    this.form.controls.stateOrRegion.setValue(s?.name ?? '');
    this.cities.set(
      s ? this.location.getCities(this.form.controls.countryCode.value, stateCode) : [],
    );
    this.providers.set([]);
  }
  loadProviders() {
    this.form.patchValue({ providerReference: '', serviceCode: '' });
    if (!this.searchReady()) return;
    this.providerLoading.set(true);
    const v = this.form.getRawValue();
    this.find
      .getProviders({
        countryCode: v.countryCode,
        stateOrRegion: v.stateOrRegion,
        city: v.city,
        limit: 50,
      })
      .pipe(finalize(() => this.providerLoading.set(false)))
      .subscribe({
        next: (p) =>
          this.providers.set(p.items.filter((x) => x.services.some((s) => s.supportsFastTrack))),
        error: () =>
          this.error.set('We could not load FastTrack providers. Try changing the location.'),
      });
  }
  providerChanged() {
    this.form.controls.serviceCode.setValue('');
  }
  money(minor: number | null, currency: string | null) {
    if (minor == null || !currency) return 'fee unavailable';
    const digits = new Intl.NumberFormat('en-NG', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
      minor / 10 ** digits,
    );
  }
  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.fast
      .createExternal({
        providerReference: v.providerReference,
        serviceCode: v.serviceCode,
        externalAppointmentReference: v.externalAppointmentReference.trim(),
        appointmentDate: v.appointmentDate,
        ...(v.appointmentTime ? { appointmentTime: v.appointmentTime } : {}),
        ...(v.department.trim() ? { department: v.department.trim() } : {}),
        ...(v.doctorName.trim() ? { doctorName: v.doctorName.trim() } : {}),
        ...(v.notes.trim() ? { notes: v.notes.trim() } : {}),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (r) => void this.router.navigate(['/me/fasttrack', r.reference]),
        error: () =>
          this.error.set(
            'We could not create this FastTrack request. Confirm the provider and appointment details and try again.',
          ),
      });
  }
}
