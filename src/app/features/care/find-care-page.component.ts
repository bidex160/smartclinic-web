import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CareDeliveryMode,
  CareRequest,
  CreateCareRequest,
  PublicFindCareProvider,
} from '../../core/models/find-care.model';
import { careDeliveryModeLabel } from './care-delivery-mode';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestIntentService } from '../../core/services/care-request-intent.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { LocationDataService } from '../../core/services/location-data.service';

@Component({
  selector: 'app-find-care-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">
      SmartClinic care network
    </p>
    <h1 class="mt-2 text-4xl font-bold text-brand-950">Find Care</h1>
    <p class="mt-3 max-w-2xl text-slate-600">
      Tell us what care you need and where. SmartClinic uses current provider information to help
      coordinate your request.
    </p>
    @if (success(); as request) {
      <section class="mt-8 rounded-3xl border border-green-200 bg-green-50 p-7">
        <h2 class="text-2xl font-bold text-green-950">Care Request submitted</h2>
        <dl class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-600">Reference</dt>
            <dd class="font-bold">{{ request.reference }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Status</dt>
            <dd>{{ statusLabel(request.status) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Service</dt>
            <dd>{{ request.service.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Care type</dt>
            <dd>{{ deliveryModeLabel(request.deliveryMode) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Preferred provider</dt>
            <dd>{{ request.preferredProvider?.displayName || 'SmartClinic will match you' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Requested location</dt>
            <dd>
              {{ request.geography.city }}, {{ request.geography.stateOrRegion }},
              {{ request.geography.countryCode }}
            </dd>
          </div>
        </dl>
        <p class="mt-5 text-slate-700">
          We’ll show the current provider-response or matching step in My Care.
        </p>
        <a
          [routerLink]="['/me/care', request.reference]"
          class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
          >View My Care</a
        >
      </section>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 grid gap-7" novalidate>
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">1. Where do you need care?</legend>
          <div class="mt-3 grid gap-5 md:grid-cols-3">
            <label class="font-semibold"
              >Country<select
                formControlName="countryCode"
                (change)="countryChanged()"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">Select country</option>
                @for (c of countries; track c.isoCode) {
                  <option [value]="c.isoCode">{{ c.name }}</option>
                }
              </select></label
            ><label class="font-semibold"
              >State / Region<select
                formControlName="stateOrRegion"
                (change)="stateChanged()"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">Select state or region</option>
                @for (s of states(); track s.isoCode) {
                  <option [value]="s.name">{{ s.name }}</option>
                }
              </select></label
            ><label class="font-semibold"
              >City<select
                formControlName="city"
                (change)="discoverProviders()"
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
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">2. What do you need?</legend>
          @if (servicesLoading()) {
            <p role="status" class="mt-3">Loading care services…</p>
          } @else if (servicesError()) {
            <p role="alert" class="mt-3 text-red-700">
              We couldn't load care services.
              <button type="button" (click)="loadServices()" class="font-bold underline">
                Try again
              </button>
            </p>
          } @else {
            <label class="mt-3 block font-semibold"
              >Care service<select
                formControlName="serviceCode"
                (change)="discoverProviders()"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">Select the care you need</option>
                @for (s of services(); track s.code) {
                  <option [value]="s.code">{{ s.name }}</option>
                }
              </select></label
            >
            @if (selectedDescription()) {
              <p class="mt-3 text-sm text-slate-600">{{ selectedDescription() }}</p>
            }
          }
        </fieldset>
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">3. Delivery mode</legend>
          @if (deliveryModes().length) {
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              @for (mode of deliveryModes(); track mode) {
                <label
                  class="flex min-h-24 cursor-pointer gap-3 rounded-2xl border p-4 focus-within:ring-4 focus-within:ring-brand-200"
                  [class.border-brand-600]="form.controls.deliveryMode.value === mode"
                  [class.bg-brand-50]="form.controls.deliveryMode.value === mode"
                >
                  <input
                    type="radio"
                    formControlName="deliveryMode"
                    [value]="mode"
                    (change)="deliveryModeChanged()"
                  />
                  <span
                    ><strong class="block">{{ deliveryModeLabel(mode) }}</strong
                    ><span class="mt-1 block text-sm text-slate-600">{{
                      deliveryModeHelp(mode)
                    }}</span></span
                  >
                </label>
              }
            </div>
          } @else {
            <p class="mt-3 text-sm text-slate-600">
              Choose a location and service to see supported delivery modes.
            </p>
          }
        </fieldset>
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">4. Preferred provider</legend>
          <label class="mt-3 block font-semibold"
            >Provider<select
              formControlName="preferredProviderReference"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">No preference — help me choose</option>
              @for (p of providers(); track p.providerReference) {
                <option [value]="p.providerReference">{{ providerLabel(p) }}</option>
              }
            </select></label
          >
          @if (providersLoading()) {
            <p role="status" class="mt-3 text-sm">Finding matching providers…</p>
          } @else if (providerSearchReady() && !providers().length) {
            <div class="mt-3 rounded-xl bg-slate-50 p-4">
              <p>No providers currently match these filters.</p>
              <p class="mt-1 text-sm text-slate-600">
                Change the service or location, or keep “No preference” so SmartClinic can help
                match your request.
              </p>
            </div>
          }
          @if (providersError()) {
            <p role="alert" class="mt-3 text-red-700">
              Provider results are unavailable. Change a filter or try again.
            </p>
          }
        </fieldset>
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">5. Optional request details</legend>
          <div class="mt-3 grid gap-5 sm:grid-cols-2">
            <label class="font-semibold"
              >Preferred date (optional)<input
                type="date"
                formControlName="preferredDate"
                class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
            ><label class="font-semibold"
              >Preferred time (optional)<input
                type="time"
                formControlName="preferredTime"
                class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
            ><label class="font-semibold"
              >Contact method<select
                formControlName="contactMethod"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select></label
            ><label class="font-semibold sm:col-span-2"
              >Notes (optional)<textarea
                formControlName="notes"
                maxlength="4000"
                rows="4"
                placeholder="Share useful non-emergency request details"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            </label>
          </div>
        </fieldset>
        @if (error()) {
          <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
        }
        <button
          type="submit"
          [disabled]="submitting()"
          class="min-h-12 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {{ submitting() ? 'Submitting request…' : 'Submit Care Request' }}
        </button>
      </form>
      <aside class="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <h2 class="font-bold text-brand-950">Already have an appointment?</h2>
        <p class="mt-1 text-sm text-slate-700">
          Request FastTrack for priority appointment handling. Clinical urgency and medical triage
          always take priority.
        </p>
        <a
          routerLink="/me/fasttrack/new"
          class="mt-3 inline-block font-bold text-brand-800 underline"
          >I already have an appointment — request FastTrack</a
        >
      </aside>
    }
  </main>`,
})
export class FindCarePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FindCareApiService);
  private readonly care = inject(CareRequestsApiService);
  private readonly auth = inject(AuthStateService);
  private readonly intent = inject(CareRequestIntentService);
  private readonly router = inject(Router);
  private readonly locations = inject(LocationDataService);
  readonly countries = this.locations.getCountries();
  readonly states = signal<ReturnType<LocationDataService['getStates']>>([]);
  readonly cities = signal<ReturnType<LocationDataService['getCities']>>([]);
  readonly services = signal<
    readonly import('../../core/models/find-care.model').CareServiceDefinition[]
  >([]);
  readonly providers = signal<readonly PublicFindCareProvider[]>([]);
  readonly discoveryProviders = signal<readonly PublicFindCareProvider[]>([]);
  readonly servicesLoading = signal(true);
  readonly servicesError = signal(false);
  readonly providersLoading = signal(false);
  readonly providersError = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<CareRequest | null>(null);
  readonly form = this.fb.nonNullable.group({
    countryCode: ['NG', Validators.required],
    stateOrRegion: ['', Validators.required],
    city: ['', Validators.required],
    serviceCode: ['', Validators.required],
    deliveryMode: ['' as CareDeliveryMode | '', Validators.required],
    preferredProviderReference: [''],
    preferredDate: [''],
    preferredTime: [''],
    contactMethod: [
      'EMAIL' as import('../../core/models/find-care.model').CareRequestContactMethod,
      Validators.required,
    ],
    notes: ['', [Validators.maxLength(4000)]],
  });
  readonly selectedDescription = () =>
    this.services().find((s) => s.code === this.form.controls.serviceCode.value)?.description ??
    null;
  readonly providerSearchReady = () =>
    !!(
      this.form.controls.serviceCode.value &&
      this.form.controls.countryCode.value &&
      this.form.controls.stateOrRegion.value &&
      this.form.controls.city.value
    );
  readonly deliveryModes = () => {
    const service = this.services().find((s) => s.code === this.form.controls.serviceCode.value);
    if (service?.deliveryModes?.length) return service.deliveryModes;
    return [
      ...new Set(
        this.discoveryProviders().flatMap(
          (provider) =>
            provider.services.find((s) => s.code === this.form.controls.serviceCode.value)
              ?.deliveryModes ?? [],
        ),
      ),
    ];
  };
  constructor() {
    this.states.set(this.locations.getStates('NG'));
    this.loadServices();
    const saved = this.intent.take();
    if (saved) {
      this.form.patchValue(saved);
      this.states.set(this.locations.getStates(saved.countryCode));
      const state = this.states().find((s) => s.name === saved.stateOrRegion);
      if (state) this.cities.set(this.locations.getCities(saved.countryCode, state.isoCode));
      this.discoverProviders();
    }
  }
  loadServices() {
    this.servicesLoading.set(true);
    this.servicesError.set(false);
    this.api
      .getServices()
      .pipe(finalize(() => this.servicesLoading.set(false)))
      .subscribe({ next: (v) => this.services.set(v), error: () => this.servicesError.set(true) });
  }
  countryChanged() {
    this.form.patchValue({ stateOrRegion: '', city: '', preferredProviderReference: '' });
    this.states.set(this.locations.getStates(this.form.controls.countryCode.value));
    this.cities.set([]);
    this.providers.set([]);
  }
  stateChanged() {
    this.form.patchValue({ city: '', preferredProviderReference: '' });
    const state = this.states().find((s) => s.name === this.form.controls.stateOrRegion.value);
    this.cities.set(
      state ? this.locations.getCities(this.form.controls.countryCode.value, state.isoCode) : [],
    );
    this.providers.set([]);
  }
  discoverProviders() {
    this.form.controls.preferredProviderReference.setValue('');
    if (!this.providerSearchReady()) {
      this.providers.set([]);
      return;
    }
    this.providersLoading.set(true);
    this.providersError.set(false);
    const v = this.form.getRawValue();
    const deliveryMode = v.deliveryMode || undefined;
    this.api
      .getProviders({
        serviceCode: v.serviceCode,
        countryCode: v.countryCode,
        stateOrRegion: v.stateOrRegion,
        city: v.city,
        ...(deliveryMode ? { deliveryMode } : {}),
        limit: 50,
      })
      .pipe(finalize(() => this.providersLoading.set(false)))
      .subscribe({
        next: (p) => {
          if (!deliveryMode) {
            this.discoveryProviders.set(p.items);
            const available = this.deliveryModes();
            if (
              this.form.controls.deliveryMode.value &&
              !available.includes(this.form.controls.deliveryMode.value)
            )
              this.form.controls.deliveryMode.setValue('');
          }
          this.providers.set(deliveryMode ? p.items : []);
        },
        error: () => {
          this.providers.set([]);
          this.providersError.set(true);
        },
      });
  }
  deliveryModeChanged() {
    this.discoverProviders();
  }
  deliveryModeLabel(mode: CareDeliveryMode) {
    return careDeliveryModeLabel(mode);
  }
  deliveryModeHelp(mode: CareDeliveryMode) {
    return mode === 'VIRTUAL'
      ? 'Consult online; your geography remains important for coverage.'
      : mode === 'HOME_VISIT'
        ? 'Care at your selected service area.'
        : 'Attend an eligible provider location.';
  }
  providerLabel(p: PublicFindCareProvider) {
    const fast = p.services.find((s) => s.code === this.form.controls.serviceCode.value)
      ?.supportsFastTrack
      ? ' · FastTrack available'
      : '';
    return `${p.displayName} · ${p.providerType.replaceAll('_', ' ')} · ${p.location.city ?? this.form.controls.city.value}, ${p.location.stateOrRegion ?? this.form.controls.stateOrRegion.value}${fast}`;
  }
  request(): CreateCareRequest {
    const v = this.form.getRawValue();
    return {
      serviceCode: v.serviceCode,
      deliveryMode: v.deliveryMode as CareDeliveryMode,
      ...(v.preferredProviderReference
        ? { preferredProviderReference: v.preferredProviderReference }
        : {}),
      countryCode: v.countryCode,
      stateOrRegion: v.stateOrRegion,
      city: v.city,
      ...(v.preferredDate ? { preferredDate: v.preferredDate } : {}),
      ...(v.preferredTime ? { preferredTime: v.preferredTime } : {}),
      contactMethod: v.contactMethod,
      ...(v.notes.trim() ? { notes: v.notes.trim() } : {}),
    };
  }
  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.request();
    if (!this.auth.authenticated() || !this.auth.isPatient()) {
      this.intent.save(request);
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/request-care' } });
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.care
      .create(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (r) => this.success.set(r),
        error: (e) => {
          if (e?.status === 409) this.discoverProviders();
          this.error.set(
            e?.status === 409
              ? 'That provider or service is no longer available. We refreshed provider discovery; review your selection and try again.'
              : 'We could not submit your Care Request. Review the details and try again.',
          );
        },
      });
  }
  statusLabel(status: string) {
    return (
      (
        {
          MATCHING: 'Finding a provider',
          AWAITING_PROVIDER_RESPONSE: 'Waiting for provider',
          PROVIDER_ACCEPTED: 'Provider accepted',
        } as Record<string, string>
      )[status] ??
      status
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
}
