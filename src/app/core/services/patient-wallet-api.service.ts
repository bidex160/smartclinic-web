import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { PatientWalletView } from '../models/patient-wallet.model';

@Injectable({ providedIn: 'root' })
export class PatientWalletApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  mine() {
    return this.http.get<PatientWalletView>(`${this.base}/me/wallet`);
  }
}
