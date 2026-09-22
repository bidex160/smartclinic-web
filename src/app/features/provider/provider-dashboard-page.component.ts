import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProviderDashboardSummary } from '../../core/models/dashboard-summary.model';
import { ProviderOffer } from '../../core/models/provider-offer.model';
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderDashboardApiService } from '../../core/services/provider-dashboard-api.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { UtilsService } from '../../core/services/utils.service';
import {
  ProviderReferralSummary,
  ProviderReferralsApiService,
} from '../../core/services/provider-referrals-api.service';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ProviderCareServiceOffering } from '../../core/models/find-care.model';

type PrimaryAction = {
  readonly title: string;
  readonly helper: string;
  readonly route: string;
  readonly fragment?: string;
  readonly status?: 'findCare' | 'healthChecks' | 'availability' | 'locations';
};
@Component({
  selector: 'app-provider-dashboard-page',
  imports: [RouterLink],
  templateUrl: './provider-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderDashboardPageComponent {
  private readonly offersApi = inject(ProviderOffersApiService);
  private readonly dashboardApi = inject(ProviderDashboardApiService);
  private readonly profileApi = inject(ProviderOnboardingApiService);
  private readonly referralsApi = inject(ProviderReferralsApiService);
  private readonly careServicesApi = inject(ProviderCareServicesApiService);
  readonly utils = inject(UtilsService);
  readonly profileLoading = signal(true);
  readonly profileError = signal<string | null>(null);
  readonly profile = signal<ProviderOnboardingProfile | null>(null);
  readonly summaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);
  readonly summary = signal<ProviderDashboardSummary | null>(null);
  readonly offersLoading = signal(false);
  readonly offersError = signal<string | null>(null);
  readonly offerPreview = signal<ProviderOffer[]>([]);
  readonly operational = computed(
    () => this.profile()?.onboardingStatus === 'APPROVED' && this.profile()?.status === 'ACTIVE',
  );

  readonly referralSummary = signal<ProviderReferralSummary | null>(null);
  readonly referralLoading = signal(false);
  inviteOpen = signal(false);
  readonly copiedLink = signal<string | null>(null);
  readonly findCareOfferings = signal<readonly ProviderCareServiceOffering[]>([]);
  readonly findCareLoading = signal(false);
  readonly findCareLoaded = signal(false);
  readonly findCareError = signal(false);
  readonly activeFindCareServiceCount = computed(
    () => this.findCareOfferings().filter((offering) => offering.isActive).length,
  );
  readonly primaryActions: readonly PrimaryAction[] = [
    { title: 'Find Care Services', helper: 'Set the consultations and specialist services patients can request from you.', route: '/provider/care-services', status: 'findCare' },
    { title: 'Health Check Services', helper: 'Configure the Health Check services you offer.', route: '/provider/profile', fragment: 'configuration', status: 'healthChecks' },
    { title: 'Availability', helper: "Set when you're available for appointments and services.", route: '/provider/profile', fragment: 'availability', status: 'availability' },
    { title: 'Locations', helper: 'Manage locations for in-person Health Check services.', route: '/provider/profile', fragment: 'configuration', status: 'locations' },
    { title: 'Care Requests', helper: 'Review incoming patient care requests.', route: '/provider/care-requests' },
    { title: 'Appointments', helper: 'View and manage your appointments.', route: '/provider/care-appointments' },
  ];

  constructor() {
    this.load();
  }

  loadReferrals(): void {
    this.referralLoading.set(true);

    this.referralsApi
      .getSummary()
      .pipe(finalize(() => this.referralLoading.set(false)))
      .subscribe({
        next: (summary) => this.referralSummary.set(summary),
        error: () => this.referralSummary.set(null),
      });
  }

  load(): void {
    this.profileLoading.set(true);
    this.profileError.set(null);
    this.profileApi
      .getProfile()
      .pipe(finalize(() => this.profileLoading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          if (profile.onboardingStatus === 'APPROVED' && profile.status === 'ACTIVE') {
            this.loadFindCareOfferings();
            this.loadSummary();
            this.loadOfferPreview();
            this.loadReferrals();
          }
        },
        error: (error: HttpErrorResponse) =>
          this.profileError.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Your provider dashboard is unavailable right now.',
          ),
      });
  }

  loadFindCareOfferings(): void {
    this.findCareLoading.set(true);
    this.findCareLoaded.set(false);
    this.findCareError.set(false);
    this.careServicesApi
      .getOfferings()
      .pipe(finalize(() => {
        this.findCareLoading.set(false);
        this.findCareLoaded.set(true);
      }))
      .subscribe({
        next: (offerings) => this.findCareOfferings.set(offerings),
        error: () => {
          this.findCareOfferings.set([]);
          this.findCareError.set(true);
        },
      });
  }

  actionStatus(action: PrimaryAction, profile: ProviderOnboardingProfile): string | null {
    switch (action.status) {
      case 'findCare': {
        if (this.findCareLoading()) return null;
        if (this.findCareError()) return 'Status unavailable';
        const count = this.activeFindCareServiceCount();
        return count === 0 ? 'Not configured' : `${count} active service${count === 1 ? '' : 's'}`;
      }
      case 'healthChecks': {
        const count = profile.activeCapabilityCount;
        return count === 0 ? 'Not configured' : `${count} active service${count === 1 ? '' : 's'}`;
      }
      case 'availability': {
        const count = profile.availabilityCount;
        return count === 0 ? 'Not configured' : `${count} schedule${count === 1 ? '' : 's'}`;
      }
      case 'locations': {
        const count = profile.activeLocationCount;
        return count === 0 ? 'Not configured' : `${count} active location${count === 1 ? '' : 's'}`;
      }
      default:
        return null;
    }
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.dashboardApi
      .getSummary()
      .pipe(finalize(() => this.summaryLoading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.summaryError.set('We could not load your operational summary.'),
      });
  }

  loadOfferPreview(): void {
    this.offersLoading.set(true);
    this.offersError.set(null);
    this.offersApi
      .getOffers('OFFERED')
      .pipe(finalize(() => this.offersLoading.set(false)))
      .subscribe({
        next: (offers) => this.offerPreview.set(offers.slice(0, 5)),
        error: () => this.offersError.set('We could not load your latest offers.'),
      });
  }

  referralTargetLabel(target: string): string {
    return (
      (
        {
          PATIENT: 'Patients',
          INDIVIDUAL: 'Individual health professionals',
          CLINIC: 'Clinics',
          LABORATORY: 'Laboratories',
          PHARMACY: 'Pharmacies',
        } as Record<string, string>
      )[target] ?? target
    );
  }

  referralUrl(path: string): string {
    return new URL(path, window.location.origin).toString();
  }

  async copyReferralLink(path: string): Promise<void> {
    const url = this.referralUrl(path);

    await navigator.clipboard.writeText(url);

    this.copiedLink.set(url);

    setTimeout(() => {
      if (this.copiedLink() === url) {
        this.copiedLink.set(null);
      }
    }, 2000);
  }

  async shareReferralLink(path: string, label: string): Promise<void> {
    const url = this.referralUrl(path);

    if (navigator.share) {
      await navigator.share({
        title: 'Join SmartClinic',
        text: `Join SmartClinic as ${label}.`,
        url,
      });

      return;
    }

    await this.copyReferralLink(path);
  }
}
