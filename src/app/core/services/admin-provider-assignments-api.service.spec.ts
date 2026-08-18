import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { AdminProviderAssignmentsApiService } from './admin-provider-assignments-api.service';

describe('AdminProviderAssignmentsApiService', () => {
  it('lists assignments with supported filters and gets one assignment', () => {
    const { api, http } = setup();
    api
      .getAssignments({
        bookingReference: 'SC-2026-ABCDEF123456',
        providerId: '10000000-0000-4000-8000-000000000001',
        status: 'ACCEPTED',
      })
      .subscribe();
    http
      .expectOne(
        (request) =>
          request.url === 'http://api.example.test/api/v1/admin/provider-assignments' &&
          request.params.get('bookingReference') === 'SC-2026-ABCDEF123456' &&
          request.params.get('providerId') === '10000000-0000-4000-8000-000000000001' &&
          request.params.get('status') === 'ACCEPTED',
      )
      .flush([]);

    api.getAssignment('assignment-id').subscribe();
    http
      .expectOne('http://api.example.test/api/v1/admin/provider-assignments/assignment-id')
      .flush(assignment());
  });

  it('uses non-replayed POST operations for matching, confirmation, and expiry', () => {
    const { api, http } = setup();
    api.startMatching('SC-2026-ABCDEF123456').subscribe();
    const start = http.expectOne(
      'http://api.example.test/api/v1/admin/bookings/SC-2026-ABCDEF123456/matching/start',
    );
    expect(start.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    start.flush({
      bookingReference: 'SC-2026-ABCDEF123456',
      bookingStatus: 'PENDING_PROVIDER_MATCH',
      outcome: 'OFFER_CREATED',
      assignmentId: 'assignment-id',
      assignmentStatus: 'OFFERED',
      offerExpiresAt: null,
    });

    api.confirmAssignment('assignment-id').subscribe();
    const confirm = http.expectOne(
      'http://api.example.test/api/v1/admin/provider-assignments/assignment-id/confirm',
    );
    expect(confirm.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    confirm.flush({ ...assignment(), status: 'CONFIRMED' });

    api.expireStaleOffers().subscribe();
    const expire = http.expectOne(
      'http://api.example.test/api/v1/admin/provider-assignments/expire-stale',
    );
    expect(expire.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    expire.flush({ expiredCount: 0, nextOffers: [] });
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
      api: TestBed.inject(AdminProviderAssignmentsApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});

function assignment() {
  return {
    assignmentId: 'assignment-id',
    status: 'ACCEPTED',
    offeredAt: '2026-08-24T08:00:00Z',
    expiresAt: '2026-08-24T08:30:00Z',
    respondedAt: '2026-08-24T08:10:00Z',
    acceptedAt: '2026-08-24T08:10:00Z',
    confirmedAt: null,
    bookingReference: 'SC-2026-ABCDEF123456',
    bookingStatus: 'PENDING_PROVIDER_MATCH',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    provider: { id: 'provider-id', displayName: 'Care Provider' },
    preferredDate: '2026-08-24',
    preferredTimeWindowStart: '09:00',
    preferredTimeWindowEnd: '11:00',
    preferredTimezone: 'Africa/Lagos',
    declineReason: null,
  };
}
