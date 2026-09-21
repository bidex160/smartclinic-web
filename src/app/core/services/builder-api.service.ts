import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { BuilderDashboard } from '../models/builder-dashboard.model';

@Injectable({ providedIn: 'root' })
export class BuilderApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  getDashboard(): Observable<BuilderDashboard> {
    return this.http.get<BuilderDashboard>(`${this.base}/me/builder/dashboard`);
  }
}
