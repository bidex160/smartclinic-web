import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderDashboardApiService } from '../../core/services/provider-dashboard-api.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { offer } from './provider-offers-page.component.spec';
import { ProviderDashboardPageComponent } from './provider-dashboard-page.component';

describe('ProviderDashboardPageComponent', () => {
  it('maps all five authoritative metrics and uses a separate offer preview', async () => {
    const { fixture, summaryApi, offersApi } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    for (const label of ['New Offers', "Today's Appointments", 'Upcoming Appointments', 'In Progress', 'Completed']) expect(text).toContain(label);
    for (const value of ['11', '12', '13', '14', '15']) expect(text).toContain(value);
    expect(summaryApi.getSummary).toHaveBeenCalledOnce();
    expect(offersApi.getOffers).toHaveBeenCalledWith('OFFERED');
    expect(text).not.toMatch(/earnings|revenue|settlement/i);
  });

  it('renders legitimate zero values only after a successful response', async () => {
    const { fixture } = await setup('APPROVED', 'ACTIVE', { offers: { new: 0 }, appointments: { today: 0, upcoming: 0 }, healthChecks: { inProgress: 0, completed: 0 } });
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string).match(/0/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('shows a safe summary error and retries independently', async () => {
    const { fixture, component, summaryApi } = await setup('APPROVED', 'ACTIVE', undefined, true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('We could not load your operational summary.');
    component.loadSummary();
    expect(summaryApi.getSummary).toHaveBeenCalledTimes(2);
  });

  it('keeps pending providers in onboarding without calling operational APIs', async () => {
    const { fixture, summaryApi, offersApi } = await setup('DRAFT', 'PENDING');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Complete your provider setup');
    expect(summaryApi.getSummary).not.toHaveBeenCalled();
    expect(offersApi.getOffers).not.toHaveBeenCalled();
  });
});

async function setup(onboardingStatus = 'APPROVED', status = 'ACTIVE', summary: any = { offers: { new: 11 }, appointments: { today: 12, upcoming: 13 }, healthChecks: { inProgress: 14, completed: 15 } }, failSummary = false) {
  const summaryApi = { getSummary: vi.fn(() => failSummary ? throwError(() => new Error('raw')) : of(summary)) };
  const offersApi = { getOffers: vi.fn(() => of([offer()])) };
  await TestBed.configureTestingModule({ imports: [ProviderDashboardPageComponent], providers: [provideRouter([]), { provide: AuthSessionService, useValue: { logout: () => of(true) } }, { provide: ProviderDashboardApiService, useValue: summaryApi }, { provide: ProviderOffersApiService, useValue: offersApi }, { provide: ProviderOnboardingApiService, useValue: { getProfile: () => of({ displayName: 'Provider', status, onboardingStatus }) } }] }).compileComponents();
  const fixture = TestBed.createComponent(ProviderDashboardPageComponent);
  return { fixture, component: fixture.componentInstance, summaryApi, offersApi };
}
