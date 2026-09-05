import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  GuidedSelfCheck,
  GuidedSelfCheckAnswerState,
  GuidedSelfCheckDetail,
  GuidedSelfCheckFunding,
  GuidedSelfCheckList,
  GuidedSelfCheckProduct,
  GuidedSelfCheckQuestionnaire,
  GuidedSelfCheckValue,
} from '../models/guided-self-check.model';
@Injectable({ providedIn: 'root' })
export class GuidedSelfChecksApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  product() {
    return this.http.get<GuidedSelfCheckProduct>(`${this.base}/guided-self-check/product`);
  }
  create() {
    return this.http.post<GuidedSelfCheck>(`${this.base}/me/guided-self-checks`, {});
  }
  list() {
    return this.http.get<GuidedSelfCheckList>(`${this.base}/me/guided-self-checks`);
  }
  get(reference: string) {
    return this.http.get<GuidedSelfCheckDetail>(`${this.base}/me/guided-self-checks/${reference}`);
  }
  funding(reference: string) {
    return this.http.get<GuidedSelfCheckFunding>(
      `${this.base}/me/guided-self-checks/${reference}/funding`,
    );
  }
  initializeFunding(reference: string, request?: import('../models/payment-email.model').PaymentEmailRequest) {
    return this.http.post<GuidedSelfCheckFunding>(
      `${this.base}/me/guided-self-checks/${reference}/funding/initialize`,
      request ?? {},
    );
  }
  verifyFunding(reference: string) {
    return this.http.post<GuidedSelfCheckFunding>(
      `${this.base}/me/guided-self-checks/${reference}/funding/verify-latest`,
      {},
    );
  }
  start(reference: string) {
    return this.http.post<GuidedSelfCheckQuestionnaire>(
      `${this.base}/me/guided-self-checks/${reference}/start`,
      {},
    );
  }
  questionnaire(reference: string) {
    return this.http.get<GuidedSelfCheckQuestionnaire>(
      `${this.base}/me/guided-self-checks/${reference}/questionnaire`,
    );
  }
  saveAnswer(
    reference: string,
    key: string,
    payload: { state: GuidedSelfCheckAnswerState; value?: GuidedSelfCheckValue },
  ) {
    return this.http.put<GuidedSelfCheckQuestionnaire>(
      `${this.base}/me/guided-self-checks/${reference}/answers/${encodeURIComponent(key)}`,
      payload,
    );
  }
  complete(reference: string) {
    return this.http.post<GuidedSelfCheckQuestionnaire & GuidedSelfCheckDetail>(
      `${this.base}/me/guided-self-checks/${reference}/complete`,
      {},
    );
  }
}
