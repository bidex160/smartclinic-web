import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ICity, IState } from 'country-state-city';

import { AuthApiService } from '../../core/services/auth-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { safeInternalReturnUrl } from '../../core/auth/safe-return-url';
import { AuthVisualPanelComponent } from "../../shared/components/auth-visual-panel.component";

@Component({
  selector: 'app-patient-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthVisualPanelComponent],
  templateUrl: './patient-register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRegisterPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly locationData = inject(LocationDataService);

  private readonly referralCode =
    this.route.snapshot.queryParamMap.get('ref')?.trim() || null;

  private readonly returnUrl = safeInternalReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  readonly loginQueryParams = this.returnUrl
    ? { returnUrl: this.returnUrl }
    : null;

  readonly pending = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly countries = this.locationData.getCountries();

  states: IState[] = [];
  cities: ICity[] = [];

  readonly form = this.fb.group({
    givenName: ['', [Validators.required, Validators.maxLength(80)]],

    familyName: ['', [Validators.required, Validators.maxLength(80)]],

    email: ['', [Validators.email, Validators.maxLength(254)]],

    phone: ['', [Validators.maxLength(30)]],

    countryCode: [
      'NG',
      [
        Validators.required,
        Validators.pattern(/^[A-Za-z]{2}$/),
      ],
    ],

    stateOrRegion: [
      '',
      [
        Validators.required,
        Validators.maxLength(120),
      ],
    ],

    city: [
      '',
      [
        Validators.required,
        Validators.maxLength(120),
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
  });

  constructor() {
    this.states = this.locationData.getStates(
      this.form.controls.countryCode.value,
    );
  }

  onCountryChange(): void {
    const countryCode = this.form.controls.countryCode.value;

    this.states = countryCode
      ? this.locationData.getStates(countryCode)
      : [];

    this.cities = [];

    this.form.patchValue({
      stateOrRegion: '',
      city: '',
    });
  }

  onStateChange(): void {
    const countryCode = this.form.controls.countryCode.value;
    const stateName = this.form.controls.stateOrRegion.value;

    const selectedState = this.states.find(
      (state) => state.name === stateName,
    );

    this.cities =
      countryCode && selectedState
        ? this.locationData.getCities(
            countryCode,
            selectedState.isoCode,
          )
        : [];

    this.form.controls.city.setValue('');
  }

  register(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    if(!value.email.trim().toLowerCase() && !value.phone.trim()){
      this.error.set('Either email or phone number is required')
     return
    }

    this.pending.set(true);

    this.api
      .register({
        givenName: value.givenName.trim(),
        familyName: value.familyName.trim(),

        ...(value.email.trim().toLowerCase() && {
          email: value.email.trim().toLowerCase(),
        }),

        ...(value.phone.trim() && {
          phone: value.phone.trim(),
        }),

        countryCode: value.countryCode.trim().toUpperCase(),
        stateOrRegion: value.stateOrRegion.trim(),
        city: value.city.trim(),

        password: value.password,

        ...(this.referralCode && {
          referralCode: this.referralCode,
        }),
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({
            givenName: '',
            familyName: '',
            email: '',
            phone: '',
            countryCode: 'NG',
            stateOrRegion: '',
            city: '',
            password: '',
          });

          this.states = this.locationData.getStates('NG');
          this.cities = [];

          this.success.set(true);
        },

        error: (error: HttpErrorResponse) => {
           const message = Array.isArray(error.error?.message) ? error.error?.message.join(', '): error.error?.message;
          this.error.set(
            message || 
            (this.referralCode && error.status === 400
              ? 'This referral link is no longer valid. Ask the person who invited you for a new link.'
              : error.status === 409
                ? 'An account already exists with this email or phone number. Sign in instead.'
                : error.status === 0
                  ? 'SmartClinic could not be reached. Check your connection and try again.'
                  : 'We could not create your account. Check the form and try again.'),
          );
        },
      });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];

    return (
      control.invalid &&
      (control.touched || this.submitted())
    );
  }

  get passwordStrength(): {
  level: number;
  label: string;
} {
  const password = this.form.controls.password.value;

  if (!password) {
    return {
      level: 0,
      label: '',
    };
  }

  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      level: 1,
      label: 'Weak',
    };
  }

  if (score <= 4) {
    return {
      level: 2,
      label: 'Good',
    };
  }

  return {
    level: 3,
    label: 'Strong',
  };
}
}