import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { ProviderSelfConfigurationApiService } from './provider-self-configuration-api.service';
describe('ProviderSelfConfigurationApiService', () => {
  it('uses authenticated provider context without provider IDs for all collection requests', () => {
    const { api, http } = setup();
    api.listServices('ignored-provider-id').subscribe();
    let r = http.expectOne('http://api.test/api/v1/provider/services');
    expect(r.request.params.has('providerId')).toBe(false);
    r.flush([]);
    api
      .createService('ignored-provider-id', {
        healthCheckPackageId: 'package-id',
        fulfilmentModeId: 'mode-id',
        priceMinor: 4500000,
        currency: 'NGN',
      })
      .subscribe();
    r = http.expectOne('http://api.test/api/v1/provider/services');
    expect(r.request.body).toEqual({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      priceMinor: 4500000,
      currency: 'NGN',
    });
    expect(JSON.stringify(r.request.body)).not.toContain('providerId');
    expect(r.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    r.flush({});
    api.updateServicePrice('service-id', { priceMinor: 6500050, currency: 'NGN' }).subscribe();
    r = http.expectOne('http://api.test/api/v1/provider/services/service-id/price');
    expect(r.request.body).toEqual({ priceMinor: 6500050, currency: 'NGN' });
    r.flush({});
    api
      .createLocation('ignored-provider-id', {
        name: 'Clinic',
        addressLine1: '1 Road',
        city: 'Ikeja',
        state: 'Lagos',
        countryCode: 'NG',
      })
      .subscribe();
    r = http.expectOne('http://api.test/api/v1/provider/locations');
    expect(JSON.stringify(r.request.body)).not.toContain('providerId');
    r.flush({});
  });
  it('uses provider-owned item routes for links, availability, and exceptions', () => {
    const { api, http } = setup();
    api.linkLocation('service-id', 'location-id').subscribe();
    let r = http.expectOne(
      'http://api.test/api/v1/provider/services/service-id/locations/location-id',
    );
    expect(r.request.method).toBe('POST');
    r.flush({});
    api
      .createAvailability('ignored', {
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'Africa/Lagos',
      })
      .subscribe();
    r = http.expectOne('http://api.test/api/v1/provider/availability');
    expect(r.request.body).not.toHaveProperty('providerId');
    r.flush({});
    api
      .createException('ignored', {
        date: '2026-09-01',
        type: 'UNAVAILABLE',
        timezone: 'Africa/Lagos',
      })
      .subscribe();
    r = http.expectOne('http://api.test/api/v1/provider/availability-exceptions');
    expect(r.request.body).not.toHaveProperty('providerId');
    r.flush({});
  });
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        ProviderSelfConfigurationApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    return {
      api: TestBed.inject(ProviderSelfConfigurationApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});
