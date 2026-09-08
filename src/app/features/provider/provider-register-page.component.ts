import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';
import {
  ICity,
  ICountry,
  IState,
} from 'country-state-city';

import { ProviderType } from '../../core/models/admin-provider.model';
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { ReferralTargetType } from '../../core/models/referral.model';
import { LocationDataService } from '../../core/services/location-data.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';

@Component({
  selector: 'app-provider-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './provider-register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderRegisterPageComponent {
  private readonly api =
    inject(ProviderOnboardingApiService);

  private readonly fb =
    inject(FormBuilder).nonNullable;

  private readonly route =
    inject(ActivatedRoute);

  private readonly locationData =
    inject(LocationDataService);

  private readonly errorSummary =
    viewChild<ElementRef<HTMLElement>>(
      'errorSummary',
    );

  /**
   * Referral code supplied by the person who invited
   * this provider.
   *
   * Example:
   * /provider/register?ref=SC-C4C1A1&type=HOSPITAL
   */
  readonly referralCode =
    this.route.snapshot.queryParamMap
      .get('ref')
      ?.trim()
      .toUpperCase() || null;

  /**
   * Actual provider classification requested by the
   * referral link.
   *
   * Important:
   * HOSPITAL is an actual provider type, while its
   * referral/reward target remains CLINIC.
   */
  readonly initialReferralProviderType =
    this.readProviderTypeFromQuery();

  readonly submitting = signal(false);

  readonly result =
    signal<ProviderOnboardingProfile | null>(
      null,
    );

  readonly error =
    signal<string | null>(null);

  readonly showPassword = signal(false);

  readonly countries: ICountry[] =
    this.locationData.getCountries();

  registerStates: IState[] = [];

  registerCities: ICity[] = [];

  readonly registrationStateCode =
    new FormControl('', {
      nonNullable: true,
    });

  readonly form = this.fb.group({
    displayName: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(32),
      ],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(128),
      ],
    ],

    professionalReference: [
      '',
      Validators.maxLength(200),
    ],

    providerType:
      this.fb.control<ProviderType>(
        this.initialProviderType(),
        Validators.required,
      ),

    countryCode: [
      'NG',
      Validators.required,
    ],

    stateOrRegion: [
      '',
      Validators.required,
    ],

    city: [
      '',
      Validators.required,
    ],
  });

  constructor() {
    this.loadRegisterCountry('NG');
  }

  /**
   * Register provider.
   */
  register(): void {
    if (
      this.form.invalid ||
      this.submitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const value =
      this.form.getRawValue();

    /**
     * Derive the referral target from the ACTUAL
     * provider type being submitted.
     *
     * This prevents stale/mismatched referral data
     * if the user changes provider type after opening
     * a referral link.
     *
     * Examples:
     *
     * CLINIC
     *   -> CLINIC
     *
     * HOSPITAL
     *   -> CLINIC
     *
     * DIAGNOSTIC_CENTRE
     *   -> LABORATORY
     *
     * PHARMACY
     *   -> PHARMACY
     */
    const intendedReferralType =
      this.referralCode
        ? this.referralTargetForProviderType(
            value.providerType,
          )
        : null;

    this.submitting.set(true);
    this.error.set(null);

    this.api
      .register({
        displayName:
          value.displayName.trim(),

        email:
          value.email
            .trim()
            .toLowerCase(),

        phone:
          value.phone.trim(),

        password:
          value.password,

        ...(
          value.professionalReference.trim()
            ? {
                professionalReference:
                  value.professionalReference.trim(),
              }
            : {}
        ),

        providerType:
          value.providerType,

        countryCode:
          value.countryCode
            .trim()
            .toUpperCase(),

        stateOrRegion:
          value.stateOrRegion.trim(),

        city:
          value.city.trim(),

        ...(
          this.referralCode
            ? {
                referralCode:
                  this.referralCode,
              }
            : {}
        ),

        ...(
          intendedReferralType
            ? {
                intendedReferralType,
              }
            : {}
        ),
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          this.result.set(result);

          this.resetForm();
        },

        error: (
          error: HttpErrorResponse,
        ) => {
           const message = Array.isArray(error.error?.message) ? error.error?.message.join(', '): error.error?.message;
          this.error.set(
            message || 
            (error.status === 409
              ? 'A SmartClinic account or provider identity already exists for these details. Contact SmartClinic operations if you need help.'
              : error.status === 0
                ? 'SmartClinic could not be reached. Check your connection and try again.'
                : this.referralCode &&
                    error.status === 400
                  ? 'The referral information is no longer valid. Ask the person who invited you for a new SmartClinic referral link.'
                  : 'Review your provider details and try again.'),
          );

          queueMicrotask(() => {
            this.errorSummary()
              ?.nativeElement
              .focus();
          });
        },
      });
  }

  /**
   * Country changed during registration.
   */
  onRegisterCountryChange(
    countryCode: string,
  ): void {
    this.loadRegisterCountry(
      countryCode,
    );

    this.form.patchValue({
      countryCode,
      stateOrRegion: '',
      city: '',
    });
  }

  /**
   * State changed during registration.
   */
  onRegisterStateChange(
    stateCode: string,
  ): void {
    const countryCode =
      this.form.controls
        .countryCode
        .value;

    const selectedState =
      this.registerStates.find(
        (state) =>
          state.isoCode ===
          stateCode,
      );

    this.registrationStateCode
      .setValue(
        stateCode,
        {
          emitEvent: false,
        },
      );

    this.registerCities =
      this.locationData.getCities(
        countryCode,
        stateCode,
      );

    this.form.patchValue({
      /**
       * Backend expects the state/region
       * name rather than the ISO state code.
       */
      stateOrRegion:
        selectedState?.name ?? '',

      city: '',
    });
  }

  /**
   * Read the actual provider classification from
   * the referral URL.
   *
   * Supported referral URLs:
   *
   * ?type=CLINIC
   * ?type=HOSPITAL
   * ?type=LABORATORY
   * ?type=PHARMACY
   *
   * LABORATORY is the referral-facing terminology.
   * The actual provider classification in the provider
   * domain is DIAGNOSTIC_CENTRE.
   */
private readProviderTypeFromQuery(): ProviderType | null {
  const value = this.route.snapshot.queryParamMap
    .get('type')
    ?.trim()
    .toUpperCase();

  switch (value) {
    case 'INDIVIDUAL':
      return 'INDIVIDUAL';

    case 'CLINIC':
      return 'CLINIC';

    case 'HOSPITAL':
      return 'HOSPITAL';

    case 'LABORATORY':
      return 'DIAGNOSTIC_CENTRE';

    case 'PHARMACY':
      return 'PHARMACY';

    default:
      return null;
  }
}

  /**
   * Map an actual provider classification to the
   * existing referral/reward target.
   *
   * IMPORTANT:
   *
   * HOSPITAL intentionally belongs to the CLINIC
   * referral bucket.
   *
   * We are NOT introducing a new HOSPITAL reward
   * target.
   */
private referralTargetForProviderType(
  providerType: ProviderType,
): ReferralTargetType | null {
  switch (providerType) {
    case 'INDIVIDUAL':
      return 'INDIVIDUAL';

    case 'CLINIC':
    case 'HOSPITAL':
      return 'CLINIC';

    case 'DIAGNOSTIC_CENTRE':
      return 'LABORATORY';

    case 'PHARMACY':
      return 'PHARMACY';

    default:
      return null;
  }
}
  /**
   * Determine the provider type that should initially
   * be selected in the registration form.
   */
  private initialProviderType():
    ProviderType {
    return (
      this.initialReferralProviderType ??
      'INDIVIDUAL'
    );
  }

  /**
   * Load states for the selected country and reset
   * state/city selection.
   */
  private loadRegisterCountry(
    countryCode: string,
  ): void {
    this.registerStates =
      this.locationData.getStates(
        countryCode,
      );

    this.registerCities = [];

    this.registrationStateCode
      .setValue(
        '',
        {
          emitEvent: false,
        },
      );
  }

  /**
   * Reset registration form after successful
   * registration.
   */
  private resetForm(): void {
    this.form.reset({
      displayName: '',
      email: '',
      phone: '',
      password: '',
      professionalReference: '',

      /**
       * Keep the provider classification represented
       * by the referral URL after reset.
       */
      providerType:
        this.initialProviderType(),

      countryCode: 'NG',
      stateOrRegion: '',
      city: '',
    });

    this.loadRegisterCountry('NG');
  }
}