import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { HealthCheckResult } from '../models/health-check-result.model';
import {
  PatientHealthCheckHistoryFilters,
  PatientHealthCheckDetail,
  PatientHealthCheckHistoryResponse,
  PatientPortalProfile,
  CreateSelfHealthCheckRequest,
} from '../models/patient-health-check-history.model';
import { PublicBookingResponse } from '../models/public-booking.model';

@Injectable({ providedIn: 'root' })
export class HealthCheckResultsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly guestContext = new HttpContext().set(SKIP_STAFF_AUTH, true);

  getOwnResult(bookingReference: string): Observable<HealthCheckResult> {
    return this.http.get<HealthCheckResult>(
      `${this.baseUrl}/me/health-checks/${encodeURIComponent(bookingReference)}/results`,
    );
  }

  getMyHealthChecks(
    filters: PatientHealthCheckHistoryFilters,
  ): Observable<PatientHealthCheckHistoryResponse> {
    let params = new HttpParams().set('page', filters.page).set('limit', filters.limit);
    if (filters.bookingStatus) params = params.set('bookingStatus', filters.bookingStatus);
    if (filters.encounterStatus) params = params.set('encounterStatus', filters.encounterStatus);
    return this.http.get<PatientHealthCheckHistoryResponse>(`${this.baseUrl}/me/health-checks`, {
      params,
    });
  }

  getMyProfile(): Observable<PatientPortalProfile> {
    return this.http.get<PatientPortalProfile>(`${this.baseUrl}/me/profile`);
  }

  getMyHealthCheck(reference: string): Observable<PatientHealthCheckDetail> {
    return this.http.get<PatientHealthCheckDetail>(
      `${this.baseUrl}/me/health-checks/${encodeURIComponent(reference)}`,
    );
  }

  createMyHealthCheck(request: CreateSelfHealthCheckRequest): Observable<PublicBookingResponse> {
    return this.http.post<PublicBookingResponse>(`${this.baseUrl}/me/health-checks`, request);
  }

  getGuestResult(token: string): Observable<HealthCheckResult> {
    return this.http.get<HealthCheckResult>(
      `${this.baseUrl}/public/health-results/${encodeURIComponent(token)}`,
      { context: this.guestContext, withCredentials: false },
    );
  }
}
