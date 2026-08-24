import { Component, ChangeDetectionStrategy, inject, signal, computed } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ProviderSessionHeaderComponent } from "./provider-session-header.component";
import { finalize, of, switchMap } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { ProviderOffersApiService } from "../../core/services/provider-offers-api.service";
import { ProviderOnboardingApiService } from "../../core/services/provider-onboarding-api.service";
import { ProviderOnboardingProfile } from "../../core/models/provider-onboarding.model";
import { UtilsService } from "../../core/services/utils.service";
import { ProviderOffer } from "../../core/models/provider-offer.model";

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, ProviderSessionHeaderComponent],
  template: `
    <app-provider-session-header 
    [operational]="operational() || profile()?.onboardingStatus === 'APPROVED' && profile()?.status === 'ACTIVE'" 
     />

    <div class="min-h-screen bg-slate-50 lg:ml-64">
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderLayoutComponent {
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
    constructor() {
    this.load();
  }

    load(): void {
    this.loading.set(true);
     this.profileApi.loading.set(true)
    this.error.set(null);
      this.profileApi.error.set(null);
    this.profileApi
      .getProfile()
      .pipe(
        switchMap((profile) => {
          this.profileApi.profile.set(profile)
          this.profile.set(profile);
          return profile.onboardingStatus === 'APPROVED' && profile.status === 'ACTIVE'
            ? this.offersApi.getOffers()
            : of([]);
        }),
        finalize(() => {
          this.loading.set(false)
          this.profileApi.loading.set(false)
        }
        ),
      )
      .subscribe({
        next: (offers) =>{
           this.offers.set(offers)
            this.profileApi.offers.set(offers)
          },
        error: (error: HttpErrorResponse) =>{
            this.error.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Your provider dashboard is unavailable right now.',
          ),
          this.profileApi.error.set(error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Your provider dashboard is unavailable right now.')
        }
        
      });
  }
}