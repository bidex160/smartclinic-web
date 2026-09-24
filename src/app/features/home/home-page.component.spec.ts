import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { HomePageComponent } from './home-page.component';

const catalogue = [
  {
    code: 'ESSENTIAL',
    name: 'Essential Health Check',
    description: 'Core preventive measurements.',
    benefits: [],
    estimatedDurationMinutes: 30,
    isActive: true,
    includedContents: [{ code: 'BP', name: 'Blood pressure', category: 'MEASUREMENT', description: null }],
    optionalAddons: [],
    fromPriceMinor: 800000,
    currency: 'NGN',
    fulfilmentModes: [{ code: 'PROVIDER_LOCATION', name: 'Provider location' }],
  },
  {
    code: 'COMPLETE',
    name: 'Complete Health Check',
    description: 'A broader preventive check.',
    benefits: [],
    estimatedDurationMinutes: 60,
    isActive: true,
    includedContents: [{ code: 'BMI', name: 'BMI', category: 'MEASUREMENT', description: null }],
    optionalAddons: [],
    fromPriceMinor: null,
    currency: null,
    fulfilmentModes: [{ code: 'HOME_VISIT', name: 'Home visit' }],
  },
] as const;

describe('HomePageComponent', () => {
  it('renders the patient-first landing page and six everyday healthcare actions', async () => {
    const api = { getCatalogue: vi.fn(() => of([...catalogue])) };
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: api },
        { provide: AuthStateService, useValue: { isPatient: signal(false) } },
        { provide: ReferralsApiService, useValue: { getPublicLeaderboard: () => of({ people: [], cities: [], countries: [] }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('YOUR HEALTH, CONNECTED');
    expect(text).toContain('What do you need today?');
    expect(text).toContain(
      'Check your health, find the right care, or connect to your hospital—all through one SmartClinic account.',
    );
    const choices = element.querySelectorAll('[aria-label="Primary patient choices"] > a');
    expect(choices).toHaveLength(3);
    expect([...choices].map((choice) => choice.querySelector('h2')?.textContent?.trim())).toEqual([
      'Stay Well',
      'Find Care',
      'My Hospital',
    ]);
    expect(choices[0].getAttribute('href')).toContain('/login');
    expect(choices[1].getAttribute('href')).toBe('/login?returnUrl=%2Fme%2Frequest-care');
    expect(choices[2].getAttribute('href')).toContain('/login');
    expect(choices[2].getAttribute('href')).toContain('returnUrl=%2Fme%2Fproviders%2Fconnect');
    expect(choices[0].textContent).toContain('Check and understand your health');
    expect(choices[1].textContent).toContain('Get Healthcare Help');
    expect(choices[2].textContent).toContain('Connect to a Hospital');
    expect(choices[2].textContent).not.toMatch(
      /appointment booking|register with|link existing record/i,
    );
    expect(text).toContain('Open My SmartClinic');
    expect(text).not.toContain('Continue on WhatsApp');
    expect(text).not.toContain('WhatsApp support unavailable');
    expect(text).toContain('Transparent prices');
    expect(text).toContain('Verified providers');
    expect(text).toContain('Care near you');
    expect(text).toContain('Healthcare without the runaround.');
    expect(text).toContain('Bring your services to SmartClinic.');
    expect(text).toContain('Questions & support');

    expect(text).toContain('Essential Health Check');
    expect(text).toContain('₦8,000.00');
    expect(text).toContain('Price shown after you choose a provider');
    expect(text).not.toContain('Home Visit Health Check');
    const packageLinks = [...element.querySelectorAll('a')].filter((link) =>
      link.textContent?.includes('Explore this check'),
    );
    const packageNames = packageLinks.map((link) =>
      link.closest('article')?.querySelector('h3')?.textContent?.trim(),
    );
    expect(packageNames).toEqual(['Complete Health Check', 'Essential Health Check']);
    expect(packageLinks[0].getAttribute('href')).toBe(
      '/login?returnUrl=%2Fhealth-check%2Fpackages%3Fpackage%3DCOMPLETE',
    );
    expect(packageLinks[1].getAttribute('href')).toBe(
      '/login?returnUrl=%2Fhealth-check%2Fpackages%3Fpackage%3DESSENTIAL',
    );
    expect(element.querySelectorAll('details').length).toBeGreaterThan(0);
  });

  it('routes authenticated patient actions directly into their care journeys', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: { getCatalogue: () => of(catalogue) } },
        { provide: AuthStateService, useValue: { isPatient: signal(true) } },
        { provide: ReferralsApiService, useValue: { getPublicLeaderboard: () => of({ people: [], cities: [], countries: [] }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const links = [...element.querySelectorAll('[aria-label="Healthcare actions"] a')] as HTMLAnchorElement[];

    expect(links.find((link) => link.textContent?.includes('Talk to a Doctor'))?.getAttribute('href'))
      .toContain('/me/request-care');
    expect(links.find((link) => link.textContent?.includes('Visit a Hospital'))?.getAttribute('href'))
      .toBe('/me/providers/connect');
    expect(links.find((link) => link.textContent?.includes('Get Medicine'))?.getAttribute('href'))
      .toBe('/me/prescriptions');
    expect(links.find((link) => link.textContent?.includes('Get a Test'))?.getAttribute('href'))
      .toBe('/me/tests');

    const packageLinks = [...element.querySelectorAll('a')].filter((link) =>
      link.textContent?.includes('View'),
    );
    expect(packageLinks.some((link) => link.getAttribute('href') === '/health-check/packages?package=ESSENTIAL')).toBe(true);
    expect(element.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')).toBeNull();
  });

  it('shows WhatsApp assistance only when an authoritative destination is configured', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: { getCatalogue: () => of([]) } },
        { provide: AuthStateService, useValue: { isPatient: signal(false) } },
        { provide: ReferralsApiService, useValue: { getPublicLeaderboard: () => of({ people: [], cities: [], countries: [] }) } },
        {
          provide: PUBLIC_SITE_CONFIG,
          useValue: { whatsappUrl: 'https://wa.me/2348000000000' },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const link = [...fixture.nativeElement.querySelectorAll('a')].find((item: HTMLAnchorElement) =>
      item.textContent?.includes('Continue on WhatsApp'),
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://wa.me/2348000000000');
  });
});
