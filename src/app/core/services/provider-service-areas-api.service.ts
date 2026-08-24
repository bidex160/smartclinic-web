import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import {
  ProviderServiceArea,
  ProviderServiceAreaRequest,
} from '../models/provider-service-area.model';

@Injectable({ providedIn: 'root' })
export class ProviderServiceAreasApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  private readonly noReplay = { context: new HttpContext().set(SKIP_AUTH_RETRY, true) };

  listOwn(): Observable<ProviderServiceArea[]> {
    return this.http.get<ProviderServiceArea[]>(`${this.base}/provider/service-areas`);
  }
  listForAdmin(providerId: string): Observable<ProviderServiceArea[]> {
    return this.http.get<ProviderServiceArea[]>(
      `${this.base}/admin/providers/${encodeURIComponent(providerId)}/service-areas`,
    );
  }
  create(request: ProviderServiceAreaRequest): Observable<ProviderServiceArea> {
    return this.http.post<ProviderServiceArea>(
      `${this.base}/provider/service-areas`,
      request,
      this.noReplay,
    );
  }
  update(id: string, request: ProviderServiceAreaRequest): Observable<ProviderServiceArea> {
    return this.http.patch<ProviderServiceArea>(
      `${this.base}/provider/service-areas/${encodeURIComponent(id)}`,
      request,
      this.noReplay,
    );
  }
  setActive(id: string, active: boolean): Observable<ProviderServiceArea> {
    return this.http.patch<ProviderServiceArea>(
      `${this.base}/provider/service-areas/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
      this.noReplay,
    );
  }
}
