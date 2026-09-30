import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { PartnerFacilityDirectoryPage, PartnerFacilityType } from '../models/partner-facility-directory.model';

@Injectable({ providedIn: 'root' })
export class PartnerFacilityDirectoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  directory(query: { q?: string; facilityType?: PartnerFacilityType | ''; stateOrRegion?: string; city?: string; page?: number; limit?: number }) {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    for (const key of ['q', 'facilityType', 'stateOrRegion', 'city'] as const) {
      const value = query[key];
      if (value?.trim()) params = params.set(key, value.trim());
    }
    return this.http.get<PartnerFacilityDirectoryPage>(`${this.base}/me/partner-facility-directory`, { params });
  }
  requestContact(id: string) {
    return this.http.post<{ accepted: boolean; alreadyRequested: boolean }>(`${this.base}/me/partner-facility-directory/${encodeURIComponent(id)}/interests`, { consentAcknowledged: true });
  }
  adminDemand() {
    return this.http.get<readonly PartnerFacilityDemandItem[]>(`${this.base}/admin/partner-facility-directory/demand`);
  }
  providerDemand() {
    return this.http.get<readonly PartnerFacilityDemandItem[]>(`${this.base}/provider/partner-facility-directory/demand`);
  }
}

export interface PartnerFacilityDemandItem {
  displayName: string;
  facilityType: PartnerFacilityType;
  stateOrRegion?: string | null;
  city?: string | null;
  interestedPatients: string | number;
  firstInterestAt?: string;
  latestInterestAt?: string;
}
