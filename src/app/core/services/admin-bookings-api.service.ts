import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AdminBookingDetail } from '../models/admin-booking-detail.model';

@Injectable({ providedIn: 'root' })
export class AdminBookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/bookings`;

  getBooking(reference: string): Observable<AdminBookingDetail> {
    return this.http.get<AdminBookingDetail>(`${this.endpoint}/${encodeURIComponent(reference)}`);
  }
}
