import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { ProviderOnboardingApiService } from './provider-onboarding-api.service';

describe('ProviderOnboardingApiService', () => {
  it('registers with only supported identity fields and no staff authentication context', () => {
    const { api, http } = setup();
    const body = {
      displayName: 'Ada Clinic',
      email: 'ada@example.test',
      phone: '+2348000000000',
      password: 'a-secure-password',
      providerType: 'CLINIC' as const,
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    };
    api.register(body).subscribe();
    const request = http.expectOne('http://api.test/api/v1/public/providers/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    expect(JSON.stringify(request.request.body)).not.toContain('roles');
    expect(JSON.stringify(request.request.body)).not.toContain('status');
    request.flush(profile());
  });
  it('loads, updates, and submits the authenticated provider profile without mutation replay', () => {
    const { api, http } = setup();
    api.getProfile().subscribe();
    http.expectOne('http://api.test/api/v1/provider/profile').flush(profile());
    api.updateProfile({ city: 'Abuja' }).subscribe();
    let request = http.expectOne('http://api.test/api/v1/provider/profile');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    request.flush(profile());
    api.submit().subscribe();
    request = http.expectOne('http://api.test/api/v1/provider/onboarding/submit');
    expect(request.request.method).toBe('POST');
    expect(request.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    request.flush(profile());
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
      api: TestBed.inject(ProviderOnboardingApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});
function profile() {
  return {
    displayName: 'Ada Clinic',
    email: 'ada@example.test',
    phone: '+2348000000000',
    professionalReference: null,
    providerType: 'CLINIC',
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: 'Ikeja',
    status: 'PENDING',
    onboardingStatus: 'SUBMITTED',
    submittedAt: '2026-08-22T00:00:00Z',
    reviewedAt: null,
    reviewNote: null,
  };
}
