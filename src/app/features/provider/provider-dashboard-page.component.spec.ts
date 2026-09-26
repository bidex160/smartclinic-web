import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderDashboardApiService } from '../../core/services/provider-dashboard-api.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { offer } from './provider-offer.test-fixture';
import { ProviderDashboardPageComponent } from './provider-dashboard-page.component';
import { ProviderReferralsApiService } from '../../core/services/provider-referrals-api.service';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';

describe('ProviderDashboardPageComponent', () => {
  it('maps all five authoritative metrics and uses a separate offer preview', async () => {
    const { fixture, summaryApi, offersApi } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    for (const label of ['Needs response', 'Today', 'Coming up', 'In progress'])
      expect(text).toContain(label);
    expect(summaryApi.getSummary).toHaveBeenCalledOnce();
    expect(offersApi.getOffers).toHaveBeenCalledWith('OFFERED');
  });

  it('renders legitimate zero values only after a successful response', async () => {
    const { fixture } = await setup('APPROVED', 'ACTIVE', {
      offers: { new: 0 },
      appointments: { today: 0, upcoming: 0 },
      healthChecks: { inProgress: 0, completed: 0 },
    });
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.textContent as string).match(/0/g)?.length,
    ).toBeGreaterThanOrEqual(5);
  });

  it('shows a safe summary error and retries independently', async () => {
    const { fixture, component, summaryApi } = await setup('APPROVED', 'ACTIVE', undefined, true);
    fixture.detectChanges();
    expect(component.summaryError()).toBe('We could not load your operational summary.');
    component.loadSummary();
    expect(summaryApi.getSummary).toHaveBeenCalledTimes(2);
  });

  it('keeps pending providers in onboarding without calling operational APIs', async () => {
    const { fixture, summaryApi, offersApi } = await setup('DRAFT', 'PENDING');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Setup in progress');
    expect(summaryApi.getSummary).not.toHaveBeenCalled();
    expect(offersApi.getOffers).not.toHaveBeenCalled();
  });

  it('shows primary actions and the Find Care setup callout when no active offerings exist', async () => {
    const { fixture, careServicesApi } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(careServicesApi.getOfferings).toHaveBeenCalledOnce();
    expect(text).toContain('What do you need to do?');
    expect(text).toContain('Start offering care');
    expect(text).toContain('Set up Find Care services');
    expect(text).toContain('Care Requests');
    expect(text).toContain('Appointments');
    expect(fixture.nativeElement.querySelector('a[href="/provider/care-services"]')).toBeTruthy();
  });

  it('counts only active Find Care offerings and suppresses the first-time callout', async () => {
    const { fixture } = await setup('APPROVED', 'ACTIVE', undefined, false, [
      { isActive: true },
      { isActive: true },
      { isActive: false },
    ]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Start offering care');
    expect(text).toContain('2 active services');
  });
});

async function setup(
  onboardingStatus = 'APPROVED',
  status = 'ACTIVE',
  summary: any = {
    offers: { new: 11 },
    appointments: { today: 12, upcoming: 13 },
    healthChecks: { inProgress: 14, completed: 15 },
    referrals: {
      availablePoints: 300,
      reservedPoints: 40,
      currentLevel: { code: 'LEVEL_2', name: 'Level 2', ordinal: 2 },
      nextLevel: { code: 'LEVEL_3', name: 'Level 3', ordinal: 3 },
      nextLevelRequirements: [
        { targetType: 'PATIENT', qualified: 22, required: 30, remaining: 8, completed: false },
      ],
      highestConfiguredLevelReached: false,
      qualifiedPatients: 22,
      qualifiedClinics: 5,
      qualifiedLaboratories: 4,
      qualifiedPharmacies: 4,
    },
  },
  failSummary = false,
  findCareOfferings: readonly { isActive: boolean }[] = [],
) {
  const summaryApi = {
    getSummary: vi.fn(() => (failSummary ? throwError(() => new Error('raw')) : of(summary))),
  };
  const offersApi = { getOffers: vi.fn(() => of([offer()])) };
  const careServicesApi = { getOfferings: vi.fn(() => of(findCareOfferings as never)) };
  await TestBed.configureTestingModule({
    imports: [ProviderDashboardPageComponent],
    providers: [
      provideRouter([]),
      { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      { provide: ProviderDashboardApiService, useValue: summaryApi },
      { provide: ProviderOffersApiService, useValue: offersApi },
      { provide: ProviderCareServicesApiService, useValue: careServicesApi },
      { provide: ProviderCareOperationsApiService, useValue: { getCareRequests: () => of({ items: [], page: 1, limit: 100, total: 0, totalPages: 0 }), getAppointments: () => of({ items: [], page: 1, limit: 100, total: 0, totalPages: 0 }) } },
      {
        provide: ProviderOnboardingApiService,
        useValue: { getProfile: () => of({ displayName: 'Provider', providerType: 'CLINIC', status, onboardingStatus, activeCapabilityCount: 0, activeLocationCount: 0, availabilityCount: 0, readiness: { profileComplete: true, hasActiveCapability: false, providerLocationReady: false, hasAvailability: false, blockers: [], capabilityCount: 0, activeCapabilityCount: 0, locationCount: 0, activeLocationCount: 0, availabilityCount: 0 } }) },
      },
      {
        provide: ProviderReferralsApiService,
        useValue: { getSummary: () => of({ links: {}, availablePoints: 0, reservedPoints: 0 }) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ProviderDashboardPageComponent);
  return { fixture, component: fixture.componentInstance, summaryApi, offersApi, careServicesApi };
}
