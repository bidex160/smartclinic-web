import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  ClinicalOrder,
  ClinicalOrderPage,
  FulfillmentDirectoryPage,
  PatientOrderFulfillment,
  PharmacyFundingResponse,
  PharmacyQuote,
  ProviderOrderFulfillment,
  ProviderOrderFulfillmentPage,
  ProviderServiceUnit,
  ProviderServiceUnitPage,
  ProviderServiceUnitType,
  UpsertPharmacyQuoteRequest,
  UpsertPrescriptionRequest,
  UpsertProviderServiceUnitRequest,
} from '../models/pharmacy-fulfillment.model';

@Injectable({ providedIn: 'root' })
export class PharmacyFulfillmentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  private enc(v: string) {
    return encodeURIComponent(v);
  }
  listAppointmentOrders(appointment: string) {
    return this.http.get<ClinicalOrderPage>(
      `${this.base}/provider/care-appointments/${this.enc(appointment)}/clinical-orders`,
    );
  }
  createPrescription(appointment: string, body: UpsertPrescriptionRequest) {
    return this.http.post<ClinicalOrder>(
      `${this.base}/provider/care-appointments/${this.enc(appointment)}/clinical-orders/prescriptions`,
      body,
    );
  }
  getProviderOrder(ref: string) {
    return this.http.get<ClinicalOrder>(`${this.base}/provider/clinical-orders/${this.enc(ref)}`);
  }
  updatePrescription(ref: string, body: UpsertPrescriptionRequest) {
    return this.http.patch<ClinicalOrder>(
      `${this.base}/provider/clinical-orders/${this.enc(ref)}`,
      body,
    );
  }
  issuePrescription(ref: string) {
    return this.http.post<ClinicalOrder>(
      `${this.base}/provider/clinical-orders/${this.enc(ref)}/issue`,
      null,
    );
  }
  cancelPrescription(ref: string, reason?: string) {
    return this.http.post<ClinicalOrder>(
      `${this.base}/provider/clinical-orders/${this.enc(ref)}/cancel`,
      { reason: reason || null },
    );
  }
  recommendPharmacy(ref: string, providerServiceUnitReference: string) {
    return this.http.post(
      `${this.base}/provider/clinical-orders/${this.enc(ref)}/recommend-fulfillment`,
      { providerServiceUnitReference },
    );
  }
  listPatientOrders(page = 1, limit = 20) {
    return this.http.get<ClinicalOrderPage>(`${this.base}/me/clinical-orders`, {
      params: new HttpParams().set('type', 'PRESCRIPTION').set('page', page).set('limit', limit),
    });
  }
  getPatientOrder(ref: string) {
    return this.http.get<ClinicalOrder>(`${this.base}/me/clinical-orders/${this.enc(ref)}`);
  }
  searchPharmacies(query: {
    q?: string;
    country?: string;
    stateOrRegion?: string;
    city?: string;
    page?: number;
    limit?: number;
  }) {
    let p = new HttpParams().set('page', query.page ?? 1).set('limit', query.limit ?? 20);
    for (const [k, v] of Object.entries(query))
      if (v !== undefined && v !== '') p = p.set(k, String(v));
    return this.http.get<FulfillmentDirectoryPage>(
      `${this.base}/me/clinical-order-fulfillment-providers`,
      { params: p },
    );
  }
  selectPharmacy(orderRef: string, providerServiceUnitReference: string) {
    return this.http.post(
      `${this.base}/me/clinical-orders/${this.enc(orderRef)}/select-fulfillment`,
      { providerServiceUnitReference },
    );
  }
  listFulfillments(page = 1, limit = 20) {
    return this.http.get<ProviderOrderFulfillmentPage>(`${this.base}/provider/order-fulfillments`, {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  getFulfillment(ref: string) {
    return this.http.get<ProviderOrderFulfillment>(
      `${this.base}/provider/order-fulfillments/${this.enc(ref)}`,
    );
  }
  acceptFulfillment(ref: string) {
    return this.http.post<ProviderOrderFulfillment>(
      `${this.base}/provider/order-fulfillments/${this.enc(ref)}/accept`,
      null,
    );
  }
  createQuote(ref: string, body: UpsertPharmacyQuoteRequest) {
    return this.http.post<PharmacyQuote>(
      `${this.base}/provider/order-fulfillments/${this.enc(ref)}/quotes`,
      body,
    );
  }
  listQuotes(ref: string) {
    return this.http.get<readonly PharmacyQuote[]>(
      `${this.base}/provider/order-fulfillments/${this.enc(ref)}/quotes`,
    );
  }
  getQuote(ref: string) {
    return this.http.get<PharmacyQuote>(`${this.base}/provider/pharmacy-quotes/${this.enc(ref)}`);
  }
  updateQuote(ref: string, body: UpsertPharmacyQuoteRequest) {
    return this.http.patch<PharmacyQuote>(
      `${this.base}/provider/pharmacy-quotes/${this.enc(ref)}`,
      body,
    );
  }
  submitQuote(ref: string) {
    return this.http.post<PharmacyQuote>(
      `${this.base}/provider/pharmacy-quotes/${this.enc(ref)}/submit`,
      null,
    );
  }
  getPatientFulfillment(ref: string) {
    return this.http.get<PatientOrderFulfillment>(
      `${this.base}/me/order-fulfillments/${this.enc(ref)}`,
    );
  }
  cancelPatientFulfillment(ref: string) {
    return this.http.post<PatientOrderFulfillment>(
      `${this.base}/me/order-fulfillments/${this.enc(ref)}/cancel`,
      null,
    );
  }
  acceptQuote(ref: string, acknowledgeUnavailableItems: boolean) {
    return this.http.post<PatientOrderFulfillment>(
      `${this.base}/me/pharmacy-quotes/${this.enc(ref)}/accept`,
      { acknowledgeUnavailableItems },
    );
  }
  getFunding(ref: string) {
    return this.http.get<PharmacyFundingResponse>(
      `${this.base}/me/pharmacy-quotes/${this.enc(ref)}/funding`,
    );
  }
  initializeFunding(ref: string, request?: import('../models/payment-email.model').PaymentEmailRequest) {
    return this.http.post<PharmacyFundingResponse>(
      `${this.base}/me/pharmacy-quotes/${this.enc(ref)}/funding/initialize`,
      request ?? null,
    );
  }
  verifyFunding(ref: string) {
    return this.http.post<PharmacyFundingResponse>(
      `${this.base}/me/pharmacy-quotes/${this.enc(ref)}/funding/verify-latest`,
      null,
    );
  }
  dispensing(
    ref: string,
    action: 'start-dispensing' | 'ready-for-pickup' | 'complete' | 'cannot-fulfill',
  ) {
    return this.http.post<PatientOrderFulfillment>(
      `${this.base}/provider/order-fulfillments/${this.enc(ref)}/${action}`,
      null,
    );
  }
  listServiceUnits(page = 1, limit = 20, type?: ProviderServiceUnitType) {
    let p = new HttpParams().set('page', page).set('limit', limit);
    if (type) p = p.set('type', type);
    return this.http.get<ProviderServiceUnitPage>(`${this.base}/provider/service-units`, {
      params: p,
    });
  }
  createServiceUnit(body: UpsertProviderServiceUnitRequest) {
    return this.http.post<ProviderServiceUnit>(`${this.base}/provider/service-units`, body);
  }
  updateServiceUnit(ref: string, body: Partial<UpsertProviderServiceUnitRequest>) {
    return this.http.patch<ProviderServiceUnit>(
      `${this.base}/provider/service-units/${this.enc(ref)}`,
      body,
    );
  }
  setServiceUnitActive(ref: string, active: boolean) {
    return this.http.post<ProviderServiceUnit>(
      `${this.base}/provider/service-units/${this.enc(ref)}/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }
}
