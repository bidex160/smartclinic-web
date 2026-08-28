import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  CareAppointment,
  CareAppointmentPage,
  CareAppointmentStatus,
} from '../models/find-care.model';
@Injectable({ providedIn: 'root' })
export class CareAppointmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  list(page = 1, limit = 20, status?: CareAppointmentStatus): Observable<CareAppointmentPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<CareAppointmentPage>(`${this.base}/me/care-appointments`, { params });
  }
  get(reference: string): Observable<CareAppointment> {
    return this.http.get<CareAppointment>(
      `${this.base}/me/care-appointments/${encodeURIComponent(reference)}`,
    );
  }
  cancel(reference: string, reason: string): Observable<CareAppointment> {
    return this.http.post<CareAppointment>(
      `${this.base}/me/care-appointments/${encodeURIComponent(reference)}/cancel`,
      { reason },
    );
  }
}
