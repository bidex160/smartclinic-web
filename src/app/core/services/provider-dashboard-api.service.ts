import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { ProviderDashboardSummary } from '../models/dashboard-summary.model';

@Injectable({ providedIn: 'root' })
export class ProviderDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/provider/dashboard/summary`;

  getSummary(): Observable<ProviderDashboardSummary> {
    return this.http.get<ProviderDashboardSummary>(this.endpoint);
  }
}
