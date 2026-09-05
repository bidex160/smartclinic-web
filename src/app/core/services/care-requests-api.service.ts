import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { CareRequest, CareRequestFunding, CareRequestPage, CreateCareRequest } from '../models/find-care.model';
@Injectable({ providedIn: 'root' })
export class CareRequestsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  create(request: CreateCareRequest): Observable<CareRequest> {
    return this.http.post<CareRequest>(`${this.base}/me/care-requests`, request);
  }
  list(page = 1, limit = 20): Observable<CareRequestPage> {
    return this.http.get<CareRequestPage>(`${this.base}/me/care-requests`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  get(reference: string): Observable<CareRequest> {
    return this.http.get<CareRequest>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}`,
    );
  }
  cancel(reference: string): Observable<CareRequest> {
    return this.http.post<CareRequest>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}/cancel`,
      null,
    );
  }
  getFunding(reference: string): Observable<CareRequestFunding> {
    return this.http.get<CareRequestFunding>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}/funding`,
    );
  }
  initializeFunding(reference: string, request?: import('../models/payment-email.model').PaymentEmailRequest): Observable<CareRequestFunding> {
    return this.http.post<CareRequestFunding>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}/funding/initialize`,
      request ?? null,
    );
  }
  verifyLatestFunding(reference: string): Observable<CareRequestFunding> {
    return this.http.post<CareRequestFunding>(
      `${this.base}/me/care-requests/${encodeURIComponent(reference)}/funding/verify-latest`,
      null,
    );
  }
}
