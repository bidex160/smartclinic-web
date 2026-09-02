import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { PatientDashboard } from '../../core/models/patient-dashboard.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { PatientDashboardPageComponent } from './patient-dashboard-page.component';

describe('PatientDashboardPageComponent', () => {
  async function setup(
    options: {
      dashboard?: Partial<PatientDashboard>;
      healthChecks?: { items: { portalCategory: string }[] };
      supportUrl?: string | null;
      dashboardError?: boolean;
    } = {},
  ) {
    const value = dashboard(options.dashboard);
    const api = {
      getDashboard: vi.fn(() =>
        options.dashboardError ? throwError(() => ({ status: 500 })) : of(value),
      ),
    };
    const healthChecksApi = {
      getMyHealthChecks: vi.fn(() =>
        of({
          ...(options.healthChecks ?? healthChecks()),
          page: 1,
          limit: 50,
          total: options.healthChecks?.items.length ?? 4,
          totalPages: 1,
        }),
      ),
    };
    const referralsApi = { summary: vi.fn(() => of(referrals())) };
    const passportApi = { overview: vi.fn(() => of(passport())) };
    await TestBed.configureTestingModule({
      imports: [PatientDashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientDashboardApiService, useValue: api },
        { provide: HealthCheckResultsApiService, useValue: healthChecksApi },
        { provide: ReferralsApiService, useValue: referralsApi },
        { provide: HealthPassportApiService, useValue: passportApi },
        { provide: PUBLIC_SITE_CONFIG, useValue: { whatsappUrl: options.supportUrl ?? null } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientDashboardPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api, healthChecksApi, referralsApi };
  }

  it('places authoritative identity and one backend-driven next step before secondary content', async () => {
    const { fixture } = await setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome, Ada');
    expect(text).toContain('SmartClinic ID: SCP-8K4M-27QD');
    expect(text).toContain('Your next step');
    expect(text).toContain('Complete your profile');
    expect(
      fixture.nativeElement
        .querySelector('#next-step-heading')
        .closest('section')
        .querySelector('a')
        .getAttribute('href'),
    ).toBe('/me/profile');
    expect(text.indexOf('Your next step')).toBeLessThan(text.indexOf('Your Care'));
  });

  it.each([
    ['CONNECT_PROVIDER', 'Connect your hospital', '/me/providers/connect'],
    ['VIEW_PROVIDER_CONNECTION', 'Continue your hospital connection', '/me/providers'],
    ['FIND_CARE', 'Find the care you need', '/me/request-care'],
    ['NONE', 'What would you like to do?', '/me/health-journey'],
  ] as const)(
    'uses the existing %s recommendation without inventing priority',
    async (recommendedAction, title, route) => {
      const { fixture } = await setup({ dashboard: { recommendedAction } });
      const section = fixture.nativeElement.querySelector('#next-step-heading').closest('section');
      expect(section.textContent).toContain(title);
      expect(section.querySelector('a').getAttribute('href')).toBe(route);
    },
  );

  it('keeps compact Stay Well, Find Care and My Hospital actions on established routes', async () => {
    const { fixture } = await setup();
    const nav = fixture.nativeElement.querySelector('[aria-label="Primary patient actions"]');
    expect(
      [...nav.querySelectorAll('a')].map((a: HTMLAnchorElement) => [
        a.textContent.trim(),
        a.getAttribute('href'),
      ]),
    ).toEqual([
      ['Stay Well', '/me/health-journey'],
      ['Find Care', '/me/request-care'],
      ['My Hospital', '/me/providers/connect'],
    ]);
  });

  it('renders truthful care empty states without patient, hospital, appointment or result fabrication', async () => {
    const { fixture } = await setup();
    const care = fixture.nativeElement
      .querySelector('#your-care-heading')
      .closest('section').textContent;
    expect(care).toContain('No hospital connected yet');
    expect(care).toContain('No care request yet');
    expect(care).not.toMatch(/next appointment|Dr\.|hospital name/i);
  });

  it('preserves all zero Health Check statistics and adds a useful empty action', async () => {
    const { fixture } = await setup({ healthChecks: { items: [] } });
    const section = fixture.nativeElement
      .querySelector('#health-check-summary-heading')
      .closest('section');
    expect(
      [...section.querySelectorAll('article')].map((x: HTMLElement) =>
        x.textContent.replace(/\s+/g, ' ').trim(),
      ),
    ).toEqual(['Awaiting payment0', 'Upcoming / active0', 'Completed0', 'Needs attention0']);
    expect(section.textContent).toContain("You haven't completed a Health Check yet");
    expect(section.querySelector('a[href="/me/health-journey"]')).not.toBeNull();
  });

  it('uses Passport projections without fabricating a clinical value', async () => {
    const { fixture } = await setup();
    const section = fixture.nativeElement.querySelector('#passport-heading').closest('section');
    expect(section.textContent).toContain('Blood pressure');
    expect(section.textContent).toContain('Reported by you');
    expect(section.textContent).not.toContain('120/80');
    expect(section.querySelector('a[href="/me/health-passport"]')).not.toBeNull();
  });

  it('uses authoritative referral balances, level, code and links with encoded WhatsApp sharing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const { fixture, component } = await setup();
    const section = fixture.nativeElement.querySelector('#impact-heading').closest('section');
    expect(section.textContent).toContain('Available points340');
    expect(section.textContent).toContain('Reserved points60');
    expect(section.textContent).toContain('Lifetime earned500');
    expect(section.textContent).toContain('SC-ABC123');
    expect(section.textContent).toContain('Next achievement: Level 3');
    const share = section.querySelector('a[href^="https://wa.me/"]') as HTMLAnchorElement;
    expect(decodeURIComponent(share.href)).toContain(
      'https://smartclinic.example/register?ref=SC-ABC123',
    );
    await component.copyReferralLink();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://smartclinic.example/register?ref=SC-ABC123',
    );
  });

  it('keeps Getting Started semantics compact and accurate', async () => {
    const { fixture } = await setup();
    const section = fixture.nativeElement
      .querySelector('#getting-started-heading')
      .closest('section');
    expect(section.textContent).toContain('SmartClinic account created');
    expect(section.textContent).toContain('Complete your profile');
    expect(section.textContent).toContain('Complete');
    expect(section.textContent).toContain('Not complete');
  });

  it('hides support WhatsApp without configuration and shows only the configured URL', async () => {
    const hidden = await setup();
    expect(hidden.fixture.nativeElement.textContent).not.toContain('WhatsApp help');
    TestBed.resetTestingModule();
    const shown = await setup({ supportUrl: 'https://wa.me/2348000000000' });
    expect(
      shown.fixture.nativeElement.querySelector('a[href="https://wa.me/2348000000000"]'),
    ).not.toBeNull();
  });

  it('retains loading, API scope and recoverable dashboard error behavior', async () => {
    const pending = new Subject<PatientDashboard>();
    await TestBed.configureTestingModule({
      imports: [PatientDashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientDashboardApiService, useValue: { getDashboard: () => pending } },
        {
          provide: HealthCheckResultsApiService,
          useValue: {
            getMyHealthChecks: () =>
              of({ ...healthChecks(), page: 1, limit: 50, total: 4, totalPages: 1 }),
          },
        },
        { provide: ReferralsApiService, useValue: { summary: () => of(referrals()) } },
        { provide: HealthPassportApiService, useValue: { overview: () => of(passport()) } },
      ],
    }).compileComponents();
    const pendingFixture = TestBed.createComponent(PatientDashboardPageComponent);
    pendingFixture.detectChanges();
    expect(pendingFixture.nativeElement.textContent).toContain('Loading your dashboard');
    TestBed.resetTestingModule();
    const failed = await setup({ dashboardError: true });
    expect(failed.fixture.nativeElement.textContent).toContain('dashboard is unavailable');
    TestBed.resetTestingModule();
    const loaded = await setup();
    expect(loaded.healthChecksApi.getMyHealthChecks).toHaveBeenCalledWith({ page: 1, limit: 50 });
    expect(loaded.referralsApi.summary).toHaveBeenCalledOnce();
  });
});

function dashboard(overrides: Partial<PatientDashboard> = {}): PatientDashboard {
  return {
    patient: { patientReference: 'SCP-8K4M-27QD', firstName: 'Ada', displayName: 'Ada Okafor' },
    setup: {
      accountCreated: true,
      profileComplete: false,
      missingProfileFields: ['phone'],
      hasProviderConnection: false,
      hasConnectedProvider: false,
      hasCareRequest: false,
      hasHealthCheckBooking: false,
      hasStartedCareJourney: false,
    },
    recommendedAction: 'COMPLETE_PROFILE',
    dashboardMode: 'GETTING_STARTED',
    ...overrides,
  };
}
function healthChecks() {
  return {
    items: [
      { portalCategory: 'AWAITING_PAYMENT' },
      { portalCategory: 'UPCOMING_ACTIVE' },
      { portalCategory: 'COMPLETED_HISTORY' },
      { portalCategory: 'NEEDS_ATTENTION' },
    ],
  };
}
function referrals(): ReferralSummaryFixture {
  return {
    referralCode: 'SC-ABC123',
    links: {
      PATIENT: 'https://smartclinic.example/register?ref=SC-ABC123',
      CLINIC: '/provider/register?ref=SC-ABC123&type=CLINIC',
      LABORATORY: '/provider/register?ref=SC-ABC123&type=LABORATORY',
      PHARMACY: '/provider/register?ref=SC-ABC123&type=PHARMACY',
    },
    availablePoints: 340,
    reservedPoints: 60,
    withdrawalReservedPoints: 40,
    healthCheckReservedPoints: 20,
    lifetimeEarnedPoints: 500,
    lifetimeRedeemedPoints: 100,
    levelProgress: {
      currentLevel: { code: 'LEVEL_2', name: 'Level 2', ordinal: 2 },
      nextLevel: { code: 'LEVEL_3', name: 'Level 3', ordinal: 3 },
      highestLevelAchieved: 2,
      requirements: [
        { targetType: 'PATIENT', qualified: 22, required: 30, remaining: 8, completed: false },
      ],
      highestConfiguredLevelReached: false,
      qualifiedCounts: { PATIENT: 22, CLINIC: 5, LABORATORY: 4, PHARMACY: 4 },
    },
    currentLevel: null,
    nextLevel: null,
    progress: {
      patients: { qualified: 22, required: 30 },
      clinics: { qualified: 5, required: 6 },
      laboratories: { qualified: 4, required: 4 },
      pharmacies: { qualified: 4, required: 4 },
    },
    completed: false,
    registeredDirectReferrals: 40,
    qualifiedDirectReferrals: 36,
  };
}
type ReferralSummaryFixture = import('../../core/models/referral.model').ReferralSummary;
function passport() {
  return {
    patient: {
      patientReference: 'SCP-8K4M-27QD',
      givenName: 'Ada',
      familyName: 'Okafor',
      displayName: 'Ada Okafor',
      dateOfBirth: null,
    },
    summary: {
      completedSelfChecks: 0,
      completedHealthChecks: 0,
      completedGeneralCareEncounters: 0,
      finalizedClinicalRecords: 0,
      issuedPrescriptions: 0,
      completedDispensings: 0,
    },
    latestMeasurements: [
      {
        type: 'BLOOD_PRESSURE',
        value: {},
        unit: 'mmHg',
        recordedAt: '2026-09-01',
        provenance: 'REPORTED_BY_YOU' as const,
        sourceDomain: 'SELF_CHECK',
        sourceReference: 'SC-GSC-1',
      },
    ],
    reportedHealthHistory: [],
    recentChecks: { selfChecks: [], healthChecks: [] },
    recentMedicationContext: [],
    currentNextAction: null,
    recentActivity: [],
  };
}
