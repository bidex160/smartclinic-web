import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AdminDashboardSummary } from '../models/dashboard-summary.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_CONFIG).baseUrl}/admin/dashboard/summary`;

  getSummary(): Observable<AdminDashboardSummary> {
    return this.http.get<AdminDashboardSummary>(this.endpoint);
  }
}
