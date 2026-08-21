import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AdminBookingDetail } from '../models/admin-booking-detail.model';
import {
  AdminProviderCapability,
  AdminProviderLocation,
  ScheduleBookingRequest,
  ScheduleBookingResponse,
} from '../models/booking-schedule.model';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class AdminBookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/bookings`;
  private readonly apiBase = inject(API_CONFIG).baseUrl;
  private readonly mutationContext = new HttpContext().set(SKIP_AUTH_RETRY, true);

  getBooking(reference: string): Observable<AdminBookingDetail> {
    return this.http.get<AdminBookingDetail>(`${this.endpoint}/${encodeURIComponent(reference)}`);
  }

  schedule(
    reference: string,
    request: ScheduleBookingRequest,
  ): Observable<ScheduleBookingResponse> {
    return this.http.post<ScheduleBookingResponse>(
      `${this.endpoint}/${encodeURIComponent(reference)}/schedule`,
      request,
      { context: this.mutationContext },
    );
  }

  getProviderCapabilities(providerId: string): Observable<AdminProviderCapability[]> {
    return this.http.get<AdminProviderCapability[]>(
      `${this.apiBase}/admin/providers/${encodeURIComponent(providerId)}/services`,
    );
  }

  getProviderLocations(providerId: string): Observable<AdminProviderLocation[]> {
    return this.http.get<AdminProviderLocation[]>(
      `${this.apiBase}/admin/providers/${encodeURIComponent(providerId)}/locations`,
    );
  }
}
