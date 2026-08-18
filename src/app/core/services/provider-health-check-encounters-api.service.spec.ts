import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { ProviderHealthCheckEncountersApiService } from './provider-health-check-encounters-api.service';

describe('ProviderHealthCheckEncountersApiService', () => {
  it('loads the safe projection and does not replay clinical mutations', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    const api = TestBed.inject(ProviderHealthCheckEncountersApiService);
    const http = TestBed.inject(HttpTestingController);
    const base = 'http://api.test/api/v1/provider/bookings/SC%2F1/health-check';
    api.get('SC/1').subscribe();
    http.expectOne(base).flush(encounter());
    api.start('SC/1').subscribe();
    const start = http.expectOne(`${base}/start`);
    expect(start.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    start.flush(encounter());
    const body = request();
    api.saveMeasurements('SC/1', body).subscribe();
    const save = http.expectOne(`${base}/measurements`);
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual(body);
    expect(JSON.stringify(save.request.body)).not.toContain('unit');
    expect(save.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    save.flush(encounter());
    api.complete('SC/1').subscribe();
    const complete = http.expectOne(`${base}/complete`);
    expect(complete.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    complete.flush({ ...encounter(), status: 'COMPLETED' });
    http.verify();
  });
});

function request() {
  return {
    bloodPressure: { systolic: 120, diastolic: 80 },
    bloodGlucose: { value: 95 },
    bmi: { value: 24.2 },
    temperature: { value: 36.8 },
    oxygenSaturation: { value: 98 },
    pulse: { value: 72 },
  };
}
function encounter() {
  return {
    bookingReference: 'SC-1',
    status: 'IN_PROGRESS',
    startedAt: '2026-08-18T10:00:00Z',
    completedAt: null,
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home Visit' },
    measurements: [],
  };
}
