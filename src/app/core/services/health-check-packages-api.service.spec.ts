import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { HealthCheckCataloguePackage, HealthCheckPackage } from '../models/health-check-package.model';
import { HealthCheckPackagesApiService } from './health-check-packages-api.service';

describe('HealthCheckPackagesApiService', () => {
  let service: HealthCheckPackagesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HealthCheckPackagesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    service = TestBed.inject(HealthCheckPackagesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests the package catalogue from the configured API', () => {
    const response: HealthCheckPackage[] = [
      {
        id: 'package-id',
        code: 'API_PACKAGE',
        name: 'API package',
        description: null,
        benefits: ['Benefit'],
        estimatedDurationMinutes: 30,
        isActive: true,
      },
    ];

    service.getPackages().subscribe((packages) => {
      expect(packages).toEqual(response);
      expect(packages[0]).not.toHaveProperty('prices');
    });

    const request = httpTesting.expectOne('http://api.example.test/api/v1/health-check-packages');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('lists catalogue packages cheapest first, unpriced last, whatever order the API returns', () => {
    const pkg = (code: string, fromPriceMinor: number | null): HealthCheckCataloguePackage => ({
      code, name: `${code} Health Check`, description: null, benefits: [], estimatedDurationMinutes: null,
      isActive: true, includedContents: [], optionalAddons: [], fromPriceMinor, currency: 'NGN', fulfilmentModes: [],
    });
    let codes: string[] = [];
    service.getCatalogue().subscribe((items) => (codes = items.map((item) => item.code)));
    httpTesting
      .expectOne('http://api.example.test/api/v1/health-check-packages/catalogue')
      .flush([pkg('BASIC', 500000), pkg('COMPLETE', 1600000), pkg('CUSTOM', null), pkg('ESSENTIAL', 1000000)]);
    expect(codes).toEqual(['BASIC', 'ESSENTIAL', 'COMPLETE', 'CUSTOM']);
  });

  it('uses the V2 catalogue and sends only configuration selections for quoting', () => {
    service.getCatalogue().subscribe();
    let request = httpTesting.expectOne(
      'http://api.example.test/api/v1/health-check-packages/catalogue',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);

    service
      .getConfigurationQuote({
        packageCode: 'ESSENTIAL',
        providerReference: 'SCPR-SAFE',
        fulfilmentModeCode: 'HOME_VISIT',
        addonCodes: ['ADDON_A'],
      })
      .subscribe();
    request = httpTesting.expectOne(
      'http://api.example.test/api/v1/health-check-packages/configuration-quote',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      packageCode: 'ESSENTIAL',
      providerReference: 'SCPR-SAFE',
      fulfilmentModeCode: 'HOME_VISIT',
      addonCodes: ['ADDON_A'],
    });
    expect(request.request.body.totalMinor).toBeUndefined();
    request.flush({});
  });

  it('serializes the exact provider discovery context without internal ids', () => {
    service
      .discoverProviders({
        packageCode: 'ESSENTIAL',
        fulfilmentModeCode: 'HOME_VISIT',
        preferredDate: '2026-09-10',
        preferredTime: '09:30',
        timezone: 'Africa/Lagos',
        countryCode: 'NG',
        stateOrRegion: 'Lagos',
        city: 'Ikeja',
        postalCode: '100001',
        page: 2,
        limit: 10,
      })
      .subscribe();
    const request = httpTesting.expectOne(
      (r) => r.url === 'http://api.example.test/api/v1/health-check-packages/providers',
    );
    expect(request.request.params.get('packageCode')).toBe('ESSENTIAL');
    expect(request.request.params.get('preferredTime')).toBe('09:30');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.has('providerId')).toBe(false);
    request.flush({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });
  });
});
