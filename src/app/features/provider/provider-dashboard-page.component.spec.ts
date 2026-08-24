import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { offer } from './provider-offers-page.component.spec';
import { ProviderDashboardPageComponent } from './provider-dashboard-page.component';

describe('ProviderDashboardPageComponent', () => {
  it('summarizes existing safe offer data without inventing financial metrics', async () => {
    const fixture = await setup('APPROVED', 'ACTIVE');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Offers requiring attention');
    expect(text).toContain('Upcoming Health Checks');
    expect(text).not.toMatch(/earnings|revenue|settlement/i);
  });

  it('directs a pending provider to configuration and hides operational navigation', async () => {
    const fixture = await setup('DRAFT', 'PENDING');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Complete provider onboarding');
    expect(text).toContain('Continue provider setup');
    expect(text).not.toContain('Open My Offers');
  });
});

async function setup(onboardingStatus: string, status: string) {
  await TestBed.configureTestingModule({
    imports: [ProviderDashboardPageComponent],
    providers: [
      provideRouter([]),
      { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      {
        provide: ProviderOnboardingApiService,
        useValue: {
          getProfile: () =>
            of({
              displayName: 'Provider',
              email: 'provider@example.test',
              phone: null,
              professionalReference: null,
              providerType: 'INDIVIDUAL',
              countryCode: 'NG',
              stateOrRegion: 'Lagos',
              city: 'Ikeja',
              status,
              onboardingStatus,
              submittedAt: null,
              reviewedAt: null,
              reviewNote: null,
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
            }),
        },
      },
      { provide: ProviderOffersApiService, useValue: { getOffers: () => of([offer()]) } },
    ],
  }).compileComponents();
  return TestBed.createComponent(ProviderDashboardPageComponent);
}
