import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { IState, ICity } from 'country-state-city';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { LocationDataService } from '../../../../core/services/location-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

type JoinMode =
  | 'Builder'
  | 'Professional'
  | 'Individual'
  | 'Clinic'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Family'
  | 'Group';

type ReferralStatus =
  | 'idle'
  | 'present';

interface JoinEntrance {
  mode: JoinMode;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-join-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './join-portal.component.html',
 styleUrls: ['./../../../join/join.component.scss'],
})
export class JoinPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<JoinMode>('Builder');

  readonly referralCode = signal('');
  readonly referralStatus = signal<ReferralStatus>('idle');

  private readonly fb =
  inject(FormBuilder).nonNullable;

private readonly api =
  inject(AuthApiService);

private readonly locationData =
  inject(LocationDataService);

readonly pending =
  signal(false);

readonly submitted =
  signal(false);

readonly success =
  signal(false);

readonly error =
  signal<string | null>(null);

readonly showPassword =
  signal(false);
  readonly countries = this.locationData.getCountries();

states: IState[] = [];
cities: ICity[] = [];

readonly builderForm =
  this.fb.group({
    givenName: [
      '',
      [
        Validators.required,
        Validators.maxLength(80),
      ],
    ],

    familyName: [
      '',
      [
        Validators.required,
        Validators.maxLength(80),
      ],
    ],

    email: [
      '',
      [
        Validators.email,
        Validators.maxLength(254),
      ],
    ],

    phone: [
      '',
      [
        Validators.maxLength(30),
      ],
    ],

    countryCode: [
      'NG',
      [
        Validators.required,
        Validators.pattern(
          /^[A-Za-z]{2}$/,
        ),
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

  readonly entrances: JoinEntrance[] = [
    {
      mode: 'Builder',
      title: 'Become a Builder',
      detail:
        'Create your SmartClinic account and start connecting verified people and providers.',
    },
    {
      mode: 'Professional',
      title: 'Join as a Health Professional',
      detail:
        'Create a provider profile, complete verification and prepare to receive care requests.',
    },
    {
      mode: 'Individual',
      title: 'Join SmartClinic',
      detail:
        'Create your patient account and access SmartClinic services.',
    },
    {
      mode: 'Clinic',
      title: 'Register a Clinic',
      detail:
        'Create a clinic provider account and begin SmartClinic verification.',
    },
    {
      mode: 'Laboratory',
      title: 'Register a Laboratory',
      detail:
        'Connect a laboratory or diagnostic provider to the SmartClinic network.',
    },
    {
      mode: 'Pharmacy',
      title: 'Register a Pharmacy',
      detail:
        'Connect a pharmacy to the SmartClinic provider network.',
    },
    {
      mode: 'Family',
      title: 'Connect a Family',
      detail:
        'Start with an individual SmartClinic account. Family connections will use existing patient identities.',
    },
    {
      mode: 'Group',
      title: 'Connect a Community',
      detail:
        'Introduce a school, workplace, association or community without creating a separate account system.',
    },
  ];

  constructor() {
  this.states =
    this.locationData.getStates(
      'NG',
    );
}
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const ref = (
          params.get('ref') ??
          params.get('invite') ??
          ''
        )
          .trim()
          .toUpperCase();

        this.referralCode.set(ref);
        this.referralStatus.set(ref ? 'present' : 'idle');

        const requestedType = params.get('type');

        switch (requestedType) {
          case 'Professional':
            this.mode.set('Professional');
            break;

          case 'CLINIC':
            this.mode.set('Clinic');
            break;

          case 'LABORATORY':
            this.mode.set('Laboratory');
            break;

          case 'PHARMACY':
            this.mode.set('Pharmacy');
            break;
        }
      });
  }

  selectMode(mode: JoinMode): void {
    this.mode.set(mode);
  }

  continue(): void {
    switch (this.mode()) {
      case 'Builder':
      case 'Individual':
        this.goToPatientRegistration();
        return;

      case 'Professional':
        this.goToProviderRegistration();
        return;

      case 'Clinic':
        this.goToProviderRegistration('CLINIC');
        return;

      case 'Laboratory':
        this.goToProviderRegistration('LABORATORY');
        return;

      case 'Pharmacy':
        this.goToProviderRegistration('PHARMACY');
        return;

      case 'Family':
        this.goToPatientRegistration();
        return;

      case 'Group':
        // Until SmartClinic has a proper organisation/community
        // onboarding model, do not invent one here.
        return;
    }
  }

  private goToPatientRegistration(): void {
    const queryParams: Record<string, string> = {};

    if (this.referralCode()) {
      queryParams['ref'] = this.referralCode();
    }

    void this.router.navigate(
      ['/register'],
      { queryParams },
    );
  }

  private goToProviderRegistration(
    target?: 'CLINIC' | 'LABORATORY' | 'PHARMACY',
  ): void {
    const queryParams: Record<string, string> = {};

    if (this.referralCode()) {
      queryParams['ref'] = this.referralCode();
    }

    if (target) {
      queryParams['type'] = target;
    }

    void this.router.navigate(
      ['/provider/register'],
      { queryParams },
    );
  }

  get continueLabel(): string {
    switch (this.mode()) {
      case 'Builder':
        return 'Create my SmartClinic account →';

      case 'Individual':
        return 'Create patient account →';

      case 'Professional':
        return 'Start provider registration →';

      case 'Clinic':
        return 'Register clinic →';

      case 'Laboratory':
        return 'Register laboratory →';

      case 'Pharmacy':
        return 'Register pharmacy →';

      case 'Family':
        return 'Start with a patient account →';

      case 'Group':
        return 'Community onboarding coming soon';
    }
  }

  registerBuilder(): void {
  this.submitted.set(true);
  this.error.set(null);

  if (
    this.builderForm.invalid ||
    this.pending()
  ) {
    this.builderForm.markAllAsTouched();
    return;
  }

  const value =
    this.builderForm.getRawValue();

  const email =
    value.email
      .trim()
      .toLowerCase();

  const phone =
    value.phone.trim();

  if (!email && !phone) {
    this.error.set(
      'Either email or phone number is required.',
    );

    return;
  }

  this.pending.set(true);

  this.api
    .registerBuilder({
      givenName:
        value.givenName.trim(),

      familyName:
        value.familyName.trim(),

      ...(email && {
        email,
      }),

      ...(phone && {
        phone,
      }),

      countryCode:
        value.countryCode
          .trim()
          .toUpperCase(),

      stateOrRegion:
        value.stateOrRegion.trim(),

      city:
        value.city.trim(),

      password:
        value.password,

      ...(this.referralCode() && {
        referralCode:
          this.referralCode(),
      }),
    })
    .pipe(
      finalize(() =>
        this.pending.set(false),
      ),
    )
    .subscribe({
      next: () => {
        this.success.set(true);

        this.builderForm.reset({
          givenName: '',
          familyName: '',
          email: '',
          phone: '',
          countryCode: 'NG',
          stateOrRegion: '',
          city: '',
          password: '',
        });

        this.states =
          this.locationData.getStates(
            'NG',
          );

        this.cities = [];
      },

      error: (
        error: HttpErrorResponse,
      ) => {
        const message =
          Array.isArray(
            error.error?.message,
          )
            ? error.error.message.join(
                ', ',
              )
            : error.error?.message;

        this.error.set(
          message ||
            (this.referralCode() &&
            error.status === 400
              ? 'This referral link is no longer valid. Ask the person who invited you for a new link.'
              : error.status === 409
                ? 'An account already exists with this email or phone number. Sign in instead.'
                : error.status === 0
                  ? 'SmartClinic could not be reached. Check your connection and try again.'
                  : 'We could not create your Builder account. Check the form and try again.'),
        );
      },
    });
}

invalid(name: keyof typeof this.builderForm.controls) {
  return this.builderForm.controls[name].invalid;
}

  onCountryChange(): void {
    const countryCode = this.builderForm.controls.countryCode.value;

    this.states = countryCode
      ? this.locationData.getStates(countryCode)
      : [];

    this.cities = [];

    this.builderForm.patchValue({
      stateOrRegion: '',
      city: '',
    });
  }

  onStateChange(): void {
    const countryCode = this.builderForm.controls.countryCode.value;
    const stateName = this.builderForm.controls.stateOrRegion.value;

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

    this.builderForm.controls.city.setValue('');
  }
  get disabled(): boolean {
    return this.mode() === 'Group';
  }

    get passwordStrength(): {
  level: number;
  label: string;
} {
  const password = this.builderForm.controls.password.value;

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