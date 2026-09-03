import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ICity, ICountry, IState } from 'country-state-city';

import { ProviderType } from '../../core/models/admin-provider.model';
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { ReferralTargetType } from '../../core/models/referral.model';
import { LocationDataService } from '../../core/services/location-data.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';

@Component({
  selector: 'app-provider-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './provider-register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderRegisterPageComponent {
  private readonly api = inject(ProviderOnboardingApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly locationData = inject(LocationDataService);

  private readonly errorSummary =
    viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly referralCode =
    this.route.snapshot.queryParamMap.get('ref')?.trim().toUpperCase() || null;

  readonly intendedReferralType = this.readReferralType();

  readonly submitting = signal(false);
  readonly result = signal<ProviderOnboardingProfile | null>(null);
  readonly error = signal<string | null>(null);

  readonly countries: ICountry[] =
    this.locationData.getCountries();

  registerStates: IState[] = [];
  registerCities: ICity[] = [];

  readonly registrationStateCode = new FormControl('', { nonNullable: true });
readonly showPassword = signal(false);
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

    providerType: this.fb.control<ProviderType>(
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

  register(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.error.set(null);

    this.api
      .register({
        displayName: value.displayName.trim(),

        email: value.email
          .trim()
          .toLowerCase(),

        phone: value.phone.trim(),

        password: value.password,

        ...(value.professionalReference.trim() && {
          professionalReference:
            value.professionalReference.trim(),
        }),

        providerType: value.providerType,

        countryCode: value.countryCode
          .trim()
          .toUpperCase(),

        stateOrRegion:
          value.stateOrRegion.trim(),

        city: value.city.trim(),

        ...(this.referralCode && {
          referralCode: this.referralCode,
        }),

        ...(this.intendedReferralType && {
          intendedReferralType:
            this.intendedReferralType,
        }),
      })
      .pipe(
        finalize(() =>
          this.submitting.set(false),
        ),
      )
      .subscribe({
        next: (result) => {
          this.result.set(result);

          this.resetForm();
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.error.set(
            error.status === 409
              ? 'A SmartClinic account or provider identity already exists for these details. Contact SmartClinic operations if you need help.'
              : error.status === 0
                ? 'SmartClinic could not be reached. Check your connection and try again.'
                : this.referralCode &&
                    error.status === 400
                  ? 'The referral information is no longer valid. Ask the person who invited you for a new SmartClinic referral link.'
                  : 'Review your provider details and try again.',
          );

          queueMicrotask(() =>
            this.errorSummary()?.nativeElement.focus(),
          );
        },
      });
  }

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

  onRegisterStateChange(
    stateCode: string,
  ): void {
    const countryCode =
      this.form.controls.countryCode.value;

    const selectedState =
      this.registerStates.find(
        (state) =>
          state.isoCode === stateCode,
      );

    this.registrationStateCode.setValue(stateCode, { emitEvent: false });

    this.registerCities =
      this.locationData.getCities(
        countryCode,
        stateCode,
      );

    this.form.patchValue({
      /*
       * Backend expects the state/region name,
       * not its ISO code.
       */
      stateOrRegion:
        selectedState?.name ?? '',
        city: '',
    });
  }

private readReferralType(): ReferralTargetType | null {
  const value = this.route.snapshot.queryParamMap.get('type');

  switch (value) {
    case 'CLINIC':
      return 'CLINIC';

    case 'LABORATORY':
      return 'LABORATORY';

    case 'PHARMACY':
      return 'PHARMACY';

    default:
      return null;
  }
}

private initialProviderType(): ProviderType {
  switch (this.intendedReferralType) {
    case 'CLINIC':
      return 'CLINIC';

    case 'LABORATORY':
      return 'DIAGNOSTIC_CENTRE';

    case 'PHARMACY':
      return 'PHARMACY';

    default:
      return 'INDIVIDUAL';
  }
}
  private loadRegisterCountry(
    countryCode: string,
  ): void {
    this.registerStates =
      this.locationData.getStates(
        countryCode,
      );

    this.registerCities = [];
    this.registrationStateCode.setValue('', { emitEvent: false });
  }

  private resetForm(): void {
    this.form.reset({
      displayName: '',
      email: '',
      phone: '',
      password: '',
      professionalReference: '',
      providerType:
        this.initialProviderType(),
      countryCode: 'NG',
      stateOrRegion: '',
      city: '',
    });

    this.loadRegisterCountry('NG');
  }
}
