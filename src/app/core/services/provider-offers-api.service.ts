import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  DeclineProviderOfferRequest,
  ProviderOffer,
  ProviderOfferStatus,
} from '../models/provider-offer.model';

@Injectable({ providedIn: 'root' })
export class ProviderOffersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly endpoint = `${this.apiConfig.baseUrl}/provider/offers`;

  getOffers(status?: ProviderOfferStatus): Observable<ProviderOffer[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ProviderOffer[]>(this.endpoint, { params });
  }

  getOffer(assignmentId: string): Observable<ProviderOffer> {
    return this.http.get<ProviderOffer>(`${this.endpoint}/${encodeURIComponent(assignmentId)}`);
  }

  acceptOffer(assignmentId: string): Observable<ProviderOffer> {
    return this.http.post<ProviderOffer>(
      `${this.endpoint}/${encodeURIComponent(assignmentId)}/accept`,
      null,
      { context: new HttpContext().set(SKIP_AUTH_RETRY, true) },
    );
  }

  declineOffer(
    assignmentId: string,
    request: DeclineProviderOfferRequest,
  ): Observable<ProviderOffer> {
    return this.http.post<ProviderOffer>(
      `${this.endpoint}/${encodeURIComponent(assignmentId)}/decline`,
      request,
      { context: new HttpContext().set(SKIP_AUTH_RETRY, true) },
    );
  }
}
