import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { ProviderOffer } from '../../core/models/provider-offer.model';
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { ProviderSessionHeaderComponent } from './provider-session-header.component';

@Component({
  selector: 'app-provider-dashboard-page',
  imports: [RouterLink, ProviderSessionHeaderComponent],
  templateUrl: './provider-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderDashboardPageComponent {
  private readonly offersApi = inject(ProviderOffersApiService);
  private readonly profileApi = inject(ProviderOnboardingApiService);
  readonly utils = inject(UtilsService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly profile = signal<ProviderOnboardingProfile | null>(null);
  readonly offers = signal<ProviderOffer[]>([]);
  readonly operational = computed(
    () => this.profile()?.onboardingStatus === 'APPROVED' && this.profile()?.status === 'ACTIVE',
  );
  readonly actionable = computed(() =>
    this.offers().filter((offer) => offer.status === 'OFFERED' || offer.status === 'ACCEPTED'),
  );
  readonly upcoming = computed(() =>
    this.offers().filter((offer) => offer.status === 'CONFIRMED' && offer.confirmedSchedule),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileApi
      .getProfile()
      .pipe(
        switchMap((profile) => {
          this.profile.set(profile);
          return profile.onboardingStatus === 'APPROVED' && profile.status === 'ACTIVE'
            ? this.offersApi.getOffers()
            : of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (offers) => this.offers.set(offers),
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Your provider dashboard is unavailable right now.',
          ),
      });
  }
}
