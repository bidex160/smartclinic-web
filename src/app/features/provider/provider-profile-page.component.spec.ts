import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { ProviderProfilePageComponent } from './provider-profile-page.component';

describe('ProviderProfilePageComponent', () => {
  it('loads pending profile, edits only permitted fields, and submits for review explicitly', async () => {
    const { component, api } = await setup(profile('REJECTED'));
    component.form.patchValue({ city: 'Abuja' });
    component.save();
    expect(api.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ city: 'Abuja' }));
    expect(JSON.stringify(api.updateProfile.mock.calls[0][0])).not.toContain('status');
    component.requestSubmit();
    expect(api.submit).not.toHaveBeenCalled();
    component.submit();
    expect(api.submit).toHaveBeenCalledOnce();
  });
  it('makes approved profile fields read-only and identifies operational status separately', async () => {
    const { fixture, component } = await setup({ ...profile('APPROVED'), status: 'ACTIVE' });
    fixture.detectChanges();
    expect(component.form.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Operational status: ACTIVE');
  });
  it('renders backend readiness blockers and hides submission until ready', async () => {
    const base = profile('REJECTED');
    const value = {
      ...base,
      readiness: {
        ...base.readiness,
        hasActiveCapability: false,
        hasAvailability: false,
        blockers: ['NO_ACTIVE_CAPABILITY', 'NO_WEEKLY_AVAILABILITY'] as const,
      },
    };
    const { fixture, component, api } = await setup(value);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Add at least one active service');
    expect(fixture.nativeElement.textContent).toContain('Add weekly availability');
    expect(fixture.nativeElement.textContent).not.toContain('Submit for review');
    component.requestSubmit();
    component.submit();
    expect(api.submit).not.toHaveBeenCalled();
  });
  it('keeps submitted configuration read-only and prevents duplicate submission', async () => {
    const { fixture, component, api } = await setup(profile('SUBMITTED'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Awaiting SmartClinic review');
    component.requestSubmit();
    component.submit();
    component.submit();
    expect(api.submit).not.toHaveBeenCalled();
  });
  async function setup(value = profile('SUBMITTED')) {
    const api = {
      getProfile: vi.fn(() => of(value)),
      updateProfile: vi.fn((_request: unknown) => of(value)),
      submit: vi.fn(() => of({ ...value, onboardingStatus: 'SUBMITTED' })),
    };
    const eligibilityApi = {
      listServices: () => of([]),
      listLocations: () => of([]),
      listAvailability: () => of([]),
      listExceptions: () => of([]),
    };
    TestBed.configureTestingModule({
      imports: [ProviderProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: ProviderOnboardingApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
        { provide: HealthCheckPackagesApiService, useValue: { getPackages: () => of([]) } },
        { provide: FulfilmentModesApiService, useValue: { getFulfilmentModes: () => of([]) } },
        {
          provide: AuthStateService,
          useValue: { currentUser: () => ({ displayName: 'Ada' }), authenticated: () => true },
        },
      ],
    }).overrideComponent(ProviderProfilePageComponent, {
      set: { providers: [{ provide: ProviderEligibilityApiService, useValue: eligibilityApi }] },
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ProviderProfilePageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});
function profile(
  onboardingStatus: 'REJECTED' | 'SUBMITTED' | 'APPROVED',
): import('../../core/models/provider-onboarding.model').ProviderOnboardingProfile {
  return {
    displayName: 'Ada Clinic',
    email: 'ada@example.test',
    phone: '+2348000000000',
    professionalReference: null,
    providerType: 'CLINIC' as const,
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: 'Ikeja',
    status: 'PENDING' as const,
    onboardingStatus,
    submittedAt: '2026-08-22',
    reviewedAt: null,
    reviewNote: onboardingStatus === 'REJECTED' ? 'Update city' : null,
    capabilityCount: 1,
    activeCapabilityCount: 1,
    locationCount: 1,
    activeLocationCount: 1,
    availabilityCount: 1,
    readiness: {
      profileComplete: true,
      hasActiveCapability: true,
      providerLocationReady: true,
      hasAvailability: true,
      blockers: [],
      capabilityCount: 1,
      activeCapabilityCount: 1,
      locationCount: 1,
      activeLocationCount: 1,
      availabilityCount: 1,
    },
  };
}
