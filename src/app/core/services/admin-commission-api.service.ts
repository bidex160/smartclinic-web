import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { PlatformCommissionResponse, ProviderCommissionResponse, SetCommissionRateRequest } from '../models/admin-commission.model';

@Injectable({ providedIn: 'root' })
export class AdminCommissionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  getPlatform(): Observable<PlatformCommissionResponse> {
    return this.http.get<PlatformCommissionResponse>(`${this.base}/admin/commercial-settings/provider-commission`);
  }
  setPlatform(request: SetCommissionRateRequest): Observable<PlatformCommissionResponse> {
    return this.http.patch<PlatformCommissionResponse>(`${this.base}/admin/commercial-settings/provider-commission`, request);
  }
  getProvider(providerId: string): Observable<ProviderCommissionResponse> {
    return this.http.get<ProviderCommissionResponse>(`${this.providerEndpoint(providerId)}/commission`);
  }
  setProvider(providerId: string, request: SetCommissionRateRequest): Observable<ProviderCommissionResponse> {
    return this.http.patch<ProviderCommissionResponse>(`${this.providerEndpoint(providerId)}/commission`, request);
  }
  clearProvider(providerId: string): Observable<ProviderCommissionResponse> {
    return this.http.delete<ProviderCommissionResponse>(`${this.providerEndpoint(providerId)}/commission`);
  }
  private providerEndpoint(providerId: string): string {
    return `${this.base}/admin/providers/${encodeURIComponent(providerId)}`;
  }
}
