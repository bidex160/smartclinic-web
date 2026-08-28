import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  CreateProviderCareServiceOffering,
  ProviderCareServiceDefinition,
  ProviderCareServiceOffering,
  UpdateProviderCareServiceOffering,
} from '../models/find-care.model';

@Injectable({ providedIn: 'root' })
export class ProviderCareServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/provider/care-services`;
  getCatalogue() {
    return this.http.get<readonly ProviderCareServiceDefinition[]>(`${this.base}/catalogue`);
  }
  getOfferings() {
    return this.http.get<readonly ProviderCareServiceOffering[]>(this.base);
  }
  create(body: CreateProviderCareServiceOffering) {
    return this.http.post<ProviderCareServiceOffering>(this.base, body);
  }
  update(id: string, body: UpdateProviderCareServiceOffering) {
    return this.http.patch<ProviderCareServiceOffering>(
      `${this.base}/${encodeURIComponent(id)}`,
      body,
    );
  }
  setActive(id: string, active: boolean) {
    return this.http.patch<ProviderCareServiceOffering>(
      `${this.base}/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
}
