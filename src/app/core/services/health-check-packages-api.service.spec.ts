import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { HealthCheckPackage } from '../models/health-check-package.model';
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
});
