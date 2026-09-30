import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  Hmo,
  HmoCase,
  HmoEnrollmentLead,
  HmoFunnel,
  HmoPlan,
  PatientHmoCoverage,
} from '../models/hmo.model';
@Injectable({ providedIn: 'root' })
export class HmoApiService {
  private http = inject(HttpClient);
  private base = inject(API_CONFIG).baseUrl;
  mine(patientReference: string) {
    return this.http.get<PatientHmoCoverage[]>(
      `${this.base}/hmo/me/coverages/${encodeURIComponent(patientReference)}`,
    );
  }
  addMine(patientReference: string, d: any) {
    return this.http.post<PatientHmoCoverage>(
      `${this.base}/hmo/me/coverages/${encodeURIComponent(patientReference)}`,
      d,
    );
  }
  createEnrollmentLead(
    patientReference: string,
    d: { preferredHmoId?: string; planId?: string; employerOrganisation?: string; notes?: string; consentAcknowledged: boolean },
  ) {
    return this.http.post<HmoEnrollmentLead>(
      `${this.base}/hmo/me/enrollment-leads/${encodeURIComponent(patientReference)}`,
      d,
    );
  }
  selectEncounter(reference: string, coverageId: string) {
    return this.http.post<any>(
      `${this.base}/hmo/me/encounters/${encodeURIComponent(reference)}/select`,
      { coverageId },
    );
  }
  encounter(reference: string) {
    return this.http.get<any>(`${this.base}/hmo/me/encounters/${encodeURIComponent(reference)}`);
  }
  useSelfPay(reference: string) {
    return this.http.post<any>(
      `${this.base}/hmo/me/encounters/${encodeURIComponent(reference)}/self-pay`,
      {},
    );
  }
  listHmos() {
    return this.http.get<Hmo[]>(`${this.base}/hmo`);
  }
  listPlans(hmoId?: string) {
    let params = new HttpParams();
    if (hmoId) params = params.set('hmoId', hmoId);
    return this.http.get<HmoPlan[]>(`${this.base}/hmo/plans`, { params });
  }
  coverages(patientId: string) {
    return this.http.get<PatientHmoCoverage[]>(`${this.base}/hmo/admin/coverages`, {
      params: new HttpParams().set('patientId', patientId),
    });
  }
  addCoverage(d: any) {
    return this.http.post<PatientHmoCoverage>(`${this.base}/hmo/admin/coverages`, d);
  }
  desk() {
    return this.http.get<HmoCase[]>(`${this.base}/hmo/admin/desk`);
  }
  funnel() {
    return this.http.get<HmoFunnel>(`${this.base}/hmo/admin/funnel`);
  }
  enrollmentLeads() { return this.http.get<readonly HmoEnrollmentLead[]>(`${this.base}/hmo/admin/enrollment-leads`); }
  updateEnrollmentLead(id: string, status: 'CONTACTED' | 'CLOSED') { return this.http.patch(`${this.base}/hmo/admin/enrollment-leads/${encodeURIComponent(id)}`, { status }); }
  verify(ref: string, d: any) {
    return this.http.post(`${this.base}/hmo/admin/cases/${encodeURIComponent(ref)}/eligibility`, d);
  }
  submitClaim(ref: string, d: any) {
    return this.http.post(`${this.base}/hmo/admin/claims/${encodeURIComponent(ref)}/submit`, d);
  }
  recordClaimPayment(ref: string, d: any) {
    return this.http.post(`${this.base}/hmo/admin/claims/${encodeURIComponent(ref)}/payment`, d);
  }
  reconcileClaim(ref: string, d: any) {
    return this.http.post(`${this.base}/hmo/admin/claims/${encodeURIComponent(ref)}/reconcile`, d);
  }
  requestAuthorization(ref: string, d: any) {
    return this.http.post(
      `${this.base}/hmo/admin/cases/${encodeURIComponent(ref)}/authorizations`,
      d,
    );
  }
}
