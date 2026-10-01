import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  ConnectedHospital,
  HospitalBillPayment,
  HospitalBillPaymentInitializationRequest,
  HospitalInvoice,
} from '../models/hospital-bill-payment.model';

@Injectable({ providedIn: 'root' })
export class HospitalBillPaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  private readonly path = `${this.base}/me/hospital-bill-payments`;

  getHospitals(): Observable<readonly ConnectedHospital[]> {
    return this.http.get<readonly ConnectedHospital[]>(`${this.path}/hospitals`);
  }

  getInvoice(hospitalCode: string): Observable<HospitalInvoice> {
    return this.http.get<HospitalInvoice>(
      `${this.path}/${encodeURIComponent(hospitalCode)}/invoice`,
    );
  }

  initializePayment(
    request: HospitalBillPaymentInitializationRequest,
  ): Observable<HospitalBillPayment> {
    return this.http.post<HospitalBillPayment>(this.path, request);
  }

  verifyPayment(reference: string): Observable<HospitalBillPayment> {
    return this.http.post<HospitalBillPayment>(
      `${this.path}/${encodeURIComponent(reference)}/verify`,
      null,
    );
  }
}
