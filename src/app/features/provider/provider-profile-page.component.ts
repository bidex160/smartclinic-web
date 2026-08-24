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
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProviderType } from '../../core/models/admin-provider.model';
import {
  ProviderOnboardingBlocker,
  ProviderOnboardingProfile,
} from '../../core/models/provider-onboarding.model';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { ProviderSelfConfigurationApiService } from '../../core/services/provider-self-configuration-api.service';
import { ProviderEligibilityConfigComponent } from '../admin/provider-eligibility-config.component';
import { ProviderServiceAreasComponent } from './provider-service-areas.component';

@Component({
  selector: 'app-provider-profile-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ProviderEligibilityConfigComponent,
    ProviderServiceAreasComponent,
  ],
  providers: [
    ProviderSelfConfigurationApiService,
    { provide: ProviderEligibilityApiService, useExisting: ProviderSelfConfigurationApiService },
  ],
  templateUrl: './provider-profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderProfilePageComponent {
  private readonly api = inject(ProviderOnboardingApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly auth = inject(AuthStateService);
  readonly profile = signal<ProviderOnboardingProfile | null>(null);
  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly confirmingSubmit = signal(false);
  readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(32)]],
    professionalReference: ['', Validators.maxLength(200)],
    providerType: this.fb.control<ProviderType>('INDIVIDUAL'),
    countryCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    stateOrRegion: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
  });
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.form.setValue({
            displayName: p.displayName,
            phone: p.phone ?? '',
            professionalReference: p.professionalReference ?? '',
            providerType: p.providerType,
            countryCode: p.countryCode ?? '',
            stateOrRegion: p.stateOrRegion ?? '',
            city: p.city ?? '',
          });
          if (this.profileEditable(p)) this.form.enable();
          else this.form.disable();
        },
        error: (e) => this.handle(e),
      });
  }
  save(): void {
    if (
      this.form.invalid ||
      this.mutating() ||
      !this.profile() ||
      !this.profileEditable(this.profile()!)
    ) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.run(
      this.api.updateProfile({
        displayName: v.displayName.trim(),
        phone: v.phone.trim(),
        professionalReference: v.professionalReference.trim() || undefined,
        providerType: v.providerType,
        countryCode: v.countryCode.trim().toUpperCase(),
        stateOrRegion: v.stateOrRegion.trim(),
        city: v.city.trim(),
      }),
      'Provider profile saved.',
    );
  }
  requestSubmit(): void {
    const current = this.profile();
    if (
      current &&
      this.profileEditable(current) &&
      !this.form.invalid &&
      !this.mutating() &&
      current.readiness.blockers.length === 0
    )
      this.confirmingSubmit.set(true);
    else this.form.markAllAsTouched();
  }
  submit(): void {
    if (!this.confirmingSubmit() || this.mutating()) return;
    this.run(
      this.api.submit(),
      'Your provider configuration has been submitted for SmartClinic review.',
    );
  }
  logout(): void {
    this.session.logout().subscribe(() => void this.router.navigate(['/admin/login']));
  }
  private run(
    operation: ReturnType<ProviderOnboardingApiService['submit']>,
    message: string,
  ): void {
    this.mutating.set(true);
    this.error.set(null);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (p) => {
        this.profile.set(p);
        if (!this.profileEditable(p)) this.form.disable();
        this.confirmingSubmit.set(false);
        this.statusMessage.set(message);
      },
      error: (e) => this.handle(e),
    });
  }
  configurationEditable(profile: ProviderOnboardingProfile): boolean {
    return (
      profile.onboardingStatus !== 'SUBMITTED' &&
      profile.status !== 'SUSPENDED' &&
      profile.status !== 'INACTIVE'
    );
  }
  profileEditable(profile: ProviderOnboardingProfile): boolean {
    return (
      profile.onboardingStatus !== 'APPROVED' &&
      profile.onboardingStatus !== 'SUBMITTED' &&
      profile.status !== 'SUSPENDED' &&
      profile.status !== 'INACTIVE'
    );
  }
  blockerLabel(blocker: ProviderOnboardingBlocker): string {
    const labels: Record<ProviderOnboardingBlocker, string> = {
      PROFILE_INCOMPLETE: 'Complete your provider profile',
      NO_ACTIVE_CAPABILITY: 'Add at least one active service',
      PROVIDER_LOCATION_WITHOUT_LOCATION:
        'Add an active location and link it to each provider-location service',
      HOME_VISIT_WITHOUT_SERVICE_AREA: 'Add an active service area for each Home Visit service',
      NO_WEEKLY_AVAILABILITY: 'Add weekly availability',
    };
    return labels[blocker];
  }
  private handle(error: HttpErrorResponse): void {
    this.error.set(
      error.status === 409
        ? 'The provider onboarding state changed or its requirements are incomplete. Refresh and review the profile.'
        : error.status === 0
          ? 'SmartClinic could not be reached. Check your connection and try again.'
          : 'The provider profile is unavailable.',
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
