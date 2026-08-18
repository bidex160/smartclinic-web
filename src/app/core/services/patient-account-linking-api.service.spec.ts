import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { PatientAccountLinkingApiService } from './patient-account-linking-api.service';

describe('PatientAccountLinkingApiService', () => {
  it('uses booking cookie credentials without opting out of bearer auth', () => {
    const { api, http } = setup();
    api.linkFromBooking('SC-2026-7F23B0C9D1E4').subscribe();
    const pending = http.expectOne(
      'http://api.test/api/v1/public/bookings/SC-2026-7F23B0C9D1E4/link-patient-account',
    );
    expect(pending.request.method).toBe('POST');
    expect(pending.request.withCredentials).toBe(true);
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(false);
    expect(pending.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    expect(pending.request.body).toBeNull();
    pending.flush(linked());
  });
  it('sends only the result access token for result proof', () => {
    const { api, http } = setup();
    api.linkFromResult('a'.repeat(43)).subscribe();
    const pending = http.expectOne('http://api.test/api/v1/me/patient/link-from-result');
    expect(pending.request.body).toEqual({ resultAccessToken: 'a'.repeat(43) });
    for (const field of ['patientId', 'userId', 'email', 'phone', 'booking'])
      expect(pending.request.body).not.toHaveProperty(field);
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(false);
    expect(pending.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    pending.flush(linked());
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
      api: TestBed.inject(PatientAccountLinkingApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});
function linked() {
  return { linked: true, patient: { givenName: 'Ada', familyName: 'Okafor' } };
}
