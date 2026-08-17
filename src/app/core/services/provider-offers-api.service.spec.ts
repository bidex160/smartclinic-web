import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { ProviderOffersApiService } from './provider-offers-api.service';

describe('ProviderOffersApiService', () => {
  it('lists offers with an optional backend status filter', () => {
    const { api, http } = setup();
    api.getOffers('DECLINED').subscribe();
    const request = http.expectOne(
      'http://api.example.test/api/v1/provider/offers?status=DECLINED',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('gets, accepts, and declines an owned offer', () => {
    const { api, http } = setup();
    api.getOffer('offer-id').subscribe();
    http.expectOne('http://api.example.test/api/v1/provider/offers/offer-id').flush(offer());

    api.acceptOffer('offer-id').subscribe();
    const accept = http.expectOne('http://api.example.test/api/v1/provider/offers/offer-id/accept');
    expect(accept.request.method).toBe('POST');
    expect(accept.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    accept.flush({ ...offer(), status: 'ACCEPTED' });

    api.declineOffer('offer-id', { reason: 'Unavailable' }).subscribe();
    const decline = http.expectOne(
      'http://api.example.test/api/v1/provider/offers/offer-id/decline',
    );
    expect(decline.request.body).toEqual({ reason: 'Unavailable' });
    expect(decline.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    decline.flush({ ...offer(), status: 'DECLINED' });
    http.verify();
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    return {
      api: TestBed.inject(ProviderOffersApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});

function offer() {
  return {
    assignmentId: 'offer-id',
    status: 'OFFERED',
    offeredAt: '2026-08-24T08:00:00Z',
    expiresAt: '2026-08-24T08:30:00Z',
    respondedAt: null,
    acceptedAt: null,
    bookingReference: 'SC-2026-ABCDEF123456',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    preferredDate: '2026-08-24',
    preferredTimeWindowStart: '09:00',
    preferredTimeWindowEnd: '11:00',
    preferredTimezone: 'Africa/Lagos',
    responseReason: null,
  };
}
