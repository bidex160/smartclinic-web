import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PatientDashboard } from '../../core/models/patient-dashboard.model';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { PatientDashboardPageComponent } from './patient-dashboard-page.component';

describe('PatientDashboardPageComponent', () => {
  async function setup(overrides: Partial<PatientDashboard> = {}, dashboardError = false) {
    const value = dashboard(overrides);
    const api = {
      getDashboard: vi.fn(() => (dashboardError ? throwError(() => ({ status: 500 })) : of(value))),
      getProfile: vi.fn(() => of(profile())),
      updateProfile: vi.fn(() => of(profile())),
    };
    const healthChecksApi = { getMyHealthChecks: vi.fn(() => of(healthChecks())) };
    const referralsApi = { summary: vi.fn(() => of(referrals())) };
    await TestBed.configureTestingModule({
      imports: [PatientDashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientDashboardApiService, useValue: api },
        { provide: HealthCheckResultsApiService, useValue: healthChecksApi },
        { provide: ReferralsApiService, useValue: referralsApi },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientDashboardPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api, healthChecksApi, referralsApi };
  }
  it('shows a deliberate loading state before rendering API data', async () => {
    const api = {
      getDashboard: vi.fn(() => new Subject<PatientDashboard>()),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    };
    const healthChecksApi = { getMyHealthChecks: vi.fn(() => new Subject()) };
    const referralsApi = { summary: vi.fn(() => new Subject()) };
    await TestBed.configureTestingModule({
      imports: [PatientDashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientDashboardApiService, useValue: api },
        { provide: HealthCheckResultsApiService, useValue: healthChecksApi },
        { provide: ReferralsApiService, useValue: referralsApi },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientDashboardPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading your dashboard');
    expect(fixture.nativeElement.textContent).not.toContain('Getting started');
  });
  it('renders GETTING_STARTED with the backend patient reference and checklist', async () => {
    const { fixture } = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Welcome, Ada');
    expect(text).toContain('SCP-8K4M-27QD');
    expect(text).toContain('Getting started');
    expect(text).toContain('SmartClinic account created');
    expect(text).not.toContain('Exchange Builder');
  });
  it('renders ESTABLISHED compactly without fake summaries or the checklist', async () => {
    const { fixture } = await setup({ dashboardMode: 'ESTABLISHED', recommendedAction: 'NONE' });
    const text = fixture.nativeElement.textContent;
    expect(text).toMatch(/Good (morning|afternoon|evening), Ada/);
    expect(text).not.toContain('Getting started');
    expect(text).not.toContain('Upcoming appointments');
    expect(text).not.toContain('Ready prescriptions');
  });
  it.each(['GETTING_STARTED', 'ESTABLISHED'] as const)(
    'retains authoritative Health Check and rewards widgets in %s',
    async (dashboardMode) => {
      const { fixture, healthChecksApi, referralsApi } = await setup({ dashboardMode });
      const text = fixture.nativeElement.textContent;
      expect(healthChecksApi.getMyHealthChecks).toHaveBeenCalledWith({ page: 1, limit: 50 });
      expect(referralsApi.summary).toHaveBeenCalledTimes(1);
      expect(text).toContain('Your Health Checks');
      expect(text).toContain('Awaiting payment');
      expect(text).toContain('Completed');
      expect(text).toContain('340 points');
      expect(text).toContain('Level 2 achieved');
    },
  );
  it('derives summary counts only from authoritative portal categories', async () => {
    const { fixture } = await setup();
    const cards = [
      ...fixture.nativeElement.querySelectorAll(
        '[aria-labelledby="health-check-summary-heading"] article',
      ),
    ].map((element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ').trim());
    expect(cards).toEqual([
      'Awaiting payment1',
      'Upcoming / active1',
      'Completed1',
      'Needs attention1',
    ]);
  });
  it.each(['GETTING_STARTED', 'ESTABLISHED'] as const)(
    'keeps all three primary actions in %s',
    async (mode) => {
      const { fixture } = await setup({ dashboardMode: mode });
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Connect to a Provider');
      expect(text).toContain('Book a Health Check');
      expect(text).toContain('Find Care Now');
      expect(fixture.nativeElement.querySelector('a[href="/me/book"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('a[href="/request-care"]')).not.toBeNull();
    },
  );
  it.each([
    ['CONNECT_PROVIDER', 'Connect now'],
    ['VIEW_PROVIDER_CONNECTION', 'Provider connection in progress'],
    ['FIND_CARE', 'Ready when you are'],
    ['NONE', 'How can we help today?'],
  ] as const)('presents %s without hiding permanent actions', async (action, copy) => {
    const { fixture } = await setup({ recommendedAction: action });
    expect(fixture.nativeElement.textContent).toContain(copy);
    expect(fixture.nativeElement.textContent).toContain('Book a Health Check');
  });
  it('derives connection progress from the backend booleans without completing the checklist', async () => {
    const { fixture } = await setup({
      recommendedAction: 'VIEW_PROVIDER_CONNECTION',
      setup: { ...dashboard().setup, hasProviderConnection: true, hasConnectedProvider: false },
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Provider connection in progress');
    expect(fixture.nativeElement.querySelector('a[href="/me/providers"]')).not.toBeNull();
    const item = [...fixture.nativeElement.querySelectorAll('li')].find((x: HTMLElement) =>
      x.textContent?.includes('Connect to a healthcare provider'),
    );
    expect(item.textContent).toContain('Not complete');
  });
  it('loads authoritative profile, keeps email read-only, excludes email from PATCH, then reloads dashboard', async () => {
    const { fixture, component, api } = await setup({ recommendedAction: 'COMPLETE_PROFILE' });
    component.openProfile();
    fixture.detectChanges();
    const email = fixture.nativeElement.querySelector('#profile-email');
    expect(email.readOnly).toBe(true);
    component.profileForm.patchValue({
      givenName: ' Ada ',
      familyName: ' Okafor ',
      phone: '',
      dateOfBirth: '1990-01-01',
    });
    component.saveProfile();
    expect(api.updateProfile).toHaveBeenCalledWith({
      givenName: 'Ada',
      familyName: 'Okafor',
      phone: null,
      dateOfBirth: '1990-01-01',
    });
    expect(api.getDashboard).toHaveBeenCalledTimes(2);
  });
  it('preserves the profile form and displays a safe backend error', async () => {
    const { fixture, component, api } = await setup({ recommendedAction: 'COMPLETE_PROFILE' });
    component.openProfile();
    api.updateProfile.mockReturnValue(
      throwError(() => ({ error: { message: 'Phone is invalid' } })),
    );
    component.saveProfile();
    fixture.detectChanges();
    expect(component.profileForm.controls.givenName.value).toBe('Ada');
    expect(fixture.nativeElement.textContent).toContain('Phone is invalid');
  });
  it('shows dashboard error with retry', async () => {
    const { fixture, component, api } = await setup({}, true);
    expect(fixture.nativeElement.textContent).toContain('dashboard is unavailable');
    api.getDashboard.mockReturnValue(of(dashboard()));
    component.load();
    fixture.detectChanges();
    expect(api.getDashboard).toHaveBeenCalledTimes(2);
    expect(component.dashboard()).not.toBeNull();
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
function profile() {
  return {
    user: { displayName: 'Ada Okafor', email: 'ada@example.test' },
    patient: {
      patientReference: 'SCP-8K4M-27QD',
      givenName: 'Ada',
      familyName: 'Okafor',
      phone: null,
      dateOfBirth: null,
    },
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
    page: 1,
    limit: 50,
    total: 4,
    totalPages: 1,
  };
}
function referrals() {
  return {
    availablePoints: 340,
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
  };
}
