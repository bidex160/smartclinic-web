import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {
  CareDeliveryMode,
  CareRequest,
  CreateCareRequest,
  PublicFindCareProvider,
} from '../../core/models/find-care.model';
import { careDeliveryModeLabel } from './care-delivery-mode';
import { formatMinor } from '../provider/care-money';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestIntentService } from '../../core/services/care-request-intent.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { DependantsApiService } from '../../core/services/dependants-api.service';
import { Dependant, HealthCheckParticipantSelection } from '../../core/models/dependant.model';

@Component({
  selector: 'app-find-care-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="care-discovery-page mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">
      SmartClinic care network
    </p>
    <h1 class="mt-2 text-4xl font-bold text-brand-950">{{ doctorJourney() ? 'See a Doctor' : (testJourney() ? 'Get a Test' : 'Find Care') }}</h1>
    <p class="mt-3 max-w-2xl text-slate-600">
      {{ doctorJourney()
        ? 'Choose how you want to see a doctor. You do not need to know a specialty before you start.'
        : (testJourney()
          ? 'Choose the kind of test you need. If a doctor has already requested a test for you, SmartClinic should carry that request forward.'
          : 'Tell us what care you need and how you would like to receive it. SmartClinic uses current provider information to help coordinate your request.') }}
    </p>
    @if (testJourney()) {
      <section class="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Test options">
        <button type="button" (click)="chooseTestType('LAB_REQUEST')" [attr.aria-pressed]="form.controls.serviceCode.value === 'LAB_REQUEST'" [class.border-brand-600]="form.controls.serviceCode.value === 'LAB_REQUEST'" class="care-choice min-h-28 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <strong class="block text-lg text-brand-950">Lab Test</strong>
          <span class="mt-1 block text-sm text-slate-600">Blood, urine and other laboratory tests.</span>
        </button>
        <button type="button" (click)="chooseTestType('IMAGING_REQUEST')" [attr.aria-pressed]="form.controls.serviceCode.value === 'IMAGING_REQUEST'" [class.border-brand-600]="form.controls.serviceCode.value === 'IMAGING_REQUEST'" class="care-choice min-h-28 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <strong class="block text-lg text-brand-950">X-ray or Scan</strong>
          <span class="mt-1 block text-sm text-slate-600">X-ray, ultrasound, CT, MRI and other scans.</span>
        </button>
      </section>
    }
    @if (unavailableService()) {
      <p role="alert" class="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900">{{ unavailableService() }} is not currently available. Choose another service or contact your hospital.</p>
    }
    @if (doctorJourney()) {
      <section class="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Doctor options">
        <button type="button" (click)="chooseDoctorMode('VIRTUAL')" class="care-choice min-h-28 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <strong class="block text-lg text-brand-950">Talk to a Doctor</strong>
          <span class="mt-1 block text-sm text-slate-600">Request a virtual consultation with a care provider.</span>
        </button>
        <button type="button" (click)="chooseDoctorMode('LATER')" class="care-choice min-h-28 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <strong class="block text-lg text-brand-950">Book for Later</strong>
          <span class="mt-1 block text-sm text-slate-600">Choose a date or time that suits you.</span>
        </button>
        <a routerLink="/me/providers" class="care-choice min-h-28 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <strong class="block text-lg text-brand-950">Visit a Hospital</strong>
          <span class="mt-1 block text-sm text-slate-600">Choose a hospital for in-person care.</span>
        </a>
      </section>
    }
    @if (doctorJourney() && requestedServiceIsValid() && !success()) {
      <section class="mt-8 rounded-[2rem] border border-violet-100 bg-gradient-to-b from-white to-violet-50 p-6 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-[.16em] text-brand-600">Virtual consultations</p>
        <h2 class="mt-1 text-2xl font-black text-brand-950">Choose your care provider</h2>
        <p class="mt-2 text-sm text-slate-600">Choose a practitioner or clinic for your consultation. Review the current price before continuing.</p>
        @if (providersLoading()) {
          <p class="mt-5 rounded-2xl bg-white p-5 text-slate-600">Finding available doctors…</p>
        } @else if (providers().length) {
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            @for (p of providers(); track p.providerReference) {
              <button type="button" (click)="chooseDoctor(p)" [attr.aria-pressed]="form.controls.preferredProviderReference.value === p.providerReference" class="care-provider-card rounded-2xl border border-slate-200 bg-white p-5 text-left" [class.border-brand-600]="form.controls.preferredProviderReference.value === p.providerReference" [class.ring-2]="form.controls.preferredProviderReference.value === p.providerReference" [class.ring-brand-100]="form.controls.preferredProviderReference.value === p.providerReference">
                <span class="flex items-start gap-4">
                  <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl" aria-hidden="true">{{ providerInitials(p.displayName) }}</span>
                  <span class="min-w-0"><strong class="block text-lg text-brand-950">{{ p.displayName }}</strong><span class="mt-1 block text-sm text-slate-500">{{ providerKind(p.providerType) }} · Virtual consultation</span>
                  @if (doctorPrice(p); as price) { <span class="mt-3 block font-black text-brand-800">{{ formatPrice(price.priceMinor, price.currency) }}<span class="ml-2 text-xs font-medium text-slate-500">per consultation</span></span> }
                  @if (form.controls.preferredProviderReference.value === p.providerReference) { <span class="mt-3 inline-flex rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white">Selected ✓</span> }
                  </span>
                </span>
              </button>
            }
          </div>
        } @else if (providersError()) {
          <p class="mt-5 rounded-2xl bg-red-50 p-4 text-red-800">Doctors are temporarily unavailable. Please try again.</p>
        } @else {
          <p class="mt-5 rounded-2xl bg-white p-5 text-slate-600">No online doctors are showing yet. You can try again shortly or visit a hospital.</p>
        }
      </section>
    }
    @if (success(); as request) {
      <section class="mt-8 rounded-3xl border border-green-200 bg-green-50 p-7">
        <h2 class="text-2xl font-bold text-green-950">Your request is in</h2>
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
            <dt class="text-sm text-slate-600">Care for</dt>
            <dd>{{ request.participant?.displayName ?? 'You' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Service price</dt>
            <dd class="font-bold">
              {{
                request.service.price
                  ? formatPrice(request.service.price.priceMinor, request.service.price.currency)
                  : 'Price will be determined when a Provider is assigned.'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Preferred provider</dt>
            <dd>{{ request.preferredProvider?.displayName || 'SmartClinic will match you' }}</dd>
          </div>
          @if (request.geography; as geography) {
            <div>
              <dt class="text-sm text-slate-600">Requested location</dt>
              <dd>
                {{ geography.city }}, {{ geography.stateOrRegion }}, {{ geography.countryCode }}
              </dd>
            </div>
          } @else if (request.deliveryMode === 'VIRTUAL') {
            <div>
              <dt class="text-sm text-slate-600">Location</dt>
              <dd>Virtual care</dd>
            </div>
          }
        </dl>
        <p class="mt-5 text-slate-700">
          SmartClinic will keep the next step here in My Care. You do not need to start again.
        </p>
        <a
          [routerLink]="['/me/care', request.reference]"
          class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
          >View My Care</a
        >
      </section>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 grid gap-7" novalidate>
        <fieldset class="rounded-3xl border bg-white p-6" [class.hidden]="doctorJourney() && requestedServiceIsValid()">
          <legend class="px-2 text-xl font-bold">1. What do you need?</legend>
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
                (change)="serviceChanged()"
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
          <legend class="px-2 text-xl font-bold">Who is this for?</legend>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
              ><input
                type="radio"
                name="care-participant"
                [checked]="participant().kind === 'SELF'"
                (change)="selectParticipant({ kind: 'SELF' })"
              />
              <span>Me</span></label
            >
            @for (dependant of dependants(); track dependant.patientReference) {
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
                ><input
                  type="radio"
                  name="care-participant"
                  [checked]="isDependantSelected(dependant.patientReference)"
                  (change)="
                    selectParticipant({
                      kind: 'DEPENDANT',
                      patientReference: dependant.patientReference,
                      displayName: dependant.displayName,
                    })
                  "
                />
                <span>{{ dependant.displayName }}</span></label
              >
            }
          </div>
          <a
            routerLink="/me/family"
            class="mt-2 inline-block text-sm font-semibold text-brand-700 underline"
            >Add someone</a
          >
          @if (dependantsError()) {
            <p class="mt-2 text-sm text-slate-600">
              Dependants could not be loaded. You can still request care for yourself.
            </p>
          }
        </fieldset>
        <fieldset class="rounded-3xl border bg-white p-6" [class.hidden]="doctorJourney()">
          <legend class="px-2 text-xl font-bold">2. Delivery mode</legend>
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
              {{ providersLoading() ? 'Checking available delivery modes…' : providersError() ? 'We could not check availability. Try provider search again.' : form.controls.serviceCode.value ? 'No delivery modes are currently available for this service.' : 'Choose a care service to see supported delivery modes.' }}
            </p>
          }
        </fieldset>
        @if (form.controls.deliveryMode.touched && form.controls.deliveryMode.hasError('required')) {
          <p role="alert" class="text-red-700">Choose an available delivery mode before submitting.</p>
        }
        @if (requiresGeography()) {
          <fieldset class="rounded-3xl border bg-white p-6">
            <legend class="px-2 text-xl font-bold">3. Location</legend>
            <div class="mt-3 grid gap-5 md:grid-cols-3">
              <label class="font-semibold"
                >Country<select
                  formControlName="countryCode"
                  (change)="countryChanged($any($event.target).value)"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">Select country</option>
                  @for (c of countries; track c.isoCode) {
                    <option [value]="c.isoCode">{{ c.name }}</option>
                  }
                </select></label
              ><label class="font-semibold"
                >State / Region<select
                  [formControl]="requestStateCode"
                  (change)="stateChanged($any($event.target).value)"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">Select state or region</option>
                  @for (s of states(); track s.isoCode) {
                    <option [value]="s.isoCode">{{ s.name }}</option>
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
        }
        <fieldset class="rounded-3xl border bg-white p-6" [class.hidden]="doctorJourney()">
          <legend class="px-2 text-xl font-bold">
            {{ requiresGeography() ? '4' : '3' }}. Preferred provider
          </legend>
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
          } @else if (providerSearchReady() && !providersError() && !providers().length) {
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
              Provider results are unavailable.
              <button type="button" (click)="discoverProviders()" class="font-bold underline">Try again</button>
            </p>
          }
          @if (selectedProviderPrice(); as price) {
            <div class="mt-4 rounded-xl bg-brand-50 p-4">
              <p class="text-sm text-slate-600">
                {{ deliveryModeLabel(form.controls.deliveryMode.value || 'IN_PERSON') }} service
                price
              </p>
              <p class="mt-1 text-xl font-bold">
                {{ formatPrice(price.priceMinor, price.currency) }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                The backend confirms and snapshots the authoritative request price.
              </p>
            </div>
          } @else if (
            !form.controls.preferredProviderReference.value && form.controls.deliveryMode.value
          ) {
            <p class="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
              Price will be determined when a Provider is assigned.
            </p>
          }
        </fieldset>
        <fieldset class="rounded-3xl border bg-white p-6">
          <legend class="px-2 text-xl font-bold">
            {{ doctorJourney() ? 'Anything else?' : (requiresGeography() ? '5. Optional request details' : '4. Optional request details') }}
          </legend>
          @if (doctorJourney()) {
            <p class="mt-2 text-sm text-slate-600">SmartClinic recommends a time for your consultation. Keep it or change it before continuing.</p>
            @if (form.controls.preferredDate.value && form.controls.preferredTime.value) {
              <div class="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <p class="text-xs font-bold uppercase tracking-wide text-brand-700">Recommended time</p>
                <p class="mt-1 text-lg font-black text-brand-950">{{ form.controls.preferredDate.value }} · {{ form.controls.preferredTime.value }}</p>
                <p class="mt-1 text-sm text-slate-600">Your doctor can accept this time or suggest another.</p>
              </div>
            }
          }
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
          [disabled]="submitting() || providersLoading() || providersError()"
          class="min-h-12 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {{ submitting() ? 'Requesting consultation…' : (doctorJourney() ? 'Continue with this doctor →' : 'Submit Care Request') }}
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
  private readonly dependantsApi = inject(DependantsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly countries = this.locations.getCountries();
  readonly states = signal<ReturnType<LocationDataService['getStates']>>([]);
  readonly cities = signal<ReturnType<LocationDataService['getCities']>>([]);
  readonly requestStateCode = new FormControl('', { nonNullable: true });
  readonly services = signal<
    readonly import('../../core/models/find-care.model').CareServiceDefinition[]
  >([]);
  readonly providers = signal<readonly PublicFindCareProvider[]>([]);
  readonly discoveryProviders = signal<readonly PublicFindCareProvider[]>([]);
  readonly servicesLoading = signal(true);
  readonly servicesError = signal(false);
  readonly requestedServiceCode = signal<string | null>(null);
  readonly doctorJourney = signal(false);
  readonly testJourney = signal(false);
  readonly servicesLoaded = signal(false);
  readonly unavailableService = signal<string | null>(null);
  private discoverySubscription?: Subscription;
  private draftRestored = false;
  private draftDiscoveryStarted = false;
  readonly providersLoading = signal(false);
  readonly providersError = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<CareRequest | null>(null);
  readonly dependants = signal<readonly Dependant[]>([]);
  readonly dependantsError = signal(false);
  readonly participant = signal<HealthCheckParticipantSelection>({ kind: 'SELF' });
  readonly form = this.fb.nonNullable.group({
    countryCode: ['NG'],
    stateOrRegion: [''],
    city: [''],
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
  readonly requiresGeography = () => {
    const mode = this.form.controls.deliveryMode.value;
    return mode === 'IN_PERSON' || mode === 'HOME_VISIT';
  };
  readonly providerSearchReady = () => {
    if (!this.form.controls.serviceCode.value || !this.form.controls.deliveryMode.value)
      return false;
    return (
      !this.requiresGeography() ||
      !!(
        this.form.controls.countryCode.value &&
        this.form.controls.stateOrRegion.value &&
        this.form.controls.city.value
      )
    );
  };
  readonly deliveryModes = () => {
    return [
      ...new Set(
        this.discoveryProviders().flatMap(
          (provider) =>
            provider.services
              .find((s) => s.code === this.form.controls.serviceCode.value)
              ?.deliveryOptions.map((option) => option.deliveryMode) ?? [],
        ),
      ),
    ];
  };
  constructor() {
    inject(DestroyRef).onDestroy(() => this.discoverySubscription?.unsubscribe());
    this.doctorJourney.set(this.route.snapshot.queryParamMap.get('journey') === 'doctor');
    this.testJourney.set(this.route.snapshot.queryParamMap.get('journey') === 'test');
    this.requestedServiceCode.set(this.readRequestedServiceCode(this.route.snapshot.queryParamMap.get('serviceCode')));
    this.route.queryParamMap.subscribe((params) => {
      this.doctorJourney.set(params.get('journey') === 'doctor');
      this.testJourney.set(params.get('journey') === 'test');
      this.requestedServiceCode.set(this.readRequestedServiceCode(params.get('serviceCode')));
      this.applyRequestedServiceCode();
    });
    this.states.set(this.locations.getStates('NG'));
    this.loadServices();
    this.dependantsApi
      .getDependants()
      .subscribe({
        next: (v) => this.dependants.set(v.items),
        error: () => this.dependantsError.set(true),
      });
    const saved = this.intent.take();
    if (saved) {
      this.form.patchValue(saved);
      this.updateGeographyValidators();
      if (saved.countryCode && saved.stateOrRegion) {
        this.states.set(this.locations.getStates(saved.countryCode));
        const state = this.states().find(
          (s) => s.name.trim().toLowerCase() === saved.stateOrRegion?.trim().toLowerCase(),
        );
        if (state) {
          this.requestStateCode.setValue(state.isoCode, { emitEvent: false });
          this.cities.set(this.locations.getCities(saved.countryCode, state.isoCode));
        }
      }
      this.draftRestored = true;
    }
  }
  chooseTestType(serviceCode: 'LAB_REQUEST' | 'IMAGING_REQUEST') {
    this.requestedServiceCode.set(serviceCode);
    this.applyRequestedServiceCode();
  }

  chooseDoctor(p: PublicFindCareProvider) {
    this.form.controls.preferredProviderReference.setValue(p.providerReference);
  }
  providerInitials(name: string): string {
    return name.trim().split(/\s+/).filter(part => !/^dr\.?$/i.test(part)).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'SC';
  }
  providerKind(type: string): string {
    return ({ INDIVIDUAL: 'Practitioner', CLINIC: 'Clinic', DIAGNOSTIC_CENTRE: 'Diagnostic centre', PHARMACY: 'Pharmacy' } as Record<string, string>)[type] ?? 'Care provider';
  }
  doctorPrice(p: PublicFindCareProvider) {
    return p.services.find((s) => s.code === this.form.controls.serviceCode.value)?.deliveryOptions.find((o) => o.deliveryMode === 'VIRTUAL') ?? null;
  }
  chooseDoctorMode(mode: 'VIRTUAL' | 'LATER') {
    if (mode === 'VIRTUAL') {
      const suggested = new Date(Date.now() + 30 * 60 * 1000);
      suggested.setMinutes(Math.ceil(suggested.getMinutes() / 15) * 15, 0, 0);
      const yyyy = suggested.getFullYear();
      const mm = String(suggested.getMonth() + 1).padStart(2, '0');
      const dd = String(suggested.getDate()).padStart(2, '0');
      const hh = String(suggested.getHours()).padStart(2, '0');
      const mi = String(suggested.getMinutes()).padStart(2, '0');
      this.form.patchValue({ deliveryMode: 'VIRTUAL', preferredDate: `${yyyy}-${mm}-${dd}`, preferredTime: `${hh}:${mi}` });
      this.updateGeographyValidators();
      this.discoverProviders();
      return;
    }
    const suggested = new Date();
    suggested.setDate(suggested.getDate() + 1);
    suggested.setHours(9, 0, 0, 0);
    const yyyy = suggested.getFullYear();
    const mm = String(suggested.getMonth() + 1).padStart(2, '0');
    const dd = String(suggested.getDate()).padStart(2, '0');
    this.form.patchValue({
      deliveryMode: 'VIRTUAL',
      preferredDate: `${yyyy}-${mm}-${dd}`,
      preferredTime: '09:00',
    });
    this.updateGeographyValidators();
    this.discoverProviders();
  }

  selectParticipant(selection: HealthCheckParticipantSelection) {
    this.participant.set(selection);
  }
  isDependantSelected(reference: string) {
    const p = this.participant();
    return p.kind === 'DEPENDANT' && p.patientReference === reference;
  }
  participantRequest(): { participantPatientReference?: string } {
    const p = this.participant();
    return p.kind === 'DEPENDANT' ? { participantPatientReference: p.patientReference } : {};
  }
  loadServices() {
    this.servicesLoading.set(true);
    this.servicesError.set(false);
    this.api
      .getServices()
      .pipe(finalize(() => this.servicesLoading.set(false)))
      .subscribe({
        next: (v) => {
          this.services.set(v);
          this.servicesLoaded.set(true);
          this.applyRequestedServiceCode();
          if (this.draftRestored && !this.requestedServiceIsValid() && !this.draftDiscoveryStarted) {
            this.draftDiscoveryStarted = true;
            this.discoverProviders();
          }
        },
        error: () => this.servicesError.set(true),
      });
  }

  private readRequestedServiceCode(value: string | null): string | null {
    const normalized = value?.trim() ?? '';
    return normalized || null;
  }

  private applyRequestedServiceCode(): void {
    if (!this.servicesLoaded()) return;
    const requested = this.requestedServiceCode();
    if (!requested) return;
    if (!this.services().some((service) => service.code === requested)) {
      this.form.controls.serviceCode.setValue('');
      this.serviceChanged();
      this.unavailableService.set(requested === 'IMAGING_REQUEST' ? 'X-ray or Scan' : requested === 'LAB_REQUEST' ? 'Lab Test' : 'This service');
      return;
    }
    this.unavailableService.set(null);
    if (this.form.controls.serviceCode.value === requested) return;
    this.form.controls.serviceCode.setValue(requested);
    this.serviceChanged();
  }

   requestedServiceIsValid(): boolean {
    const requested = this.requestedServiceCode();
    return !!requested && this.services().some((service) => service.code === requested);
  }
  countryChanged(countryCode: string) {
    this.discoverySubscription?.unsubscribe();
    this.form.controls.countryCode.setValue(countryCode, { emitEvent: false });
    this.requestStateCode.setValue('', { emitEvent: false });
    this.form.patchValue({ stateOrRegion: '', city: '', preferredProviderReference: '' });
    this.states.set(this.locations.getStates(this.form.controls.countryCode.value));
    this.cities.set([]);
    this.providers.set([]);
  }
  stateChanged(stateCode: string) {
    this.discoverySubscription?.unsubscribe();
    this.form.patchValue({ city: '', preferredProviderReference: '' });
    this.requestStateCode.setValue(stateCode, { emitEvent: false });
    const state = this.states().find((s) => s.isoCode === stateCode);
    this.form.controls.stateOrRegion.setValue(state?.name ?? '');
    this.cities.set(
      state ? this.locations.getCities(this.form.controls.countryCode.value, stateCode) : [],
    );
    this.providers.set([]);
  }
  serviceChanged() {
    this.unavailableService.set(null);
    this.form.patchValue({ deliveryMode: this.doctorJourney() ? 'VIRTUAL' : '', preferredProviderReference: '' });
    this.discoveryProviders.set([]);
    this.providers.set([]);
    this.updateGeographyValidators();
    this.discoverProviders();
  }
  discoverProviders() {
    this.discoverySubscription?.unsubscribe();
    this.providersLoading.set(false);
    this.providersError.set(false);
    this.form.controls.preferredProviderReference.setValue('');
    const v = this.form.getRawValue();
    const deliveryMode = v.deliveryMode || undefined;
    if (!v.serviceCode || (deliveryMode && !this.providerSearchReady())) {
      this.providers.set([]);
      return;
    }
    this.providersLoading.set(true);
    this.providersError.set(false);
    this.discoverySubscription = this.api
      .getProviders({
        serviceCode: v.serviceCode,
        ...(deliveryMode ? { deliveryMode } : {}),
        ...(deliveryMode && deliveryMode !== 'VIRTUAL'
          ? {
              countryCode: v.countryCode,
              stateOrRegion: v.stateOrRegion,
              city: v.city,
            }
          : {}),
        limit: 50,
      })
      .pipe(finalize(() => this.providersLoading.set(false)))
      .subscribe({
        next: (p) => {
          if (!deliveryMode) this.discoveryProviders.set(p.items);
          this.providers.set(deliveryMode ? p.items : []);
        },
        error: () => {
          this.providers.set([]);
          this.providersError.set(true);
        },
      });
  }
  deliveryModeChanged() {
    this.form.controls.preferredProviderReference.setValue('');
    this.updateGeographyValidators();
    this.discoverProviders();
  }
  private updateGeographyValidators() {
    for (const control of [
      this.form.controls.countryCode,
      this.form.controls.stateOrRegion,
      this.form.controls.city,
    ]) {
      if (this.requiresGeography()) control.setValidators(Validators.required);
      else control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
  deliveryModeLabel(mode: CareDeliveryMode) {
    return careDeliveryModeLabel(mode);
  }
  deliveryModeHelp(mode: CareDeliveryMode) {
    return mode === 'VIRTUAL'
      ? 'Consult online from anywhere; no service location is required.'
      : mode === 'HOME_VISIT'
        ? 'Care at your selected service area.'
        : 'Attend an eligible provider location.';
  }
  providerLabel(p: PublicFindCareProvider) {
    const fast = p.services.find((s) => s.code === this.form.controls.serviceCode.value)
      ?.supportsFastTrack
      ? ' · FastTrack available'
      : '';
    const option = p.services
      .find((s) => s.code === this.form.controls.serviceCode.value)
      ?.deliveryOptions.find((o) => o.deliveryMode === this.form.controls.deliveryMode.value);
    const price = option ? ` · ${formatMinor(option.priceMinor, option.currency)}` : '';
    return `${p.displayName} · ${p.providerType.replaceAll('_', ' ')} · ${p.location.city ?? this.form.controls.city.value}, ${p.location.stateOrRegion ?? this.form.controls.stateOrRegion.value}${price}${fast}`;
  }
  selectedProviderPrice() {
    const provider = this.providers().find(
      (p) => p.providerReference === this.form.controls.preferredProviderReference.value,
    );
    return (
      provider?.services
        .find((s) => s.code === this.form.controls.serviceCode.value)
        ?.deliveryOptions.find((o) => o.deliveryMode === this.form.controls.deliveryMode.value) ??
      null
    );
  }
  formatPrice = formatMinor;
  request(): CreateCareRequest {
    const v = this.form.getRawValue();
    return {
      serviceCode: v.serviceCode,
      deliveryMode: v.deliveryMode as CareDeliveryMode,
      ...(v.preferredProviderReference
        ? { preferredProviderReference: v.preferredProviderReference }
        : {}),
      ...(v.deliveryMode !== 'VIRTUAL'
        ? {
            countryCode: v.countryCode,
            stateOrRegion: v.stateOrRegion,
            city: v.city,
          }
        : {}),
      ...(v.preferredDate ? { preferredDate: v.preferredDate } : {}),
      ...(v.preferredTime ? { preferredTime: v.preferredTime } : {}),
      contactMethod: v.contactMethod,
      ...(v.notes.trim() ? { notes: v.notes.trim() } : {}),
      ...this.participantRequest(),
    };
  }
  submit() {
    this.updateGeographyValidators();
    if (this.form.invalid || this.submitting() || this.providersLoading() || this.providersError()) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.request();
    if (!this.auth.authenticated() || !this.auth.isPatient()) {
      this.intent.save(request);
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/me/request-care' } });
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
