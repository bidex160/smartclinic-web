import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HomePageComponent } from './home-page.component';

const catalogue = [
  {
    code: 'ESSENTIAL',
    name: 'Essential Health Check',
    description: 'Core preventive measurements.',
    benefits: [],
    estimatedDurationMinutes: 30,
    isActive: true,
    includedContents: [
      { code: 'BP', name: 'Blood pressure', category: 'MEASUREMENT', description: null },
    ],
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
  it('renders the patient-first information architecture using existing routes and catalogue data', async () => {
    const api = { getCatalogue: vi.fn(() => of([...catalogue].reverse())) };
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: api },
        { provide: AuthStateService, useValue: { isPatient: signal(false) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('YOUR HEALTH, CONNECTED');
    expect(text).toContain('How can we help you today?');
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
    expect(choices[1].getAttribute('href')).toBe('/request-care');
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
    expect(text).toContain('Near-you & home options');
    expect(text).toContain('How SmartClinic works');
    expect(text).toContain('Join as a Healthcare Provider');
    const providerSignIn = [...element.querySelectorAll('a')].find((link) =>
      link.textContent?.includes('Provider Sign In'),
    );
    expect(providerSignIn?.getAttribute('href')).toBe('/login');
    expect(text).not.toContain('Help Build the Network');
    expect(text).toContain('Questions & support');
    expect(text).toContain('Essential Health Check');
    expect(text).toContain('Blood pressure');
    expect(text).toContain('₦8,000.00');
    expect(text).toContain('Price shown after you choose a provider');
    expect(text).not.toContain('Home Visit Health Check');
    expect(text.indexOf('Essential Health Check')).toBeLessThan(
      text.indexOf('Complete Health Check'),
    );
    const packageLinks = [...element.querySelectorAll('a')].filter((link) =>
      link.textContent?.includes('Explore this check'),
    );
    expect(packageLinks[0].getAttribute('href')).toBe(
      '/login?returnUrl=%2Fhealth-check%2Fpackages%3Fpackage%3DESSENTIAL',
    );
    expect(packageLinks[1].getAttribute('href')).toBe(
      '/login?returnUrl=%2Fhealth-check%2Fpackages%3Fpackage%3DCOMPLETE',
    );
    expect(element.querySelectorAll('details').length).toBeGreaterThan(0);
    expect(api.getCatalogue).toHaveBeenCalledOnce();
  });

  it('uses the authenticated provider-connection route and never fabricates WhatsApp contact data', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: { getCatalogue: () => of(catalogue) } },
        { provide: AuthStateService, useValue: { isPatient: signal(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const hospital = [...element.querySelectorAll('a')].find((link) =>
      link.textContent?.includes('My Hospital'),
    );
    expect(hospital?.getAttribute('href')).toBe('/me/providers/connect');
    const stayWell = [...element.querySelectorAll('a')].find((link) =>
      link.textContent?.includes('Explore Stay Well'),
    );
    expect(stayWell?.getAttribute('href')).toBe('/me/health-journey');
    const packageLinks = [...element.querySelectorAll('a')].filter((link) =>
      link.textContent?.includes('Explore this check'),
    );
    expect(packageLinks[0].getAttribute('href')).toBe('/health-check/packages?package=ESSENTIAL');
    expect(packageLinks[1].getAttribute('href')).toBe('/health-check/packages?package=COMPLETE');
    expect(element.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')).toBeNull();
    expect(element.textContent).not.toContain('Continue on WhatsApp');
    expect(element.textContent).not.toContain('WhatsApp support unavailable');
  });

  it('shows the assisted-service section only when its authoritative destination is configured', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: { getCatalogue: () => of([]) } },
        { provide: AuthStateService, useValue: { isPatient: signal(false) } },
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
