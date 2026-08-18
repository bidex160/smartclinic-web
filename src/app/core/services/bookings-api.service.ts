import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import {
  PublicBookingFundingResult,
  PublicBookingPaymentInitiationResult,
  PublicBookingRequest,
  PublicBookingResponse,
} from '../models/public-booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly publicBookingContext = new HttpContext().set(SKIP_STAFF_AUTH, true);

  createPublicBooking(request: PublicBookingRequest): Observable<PublicBookingResponse> {
    return this.http.post<PublicBookingResponse>(
      `${this.apiConfig.baseUrl}/public/bookings`,
      request,
      { withCredentials: true, context: this.publicBookingContext },
    );
  }

  getPublicBooking(reference: string): Observable<PublicBookingResponse> {
    return this.http.get<PublicBookingResponse>(
      `${this.apiConfig.baseUrl}/public/bookings/${encodeURIComponent(reference)}`,
      { withCredentials: true, context: this.publicBookingContext },
    );
  }

  initializeFunding(reference: string): Observable<PublicBookingFundingResult> {
    return this.http.post<PublicBookingFundingResult>(
      `${this.apiConfig.baseUrl}/public/bookings/${encodeURIComponent(reference)}/funding/initialize`,
      null,
      { withCredentials: true, context: this.publicBookingContext },
    );
  }

  initiatePayment(reference: string): Observable<PublicBookingPaymentInitiationResult> {
    return this.http.post<PublicBookingPaymentInitiationResult>(
      `${this.apiConfig.baseUrl}/public/bookings/${encodeURIComponent(reference)}/payment/initiate`,
      null,
      { withCredentials: true, context: this.publicBookingContext },
    );
  }
}
