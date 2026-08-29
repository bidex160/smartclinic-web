import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  ClinicalRecord,
  ClinicalRecordPage,
  CreateClinicalRecordRequest,
  UpdateClinicalRecordRequest,
} from '../models/clinical-record.model';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  getForProviderAppointment(appointmentReference: string) {
    return this.http.get<ClinicalRecord>(this.providerEndpoint(appointmentReference));
  }

  createForProviderAppointment(appointmentReference: string, body: CreateClinicalRecordRequest) {
    return this.http.post<ClinicalRecord>(this.providerEndpoint(appointmentReference), body);
  }

  updateForProviderAppointment(appointmentReference: string, body: UpdateClinicalRecordRequest) {
    return this.http.patch<ClinicalRecord>(this.providerEndpoint(appointmentReference), body);
  }

  finalizeForProviderAppointment(appointmentReference: string) {
    return this.http.post<ClinicalRecord>(`${this.providerEndpoint(appointmentReference)}/finalize`, null);
  }

  listMine(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordPage>(`${this.base}/me/clinical-records`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }

  getMine(reference: string) {
    return this.http.get<ClinicalRecord>(
      `${this.base}/me/clinical-records/${encodeURIComponent(reference)}`,
    );
  }

  private providerEndpoint(reference: string) {
    return `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}/clinical-record`;
  }
}
