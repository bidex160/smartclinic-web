import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  PatientDashboard,
  PatientPortalProfile,
  UpdatePatientPortalProfileRequest,
} from '../models/patient-dashboard.model';

@Injectable({ providedIn: 'root' })
export class PatientDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  getDashboard() {
    return this.http.get<PatientDashboard>(`${this.base}/me/dashboard`);
  }

  getProfile() {
    return this.http.get<PatientPortalProfile>(`${this.base}/me/profile`);
  }

  updateProfile(request: UpdatePatientPortalProfileRequest) {
    return this.http.patch<PatientPortalProfile>(`${this.base}/me/profile`, request);
  }
}
