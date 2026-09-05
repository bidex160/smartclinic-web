import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  ClinicalRecord,
  ClinicalRecordAccessAudit,
  ClinicalRecordAccessGrant,
  ClinicalRecordAccessPage,
  ClinicalRecordAccessProvider,
  ClinicalRecordAccessRequest,
  ClinicalRecordAttachment,
  ClinicalRecordAttachmentAccess,
  ClinicalRecordPage,
  CreateClinicalRecordAccessGrantRequest,
  CreateClinicalRecordAccessRequest,
  CreateClinicalRecordRequest,
  UpdateClinicalRecordRequest,
  SharedClinicalRecord,
  SharedClinicalRecordSummary,
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

  uploadAttachment(recordReference: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ClinicalRecordAttachment>(this.providerAttachments(recordReference), formData);
  }

  deleteAttachment(recordReference: string, attachmentReference: string) {
    return this.http.delete<{ readonly deleted: true }>(
      `${this.providerAttachments(recordReference)}/${encodeURIComponent(attachmentReference)}`,
    );
  }

  getProviderAttachmentAccess(recordReference: string, attachmentReference: string) {
    return this.http.get<ClinicalRecordAttachmentAccess>(
      `${this.providerAttachments(recordReference)}/${encodeURIComponent(attachmentReference)}/access`,
    );
  }

  getPatientAttachmentAccess(recordReference: string, attachmentReference: string) {
    return this.http.get<ClinicalRecordAttachmentAccess>(
      `${this.base}/me/clinical-records/${encodeURIComponent(recordReference)}/attachments/${encodeURIComponent(attachmentReference)}/access`,
    );
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

  createAccessGrant(body: CreateClinicalRecordAccessGrantRequest) {
    return this.http.post<ClinicalRecordAccessGrant>(`${this.base}/me/clinical-record-access-grants`, body);
  }

  searchAccessProviders(q = '', page = 1, limit = 10) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<ClinicalRecordAccessPage<ClinicalRecordAccessProvider>>(`${this.base}/me/clinical-record-access-providers`, { params });
  }

  listAccessGrants(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordAccessPage<ClinicalRecordAccessGrant>>(`${this.base}/me/clinical-record-access-grants`, { params: new HttpParams().set('page', page).set('limit', limit) });
  }

  getAccessGrant(reference: string) {
    return this.http.get<ClinicalRecordAccessGrant>(`${this.base}/me/clinical-record-access-grants/${encodeURIComponent(reference)}`);
  }

  revokeAccessGrant(reference: string) {
    return this.http.post<ClinicalRecordAccessGrant>(`${this.base}/me/clinical-record-access-grants/${encodeURIComponent(reference)}/revoke`, null);
  }

  listAccessAudit(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordAccessPage<ClinicalRecordAccessAudit>>(`${this.base}/me/clinical-record-access-audit`, { params: new HttpParams().set('page', page).set('limit', limit) });
  }

  createProviderAccessRequest(body: CreateClinicalRecordAccessRequest) {
    return this.http.post<ClinicalRecordAccessRequest>(`${this.base}/provider/clinical-record-access-requests`, body);
  }

  listProviderAccessRequests(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordAccessPage<ClinicalRecordAccessRequest>>(`${this.base}/provider/clinical-record-access-requests`, { params: new HttpParams().set('page', page).set('limit', limit) });
  }

  listPatientAccessRequests(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordAccessPage<ClinicalRecordAccessRequest>>(`${this.base}/me/clinical-record-access-requests`, { params: new HttpParams().set('page', page).set('limit', limit) });
  }

  approveAccessRequest(reference: string) {
    return this.http.post<ClinicalRecordAccessRequest>(`${this.base}/me/clinical-record-access-requests/${encodeURIComponent(reference)}/approve`, null);
  }

  declineAccessRequest(reference: string) {
    return this.http.post<ClinicalRecordAccessRequest>(`${this.base}/me/clinical-record-access-requests/${encodeURIComponent(reference)}/decline`, null);
  }

  listShared(page = 1, limit = 20) {
    return this.http.get<ClinicalRecordAccessPage<SharedClinicalRecordSummary>>(`${this.base}/provider/shared-clinical-records`, { params: new HttpParams().set('page', page).set('limit', limit) });
  }

  getShared(reference: string) {
    return this.http.get<SharedClinicalRecord>(`${this.base}/provider/shared-clinical-records/${encodeURIComponent(reference)}`);
  }

  getSharedAttachmentAccess(recordReference: string, attachmentReference: string) {
    return this.http.get<ClinicalRecordAttachmentAccess>(`${this.base}/provider/shared-clinical-records/${encodeURIComponent(recordReference)}/attachments/${encodeURIComponent(attachmentReference)}/access`);
  }

  private providerEndpoint(reference: string) {
    return `${this.base}/provider/care-appointments/${encodeURIComponent(reference)}/clinical-record`;
  }

  private providerAttachments(recordReference: string) {
    return `${this.base}/provider/clinical-records/${encodeURIComponent(recordReference)}/attachments`;
  }
}
