import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  CreateExternalFastTrack,
  FastTrackPaymentStatus,
  FastTrackRequest,
  FastTrackRequestPage,
} from '../models/find-care.model';
@Injectable({ providedIn: 'root' })
export class FastTrackApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  createForCareRequest(reference: string): Observable<FastTrackRequest> {
    return this.http.post<FastTrackRequest>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}/fasttrack`,
      null,
    );
  }
  createExternal(request: CreateExternalFastTrack): Observable<FastTrackRequest> {
    return this.http.post<FastTrackRequest>(`${this.base}/me/fasttrack-requests/external`, request);
  }
  list(page = 1, limit = 20): Observable<FastTrackRequestPage> {
    return this.http.get<FastTrackRequestPage>(`${this.base}/me/fasttrack-requests`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  get(reference: string): Observable<FastTrackRequest> {
    return this.http.get<FastTrackRequest>(
      `${this.base}/me/fasttrack-requests/${encodeURIComponent(reference)}`,
    );
  }
  initializePayment(reference: string): Observable<FastTrackPaymentStatus> {
    return this.http.post<FastTrackPaymentStatus>(
      `${this.base}/me/fasttrack-requests/${encodeURIComponent(reference)}/funding/initialize`,
      null,
    );
  }
  getPayment(reference: string): Observable<FastTrackPaymentStatus> {
    return this.http.get<FastTrackPaymentStatus>(
      `${this.base}/me/fasttrack-requests/${encodeURIComponent(reference)}/funding`,
    );
  }
  verifyPayment(reference: string): Observable<FastTrackPaymentStatus> {
    return this.http.post<FastTrackPaymentStatus>(
      `${this.base}/me/fasttrack-requests/${encodeURIComponent(reference)}/funding/verify`,
      null,
    );
  }
}
