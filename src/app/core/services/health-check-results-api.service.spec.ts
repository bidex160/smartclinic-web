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
  it('loads profile and detail through current-user routes only', () => {
    const { api, http } = setup();
    api.getMyProfile().subscribe();
    const profile = http.expectOne('http://api.test/api/v1/me/profile');
    expect(profile.request.params.keys()).toEqual([]);
    profile.flush({
      user: { displayName: 'Ada', email: 'ada@example.test' },
      patient: {
        patientReference: 'SCP-1234-ABCD',
        givenName: 'Ada',
        familyName: 'Okafor',
        phone: null,
      },
    });
    api.getMyHealthCheck('SC/1').subscribe();
    const detail = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1');
    expect(detail.request.params.has('patientId')).toBe(false);
    detail.flush({});
  });

  it('creates a SELF Health Check without client ownership fields', () => {
    const { api, http } = setup();
    api
      .createMyHealthCheck({
        healthCheckPackageId: 'package',
        fulfilmentModeId: 'mode',
        preferredDate: '2026-09-01',
        preferredTimeWindowStart: '09:00',
        preferredTimezone: 'Africa/Lagos',
        visitAddress: {
          addressLine1: '15 Ring Road',
          city: 'Ibadan',
          stateOrRegion: 'Oyo',
          countryCode: 'NG',
        },
      })
      .subscribe();
    const pending = http.expectOne('http://api.test/api/v1/me/health-checks');
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).not.toEqual(
      expect.objectContaining({
        userId: expect.anything(),
        patientId: expect.anything(),
        patientReference: expect.anything(),
      }),
    );
    expect(pending.request.body.visitAddress.city).toBe('Ibadan');
    pending.flush({});
  });
  it('uses authenticated current-patient payment endpoints without ownership identifiers', () => {
    const { api, http } = setup();
    api.initiateMyHealthCheckPayment('SC/1', 'PAY_NOW', { paymentEmail: 'ada@example.com' }).subscribe();
    const initialize = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/payment');
    expect(initialize.request.method).toBe('POST');
    expect(initialize.request.body).toEqual({ option: 'PAY_NOW', paymentEmail: 'ada@example.com' });
    expect(initialize.request.body).not.toEqual(expect.objectContaining({ patientId: expect.anything(), userId: expect.anything(), amount: expect.anything() }));
    initialize.flush({});
    api.getMyHealthCheckPayment('SC/1').subscribe();
    const status = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/payment');
    expect(status.request.method).toBe('GET');
    status.flush({});
    api.verifyMyHealthCheckPayment('SC/1').subscribe();
    const verify = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/payment/verify');
    expect(verify.request.method).toBe('POST');
    expect(verify.request.body).toBeNull();
    verify.flush({});
  });
  it('uses owned reward redemption endpoints and sends only points when applying', () => {
    const { api, http } = setup();
    api.previewMyHealthCheckRewards('SC/1').subscribe();
    expect(http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/rewards/preview').request.method).toBe('GET');
    api.applyMyHealthCheckRewards('SC/1', 500).subscribe();
    const apply = http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/rewards/apply');
    expect(apply.request.method).toBe('POST');
    expect(apply.request.body).toEqual({ points: 500 });
    expect(apply.request.body).not.toEqual(expect.objectContaining({ amount: expect.anything(), userId: expect.anything(), patientId: expect.anything() }));
    apply.flush({});
    api.releaseMyHealthCheckRewards('SC/1').subscribe();
    expect(http.expectOne('http://api.test/api/v1/me/health-checks/SC%2F1/rewards').request.method).toBe('DELETE');
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
