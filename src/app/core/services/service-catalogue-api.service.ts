import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import { SmartClinicCatalogueCategory, SmartClinicServiceCatalogueItem } from '../models/service-catalogue.model';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogueApiService {
  private readonly http=inject(HttpClient); private readonly base=inject(API_CONFIG).baseUrl;
  list(category: SmartClinicCatalogueCategory, q='') {
    return this.http.get<readonly SmartClinicServiceCatalogueItem[]>(`${this.base}/me/service-catalogue`, { params: { category, ...(q.trim()?{q:q.trim()}:{}) } });
  }
  providerList(category: SmartClinicCatalogueCategory) {
    return this.http.get<readonly SmartClinicServiceCatalogueItem[]>(`${this.base}/provider/service-catalogue`, { params: { category } });
  }
}
