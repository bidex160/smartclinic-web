import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { ProviderEligibilityApiService } from './provider-eligibility-api.service';
describe('ProviderEligibilityApiService', () => {
  it('uses provider route context and mutation replay protection for configuration operations', () => {
    const { api, http } = setup();
    api
      .createService('provider/id', {
        healthCheckPackageId: 'package-id',
        fulfilmentModeId: 'mode-id',
      })
      .subscribe();
    let r = http.expectOne('http://api.test/api/v1/admin/providers/provider%2Fid/services');
    expect(r.request.body).toEqual({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
    });
    expect(r.request.body).not.toHaveProperty('providerId');
    expect(r.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    r.flush({});
    api.linkLocation('service-id', 'location-id').subscribe();
    r = http.expectOne(
      'http://api.test/api/v1/admin/provider-services/service-id/locations/location-id',
    );
    expect(r.request.method).toBe('POST');
    r.flush({});
    api.unlinkLocation('service-id', 'location-id').subscribe();
    r = http.expectOne(
      'http://api.test/api/v1/admin/provider-services/service-id/locations/location-id',
    );
    expect(r.request.method).toBe('DELETE');
    r.flush(null);
  });
  it('supports location, availability, and exception lifecycle endpoints', () => {
    const { api, http } = setup();
    const calls = [
      api.createLocation('provider-id', {
        name: 'Clinic',
        addressLine1: '1 Road',
        city: 'Ikeja',
        state: 'Lagos',
        countryCode: 'NG',
      }),
      api.setLocationActive('location-id', false),
      api.createAvailability('provider-id', {
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'Africa/Lagos',
      }),
      api.setAvailabilityActive('availability-id', true),
      api.createException('provider-id', {
        date: '2026-09-01',
        timezone: 'Africa/Lagos',
        type: 'UNAVAILABLE',
      }),
      api.setExceptionActive('exception-id', false),
    ];
    for (const call of calls) {
      (call as import('rxjs').Observable<unknown>).subscribe();
      const r = http.match((x) => x.context.get(SKIP_AUTH_RETRY));
      expect(r).toHaveLength(1);
      r[0].flush({});
    }
  });
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    return {
      api: TestBed.inject(ProviderEligibilityApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});
