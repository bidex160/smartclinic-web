import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { CreatePackagePriceRequest, PackagePrice } from '../models/package-price.model';
import { PackagePricesApiService } from './package-prices-api.service';

describe('PackagePricesApiService', () => {
  let service: PackagePricesApiService;
  let http: HttpTestingController;
  const request: CreatePackagePriceRequest = {
    healthCheckPackageId: 'package-id',
    fulfilmentModeId: 'mode-id',
    amount: '12500.00',
    currency: 'NGN',
    effectiveFrom: '2099-01-01',
  };
  const response = { id: 'price-id' } as PackagePrice;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    service = TestBed.inject(PackagePricesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists prices with supported filters', () => {
    service
      .getPackagePrices({
        healthCheckPackageId: 'package-id',
        fulfilmentModeId: 'mode-id',
        isActive: false,
      })
      .subscribe();
    const pending = http.expectOne((item) => item.url.endsWith('/admin/package-prices'));
    expect(pending.request.params.get('healthCheckPackageId')).toBe('package-id');
    expect(pending.request.params.get('fulfilmentModeId')).toBe('mode-id');
    expect(pending.request.params.get('isActive')).toBe('false');
    pending.flush([]);
  });

  it('creates a package price', () => {
    service.createPackagePrice(request).subscribe();
    const pending = http.expectOne('http://api.example.test/api/v1/admin/package-prices');
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    pending.flush(response);
  });

  it('schedules a future package price', () => {
    service.schedulePackagePrice(request).subscribe();
    const pending = http.expectOne('http://api.example.test/api/v1/admin/package-prices/schedule');
    expect(pending.request.method).toBe('POST');
    pending.flush(response);
  });

  it('deactivates a package price without deleting it', () => {
    service.deactivatePackagePrice('price-id').subscribe();
    const pending = http.expectOne(
      'http://api.example.test/api/v1/admin/package-prices/price-id/deactivate',
    );
    expect(pending.request.method).toBe('PATCH');
    expect(pending.request.body).toEqual({});
    pending.flush(response);
  });
});
