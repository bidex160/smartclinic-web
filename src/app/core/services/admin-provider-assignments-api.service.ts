import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  AdminProviderAssignment,
  AdminProviderAssignmentFilters,
  ExpireStaleOffersResult,
  ManualProviderAssignmentRequest,
  MatchingResult,
  OverrideProviderAssignmentRequest,
  ReassignProviderRequest,
} from '../models/admin-provider-assignment.model';

@Injectable({ providedIn: 'root' })
export class AdminProviderAssignmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly assignmentsEndpoint = `${this.apiConfig.baseUrl}/admin/provider-assignments`;
  private readonly noReplay = { context: new HttpContext().set(SKIP_AUTH_RETRY, true) };

  getAssignments(
    filters: AdminProviderAssignmentFilters = {},
  ): Observable<AdminProviderAssignment[]> {
    let params = new HttpParams();
    if (filters.bookingReference) params = params.set('bookingReference', filters.bookingReference);
    if (filters.providerId) params = params.set('providerId', filters.providerId);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<AdminProviderAssignment[]>(this.assignmentsEndpoint, { params });
  }

  getAssignment(id: string): Observable<AdminProviderAssignment> {
    return this.http.get<AdminProviderAssignment>(
      `${this.assignmentsEndpoint}/${encodeURIComponent(id)}`,
    );
  }

  startMatching(bookingReference: string): Observable<MatchingResult> {
    return this.http.post<MatchingResult>(
      `${this.apiConfig.baseUrl}/admin/bookings/${encodeURIComponent(bookingReference)}/matching/start`,
      null,
      this.noReplay,
    );
  }

  retryMatching(bookingReference: string): Observable<MatchingResult> {
    return this.http.post<MatchingResult>(
      `${this.apiConfig.baseUrl}/admin/bookings/${encodeURIComponent(bookingReference)}/matching/retry`,
      null,
      this.noReplay,
    );
  }

  assignProvider(
    bookingReference: string,
    request: ManualProviderAssignmentRequest,
  ): Observable<MatchingResult> {
    return this.http.post<MatchingResult>(
      `${this.apiConfig.baseUrl}/admin/bookings/${encodeURIComponent(bookingReference)}/assign-provider`,
      request,
      this.noReplay,
    );
  }

  overrideProvider(
    bookingReference: string,
    request: OverrideProviderAssignmentRequest,
  ): Observable<MatchingResult> {
    return this.http.post<MatchingResult>(
      `${this.apiConfig.baseUrl}/admin/bookings/${encodeURIComponent(bookingReference)}/assign-provider/override`,
      request,
      this.noReplay,
    );
  }

  reassignProvider(
    bookingReference: string,
    request: ReassignProviderRequest,
  ): Observable<MatchingResult> {
    return this.http.post<MatchingResult>(
      `${this.apiConfig.baseUrl}/admin/bookings/${encodeURIComponent(bookingReference)}/reassign-provider`,
      request,
      this.noReplay,
    );
  }

  confirmAssignment(id: string): Observable<AdminProviderAssignment> {
    return this.http.post<AdminProviderAssignment>(
      `${this.assignmentsEndpoint}/${encodeURIComponent(id)}/confirm`,
      null,
      this.noReplay,
    );
  }

  expireStaleOffers(): Observable<ExpireStaleOffersResult> {
    return this.http.post<ExpireStaleOffersResult>(
      `${this.assignmentsEndpoint}/expire-stale`,
      null,
      this.noReplay,
    );
  }
}
