import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { PartnerFacilityDirectoryPage, PartnerFacilityRequest, PartnerFacilityType } from '../models/partner-facility-directory.model';

@Injectable({ providedIn: 'root' })
export class PartnerFacilityDirectoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  directory(query: { q?: string; facilityType?: PartnerFacilityType | ''; stateOrRegion?: string; city?: string; page?: number; limit?: number; near?: { lat: number; lng: number } | null; verifiedOnly?: boolean }) {
    let params = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    for (const key of ['q', 'facilityType', 'stateOrRegion', 'city'] as const) {
      const value = query[key];
      if (value?.trim()) params = params.set(key, value.trim());
    }
    // Rounded to about 100 m: enough to sort by distance, and never stored.
    if (query.near) params = params.set('lat', query.near.lat.toFixed(3)).set('lng', query.near.lng.toFixed(3));
    if (query.verifiedOnly) params = params.set('verifiedOnly', 'true');
    return this.http.get<PartnerFacilityDirectoryPage>(`${this.base}/me/partner-facility-directory`, { params });
  }
  requestContact(id: string) {
    return this.http.post<{ accepted: boolean; alreadyRequested: boolean }>(`${this.base}/me/partner-facility-directory/${encodeURIComponent(id)}/interests`, { consentAcknowledged: true });
  }
  createRequest(id: string, requestType: 'APPOINTMENT' | 'REGISTRATION' | 'CONTACT', preferredAt?: string) {
    return this.http.post<{ accepted: boolean; reference: string; status: string; createdAt: string }>(`${this.base}/me/partner-facility-directory/${encodeURIComponent(id)}/requests`, { requestType, consentAcknowledged: true, ...(preferredAt ? { preferredAt } : {}) });
  }
  adminRequests() { return this.http.get<readonly PartnerFacilityRequest[]>(`${this.base}/admin/partner-facility-directory/requests`); }
  updateRequestStatus(id: string, status: 'CONTACTED' | 'BOOKED' | 'UNAVAILABLE' | 'CLOSED') { return this.http.patch(`${this.base}/admin/partner-facility-directory/requests/${encodeURIComponent(id)}`, { status }); }
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
