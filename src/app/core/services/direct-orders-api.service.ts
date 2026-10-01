import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { CreateDirectOrderRequest, DirectOrder, DirectOrderPatient } from '../models/direct-order.model';
import { ClinicalOrderPage } from '../models/pharmacy-fulfillment.model';

/** Prescriptions and test requests sent by SmartClinic ID, outside a SmartClinic appointment. */
@Injectable({ providedIn: 'root' })
export class DirectOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  lookupPatient(patientReference: string) {
    return this.http.get<DirectOrderPatient>(`${this.base}/provider/direct-orders/patient-lookup`, {
      params: new HttpParams().set('patientReference', patientReference),
    });
  }

  send(request: CreateDirectOrderRequest) {
    return this.http.post<DirectOrder>(`${this.base}/provider/direct-orders`, request);
  }

  listSent(page = 1, limit = 20) {
    return this.http.get<ClinicalOrderPage>(`${this.base}/provider/direct-orders`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }

  cancel(reference: string, reason: string | null = null) {
    return this.http.post<DirectOrder>(`${this.base}/provider/clinical-orders/${encodeURIComponent(reference)}/cancel`, { reason });
  }

  /** All of the patient's current requests, any type. */
  listMine(limit = 50) {
    return this.http.get<ClinicalOrderPage>(`${this.base}/me/clinical-orders`, {
      params: new HttpParams().set('page', 1).set('limit', limit),
    });
  }

  approve(reference: string) {
    return this.http.post<DirectOrder>(`${this.base}/me/clinical-orders/${encodeURIComponent(reference)}/approve`, {});
  }

  decline(reference: string) {
    return this.http.post<DirectOrder>(`${this.base}/me/clinical-orders/${encodeURIComponent(reference)}/decline`, {});
  }
}
