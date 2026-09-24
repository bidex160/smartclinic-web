import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { PatientWalletView } from '../models/patient-wallet.model';
import { PaymentEmailRequest } from '../models/payment-email.model';

@Injectable({ providedIn: 'root' })
export class PatientWalletApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  mine() {
    return this.http.get<PatientWalletView>(`${this.base}/me/wallet`);
  }
  initializeTopUp(amountMinor: number, connectionReference?: string, request?: PaymentEmailRequest) {
    return this.http.post<WalletTopUpPayment>(`${this.base}/me/wallet/funding/initialize`, {
      amountMinor,
      connectionReference,
      ...(request ?? {}),
    });
  }
  verifyTopUp(reference: string) {
    return this.http.post<WalletTopUpPayment>(`${this.base}/me/wallet/funding/verify-latest`, null, {
      params: { reference },
    });
  }
}

export interface WalletTopUpPayment {
  readonly reference: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: 'PENDING' | 'PAID' | 'FAILED';
  readonly paid: boolean;
  readonly connectionReference: string | null;
  readonly attemptStatus: string | null;
  readonly checkoutUrl: string | null;
  readonly accessCode: string | null;
  readonly provider: string | null;
}
