import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
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
  async function setup(value = profile('SUBMITTED')) {
    const api = {
      getProfile: vi.fn(() => of(value)),
      updateProfile: vi.fn((_request: unknown) => of(value)),
      submit: vi.fn(() => of({ ...value, onboardingStatus: 'SUBMITTED' })),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: ProviderOnboardingApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
        {
          provide: AuthStateService,
          useValue: { currentUser: () => ({ displayName: 'Ada' }), authenticated: () => true },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderProfilePageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});
function profile(onboardingStatus: 'REJECTED' | 'SUBMITTED' | 'APPROVED'): import('../../core/models/provider-onboarding.model').ProviderOnboardingProfile {
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
  };
}
