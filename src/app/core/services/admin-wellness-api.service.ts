import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';

export type WellnessRedemptionStatus = 'RESERVED' | 'SETTLED' | 'RELEASED' | 'CANCELLED' | 'REFUNDED';

export interface WellnessSettings {
  readonly paused: boolean;
  readonly maxPercent: number;
  readonly minPoints: number;
  /** Major units per point, e.g. { NGN: "5.00" }. */
  readonly valuePerPoint: Readonly<Record<string, string>>;
}

export interface WellnessSummary {
  readonly settings: WellnessSettings;
  readonly redemptions: readonly { status: WellnessRedemptionStatus; currency: string; count: number; points: number; amount: string }[];
  readonly adjustments: { readonly count: number; readonly pointsAdded: number; readonly pointsRemoved: number };
}

export interface WellnessRedemptionRow {
  readonly bookingReference: string;
  readonly patientName: string | null;
  readonly points: number;
  readonly amount: string;
  readonly currency: string;
  readonly status: WellnessRedemptionStatus;
  readonly createdAt: string;
}

export interface WellnessPatient {
  readonly patientReference: string;
  readonly name: string;
  readonly wallet: { earnedPoints: number; adjustedPoints: number; usedPoints: number; availablePoints: number };
  readonly adjustments: readonly { points: number; reason: string; by: string | null; createdAt: string }[];
  readonly redemptions: readonly { bookingReference: string; points: number; amount: string; currency: string; status: WellnessRedemptionStatus; createdAt: string }[];
}

@Injectable({ providedIn: 'root' })
export class AdminWellnessApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/admin/wellness-points`;

  summary() {
    return this.http.get<WellnessSummary>(`${this.base}/summary`);
  }
  redemptions(status: WellnessRedemptionStatus | '' = '', page = 1) {
    return this.http.get<{ items: WellnessRedemptionRow[]; page: number; totalPages: number; total: number }>(`${this.base}/redemptions`, {
      params: { page: String(page), limit: '20', ...(status ? { status } : {}) },
    });
  }
  patient(reference: string) {
    return this.http.get<WellnessPatient>(`${this.base}/patients/${encodeURIComponent(reference)}`);
  }
  adjust(reference: string, points: number, reason: string) {
    return this.http.post<WellnessPatient>(`${this.base}/patients/${encodeURIComponent(reference)}/adjustments`, { points, reason });
  }
  updateSettings(patch: Partial<WellnessSettings>) {
    return this.http.patch<WellnessSettings>(`${this.base}/settings`, patch);
  }
}
