import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';

export interface Specialty {
  readonly code: string;
  readonly name: string;
  readonly group: string | null;
}

export interface RegulatorOption {
  readonly code: string;
  readonly name: string;
}

export type CredentialStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type CredentialBlocker = 'SPECIALTY_MISSING' | 'LICENCE_MISSING' | 'LICENCE_NOT_VERIFIED' | string;

export interface ProviderCredentialsView {
  readonly providerType: string;
  readonly specialtyRequired: boolean;
  readonly maxSpecialties: number;
  readonly specialties: readonly { code: string; name: string; isPrimary: boolean }[];
  readonly regulators: readonly RegulatorOption[];
  readonly credential: {
    readonly regulator: string;
    readonly licenceNumber: string;
    readonly status: CredentialStatus;
    readonly hasDocument: boolean;
    readonly submittedAt: string;
    readonly verifiedAt: string | null;
    readonly message: string | null;
  } | null;
  readonly verified: boolean;
  readonly uploadsAvailable: boolean;
  readonly blockers: readonly CredentialBlocker[];
}

export interface AdminCredentialsView extends ProviderCredentialsView {
  readonly documentUrl: string | null;
  readonly checkUrl: string | null;
  readonly checkedVia: string | null;
  readonly reviewNote: string | null;
}

/** Plain words for each status, for providers and staff. */
export const CREDENTIAL_STATUS_LABEL: Record<CredentialStatus, string> = {
  NOT_SUBMITTED: 'Not added yet',
  SUBMITTED: 'Waiting for our check',
  VERIFIED: 'Verified',
  REJECTED: 'Needs your attention',
};

@Injectable({ providedIn: 'root' })
export class ProviderCredentialsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  specialties() {
    return this.http.get<readonly Specialty[]>(`${this.base}/public/provider-directory/specialties`);
  }
  regulators(countryCode?: string | null, providerType?: string | null) {
    const params: Record<string, string> = {};
    if (countryCode && /^[A-Z]{2}$/.test(countryCode)) params['countryCode'] = countryCode;
    if (providerType) params['providerType'] = providerType;
    return this.http.get<readonly RegulatorOption[]>(`${this.base}/public/provider-directory/regulators`, { params });
  }
  mine() {
    return this.http.get<ProviderCredentialsView>(`${this.base}/provider/credentials`);
  }
  setSpecialties(codes: readonly string[], primary: string | null) {
    return this.http.put<ProviderCredentialsView>(`${this.base}/provider/credentials/specialties`, { codes, ...(primary ? { primary } : {}) });
  }
  setLicence(regulator: string, licenceNumber: string) {
    return this.http.put<ProviderCredentialsView>(`${this.base}/provider/credentials/licence`, { regulator, licenceNumber });
  }
  uploadDocument(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ProviderCredentialsView>(`${this.base}/provider/credentials/licence/document`, form);
  }
  adminGet(providerId: string) {
    return this.http.get<AdminCredentialsView>(`${this.base}/admin/providers/${providerId}/credentials`);
  }
  verify(providerId: string, checkedVia: string, note?: string) {
    return this.http.post<AdminCredentialsView>(`${this.base}/admin/providers/${providerId}/credentials/verify`, { checkedVia, ...(note ? { note } : {}) });
  }
  reject(providerId: string, reason: string) {
    return this.http.post<AdminCredentialsView>(`${this.base}/admin/providers/${providerId}/credentials/reject`, { reason });
  }
}
