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
import { ProviderMembershipService } from '../../core/services/provider-membership.service';
import { ProviderMemberRole } from '../../core/models/provider-team.model';
import {
  ProviderReferralSummary,
  ProviderReferralsApiService,
} from '../../core/services/provider-referrals-api.service';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { ProviderCareServiceOffering } from '../../core/models/find-care.model';

type PrimaryAction = {
  readonly title: string;
  readonly helper: string;
  readonly route: string;
  readonly fragment?: string;
  readonly status?: 'findCare' | 'healthChecks' | 'availability' | 'locations';
};
/** What each staff role sees first. The facility owner keeps the full set of actions. */
const ROLE_ACTIONS: Record<ProviderMemberRole, readonly PrimaryAction[]> = {
  DOCTOR: [
    { title: 'New request', helper: 'Send a prescription or test to a patient by SmartClinic ID.', route: '/provider/send-request' },
    { title: 'Sent requests', helper: 'Follow your prescriptions, tests and referrals, and see results.', route: '/provider/sent-requests' },
    { title: 'Appointments', helper: 'See today and upcoming patient appointments.', route: '/provider/care-appointments' },
    { title: 'Patient requests', helper: 'Accept new patient appointment requests.', route: '/provider/care-requests' },
    { title: 'Shared records', helper: 'Health records patients have shared with your facility.', route: '/provider/shared-health-records' },
  ],
  NURSE: [
    { title: 'Appointments', helper: 'See today and upcoming patient appointments.', route: '/provider/care-appointments' },
    { title: 'Patient requests', helper: 'New patient appointment requests.', route: '/provider/care-requests' },
    { title: 'Health checks', helper: 'Health check visits assigned to your facility.', route: '/provider/appointments' },
    { title: 'Shared records', helper: 'Health records patients have shared with your facility.', route: '/provider/shared-health-records' },
  ],
  LAB_SCIENTIST: [
    { title: 'Test requests', helper: 'Accept lab and imaging requests, send prices and enter results.', route: '/provider/diagnostic-orders' },
    { title: 'All patient orders', helper: 'Every request sent to your facility, with its status.', route: '/provider/pharmacy-orders' },
    { title: 'Referred out', helper: 'Tests you passed to another lab, and their results.', route: '/provider/referred-out' },
    { title: 'Shared records', helper: 'Health records patients have shared with your facility.', route: '/provider/shared-health-records' },
  ],
  PHARMACIST: [
    { title: 'Prescriptions', helper: 'Accept prescriptions, send prices and prepare medicines.', route: '/provider/pharmacy-orders' },
    { title: 'Referred out', helper: 'Prescriptions you passed to another pharmacy.', route: '/provider/referred-out' },
    { title: 'Shared records', helper: 'Health records patients have shared with your facility.', route: '/provider/shared-health-records' },
  ],
  FRONT_DESK: [
    { title: 'Appointments', helper: 'Today’s and upcoming visits, for check-in.', route: '/provider/care-appointments' },
    { title: 'Patient requests', helper: 'New patient appointment requests.', route: '/provider/care-requests' },
    { title: 'Patient connections', helper: 'Verify patients linking their SmartClinic ID to your facility.', route: '/provider/patient-connections' },
    { title: 'Health checks', helper: 'Health check visits assigned to your facility.', route: '/provider/appointments' },
  ],
  ADMIN: [
    { title: 'Team', helper: 'Invite staff and set what each person can see.', route: '/provider/team' },
    { title: 'Connect your system', helper: 'API keys and updates for your EMR, lab or pharmacy software.', route: '/provider/integrations' },
    { title: 'Services', helper: 'Choose the consultations patients can book.', route: '/provider/care-services', status: 'findCare' },
    { title: 'Availability', helper: 'Set when patients can book you.', route: '/provider/profile', fragment: 'availability', status: 'availability' },
    { title: 'Locations', helper: 'Manage where you see patients in person.', route: '/provider/profile', fragment: 'configuration', status: 'locations' },
    { title: 'Patient interest', helper: 'See demand for your facility from the SmartClinic directory.', route: '/provider/facility-demand' },
  ],
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
  private readonly careOperationsApi = inject(ProviderCareOperationsApiService);
  readonly utils = inject(UtilsService);
  readonly membership = inject(ProviderMembershipService);
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
  readonly newCareRequestCount = signal(0);
  readonly careRequestCountError = signal(false);
  readonly careAppointmentCount = signal(0);
  readonly careAppointmentCountError = signal(false);
  readonly todayAppointmentCount = signal(0);
  readonly inProgressAppointmentCount = signal(0);
  readonly upcomingAppointmentCount = signal(0);
  readonly activeFindCareServiceCount = computed(
    () => this.findCareOfferings().filter((offering) => offering.isActive).length,
  );
  providerTypeLabel(type: ProviderOnboardingProfile['providerType']): string {
    switch (type) {
      case 'CLINIC': return 'clinic';
      case 'HOSPITAL': return 'hospital';
      case 'DIAGNOSTIC_CENTRE': return 'laboratory / diagnostic centre';
      case 'PHARMACY': return 'pharmacy';
      case 'INDIVIDUAL': return 'practice';
      default: return 'provider account';
    }
  }

  readonly primaryActions = computed<readonly PrimaryAction[]>(() => {
    const role = this.membership.role();
    if (role) return ROLE_ACTIONS[role];
    const team: PrimaryAction = { title: 'Team', helper: 'Give your staff their own logins and roles.', route: '/provider/team' };
    const integrations: PrimaryAction = { title: 'Connect your system', helper: 'Link your EMR, lab or pharmacy software by API.', route: '/provider/integrations' };
    return [...this.ownerActions(), team, integrations];
  });

  private ownerActions(): readonly PrimaryAction[] {
    const type = this.profile()?.providerType;
    if (type === 'PHARMACY') return [
      { title: 'Patient prescriptions', helper: 'Accept prescriptions, send prices and prepare medicines.', route: '/provider/pharmacy-orders' },
      { title: 'Referred out', helper: 'Prescriptions you passed to another pharmacy, and where they are now.', route: '/provider/referred-out' },
      { title: 'Your payments', helper: 'See patient payments and settlements.', route: '/provider/earnings' },
      { title: 'Grow my network', helper: 'Recommend trusted providers and grow your impact.', route: '/provider/network' },
      { title: 'Pharmacy setup', helper: 'Keep your pharmacy details and service units up to date.', route: '/provider/profile' },
      { title: 'Patient interest', helper: 'See how many patients have asked SmartClinic to contact your pharmacy.', route: '/provider/facility-demand' },
    ];
    if (type === 'DIAGNOSTIC_CENTRE') return [
      { title: 'Test & scan requests', helper: 'Accept requests, send prices and upload patient results.', route: '/provider/pharmacy-orders' },
      { title: 'Referred out', helper: 'Tests you passed to another lab, and their results.', route: '/provider/referred-out' },
      { title: 'Your payments', helper: 'See patient payments and settlements.', route: '/provider/earnings' },
      { title: 'Diagnostic setup', helper: 'Keep your laboratory or diagnostic centre details up to date.', route: '/provider/profile' },
      { title: 'Patient interest', helper: 'See how many patients have asked SmartClinic to contact your facility.', route: '/provider/facility-demand' },
    ];
    return [
      { title: 'New patient requests', helper: 'Accept new patient appointment requests.', route: '/provider/care-requests' },
      { title: 'Appointments', helper: 'See today and upcoming patient appointments.', route: '/provider/care-appointments' },
      { title: 'Your payments', helper: 'See what patients have paid and what is due to you.', route: '/provider/earnings' },
      { title: 'Prescription earnings', helper: 'Track held and available Smart Prescription coordination fees.', route: '/provider/pharmacy-coordination-earnings' },
      { title: 'Grow my network', helper: 'Recommend trusted pharmacies, labs and clinics and grow your impact.', route: '/provider/network' },
      { title: 'Patient interest', helper: 'See aggregate demand for your facility from the SmartClinic directory.', route: '/provider/facility-demand' },
      { title: 'Services', helper: 'Choose the consultations patients can book.', route: '/provider/care-services', status: 'findCare' },
      { title: 'Availability', helper: 'Set when patients can book you.', route: '/provider/profile', fragment: 'availability', status: 'availability' },
      { title: 'Locations', helper: 'Manage where you see patients in person.', route: '/provider/profile', fragment: 'configuration', status: 'locations' },
    ];
  }

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
            this.loadReferrals();
            if (profile.providerType !== 'PHARMACY' && profile.providerType !== 'DIAGNOSTIC_CENTRE') {
              this.loadFindCareOfferings();
              this.loadSummary();
              this.loadOfferPreview();
              this.loadCareRequestCount();
              this.loadCareAppointmentCount();
            }
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

  loadCareRequestCount(): void {
    this.careRequestCountError.set(false);
    this.careOperationsApi.getCareRequests(1, 100).subscribe({
      next: (page) => this.newCareRequestCount.set(
        page.items.filter((request) => request.status === 'AWAITING_PROVIDER_RESPONSE').length,
      ),
      error: () => {
        this.newCareRequestCount.set(0);
        this.careRequestCountError.set(true);
      },
    });
  }

  loadCareAppointmentCount(): void {
    this.careAppointmentCountError.set(false);
    this.careOperationsApi.getAppointments(1, 100).subscribe({
      next: (page) => {
        const active = page.items.filter((appointment) => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status));
        this.careAppointmentCount.set(active.length);
        const today = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
        this.todayAppointmentCount.set(active.filter(a => a.scheduledDate === today).length);
        this.inProgressAppointmentCount.set(active.filter(a => a.status === 'IN_PROGRESS').length);
        this.upcomingAppointmentCount.set(active.filter(a => a.scheduledDate > today).length);
      },
      error: () => {
        this.careAppointmentCount.set(0);
        this.careAppointmentCountError.set(true);
      },
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
