import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  PatientDashboard,
  CreatePatientDailyRoutineRequest,
  DailyCareProgress,
  PatientDailyRoutine,
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

  getDailyRoutines() {
    return this.http.get<{ items: PatientDailyRoutine[] }>(`${this.base}/me/daily-care/routines`);
  }

  createDailyRoutine(request: CreatePatientDailyRoutineRequest) {
    return this.http.post<PatientDailyRoutine>(`${this.base}/me/daily-care/routines`, request);
  }

  updateDailyRoutine(reference: string, request: { enabled: boolean }) {
    return this.http.patch<PatientDailyRoutine>(`${this.base}/me/daily-care/routines/${encodeURIComponent(reference)}`, request);
  }

  deleteDailyRoutine(reference: string) {
    return this.http.delete<void>(`${this.base}/me/daily-care/routines/${encodeURIComponent(reference)}`);
  }

  completeRoutineToday(reference: string) {
    return this.http.put<DailyCareProgress>(
      `${this.base}/me/daily-care/routines/${encodeURIComponent(reference)}/completions/today`,
      null,
    );
  }

  undoRoutineToday(reference: string) {
    return this.http.delete<DailyCareProgress>(
      `${this.base}/me/daily-care/routines/${encodeURIComponent(reference)}/completions/today`,
    );
  }
}
