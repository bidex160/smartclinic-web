import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { ReferralHistoryFilters, ReferralHistoryResponse, ReferralSummary } from '../models/referral.model';
@Injectable({ providedIn: 'root' })
export class ReferralsApiService {
  private readonly http = inject(HttpClient); private readonly base = inject(API_CONFIG).baseUrl;
  summary(): Observable<ReferralSummary> { return this.http.get<ReferralSummary>(`${this.base}/me/referrals`); }
  history(filters: ReferralHistoryFilters): Observable<ReferralHistoryResponse> { return this.http.get<ReferralHistoryResponse>(`${this.base}/me/referrals/history`, { params: this.params(filters) }); }
  adminHistory(filters: ReferralHistoryFilters): Observable<ReferralHistoryResponse> { return this.http.get<ReferralHistoryResponse>(`${this.base}/admin/referrals`, { params: this.params(filters) }); }
  private params(filters: ReferralHistoryFilters): HttpParams { let p = new HttpParams().set('page', filters.page).set('limit', filters.limit); for (const key of ['targetType','status','referrerEmail','qualifiedFrom','qualifiedTo'] as const) if (filters[key]) p = p.set(key, filters[key]!); return p; }
}
