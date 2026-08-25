import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProviderType } from '../../core/models/admin-provider.model';
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { ICountry, IState, ICity } from 'country-state-city';

@Component({
  selector: 'app-provider-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './provider-register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderRegisterPageComponent {
  private readonly api = inject(ProviderOnboardingApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly submitting = signal(false);
  readonly result = signal<ProviderOnboardingProfile | null>(null);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(32)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    professionalReference: ['', Validators.maxLength(200)],
    providerType: this.fb.control<ProviderType>('INDIVIDUAL', Validators.required),
    countryCode: ['NG', [Validators.required]],
    stateOrRegion: ['', [Validators.required]],
    city: ['', [Validators.required]],
  });
private readonly locationData = inject(LocationDataService);

readonly countries: ICountry[] =
  this.locationData.getCountries();

registerStates: IState[] = [];
registerCities: ICity[] = [];

selectedRegisterStateCode = '';

constructor(){
  this.onRegisterCountryChange('NG')
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
        email: value.email.trim().toLowerCase(),
        phone: value.phone.trim(),
        password: value.password,
        ...(value.professionalReference.trim() && {
          professionalReference: value.professionalReference.trim(),
        }),
        providerType: value.providerType,
        countryCode: value.countryCode.trim().toUpperCase(),
        stateOrRegion: value.stateOrRegion.trim(),
        city: value.city.trim(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.form.reset({ providerType: 'INDIVIDUAL', countryCode: 'NG' });
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 409
              ? 'A SmartClinic account or provider identity already exists for these details. Contact SmartClinic operations if you need help.'
              : error.status === 0
                ? 'SmartClinic could not be reached. Check your connection and try again.'
                : 'Review your provider details and try again.',
          );
          queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
        },
      });
  }

  onRegisterCountryChange(countryCode: string): void {
  this.registerStates =
    this.locationData.getStates(countryCode);

  this.registerCities = [];
  this.selectedRegisterStateCode = '';

  this.form.patchValue({
    stateOrRegion: '',
    city: '',
  });
}

onRegisterStateChange(stateCode: string): void {
  const countryCode =
    this.form.controls.countryCode.value ?? '';

  const selectedState = this.registerStates.find(
    (state) => state.isoCode === stateCode,
  );

  this.selectedRegisterStateCode = stateCode;

  this.registerCities =
    this.locationData.getCities(
      countryCode,
      stateCode,
    );

  this.form.patchValue({
    // Keep backend contract as state NAME.
    stateOrRegion: selectedState?.name ?? '',
    city: '',
  });
}
}
