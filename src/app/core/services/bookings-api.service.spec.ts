import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { PublicBookingRequest, PublicBookingResponse } from '../models/public-booking.model';
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
    pending.flush(response);
    httpTesting.verify();
  });
});
