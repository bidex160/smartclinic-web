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
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('Your health journey');
    expect(text).toContain('What do you need today?');
    expect(text).toContain('Dr Hadiza');
    expect(text).toContain('Dr Valerie');

    const actions = element.querySelectorAll('[aria-label="Healthcare actions"] > *');
    expect(actions).toHaveLength(6);
    expect(text).toContain('Book a Checkup');
    expect(text).toContain('See a Doctor');
    expect(text).toContain('Visit a Hospital');
    expect(text).toContain('Get Medicine');
    expect(text).toContain('Get a Test');
    expect(text).toContain('Pay a Bill');
    expect(text).toContain('Coming soon');

    expect(text).toContain('Your care, together in one place.');
    expect(text).toContain('Clear pricing');
    expect(text).toContain('Verified providers');
    expect(text).toContain('Care near you');
    expect(text).toContain('Healthcare without the runaround.');
    expect(text).toContain('Bring your services to SmartClinic.');
    expect(text).toContain('Questions & support');

    expect(text).toContain('Essential Health Check');
    expect(text).toContain('₦8,000.00');
    expect(text).toContain('Price shown after provider');
    expect(api.getCatalogue).toHaveBeenCalledOnce();
  });

  it('routes authenticated patient actions directly into their care journeys', async () => {
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
    const links = [...element.querySelectorAll('[aria-label="Healthcare actions"] a')] as HTMLAnchorElement[];

    expect(links.find((link) => link.textContent?.includes('See a Doctor'))?.getAttribute('href'))
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
        { provide: PUBLIC_SITE_CONFIG, useValue: { whatsappUrl: 'https://wa.me/2348000000000' } },
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
