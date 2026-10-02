import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

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

  /** Packages in ascending order of starting price, so the simplest check is always offered first. */
  getCatalogue(): Observable<HealthCheckCataloguePackage[]> {
    return this.http
      .get<HealthCheckCataloguePackage[]>(`${this.apiConfig.baseUrl}/health-check-packages/catalogue`)
      .pipe(map((items) => [...items].sort(byStartingPrice)));
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

/** Cheapest first; packages without a published price go last; ties keep a stable name order. */
export function byStartingPrice(a: HealthCheckCataloguePackage, b: HealthCheckCataloguePackage): number {
  if (a.fromPriceMinor !== b.fromPriceMinor) {
    if (a.fromPriceMinor === null) return 1;
    if (b.fromPriceMinor === null) return -1;
    return a.fromPriceMinor - b.fromPriceMinor;
  }
  return a.name.localeCompare(b.name);
}
