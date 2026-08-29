import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ICity, ICountry, IState } from 'country-state-city';

import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { PublicBookingResponse } from '../../core/models/public-booking.model';

import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { UtilsService } from '../../core/services/utils.service';
import { PatientPaymentPanelComponent } from './patient-payment-panel.component';

@Component({
  selector: 'app-patient-booking-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PatientPaymentPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <p class="text-sm font-bold uppercase tracking-wider text-brand-600">
        Patient booking
      </p>

      <h1 class="mt-2 text-3xl font-bold text-brand-900">
        Book a Health Check for yourself
      </h1>

      <p class="mt-3 text-slate-600">
        SmartClinic securely uses the Patient linked to your account.
        You do not need to re-enter your identity.
      </p>

      @if (loading()) {
        <p
          role="status"
          class="mt-6 rounded-xl bg-brand-50 p-5"
        >
          Loading booking options…
        </p>
      }

      @if (error()) {
        <div
          role="alert"
          class="mt-6 rounded-xl bg-red-50 p-5 text-red-900"
        >
          {{ error() }}
        </div>
      }

      @if (created(); as booking) {
        <section
          role="status"
          class="mt-7 rounded-2xl border border-brand-100 bg-white p-7"
        >
          <h2 class="text-2xl font-bold text-brand-900">
            Health Check booking created
          </h2>

          <p class="mt-3">
            Reference:
            <strong class="font-mono">
              {{ booking.bookingReference }}
            </strong>
          </p>

          <div class="mt-6"><app-patient-payment-panel [reference]="booking.bookingReference" /></div>

          <a
            routerLink="/me/health-checks"
            class="mt-5 inline-flex rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
          >
            View My Health Checks
          </a>
        </section>
      } @else if (!loading()) {
        <form
          [formGroup]="form"
          (ngSubmit)="continue()"
          class="mt-7 space-y-6"
          novalidate
        >
          <!-- Health Check -->
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">
              Health Check
            </h2>

            <div class="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  for="self-package"
                  class="block text-sm font-bold"
                >
                  Package
                </label>

                <select
                  id="self-package"
                  formControlName="healthCheckPackageId"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">
                    Select package
                  </option>

                  @for (item of packages(); track item.id) {
                    <option [value]="item.id">
                      {{ item.name }}
                    </option>
                  }
                </select>
              </div>

              <div>
                <label
                  for="self-mode"
                  class="block text-sm font-bold"
                >
                  Fulfilment mode
                </label>

                <select
                  id="self-mode"
                  formControlName="fulfilmentModeId"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">
                    Select fulfilment mode
                  </option>

                  @for (item of modes(); track item.id) {
                    <option [value]="item.id">
                      {{ item.name }}
                    </option>
                  }
                </select>
              </div>
            </div>
          </section>

          <!-- Appointment -->
          <section class="rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">
              Requested appointment
            </h2>

            <div class="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  for="self-date"
                  class="block text-sm font-bold"
                >
                  Appointment date
                </label>

                <input
                  id="self-date"
                  type="date"
                  formControlName="preferredDate"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>

              <div>
                <label
                  for="self-time"
                  class="block text-sm font-bold"
                >
                  Appointment time
                </label>

                <input
                  id="self-time"
                  type="time"
                  formControlName="preferredTimeWindowStart"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>

              <div>
                <label
                  for="self-timezone"
                  class="block text-sm font-bold"
                >
                  Timezone
                </label>

                <input
                  id="self-timezone"
                  formControlName="preferredTimezone"
                  placeholder="e.g. Africa/Lagos"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </div>
            </div>
          </section>

          <!-- Address -->
          @if (requiresVisitAddress()) {
            <fieldset
              formGroupName="visitAddress"
              class="rounded-2xl border bg-white p-6"
            >
              <legend class="px-2 text-xl font-bold">
                {{
                  isHomeVisit()
                    ? 'Home visit address'
                    : 'Your location'
                }}
              </legend>

              <p class="mt-2 text-sm leading-6 text-slate-600">
                @if (isHomeVisit()) {
                  Enter the address where the provider should
                  perform your Health Check.
                } @else {
                  We use your location to match you with an
                  appropriate SmartClinic provider location.
                  This is not the confirmed appointment location
                  and does not guarantee the nearest branch.
                }
              </p>

              <div class="mt-4 grid gap-5 sm:grid-cols-2">
                <!-- Address 1 -->
                <div class="sm:col-span-2">
                  <label
                    for="self-address1"
                    class="block text-sm font-bold"
                  >
                    Address line 1
                  </label>

                  <input
                    id="self-address1"
                    formControlName="addressLine1"
                    autocomplete="address-line1"
                    placeholder="e.g. 15 Ring Road"
                    class="mt-2 min-h-12 w-full rounded-xl border px-3"
                  />
                </div>

                <!-- Address 2 -->
                <div class="sm:col-span-2">
                  <label
                    for="self-address2"
                    class="block text-sm font-bold"
                  >
                    Address line 2
                    <span class="font-normal">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="self-address2"
                    formControlName="addressLine2"
                    autocomplete="address-line2"
                    placeholder="Apartment, suite or landmark (optional)"
                    class="mt-2 min-h-12 w-full rounded-xl border px-3"
                  />
                </div>

                <!-- Country -->
                <div>
                  <label
                    for="self-country"
                    class="block text-sm font-bold"
                  >
                    Country
                  </label>

                  <select
                    id="self-country"
                    formControlName="countryCode"
                    (change)="onSelfCountryChange($any($event.target).value)"
                    autocomplete="country"
                    class="mt-2 min-h-12 w-full rounded-xl border bg-white px-3"
                  >
                    <option value="">
                      Select country
                    </option>

                    @for (
                      country of countries;
                      track country.isoCode
                    ) {
                      <option [value]="country.isoCode">
                        {{ country.name }}
                      </option>
                    }
                  </select>
                </div>

                <!-- State -->
                <div>
                  <label
                    for="self-region"
                    class="block text-sm font-bold"
                  >
                    State / region
                  </label>

                  <select
                    id="self-region"
                    [formControl]="bookingStateCode"
                    (change)="onSelfStateChange($any($event.target).value)"
                    [disabled]="!visitAddressForm.controls.countryCode.value"
                    autocomplete="address-level1"
                    class="mt-2 min-h-12 w-full rounded-xl border bg-white px-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      Select state / region
                    </option>

                    @for (
                      state of selfStates;
                      track state.isoCode
                    ) {
                      <option [value]="state.isoCode">
                        {{ state.name }}
                      </option>
                    }
                  </select>
                </div>

                <!-- City / Area -->
                <div>
                  <label
                    for="self-city"
                    class="block text-sm font-bold"
                  >
                    City / Area
                  </label>

                  <input
                    id="self-city"
                    formControlName="city"
                    list="self-city-options"
                    autocomplete="address-level2"
                    placeholder="e.g. Ibadan, Elebu, Mokola"
                    class="mt-2 min-h-12 w-full rounded-xl border px-3"
                  />

                  <datalist id="self-city-options">
                    @for (
                      city of selfCities;
                      track city.name
                    ) {
                      <option [value]="city.name"></option>
                    }
                  </datalist>

                  <p class="mt-1 text-xs text-slate-500">
                    Select a suggestion or enter your city or area.
                  </p>
                </div>

                <!-- Postal -->
                <div>
                  <label
                    for="self-postal"
                    class="block text-sm font-bold"
                  >
                    Postal code
                    <span class="font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="self-postal"
                    formControlName="postalCode"
                    autocomplete="postal-code"
                    placeholder="e.g. 200103"
                    class="mt-2 min-h-12 w-full rounded-xl border px-3"
                  />
                </div>
              </div>
            </fieldset>
          }

          <!-- Directions -->
          <div>
            <label
              for="self-note"
              class="block text-sm font-bold"
            >
              Additional directions
              <span class="font-normal">
                (optional)
              </span>
            </label>

            <textarea
              id="self-note"
              formControlName="preferredLocationNote"
              placeholder="Landmark, gate instructions, or other directions"
              maxlength="1000"
              class="mt-2 min-h-24 w-full rounded-xl border p-3"
            ></textarea>
          </div>

          <!-- Review -->
          @if (reviewing()) {
            <section class="rounded-2xl bg-brand-50 p-6">
              <h2 class="text-xl font-bold">
                Review your booking
              </h2>

              <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="text-sm text-slate-600">
                    Package
                  </dt>
                  <dd class="font-bold">
                    {{ selectedPackage()?.name }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-slate-600">
                    Fulfilment
                  </dt>
                  <dd class="font-bold">
                    {{ selectedMode()?.name }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-slate-600">
                    Appointment
                  </dt>
                  <dd class="font-bold">
                    {{
                      utils.formatAppointment(
                        form.value.preferredDate,
                        form.value.preferredTimeWindowStart
                      )
                    }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-slate-600">
                    Timezone
                  </dt>
                  <dd class="font-bold">
                    {{ form.value.preferredTimezone }}
                  </dd>
                </div>

                @if (requiresVisitAddress()) {
                  <div class="sm:col-span-2">
                    <dt class="text-sm text-slate-600">
                      {{
                        isHomeVisit()
                          ? 'Home visit address'
                          : 'Your location'
                      }}
                    </dt>

                    <dd class="font-bold">
                      {{ form.value.visitAddress?.addressLine1 }},

                      @if (
                        form.value.visitAddress?.addressLine2
                      ) {
                        {{
                          form.value.visitAddress
                            ?.addressLine2
                        }},
                      }

                      {{ form.value.visitAddress?.city }},
                      {{
                        form.value.visitAddress
                          ?.stateOrRegion
                      }}

                      @if (
                        form.value.visitAddress?.postalCode
                      ) {
                        · {{
                          form.value.visitAddress
                            ?.postalCode
                        }}
                      }

                      · {{
                        form.value.visitAddress
                          ?.countryCode
                      }}
                    </dd>

                    @if (!isHomeVisit()) {
                      <p
                        class="mt-2 text-sm font-normal text-slate-600"
                      >
                        SmartClinic will use this origin to
                        match an appropriate provider branch.
                        The confirmed appointment location
                        will be shown separately.
                      </p>
                    }
                  </div>
                }
              </dl>

              <p class="mt-4 text-sm text-slate-600">
                Submitting creates an awaiting-funding booking
                for your authenticated SELF Patient.
              </p>
            </section>
          }

          <!-- Actions -->
          <div class="flex flex-wrap gap-3">
            @if (reviewing()) {
              <button
                type="button"
                (click)="reviewing.set(false)"
                class="min-h-12 rounded-xl border border-brand-600 px-6 font-bold text-brand-700"
              >
                Edit booking
              </button>
            }

            <button
              type="submit"
              [disabled]="pending()"
              class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-60"
            >
              {{
                pending()
                  ? 'Creating booking…'
                  : reviewing()
                    ? 'Confirm booking'
                    : 'Review booking'
              }}
            </button>
          </div>
        </form>
      }
    </main>
  `,
})
export class PatientBookingPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly packageApi =
    inject(HealthCheckPackagesApiService);

  private readonly modeApi =
    inject(FulfilmentModesApiService);

  private readonly api =
    inject(HealthCheckResultsApiService);

  private readonly locationData =
    inject(LocationDataService);

  readonly utils = inject(UtilsService);

  readonly packages =
    signal<HealthCheckPackage[]>([]);

  readonly modes =
    signal<FulfilmentMode[]>([]);

  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly reviewing = signal(false);

  readonly error =
    signal<string | null>(null);

  readonly created =
    signal<PublicBookingResponse | null>(null);

  readonly form = this.fb.group({
    healthCheckPackageId: [
      '',
      Validators.required,
    ],

    fulfilmentModeId: [
      '',
      Validators.required,
    ],

    preferredDate: [
      '',
      Validators.required,
    ],

    preferredTimeWindowStart: [
      '',
      Validators.required,
    ],

    preferredTimezone: [
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || 'UTC',

      Validators.required,
    ],

    preferredLocationNote: [
      '',
      Validators.maxLength(1000),
    ],

    visitAddress: this.fb.group({
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      stateOrRegion: [''],
      postalCode: [''],
      countryCode: ['NG'],
    }),
  });

  /*
   * IMPORTANT:
   *
   * Reactive Forms controls are not signals.
   *
   * Convert fulfilmentModeId.valueChanges into a signal
   * so selectedMode/requiresVisitAddress react whenever
   * the user changes fulfilment mode.
   */
  readonly fulfilmentModeId = toSignal(
    this.form.controls.fulfilmentModeId.valueChanges,
    {
      initialValue:
        this.form.controls.fulfilmentModeId.value,
    },
  );

  readonly selectedMode = computed(() => {
    const fulfilmentModeId =
      this.fulfilmentModeId();

    return (
      this.modes().find(
        (mode) =>
          mode.id === fulfilmentModeId,
      ) ?? null
    );
  });

  readonly selectedPackage = computed(() => {
    /*
     * This doesn't currently need to control request
     * correctness, but reading getRawValue here would
     * have the same reactivity issue.
     *
     * Since package is only used for review text, we'll
     * resolve it from the current form value when this
     * computed reruns due to modes/packages changes.
     *
     * If you later need package selection itself to
     * drive reactive UI, convert its valueChanges to a
     * signal as well.
     */
    const packageId =
      this.form.controls
        .healthCheckPackageId.value;

    return (
      this.packages().find(
        (item) => item.id === packageId,
      ) ?? null
    );
  });

  readonly isHomeVisit = computed(
    () =>
      this.selectedMode()?.code ===
      'HOME_VISIT',
  );

  readonly requiresVisitAddress =
    computed(() => {
      const code =
        this.selectedMode()?.code;

      return (
        code === 'HOME_VISIT' ||
        code === 'PROVIDER_LOCATION'
      );
    });

  readonly countries: ICountry[] =
    this.locationData.getCountries();

  selfStates: IState[] = [];
  selfCities: ICity[] = [];

  readonly bookingStateCode = new FormControl('', { nonNullable: true });

  constructor() {
    /*
     * Initial default country.
     */
    this.onSelfCountryChange('NG');

    /*
     * Because onSelfCountryChange clears the form's
     * state/city but doesn't need to change country,
     * explicitly ensure NG remains selected.
     */
    this.visitAddressForm.controls
      .countryCode.setValue(
        'NG',
        { emitEvent: false },
      );

    forkJoin({
      packages:
        this.packageApi.getPackages(),

      modes:
        this.modeApi.getFulfilmentModes(),
    })
      .pipe(
        finalize(() =>
          this.loading.set(false),
        ),
      )
      .subscribe({
        next: ({
          packages,
          modes,
        }) => {
          this.packages.set(
            packages.filter(
              (item) => item.isActive,
            ),
          );

          this.modes.set(
            modes.filter(
              (item) => item.isActive,
            ),
          );
        },

        error: () => {
          this.error.set(
            'Booking options are unavailable right now.',
          );
        },
      });
  }

  get visitAddressForm() {
    return this.form.controls.visitAddress;
  }

  onSelfCountryChange(
    countryCode: string,
  ): void {
    /*
     * Keep the actual backend country value
     * synchronized with the selected country.
     */
    this.visitAddressForm.controls
      .countryCode.setValue(
        countryCode,
        { emitEvent: false },
      );

    this.selfStates =
      countryCode
        ? this.locationData.getStates(
            countryCode,
          )
        : [];

    this.selfCities = [];

    this.bookingStateCode.setValue('', { emitEvent: false });

    this.visitAddressForm.patchValue(
      {
        stateOrRegion: '',
        city: '',
      },
      {
        emitEvent: false,
      },
    );
  }

  onSelfStateChange(
    stateCode: string,
  ): void {
    const countryCode =
      this.visitAddressForm.controls
        .countryCode.value ?? '';

    const selectedState =
      this.selfStates.find(
        (state) =>
          state.isoCode === stateCode,
      );

    this.bookingStateCode.setValue(stateCode, { emitEvent: false });

    this.selfCities =
      countryCode && stateCode
        ? this.locationData.getCities(
            countryCode,
            stateCode,
          )
        : [];

    /*
     * IMPORTANT:
     *
     * Backend matching currently expects the STATE NAME,
     * e.g. "Oyo", rather than the country-state-city
     * ISO state code.
     */
    this.visitAddressForm.patchValue({
      stateOrRegion:
        selectedState?.name ?? '',

      city: '',
    });
  }

  continue(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    /*
     * First submit only enters review mode.
     */
    if (!this.reviewing()) {
      this.reviewing.set(true);
      return;
    }

    if (this.pending()) {
      return;
    }

    const value =
      this.form.getRawValue();

    /*
     * IMPORTANT:
     *
     * Do not rely on requiresVisitAddress() here.
     *
     * Request correctness should be determined directly
     * from the submitted fulfilmentModeId.
     */
    const mode =
      this.modes().find(
        (item) =>
          item.id ===
          value.fulfilmentModeId,
      );

    if (!mode) {
      this.error.set(
        'Select a valid fulfilment mode.',
      );

      this.reviewing.set(false);
      return;
    }

    const requiresAddress =
      mode.code === 'HOME_VISIT' ||
      mode.code === 'PROVIDER_LOCATION';

    const address =
      value.visitAddress;

    if (
      requiresAddress &&
      (
        !address.addressLine1.trim() ||
        !address.city.trim() ||
        !address.stateOrRegion.trim() ||
        !address.countryCode.trim()
      )
    ) {
      this.error.set(
        'Complete the required address fields.',
      );

      this.reviewing.set(false);

      this.visitAddressForm.markAllAsTouched();

      return;
    }

    const payload = {
      healthCheckPackageId:
        value.healthCheckPackageId,

      fulfilmentModeId:
        value.fulfilmentModeId,

      preferredDate:
        value.preferredDate,

      preferredTimeWindowStart:
        value.preferredTimeWindowStart,

      preferredTimezone:
        value.preferredTimezone.trim(),

      ...(value.preferredLocationNote.trim() && {
        preferredLocationNote:
          value.preferredLocationNote.trim(),
      }),

      ...(requiresAddress && {
        visitAddress: {
          addressLine1:
            address.addressLine1.trim(),

          ...(address.addressLine2.trim() && {
            addressLine2:
              address.addressLine2.trim(),
          }),

          city:
            address.city.trim(),

          stateOrRegion:
            address.stateOrRegion.trim(),

          ...(address.postalCode.trim() && {
            postalCode:
              address.postalCode.trim(),
          }),

          countryCode:
            address.countryCode
              .trim()
              .toUpperCase(),
        },
      }),
    };

    this.pending.set(true);

    this.api
      .createMyHealthCheck(payload)
      .pipe(
        finalize(() =>
          this.pending.set(false),
        ),
      )
      .subscribe({
        next: (booking) => {
          this.created.set(booking);
        },

        error: (
          httpError: HttpErrorResponse,
        ) => {
          if (httpError.status === 0) {
            this.error.set(
              'SmartClinic could not be reached. Try again.',
            );

            return;
          }

          /*
           * During development this is particularly useful
           * because backend validation messages such as
           * "visitAddress is required for this fulfilment mode"
           * become visible immediately.
           */
          this.error.set(
            'We could not create this Health Check. Review the details and try again.',
          );
        },
      });
  }
}
