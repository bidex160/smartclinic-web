import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import {
  CreatePackagePriceRequest,
  PackagePrice,
  PackagePriceFilters,
} from '../models/package-price.model';

@Injectable({ providedIn: 'root' })
export class PackagePricesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly endpoint = `${this.apiConfig.baseUrl}/admin/package-prices`;

  getPackagePrices(filters: PackagePriceFilters = {}): Observable<PackagePrice[]> {
    let params = new HttpParams();
    if (filters.healthCheckPackageId)
      params = params.set('healthCheckPackageId', filters.healthCheckPackageId);
    if (filters.fulfilmentModeId) params = params.set('fulfilmentModeId', filters.fulfilmentModeId);
    if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive);
    return this.http.get<PackagePrice[]>(this.endpoint, { params });
  }

  createPackagePrice(request: CreatePackagePriceRequest): Observable<PackagePrice> {
    return this.http.post<PackagePrice>(this.endpoint, request);
  }

  schedulePackagePrice(request: CreatePackagePriceRequest): Observable<PackagePrice> {
    return this.http.post<PackagePrice>(`${this.endpoint}/schedule`, request);
  }

  deactivatePackagePrice(id: string): Observable<PackagePrice> {
    return this.http.patch<PackagePrice>(
      `${this.endpoint}/${encodeURIComponent(id)}/deactivate`,
      {},
    );
  }
}
