import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
export interface PartnerFamilySummary {
  familyId: string;
  partner: { id: string; name: string; type: string };
  program: {
    id: string;
    name: string;
    partnerBps: number;
    wellnessCreditBps: number;
    currency: string;
  } | null;
  nextWellnessAt: string | null;
  wellnessCreditMinor: string;
  currency: string;
}
@Injectable({ providedIn: 'root' })
export class PartnerApiService {
  private http = inject(HttpClient);
  private base = inject(API_CONFIG).baseUrl;
  invitation(token: string) {
    return this.http.get<any>(`${this.base}/partners/invitations/${encodeURIComponent(token)}`);
  }
  activate(token: string, consentVersion: string) {
    return this.http.post<any>(
      `${this.base}/partners/me/invitations/${encodeURIComponent(token)}/activate`,
      { consentVersion },
    );
  }
  listPartners() {
    return this.http.get<any[]>(`${this.base}/partners/admin`);
  }
  programsForPartner(id: string) {
    return this.http.get<any[]>(`${this.base}/partners/admin/${id}/programs`);
  }
  createPartner(d: any) {
    return this.http.post<any>(`${this.base}/partners/admin`, d);
  }
  activatePartner(id: string) {
    return this.http.post<any>(`${this.base}/partners/admin/${id}/activate`, {});
  }
  createProgram(d: any) {
    return this.http.post<any>(`${this.base}/partners/admin/programs`, d);
  }
  invite(d: any) {
    return this.http.post<any>(`${this.base}/partners/admin/invitations`, d);
  }
  familyHome() {
    return this.http.get<PartnerFamilySummary[]>(`${this.base}/partners/me/families`);
  }
  recordWellness(d: any) {
    return this.http.post<any>(`${this.base}/partners/me/wellness`, d);
  }
  dashboard(id: string) {
    return this.http.get<any>(`${this.base}/partners/admin/${id}/dashboard`);
  }
}
