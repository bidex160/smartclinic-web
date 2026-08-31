import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import {
  HealthCheckCataloguePackage,
  HealthCheckConfigurationQuote,
  HealthCheckConfigurationQuoteRequest,
  HealthCheckPackage,
  HealthCheckProviderDiscoveryRequest,
  HealthCheckProviderDiscoveryResponse,
} from '../models/health-check-package.model';

@Injectable({ providedIn: 'root' })
export class HealthCheckPackagesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getPackages(): Observable<HealthCheckPackage[]> {
    return this.http.get<HealthCheckPackage[]>(`${this.apiConfig.baseUrl}/health-check-packages`);
  }

  getCatalogue(): Observable<HealthCheckCataloguePackage[]> {
    return this.http.get<HealthCheckCataloguePackage[]>(
      `${this.apiConfig.baseUrl}/health-check-packages/catalogue`,
    );
  }

  getConfigurationQuote(
    request: HealthCheckConfigurationQuoteRequest,
  ): Observable<HealthCheckConfigurationQuote> {
    return this.http.post<HealthCheckConfigurationQuote>(
      `${this.apiConfig.baseUrl}/health-check-packages/configuration-quote`,
      request,
    );
  }
  discoverProviders(
    request: HealthCheckProviderDiscoveryRequest,
  ): Observable<HealthCheckProviderDiscoveryResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(request))
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    return this.http.get<HealthCheckProviderDiscoveryResponse>(
      `${this.apiConfig.baseUrl}/health-check-packages/providers`,
      { params },
    );
  }
}
