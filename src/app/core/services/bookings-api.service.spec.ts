import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import {
  PublicBookingFundingResult,
  PublicBookingRequest,
  PublicBookingResponse,
} from '../models/public-booking.model';
import { BookingsApiService } from './bookings-api.service';

describe('BookingsApiService', () => {
  it('posts the typed request once to the public booking endpoint', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    const service = TestBed.inject(BookingsApiService);
    const httpTesting = TestBed.inject(HttpTestingController);
    const request: PublicBookingRequest = {
      booker: { givenName: 'Ada', familyName: 'Okafor', phone: '+2348012345678' },
      participant: { relationship: 'SELF', givenName: 'Ada', familyName: 'Okafor' },
      booking: { healthCheckPackageId: 'package-id', fulfilmentModeId: 'mode-id' },
    };
    const response = { bookingReference: 'SC-REF' } as PublicBookingResponse;

    service.createPublicBooking(request).subscribe((result) => expect(result).toBe(response));

    const pending = httpTesting.expectOne('http://api.example.test/api/v1/public/bookings');
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    expect(pending.request.withCredentials).toBe(true);
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    pending.flush(response);
    httpTesting.verify();
  });

  it('securely retrieves only the referenced booking with browser credentials', () => {
    const { service, httpTesting } = setup();
    const response = { bookingReference: 'SC/REF' } as PublicBookingResponse;

    service.getPublicBooking('SC/REF').subscribe((result) => expect(result).toBe(response));

    const pending = httpTesting.expectOne(
      'http://api.example.test/api/v1/public/bookings/SC%2FREF',
    );
    expect(pending.request.method).toBe('GET');
    expect(pending.request.withCredentials).toBe(true);
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    pending.flush(response);
    httpTesting.verify();
  });

  it('initializes funding with credentials and no client amount or currency', () => {
    const { service, httpTesting } = setup();
    const response: PublicBookingFundingResult = {
      bookingReference: 'SC-REF',
      fundingStatus: 'PENDING',
      attemptId: null,
      attemptStatus: null,
      amount: '12500.00',
      currency: 'NGN',
      paymentReference: null,
    };

    service.initializeFunding('SC-REF').subscribe((result) => expect(result).toBe(response));

    const pending = httpTesting.expectOne(
      'http://api.example.test/api/v1/public/bookings/SC-REF/funding/initialize',
    );
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toBeNull();
    expect(pending.request.withCredentials).toBe(true);
    expect(pending.request.context.get(SKIP_STAFF_AUTH)).toBe(true);
    expect(pending.request.body).not.toEqual(
      expect.objectContaining({ amount: expect.anything(), currency: expect.anything() }),
    );
    pending.flush(response);
    httpTesting.verify();
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
      service: TestBed.inject(BookingsApiService),
      httpTesting: TestBed.inject(HttpTestingController),
    };
  }
});
