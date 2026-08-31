import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { HealthPassportOverview, HealthPassportTimeline } from '../models/health-passport.model';
@Injectable({ providedIn: 'root' })
export class HealthPassportApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  overview() {
    return this.http.get<HealthPassportOverview>(`${this.base}/me/health-passport`);
  }
  timeline(page = 1, limit = 20) {
    return this.http.get<HealthPassportTimeline>(`${this.base}/me/health-passport/timeline`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
}
