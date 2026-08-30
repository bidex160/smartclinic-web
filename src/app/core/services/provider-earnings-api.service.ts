import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { AdminProviderEarning, AdminProviderEarningFilters, ProviderEarning, ProviderEarningCurrencySummary, ProviderEarningFilters, ProviderEarningPage } from '../models/provider-earning.model';
@Injectable({ providedIn: 'root' })
export class ProviderEarningsApiService {
  private readonly http = inject(HttpClient); private readonly root = inject(API_CONFIG).baseUrl;
  getProviderSummary() { return this.http.get<readonly ProviderEarningCurrencySummary[]>(`${this.root}/provider/earnings/summary`); }
  getProviderEarnings(filters: ProviderEarningFilters = {}) { return this.http.get<ProviderEarningPage>(`${this.root}/provider/earnings`, { params: this.params(filters) }); }
  getProviderEarning(reference: string) { return this.http.get<ProviderEarning>(`${this.root}/provider/earnings/${encodeURIComponent(reference)}`); }
  getAdminSummary(providerReference?: string) { return this.http.get<readonly ProviderEarningCurrencySummary[]>(`${this.root}/admin/provider-earnings/summary`, { params: this.params({ providerReference }) }); }
  getAdminEarnings(filters: AdminProviderEarningFilters = {}) { return this.http.get<ProviderEarningPage<AdminProviderEarning>>(`${this.root}/admin/provider-earnings`, { params: this.params(filters) }); }
  getAdminEarning(reference: string) { return this.http.get<AdminProviderEarning>(`${this.root}/admin/provider-earnings/${encodeURIComponent(reference)}`); }
  private params(filters: object): HttpParams { let params = new HttpParams(); for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value)); return params; }
}
