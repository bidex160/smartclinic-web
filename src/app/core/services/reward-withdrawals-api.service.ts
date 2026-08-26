import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { AdminRewardWithdrawal, AdminRewardWithdrawalDetail, AdminRewardWithdrawalFilters, CreateRewardWithdrawalRequest, RewardWithdrawal, RewardWithdrawalPage } from '../models/reward-withdrawal.model';

@Injectable({ providedIn: 'root' })
export class RewardWithdrawalsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  listMine(page = 1, limit = 20): Observable<RewardWithdrawalPage> { return this.http.get<RewardWithdrawalPage>(`${this.base}/me/rewards/withdrawals`, { params: new HttpParams().set('page', page).set('limit', limit) }); }
  getMine(reference: string): Observable<RewardWithdrawal> { return this.http.get<RewardWithdrawal>(`${this.base}/me/rewards/withdrawals/${encodeURIComponent(reference)}`); }
  create(request: CreateRewardWithdrawalRequest): Observable<RewardWithdrawal> { return this.http.post<RewardWithdrawal>(`${this.base}/me/rewards/withdrawals`, request); }
  cancelMine(reference: string): Observable<RewardWithdrawal> { return this.http.post<RewardWithdrawal>(`${this.base}/me/rewards/withdrawals/${encodeURIComponent(reference)}/cancel`, {}); }

  adminList(filters: AdminRewardWithdrawalFilters): Observable<RewardWithdrawalPage<AdminRewardWithdrawal>> {
    let params = new HttpParams().set('page', filters.page).set('limit', filters.limit);
    for (const key of ['status', 'userEmail', 'reference', 'requestedFrom', 'requestedTo'] as const) if (filters[key]) params = params.set(key, filters[key]!);
    return this.http.get<RewardWithdrawalPage<AdminRewardWithdrawal>>(`${this.base}/admin/reward-withdrawals`, { params });
  }
  adminDetail(reference: string): Observable<AdminRewardWithdrawalDetail> { return this.http.get<AdminRewardWithdrawalDetail>(`${this.base}/admin/reward-withdrawals/${encodeURIComponent(reference)}`); }
  markProcessing(reference: string): Observable<AdminRewardWithdrawal> { return this.http.post<AdminRewardWithdrawal>(`${this.base}/admin/reward-withdrawals/${encodeURIComponent(reference)}/processing`, {}); }
  markPaid(reference: string, externalReference: string, adminNote?: string): Observable<AdminRewardWithdrawal> { return this.http.post<AdminRewardWithdrawal>(`${this.base}/admin/reward-withdrawals/${encodeURIComponent(reference)}/paid`, { externalReference, ...(adminNote ? { adminNote } : {}) }); }
  markFailed(reference: string, reason: string): Observable<AdminRewardWithdrawal> { return this.http.post<AdminRewardWithdrawal>(`${this.base}/admin/reward-withdrawals/${encodeURIComponent(reference)}/failed`, { reason }); }
  adminCancel(reference: string, reason: string): Observable<AdminRewardWithdrawal> { return this.http.post<AdminRewardWithdrawal>(`${this.base}/admin/reward-withdrawals/${encodeURIComponent(reference)}/cancel`, { reason }); }
}
