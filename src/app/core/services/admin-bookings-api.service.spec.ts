import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { AdminBookingsApiService } from './admin-bookings-api.service';

describe('AdminBookingsApiService', () => {
  it('gets the typed operational booking projection using an encoded reference', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    const api = TestBed.inject(AdminBookingsApiService);
    const http = TestBed.inject(HttpTestingController);

    api.getBooking('SC/2026 TEST').subscribe((result) => {
      expect(result.bookingReference).toBe('SC-2026-ABCDEF123456');
      expect(result.bookerContact.phone).toBeNull();
      expect(result.assignment.providerName).toBe('Care Provider');
    });
    const request = http.expectOne(
      'http://api.example.test/api/v1/admin/bookings/SC%2F2026%20TEST',
    );
    expect(request.request.method).toBe('GET');
    request.flush(booking());
    http.verify();
  });
});

function booking() {
  return {
    bookingReference: 'SC-2026-ABCDEF123456',
    status: 'PROVIDER_ASSIGNED',
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    bookerContact: { givenName: null, familyName: null, email: 'booker@example.test', phone: null },
    preferredDate: '2026-09-01',
    preferredTimeFrom: '09:00',
    preferredTimeTo: '11:00',
    preferredTimezone: 'Africa/Lagos',
    locationNote: null,
    quotedAmount: '12500.00',
    quotedCurrency: 'NGN',
    funding: { fundingStatus: 'SETTLED', fundingType: 'SELF', amount: '12500.00', currency: 'NGN' },
    payment: {
      status: 'SUCCEEDED',
      paymentReference: 'safe-reference',
      paidAt: '2026-08-18T08:30:00Z',
    },
    assignment: {
      assignmentId: 'assignment-id',
      assignmentStatus: 'CONFIRMED',
      providerName: 'Care Provider',
      offeredAt: null,
      acceptedAt: null,
      confirmedAt: '2026-08-18T09:00:00Z',
      expiresAt: null,
    },
    readiness: 'ALREADY_ASSIGNED',
  };
}
