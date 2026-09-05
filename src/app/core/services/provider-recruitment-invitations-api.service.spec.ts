import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { ProviderRecruitmentInvitationsApiService } from './provider-recruitment-invitations-api.service';

describe('ProviderRecruitmentInvitationsApiService', () => {
  it('posts the exact patient provider-invitation request', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    const api = TestBed.inject(ProviderRecruitmentInvitationsApiService);
    const http = TestBed.inject(HttpTestingController);
    const request = {
      organisationName: 'Eket General Hospital',
      email: 'contact@example.com',
      source: 'HEALTH_CHECK_NO_PROVIDER' as const,
      packageCode: 'COMPLETE',
      fulfilmentModeCode: 'PROVIDER_LOCATION',
      preferredDate: '2026-09-04',
      preferredTime: '21:37',
      countryCode: 'NG',
      stateOrRegion: 'Akwa Ibom',
      city: 'Eket',
    };
    api.create(request).subscribe();
    const pending = http.expectOne('/api/v1/me/provider-invitations');
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    pending.flush({});
    http.verify();
  });
});
