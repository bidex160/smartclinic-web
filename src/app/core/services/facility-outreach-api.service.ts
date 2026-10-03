import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';

export type OutreachStage = 'LISTED' | 'CONTACTED' | 'CLAIMED' | 'VERIFIED' | 'LIVE' | 'DECLINED' | 'WRONG_CONTACT';
export type FacilityType = 'HOSPITAL' | 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY';

export const STAGE_LABELS: Record<OutreachStage, string> = {
  LISTED: 'Listed', CONTACTED: 'Contacted', CLAIMED: 'Claimed', VERIFIED: 'Licence checked', LIVE: 'Live', DECLINED: 'Declined', WRONG_CONTACT: 'Wrong contact',
};
export const FUNNEL: readonly OutreachStage[] = ['LISTED', 'CONTACTED', 'CLAIMED', 'VERIFIED', 'LIVE'];

export interface OutreachItem {
  readonly id: string;
  readonly displayName: string;
  readonly facilityType: FacilityType;
  readonly countryCode: string;
  readonly state: string | null;
  readonly city: string | null;
  readonly source: string;
  readonly stage: OutreachStage;
  readonly demand: number;
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly address: string | null;
  readonly contactName: string | null;
  readonly invitesSent: number;
  readonly lastContactAt: string | null;
  readonly hasClaimLink: boolean;
  readonly providerReference: string | null;
  readonly providerId: string | null;
  readonly nextAction: string;
}

export interface OutreachDashboard {
  readonly summary: Record<OutreachStage, number>;
  readonly total: number;
  readonly places: readonly { countryCode: string; state: string | null; city: string | null; demand: number; total: number; stages: Partial<Record<OutreachStage, number>> }[];
  readonly items: readonly OutreachItem[];
}

export interface OutreachFilters {
  countryCode?: string;
  stateOrRegion?: string;
  city?: string;
  facilityType?: FacilityType | '';
  stage?: OutreachStage | '';
  search?: string;
  page?: number;
}

export interface InviteResult {
  readonly sent: readonly string[];
  readonly claimUrl: string;
  readonly message: string;
  readonly whatsappUrl: string | null;
  readonly smsUrl: string | null;
  readonly automaticWhatsApp: boolean;
}

export interface ClaimPreview {
  readonly displayName: string;
  readonly facilityType: FacilityType;
  readonly providerType: string;
  readonly countryCode: string;
  readonly stateOrRegion: string | null;
  readonly city: string | null;
  readonly interestedPatients: number;
  readonly claimed: boolean;
}

export const IMPORT_TEMPLATE = 'name,type,country,state,city,address,phone,whatsapp,email,website,contact_name\n"Example General Hospital",hospital,NG,Lagos,Ikeja,"1 Example Road",0803 000 0000,0803 000 0000,info@example.com,example.com,Admin office\n';

@Injectable({ providedIn: 'root' })
export class FacilityOutreachApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}`;

  dashboard(f: OutreachFilters) {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '' && v !== null) params[k] = String(v);
    return this.http.get<OutreachDashboard>(`${this.base}/admin/facility-outreach`, { params });
  }
  importCsv(csv: string, countryCode?: string) {
    return this.http.post<{ created: number; updated: number; skipped: number; errors: readonly { row: number; message: string }[] }>(`${this.base}/admin/facility-outreach/import`, { csv, ...(countryCode ? { countryCode } : {}) });
  }
  updateContacts(id: string, contacts: Partial<Pick<OutreachItem, 'phone' | 'whatsapp' | 'email' | 'website' | 'address' | 'contactName'>>) {
    return this.http.patch(`${this.base}/admin/facility-outreach/${id}/contacts`, contacts);
  }
  claimLink(id: string, reset = false) {
    return this.http.post<{ url: string }>(`${this.base}/admin/facility-outreach/${id}/claim-link`, reset ? { reset: true } : {});
  }
  invite(id: string) {
    return this.http.post<InviteResult>(`${this.base}/admin/facility-outreach/${id}/invite`, {});
  }
  manualSent(id: string, channel: 'WHATSAPP' | 'SMS') {
    return this.http.post(`${this.base}/admin/facility-outreach/${id}/manual-sent`, { channel });
  }
  logContact(id: string, input: { kind: 'CALL' | 'VISIT' | 'NOTE'; outcome?: string; note?: string }) {
    return this.http.post(`${this.base}/admin/facility-outreach/${id}/contact-log`, input);
  }
  history(id: string) {
    return this.http.get<readonly { kind: string; note: string | null; at: string; by: string }[]>(`${this.base}/admin/facility-outreach/${id}/history`);
  }
  preview(token: string) {
    return this.http.get<ClaimPreview>(`${this.base}/public/facility-claims/${encodeURIComponent(token)}`);
  }
}
