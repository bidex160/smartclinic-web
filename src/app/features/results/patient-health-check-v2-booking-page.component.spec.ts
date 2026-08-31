import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientHealthCheckV2BookingPageComponent } from './patient-health-check-v2-booking-page.component';

describe('PatientHealthCheckV2BookingPageComponent', () => {
  const catalogue = {
    code: 'ESSENTIAL',
    name: 'Essential Health Check',
    description: 'Core checks',
    benefits: [],
    estimatedDurationMinutes: 30,
    isActive: true,
    includedContents: [
      { code: 'BP', name: 'Blood pressure', category: 'MEASUREMENT', description: null },
    ],
    optionalAddons: [],
    fromPriceMinor: 800000,
    currency: 'NGN',
    fulfilmentModes: [
      { code: 'PROVIDER_LOCATION', name: 'Provider location' },
      { code: 'HOME_VISIT', name: 'Home visit' },
    ],
  };
  const offering = {
    providerReference: 'SCPR-SAFE',
    providerName: 'Prime Clinic',
    packageCode: 'ESSENTIAL',
    basePackagePriceMinor: 800000,
    currency: 'NGN',
    fulfilmentMode: {
      code: 'PROVIDER_LOCATION' as const,
      name: 'Provider location',
      fulfilmentFeeMinor: 0,
    },
    locations: [
      {
        reference: 'SC-LOC-SAFE',
        name: 'Main Clinic',
        addressLine1: '1 Clinic Road',
        addressLine2: null,
        city: 'Ikeja',
        stateOrRegion: 'Lagos',
        postalCode: null,
        countryCode: 'NG',
      },
    ],
    addons: [
      {
        code: 'ADDON_A',
        name: 'Configured add-on',
        category: 'LAB',
        priceMinor: 100000,
        currency: 'NGN',
      },
    ],
  };
  const quote = {
    configurationReference: 'SC-HCQ-SAFE',
    expiresAt: '2026-09-10T10:00:00Z',
    package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    provider: { reference: 'SCPR-SAFE', name: 'Prime Clinic' },
    providerLocation: offering.locations[0],
    fulfilmentMode: { code: 'PROVIDER_LOCATION', name: 'Provider location' },
    includedContents: [{ code: 'BP', name: 'Blood pressure', category: 'MEASUREMENT' }],
    selectedAddons: [{ code: 'ADDON_A', name: 'Configured add-on', amountMinor: 100000 }],
    pricing: {
      currency: 'NGN',
      basePackagePriceMinor: 800000,
      clinicalAddonsTotalMinor: 100000,
      fulfilmentFeeMinor: 0,
      totalMinor: 900000,
    },
  };
  async function setup() {
    const packageApi = {
      getCatalogue: vi.fn(() => of([catalogue])),
      discoverProviders: vi.fn(() =>
        of({ items: [offering], page: 1, limit: 10, total: 1, totalPages: 1 }),
      ),
      getConfigurationQuote: vi.fn(() => of(quote)),
    };
    const bookingApi = {
      createMyHealthCheck: vi.fn(() =>
        of({ bookingReference: 'SC-BOOKING', commercialConfiguration: quote }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PatientHealthCheckV2BookingPageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: packageApi },
        { provide: HealthCheckResultsApiService, useValue: bookingApi },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientHealthCheckV2BookingPageComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, packageApi, bookingApi, fixture };
  }
  it('discovers with schedule/geography, renders only returned offering, and quotes returned add-ons/location', async () => {
    const { component, packageApi, fixture } = await setup();
    component.form.setValue({
      packageCode: 'ESSENTIAL',
      fulfilmentModeCode: 'PROVIDER_LOCATION',
      preferredDate: '2026-09-10',
      preferredTime: '09:00',
      timezone: 'Africa/Lagos',
      address: {
        addressLine1: '12 Ring Road',
        addressLine2: '',
        countryCode: 'NG',
        stateOrRegion: 'Lagos',
        city: 'Ikeja',
        postalCode: '',
      },
    });
    component.discover(1);
    component.selectOffering(offering);
    component.selectLocation(offering.locations[0]);
    component.toggleAddon('ADDON_A');
    component.requestQuote();
    fixture.detectChanges();
    expect(packageApi.discoverProviders).toHaveBeenCalledWith(
      expect.objectContaining({
        packageCode: 'ESSENTIAL',
        preferredTime: '09:00',
        city: 'Ikeja',
        page: 1,
        limit: 10,
      }),
    );
    expect(packageApi.getConfigurationQuote).toHaveBeenCalledWith({
      packageCode: 'ESSENTIAL',
      providerReference: 'SCPR-SAFE',
      providerLocationReference: 'SC-LOC-SAFE',
      fulfilmentModeCode: 'PROVIDER_LOCATION',
      addonCodes: ['ADDON_A'],
    });
    expect(fixture.nativeElement.textContent).toContain('Prime Clinic');
    expect(fixture.nativeElement.textContent).toContain('Total');
  });
  it('creates a bound booking with configuration reference and no commercial replay', async () => {
    const { component, bookingApi } = await setup();
    component.form.patchValue({
      preferredDate: '2026-09-10',
      preferredTime: '09:00',
      timezone: 'Africa/Lagos',
      address: {
        addressLine1: '12 Ring Road',
        countryCode: 'NG',
        stateOrRegion: 'Lagos',
        city: 'Ikeja',
      },
    });
    component.quote.set(quote);
    component.createBooking();
    const payload = (bookingApi.createMyHealthCheck.mock.calls as unknown as [[Record<string, unknown>]])[0][0];
    expect(payload['configurationReference']).toBe('SC-HCQ-SAFE');
    expect(payload['providerReference']).toBeUndefined();
    expect(payload['addonCodes']).toBeUndefined();
    expect(payload['totalMinor']).toBeUndefined();
    expect(payload['healthCheckPackageId']).toBeUndefined();
  });
});
