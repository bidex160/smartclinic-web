import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';

export interface ProviderReferralSummary {
  referralCode: string;

  links: {
    PATIENT: string;
    CLINIC: string;
    HOSPITAL: string;
    LABORATORY: string;
    PHARMACY: string;
    INDIVIDUAL: string;
  };

  availablePoints: number;
  reservedPoints: number;
}

@Injectable({ providedIn: 'root' })
export class ProviderReferralsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/provider`;

  getSummary(): Observable<ProviderReferralSummary> {
    return this.http.get<ProviderReferralSummary>(this.base + '/referrals');
  }
}
