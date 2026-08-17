import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { PublicBookingRequest, PublicBookingResponse } from '../models/public-booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  createPublicBooking(request: PublicBookingRequest): Observable<PublicBookingResponse> {
    return this.http.post<PublicBookingResponse>(
      `${this.apiConfig.baseUrl}/public/bookings`,
      request,
    );
  }
}
