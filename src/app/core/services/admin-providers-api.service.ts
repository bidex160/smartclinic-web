import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  AdminProviderDetail,
  AdminProviderFilters,
  AdminProviderListResponse,
  AdminCreatedProviderResponse,
  CreateAdminProviderRequest,
  RejectProviderRequest,
  UpdateAdminProviderRequest,
} from '../models/admin-provider.model';

@Injectable({ providedIn: 'root' })
export class AdminProvidersApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/providers`;
  private readonly mutationContext = new HttpContext().set(SKIP_AUTH_RETRY, true);

  list(filters: AdminProviderFilters = {}): Observable<AdminProviderListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.onboardingStatus) params = params.set('onboardingStatus', filters.onboardingStatus);
    if (filters.linkedUserId) params = params.set('linkedUserId', filters.linkedUserId);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    return this.http.get<AdminProviderListResponse>(this.endpoint, { params });
  }

  get(id: string): Observable<AdminProviderDetail> {
    return this.http.get<AdminProviderDetail>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }

  create(request: CreateAdminProviderRequest): Observable<AdminCreatedProviderResponse> {
    return this.http.post<AdminCreatedProviderResponse>(this.endpoint, request, {
      context: this.mutationContext,
    });
  }

  update(id: string, request: UpdateAdminProviderRequest): Observable<AdminProviderDetail> {
    return this.http.patch<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}`,
      request,
      { context: this.mutationContext },
    );
  }

  activate(id: string): Observable<AdminProviderDetail> {
    return this.http.patch<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/activate`,
      {},
      { context: this.mutationContext },
    );
  }

  suspend(id: string): Observable<AdminProviderDetail> {
    return this.http.patch<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/suspend`,
      {},
      { context: this.mutationContext },
    );
  }

  approve(id: string): Observable<AdminProviderDetail> {
    return this.http.post<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/approve`,
      {},
      { context: this.mutationContext },
    );
  }

  reject(id: string, request: RejectProviderRequest): Observable<AdminProviderDetail> {
    return this.http.post<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/reject`,
      request,
      { context: this.mutationContext },
    );
  }

  linkUser(id: string, userId: string): Observable<AdminProviderDetail> {
    return this.http.post<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/link-user`,
      { userId },
      { context: this.mutationContext },
    );
  }

  unlinkUser(id: string): Observable<AdminProviderDetail> {
    return this.http.post<AdminProviderDetail>(
      `${this.endpoint}/${encodeURIComponent(id)}/unlink-user`,
      {},
      { context: this.mutationContext },
    );
  }
}
