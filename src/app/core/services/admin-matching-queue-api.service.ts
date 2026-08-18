import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import {
  AdminMatchingQueueFilters,
  AdminMatchingQueueResponse,
} from '../models/admin-matching-queue.model';

@Injectable({ providedIn: 'root' })
export class AdminMatchingQueueApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/bookings/matching-queue`;

  getQueue(filters: AdminMatchingQueueFilters): Observable<AdminMatchingQueueResponse> {
    let params = new HttpParams().set('page', filters.page).set('limit', filters.limit);
    if (filters.bookingStatus) params = params.set('bookingStatus', filters.bookingStatus);
    if (filters.packageId) params = params.set('packageId', filters.packageId);
    if (filters.fulfilmentModeId) {
      params = params.set('fulfilmentModeId', filters.fulfilmentModeId);
    }
    if (filters.preferredDate) params = params.set('preferredDate', filters.preferredDate);
    if (filters.providerAssignmentStatus) {
      params = params.set('providerAssignmentStatus', filters.providerAssignmentStatus);
    }
    if (filters.bookingReference) {
      params = params.set('bookingReference', filters.bookingReference);
    }
    return this.http.get<AdminMatchingQueueResponse>(this.endpoint, { params });
  }
}
