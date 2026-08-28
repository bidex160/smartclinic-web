import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import {
  CareServiceDefinition,
  FindCareProviderFilters,
  PublicFindCareProvider,
  PublicFindCareProviderPage,
} from '../models/find-care.model';

@Injectable({ providedIn: 'root' })
export class FindCareApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;
  getServices(): Observable<readonly CareServiceDefinition[]> {
    return this.http.get<readonly CareServiceDefinition[]>(
      `${this.base}/public/find-care/services`,
    );
  }
  getProviders(filters: FindCareProviderFilters): Observable<PublicFindCareProviderPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<PublicFindCareProviderPage>(`${this.base}/public/find-care/providers`, {
      params,
    });
  }
  getProvider(reference: string): Observable<PublicFindCareProvider> {
    return this.http.get<PublicFindCareProvider>(
      `${this.base}/public/find-care/providers/${encodeURIComponent(reference)}`,
    );
  }
}
