import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { HealthCheckResultsApiService } from './health-check-results-api.service';

describe('HealthCheckResultsApiService', () => {
  it('requests an owned result without client ownership identifiers', () => {
    const { api, http } = setup();
    api.getOwnResult('SC/1').subscribe();
    const pending = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/results');
    expect(pending.request.method).toBe('GET');
    expect(pending.request.params.keys()).toEqual([]);
    expect(pending.request.body).toBeNull();
    pending.flush(result());
  });
  it('uses only the route token for the guest result security context', () => {
    const { api, http } = setup();
    api.getGuestResult('opaque/token').subscribe();
    const pending = http.expectOne('http://api.test/api/v1/public/health-results/opaque%2Ftoken');
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    expect(pending.request.withCredentials).toBe(false);
    expect(pending.request.headers.has('Authorization')).toBe(false);
    expect(pending.request.params.keys()).toEqual([]);
    pending.flush(result());
  });

  it('lists only the current patient scope with supported filters and pagination', () => {
    const { api, http } = setup();
    api
      .getMyHealthChecks({
        bookingStatus: 'COMPLETED',
        encounterStatus: 'COMPLETED',
        page: 2,
        limit: 10,
      })
      .subscribe();
    const pending = http.expectOne(
      (request) => request.url === 'http://api.test/api/v1/me/health-checks',
    );
    expect(pending.request.method).toBe('GET');
    expect(pending.request.params.keys().sort()).toEqual([
      'bookingStatus',
      'encounterStatus',
      'limit',
      'page',
    ]);
    expect(pending.request.params.get('bookingStatus')).toBe('COMPLETED');
    expect(pending.request.params.get('encounterStatus')).toBe('COMPLETED');
    expect(pending.request.params.has('patientId')).toBe(false);
    expect(pending.request.params.has('userId')).toBe(false);
    pending.flush({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });
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
      api: TestBed.inject(HealthCheckResultsApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});
function result() {
  return {
    bookingReference: 'SC-1',
    completedAt: '2026-08-18T10:00:00Z',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential' },
    provider: { displayName: 'SmartClinic Ikeja' },
    measurements: [],
  };
}
