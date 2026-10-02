import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { ConnectedHospital, HospitalBillPayment, HospitalBillPaymentInitializationRequest, HospitalInvoice } from '../models/hospital-bill-payment.model';

@Injectable({ providedIn: 'root' })
export class HospitalBillPaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly path = `${inject(API_CONFIG).baseUrl}/me/hospital-bill-payments`;
  getHospitals(): Observable<readonly ConnectedHospital[]> { return this.http.get<readonly ConnectedHospital[]>(`${this.path}/hospitals`); }
  getInvoice(hospitalCode: string, invoiceReference: string): Observable<HospitalInvoice> {
    return this.http.get<HospitalInvoice>(`${this.path}/${encodeURIComponent(hospitalCode)}/invoice`, { params: new HttpParams().set('invoiceReference', invoiceReference) });
  }
  initializePayment(request: HospitalBillPaymentInitializationRequest): Observable<HospitalBillPayment> { return this.http.post<HospitalBillPayment>(this.path, request); }
  verifyPayment(reference: string): Observable<HospitalBillPayment> { return this.http.post<HospitalBillPayment>(`${this.path}/${encodeURIComponent(reference)}/verify`, null); }
}
