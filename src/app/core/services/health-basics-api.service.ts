import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { PatientHealthBasics, UpdatePatientHealthBasicsRequest } from '../models/health-basics.model';

@Injectable({ providedIn: 'root' })
export class HealthBasicsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  get() {
    return this.http.get<PatientHealthBasics>(`${this.base}/me/health-basics`);
  }

  update(request: UpdatePatientHealthBasicsRequest) {
    return this.http.put<PatientHealthBasics>(`${this.base}/me/health-basics`, request);
  }
}
