import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { AdminMatchingQueueResponse } from '../models/admin-matching-queue.model';
import { AdminMatchingQueueApiService } from './admin-matching-queue-api.service';

describe('AdminMatchingQueueApiService', () => {
  it('maps every supported queue filter to the authenticated API request', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    const api = TestBed.inject(AdminMatchingQueueApiService);
    const http = TestBed.inject(HttpTestingController);
    const response: AdminMatchingQueueResponse = {
      items: [],
      page: 2,
      limit: 10,
      total: 14,
      totalPages: 2,
    };
    let result: AdminMatchingQueueResponse | undefined;

    api
      .getQueue({
        bookingStatus: 'UNFULFILLABLE',
        packageId: 'package-id',
        fulfilmentModeId: 'mode-id',
        preferredDate: '2026-09-01',
        providerAssignmentStatus: 'EXPIRED',
        bookingReference: 'SC-2026-ABCDEF123456',
        page: 2,
        limit: 10,
      })
      .subscribe((value) => (result = value));

    const request = http.expectOne(
      (candidate) =>
        candidate.url === 'http://api.example.test/api/v1/admin/bookings/matching-queue' &&
        candidate.params.get('bookingStatus') === 'UNFULFILLABLE' &&
        candidate.params.get('packageId') === 'package-id' &&
        candidate.params.get('fulfilmentModeId') === 'mode-id' &&
        candidate.params.get('preferredDate') === '2026-09-01' &&
        candidate.params.get('providerAssignmentStatus') === 'EXPIRED' &&
        candidate.params.get('bookingReference') === 'SC-2026-ABCDEF123456' &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '10',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(result).toEqual(response);
    http.verify();
  });

  it('leaves backend default filters absent while sending pagination', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    const api = TestBed.inject(AdminMatchingQueueApiService);
    const http = TestBed.inject(HttpTestingController);
    api.getQueue({ page: 1, limit: 25 }).subscribe();
    const request = http.expectOne(
      'http://api.example.test/api/v1/admin/bookings/matching-queue?page=1&limit=25',
    );
    expect(request.request.params.has('bookingStatus')).toBe(false);
    request.flush({ items: [], page: 1, limit: 25, total: 0, totalPages: 0 });
    http.verify();
  });
});
