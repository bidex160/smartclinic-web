import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <a
        routerLink="/me/fasttrack"
        class="font-bold text-brand-700 underline"
      >
        ← FastTrack requests
      </a>

      <p class="mt-6 text-sm font-bold uppercase text-brand-600">
        Existing appointment
      </p>

      <h1 class="mt-2 text-3xl font-bold">
        Request FastTrack
      </h1>

      <p class="mt-3 text-slate-600">
        Ask a participating provider to verify your existing appointment for
        priority handling and a shorter expected waiting time. Clinical urgency
        and medical triage always take priority.
      </p>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="mt-8 grid gap-6 rounded-3xl border bg-white p-6"
        novalidate
      >
        <!-- ====================================================== -->
        <!-- PROVIDER SEARCH -->
        <!-- ====================================================== -->

        <fieldset>
          <legend class="text-lg font-bold">
            Find your provider
          </legend>

          <p class="mt-1 text-sm text-slate-600">
            Search for the hospital, clinic, laboratory, pharmacy or other
            provider where you already have an appointment.
          </p>

          <div class="mt-4">
            <label
              for="provider-search"
              class="block font-semibold"
            >
              Hospital or provider name
            </label>

            <div class="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="provider-search"
                formControlName="providerSearch"
                placeholder="e.g. University College Hospital"
                autocomplete="organization"
                class="min-h-12 flex-1 rounded-xl border px-3"
              />

              <button
                type="button"
                (click)="searchProviders()"
                [disabled]="providerLoading()"
                class="min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{
                  providerLoading()
                    ? 'Searching…'
                    : 'Search'
                }}
              </button>
            </div>

            <p class="mt-2 text-sm text-slate-500">
              You don't need to know the provider's state or city.
            </p>
          </div>
        </fieldset>

        <!-- ====================================================== -->
        <!-- OPTIONAL LOCATION FILTERS -->
        <!-- ====================================================== -->

        <section class="rounded-2xl border bg-slate-50 p-4">
          <button
            type="button"
            (click)="toggleLocationFilters()"
            class="flex w-full items-center justify-between gap-4 text-left font-bold"
            [attr.aria-expanded]="showLocationFilters()"
          >
            <span>
              Can't find the provider? Filter by location
            </span>

            <span aria-hidden="true">
              {{ showLocationFilters() ? '−' : '+' }}
            </span>
          </button>

          @if (showLocationFilters()) {
            <div class="mt-4 grid gap-4 sm:grid-cols-3">
              <!-- COUNTRY -->

              <label class="font-semibold">
                Country

                <select
                  formControlName="countryCode"
                  (change)="countryChanged()"
                  class="mt-2 min-h-12 w-full rounded-xl border bg-white px-3"
                >
                  <option value="">
                    All countries
                  </option>

                  @for (country of countries; track country.isoCode) {
                    <option [value]="country.isoCode">
                      {{ country.name }}
                    </option>
                  }
                </select>
              </label>

              <!-- STATE -->

              <label class="font-semibold">
                State / Region

                <select
                  [formControl]="fastTrackStateCode"
                  (change)="stateChanged()"
                  [disabled]="!form.controls.countryCode.value"
                  class="mt-2 min-h-12 w-full rounded-xl border bg-white px-3 disabled:bg-slate-100"
                >
                  <option value="">
                    All states
                  </option>

                  @for (state of states(); track state.isoCode) {
                    <option [value]="state.isoCode">
                      {{ state.name }}
                    </option>
                  }
                </select>
              </label>

              <!-- CITY -->

              <label class="font-semibold">
                City

                <select
                  formControlName="city"
                  [disabled]="!form.controls.stateOrRegion.value"
                  class="mt-2 min-h-12 w-full rounded-xl border bg-white px-3 disabled:bg-slate-100"
                >
                  <option value="">
                    All cities
                  </option>

                  @for (city of cities(); track city.name) {
                    <option [value]="city.name">
                      {{ city.name }}
                    </option>
                  }
                </select>
              </label>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                (click)="searchProviders()"
                [disabled]="providerLoading()"
                class="min-h-11 rounded-xl border border-brand-700 px-5 font-bold text-brand-700 disabled:opacity-60"
              >
                Apply filters
              </button>

              <button
                type="button"
                (click)="clearLocationFilters()"
                class="min-h-11 rounded-xl px-4 font-bold text-slate-600"
              >
                Clear location
              </button>
            </div>
          }
        </section>

        <!-- ====================================================== -->
        <!-- LOADING -->
        <!-- ====================================================== -->

        @if (providerLoading()) {
          <p
            role="status"
            class="rounded-xl bg-slate-50 p-4 text-slate-600"
          >
            Finding providers…
          </p>
        }

        <!-- ====================================================== -->
        <!-- SEARCH RESULTS -->
        <!-- ====================================================== -->

        @if (!providerLoading() && hasSearched()) {
          @if (providers().length) {
            <section>
              <div class="flex items-end justify-between gap-4">
                <div>
                  <h2 class="font-bold">
                    Search results
                  </h2>

                  <p class="mt-1 text-sm text-slate-600">
                    Select the provider where you already have an appointment.
                  </p>
                </div>

                <span class="text-sm text-slate-500">
                  {{ providers().length }}
                  {{ providers().length === 1 ? 'provider' : 'providers' }}
                </span>
              </div>

              <div class="mt-4 grid gap-3">
                @for (
                  provider of providers();
                  track provider.providerReference
                ) {
                  <button
                    type="button"
                    (click)="selectProvider(provider)"
                    class="rounded-2xl border p-4 text-left transition hover:border-brand-500 hover:bg-brand-50"
                    [class.border-brand-700]="
                      form.controls.providerReference.value ===
                      provider.providerReference
                    "
                    [class.bg-brand-50]="
                      form.controls.providerReference.value ===
                      provider.providerReference
                    "
                  >
                    <div
                      class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"
                    >
                      <div>
                        <strong class="text-base">
                          {{ provider.displayName }}
                        </strong>

                        <p class="mt-1 text-sm text-slate-600">
                          {{
                            provider.providerType.replaceAll(
                              '_',
                              ' '
                            )
                          }}
                        </p>

                        @if (provider.location) {
                          <p class="mt-2 text-sm text-slate-600">
                            {{
                              providerLocation(provider)
                            }}
                          </p>
                        }
                      </div>

                      @if (supportsFastTrack(provider)) {
                        <span
                          class="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800"
                        >
                          FastTrack available
                        </span>
                      } @else {
                        <span
                          class="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                        >
                          FastTrack unavailable
                        </span>
                      }
                    </div>

                    @if (
                      form.controls.providerReference.value ===
                      provider.providerReference
                    ) {
                      <p class="mt-3 text-sm font-bold text-brand-700">
                        ✓ Selected
                      </p>
                    }
                  </button>
                }
              </div>
            </section>
          } @else {
            <section class="rounded-2xl border bg-slate-50 p-5">
              <h2 class="font-bold">
                Provider not found
              </h2>

              <p class="mt-2 text-sm text-slate-600">
                We couldn't find a matching provider. Check the name or use
                the location filters to narrow your search.
              </p>

              <div class="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  (click)="showLocationFilters.set(true)"
                  class="rounded-xl border px-4 py-2 font-bold"
                >
                  Filter by location
                </button>

                <!--
                  Replace this route if your actual provider recruitment
                  invitation route is different.
                -->
                <a
                  routerLink="/me/provider-invitations"
                  class="rounded-xl border border-brand-700 px-4 py-2 font-bold text-brand-700"
                >
                  Invite provider to SmartClinic
                </a>
              </div>
            </section>
          }
        }

        <!-- ====================================================== -->
        <!-- SELECTED PROVIDER -->
        <!-- ====================================================== -->

        @if (selectedProvider(); as provider) {
          <section
            class="rounded-2xl border border-brand-200 bg-brand-50 p-5"
          >
            <p
              class="text-xs font-bold uppercase tracking-wide text-brand-700"
            >
              Selected provider
            </p>

            <h2 class="mt-1 text-lg font-bold">
              {{ provider.displayName }}
            </h2>

            @if (provider.location) {
              <p class="mt-1 text-sm text-slate-600">
                {{ providerLocation(provider) }}
              </p>
            }

            @if (!supportsFastTrack(provider)) {
              <p class="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">
                This provider is on SmartClinic, but FastTrack is not currently
                available for its services.
              </p>
            }
          </section>
        }

        <!-- ====================================================== -->
        <!-- SERVICE -->
        <!-- ====================================================== -->

        @if (selectedProvider() && supportsFastTrack(selectedProvider()!)) {
          <label class="font-semibold">
            Service

            <select
              formControlName="serviceCode"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">
                Select service
              </option>

              @for (service of fastServices(); track service.code) {
                <option [value]="service.code">
                  {{ service.name }}
                  · FastTrack
                  {{
                    money(
                      service.fastTrackFeeMinor,
                      service.fastTrackCurrency
                    )
                  }}
                </option>
              }
            </select>

            @if (
              form.controls.serviceCode.invalid &&
              form.controls.serviceCode.touched
            ) {
              <p class="mt-2 text-sm font-semibold text-red-700">
                Select the service for your existing appointment.
              </p>
            }
          </label>
        }

        <!-- ====================================================== -->
        <!-- APPOINTMENT DETAILS -->
        <!-- ====================================================== -->

        @if (
          selectedProvider() &&
          supportsFastTrack(selectedProvider()!)
        ) {
          <fieldset>
            <legend class="text-lg font-bold">
              Existing appointment details
            </legend>

            <p class="mt-1 text-sm text-slate-600">
              Enter the details from the appointment you already have with this
              provider.
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <label class="font-semibold">
                External appointment reference

                <input
                  formControlName="externalAppointmentReference"
                  placeholder="e.g. HOSP-APT-12345"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />

                @if (
                  form.controls.externalAppointmentReference.invalid &&
                  form.controls.externalAppointmentReference.touched
                ) {
                  <p class="mt-2 text-sm font-semibold text-red-700">
                    Enter your appointment reference.
                  </p>
                }
              </label>

              <label class="font-semibold">
                Appointment date

                <input
                  type="date"
                  formControlName="appointmentDate"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />

                @if (
                  form.controls.appointmentDate.invalid &&
                  form.controls.appointmentDate.touched
                ) {
                  <p class="mt-2 text-sm font-semibold text-red-700">
                    Select your appointment date.
                  </p>
                }
              </label>

              <label class="font-semibold">
                Appointment time
                <span class="font-normal text-slate-500">
                  (optional)
                </span>

                <input
                  type="time"
                  formControlName="appointmentTime"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </label>

              <label class="font-semibold">
                Department
                <span class="font-normal text-slate-500">
                  (optional)
                </span>

                <input
                  formControlName="department"
                  placeholder="e.g. Outpatient clinic"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </label>

              <label class="font-semibold">
                Doctor name
                <span class="font-normal text-slate-500">
                  (optional)
                </span>

                <input
                  formControlName="doctorName"
                  placeholder="e.g. Dr Adeyemi"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                />
              </label>

              <label class="font-semibold sm:col-span-2">
                Notes
                <span class="font-normal text-slate-500">
                  (optional)
                </span>

                <textarea
                  formControlName="notes"
                  rows="3"
                  maxlength="4000"
                  placeholder="Add useful appointment details"
                  class="mt-2 w-full rounded-xl border p-3"
                ></textarea>
              </label>
            </div>
          </fieldset>
        }

        <!-- ====================================================== -->
        <!-- ERROR -->
        <!-- ====================================================== -->

        @if (error()) {
          <p
            role="alert"
            class="rounded-xl bg-red-50 p-4 text-red-800"
          >
            {{ error() }}
          </p>
        }

        <!-- ====================================================== -->
        <!-- SUBMIT -->
        <!-- ====================================================== -->

        @if (
          selectedProvider() &&
          supportsFastTrack(selectedProvider()!)
        ) {
          <button
            type="submit"
            [disabled]="submitting()"
            class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{
              submitting()
                ? 'Submitting FastTrack request…'
                : 'Submit for provider verification'
            }}
          </button>
        }
      </form>
    </main>
  `,
})
export class ExternalFastTrackPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly find = inject(FindCareApiService);
  private readonly fast = inject(FastTrackApiService);
  private readonly location = inject(LocationDataService);
  private readonly router = inject(Router);

  readonly countries = this.location.getCountries();

  readonly states = signal<
    ReturnType<LocationDataService['getStates']>
  >(this.location.getStates('NG'));

  readonly cities = signal<
    ReturnType<LocationDataService['getCities']>
  >([]);

  /**
   * This control contains the ISO state code required by
   * country-state-city.
   *
   * form.stateOrRegion contains the actual state NAME sent to
   * SmartClinic APIs, e.g. "Oyo".
   */
  readonly fastTrackStateCode = new FormControl('', {
    nonNullable: true,
  });

  readonly providers = signal<
    readonly PublicFindCareProvider[]
  >([]);

  readonly providerLoading = signal(false);
  readonly hasSearched = signal(false);
  readonly showLocationFilters = signal(false);

  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    /**
     * Search/filter controls.
     *
     * Geography is deliberately OPTIONAL for FastTrack discovery.
     */
    providerSearch: [
      '',
      [Validators.maxLength(160)],
    ],

    countryCode: ['NG'],

    stateOrRegion: [''],

    city: [''],

    /**
     * Actual FastTrack request controls.
     */
    providerReference: [
      '',
      Validators.required,
    ],

    serviceCode: [
      '',
      Validators.required,
    ],

    externalAppointmentReference: [
      '',
      [
        Validators.required,
        Validators.maxLength(160),
      ],
    ],

    appointmentDate: [
      '',
      Validators.required,
    ],

    appointmentTime: [''],

    department: [
      '',
      [Validators.maxLength(160)],
    ],

    doctorName: [
      '',
      [Validators.maxLength(160)],
    ],

    notes: [
      '',
      [Validators.maxLength(4000)],
    ],
  });

  readonly selectedProvider = () =>
    this.providers().find(
      (provider) =>
        provider.providerReference ===
        this.form.controls.providerReference.value,
    );

  readonly fastServices = () =>
    this.selectedProvider()?.services.filter(
      (service) => service.supportsFastTrack,
    ) ?? [];

  toggleLocationFilters(): void {
    this.showLocationFilters.update(
      (current) => !current,
    );
  }

  countryChanged(): void {
    const countryCode =
      this.form.controls.countryCode.value;

    this.fastTrackStateCode.setValue('', {
      emitEvent: false,
    });

    this.form.patchValue({
      stateOrRegion: '',
      city: '',
      providerReference: '',
      serviceCode: '',
    });

    this.states.set(
      countryCode
        ? this.location.getStates(countryCode)
        : [],
    );

    this.cities.set([]);

    this.providers.set([]);
    this.hasSearched.set(false);
  }

  stateChanged(): void {
    const stateCode =
      this.fastTrackStateCode.value;

    const countryCode =
      this.form.controls.countryCode.value;

    const selectedState =
      this.states().find(
        (state) =>
          state.isoCode === stateCode,
      );

    this.form.patchValue({
      stateOrRegion:
        selectedState?.name ?? '',
      city: '',
      providerReference: '',
      serviceCode: '',
    });

    this.cities.set(
      countryCode && selectedState
        ? this.location.getCities(
            countryCode,
            selectedState.isoCode,
          )
        : [],
    );

    this.providers.set([]);
    this.hasSearched.set(false);
  }

  clearLocationFilters(): void {
    this.form.patchValue({
      countryCode: '',
      stateOrRegion: '',
      city: '',
      providerReference: '',
      serviceCode: '',
    });

    this.fastTrackStateCode.setValue('', {
      emitEvent: false,
    });

    this.states.set([]);
    this.cities.set([]);
    this.providers.set([]);

    this.hasSearched.set(false);
  }

  searchProviders(): void {
    if (this.providerLoading()) {
      return;
    }

    const value =
      this.form.getRawValue();

    const search =
      value.providerSearch.trim();

    const countryCode =
      value.countryCode.trim();

    const stateOrRegion =
      value.stateOrRegion.trim();

    const city =
      value.city.trim();

    /**
     * We need at least a provider name OR some geography.
     *
     * This prevents an accidental unfiltered provider-directory request.
     */
    if (
      !search &&
      !countryCode &&
      !stateOrRegion &&
      !city
    ) {
      this.error.set(
        'Enter a hospital or provider name, or use the location filters.',
      );

      return;
    }

    this.error.set(null);
    this.providerLoading.set(true);
    this.hasSearched.set(true);

    /**
     * IMPORTANT:
     *
     * getProviders() / the backend query DTO must support
     * optional `search`.
     */
    this.find
      .getProviders({
       ...(search ? { q: search } : {}),

        ...(countryCode
          ? { countryCode }
          : {}),

        ...(stateOrRegion
          ? { stateOrRegion }
          : {}),

        ...(city
          ? { city }
          : {}),

        limit: 50,
      })
      .pipe(
        finalize(() =>
          this.providerLoading.set(false),
        ),
      )
      .subscribe({
        next: (response) => {
          /**
           * Do NOT remove providers that do not support
           * FastTrack.
           *
           * Showing them allows the UI to explain that the
           * provider exists but FastTrack isn't available.
           */
          this.providers.set(
            response.items,
          );

          this.form.patchValue({
            providerReference: '',
            serviceCode: '',
          });
        },

        error: () => {
          this.providers.set([]);

          this.error.set(
            'We could not search for providers right now. Try again or use the location filters.',
          );
        },
      });
  }

  selectProvider(
    provider: PublicFindCareProvider,
  ): void {
    this.form.patchValue({
      providerReference:
        provider.providerReference,

      serviceCode: '',
    });

    this.error.set(null);
  }

  supportsFastTrack(
    provider: PublicFindCareProvider,
  ): boolean {
    return provider.services.some(
      (service) =>
        service.supportsFastTrack,
    );
  }

  providerLocation(
    provider: PublicFindCareProvider,
  ): string {
    if (!provider.location) {
      return 'Location unavailable';
    }

    return [
      provider.location.city,
      provider.location.stateOrRegion,
      provider.location.countryCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  money(
    minor: number | null,
    currency: string | null,
  ): string {
    if (
      minor == null ||
      !currency
    ) {
      return 'fee unavailable';
    }

    const digits =
      new Intl.NumberFormat(
        'en-NG',
        {
          style: 'currency',
          currency,
        },
      ).resolvedOptions()
        .maximumFractionDigits ?? 2;

    return new Intl.NumberFormat(
      'en-NG',
      {
        style: 'currency',
        currency,
      },
    ).format(
      minor / 10 ** digits,
    );
  }

  submit(): void {
    /**
     * Explicitly check the selected provider before relying
     * on the rest of the form.
     */
    const provider =
      this.selectedProvider();

    if (
      !provider ||
      !this.supportsFastTrack(provider)
    ) {
      this.form.controls.providerReference.markAsTouched();

      this.error.set(
        'Select a provider that currently supports FastTrack.',
      );

      return;
    }

    if (
      this.form.invalid ||
      this.submitting()
    ) {
      this.form.markAllAsTouched();

      return;
    }

    const value =
      this.form.getRawValue();

    this.submitting.set(true);
    this.error.set(null);

    this.fast
      .createExternal({
        providerReference:
          value.providerReference,

        serviceCode:
          value.serviceCode,

        externalAppointmentReference:
          value.externalAppointmentReference.trim(),

        appointmentDate:
          value.appointmentDate,

        ...(value.appointmentTime
          ? {
              appointmentTime:
                value.appointmentTime,
            }
          : {}),

        ...(value.department.trim()
          ? {
              department:
                value.department.trim(),
            }
          : {}),

        ...(value.doctorName.trim()
          ? {
              doctorName:
                value.doctorName.trim(),
            }
          : {}),

        ...(value.notes.trim()
          ? {
              notes:
                value.notes.trim(),
            }
          : {}),
      })
      .pipe(
        finalize(() =>
          this.submitting.set(false),
        ),
      )
      .subscribe({
        next: (response) =>
          void this.router.navigate([
            '/me/fasttrack',
            response.reference,
          ]),

        error: () =>
          this.error.set(
            'We could not create this FastTrack request. Confirm the provider and appointment details and try again.',
          ),
      });
  }
}