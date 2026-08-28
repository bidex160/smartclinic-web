import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  CareAppointment,
  CareAppointmentPage,
  CareAppointmentStatus,
  CareRequest,
  CareRequestPage,
  FastTrackRequest,
  FastTrackRequestPage,
  ProviderLocationOption,
  ScheduleCareAppointmentRequest,
} from '../models/find-care.model';

@Injectable({ providedIn: 'root' })
export class ProviderCareOperationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  getCareRequests(page = 1, limit = 20): Observable<CareRequestPage> {
    return this.http.get<CareRequestPage>(`${this.base}/provider/care-requests`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  getCareRequest(reference: string): Observable<CareRequest> {
    return this.http.get<CareRequest>(
      `${this.base}/provider/care-requests/${encodeURIComponent(reference)}`,
    );
  }
  acceptCareRequest(reference: string): Observable<CareRequest> {
    return this.http.post<CareRequest>(
      `${this.base}/provider/care-requests/${encodeURIComponent(reference)}/accept`,
      null,
    );
  }
  declineCareRequest(reference: string, reason: string): Observable<CareRequest> {
    return this.http.post<CareRequest>(
      `${this.base}/provider/care-requests/${encodeURIComponent(reference)}/decline`,
      { reason },
    );
  }
  getFastTrackRequests(page = 1, limit = 20): Observable<FastTrackRequestPage> {
    return this.http.get<FastTrackRequestPage>(`${this.base}/provider/fasttrack-requests`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  getFastTrackRequest(reference: string): Observable<FastTrackRequest> {
    return this.http.get<FastTrackRequest>(
      `${this.base}/provider/fasttrack-requests/${encodeURIComponent(reference)}`,
    );
  }
  verifyFastTrack(reference: string): Observable<FastTrackRequest> {
    return this.http.post<FastTrackRequest>(
      `${this.base}/provider/fasttrack-requests/${encodeURIComponent(reference)}/verify`,
      null,
    );
  }
  rejectFastTrack(reference: string, reason: string): Observable<FastTrackRequest> {
    return this.http.post<FastTrackRequest>(
      `${this.base}/provider/fasttrack-requests/${encodeURIComponent(reference)}/reject`,
      { reason },
    );
  }
  getLocations(): Observable<readonly ProviderLocationOption[]> {
    return this.http.get<readonly ProviderLocationOption[]>(`${this.base}/provider/locations`);
  }
  scheduleCareRequest(
    reference: string,
    request: ScheduleCareAppointmentRequest,
  ): Observable<CareAppointment> {
    return this.http.post<CareAppointment>(
      `${this.base}/provider/care-requests/${encodeURIComponent(reference)}/schedule`,
      request,
    );
  }
  getAppointments(
    page = 1,
    limit = 20,
    status?: CareAppointmentStatus,
  ): Observable<CareAppointmentPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<CareAppointmentPage>(`${this.base}/provider/care-appointments`, {
      params,
    });
  }
  getAppointment(reference: string): Observable<CareAppointment> {
    return this.http.get<CareAppointment>(
      `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}`,
    );
  }
  startAppointment(reference: string): Observable<CareAppointment> {
    return this.command(reference, 'start');
  }
  completeAppointment(reference: string): Observable<CareAppointment> {
    return this.command(reference, 'complete');
  }
  cancelAppointment(reference: string, reason: string): Observable<CareAppointment> {
    return this.reasonCommand(reference, 'cancel', reason);
  }
  markNoShow(reference: string, reason: string): Observable<CareAppointment> {
    return this.reasonCommand(reference, 'no-show', reason);
  }
  updateMeetingLink(reference: string, meetingUrl: string | null): Observable<CareAppointment> {
    return this.http.put<CareAppointment>(
      `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}/meeting-link`,
      { meetingUrl },
    );
  }
  private command(reference: string, action: string): Observable<CareAppointment> {
    return this.http.post<CareAppointment>(
      `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}/${action}`,
      null,
    );
  }
  private reasonCommand(
    reference: string,
    action: string,
    reason: string,
  ): Observable<CareAppointment> {
    return this.http.post<CareAppointment>(
      `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}/${action}`,
      { reason },
    );
  }
}
